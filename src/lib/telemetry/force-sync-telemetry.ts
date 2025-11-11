/**
 * Force Sync Telemetry & Logging
 *
 * Comprehensive telemetry wrapper for Force Sync operations that:
 * - Creates telemetry spans with proper context
 * - Logs requests/responses (excluding secrets)
 * - Persists attempts to database
 * - Emits orchestrator events
 * - Provides visual logging for admin panel
 */

import { generateEventId, generateCorrelationId, createEventMetadata } from '@/lib/events/schemas';
import { publishEvent } from '@/lib/events/event-bus';
import { workflowDb } from '@/lib/database/workflow-operations';

export interface ForceSyncRequest {
  sync_scope: 'all_platforms' | 'priority_platforms' | 'specific_platform';
  include_rag_update: boolean;
  triggered_by: 'manual_user_request' | 'api_call' | 'scheduled_sync';
  client_context: {
    client_name?: string;
    industry?: string;
    recipients?: string[];
  };
  metadata?: Record<string, any>;
}

export interface ForceSyncResponse {
  success: boolean;
  sync_id: string;
  session_id: string;
  message: string;
  polling_url?: string;
  sync_details: {
    scope: string;
    platforms_included: string[];
    rag_update_enabled: boolean;
    estimated_duration: string;
    triggered_by: string;
    sync_timestamp: string;
    external_opal: {
      triggered: boolean;
      workflow_id?: string;
      session_id?: string;
      message: string;
      polling_url?: string;
    };
  };
}

export interface ForceSyncTelemetrySpan {
  span_id: string;
  correlation_id: string;
  start_time: Date;
  end_time?: Date;
  success?: boolean;
  error?: string;
  metrics: {
    request_size_bytes: number;
    response_size_bytes?: number;
    duration_ms?: number;
    internal_workflow_time_ms?: number;
    external_webhook_time_ms?: number;
  };
}

/**
 * Creates and manages a telemetry span for Force Sync operations
 */
export class ForceSyncTelemetryManager {
  private span: ForceSyncTelemetrySpan;
  private request: ForceSyncRequest;
  private sanitizedRequest: any;

  constructor(request: ForceSyncRequest) {
    this.request = request;
    this.span = {
      span_id: generateEventId(),
      correlation_id: generateCorrelationId(),
      start_time: new Date(),
      metrics: {
        request_size_bytes: this.calculateRequestSize(request)
      }
    };

    // Create sanitized request (remove secrets)
    this.sanitizedRequest = this.sanitizeRequest(request);
  }

  /**
   * Starts the telemetry span and emits orchestrator.workflow.started event
   */
  async startSpan(): Promise<void> {
    console.log(`🔄 [Force Sync Telemetry] Starting span ${this.span.span_id}`, {
      correlation_id: this.span.correlation_id,
      sync_scope: this.request.sync_scope,
      client: this.request.client_context.client_name || 'Unknown'
    });

    // Emit orchestrator.workflow.started event
    await publishEvent({
      event_type: 'orchestration.workflow_started@1',
      event_id: generateEventId(),
      correlation_id: this.span.correlation_id,
      timestamp: new Date().toISOString(),
      version: 1,
      workflow_id: this.span.span_id,
      trigger_source: this.mapTriggerSource(this.request.triggered_by),
      sync_scope: this.request.sync_scope,
      client_context: this.request.client_context,
      metadata: createEventMetadata(
        this.span.span_id,
        undefined,
        'force-sync-telemetry',
        {
          span_id: this.span.span_id,
          estimated_duration_ms: this.estimateDuration(this.request.sync_scope),
          platforms_count: this.getPlatformCount(this.request.sync_scope)
        }
      )
    });

    // Log to database
    await this.persistAttemptStart();

    // Emit visual log event for admin panel
    await this.emitVisualLog('started', {
      message: `Force Sync started: ${this.request.sync_scope}`,
      details: this.sanitizedRequest
    });
  }

  /**
   * Records internal workflow metrics
   */
  recordInternalWorkflowMetrics(duration_ms: number): void {
    this.span.metrics.internal_workflow_time_ms = duration_ms;
  }

  /**
   * Records external webhook metrics
   */
  recordExternalWebhookMetrics(duration_ms: number): void {
    this.span.metrics.external_webhook_time_ms = duration_ms;
  }

