/**
 * Database Connection Pool Manager
 * Enhanced connection pooling with PostgreSQL support, caching, and performance monitoring
 */

import { createSupabaseAdmin } from './supabase-client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';
import { cache } from '@/lib/cache/redis-cache';

interface ConnectionPoolConfig {
  /** Minimum number of connections to maintain */
  minConnections: number;
  /** Maximum number of connections allowed */
  maxConnections: number;
  /** Connection idle timeout in milliseconds */
  idleTimeoutMs: number;
  /** Connection acquisition timeout in milliseconds */
  acquireTimeoutMs: number;
  /** Health check interval in milliseconds */
  healthCheckIntervalMs: number;
}

interface PooledConnection {
  client: SupabaseClient<Database>;
  id: string;
  createdAt: number;
  lastUsedAt: number;
  inUse: boolean;
  isHealthy: boolean;
  queryCount: number;
  totalQueryTime: number;
  lastHealthCheck: number;
}

interface PerformanceMetrics {
  totalQueries: number;
  averageQueryTime: number;
  cacheHitRate: number;
  poolUtilization: number;
  healthyConnections: number;
  errors: number;
  slowQueries: number;
  lastReset: number;
}

export class DatabaseConnectionPool {
  private connections: Map<string, PooledConnection> = new Map();
  private config: ConnectionPoolConfig;
  private healthCheckTimer?: NodeJS.Timeout;
  private cleanupTimer?: NodeJS.Timeout;
  private metrics: PerformanceMetrics;
  private slowQueryThreshold: number = 1000; // 1 second

  constructor(config?: Partial<ConnectionPoolConfig>) {
    this.config = {
      minConnections: parseInt(process.env.DB_POOL_MIN || '2'),
      maxConnections: parseInt(process.env.DB_POOL_MAX || '10'),
      idleTimeoutMs: parseInt(process.env.DB_TIMEOUT_SECONDS || '30') * 1000,
      acquireTimeoutMs: 5000,
      healthCheckIntervalMs: 60000, // 1 minute
      ...config
    };

    this.metrics = {
      totalQueries: 0,
      averageQueryTime: 0,
      cacheHitRate: 0,
      poolUtilization: 0,
      healthyConnections: 0,
      errors: 0,
      slowQueries: 0,
      lastReset: Date.now()
    };

    this.initialize();
  }

  /**
   * Initialize the connection pool
   */
  private async initialize(): Promise<void> {
    console.log('🔄 Initializing database connection pool:', {
      min: this.config.minConnections,
      max: this.config.maxConnections,
      idleTimeout: this.config.idleTimeoutMs + 'ms'
    });

    // Create minimum connections
    for (let i = 0; i < this.config.minConnections; i++) {
      await this.createConnection();
    }

    // Start health checks
    this.startHealthCheck();
    this.startCleanup();

    console.log('✅ Database connection pool initialized');
  }

