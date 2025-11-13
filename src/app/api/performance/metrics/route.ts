/**
 * Performance Metrics API
 * Real-time performance monitoring for OPAL mapping system
 */

import { NextRequest, NextResponse } from 'next/server';
import { getConnectionPool } from '@/lib/database/connection-pool';
import { cache } from '@/lib/cache/redis-cache';
import { AdminAuthUtils } from '@/lib/auth/oauth-pkce';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PerformanceReport {
  timestamp: string;
  system: {
    uptime: number;
    nodeVersion: string;
    environment: string;
  };
  database: {
    pool: any;
    performance: any;
    connections: any[];
    health: {
      status: string;
      latency?: number;
      error?: string;
    };
  };
  cache: {
    metrics: any;
    health: {
      status: string;
      latency?: number;
      error?: string;
    };
  };
  api: {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    slowRequests: number;
  };
  optimization: {
    mappingLoadTime: number;
    rulesExecutionTime: number;
    coordinationLatency: number;
    cacheEffectiveness: number;
  };
}

// In-memory API metrics (in production, this would be stored in Redis or database)
let apiMetrics = {
  totalRequests: 0,
  totalResponseTime: 0,
  errors: 0,
  slowRequests: 0,
  lastReset: Date.now()
};

export async function GET(request: NextRequest) {
  const startTime = performance.now();

  try {
    // Require technical admin access for performance metrics
    const auth = await AdminAuthUtils.requireTechnicalAdmin(request);
    if (!auth.isAuthorized) {
      return NextResponse.json({
        error: auth.error || 'Unauthorized access to performance metrics'
      }, { status: 401 });
    }

    // Collect performance data
    const pool = getConnectionPool();
    const poolStats = pool.getStats();

    // Test database health
    const dbHealth = await testDatabaseHealth();

    // Test cache health
    const cacheHealth = await cache.healthCheck();
    const cacheMetrics = cache.getCacheMetrics();

    // Calculate optimization metrics
    const optimizationMetrics = await calculateOptimizationMetrics(pool);

    // Update API metrics
    const responseTime = performance.now() - startTime;
    updateApiMetrics(responseTime);

    const report: PerformanceReport = {
      timestamp: new Date().toISOString(),
      system: {
        uptime: process.uptime() * 1000, // Convert to milliseconds
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development'
      },
      database: {
        pool: poolStats.pool,
        performance: poolStats.performance,
        connections: poolStats.connections,
        health: dbHealth
      },
      cache: {
        metrics: cacheMetrics,
        health: cacheHealth
      },
      api: {
        totalRequests: apiMetrics.totalRequests,
        averageResponseTime: apiMetrics.totalRequests > 0 ?
          apiMetrics.totalResponseTime / apiMetrics.totalRequests : 0,
        errorRate: apiMetrics.totalRequests > 0 ?
          (apiMetrics.errors / apiMetrics.totalRequests) * 100 : 0,
        slowRequests: apiMetrics.slowRequests
      },
      optimization: optimizationMetrics
    };

    return NextResponse.json({
      success: true,
      data: report,
      meta: {
        generatedIn: parseFloat(responseTime.toFixed(2)),
        cachedUntil: new Date(Date.now() + 30000).toISOString() // 30 seconds
      }
    });

  } catch (error) {
    console.error('[Performance API] Error generating metrics report:', error);
    apiMetrics.errors++;

    return NextResponse.json({
      success: false,
      error: 'Failed to generate performance report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require technical admin access for metrics operations
    const auth = await AdminAuthUtils.requireTechnicalAdmin(request);
    if (!auth.isAuthorized) {
      return NextResponse.json({
        error: auth.error || 'Unauthorized access to performance operations'
      }, { status: 401 });
    }

    const { action } = await request.json();

    switch (action) {
      case 'reset_metrics':
        // Reset all performance metrics
        apiMetrics = {
          totalRequests: 0,
          totalResponseTime: 0,
          errors: 0,
          slowRequests: 0,
          lastReset: Date.now()
        };

        const pool = getConnectionPool();
        pool.resetMetrics();

        return NextResponse.json({
          success: true,
          message: 'Performance metrics reset successfully',
          timestamp: new Date().toISOString()
        });

      case 'invalidate_cache':
        // Invalidate all OPAL caches
        await cache.invalidateAll();

        return NextResponse.json({
          success: true,
          message: 'All caches invalidated successfully',
          timestamp: new Date().toISOString()
        });

      case 'warm_cache':
        // Warm up cache with frequently accessed data
        await warmUpCache();

        return NextResponse.json({
          success: true,
          message: 'Cache warmed up successfully',
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action specified'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('[Performance API] Error processing action:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to process performance action',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function testDatabaseHealth(): Promise<{ status: string; latency?: number; error?: string }> {
  const startTime = performance.now();

  try {
    const pool = getConnectionPool();
    await pool.withConnection(async (client) => {
      const { data, error } = await client
        .from('opal_mapping_configurations')
        .select('count')
        .limit(1);

      if (error) throw error;
    });

    const latency = performance.now() - startTime;
    return {
      status: latency < 100 ? 'healthy' : latency < 500 ? 'degraded' : 'unhealthy',
      latency: parseFloat(latency.toFixed(2))
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function calculateOptimizationMetrics(pool: any): Promise<{
  mappingLoadTime: number;
  rulesExecutionTime: number;
  coordinationLatency: number;
  cacheEffectiveness: number;
}> {
  // Test mapping configuration load time
  const mappingStart = performance.now();
  try {
    await pool.getMappingConfig('strategy-plans');
  } catch (error) {
    console.warn('Failed to test mapping load time:', error);
  }
  const mappingLoadTime = performance.now() - mappingStart;

  // Test rules execution time
  const rulesStart = performance.now();
  try {
    await pool.withConnection(async (client: any) => {
      const { data } = await client
        .from('personalization_rules')
        .select('*')
        .eq('is_active', true)
        .limit(5);
      return data;
    });
  } catch (error) {
    console.warn('Failed to test rules execution time:', error);
  }
  const rulesExecutionTime = performance.now() - rulesStart;

  // Test coordination latency
  const coordinationStart = performance.now();
  try {
    await pool.withConnection(async (client: any) => {
      const { data } = await client
        .from('cross_domain_coordination')
        .select('*')
        .eq('is_enabled', true)
        .limit(3);
      return data;
    });
  } catch (error) {
    console.warn('Failed to test coordination latency:', error);
  }
  const coordinationLatency = performance.now() - coordinationStart;

  // Calculate cache effectiveness (based on hit rate and performance)
  const cacheMetrics = cache.getCacheMetrics();
  const cacheEffectiveness = cacheMetrics.hitRate * (cacheMetrics.isConnected ? 1 : 0.5);

  return {
    mappingLoadTime: parseFloat(mappingLoadTime.toFixed(2)),
    rulesExecutionTime: parseFloat(rulesExecutionTime.toFixed(2)),
    coordinationLatency: parseFloat(coordinationLatency.toFixed(2)),
    cacheEffectiveness: parseFloat(cacheEffectiveness.toFixed(2))
  };
}

function updateApiMetrics(responseTime: number): void {
  apiMetrics.totalRequests++;
  apiMetrics.totalResponseTime += responseTime;

  if (responseTime > 1000) { // Slow request threshold: 1 second
    apiMetrics.slowRequests++;
  }
}

async function warmUpCache(): Promise<void> {
  try {
    const pool = getConnectionPool();

    // Pre-load frequently accessed mapping configurations
    const mappingTypes = ['strategy-plans', 'dxp-tools', 'analytics-insights', 'experience-optimization'];

    for (const mappingType of mappingTypes) {
      try {
        await pool.getMappingConfig(mappingType);
        console.log(`[Cache Warmup] Loaded mapping: ${mappingType}`);
      } catch (error) {
        console.warn(`[Cache Warmup] Failed to load mapping ${mappingType}:`, error);
      }
    }

    // Pre-load optimization metrics
    const domains = ['content', 'experimentation', 'personalization', 'ux', 'technology'];

    for (const domain of domains) {
      try {
        await pool.getOptimizationMetrics(domain, '24h');
        console.log(`[Cache Warmup] Loaded metrics: ${domain}`);
      } catch (error) {
        console.warn(`[Cache Warmup] Failed to load metrics ${domain}:`, error);
      }
    }

    console.log('[Cache Warmup] Cache warmup completed');
  } catch (error) {
    console.error('[Cache Warmup] Cache warmup failed:', error);
    throw error;
  }
}