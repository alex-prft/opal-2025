/**
 * Agent Coordination System for Strategy Plans
 * Prevents conflicts during simultaneous agent execution using Redis locks
 * Implements hybrid API + orchestration coordination approach
 */

import { cache } from '@/lib/cache/redis-cache';
import { Database } from '@/lib/types/database';

type AgentType = 'strategy_workflow' | 'roadmap_generator' | 'maturity_assessment' | 'quick_wins_analyzer' | 'content_review';

interface CoordinationLock {
  lockKey: string;
  lockHolder: string;
  agentType: AgentType;
  pageId?: string;
  workflowId?: string;
  acquiredAt: Date;
  expiresAt: Date;
  maxDurationMs: number;
  lockPurpose: 'content_generation' | 'cache_update' | 'validation';
  priority: number;
}

interface AgentRequest {
  agentType: AgentType;
  pageId: string;
  workflowId?: string;
  requestId: string;
  priority?: number;
  timeout?: number;
}

interface AgentResponse {
  success: boolean;
  data?: any;
  confidence_score?: number;
  error?: string;
  fallbackUsed?: boolean;
  responseTimeMs: number;
}

export class AgentCoordinator {
  private static instance: AgentCoordinator;
  private lockPrefix = 'agent_lock:';
  private queuePrefix = 'agent_queue:';
  private resultPrefix = 'agent_result:';

  // Default coordination settings
  private readonly defaultLockDuration = 5 * 60 * 1000; // 5 minutes
  private readonly defaultTimeout = 2 * 60 * 1000; // 2 minutes
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second

  private constructor() {}

  public static getInstance(): AgentCoordinator {
    if (!AgentCoordinator.instance) {
      AgentCoordinator.instance = new AgentCoordinator();
    }
    return AgentCoordinator.instance;
  }

  /**
   * Acquire coordination lock for agent execution
   */
  async acquireLock(request: AgentRequest): Promise<CoordinationLock | null> {
    const lockKey = this.generateLockKey(request.agentType, request.pageId);
    const lockHolder = this.generateLockHolder(request);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (request.timeout || this.defaultLockDuration));

    const lock: CoordinationLock = {
      lockKey,
      lockHolder,
      agentType: request.agentType,
      pageId: request.pageId,
      workflowId: request.workflowId,
      acquiredAt: now,
      expiresAt,
      maxDurationMs: request.timeout || this.defaultLockDuration,
      lockPurpose: 'content_generation',
      priority: request.priority || 1
    };

