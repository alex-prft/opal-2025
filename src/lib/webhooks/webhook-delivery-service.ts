/**
 * Professional Webhook Delivery Service with Retry Logic
 *
 * Enterprise-grade webhook delivery system with exponential backoff,
 * comprehensive retry handling, and OSA integration for monitoring.
 */

import { prometheusMetrics } from '@/lib/monitoring/prometheus-metrics';

// ============================================================================
// WEBHOOK DELIVERY INTERFACES & TYPES
// ============================================================================

export interface WebhookAttempt {
  attempt_number: number;
  timestamp: string;
  url: string;
  request_headers: Record<string, string>;
  request_body: any;
  response_status?: number;
  response_headers?: Record<string, string>;
  response_body?: any;
  response_time_ms?: number;
  error_message?: string;
  network_error?: boolean;
}

export interface WebhookDeliveryResult {
  webhook_id: string;
  success: boolean;
  attempts: WebhookAttempt[];
  final_status?: number;
  total_duration_ms: number;
  error_message?: string;
}

export interface WebhookDeliveryConfig {
  max_attempts: number;
  initial_delay_ms: number;
  max_delay_ms: number;
  backoff_factor: number;
  timeout_ms: number;
  success_codes: number[];
  retry_codes: number[];
  jitter_factor: number;
}

export interface WebhookContext {
  webhook_id: string;
  agent_id?: string;
  workflow_id?: string;
  event_type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
}

// ============================================================================
// WEBHOOK DELIVERY CONFIGURATION
// ============================================================================

export const WEBHOOK_DELIVERY_CONFIG: WebhookDeliveryConfig = {
  max_attempts: 5,
  initial_delay_ms: 1000,        // 1 second
  max_delay_ms: 300000,          // 5 minutes
  backoff_factor: 2,             // Exponential backoff
  timeout_ms: 30000,             // 30 second timeout per attempt
  success_codes: [200, 201, 202, 204],
  retry_codes: [408, 429, 500, 502, 503, 504, 520, 521, 522, 523, 524],
  jitter_factor: 0.1             // 10% jitter
};

// ============================================================================
// WEBHOOK DELIVERY SERVICE
// ============================================================================

export class WebhookDeliveryService {
  private config: WebhookDeliveryConfig;

  constructor(config: Partial<WebhookDeliveryConfig> = {}) {
    this.config = { ...WEBHOOK_DELIVERY_CONFIG, ...config };
    console.log('🔗 [WebhookDelivery] Service initialized with enterprise retry logic');
  }

  /**
   * Your original deliverWebhook method - enhanced with comprehensive error handling
   */
  async deliverWebhook(
    webhookId: string,
    url: string,
    payload: any,
    headers: Record<string, string> = {}
  ): Promise<WebhookDeliveryResult> {
    console.log(`🔗 [WebhookDelivery] Starting delivery for webhook ${webhookId} to ${url}`);

    const startTime = Date.now();
    const attempts: WebhookAttempt[] = [];
    let currentDelay = this.config.initial_delay_ms;

    for (let attemptNumber = 1; attemptNumber <= this.config.max_attempts; attemptNumber++) {
      console.log(`🔗 [WebhookDelivery] Attempt ${attemptNumber}/${this.config.max_attempts} for webhook ${webhookId}`);

      const attempt = await this.attemptWebhookDelivery(
        webhookId,
        url,
        payload,
        headers,
        attemptNumber
      );

      attempts.push(attempt);

      if (attempt.response_status &&
          this.config.success_codes.includes(attempt.response_status)) {
        await this.recordSuccessfulDelivery(webhookId, attempts);

        const totalDuration = Date.now() - startTime;
        console.log(`✅ [WebhookDelivery] Webhook ${webhookId} delivered successfully in ${totalDuration}ms after ${attemptNumber} attempts`);

        return {
          webhook_id: webhookId,
          success: true,
          attempts,
          final_status: attempt.response_status,
          total_duration_ms: totalDuration
        };
      }

      // Check if we should retry based on status code
      if (attempt.response_status && !this.shouldRetry(attempt.response_status)) {
        console.log(`❌ [WebhookDelivery] Non-retryable status ${attempt.response_status} for webhook ${webhookId}`);
        break;
      }

      if (attemptNumber < this.config.max_attempts) {
        const delay = Math.min(
          currentDelay * this.config.backoff_factor + this.getJitter(),
          this.config.max_delay_ms
        );
        currentDelay = delay;

        console.log(`⏳ [WebhookDelivery] Waiting ${delay}ms before retry ${attemptNumber + 1} for webhook ${webhookId}`);
        await this.sleep(delay);
      }
    }

    await this.handleWebhookFailure(webhookId, attempts, payload);

    const totalDuration = Date.now() - startTime;
    console.log(`❌ [WebhookDelivery] Webhook ${webhookId} failed after ${attempts.length} attempts in ${totalDuration}ms`);

    return {
      webhook_id: webhookId,
      success: false,
      attempts,
      final_status: attempts[attempts.length - 1].response_status,
      total_duration_ms: totalDuration,
      error_message: 'All delivery attempts failed'
    };
  }

