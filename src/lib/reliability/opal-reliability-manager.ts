/**
 * OPAL Reliability Manager
 * Integrates retry logic, circuit breaker, caching, and alerting for robust OPAL operations
 */

import { withHttpRetry, RetryPresets, RetryResult } from './retry-handler';
import { CircuitBreaker, CircuitBreakerError } from './circuit-breaker';
import { getFallbackCache, CachedWorkflowData } from './fallback-cache';
import { getAlertingSystem, alertOPALFailure, alertCircuitBreakerOpened } from './alerting-system';

export interface OPALOperation {
  name: string;
  correlationId?: string;
  timeout?: number;
  critical?: boolean;
}

export interface ReliabilityResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  fromCache?: boolean;
  retryAttempts?: number;
  circuitState?: string;
  duration?: number;
  fallbackUsed?: boolean;
  alertTriggered?: boolean;
}

export interface OPALWebhookResult {
  success: boolean;
  workflow_id?: string;
  session_id?: string;
  correlation_id?: string;
  message?: string;
  polling_url?: string;
  duration_ms?: number;
}

export class OPALReliabilityManager {
  private circuitBreaker: CircuitBreaker;
  private fallbackCache = getFallbackCache();
  private alertingSystem = getAlertingSystem();

  constructor() {
    // Initialize circuit breaker for OPAL operations
    this.circuitBreaker = new CircuitBreaker({
      name: 'OPAL-API',
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 30000, // 30 seconds
      monitoringWindow: 300000, // 5 minutes
      onStateChange: (oldState, newState, reason) => {
        console.log(`🔄 [OPAL Reliability] Circuit breaker state: ${oldState} → ${newState} (${reason})`);

        if (newState === 'OPEN') {
          alertCircuitBreakerOpened('OPAL-API', reason, {
            previousState: oldState,
            failureThreshold: 3
          });
        }
      }
    });

    console.log(`🛡️ [OPAL Reliability] Manager initialized with comprehensive failure protection`);
  }