  /**
   * Completes the telemetry span successfully
   */
  async completeSpan(response: ForceSyncResponse): Promise<void> {
    this.span.end_time = new Date();
    this.span.success = true;
    this.span.metrics.duration_ms = this.span.end_time.getTime() - this.span.start_time.getTime();
    this.span.metrics.response_size_bytes = this.calculateResponseSize(response);

    console.log(`✅ [Force Sync Telemetry] Completed span ${this.span.span_id}`, {
      duration_ms: this.span.metrics.duration_ms,
      success: this.span.success,
      external_opal_triggered: response.sync_details.external_opal.triggered
    });

    // Emit orchestrator.workflow.completed event
    await publishEvent({
      event_type: 'orchestration.workflow_completed@1',
      event_id: generateEventId(),
      correlation_id: this.span.correlation_id,
      timestamp: new Date().toISOString(),
      version: 1,
      workflow_id: this.span.span_id,
      success: true,
      agent_results: [{
        agent_id: 'internal_workflow',
        agent_name: 'Internal Workflow Engine',
        success: true,
        execution_time_ms: this.span.metrics.internal_workflow_time_ms || 0,
        results: { sync_id: response.sync_id }
      }, {
        agent_id: 'external_opal_webhook',
        agent_name: 'External OPAL Webhook',
        success: response.sync_details.external_opal.triggered,
        execution_time_ms: this.span.metrics.external_webhook_time_ms || 0,
        results: response.sync_details.external_opal
      }],
      total_execution_time_ms: this.span.metrics.duration_ms,
      metadata: createEventMetadata(
        this.span.span_id,
        undefined,
        'force-sync-telemetry',
        {
          span_id: this.span.span_id,
          failed_agents: response.sync_details.external_opal.triggered ? [] : ['external_opal_webhook'],
          success_rate: response.sync_details.external_opal.triggered ? 1.0 : 0.5,
          total_agents: 2
        }
      )
    });

    // Update database record
    await this.persistAttemptCompletion(response);

    // Emit visual log event for admin panel
    await this.emitVisualLog('completed', {
      message: `Force Sync completed: ${response.message}`,
      details: {
        duration_ms: this.span.metrics.duration_ms,
        external_opal_triggered: response.sync_details.external_opal.triggered,
        platforms: response.sync_details.platforms_included.length
      }
    });
  }

  /**
   * Handles span failure and emits failure events
   */
  async failSpan(error: Error): Promise<void> {
    this.span.end_time = new Date();
    this.span.success = false;
    this.span.error = error.message;
    this.span.metrics.duration_ms = this.span.end_time.getTime() - this.span.start_time.getTime();

    console.error(`❌ [Force Sync Telemetry] Failed span ${this.span.span_id}`, {
      duration_ms: this.span.metrics.duration_ms,
      error: error.message
    });

    // Emit orchestrator.workflow.failed event
    await publishEvent({
      event_type: 'orchestration.workflow_failed@1',
      event_id: generateEventId(),
      correlation_id: this.span.correlation_id,
      timestamp: new Date().toISOString(),
      version: 1,
      workflow_id: this.span.span_id,
      failure_reason: error.message,
      failed_at_stage: 'force_sync_execution',
      partial_results: [],
      metadata: createEventMetadata(
        this.span.span_id,
        undefined,
        'force-sync-telemetry',
        {
          span_id: this.span.span_id,
          error_code: 'FORCE_SYNC_FAILED',
          retry_scheduled: false,
          fallback_triggered: false
        }
      )
    });

    // Update database record
    await this.persistAttemptFailure(error);

    // Emit visual log event for admin panel
    await this.emitVisualLog('failed', {
      message: `Force Sync failed: ${error.message}`,
      details: {
        duration_ms: this.span.metrics.duration_ms,
        error: error.message,
        stack: error.stack?.substring(0, 500) // Truncate stack trace
      }
    });
  }

  /**
   * Removes sensitive information from request
   */
  private sanitizeRequest(request: ForceSyncRequest): any {
    return {
      sync_scope: request.sync_scope,
      include_rag_update: request.include_rag_update,
      triggered_by: request.triggered_by,
      client_context: {
        client_name: request.client_context.client_name,
        industry: request.client_context.industry,
        recipients_count: request.client_context.recipients?.length || 0
        // Note: Actual email addresses excluded for privacy
      },
      metadata_keys: request.metadata ? Object.keys(request.metadata) : []
    };
  }

  /**
   * Calculates request size in bytes
   */
  private calculateRequestSize(request: ForceSyncRequest): number {
    return new TextEncoder().encode(JSON.stringify(request)).length;
  }

  /**
   * Calculates response size in bytes
   */
  private calculateResponseSize(response: ForceSyncResponse): number {
    return new TextEncoder().encode(JSON.stringify(response)).length;
  }

