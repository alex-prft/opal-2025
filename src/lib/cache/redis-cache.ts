/**
 * Redis Cache Implementation for OPAL Mapping System
 * High-performance caching layer with TTL management and invalidation patterns
 */

import Redis from 'ioredis';
import { ConsolidatedOpalMapping, MappingType } from '@/lib/schemas/consolidated-mapping-schema';

interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  keyPrefix: string;
  defaultTTL: number;
  maxRetries: number;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  lastUpdated: string;
}

class RedisCache {
  private client: Redis;
  private config: CacheConfig;
  private metrics: CacheMetrics;
  private isConnected: boolean = false;

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      keyPrefix: process.env.REDIS_KEY_PREFIX || 'opal:',
      defaultTTL: parseInt(process.env.CACHE_DEFAULT_TTL || '3600'), // 1 hour
      maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '3'),
      ...config
    };

    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      lastUpdated: new Date().toISOString()
    };

    this.initializeClient();
  }

  private initializeClient(): void {
    try {
      this.client = new Redis({
        host: this.config.host,
        port: this.config.port,
        password: this.config.password,
        keyPrefix: this.config.keyPrefix,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: this.config.maxRetries,
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: 10000,
        commandTimeout: 5000,
        retryDelayOnClusterDown: 300,
        retryDelayOnConcurrentModification: 100,
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        console.log('[Cache] Redis connected successfully');
      });

      this.client.on('error', (error) => {
        this.isConnected = false;
        this.metrics.errors++;
        console.error('[Cache] Redis connection error:', error.message);
      });

      this.client.on('close', () => {
        this.isConnected = false;
        console.log('[Cache] Redis connection closed');
      });

    } catch (error) {
      console.error('[Cache] Failed to initialize Redis client:', error);
      this.isConnected = false;
    }
  }

  /**
   * Get cached mapping configuration
   */
  async getMappingConfig(mappingType: MappingType): Promise<ConsolidatedOpalMapping | null> {
    if (!this.isConnected) return null;

    const key = `mapping:${mappingType}`;
    const startTime = performance.now();

    try {
      const cached = await this.client.get(key);
      const duration = performance.now() - startTime;

      if (cached) {
        this.metrics.hits++;
        console.log(`[Cache] HIT for ${key} (${duration.toFixed(2)}ms)`);
        return JSON.parse(cached);
      } else {
        this.metrics.misses++;
        console.log(`[Cache] MISS for ${key} (${duration.toFixed(2)}ms)`);
        return null;
      }
    } catch (error) {
      this.metrics.errors++;
      console.error(`[Cache] Error getting ${key}:`, error);
      return null;
    }
  }

  /**
   * Cache mapping configuration with TTL
   */
  async setMappingConfig(
    mappingType: MappingType,
    mapping: ConsolidatedOpalMapping,
    ttl?: number
  ): Promise<boolean> {
    if (!this.isConnected) return false;

    const key = `mapping:${mappingType}`;
    const cacheTTL = ttl || this.config.defaultTTL;
    const startTime = performance.now();

    try {
      await this.client.setex(key, cacheTTL, JSON.stringify(mapping));

      const duration = performance.now() - startTime;
      this.metrics.sets++;
      this.metrics.lastUpdated = new Date().toISOString();

      console.log(`[Cache] SET ${key} with TTL ${cacheTTL}s (${duration.toFixed(2)}ms)`);
      return true;
    } catch (error) {
      this.metrics.errors++;
      console.error(`[Cache] Error setting ${key}:`, error);
      return false;
    }
  }

  /**
   * Get cached optimization metrics
   */
  async getOptimizationMetrics(domain: string, timeframe?: string): Promise<any | null> {
    if (!this.isConnected) return null;

    const key = `metrics:${domain}:${timeframe || 'default'}`;

    try {
      const cached = await this.client.get(key);
      if (cached) {
        this.metrics.hits++;
        return JSON.parse(cached);
      } else {
        this.metrics.misses++;
        return null;
      }
    } catch (error) {
      this.metrics.errors++;
      console.error(`[Cache] Error getting metrics ${key}:`, error);
      return null;
    }
  }

  /**
   * Cache optimization metrics
   */
  async setOptimizationMetrics(
    domain: string,
    metrics: any,
    timeframe?: string,
    ttl?: number
  ): Promise<boolean> {
    if (!this.isConnected) return false;

    const key = `metrics:${domain}:${timeframe || 'default'}`;
    const cacheTTL = ttl || 300; // 5 minutes for metrics

    try {
      await this.client.setex(key, cacheTTL, JSON.stringify(metrics));
      this.metrics.sets++;
      return true;
    } catch (error) {
      this.metrics.errors++;
      console.error(`[Cache] Error setting metrics ${key}:`, error);
      return false;
    }
  }

  /**
   * Cache personalization rules with pattern support
   */
  async getPersonalizationRules(mappingType?: MappingType): Promise<any[] | null> {
    if (!this.isConnected) return null;

    const key = mappingType ? `rules:${mappingType}` : 'rules:global';

    try {
      const cached = await this.client.get(key);
      if (cached) {
        this.metrics.hits++;
        return JSON.parse(cached);
      } else {
        this.metrics.misses++;
        return null;
      }
    } catch (error) {
      this.metrics.errors++;
      console.error(`[Cache] Error getting rules ${key}:`, error);
      return null;
    }
  }

  /**
   * Cache personalization rules
   */
  async setPersonalizationRules(
    rules: any[],
    mappingType?: MappingType,
    ttl?: number
  ): Promise<boolean> {
    if (!this.isConnected) return false;

    const key = mappingType ? `rules:${mappingType}` : 'rules:global';
    const cacheTTL = ttl || 1800; // 30 minutes for rules

    try {
      await this.client.setex(key, cacheTTL, JSON.stringify(rules));
      this.metrics.sets++;
      return true;
    } catch (error) {
      this.metrics.errors++;
      console.error(`[Cache] Error setting rules ${key}:`, error);
      return false;
    }
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    if (!this.isConnected) return 0;

    try {
      const keys = await this.client.keys(`${this.config.keyPrefix}${pattern}`);
      if (keys.length > 0) {
        // Remove prefix from keys since ioredis adds it automatically
        const keysWithoutPrefix = keys.map(key => key.replace(this.config.keyPrefix, ''));
        const deleted = await this.client.del(...keysWithoutPrefix);
        this.metrics.deletes += deleted;
        console.log(`[Cache] Invalidated ${deleted} keys matching pattern: ${pattern}`);
        return deleted;
      }
      return 0;
    } catch (error) {
      this.metrics.errors++;
      console.error(`[Cache] Error invalidating pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Invalidate specific mapping cache
   */
  async invalidateMapping(mappingType: MappingType): Promise<void> {
    await this.invalidatePattern(`mapping:${mappingType}*`);
    await this.invalidatePattern(`rules:${mappingType}*`);
    await this.invalidatePattern(`metrics:${mappingType}*`);
  }

  /**
   * Invalidate all OPAL caches
   */
  async invalidateAll(): Promise<void> {
    await this.invalidatePattern('*');
  }

  /**
   * Get cache statistics
   */
  getCacheMetrics(): CacheMetrics & { hitRate: number; isConnected: boolean } {
    const totalRequests = this.metrics.hits + this.metrics.misses;
    const hitRate = totalRequests > 0 ? (this.metrics.hits / totalRequests) * 100 : 0;

    return {
      ...this.metrics,
      hitRate: parseFloat(hitRate.toFixed(2)),
      isConnected: this.isConnected
    };
  }

  /**
   * Health check for cache connection
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; latency?: number; error?: string }> {
    if (!this.isConnected) {
      return { status: 'unhealthy', error: 'Redis not connected' };
    }

    try {
      const startTime = performance.now();
      await this.client.ping();
      const latency = performance.now() - startTime;

      return { status: 'healthy', latency: parseFloat(latency.toFixed(2)) };
    } catch (error) {
      return { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get Redis client (for advanced operations)
   */
  getClient(): Redis | null {
    return this.isConnected ? this.client : null;
  }

  /**
   * Check if Redis is connected and available
   */
  get isAvailable(): boolean {
    return this.isConnected;
  }

  /**
   * Graceful shutdown
   */
  async disconnect(): Promise<void> {
    try {
      await this.client.disconnect();
      console.log('[Cache] Redis disconnected gracefully');
    } catch (error) {
      console.error('[Cache] Error during Redis disconnect:', error);
    }
  }
}

// Export singleton instance
export const cache = new RedisCache();

// Export cache utilities
export const CacheKeys = {
  mapping: (type: MappingType) => `mapping:${type}`,
  rules: (type?: MappingType) => type ? `rules:${type}` : 'rules:global',
  metrics: (domain: string, timeframe = 'default') => `metrics:${domain}:${timeframe}`,
  coordination: (source: MappingType, target: MappingType) => `coordination:${source}:${target}`,
  health: () => 'health:system'
} as const;

export type CacheKey = ReturnType<typeof CacheKeys[keyof typeof CacheKeys]>;