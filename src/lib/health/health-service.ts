/**
 * Enhanced Health Service with Intelligent Caching and Fallback
 * Provides robust health checking with multiple layers of fallback
 */

import { fetchWithRetry, RetryPresets } from '@/lib/utils/fetch-with-retry';

export interface HealthData {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    database: HealthCheck;
    opal_api: HealthCheck;
    webhooks: HealthCheck;
    workflow_engine: HealthCheck;
  };
  metrics: {
    response_time_ms: number;
    error_rate_24h: number;
    last_sync_timestamp?: string;
    webhook_success_rate: number;
  };
  fallback_used: boolean;
  cache_age_ms?: number;
}

export interface HealthCheck {
  status: 'pass' | 'warn' | 'fail';
  response_time_ms?: number;
  last_check: string;
  details?: string;
  error?: string;
}

class HealthCache {
  private cache = new Map<string, { data: HealthData; timestamp: number }>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: HealthData): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  get(key: string): HealthData | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return {
      ...entry.data,
      cache_age_ms: age,
      fallback_used: true
    };
  }

  clear(): void {
    this.cache.clear();
  }
}

const healthCache = new HealthCache();

export class HealthService {
  private static instance: HealthService;
  private isChecking = false;

  static getInstance(): HealthService {
    if (!HealthService.instance) {
      HealthService.instance = new HealthService();
    }
    return HealthService.instance;
  }

  async getHealth(): Promise<HealthData> {
    // Return cached data if available and fresh
    const cached = healthCache.get('health');
    if (cached && !this.isChecking) {
      return cached;
    }

    // Prevent concurrent health checks
    if (this.isChecking) {
      const fallback = healthCache.get('health');
      if (fallback) return fallback;

      // Wait for ongoing check
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.getHealth();
    }

    this.isChecking = true;

    try {
      const healthData = await this.performHealthChecks();
      healthCache.set('health', healthData);
      return healthData;
    } catch (error) {
      console.error('Health check failed:', error);

      // Return cached data if available
      const fallback = healthCache.get('health');
      if (fallback) {
        return {
          ...fallback,
          status: 'degraded' as const,
          fallback_used: true
        };
      }

      // Last resort: return minimal health data
      return this.getMinimalHealthData();
    } finally {
      this.isChecking = false;
    }
  }