    try {
      // Try to acquire lock using Redis SET NX (set if not exists) with expiration
      const client = cache.getClient();
      if (!client) {
        console.error('[AgentCoordinator] Redis client not available');
        return null;
      }

      // Use SET with NX (only set if key doesn't exist) and EX (expiration in seconds)
      const lockAcquired = await client.set(
        `${this.lockPrefix}${lockKey}`,
        JSON.stringify(lock),
        'NX',
        'EX',
        Math.ceil(lock.maxDurationMs / 1000)
      );

      if (lockAcquired === 'OK') {
        console.log(`[AgentCoordinator] Lock acquired: ${lockKey} by ${lockHolder}`);
        return lock;
      } else {
        // Lock already exists, check if we can queue or wait
        console.log(`[AgentCoordinator] Lock already exists for ${lockKey}`);
        return await this.handleLockConflict(request);
      }
    } catch (error) {
      console.error(`[AgentCoordinator] Error acquiring lock ${lockKey}:`, error);
      return null;
    }
  }

  /**
   * Release coordination lock
   */
  async releaseLock(lock: CoordinationLock): Promise<boolean> {
    try {
      const client = cache.getClient();
      if (!client) return false;

      const deleted = await client.del(`${this.lockPrefix}${lock.lockKey}`);
      console.log(`[AgentCoordinator] Lock released: ${lock.lockKey}`);

      // Process next item in queue if any
      await this.processQueue(lock.agentType, lock.pageId);

      return deleted > 0;
    } catch (error) {
      console.error(`[AgentCoordinator] Error releasing lock ${lock.lockKey}:`, error);
      return false;
    }
  }

  /**
   * Execute agent with coordination - enhanced for Redis failures
   */
  async executeWithCoordination(
    request: AgentRequest,
    agentExecutor: () => Promise<AgentResponse>
  ): Promise<AgentResponse> {
    const startTime = performance.now();
    let lock: CoordinationLock | null = null;
    const isRedisAvailable = await this.checkRedisConnection();

    try {
      // If Redis is unavailable, execute without coordination but with logging
      if (!isRedisAvailable) {
        console.warn(`[AgentCoordinator] Redis unavailable - executing ${request.agentType} without coordination`);
        const result = await agentExecutor();
        result.responseTimeMs = performance.now() - startTime;

        // Add metadata about degraded operation
        return {
          ...result,
          degraded_operation: true,
          coordination_bypassed: 'redis_unavailable'
        };
      }

      // Attempt to acquire lock with timeout
      const lockPromise = this.acquireLock(request);
      const timeoutPromise = new Promise<CoordinationLock | null>((resolve) => {
        setTimeout(() => {
          console.warn(`[AgentCoordinator] Lock acquisition timeout for ${request.agentType}:${request.pageId}`);
          resolve(null);
        }, 5000); // 5 second timeout for lock acquisition
      });

      lock = await Promise.race([lockPromise, timeoutPromise]);

      if (!lock) {
        // Could not acquire lock, try fallback strategies
        console.log(`[AgentCoordinator] Lock acquisition failed, trying fallback for ${request.agentType}:${request.pageId}`);
        return await this.handleExecutionFallback(request, 'lock_acquisition_failed');
      }

      // Execute agent with lock held
      console.log(`[AgentCoordinator] Executing ${request.agentType} for ${request.pageId} with lock`);

      // Execute with timeout
      const executionPromise = agentExecutor();
      const executionTimeout = new Promise<AgentResponse>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Agent execution timeout after ${request.timeout || this.defaultTimeout}ms`));
        }, request.timeout || this.defaultTimeout);
      });

      const result = await Promise.race([executionPromise, executionTimeout]);

      // Cache successful results (but don't fail if caching fails)
      if (result.success && result.data && isRedisAvailable) {
        try {
          await this.cacheAgentResult(request, result);
        } catch (cacheError) {
          console.warn(`[AgentCoordinator] Cache storage failed (non-critical):`, cacheError);
        }
      }

      result.responseTimeMs = performance.now() - startTime;
      return result;

    } catch (error) {
      console.error(`[AgentCoordinator] Error during agent execution:`, error);

      // Return fallback response
      return await this.handleExecutionFallback(request, 'execution_error', error as Error);
    } finally {
      // Always release lock (but don't fail if release fails)
      if (lock) {
        try {
          await this.releaseLock(lock);
        } catch (releaseError) {
          console.warn(`[AgentCoordinator] Lock release failed (non-critical):`, releaseError);
        }
      }
    }
  }

  /**
   * Check Redis connection health
   */
  private async checkRedisConnection(): Promise<boolean> {
    try {
      const client = cache.getClient();
      if (!client) return false;

      // Quick ping test with timeout
      const pingPromise = client.ping();
      const timeoutPromise = new Promise<string>((_, reject) => {
        setTimeout(() => reject(new Error('Redis ping timeout')), 2000);
      });

      const result = await Promise.race([pingPromise, timeoutPromise]);
      return result === 'PONG';
    } catch (error) {
      console.warn(`[AgentCoordinator] Redis health check failed:`, error);
      return false;
    }
  }

  /**
   * Check if agent is currently locked for a page
   */
  async isLocked(agentType: AgentType, pageId: string): Promise<boolean> {
    try {
      const client = cache.getClient();
      if (!client) return false;

      const lockKey = this.generateLockKey(agentType, pageId);
      const exists = await client.exists(`${this.lockPrefix}${lockKey}`);
      return exists === 1;
    } catch (error) {
      console.error(`[AgentCoordinator] Error checking lock status:`, error);
      return false;
    }
  }

  /**
   * Get cached agent result if available
   */
  async getCachedResult(agentType: AgentType, pageId: string): Promise<AgentResponse | null> {
    try {
      const client = cache.getClient();
      if (!client) return null;

      const resultKey = this.generateResultKey(agentType, pageId);
      const cached = await client.get(`${this.resultPrefix}${resultKey}`);

      if (cached) {
        const result = JSON.parse(cached);
        console.log(`[AgentCoordinator] Cache HIT for ${agentType}:${pageId}`);
        return result;
      }

      console.log(`[AgentCoordinator] Cache MISS for ${agentType}:${pageId}`);
      return null;
    } catch (error) {
      console.error(`[AgentCoordinator] Error getting cached result:`, error);
      return null;
    }
  }

  /**
   * Force refresh agent result (bypass cache)
   */
  async forceRefresh(agentType: AgentType, pageId: string): Promise<void> {
    try {
      const client = cache.getClient();
      if (!client) return;

      const resultKey = this.generateResultKey(agentType, pageId);
      await client.del(`${this.resultPrefix}${resultKey}`);

      console.log(`[AgentCoordinator] Forced refresh for ${agentType}:${pageId}`);
    } catch (error) {
      console.error(`[AgentCoordinator] Error during force refresh:`, error);
    }
  }

  /**
   * Get coordination statistics
   */
  async getCoordinationStats(): Promise<{
    activeLocks: number;
    queuedRequests: number;
    recentExecutions: number;
    cacheHitRate: number;
  }> {
    try {
      const client = cache.getClient();
      if (!client) {
        return { activeLocks: 0, queuedRequests: 0, recentExecutions: 0, cacheHitRate: 0 };
      }

      const lockKeys = await client.keys(`${this.lockPrefix}*`);
      const queueKeys = await client.keys(`${this.queuePrefix}*`);
      const resultKeys = await client.keys(`${this.resultPrefix}*`);

      return {
        activeLocks: lockKeys.length,
        queuedRequests: queueKeys.length,
        recentExecutions: resultKeys.length,
        cacheHitRate: cache.getCacheMetrics().hitRate
      };
    } catch (error) {
      console.error(`[AgentCoordinator] Error getting coordination stats:`, error);
      return { activeLocks: 0, queuedRequests: 0, recentExecutions: 0, cacheHitRate: 0 };
    }
  }

  // Private helper methods

  private generateLockKey(agentType: AgentType, pageId: string): string {
    return `${agentType}:${pageId}`;
  }

  private generateResultKey(agentType: AgentType, pageId: string): string {
    return `${agentType}:${pageId}`;
  }

  private generateLockHolder(request: AgentRequest): string {
    return `${request.requestId}:${request.agentType}:${Date.now()}`;
  }

  private async handleLockConflict(request: AgentRequest): Promise<CoordinationLock | null> {
    // First, try to get cached result
    const cached = await this.getCachedResult(request.agentType, request.pageId);
    if (cached && cached.success) {
      console.log(`[AgentCoordinator] Using cached result for ${request.agentType}:${request.pageId}`);
      // Still return null for lock, but cached result will be used
      return null;
    }

    // If no cache, add to queue with exponential backoff
    return await this.addToQueue(request);
  }

  private async addToQueue(request: AgentRequest): Promise<CoordinationLock | null> {
    try {
      const client = cache.getClient();
      if (!client) return null;

      const queueKey = `${this.queuePrefix}${request.agentType}:${request.pageId}`;
      const queueItem = {
        ...request,
        queuedAt: new Date().toISOString(),
        retries: 0
      };

      await client.lpush(queueKey, JSON.stringify(queueItem));
      console.log(`[AgentCoordinator] Added to queue: ${request.agentType}:${request.pageId}`);

      // Wait briefly and retry lock acquisition
      await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      return await this.acquireLock(request);
    } catch (error) {
      console.error(`[AgentCoordinator] Error adding to queue:`, error);
      return null;
    }
  }

  private async processQueue(agentType: AgentType, pageId: string): Promise<void> {
    try {
      const client = cache.getClient();
      if (!client) return;

      const queueKey = `${this.queuePrefix}${agentType}:${pageId}`;
      const queueItem = await client.rpop(queueKey);

      if (queueItem) {
        const request: AgentRequest = JSON.parse(queueItem);
        console.log(`[AgentCoordinator] Processing queued request: ${agentType}:${pageId}`);

        // Attempt to acquire lock for queued request
        // This would typically be handled by the calling system
      }
    } catch (error) {
      console.error(`[AgentCoordinator] Error processing queue:`, error);
    }
  }

  private async cacheAgentResult(request: AgentRequest, result: AgentResponse): Promise<void> {
    try {
      const client = cache.getClient();
      if (!client) return;

      const resultKey = this.generateResultKey(request.agentType, request.pageId);
      const cacheTTL = this.determineCacheTTL(result.confidence_score);

      await client.setex(
        `${this.resultPrefix}${resultKey}`,
        cacheTTL,
        JSON.stringify(result)
      );

      console.log(`[AgentCoordinator] Cached result for ${request.agentType}:${request.pageId} (TTL: ${cacheTTL}s)`);
    } catch (error) {
      console.error(`[AgentCoordinator] Error caching result:`, error);
    }
  }

  private determineCacheTTL(confidenceScore?: number): number {
    // Higher confidence = longer cache time
    if (!confidenceScore) return 300; // 5 minutes default

    if (confidenceScore >= 0.9) return 3600; // 1 hour for high confidence
    if (confidenceScore >= 0.7) return 1800; // 30 minutes for good confidence
    if (confidenceScore >= 0.6) return 900;  // 15 minutes for acceptable confidence
    return 300; // 5 minutes for low confidence
  }

  private async handleExecutionFallback(
    request: AgentRequest,
    reason: string,
    error?: Error
  ): Promise<AgentResponse> {
    console.log(`[AgentCoordinator] Handling fallback for ${request.agentType}:${request.pageId}, reason: ${reason}`);

    // Try to get cached result as fallback
    const cached = await this.getCachedResult(request.agentType, request.pageId);
    if (cached) {
      return {
        ...cached,
        fallbackUsed: true,
        error: `Fallback used: ${reason}`
      };
    }

    // Return error response if no fallback available
    return {
      success: false,
      error: `Agent execution failed: ${reason}${error ? ` - ${error.message}` : ''}`,
      fallbackUsed: true,
      responseTimeMs: 0
    };
  }
}

// Export singleton instance
export const agentCoordinator = AgentCoordinator.getInstance();

// Export types for external use
export type { AgentType, CoordinationLock, AgentRequest, AgentResponse };