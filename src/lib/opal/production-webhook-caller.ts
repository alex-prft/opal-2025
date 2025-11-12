/**
 * Production OPAL Webhook Caller
 *
 * Dedicated TypeScript function for triggering OPAL strategy_workflow
 * with comprehensive logging, telemetry, and database persistence.
 *
 * Implements the exact OPAL payload structure and requirements provided.
 */

import { workflowDb } from '@/lib/database/workflow-operations';
import { orchestratorEventBus } from '@/lib/events/orchestrator-events';

export interface OpalProductionWebhookRequest {
  workflow_name: string;
  input_data: {
    client_name: string;
    industry?: string;
    company_size?: string;
    current_capabilities?: string[];
    business_objectives?: string[];
    additional_marketing_technology?: string[];
    timeline_preference?: string;
    budget_range?: string;
    recipients?: string[];
    triggered_by: string;
    sync_scope?: string;
    force_sync?: boolean;
  };
  metadata: {
    workspace_id: string;
    trigger_timestamp?: string;
    correlation_id?: string;
    source_system?: string;
    [key: string]: any;
  };
}

export interface OpalProductionWebhookResponse {
  success: boolean;
  workflow_id?: string;
  session_id?: string;
  message: string;
  external_reference?: string;
  polling_url?: string;
  error_details?: any;
  request_metadata: {
    span_id: string;
    correlation_id: string;
    request_timestamp: string;
    response_timestamp: string;
    duration_ms: number;
    webhook_url: string;
    payload_size_bytes: number;
    response_size_bytes: number;
  };
}

/**
 * Calls the production OPAL webhook with comprehensive telemetry and database persistence
 */
