/**
 * Fallback Cache Manager for OPAL Workflow Data
 * Maintains cached data for graceful degradation during failures
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

export interface CachedWorkflowData {
  workflowId: string;
  correlationId: string;
  status: 'initiated' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  startedAt: string;
  completedAt?: string;
  clientName: string;
  workflowName: string;
  success: boolean;
  duration?: number;
  cachedAt: string;
  expiresAt: string;
}

export interface ForceSyncCacheData {
  lastSuccessfulSync: CachedWorkflowData | null;
  recentSyncs: CachedWorkflowData[];
  lastUpdateTime: string;
  stats: {
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    averageDuration: number;
  };
}

export interface CacheOptions {
  /** Cache directory path (default: './cache/opal') */
  cacheDir?: string;
  /** Default TTL in milliseconds (default: 1 hour) */
  defaultTTL?: number;
  /** Maximum number of recent syncs to keep (default: 10) */
  maxRecentSyncs?: number;
  /** Enable file-based persistence (default: true) */
  enablePersistence?: boolean;
}

export class FallbackCache {
  private cache = new Map<string, CachedWorkflowData>();
  private forceSyncData: ForceSyncCacheData;
  private readonly cacheDir: string;
  private readonly defaultTTL: number;
  private readonly maxRecentSyncs: number;
  private readonly enablePersistence: boolean;
  private readonly forceSyncCacheFile: string;

  constructor(options: CacheOptions = {}) {
    this.cacheDir = options.cacheDir || './cache/opal';
    this.defaultTTL = options.defaultTTL || 60 * 60 * 1000; // 1 hour
    this.maxRecentSyncs = options.maxRecentSyncs || 10;
    this.enablePersistence = options.enablePersistence ?? true;
    this.forceSyncCacheFile = join(this.cacheDir, 'force-sync-data.json');

    // Initialize force sync data
    this.forceSyncData = {
      lastSuccessfulSync: null,
      recentSyncs: [],
      lastUpdateTime: new Date().toISOString(),
      stats: {
        totalSyncs: 0,
        successfulSyncs: 0,
        failedSyncs: 0,
        averageDuration: 0
      }
    };

    // Ensure cache directory exists
    if (this.enablePersistence) {
      this.ensureCacheDirectory();
      this.loadFromDisk();
    }

    console.log(`💾 [Fallback Cache] Initialized`, {
      cacheDir: this.cacheDir,
      defaultTTL: this.defaultTTL,
      maxRecentSyncs: this.maxRecentSyncs,
      persistence: this.enablePersistence
    });
  }

  /**
   * Cache a successful workflow for fallback display
   */
  cacheWorkflow(
    workflowId: string,
    data: Omit<CachedWorkflowData, 'cachedAt' | 'expiresAt'>,
    ttl?: number
  ): void {
    const now = new Date();
    const actualTTL = ttl || this.defaultTTL;
    const expiresAt = new Date(now.getTime() + actualTTL);

    const cachedData: CachedWorkflowData = {
      ...data,
      cachedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString()
    };

    this.cache.set(workflowId, cachedData);

    console.log(`💾 [Fallback Cache] Cached workflow`, {
      workflowId,
      correlationId: data.correlationId,
      status: data.status,
      success: data.success,
      expiresAt: expiresAt.toISOString()
    });

    // Update force sync data if this is a force sync
    if (data.clientName.toLowerCase().includes('force') || data.workflowName.includes('sync')) {
      this.updateForceSyncData(cachedData);
    }

    // Persist to disk
    if (this.enablePersistence) {
      this.saveToDisk();
    }
  }

  /**
   * Get cached workflow data
   */
  getWorkflow(workflowId: string): CachedWorkflowData | null {
    const cached = this.cache.get(workflowId);

    if (!cached) {
      return null;
    }

    // Check if expired
    if (new Date() > new Date(cached.expiresAt)) {
      console.log(`⏰ [Fallback Cache] Workflow ${workflowId} expired, removing from cache`);
      this.cache.delete(workflowId);

      if (this.enablePersistence) {
        this.saveToDisk();
      }

      return null;
    }

    console.log(`📦 [Fallback Cache] Retrieved workflow ${workflowId} from cache`);
    return cached;
  }

