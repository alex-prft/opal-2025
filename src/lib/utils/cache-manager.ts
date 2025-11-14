/**
 * Comprehensive Caching Layer for OSA Dashboard Performance
 * Provides in-memory, file-based, and adaptive caching strategies
 */

import { promises as fs } from 'fs';
import path from 'path';

// Cache entry interface
interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
  lastAccessed: number;
  tags: string[];
}

// Cache statistics
interface CacheStats {
  totalEntries: number;
  totalHits: number;
  totalMisses: number;
  hitRate: number;
  memoryUsage: number;
  oldestEntry: number | null;
  newestEntry: number | null;
}

// Cache configuration
interface CacheConfig {
  maxMemoryEntries: number;
  defaultTtl: number;
  maxFileSize: number;
  compressionThreshold: number;
  enablePersistence: boolean;
  persistencePath: string;
}

class CacheManager {
  private memoryCache = new Map<string, CacheEntry>();
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0
  };

  private config: CacheConfig = {
    maxMemoryEntries: 1000,
    defaultTtl: 300000, // 5 minutes
    maxFileSize: 10 * 1024 * 1024, // 10MB
    compressionThreshold: 1024, // 1KB
    enablePersistence: true,
    persistencePath: path.join(process.cwd(), 'data', 'cache')
  };

  constructor(config?: Partial<CacheConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    this.initializePersistenceDirectory();
  }

  /**
   * Initialize cache persistence directory
   */
  private async initializePersistenceDirectory(): Promise<void> {
    if (this.config.enablePersistence) {
      try {
        await fs.mkdir(this.config.persistencePath, { recursive: true });
      } catch (error) {
        console.warn('⚠️ [Cache] Failed to initialize persistence directory:', error);
        this.config.enablePersistence = false;
      }
    }
  }

  /**
   * Get cache entry with hit tracking and TTL checking
   */
  async get<T = any>(key: string, tags?: string[]): Promise<T | null> {
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && this.isEntryValid(memoryEntry)) {
      memoryEntry.hits++;
      memoryEntry.lastAccessed = Date.now();
      this.stats.hits++;

      console.log(`📦 [Cache] Memory hit for key: ${key}`);
      return memoryEntry.data as T;
    }

    // Remove expired memory entry
    if (memoryEntry) {
      this.memoryCache.delete(key);
    }

    // Check file cache if persistence enabled
    if (this.config.enablePersistence) {
      try {
        const fileEntry = await this.getFromFile<T>(key);
        if (fileEntry && this.isEntryValid(fileEntry)) {
          // Promote to memory cache
          this.memoryCache.set(key, fileEntry);
          this.cleanupMemoryCache();

          fileEntry.hits++;
          fileEntry.lastAccessed = Date.now();
          this.stats.hits++;

          console.log(`💾 [Cache] File hit for key: ${key}`);
          return fileEntry.data;
        }
      } catch (error) {
        console.warn(`⚠️ [Cache] File cache read error for key ${key}:`, error);
      }
    }

    this.stats.misses++;
    console.log(`❌ [Cache] Miss for key: ${key}`);
    return null;
  }

  /**
   * Set cache entry with automatic persistence and cleanup
   */
  async set<T = any>(
    key: string,
    data: T,
    options?: {
      ttl?: number;
      tags?: string[];
      persistToDisk?: boolean;
    }
  ): Promise<void> {
    const ttl = options?.ttl || this.config.defaultTtl;
    const tags = options?.tags || [];
    const persistToDisk = options?.persistToDisk ?? this.config.enablePersistence;

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      hits: 0,
      lastAccessed: Date.now(),
      tags
    };

    // Set in memory cache
    this.memoryCache.set(key, entry);
    this.stats.sets++;

    // Cleanup memory if needed
    this.cleanupMemoryCache();

    // Persist to disk if enabled
    if (persistToDisk && this.config.enablePersistence) {
      try {
        await this.saveToFile(key, entry);
        console.log(`💾 [Cache] Persisted key: ${key}`);
      } catch (error) {
        console.warn(`⚠️ [Cache] File cache write error for key ${key}:`, error);
      }
    }

    console.log(`✅ [Cache] Set key: ${key} (TTL: ${ttl}ms)`);
  }

  /**
   * Get or set pattern - fetch data if not cached
   */
  async getOrSet<T = any>(
    key: string,
    fetcher: () => Promise<T>,
    options?: {
      ttl?: number;
      tags?: string[];
      persistToDisk?: boolean;
    }
  ): Promise<T> {
    const cached = await this.get<T>(key, options?.tags);
    if (cached !== null) {
      return cached;
    }

    console.log(`🔄 [Cache] Fetching data for key: ${key}`);
    const data = await fetcher();
    await this.set(key, data, options);
    return data;
  }

  /**
   * Delete specific cache entry
   */
  async delete(key: string): Promise<boolean> {
    const memoryDeleted = this.memoryCache.delete(key);

    let fileDeleted = false;
    if (this.config.enablePersistence) {
      try {
        const filePath = this.getFilePath(key);
        await fs.unlink(filePath);
        fileDeleted = true;
      } catch (error) {
        // File might not exist, which is fine
      }
    }

    console.log(`🗑️ [Cache] Deleted key: ${key}`);
    return memoryDeleted || fileDeleted;
  }

  /**
   * Clear cache by tags
   */
  async clearByTags(tags: string[]): Promise<number> {
    let deletedCount = 0;

    // Clear from memory
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.tags.some(tag => tags.includes(tag))) {
        this.memoryCache.delete(key);
        deletedCount++;
      }
    }

    // Clear from disk (simplified - in production, maintain tag index)
    if (this.config.enablePersistence) {
      try {
        const files = await fs.readdir(this.config.persistencePath);
        for (const file of files) {
          if (file.endsWith('.json')) {
            const key = file.replace('.json', '');
            const entry = await this.getFromFile(key);
            if (entry && entry.tags.some(tag => tags.includes(tag))) {
              await fs.unlink(path.join(this.config.persistencePath, file));
              deletedCount++;
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ [Cache] Error clearing tagged entries from disk:', error);
      }
    }

    console.log(`🏷️ [Cache] Cleared ${deletedCount} entries with tags:`, tags);
    return deletedCount;
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    this.stats = { hits: 0, misses: 0, sets: 0 };

    if (this.config.enablePersistence) {
      try {
        const files = await fs.readdir(this.config.persistencePath);
        for (const file of files) {
          if (file.endsWith('.json')) {
            await fs.unlink(path.join(this.config.persistencePath, file));
          }
        }
      } catch (error) {
        console.warn('⚠️ [Cache] Error clearing disk cache:', error);
      }
    }

    console.log('🧹 [Cache] Cleared all cache entries');
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const entries = Array.from(this.memoryCache.values());

    return {
      totalEntries: this.memoryCache.size,
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      hitRate: this.stats.hits + this.stats.misses > 0
        ? this.stats.hits / (this.stats.hits + this.stats.misses)
        : 0,
      memoryUsage: this.calculateMemoryUsage(),
      oldestEntry: entries.length > 0 ? Math.min(...entries.map(e => e.timestamp)) : null,
      newestEntry: entries.length > 0 ? Math.max(...entries.map(e => e.timestamp)) : null
    };
  }

  /**
   * Health check for cache system
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'failed';
    memoryCache: boolean;
    fileCache: boolean;
    stats: CacheStats;
    issues: string[];
  }> {
    const issues: string[] = [];
    let status: 'healthy' | 'degraded' | 'failed' = 'healthy';

    // Test memory cache
    const testKey = '__health_check__';
    const testData = { test: true, timestamp: Date.now() };

    let memoryCacheWorking = false;
    try {
      await this.set(testKey, testData, { persistToDisk: false });
      const retrieved = await this.get(testKey);
      memoryCacheWorking = retrieved !== null;
      await this.delete(testKey);
    } catch (error) {
      issues.push('Memory cache test failed');
    }

    // Test file cache
    let fileCacheWorking = false;
    if (this.config.enablePersistence) {
      try {
        await this.set(testKey + '_file', testData, { persistToDisk: true });
        // Clear memory cache entry to force file read
        this.memoryCache.delete(testKey + '_file');
        const retrieved = await this.get(testKey + '_file');
        fileCacheWorking = retrieved !== null;
        await this.delete(testKey + '_file');
      } catch (error) {
        issues.push('File cache test failed');
        status = 'degraded';
      }
    }

    if (!memoryCacheWorking) {
      status = 'failed';
      issues.push('Memory cache not functioning');
    }

    return {
      status,
      memoryCache: memoryCacheWorking,
      fileCache: fileCacheWorking,
      stats: this.getStats(),
      issues
    };
  }

  // Private helper methods

  private isEntryValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  private cleanupMemoryCache(): void {
    if (this.memoryCache.size <= this.config.maxMemoryEntries) {
      return;
    }

    // Remove expired entries first
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (!this.isEntryValid(entry)) {
        this.memoryCache.delete(key);
      }
    }

    // If still over limit, remove least recently used
    if (this.memoryCache.size > this.config.maxMemoryEntries) {
      const entries = Array.from(this.memoryCache.entries())
        .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

      const toRemove = entries.slice(0, entries.length - this.config.maxMemoryEntries);
      for (const [key] of toRemove) {
        this.memoryCache.delete(key);
      }
    }
  }

  private async getFromFile<T>(key: string): Promise<CacheEntry<T> | null> {
    try {
      const filePath = this.getFilePath(key);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data) as CacheEntry<T>;
    } catch (error) {
      return null;
    }
  }

  private async saveToFile<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    const filePath = this.getFilePath(key);
    const data = JSON.stringify(entry);

    if (data.length > this.config.maxFileSize) {
      throw new Error(`Cache entry too large: ${data.length} bytes`);
    }

    await fs.writeFile(filePath, data, 'utf8');
  }

  private getFilePath(key: string): string {
    const safeKey = key.replace(/[^a-zA-Z0-9-_]/g, '_');
    return path.join(this.config.persistencePath, `${safeKey}.json`);
  }

  private calculateMemoryUsage(): number {
    let usage = 0;
    for (const entry of this.memoryCache.values()) {
      usage += JSON.stringify(entry).length;
    }
    return usage;
  }
}

// Singleton instance
const cacheManager = new CacheManager();

// Predefined cache configurations for different data types
export const CacheConfigs = {
  HEALTH_DATA: {
    ttl: 60000, // 1 minute
    tags: ['health', 'system'],
    persistToDisk: true
  },
  FORCE_SYNC: {
    ttl: 300000, // 5 minutes
    tags: ['force_sync', 'opal'],
    persistToDisk: true
  },
  AGENT_STATUS: {
    ttl: 30000, // 30 seconds
    tags: ['agents', 'status'],
    persistToDisk: false
  },
  WEBHOOK_EVENTS: {
    ttl: 60000, // 1 minute
    tags: ['webhooks', 'events'],
    persistToDisk: true
  },
  DASHBOARD_DATA: {
    ttl: 30000, // 30 seconds
    tags: ['dashboard', 'ui'],
    persistToDisk: false
  }
};

export { CacheManager, cacheManager };
export type { CacheEntry, CacheStats, CacheConfig };