export async function callOpalProductionWebhook(
  request: OpalProductionWebhookRequest
): Promise<OpalProductionWebhookResponse> {
  const startTime = Date.now();
  const spanId = `opal-webhook-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const correlationId = request.metadata.correlation_id || `correlation-${Date.now()}`;

  // Get production webhook URL and auth token from environment
  const webhookUrl = process.env.OPAL_WEBHOOK_URL;
  const authToken = process.env.OPAL_STRATEGY_WORKFLOW_AUTH_KEY;

  if (!webhookUrl) {
    throw new Error('OPAL_WEBHOOK_URL environment variable not configured');
  }

  if (!authToken) {
    throw new Error('OPAL_STRATEGY_WORKFLOW_AUTH_KEY environment variable not configured');
  }

  console.log(`🚀 [OPAL Production] Starting webhook call to OPAL strategy_workflow`, {
    span_id: spanId,
    correlation_id: correlationId,
    workflow_name: request.workflow_name,
    client_name: request.input_data.client_name,
    webhook_url: webhookUrl,
    triggered_by: request.input_data.triggered_by
  });

  // Emit orchestrator event: workflow started
  try {
    await orchestratorEventBus.emit('orchestration.workflow_started@1', {
      span_id: spanId,
      correlation_id: correlationId,
      workflow_name: request.workflow_name,
      workflow_type: 'opal_external_webhook',
      client_name: request.input_data.client_name,
      triggered_by: request.input_data.triggered_by,
      timestamp: new Date().toISOString(),
      metadata: request.metadata
    });
    console.log(`📡 [OPAL Production] Emitted orchestration.workflow_started@1 event`);
  } catch (eventError) {
    console.warn(`⚠️ [OPAL Production] Failed to emit workflow started event (non-blocking):`, eventError);
  }

  // Prepare enhanced payload with metadata
  const enhancedPayload: OpalProductionWebhookRequest = {
    ...request,
    metadata: {
      workspace_id: process.env.OPAL_WORKSPACE_ID || 'default-workspace',
      trigger_timestamp: new Date().toISOString(),
      correlation_id: correlationId,
      source_system: 'OSA-ForceSync-Production',
      span_id: spanId,
      ...request.metadata
    }
  };

  const payloadJson = JSON.stringify(enhancedPayload);
  const payloadSizeBytes = Buffer.byteLength(payloadJson, 'utf8');

  // Store initial attempt in database (non-blocking)
  try {
    await workflowDb.createForceSyncAttempt({
      span_id: spanId,
      correlation_id: correlationId,
      started_at: new Date(),
      sync_scope: request.input_data.sync_scope || 'opal_webhook',
      triggered_by: request.input_data.triggered_by,
      client_name: request.input_data.client_name,
      request_data: enhancedPayload,
      status: 'in_progress',
      request_size_bytes: payloadSizeBytes
    });
    console.log(`💾 [OPAL Production] Stored force sync attempt in database: ${spanId}`);
  } catch (dbError) {
    console.warn(`⚠️ [OPAL Production] Failed to store initial attempt in database (non-blocking):`, dbError);
  }

  // Log request details (excluding sensitive auth token)
  console.log(`📤 [OPAL Production] Sending webhook request`, {
    span_id: spanId,
    correlation_id: correlationId,
    webhook_url: webhookUrl,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken.substring(0, 8)}...${authToken.substring(authToken.length - 4)}`,
      'User-Agent': 'OSA-ForceSync-Production/1.0',
      'X-Correlation-ID': correlationId,
      'X-Span-ID': spanId
    },
    payload_size_bytes: payloadSizeBytes,
    workflow_name: request.workflow_name,
    client_name: request.input_data.client_name
  });

  let webhookResponse: Response;
  let responseData: string;
  let parsedResponse: any = {};
  let responseSizeBytes = 0;

  try {
    // Make the webhook call to OPAL
    webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'User-Agent': 'OSA-ForceSync-Production/1.0',
        'X-Correlation-ID': correlationId,
        'X-Span-ID': spanId,
        'X-Workflow-Name': request.workflow_name,
        'X-Source-System': 'OSA-ForceSync-Production'
      },
      body: payloadJson,
      signal: AbortSignal.timeout(45000) // 45 second timeout for production
    });

    responseData = await webhookResponse.text();
    responseSizeBytes = Buffer.byteLength(responseData, 'utf8');

    // Parse response
    try {
      parsedResponse = JSON.parse(responseData);
    } catch {
      parsedResponse = { raw_response: responseData };
    }

    const duration = Date.now() - startTime;

    // Log response details
    console.log(`📥 [OPAL Production] Received webhook response`, {
      span_id: spanId,
      correlation_id: correlationId,
      status: webhookResponse.status,
      status_text: webhookResponse.statusText,
      response_size_bytes: responseSizeBytes,
      duration_ms: duration,
      workflow_id: parsedResponse.workflow_id,
      session_id: parsedResponse.session_id,
      success: webhookResponse.ok
    });

    if (!webhookResponse.ok) {
      throw new Error(`OPAL webhook failed: ${webhookResponse.status} ${webhookResponse.statusText} - ${responseData}`);
    }

    // Success case - update database and emit success event
    const responseMetadata: OpalProductionWebhookResponse = {
      success: true,
      workflow_id: parsedResponse.workflow_id || `opal-${Date.now()}`,
      session_id: parsedResponse.session_id || parsedResponse.workflow_id,
      message: `OPAL production webhook '${request.workflow_name}' triggered successfully`,
      external_reference: parsedResponse.reference || parsedResponse.id,
      polling_url: parsedResponse.polling_url || parsedResponse.status_url,
      request_metadata: {
        span_id: spanId,
        correlation_id: correlationId,
        request_timestamp: new Date(startTime).toISOString(),
        response_timestamp: new Date().toISOString(),
        duration_ms: duration,
        webhook_url: webhookUrl,
        payload_size_bytes: payloadSizeBytes,
        response_size_bytes: responseSizeBytes
      }
    };

    // Update database with success (non-blocking)
    try {
      await workflowDb.updateForceSyncAttempt(spanId, {
        completed_at: new Date(),
        status: 'completed',
        success: true,
        response_data: parsedResponse,
        duration_ms: duration,
        response_size_bytes: responseSizeBytes,
        external_opal_triggered: true,
        platforms_synced: 1
      });
      console.log(`✅ [OPAL Production] Updated database with success: ${spanId}`);
    } catch (dbError) {
      console.warn(`⚠️ [OPAL Production] Failed to update database with success (non-blocking):`, dbError);
    }

    // Emit orchestrator success event (non-blocking)
    try {
      await orchestratorEventBus.emit('orchestration.workflow_completed@1', {
        span_id: spanId,
        correlation_id: correlationId,
        workflow_name: request.workflow_name,
        workflow_type: 'opal_external_webhook',
        workflow_id: parsedResponse.workflow_id,
        session_id: parsedResponse.session_id,
        client_name: request.input_data.client_name,
        duration_ms: duration,
        success: true,
        timestamp: new Date().toISOString(),
        response_metadata: responseMetadata.request_metadata
      });
      console.log(`📡 [OPAL Production] Emitted orchestration.workflow_completed@1 event`);
    } catch (eventError) {
      console.warn(`⚠️ [OPAL Production] Failed to emit workflow completed event (non-blocking):`, eventError);
    }

    console.log(`✅ [OPAL Production] Webhook call completed successfully (${duration}ms)`, {
      span_id: spanId,
      correlation_id: correlationId,
      workflow_id: parsedResponse.workflow_id,
      session_id: parsedResponse.session_id
    });

    return responseMetadata;

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error(`❌ [OPAL Production] Webhook call failed (${duration}ms)`, {
      span_id: spanId,
      correlation_id: correlationId,
      error: errorMessage,
      workflow_name: request.workflow_name,
      client_name: request.input_data.client_name
    });

    // Update database with failure (non-blocking)
    try {
      await workflowDb.updateForceSyncAttempt(spanId, {
        completed_at: new Date(),
        status: 'failed',
        success: false,
        duration_ms: duration,
        response_size_bytes: responseSizeBytes,
        external_opal_triggered: false,
        error_message: errorMessage
      });
      console.log(`📝 [OPAL Production] Updated database with failure: ${spanId}`);
    } catch (dbError) {
      console.warn(`⚠️ [OPAL Production] Failed to update database with failure (non-blocking):`, dbError);
    }

    // Emit orchestrator failure event (non-blocking)
    try {
      await orchestratorEventBus.emit('orchestration.workflow_failed@1', {
        span_id: spanId,
        correlation_id: correlationId,
        workflow_name: request.workflow_name,
        workflow_type: 'opal_external_webhook',
        client_name: request.input_data.client_name,
        duration_ms: duration,
        error_message: errorMessage,
        error_type: error instanceof Error ? error.constructor.name : 'UnknownError',
        timestamp: new Date().toISOString(),
        failed_at_step: 'webhook_call'
      });
      console.log(`📡 [OPAL Production] Emitted orchestration.workflow_failed@1 event`);
    } catch (eventError) {
      console.warn(`⚠️ [OPAL Production] Failed to emit workflow failed event (non-blocking):`, eventError);
    }

    return {
      success: false,
      message: `OPAL production webhook failed: ${errorMessage}`,
      error_details: {
        error_type: error instanceof Error ? error.constructor.name : 'UnknownError',
        error_message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      },
      request_metadata: {
        span_id: spanId,
        correlation_id: correlationId,
        request_timestamp: new Date(startTime).toISOString(),
        response_timestamp: new Date().toISOString(),
        duration_ms: duration,
        webhook_url: webhookUrl,
        payload_size_bytes: payloadSizeBytes,
        response_size_bytes: responseSizeBytes
      }
    };
  }
}