  /**
   * Maps trigger source to orchestrator event format
   */
  private mapTriggerSource(trigger: string): "force_sync" | "scheduled" | "api" | "webhook" {
    switch (trigger) {
      case 'manual_user_request': return 'force_sync';
      case 'api_call': return 'api';
      case 'scheduled_sync': return 'scheduled';
      default: return 'api';
    }
  }

  /**
   * Estimates duration based on sync scope
   */
  private estimateDuration(scope: string): number {
    switch (scope) {
      case 'all_platforms': return 600000; // 10 minutes
      case 'priority_platforms': return 360000; // 6 minutes
      case 'specific_platform': return 180000; // 3 minutes
      default: return 360000;
    }
  }

  /**
   * Gets platform count based on scope
   */
  private getPlatformCount(scope: string): number {
    switch (scope) {
      case 'all_platforms': return 7; // All DXP platforms
      case 'priority_platforms': return 4; // Core platforms
      case 'specific_platform': return 1; // Single platform
      default: return 4;
    }
  }

  /**
   * Persists attempt start to database
   */
  private async persistAttemptStart(): Promise<void> {
    try {
      await workflowDb.createForceSyncAttempt({
        span_id: this.span.span_id,
        correlation_id: this.span.correlation_id,
        started_at: this.span.start_time,
        sync_scope: this.request.sync_scope,
        triggered_by: this.request.triggered_by,
        client_name: this.request.client_context.client_name,
        request_data: this.sanitizedRequest,
        status: 'running',
        request_size_bytes: this.span.metrics.request_size_bytes
      });
    } catch (error) {
      console.error('Failed to persist Force Sync attempt start:', error);
      // Don't throw - telemetry should not break the main operation
    }
  }

  /**
   * Persists successful completion to database
   */
  private async persistAttemptCompletion(response: ForceSyncResponse): Promise<void> {
    try {
      await workflowDb.updateForceSyncAttempt(this.span.span_id, {
        completed_at: this.span.end_time!,
        status: 'completed',
        success: true,
        response_data: this.sanitizeResponse(response),
        duration_ms: this.span.metrics.duration_ms!,
        response_size_bytes: this.span.metrics.response_size_bytes!,
        internal_workflow_time_ms: this.span.metrics.internal_workflow_time_ms,
        external_webhook_time_ms: this.span.metrics.external_webhook_time_ms,
        external_opal_triggered: response.sync_details.external_opal.triggered,
        platforms_synced: response.sync_details.platforms_included.length
      });
    } catch (error) {
      console.error('Failed to persist Force Sync attempt completion:', error);
    }
  }

  /**
   * Persists failure to database
   */
  private async persistAttemptFailure(error: Error): Promise<void> {
    try {
      await workflowDb.updateForceSyncAttempt(this.span.span_id, {
        completed_at: this.span.end_time!,
        status: 'failed',
        success: false,
        error_message: error.message,
        duration_ms: this.span.metrics.duration_ms!
      });
    } catch (dbError) {
      console.error('Failed to persist Force Sync attempt failure:', dbError);
    }
  }

  /**
   * Sanitizes response for storage
   */
  private sanitizeResponse(response: ForceSyncResponse): any {
    return {
      success: response.success,
      sync_id: response.sync_id,
      session_id: response.session_id,
      message: response.message,
      sync_details: {
        scope: response.sync_details.scope,
        platforms_count: response.sync_details.platforms_included.length,
        rag_update_enabled: response.sync_details.rag_update_enabled,
        estimated_duration: response.sync_details.estimated_duration,
        external_opal: {
          triggered: response.sync_details.external_opal.triggered,
          workflow_id: response.sync_details.external_opal.workflow_id,
          success: response.sync_details.external_opal.triggered
        }
      }
    };
  }

  /**
   * Emits visual log events for admin monitoring panel
   */
  private async emitVisualLog(event_type: 'started' | 'completed' | 'failed', data: any): Promise<void> {
    try {
      // Emit webhook event for visual monitoring
      await publishEvent({
        event_type: `force_sync.${event_type}@1`,
        event_id: generateEventId(),
        correlation_id: this.span.correlation_id,
        timestamp: new Date().toISOString(),
        version: 1,
        span_id: this.span.span_id,
        ...data,
        metadata: createEventMetadata(
          this.span.span_id,
          undefined,
          'force-sync-visual-logger'
        )
      });
    } catch (error) {
      console.error('Failed to emit visual log event:', error);
    }
  }

  /**
   * Gets the current span information for external use
   */
  getSpanInfo(): { span_id: string; correlation_id: string; start_time: Date } {
    return {
      span_id: this.span.span_id,
      correlation_id: this.span.correlation_id,
      start_time: this.span.start_time
    };
  }
}