  /**
   * Create a new connection
   */
  private async createConnection(): Promise<PooledConnection> {
    const id = `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const client = createSupabaseAdmin();
    const now = Date.now();

    const connection: PooledConnection = {
      client,
      id,
      createdAt: now,
      lastUsedAt: now,
      inUse: false,
      isHealthy: true,
      queryCount: 0,
      totalQueryTime: 0,
      lastHealthCheck: now
    };

    this.connections.set(id, connection);

    // Test the connection
    try {
      await this.testConnection(connection);
      console.log(`📡 Created database connection: ${id}`);
    } catch (error) {
      console.error(`❌ Failed to create connection ${id}:`, error);
      connection.isHealthy = false;
    }

    return connection;
  }

  /**
   * Acquire a connection from the pool
   */
  async acquireConnection(): Promise<SupabaseClient<Database>> {
    const startTime = Date.now();

    while (Date.now() - startTime < this.config.acquireTimeoutMs) {
      // Try to find an available healthy connection
      for (const connection of this.connections.values()) {
        if (!connection.inUse && connection.isHealthy) {
          connection.inUse = true;
          connection.lastUsedAt = Date.now();
          return connection.client;
        }
      }

      // Create new connection if we haven't reached max
      if (this.connections.size < this.config.maxConnections) {
        const connection = await this.createConnection();
        if (connection.isHealthy) {
          connection.inUse = true;
          return connection.client;
        }
      }

      // Wait a bit before trying again
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    throw new Error('Failed to acquire database connection: pool exhausted and timeout reached');
  }

  /**
   * Release a connection back to the pool
   */
  releaseConnection(client: SupabaseClient<Database>): void {
    for (const connection of this.connections.values()) {
      if (connection.client === client) {
        connection.inUse = false;
        connection.lastUsedAt = Date.now();
        return;
      }
    }

    console.warn('⚠️ Attempted to release unknown connection');
  }

  /**
   * Execute an operation with a pooled connection
   */
  async withConnection<T>(
    operation: (client: SupabaseClient<Database>) => Promise<T>
  ): Promise<T> {
    const client = await this.acquireConnection();
    const startTime = performance.now();

    try {
      const result = await operation(client);
      const queryTime = performance.now() - startTime;

      // Update connection and pool metrics
      this.updateConnectionMetrics(client, queryTime);
      this.updatePoolMetrics(queryTime);

      return result;
    } catch (error) {
      this.metrics.errors++;
      throw error;
    } finally {
      this.releaseConnection(client);
    }
  }

  /**
   * Execute cached query with automatic caching and performance monitoring
   */
  async executeCachedQuery<T = any>(
    table: string,
    query: any,
    cacheKey?: string,
    cacheTTL: number = 300
  ): Promise<{ data: T[] | null; fromCache: boolean; duration: number }> {
    const startTime = performance.now();
    const effectiveCacheKey = cacheKey || `query:${table}:${JSON.stringify(query).slice(0, 50)}`;

    // Try cache first
    try {
      const redisClient = cache.getClient();
      const cached = redisClient ? await redisClient.get(effectiveCacheKey) : null;
      if (cached) {
        const duration = performance.now() - startTime;
        this.metrics.cacheHitRate = (this.metrics.cacheHitRate + 1) / 2; // Simplified running average
        return {
          data: JSON.parse(cached),
          fromCache: true,
          duration: parseFloat(duration.toFixed(2))
        };
      }
    } catch (cacheError) {
      console.warn('[Pool] Cache read error:', cacheError);
    }

    // Execute query
    const result = await this.withConnection(async (client) => {
      const { data, error } = await client.from(table).select(query);
      if (error) throw error;
      return data;
    });

    const duration = performance.now() - startTime;

    // Cache result
    try {
      const redisClient = cache.getClient();
      if (redisClient) {
        await redisClient.setex(effectiveCacheKey, cacheTTL, JSON.stringify(result));
      }
    } catch (cacheError) {
      console.warn('[Pool] Cache write error:', cacheError);
    }

    return {
      data: result,
      fromCache: false,
      duration: parseFloat(duration.toFixed(2))
    };
  }

  /**
   * Get OPAL mapping with caching
   */
  async getMappingConfig(mappingType: string): Promise<any | null> {
    const { data } = await this.executeCachedQuery(
      'opal_mapping_configurations',
      '*',
      `mapping:${mappingType}`,
      3600 // 1 hour cache
    );

    return data?.[0] || null;
  }

  /**
   * Get optimization metrics with caching
   */
  async getOptimizationMetrics(domain: string, timeframe: string = '24h'): Promise<any[]> {
    const { data } = await this.executeCachedQuery(
      'optimization_metrics',
      `*, domain, recorded_at`,
      `metrics:${domain}:${timeframe}`,
      300 // 5 minutes cache
    );

    return data || [];
  }

  /**
   * Update connection-specific metrics
   */
  private updateConnectionMetrics(client: SupabaseClient<Database>, queryTime: number): void {
    for (const connection of this.connections.values()) {
      if (connection.client === client) {
        connection.queryCount++;
        connection.totalQueryTime += queryTime;

        if (queryTime > this.slowQueryThreshold) {
          this.metrics.slowQueries++;
          console.warn(`[Pool] Slow query detected: ${queryTime.toFixed(2)}ms on connection ${connection.id}`);
        }
        break;
      }
    }
  }

  /**
   * Update pool-wide metrics
   */
  private updatePoolMetrics(queryTime: number): void {
    this.metrics.totalQueries++;
    this.metrics.averageQueryTime = (this.metrics.averageQueryTime + queryTime) / 2;

    const inUseCount = Array.from(this.connections.values()).filter(c => c.inUse).length;
    this.metrics.poolUtilization = (inUseCount / this.config.maxConnections) * 100;

    const healthyCount = Array.from(this.connections.values()).filter(c => c.isHealthy).length;
    this.metrics.healthyConnections = healthyCount;
  }

  /**
   * Test if a connection is healthy
   */
  private async testConnection(connection: PooledConnection): Promise<boolean> {
    try {
      const { error } = await connection.client
        .from('opal_system_health')
        .select('count')
        .limit(1);

      return !error;
    } catch (error) {
      return false;
    }
  }

  /**
   * Start periodic health checks
   */
  private startHealthCheck(): void {
    this.healthCheckTimer = setInterval(async () => {
      console.log('🔍 Running database connection health check');

      let healthyCount = 0;
      let unhealthyCount = 0;

      for (const connection of this.connections.values()) {
        if (!connection.inUse) {
          const isHealthy = await this.testConnection(connection);
          connection.isHealthy = isHealthy;

          if (isHealthy) {
            healthyCount++;
          } else {
            unhealthyCount++;
            console.warn(`⚠️ Connection ${connection.id} is unhealthy`);
          }
        }
      }

      console.log(`📊 Health check complete: ${healthyCount} healthy, ${unhealthyCount} unhealthy`);

      // Ensure we have minimum healthy connections
      const healthyConnections = Array.from(this.connections.values())
        .filter(c => c.isHealthy).length;

      if (healthyConnections < this.config.minConnections) {
        const needed = this.config.minConnections - healthyConnections;
        console.log(`🔧 Creating ${needed} new connections to maintain minimum`);

        for (let i = 0; i < needed && this.connections.size < this.config.maxConnections; i++) {
          await this.createConnection();
        }
      }
    }, this.config.healthCheckIntervalMs);
  }

  /**
   * Start cleanup of idle connections
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      const toRemove: string[] = [];

      for (const [id, connection] of this.connections.entries()) {
        const idleTime = now - connection.lastUsedAt;

        if (!connection.inUse &&
            idleTime > this.config.idleTimeoutMs &&
            this.connections.size > this.config.minConnections) {
          toRemove.push(id);
        }
      }

      for (const id of toRemove) {
        const connection = this.connections.get(id);
        if (connection) {
          this.connections.delete(id);
          console.log(`🗑️ Removed idle connection: ${id}`);
        }
      }

      if (toRemove.length > 0) {
        console.log(`🧹 Cleaned up ${toRemove.length} idle connections`);
      }
    }, 30000); // Run cleanup every 30 seconds
  }

  /**
   * Get pool statistics with performance metrics
   */
  getStats(): {
    pool: {
      total: number;
      available: number;
      inUse: number;
      healthy: number;
      unhealthy: number;
    };
    performance: PerformanceMetrics;
    connections: Array<{
      id: string;
      queryCount: number;
      avgQueryTime: number;
      isHealthy: boolean;
      inUse: boolean;
      ageMs: number;
    }>;
  } {
    const connections = Array.from(this.connections.values());
    const now = Date.now();

    this.updatePoolMetrics(0); // Update current metrics

    return {
      pool: {
        total: connections.length,
        available: connections.filter(c => !c.inUse && c.isHealthy).length,
        inUse: connections.filter(c => c.inUse).length,
        healthy: connections.filter(c => c.isHealthy).length,
        unhealthy: connections.filter(c => !c.isHealthy).length
      },
      performance: { ...this.metrics },
      connections: connections.map(c => ({
        id: c.id,
        queryCount: c.queryCount,
        avgQueryTime: c.queryCount > 0 ? c.totalQueryTime / c.queryCount : 0,
        isHealthy: c.isHealthy,
        inUse: c.inUse,
        ageMs: now - c.createdAt
      }))
    };
  }

  /**
   * Get performance metrics only
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset performance metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalQueries: 0,
      averageQueryTime: 0,
      cacheHitRate: 0,
      poolUtilization: 0,
      healthyConnections: 0,
      errors: 0,
      slowQueries: 0,
      lastReset: Date.now()
    };

    // Reset connection-specific metrics
    for (const connection of this.connections.values()) {
      connection.queryCount = 0;
      connection.totalQueryTime = 0;
    }

    console.log('[Pool] Performance metrics reset');
  }

  /**
   * Shutdown the pool
   */
  shutdown(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.connections.clear();
    console.log('🔌 Database connection pool shutdown complete');
  }
}

// Global connection pool instance
let globalPool: DatabaseConnectionPool | null = null;

/**
 * Get the global connection pool instance
 */
export function getConnectionPool(): DatabaseConnectionPool {
  if (!globalPool) {
    globalPool = new DatabaseConnectionPool();
  }
  return globalPool;
}

/**
 * Execute database operation with connection pooling
 */
export async function withPooledConnection<T>(
  operation: (client: SupabaseClient<Database>) => Promise<T>
): Promise<T> {
  const pool = getConnectionPool();
  return pool.withConnection(operation);
}

/**
 * Get connection pool statistics
 */
export function getPoolStats() {
  if (!globalPool) {
    return { error: 'Pool not initialized' };
  }
  return globalPool.getStats();
}