/**
 * Convenience function to trigger strategy_workflow with standard parameters
 */
export async function triggerStrategyAssistantWorkflowProduction(
  clientData: {
    client_name: string;
    industry?: string;
    company_size?: string;
    current_capabilities?: string[];
    business_objectives?: string[];
    additional_marketing_technology?: string[];
    timeline_preference?: string;
    budget_range?: string;
    recipients?: string[];
  },
  options: {
    sync_scope?: string;
    triggered_by?: string;
    force_sync?: boolean;
    workspace_id?: string;
    correlation_id?: string;
    additional_metadata?: Record<string, any>;
  } = {}
): Promise<OpalProductionWebhookResponse> {

  const request: OpalProductionWebhookRequest = {
    workflow_name: 'strategy_workflow',
    input_data: {
      client_name: clientData.client_name,
      industry: clientData.industry || 'Technology',
      company_size: clientData.company_size || 'Medium',
      current_capabilities: clientData.current_capabilities || ['Web Analytics'],
      business_objectives: clientData.business_objectives || ['Improve Conversion Rate'],
      additional_marketing_technology: clientData.additional_marketing_technology || [],
      timeline_preference: clientData.timeline_preference || '6-months',
      budget_range: clientData.budget_range || '50k-100k',
      recipients: clientData.recipients || ['admin@example.com'],
      triggered_by: options.triggered_by || 'force_sync',
      sync_scope: options.sync_scope || 'priority_platforms',
      force_sync: options.force_sync ?? true
    },
    metadata: {
      workspace_id: options.workspace_id || process.env.OPAL_WORKSPACE_ID || 'default-workspace',
      correlation_id: options.correlation_id,
      ...options.additional_metadata
    }
  };

  return callOpalProductionWebhook(request);
}