  /**
   * Execute OPAL webhook call with full reliability stack
   */
  async executeOPALWebhook(
    webhookUrl: string,
    payload: any,
    headers: Record<string, string>,
    operation: OPALOperation
  ): Promise<ReliabilityResult<OPALWebhookResult>> {
    const startTime = Date.now();
    let retryResult: RetryResult<OPALWebhookResult> | null = null;
    let circuitError: CircuitBreakerError | null = null;
    let alertTriggered = false;

    console.log(`🚀 [OPAL Reliability] Starting webhook call: ${operation.name}`, {
      correlation_id: operation.correlationId,
      url: webhookUrl,
      critical: operation.critical
    });

    try {
      // Execute through circuit breaker with retry logic
      const result = await this.circuitBreaker.execute(async () => {
        retryResult = await withHttpRetry(
          async () => {
            const response = await fetch(webhookUrl, {
              method: 'POST',
              headers,
              body: JSON.stringify(payload),
              signal: operation.timeout ? AbortSignal.timeout(operation.timeout) : undefined
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            return data as OPALWebhookResult;
          },
          {
            ...RetryPresets.opal,
            operationName: `OPAL Webhook: ${operation.name}`,
            correlationId: operation.correlationId,
            onRetry: (error, attempt, delay) => {
              // Alert on first retry for critical operations
              if (operation.critical && attempt === 1) {
                alertTriggered = true;
                alertOPALFailure(
                  `Critical OPAL operation failing: ${operation.name}`,
                  {
                    attempt,
                    error: error.message,
                    next_retry_in: delay,
                    webhook_url: webhookUrl
                  },
                  operation.correlationId
                );
              }
            }
          }
        );

        if (!retryResult.success) {
          throw retryResult.error || new Error('OPAL webhook failed after retries');
        }

        return retryResult.data!;
      });

      // Cache successful result
      if (result.success && result.workflow_id) {
        this.cacheSuccessfulWorkflow(result, operation);
      }

      const duration = Date.now() - startTime;

      console.log(`✅ [OPAL Reliability] Webhook call succeeded: ${operation.name}`, {
        correlation_id: operation.correlationId,
        duration,
        retryAttempts: retryResult?.attempts || 1,
        circuitState: this.circuitBreaker.getStats().state
      });

      return {
        success: true,
        data: result,
        retryAttempts: retryResult?.attempts || 1,
        circuitState: this.circuitBreaker.getStats().state,
        duration,
        alertTriggered
      };

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      const duration = Date.now() - startTime;

      // Check if it's a circuit breaker error
      if (err instanceof CircuitBreakerError) {
        circuitError = err;
        console.log(`🚫 [OPAL Reliability] Circuit breaker blocked: ${operation.name}`, {
          correlation_id: operation.correlationId,
          state: err.state,
          nextAttemptTime: err.nextAttemptTime
        });

        // Try to provide fallback data
        return this.handleFailureWithFallback(operation, err, duration, alertTriggered);
      }

      // Regular error - trigger alert
      if (!alertTriggered) {
        alertTriggered = true;
        alertOPALFailure(
          `OPAL webhook failed: ${operation.name}`,
          {
            error: err.message,
            retryAttempts: retryResult?.attempts || 0,
            duration,
            webhook_url: webhookUrl
          },
          operation.correlationId
        );
      }

      console.error(`❌ [OPAL Reliability] Webhook call failed: ${operation.name}`, {
        correlation_id: operation.correlationId,
        error: err.message,
        retryAttempts: retryResult?.attempts || 0,
        duration
      });

      // Try to provide fallback data
      return this.handleFailureWithFallback(operation, err, duration, alertTriggered);
    }
  }

  /**
   * Handle failure with fallback data from cache
   */
  private handleFailureWithFallback(
    operation: OPALOperation,
    error: Error,
    duration: number,
    alertTriggered: boolean
  ): ReliabilityResult<OPALWebhookResult> {
    // Try to get fallback data from cache
    const fallbackData = this.fallbackCache.generateFallbackData();

    if (fallbackData.hasData && fallbackData.lastSync) {
      console.log(`🔄 [OPAL Reliability] Using fallback data for: ${operation.name}`, {
        correlation_id: operation.correlationId,
        fallback_workflow: fallbackData.lastSync.workflowId,
        fallback_age: new Date().getTime() - new Date(fallbackData.lastSync.completedAt || fallbackData.lastSync.startedAt).getTime()
      });

      // Convert cached data to webhook result format
      const fallbackResult: OPALWebhookResult = {
        success: true,
        workflow_id: fallbackData.lastSync.workflowId,
        correlation_id: fallbackData.lastSync.correlationId,
        message: `Fallback data: ${fallbackData.message}`,
        duration_ms: fallbackData.lastSync.duration
      };

      return {
        success: true,
        data: fallbackResult,
        fromCache: true,
        fallbackUsed: true,
        duration,
        alertTriggered,
        circuitState: this.circuitBreaker.getStats().state
      };
    }

    // No fallback available
    return {
      success: false,
      error,
      duration,
      alertTriggered,
      circuitState: this.circuitBreaker.getStats().state
    };
  }

  /**
   * Cache successful workflow for fallback use
   */
  private cacheSuccessfulWorkflow(result: OPALWebhookResult, operation: OPALOperation): void {
    if (!result.workflow_id) return;

    const workflowData: Omit<CachedWorkflowData, 'cachedAt' | 'expiresAt'> = {
      workflowId: result.workflow_id,
      correlationId: result.correlation_id || operation.correlationId || result.workflow_id,
      status: 'initiated',
      progress: 10,
      startedAt: new Date().toISOString(),
      clientName: operation.name,
      workflowName: 'strategy_workflow',
      success: true,
      duration: result.duration_ms
    };

    this.fallbackCache.cacheWorkflow(result.workflow_id, workflowData);

    console.log(`💾 [OPAL Reliability] Cached successful workflow`, {
      workflow_id: result.workflow_id,
      correlation_id: workflowData.correlationId,
      operation: operation.name
    });
  }

  /**
   * Get system health status
   */
  getHealthStatus() {
    const circuitStats = this.circuitBreaker.getStats();
    const cacheStats = this.fallbackCache.getForceSyncStats();
    const alertStats = this.alertingSystem.getStats();

    const overallHealth = circuitStats.state === 'CLOSED' && alertStats.activeAlerts === 0 ? 'healthy' :
                          circuitStats.state === 'HALF_OPEN' ? 'degraded' : 'unhealthy';

    return {
      overallHealth,
      circuitBreaker: {
        state: circuitStats.state,
        failureCount: circuitStats.failureCount,
        successCount: circuitStats.successCount,
        uptimePercentage: circuitStats.uptimePercentage,
        nextAttemptTime: circuitStats.nextAttemptTime
      },
      cache: {
        hasLastSuccessful: cacheStats.hasLastSuccessful,
        recentSyncCount: cacheStats.recentSyncCount,
        successRate: cacheStats.totalSyncs > 0 ? (cacheStats.successfulSyncs / cacheStats.totalSyncs) * 100 : 0,
        averageDuration: cacheStats.averageDuration
      },
      alerting: {
        activeAlerts: alertStats.activeAlerts,
        totalAlerts: alertStats.totalAlerts,
        criticalAlerts: alertStats.by_severity?.critical || 0,
        highSeverityAlerts: alertStats.by_severity?.high || 0
      }
    };
  }

  /**
   * Get reliability metrics for monitoring
   */
  getMetrics() {
    const health = this.getHealthStatus();
    const alertStats = this.alertingSystem.getStats();

    return {
      timestamp: new Date().toISOString(),
      health: health.overallHealth,
      circuit_breaker_state: health.circuitBreaker.state,
      cache_hit_available: health.cache.hasLastSuccessful,
      active_alerts: health.alerting.activeAlerts,
      success_rate_percentage: health.cache.successRate,
      uptime_percentage: health.circuitBreaker.uptimePercentage,
      alert_categories: alertStats.by_category
    };
  }

  /**
   * Reset circuit breaker (for admin/recovery)
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker.reset();
    console.log(`🔄 [OPAL Reliability] Circuit breaker manually reset`);
  }

  /**
   * Clear cache (for admin/testing)
   */
  clearCache(): void {
    this.fallbackCache.clearAll();
    console.log(`🗑️ [OPAL Reliability] Cache manually cleared`);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts() {
    return this.alertingSystem.getActiveAlerts();
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string, reason?: string): boolean {
    return this.alertingSystem.resolveAlert(alertId, reason);
  }
}

// Global reliability manager instance
let globalReliabilityManager: OPALReliabilityManager | null = null;

/**
 * Get or create global OPAL reliability manager
 */
export function getOPALReliabilityManager(): OPALReliabilityManager {
  if (!globalReliabilityManager) {
    globalReliabilityManager = new OPALReliabilityManager();
  }
  return globalReliabilityManager;
}