  /**
   * Get the last successful Force Sync for fallback display
   */
  getLastSuccessfulSync(): CachedWorkflowData | null {
    const lastSync = this.forceSyncData.lastSuccessfulSync;

    if (!lastSync) {
      return null;
    }

    // Check if expired
    if (new Date() > new Date(lastSync.expiresAt)) {
      console.log(`⏰ [Fallback Cache] Last successful sync expired`);
      this.forceSyncData.lastSuccessfulSync = null;

      if (this.enablePersistence) {
        this.saveToDisk();
      }

      return null;
    }

    return lastSync;
  }

  /**
   * Get recent Force Sync attempts for dashboard display
   */
  getRecentSyncs(): CachedWorkflowData[] {
    const now = new Date();

    // Filter out expired entries
    this.forceSyncData.recentSyncs = this.forceSyncData.recentSyncs.filter(
      sync => now <= new Date(sync.expiresAt)
    );

    return this.forceSyncData.recentSyncs;
  }

  /**
   * Get Force Sync statistics
   */
  getForceSyncStats() {
    return {
      ...this.forceSyncData.stats,
      lastUpdateTime: this.forceSyncData.lastUpdateTime,
      recentSyncCount: this.forceSyncData.recentSyncs.length,
      hasLastSuccessful: !!this.forceSyncData.lastSuccessfulSync
    };
  }

  /**
   * Generate fallback data when live data is unavailable
   */
  generateFallbackData(): {
    hasData: boolean;
    lastSync: CachedWorkflowData | null;
    recentSyncs: CachedWorkflowData[];
    message: string;
  } {
    const lastSync = this.getLastSuccessfulSync();
    const recentSyncs = this.getRecentSyncs();

    let message = '';
    if (lastSync) {
      const syncTime = new Date(lastSync.completedAt || lastSync.startedAt);
      const hoursAgo = Math.floor((Date.now() - syncTime.getTime()) / (1000 * 60 * 60));
      message = `Showing cached data from ${hoursAgo}h ago (live data unavailable)`;
    } else if (recentSyncs.length > 0) {
      message = `Showing recent sync history (live data unavailable)`;
    } else {
      message = `No cached workflow data available`;
    }

    console.log(`🔄 [Fallback Cache] Generated fallback data`, {
      hasLastSync: !!lastSync,
      recentSyncCount: recentSyncs.length,
      message
    });

    return {
      hasData: !!(lastSync || recentSyncs.length > 0),
      lastSync,
      recentSyncs,
      message
    };
  }

  /**
   * Clear expired entries from cache
   */
  cleanupExpired(): number {
    const now = new Date();
    let cleaned = 0;

    // Clean workflow cache
    for (const [workflowId, data] of this.cache.entries()) {
      if (now > new Date(data.expiresAt)) {
        this.cache.delete(workflowId);
        cleaned++;
      }
    }

    // Clean recent syncs
    const originalLength = this.forceSyncData.recentSyncs.length;
    this.forceSyncData.recentSyncs = this.forceSyncData.recentSyncs.filter(
      sync => now <= new Date(sync.expiresAt)
    );
    cleaned += originalLength - this.forceSyncData.recentSyncs.length;

    // Clean last successful sync if expired
    if (this.forceSyncData.lastSuccessfulSync &&
        now > new Date(this.forceSyncData.lastSuccessfulSync.expiresAt)) {
      this.forceSyncData.lastSuccessfulSync = null;
      cleaned++;
    }

    if (cleaned > 0) {
      console.log(`🧹 [Fallback Cache] Cleaned ${cleaned} expired entries`);

      if (this.enablePersistence) {
        this.saveToDisk();
      }
    }

    return cleaned;
  }

  /**
   * Clear all cached data
   */
  clearAll(): void {
    console.log(`🗑️ [Fallback Cache] Clearing all cached data`);

    this.cache.clear();
    this.forceSyncData = {
      lastSuccessfulSync: null,
      recentSyncs: [],
      lastUpdateTime: new Date().toISOString(),
      stats: {
        totalSyncs: 0,
        successfulSyncs: 0,
        failedSyncs: 0,
        averageDuration: 0
      }
    };

    if (this.enablePersistence) {
      this.saveToDisk();
    }
  }

