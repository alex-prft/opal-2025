/**
 * Comprehensive Error Handling and Retry Logic for OPAL Monitoring
 * Implements circuit breaker pattern and exponential backoff for resilient monitoring
 */

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  exponentialBase: number;
  jitterFactor: number;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeoutMs: number;
  monitoringWindowMs: number;
}

export enum CircuitBreakerState {
  CLOSED = 'closed',     // Normal operation
  OPEN = 'open',         // Circuit tripped, failing fast
  HALF_OPEN = 'half_open' // Testing if service recovered
}

export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private successCount: number = 0;

  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.config.resetTimeoutMs) {
        this.state = CircuitBreakerState.HALF_OPEN;
        this.successCount = 0;
        console.log('🔄 [CircuitBreaker] Transitioning to HALF_OPEN state');
      } else {
        throw new Error('Circuit breaker is OPEN - failing fast');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= 3) { // Require 3 successes to close
        this.state = CircuitBreakerState.CLOSED;
        console.log('✅ [CircuitBreaker] Transitioning to CLOSED state');
      }
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.config.failureThreshold) {
      this.state = CircuitBreakerState.OPEN;
      console.error(`🚨 [CircuitBreaker] Transitioning to OPEN state after ${this.failures} failures`);
    }
  }

  getState(): CircuitBreakerState {
    return this.state;
  }

  getStats() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
      successCount: this.successCount
    };
  }
}