  /**
   * Attempt single webhook delivery with comprehensive error handling
   */
  private async attemptWebhookDelivery(
    webhookId: string,
    url: string,
    payload: any,
    headers: Record<string, string>,
    attemptNumber: number
  ): Promise<WebhookAttempt> {
    const attemptStart = Date.now();
    const timestamp = new Date().toISOString();

    const requestHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': 'OSA-WebhookDelivery/1.0',
      'X-Webhook-ID': webhookId,
      'X-Attempt-Number': attemptNumber.toString(),
      'X-Timestamp': timestamp,
      ...headers
    };

    const attempt: WebhookAttempt = {
      attempt_number: attemptNumber,
      timestamp,
      url,
      request_headers: requestHeaders,
      request_body: payload
    };

    try {
      console.log(`🔗 [WebhookDelivery] HTTP ${url} attempt ${attemptNumber} starting`);

      // Use AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout_ms);

      const response = await fetch(url, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const responseTime = Date.now() - attemptStart;
      const responseBody = await this.safeParseResponse(response);

      attempt.response_status = response.status;
      attempt.response_headers = Object.fromEntries(response.headers.entries());
      attempt.response_body = responseBody;
      attempt.response_time_ms = responseTime;

      // Record metrics
      prometheusMetrics.recordWebhookProcessing(
        webhookId,
        response.ok ? 'success' : 'error',
        responseTime,
        'opal',
        JSON.stringify(payload).length
      );

      console.log(`🔗 [WebhookDelivery] HTTP ${response.status} from ${url} in ${responseTime}ms`);

      return attempt;

    } catch (error: any) {
      const responseTime = Date.now() - attemptStart;

      attempt.response_time_ms = responseTime;
      attempt.network_error = true;

      if (error.name === 'AbortError') {
        attempt.error_message = `Request timeout after ${this.config.timeout_ms}ms`;
        console.log(`⏰ [WebhookDelivery] Timeout for ${url} after ${this.config.timeout_ms}ms`);
      } else {
        attempt.error_message = error.message || 'Network error';
        console.log(`🌐 [WebhookDelivery] Network error for ${url}: ${error.message}`);
      }

      // Record error metrics
      prometheusMetrics.recordWebhookProcessing(
        webhookId,
        'error',
        responseTime,
        'opal',
        JSON.stringify(payload).length
      );

      return attempt;
    }
  }