  /**
   * Update Force Sync statistics and recent data
   */
  private updateForceSyncData(workflow: CachedWorkflowData): void {
    // Update statistics
    this.forceSyncData.stats.totalSyncs++;

    if (workflow.success) {
      this.forceSyncData.stats.successfulSyncs++;
      this.forceSyncData.lastSuccessfulSync = workflow;
    } else {
      this.forceSyncData.stats.failedSyncs++;
    }

    // Update average duration
    if (workflow.duration) {
      const total = this.forceSyncData.stats.totalSyncs;
      const current = this.forceSyncData.stats.averageDuration;
      this.forceSyncData.stats.averageDuration =
        Math.round(((current * (total - 1)) + workflow.duration) / total);
    }

    // Add to recent syncs
    this.forceSyncData.recentSyncs.unshift(workflow);

    // Keep only maxRecentSyncs
    if (this.forceSyncData.recentSyncs.length > this.maxRecentSyncs) {
      this.forceSyncData.recentSyncs = this.forceSyncData.recentSyncs.slice(0, this.maxRecentSyncs);
    }

    this.forceSyncData.lastUpdateTime = new Date().toISOString();

    console.log(`📊 [Fallback Cache] Updated Force Sync stats`, {
      totalSyncs: this.forceSyncData.stats.totalSyncs,
      successfulSyncs: this.forceSyncData.stats.successfulSyncs,
      averageDuration: this.forceSyncData.stats.averageDuration,
      recentSyncsCount: this.forceSyncData.recentSyncs.length
    });
  }

  /**
   * Ensure cache directory exists
   */
  private ensureCacheDirectory(): void {
    if (!existsSync(this.cacheDir)) {
      mkdirSync(this.cacheDir, { recursive: true });
      console.log(`📁 [Fallback Cache] Created cache directory: ${this.cacheDir}`);
    }
  }

  /**
   * Load cache data from disk
   */
  private loadFromDisk(): void {
    try {
      if (existsSync(this.forceSyncCacheFile)) {
        const data = readFileSync(this.forceSyncCacheFile, 'utf-8');
        this.forceSyncData = JSON.parse(data);

        console.log(`📥 [Fallback Cache] Loaded from disk`, {
          totalSyncs: this.forceSyncData.stats.totalSyncs,
          recentSyncs: this.forceSyncData.recentSyncs.length,
          hasLastSuccessful: !!this.forceSyncData.lastSuccessfulSync
        });

        // Clean expired entries after loading
        this.cleanupExpired();
      }
    } catch (error) {
      console.error(`❌ [Fallback Cache] Failed to load from disk:`, error);
      // Continue with empty cache
    }
  }

  /**
   * Save cache data to disk
   */
  private saveToDisk(): void {
    if (!this.enablePersistence) return;

    try {
      this.ensureCacheDirectory();
      writeFileSync(this.forceSyncCacheFile, JSON.stringify(this.forceSyncData, null, 2));

      console.log(`💾 [Fallback Cache] Saved to disk`, {
        file: this.forceSyncCacheFile,
        totalSyncs: this.forceSyncData.stats.totalSyncs
      });
    } catch (error) {
      console.error(`❌ [Fallback Cache] Failed to save to disk:`, error);
    }
  }
}

// Global fallback cache instance
let globalFallbackCache: FallbackCache | null = null;

/**
 * Get or create global fallback cache instance
 */
export function getFallbackCache(): FallbackCache {
  if (!globalFallbackCache) {
    globalFallbackCache = new FallbackCache({
      cacheDir: './cache/opal',
      defaultTTL: 2 * 60 * 60 * 1000, // 2 hours
      maxRecentSyncs: 15
    });

    // Setup periodic cleanup
    setInterval(() => {
      globalFallbackCache?.cleanupExpired();
    }, 15 * 60 * 1000); // Clean every 15 minutes
  }

  return globalFallbackCache;
}