/**
 * Performance Monitoring Middleware
 * Automatic performance tracking and optimization for all API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache/redis-cache';

interface RequestMetrics {
  path: string;
  method: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  statusCode?: number;
  userAgent?: string;
  ip?: string;
  cacheHit?: boolean;
  error?: string;
}

interface PerformanceThresholds {
  slow: number;
  critical: number;
  cacheableRoutes: RegExp[];
  excludeRoutes: RegExp[];
}

class PerformanceMonitor {
  private metrics: Map<string, RequestMetrics[]> = new Map();
  private thresholds: PerformanceThresholds;

  constructor() {
    this.thresholds = {
      slow: parseInt(process.env.SLOW_REQUEST_THRESHOLD || '1000'), // 1 second
      critical: parseInt(process.env.CRITICAL_REQUEST_THRESHOLD || '5000'), // 5 seconds
      cacheableRoutes: [
        /^\/api\/opal\/.*$/,
        /^\/api\/mappings\/.*$/,
        /^\/api\/rules\/.*$/,
        /^\/api\/metrics\/.*$/
      ],
      excludeRoutes: [
        /^\/api\/auth\/.*$/,
        /^\/api\/webhooks\/.*$/,
        /^\/api\/stream\/.*$/
      ]
    };
  }

  /**
   * Start monitoring a request
   */
  startRequest(request: NextRequest): RequestMetrics {
    const path = new URL(request.url).pathname;
    const method = request.method;

    const metrics: RequestMetrics = {
      path,
      method,
      startTime: performance.now(),
      userAgent: request.headers.get('user-agent') || undefined,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    };

    return metrics;
  }

  /**
   * Complete monitoring for a request
   */
  completeRequest(metrics: RequestMetrics, response: NextResponse, error?: Error): void {
    metrics.endTime = performance.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    metrics.statusCode = response.status;

    if (error) {
      metrics.error = error.message;
    }

    // Store metrics for analysis
    this.storeMetrics(metrics);

    // Log performance warnings
    this.logPerformanceWarnings(metrics);

    // Update cache metrics if applicable
    this.updateCacheMetrics(metrics);
  }

  /**
   * Check if a route should be cached
   */
  isCacheableRoute(path: string, method: string): boolean {
    if (method !== 'GET') return false;

    // Check if route should be excluded
    for (const exclude of this.thresholds.excludeRoutes) {
      if (exclude.test(path)) return false;
    }

    // Check if route is cacheable
    for (const cacheable of this.thresholds.cacheableRoutes) {
      if (cacheable.test(path)) return true;
    }

    return false;
  }

  /**
   * Generate cache key for a request
   */
  generateCacheKey(request: NextRequest): string {
    const url = new URL(request.url);
    const path = url.pathname;
    const searchParams = url.searchParams.toString();
    const authHeader = request.headers.get('authorization');

    // Include user context in cache key for personalized content
    const userContext = authHeader ? Buffer.from(authHeader).toString('base64').slice(0, 8) : 'anonymous';

    return `api:${path}:${searchParams}:${userContext}`;
  }

  /**
   * Try to serve response from cache
   */
  async tryServeFromCache(request: NextRequest): Promise<NextResponse | null> {
    const path = new URL(request.url).pathname;

    if (!this.isCacheableRoute(path, request.method)) {
      return null;
    }

    try {
      const cacheKey = this.generateCacheKey(request);
      const redisClient = cache.getClient();
      const cached = redisClient ? await redisClient.get(cacheKey) : null;

      if (cached) {
        const cachedResponse = JSON.parse(cached);

        console.log(`[Performance] Cache HIT for ${path} (${cacheKey})`);

        return NextResponse.json(cachedResponse.data, {
          status: cachedResponse.status,
          headers: {
            'x-cache': 'HIT',
            'x-cache-key': cacheKey,
            'content-type': 'application/json',
            'cache-control': 'public, max-age=300'
          }
        });
      }
    } catch (error) {
      console.warn('[Performance] Cache read error:', error);
    }

    return null;
  }

  /**
   * Cache a successful response
   */
  async cacheResponse(
    request: NextRequest,
    response: NextResponse,
    ttl: number = 300
  ): Promise<void> {
    const path = new URL(request.url).pathname;

    if (!this.isCacheableRoute(path, request.method) || response.status !== 200) {
      return;
    }

    try {
      const cacheKey = this.generateCacheKey(request);

      // Clone response to read body without consuming it
      const responseClone = response.clone();
      const responseData = await responseClone.json();

      const cacheValue = {
        data: responseData,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        cachedAt: new Date().toISOString()
      };

      const redisClient = cache.getClient();
      if (redisClient) {
        await redisClient.setex(cacheKey, ttl, JSON.stringify(cacheValue));
      }

      console.log(`[Performance] Cached response for ${path} (TTL: ${ttl}s)`);

      // Add cache headers to original response
      response.headers.set('x-cache', 'MISS');
      response.headers.set('x-cache-key', cacheKey);

    } catch (error) {
      console.warn('[Performance] Cache write error:', error);
    }
  }

  /**
   * Store request metrics for analysis
   */
  private storeMetrics(metrics: RequestMetrics): void {
    const key = `${metrics.method}:${metrics.path}`;

    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }

    const routeMetrics = this.metrics.get(key)!;
    routeMetrics.push(metrics);

    // Keep only last 100 requests per route to prevent memory bloat
    if (routeMetrics.length > 100) {
      routeMetrics.shift();
    }

    // Periodically store metrics in cache for persistence
    this.persistMetricsToCache(metrics);
  }

  /**
   * Log performance warnings
   */
  private logPerformanceWarnings(metrics: RequestMetrics): void {
    if (!metrics.duration) return;

    if (metrics.duration > this.thresholds.critical) {
      console.error(`[Performance] CRITICAL: ${metrics.method} ${metrics.path} took ${metrics.duration.toFixed(2)}ms`);
    } else if (metrics.duration > this.thresholds.slow) {
      console.warn(`[Performance] SLOW: ${metrics.method} ${metrics.path} took ${metrics.duration.toFixed(2)}ms`);
    }

    if (metrics.error) {
      console.error(`[Performance] ERROR: ${metrics.method} ${metrics.path} - ${metrics.error}`);
    }
  }

  /**
   * Update cache-related metrics
   */
  private updateCacheMetrics(metrics: RequestMetrics): void {
    if (metrics.cacheHit) {
      console.log(`[Performance] Cache hit improved response time for ${metrics.path}`);
    }
  }

  /**
   * Persist metrics to cache for long-term storage
   */
  private async persistMetricsToCache(metrics: RequestMetrics): Promise<void> {
    try {
      const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const key = `metrics:daily:${date}:${metrics.method}:${metrics.path}`;

      const redisClient = cache.getClient();
      if (redisClient) {
        await redisClient.lpush(key, JSON.stringify(metrics));
        await redisClient.expire(key, 86400 * 7); // Keep for 7 days
      }

    } catch (error) {
      console.warn('[Performance] Failed to persist metrics:', error);
    }
  }

  /**
   * Get aggregated metrics for a route
   */
  getRouteMetrics(method: string, path: string): {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    slowRequests: number;
    recentRequests: RequestMetrics[];
  } {
    const key = `${method}:${path}`;
    const routeMetrics = this.metrics.get(key) || [];

    const totalRequests = routeMetrics.length;
    const totalTime = routeMetrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    const errorCount = routeMetrics.filter(m => m.error || (m.statusCode && m.statusCode >= 400)).length;
    const slowCount = routeMetrics.filter(m => (m.duration || 0) > this.thresholds.slow).length;

    return {
      totalRequests,
      averageResponseTime: totalRequests > 0 ? totalTime / totalRequests : 0,
      errorRate: totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0,
      slowRequests: slowCount,
      recentRequests: routeMetrics.slice(-10) // Last 10 requests
    };
  }

  /**
   * Get overall performance summary
   */
  getPerformanceSummary(): {
    totalRoutes: number;
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    cacheHitRate: number;
    slowestRoutes: Array<{ route: string; avgTime: number; requests: number }>;
  } {
    let totalRequests = 0;
    let totalTime = 0;
    let totalErrors = 0;
    let totalCacheHits = 0;

    const routePerformance: Array<{ route: string; avgTime: number; requests: number }> = [];

    for (const [route, metrics] of this.metrics.entries()) {
      const routeTotal = metrics.length;
      const routeTime = metrics.reduce((sum, m) => sum + (m.duration || 0), 0);
      const routeErrors = metrics.filter(m => m.error || (m.statusCode && m.statusCode >= 400)).length;
      const routeCacheHits = metrics.filter(m => m.cacheHit).length;

      totalRequests += routeTotal;
      totalTime += routeTime;
      totalErrors += routeErrors;
      totalCacheHits += routeCacheHits;

      routePerformance.push({
        route,
        avgTime: routeTotal > 0 ? routeTime / routeTotal : 0,
        requests: routeTotal
      });
    }

    // Sort by average response time (slowest first)
    const slowestRoutes = routePerformance
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 5);

    return {
      totalRoutes: this.metrics.size,
      totalRequests,
      averageResponseTime: totalRequests > 0 ? totalTime / totalRequests : 0,
      errorRate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0,
      cacheHitRate: totalRequests > 0 ? (totalCacheHits / totalRequests) * 100 : 0,
      slowestRoutes
    };
  }

  /**
   * Clear all metrics (useful for testing or reset)
   */
  clearMetrics(): void {
    this.metrics.clear();
    console.log('[Performance] All metrics cleared');
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Middleware wrapper for automatic performance monitoring
 */
export function withPerformanceMonitoring(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Start monitoring
    const metrics = performanceMonitor.startRequest(request);

    // Try to serve from cache first
    const cachedResponse = await performanceMonitor.tryServeFromCache(request);
    if (cachedResponse) {
      metrics.cacheHit = true;
      performanceMonitor.completeRequest(metrics, cachedResponse);
      return cachedResponse;
    }

    let response: NextResponse;
    let error: Error | undefined;

    try {
      // Execute the handler
      response = await handler(request);

      // Cache successful responses
      if (response.status === 200) {
        await performanceMonitor.cacheResponse(request, response);
      }

    } catch (err) {
      error = err instanceof Error ? err : new Error('Unknown error');
      response = NextResponse.json({
        success: false,
        error: 'Internal server error'
      }, { status: 500 });
    }

    // Complete monitoring
    performanceMonitor.completeRequest(metrics, response, error);

    return response;
  };
}