  private async performHealthChecks(): Promise<HealthData> {
    const startTime = Date.now();

    // Run all health checks in parallel
    const [
      databaseCheck,
      opalApiCheck,
      webhookCheck,
      workflowCheck
    ] = await Promise.allSettled([
      this.checkDatabase(),
      this.checkOpalApi(),
      this.checkWebhooks(),
      this.checkWorkflowEngine()
    ]);

    const checks = {
      database: this.getCheckResult(databaseCheck),
      opal_api: this.getCheckResult(opalApiCheck),
      webhooks: this.getCheckResult(webhookCheck),
      workflow_engine: this.getCheckResult(workflowCheck)
    };

    const metrics = await this.collectMetrics();
    const overallStatus = this.determineOverallStatus(checks, metrics);

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks,
      metrics: {
        ...metrics,
        response_time_ms: Date.now() - startTime
      },
      fallback_used: false
    };
  }

  private async checkDatabase(): Promise<HealthCheck> {
    const startTime = Date.now();
    try {
      // Simple database ping
      const result = await fetch('/api/health/database', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      return {
        status: result.ok ? 'pass' : 'fail',
        response_time_ms: Date.now() - startTime,
        last_check: new Date().toISOString(),
        details: result.ok ? 'Database responsive' : `HTTP ${result.status}`
      };
    } catch (error) {
      return {
        status: 'fail',
        response_time_ms: Date.now() - startTime,
        last_check: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async checkOpalApi(): Promise<HealthCheck> {
    const startTime = Date.now();
    try {
      const result = await fetchWithRetry(
        '/api/opal/discovery',
        {},
        { ...RetryPresets.healthCheck, timeout: 8000 }
      );

      return {
        status: result.success ? 'pass' : 'warn',
        response_time_ms: Date.now() - startTime,
        last_check: new Date().toISOString(),
        details: result.success ? 'OPAL API responsive' : result.error || 'API check failed'
      };
    } catch (error) {
      return {
        status: 'fail',
        response_time_ms: Date.now() - startTime,
        last_check: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async checkWebhooks(): Promise<HealthCheck> {
    const startTime = Date.now();
    try {
      const result = await fetch('/api/webhook-events/stats', {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });

      if (!result.ok) throw new Error(`HTTP ${result.status}`);

      const data = await result.json();
      const recentActivity = data.last_webhook_minutes_ago < 60; // Within 1 hour

      return {
        status: recentActivity ? 'pass' : 'warn',
        response_time_ms: Date.now() - startTime,
        last_check: new Date().toISOString(),
        details: recentActivity ? 'Recent webhook activity' : 'No recent webhook activity'
      };
    } catch (error) {
      return {
        status: 'fail',
        response_time_ms: Date.now() - startTime,
        last_check: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async checkWorkflowEngine(): Promise<HealthCheck> {
    const startTime = Date.now();
    try {
      const result = await fetch('/api/monitoring/workflow-status', {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });

      return {
        status: result.ok ? 'pass' : 'warn',
        response_time_ms: Date.now() - startTime,
        last_check: new Date().toISOString(),
        details: result.ok ? 'Workflow engine responsive' : 'Workflow engine issues'
      };
    } catch (error) {
      return {
        status: 'fail',
        response_time_ms: Date.now() - startTime,
        last_check: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async collectMetrics() {
    try {
      const [statsResponse, syncResponse] = await Promise.allSettled([
        fetch('/api/webhook-events/stats'),
        fetch('/api/monitoring/last-sync')
      ]);

      let error_rate_24h = 0;
      let webhook_success_rate = 0;
      let last_sync_timestamp: string | undefined;

      if (statsResponse.status === 'fulfilled' && statsResponse.value.ok) {
        const stats = await statsResponse.value.json();
        error_rate_24h = stats.error_rate_24h || 0;
        webhook_success_rate = stats.signature_valid_rate || 0;
      }

      if (syncResponse.status === 'fulfilled' && syncResponse.value.ok) {
        const sync = await syncResponse.value.json();
        last_sync_timestamp = sync.last_sync_timestamp;
      }

      return {
        error_rate_24h,
        webhook_success_rate,
        last_sync_timestamp
      };
    } catch (error) {
      console.error('Failed to collect metrics:', error);
      return {
        error_rate_24h: 0,
        webhook_success_rate: 0
      };
    }
  }

  private determineOverallStatus(
    checks: HealthData['checks'],
    metrics: Partial<HealthData['metrics']>
  ): 'healthy' | 'degraded' | 'unhealthy' {
    const checkStatuses = Object.values(checks).map(check => check.status);
    const failCount = checkStatuses.filter(status => status === 'fail').length;
    const warnCount = checkStatuses.filter(status => status === 'warn').length;

    // Critical systems failing
    if (failCount >= 2 || checks.database.status === 'fail') {
      return 'unhealthy';
    }

    // Some warnings or high error rate
    if (failCount >= 1 || warnCount >= 2 || (metrics.error_rate_24h && metrics.error_rate_24h > 0.1)) {
      return 'degraded';
    }

    return 'healthy';
  }

  private getCheckResult(settledResult: PromiseSettledResult<HealthCheck>): HealthCheck {
    if (settledResult.status === 'fulfilled') {
      return settledResult.value;
    } else {
      return {
        status: 'fail',
        last_check: new Date().toISOString(),
        error: 'Health check threw an error: ' + settledResult.reason
      };
    }
  }

  private getMinimalHealthData(): HealthData {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: { status: 'fail', last_check: new Date().toISOString(), error: 'No cached data available' },
        opal_api: { status: 'fail', last_check: new Date().toISOString(), error: 'No cached data available' },
        webhooks: { status: 'fail', last_check: new Date().toISOString(), error: 'No cached data available' },
        workflow_engine: { status: 'fail', last_check: new Date().toISOString(), error: 'No cached data available' }
      },
      metrics: {
        response_time_ms: 0,
        error_rate_24h: 1,
        webhook_success_rate: 0
      },
      fallback_used: true
    };
  }

  // Force refresh health data
  async forceRefresh(): Promise<HealthData> {
    healthCache.clear();
    return this.getHealth();
  }

  // Get cached health data if available
  getCached(): HealthData | null {
    return healthCache.get('health');
  }
}