export class RetryHandler {
  constructor(private config: RetryConfig) {}

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string = 'operation'
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const result = await operation();
        if (attempt > 0) {
          console.log(`✅ [RetryHandler] ${context} succeeded on attempt ${attempt + 1}`);
        }
        return result;
      } catch (error) {
        lastError = error as Error;

        if (attempt === this.config.maxRetries) {
          console.error(`❌ [RetryHandler] ${context} failed after ${attempt + 1} attempts:`, lastError.message);
          break;
        }

        const delay = this.calculateDelay(attempt);
        console.warn(`⚠️ [RetryHandler] ${context} failed on attempt ${attempt + 1}, retrying in ${delay}ms:`, lastError.message);

        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  private calculateDelay(attempt: number): number {
    const exponentialDelay = this.config.baseDelayMs * Math.pow(this.config.exponentialBase, attempt);
    const jitter = exponentialDelay * this.config.jitterFactor * Math.random();
    const delayWithJitter = exponentialDelay + jitter;

    return Math.min(delayWithJitter, this.config.maxDelayMs);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export class MonitoringErrorHandler {
  private static instance: MonitoringErrorHandler;
  private databaseCircuitBreaker: CircuitBreaker;
  private webhookCircuitBreaker: CircuitBreaker;
  private retryHandler: RetryHandler;
  private errorMetrics: Map<string, { count: number; lastOccurrence: number }> = new Map();

  constructor() {
    // Database operations circuit breaker - more lenient
    this.databaseCircuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeoutMs: 30000, // 30 seconds
      monitoringWindowMs: 60000 // 1 minute
    });

    // Webhook processing circuit breaker - more strict
    this.webhookCircuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeoutMs: 60000, // 1 minute
      monitoringWindowMs: 300000 // 5 minutes
    });

    // Retry configuration with exponential backoff
    this.retryHandler = new RetryHandler({
      maxRetries: 3,
      baseDelayMs: 1000,
      maxDelayMs: 30000,
      exponentialBase: 2,
      jitterFactor: 0.1
    });
  }

  static getInstance(): MonitoringErrorHandler {
    if (!MonitoringErrorHandler.instance) {
      MonitoringErrorHandler.instance = new MonitoringErrorHandler();
    }
    return MonitoringErrorHandler.instance;
  }

  async executeDatabaseOperation<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    return this.databaseCircuitBreaker.execute(async () => {
      return this.retryHandler.executeWithRetry(operation, `DB:${context}`);
    });
  }

  async executeWebhookOperation<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    return this.webhookCircuitBreaker.execute(async () => {
      return this.retryHandler.executeWithRetry(operation, `Webhook:${context}`);
    });
  }

  /**
   * Handle and classify errors for monitoring purposes
   */
  handleError(error: Error, context: string, metadata?: any): void {
    const errorKey = `${context}:${error.name}`;
    const now = Date.now();

    // Update error metrics
    const existing = this.errorMetrics.get(errorKey);
    this.errorMetrics.set(errorKey, {
      count: (existing?.count || 0) + 1,
      lastOccurrence: now
    });

    // Log structured error information
    const logData = {
      context,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      metadata,
      timestamp: new Date(now).toISOString(),
      metrics: this.errorMetrics.get(errorKey)
    };

    if (this.isRetryableError(error)) {
      console.warn('⚠️ [MonitoringErrorHandler] Retryable error:', logData);
    } else {
      console.error('❌ [MonitoringErrorHandler] Non-retryable error:', logData);
    }

    // Check for error rate thresholds
    this.checkErrorRateThresholds(errorKey);
  }

  /**
   * Determine if an error is retryable
   */
  private isRetryableError(error: Error): boolean {
    const retryablePatterns = [
      /network/i,
      /timeout/i,
      /connection/i,
      /502|503|504/, // HTTP status codes
      /ECONNRESET/,
      /ENOTFOUND/,
      /ETIMEDOUT/
    ];

    const nonRetryablePatterns = [
      /401|403/, // Authentication/authorization errors
      /400/, // Bad request
      /validation/i,
      /permission/i
    ];

    const errorString = `${error.name} ${error.message}`;

    // Check non-retryable first
    if (nonRetryablePatterns.some(pattern => pattern.test(errorString))) {
      return false;
    }

    // Check retryable
    return retryablePatterns.some(pattern => pattern.test(errorString));
  }

  /**
   * Monitor error rates and alert if thresholds are exceeded
   */
  private checkErrorRateThresholds(errorKey: string): void {
    const metrics = this.errorMetrics.get(errorKey);
    if (!metrics) return;

    const fiveMinutesAgo = Date.now() - 300000;

    // Clean up old error entries
    for (const [key, metric] of this.errorMetrics.entries()) {
      if (metric.lastOccurrence < fiveMinutesAgo) {
        this.errorMetrics.delete(key);
      }
    }

    // Alert on high error rates
    if (metrics.count > 10) {
      console.error(`🚨 [MonitoringErrorHandler] High error rate detected for ${errorKey}: ${metrics.count} errors in 5 minutes`);
    }
  }

  /**
   * Get current error metrics for monitoring dashboard
   */
  getErrorMetrics() {
    return {
      database: this.databaseCircuitBreaker.getStats(),
      webhook: this.webhookCircuitBreaker.getStats(),
      errorCounts: Object.fromEntries(this.errorMetrics.entries())
    };
  }

  /**
   * Health check for monitoring system components
   */
  async performHealthCheck(): Promise<{
    overall: 'healthy' | 'degraded' | 'unhealthy';
    components: Record<string, { status: string; details?: any }>;
  }> {
    const components: Record<string, { status: string; details?: any }> = {};

    // Check circuit breaker states
    components.database = {
      status: this.databaseCircuitBreaker.getState() === CircuitBreakerState.CLOSED ? 'healthy' : 'degraded',
      details: this.databaseCircuitBreaker.getStats()
    };

    components.webhook = {
      status: this.webhookCircuitBreaker.getState() === CircuitBreakerState.CLOSED ? 'healthy' : 'degraded',
      details: this.webhookCircuitBreaker.getStats()
    };

    // Check recent error rates
    const recentErrors = Array.from(this.errorMetrics.values()).reduce((sum, metric) => sum + metric.count, 0);
    components.errorRate = {
      status: recentErrors > 20 ? 'unhealthy' : recentErrors > 5 ? 'degraded' : 'healthy',
      details: { recentErrorCount: recentErrors }
    };

    // Determine overall health
    const statuses = Object.values(components).map(c => c.status);
    const overall = statuses.includes('unhealthy') ? 'unhealthy'
      : statuses.includes('degraded') ? 'degraded'
      : 'healthy';

    return { overall, components };
  }

  /**
   * Reset circuit breakers (for manual intervention)
   */
  resetCircuitBreakers(): void {
    console.log('🔄 [MonitoringErrorHandler] Manually resetting circuit breakers');
    this.databaseCircuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeoutMs: 30000,
      monitoringWindowMs: 60000
    });
    this.webhookCircuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeoutMs: 60000,
      monitoringWindowMs: 300000
    });
  }
}

export const monitoringErrorHandler = MonitoringErrorHandler.getInstance();