  /**
   * Safely parse response body without throwing
   */
  private async safeParseResponse(response: Response): Promise<any> {
    try {
      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        return await response.json();
      } else {
        const text = await response.text();
        return text || null;
      }
    } catch (error) {
      console.log(`⚠️ [WebhookDelivery] Failed to parse response body: ${error}`);
      return null;
    }
  }

  /**
   * Record successful webhook delivery
   */
  private async recordSuccessfulDelivery(webhookId: string, attempts: WebhookAttempt[]): Promise<void> {
    try {
      const successfulAttempt = attempts[attempts.length - 1];
      const totalDuration = attempts.reduce((sum, a) => sum + (a.response_time_ms || 0), 0);

      console.log(`✅ [WebhookDelivery] Recording success for webhook ${webhookId} - ${attempts.length} attempts, ${totalDuration}ms total`);

      // Record metrics for successful delivery
      prometheusMetrics.recordAPIRequest(
        'POST',
        '/webhook/delivery',
        200,
        totalDuration,
        'webhook-delivery-service'
      );

      // Could integrate with database logging here
      // await this.webhookLogService.logSuccess(webhookId, attempts);

    } catch (error) {
      console.error(`❌ [WebhookDelivery] Failed to record success for webhook ${webhookId}:`, error);
    }
  }

  /**
   * Handle webhook delivery failure with comprehensive logging
   */
  private async handleWebhookFailure(
    webhookId: string,
    attempts: WebhookAttempt[],
    originalPayload: any
  ): Promise<void> {
    try {
      const lastAttempt = attempts[attempts.length - 1];
      const totalDuration = attempts.reduce((sum, a) => sum + (a.response_time_ms || 0), 0);

      console.error(`❌ [WebhookDelivery] All attempts failed for webhook ${webhookId}`);
      console.error(`❌ [WebhookDelivery] Final status: ${lastAttempt.response_status || 'Network Error'}`);
      console.error(`❌ [WebhookDelivery] Total duration: ${totalDuration}ms`);
      console.error(`❌ [WebhookDelivery] Attempts: ${attempts.length}`);

      // Record failure metrics
      prometheusMetrics.recordAPIRequest(
        'POST',
        '/webhook/delivery',
        lastAttempt.response_status || 500,
        totalDuration,
        'webhook-delivery-service'
      );

      // Record compliance violation for failed critical webhooks
      if (this.isCriticalWebhook(originalPayload)) {
        prometheusMetrics.recordComplianceViolation(
          'webhook_delivery_failure',
          'high',
          'opal_sla'
        );
      }

      // Could integrate with dead letter queue here
      // await this.deadLetterService.enqueue(webhookId, originalPayload, attempts);

    } catch (error) {
      console.error(`❌ [WebhookDelivery] Failed to handle failure for webhook ${webhookId}:`, error);
    }
  }

  /**
   * Generate jitter for exponential backoff
   */
  private getJitter(): number {
    const jitterRange = this.config.initial_delay_ms * this.config.jitter_factor;
    return Math.random() * jitterRange * 2 - jitterRange;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Determine if status code should trigger retry
   */
  private shouldRetry(statusCode: number): boolean {
    // Don't retry client errors (4xx) except specific ones
    if (statusCode >= 400 && statusCode < 500) {
      return this.config.retry_codes.includes(statusCode);
    }

    // Retry all server errors (5xx)
    if (statusCode >= 500) {
      return true;
    }

    return false;
  }

  /**
   * Check if webhook is critical for compliance
   */
  private isCriticalWebhook(payload: any): boolean {
    return payload?.priority === 'critical' ||
           payload?.event_type === 'compliance_audit' ||
           payload?.agent_id === 'compliance_monitor';
  }

  // ============================================================================
  // BATCH DELIVERY & ADVANCED OPERATIONS
  // ============================================================================

  /**
   * Deliver multiple webhooks concurrently with rate limiting
   */
  async deliverBatch(
    webhooks: Array<{
      webhook_id: string;
      url: string;
      payload: any;
      headers?: Record<string, string>;
    }>,
    concurrency: number = 5
  ): Promise<WebhookDeliveryResult[]> {
    console.log(`🔗 [WebhookDelivery] Starting batch delivery of ${webhooks.length} webhooks`);

    const results: WebhookDeliveryResult[] = [];
    const batches = this.chunkArray(webhooks, concurrency);

    for (const batch of batches) {
      const batchPromises = batch.map(webhook =>
        this.deliverWebhook(
          webhook.webhook_id,
          webhook.url,
          webhook.payload,
          webhook.headers || {}
        )
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`🔗 [WebhookDelivery] Batch complete: ${successCount}/${webhooks.length} successful`);

    return results;
  }

  /**
   * Delivery with context for enhanced monitoring
   */
  async deliverWithContext(
    context: WebhookContext,
    url: string,
    payload: any,
    headers: Record<string, string> = {}
  ): Promise<WebhookDeliveryResult> {
    const enhancedHeaders = {
      ...headers,
      'X-Agent-ID': context.agent_id || 'unknown',
      'X-Workflow-ID': context.workflow_id || 'unknown',
      'X-Event-Type': context.event_type,
      'X-Priority': context.priority
    };

    return this.deliverWebhook(
      context.webhook_id,
      url,
      payload,
      enhancedHeaders
    );
  }

  /**
   * Test webhook endpoint connectivity
   */
  async testEndpoint(url: string): Promise<{
    reachable: boolean;
    response_time_ms?: number;
    status_code?: number;
    error_message?: string;
  }> {
    const startTime = Date.now();

    try {
      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'OSA-WebhookDelivery/1.0-HealthCheck'
        }
      });

      return {
        reachable: true,
        response_time_ms: Date.now() - startTime,
        status_code: response.status
      };

    } catch (error: any) {
      return {
        reachable: false,
        response_time_ms: Date.now() - startTime,
        error_message: error.message
      };
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Split array into chunks for batch processing
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Get delivery statistics
   */
  getConfig(): WebhookDeliveryConfig {
    return { ...this.config };
  }

  /**
   * Update configuration at runtime
   */
  updateConfig(updates: Partial<WebhookDeliveryConfig>): void {
    this.config = { ...this.config, ...updates };
    console.log(`🔗 [WebhookDelivery] Configuration updated:`, updates);
  }
}

// Export singleton instance for convenience
export const webhookDeliveryService = new WebhookDeliveryService();

// ============================================================================
// CONVENIENCE DECORATORS
// ============================================================================

/**
 * Decorator for automatic webhook delivery with retry
 */
export function DeliverWebhook(url: string, options: Partial<WebhookDeliveryConfig> = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await method.apply(this, args);

      // Deliver webhook with result as payload
      const webhookId = `${target.constructor.name}_${propertyName}_${Date.now()}`;

      await webhookDeliveryService.deliverWebhook(
        webhookId,
        url,
        {
          method: propertyName,
          class: target.constructor.name,
          result,
          timestamp: new Date().toISOString()
        }
      );

      return result;
    };
  };
}