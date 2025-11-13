/**
 * Idempotency Manager for OPAL Event Processing
 *
 * This module provides idempotency tracking using Redis to prevent duplicate event processing
 * across distributed systems and ensure exactly-once delivery semantics.
 */

import Redis from 'ioredis';
import { getKafkaConfig } from '../kafka/config';

export interface IdempotencyRecord {
  eventId: string;
  processedAt: number;
  correlationId: string;
  source: string;
}

export class IdempotencyManager {
  private redis: Redis;
  private keyPrefix: string = 'opal:idempotency:';

  constructor() {
    const config = getKafkaConfig();

    this.redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        return err.message.includes(targetError);
      }
    });

    this.redis.on('connect', () => {
      console.log('✅ [Idempotency] Connected to Redis');
    });

    this.redis.on('error', (error) => {
      console.error('❌ [Idempotency] Redis connection error:', error);
    });
  }

  /**
   * Check if an event has already been processed
   */
  async isEventProcessed(idempotencyKey: string): Promise<boolean> {
    try {
      const key = this.getRedisKey(idempotencyKey);
      const exists = await this.redis.exists(key);
      return exists === 1;
    } catch (error) {
      console.error(`❌ [Idempotency] Failed to check event ${idempotencyKey}:`, error);
      // On Redis failure, assume not processed to avoid blocking
      return false;
    }
  }

  /**
   * Mark an event as processed
   */
  async markEventProcessed(
    idempotencyKey: string,
    ttlSeconds: number = 86400, // 24 hours default
    metadata?: Partial<IdempotencyRecord>
  ): Promise<void> {
    try {
      const key = this.getRedisKey(idempotencyKey);

      const record: IdempotencyRecord = {
        eventId: idempotencyKey,
        processedAt: Date.now(),
        correlationId: metadata?.correlationId || 'unknown',
        source: metadata?.source || 'unknown'
      };

      await this.redis.setex(key, ttlSeconds, JSON.stringify(record));

    } catch (error) {
      console.error(`❌ [Idempotency] Failed to mark event ${idempotencyKey} as processed:`, error);
      throw error;
    }
  }

  /**
   * Get processing record for an event
   */
  async getEventRecord(idempotencyKey: string): Promise<IdempotencyRecord | null> {
    try {
      const key = this.getRedisKey(idempotencyKey);
      const record = await this.redis.get(key);

      if (!record) {
        return null;
      }

      return JSON.parse(record);
    } catch (error) {
      console.error(`❌ [Idempotency] Failed to get record for ${idempotencyKey}:`, error);
      return null;
    }
  }

  /**
   * Remove idempotency record (use carefully)
   */
  async removeEventRecord(idempotencyKey: string): Promise<void> {
    try {
      const key = this.getRedisKey(idempotencyKey);
      await this.redis.del(key);
      console.log(`🗑️ [Idempotency] Removed record for ${idempotencyKey}`);
    } catch (error) {
      console.error(`❌ [Idempotency] Failed to remove record for ${idempotencyKey}:`, error);
      throw error;
    }
  }

  /**
   * Batch check for multiple events
   */
  async areEventsProcessed(idempotencyKeys: string[]): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    try {
      const keys = idempotencyKeys.map(key => this.getRedisKey(key));
      const pipeline = this.redis.pipeline();

      for (const key of keys) {
        pipeline.exists(key);
      }

      const pipelineResults = await pipeline.exec();

      if (pipelineResults) {
        idempotencyKeys.forEach((key, index) => {
          const result = pipelineResults[index];
          results.set(key, result && result[1] === 1);
        });
      }

    } catch (error) {
      console.error('❌ [Idempotency] Batch check failed:', error);
      // On failure, assume none processed to avoid blocking
      idempotencyKeys.forEach(key => results.set(key, false));
    }

    return results;
  }

  /**
   * Batch mark events as processed
   */
  async markEventsProcessed(
    events: Array<{
      idempotencyKey: string;
      ttlSeconds?: number;
      metadata?: Partial<IdempotencyRecord>;
    }>
  ): Promise<void> {
    try {
      const pipeline = this.redis.pipeline();

      for (const event of events) {
        const key = this.getRedisKey(event.idempotencyKey);
        const ttl = event.ttlSeconds || 86400;

        const record: IdempotencyRecord = {
          eventId: event.idempotencyKey,
          processedAt: Date.now(),
          correlationId: event.metadata?.correlationId || 'unknown',
          source: event.metadata?.source || 'unknown'
        };

        pipeline.setex(key, ttl, JSON.stringify(record));
      }

      await pipeline.exec();
      console.log(`✅ [Idempotency] Marked ${events.length} events as processed`);

    } catch (error) {
      console.error('❌ [Idempotency] Batch mark failed:', error);
      throw error;
    }
  }

  /**
   * Get statistics about idempotency keys
   */
  async getStatistics(): Promise<{
    totalKeys: number;
    keysByPattern: Record<string, number>;
    oldestKey: string | null;
    newestKey: string | null;
  }> {
    try {
      const pattern = `${this.keyPrefix}*`;
      const keys = await this.redis.keys(pattern);

      const stats = {
        totalKeys: keys.length,
        keysByPattern: {} as Record<string, number>,
        oldestKey: null as string | null,
        newestKey: null as string | null
      };

      if (keys.length === 0) {
        return stats;
      }

      // Group by pattern
      const patterns = ['workflow:', 'agent:', 'decision:', 'rag:', 'preferences:'];

      for (const pattern of patterns) {
        const patternKeys = keys.filter(key => key.includes(pattern));
        if (patternKeys.length > 0) {
          stats.keysByPattern[pattern] = patternKeys.length;
        }
      }

      // Get oldest and newest (approximate)
      const sampleKeys = keys.slice(0, Math.min(10, keys.length));
      const pipeline = this.redis.pipeline();

      for (const key of sampleKeys) {
        pipeline.get(key);
      }

      const results = await pipeline.exec();

      if (results) {
        let oldest = Date.now();
        let newest = 0;
        let oldestKey = '';
        let newestKey = '';

        results.forEach((result, index) => {
          if (result && result[1]) {
            try {
              const record = JSON.parse(result[1] as string);
              if (record.processedAt < oldest) {
                oldest = record.processedAt;
                oldestKey = sampleKeys[index];
              }
              if (record.processedAt > newest) {
                newest = record.processedAt;
                newestKey = sampleKeys[index];
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        });

        stats.oldestKey = oldestKey;
        stats.newestKey = newestKey;
      }

      return stats;

    } catch (error) {
      console.error('❌ [Idempotency] Failed to get statistics:', error);
      return {
        totalKeys: 0,
        keysByPattern: {},
        oldestKey: null,
        newestKey: null
      };
    }
  }

  /**
   * Clean up expired keys (Redis handles this automatically, but useful for monitoring)
   */
  async cleanupExpiredKeys(): Promise<number> {
    try {
      const pattern = `${this.keyPrefix}*`;
      const keys = await this.redis.keys(pattern);

      if (keys.length === 0) {
        return 0;
      }

      // Check TTL for each key
      const pipeline = this.redis.pipeline();
      for (const key of keys) {
        pipeline.ttl(key);
      }

      const results = await pipeline.exec();

      if (!results) {
        return 0;
      }

      // Count keys with no TTL or very short TTL
      let expiredCount = 0;
      results.forEach((result) => {
        if (result && result[1] as number <= 0) {
          expiredCount++;
        }
      });

      return expiredCount;

    } catch (error) {
      console.error('❌ [Idempotency] Failed to check expired keys:', error);
      return 0;
    }
  }

  /**
   * Health check for Redis connection
   */
  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      const testKey = `${this.keyPrefix}healthcheck`;
      const testValue = Date.now().toString();

      // Test write
      await this.redis.setex(testKey, 10, testValue);

      // Test read
      const retrieved = await this.redis.get(testKey);

      // Clean up
      await this.redis.del(testKey);

      if (retrieved === testValue) {
        return {
          status: 'healthy',
          details: {
            connected: true,
            latency: Date.now() - parseInt(testValue)
          }
        };
      } else {
        return {
          status: 'degraded',
          details: {
            connected: true,
            issue: 'Read/write test failed'
          }
        };
      }

    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    try {
      await this.redis.disconnect();
      console.log('✅ [Idempotency] Disconnected from Redis');
    } catch (error) {
      console.error('❌ [Idempotency] Error disconnecting from Redis:', error);
    }
  }

  /**
   * Generate Redis key with prefix
   */
  private getRedisKey(idempotencyKey: string): string {
    return `${this.keyPrefix}${idempotencyKey}`;
  }
}

// Singleton instance for reuse
let idempotencyInstance: IdempotencyManager | null = null;

export function getIdempotencyManager(): IdempotencyManager {
  if (!idempotencyInstance) {
    idempotencyInstance = new IdempotencyManager();
  }
  return idempotencyInstance;
}