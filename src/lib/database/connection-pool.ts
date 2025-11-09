/**
 * Database Connection Pool Manager
 * Manages Supabase client instances and connection lifecycle
 */

import { createSupabaseAdmin } from './supabase-client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';

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
}

export class DatabaseConnectionPool {
  private connections: Map<string, PooledConnection> = new Map();
  private config: ConnectionPoolConfig;
  private healthCheckTimer?: NodeJS.Timeout;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config?: Partial<ConnectionPoolConfig>) {
    this.config = {
      minConnections: parseInt(process.env.DB_POOL_MIN || '2'),
      maxConnections: parseInt(process.env.DB_POOL_MAX || '10'),
      idleTimeoutMs: parseInt(process.env.DB_TIMEOUT_SECONDS || '30') * 1000,
      acquireTimeoutMs: 5000,
      healthCheckIntervalMs: 60000, // 1 minute
      ...config
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
      isHealthy: true
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

    try {
      return await operation(client);
    } finally {
      this.releaseConnection(client);
    }
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
   * Get pool statistics
   */
  getStats(): {
    total: number;
    available: number;
    inUse: number;
    healthy: number;
    unhealthy: number;
  } {
    const connections = Array.from(this.connections.values());

    return {
      total: connections.length,
      available: connections.filter(c => !c.inUse && c.isHealthy).length,
      inUse: connections.filter(c => c.inUse).length,
      healthy: connections.filter(c => c.isHealthy).length,
      unhealthy: connections.filter(c => !c.isHealthy).length
    };
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