/**
 * OPAL External Workflow Webhook Trigger
 *
 * Handles triggering external OPAL workflows via webhook calls.
 * Supports the strategy_workflow and other OPAL workflows.
 */

import { getEnvironmentConfig } from '@/lib/config/env-config';

export interface OpalWebhookTriggerRequest {
  workflow_name: string;
  client_data: {
    client_name: string;
    industry?: string;
    company_size?: string;
    current_capabilities?: string[];
    business_objectives?: string[];
    additional_marketing_technology?: string[];
    timeline_preference?: string;
    budget_range?: string;
    recipients?: string[];
  };
  trigger_source: 'force_sync' | 'manual_request' | 'api_call';
  sync_scope?: string;
  metadata?: Record<string, any>;
}

export interface OpalWebhookTriggerResponse {
  success: boolean;
  workflow_id?: string;
  session_id?: string;
  message: string;
  external_reference?: string;
  polling_url?: string;
}

/**
 * Triggers an external OPAL workflow via webhook
 */
export async function triggerOpalWorkflow(
  request: OpalWebhookTriggerRequest
): Promise<OpalWebhookTriggerResponse> {
  const startTime = Date.now();

  try {
    console.log(`🔗 [OPAL Webhook] Triggering external OPAL workflow: ${request.workflow_name}`);

    // Get environment configuration
    const config = getEnvironmentConfig();

    // Determine webhook URL - priority order:
    // 1. OPAL_API_URL (if configured)
    // 2. Environment-specific webhook URL
    // 3. Default OPAL webhook URL pattern
    const webhookUrl = await determineWebhookUrl(request.workflow_name, config);

    // Get authentication token from environment
    const authToken = await getOpalAuthToken(request.workflow_name, config);

    // Prepare webhook payload in OPAL expected format
    const webhookPayload = {
      workflow_name: request.workflow_name,
      input_data: {
        client_name: request.client_data.client_name,
        industry: request.client_data.industry || 'Technology',
        company_size: request.client_data.company_size || 'Medium',
        current_capabilities: request.client_data.current_capabilities || ['Web Analytics'],
        business_objectives: request.client_data.business_objectives || ['Improve Conversion Rate'],
        additional_marketing_technology: request.client_data.additional_marketing_technology || [],
        timeline_preference: request.client_data.timeline_preference || '6-months',
        budget_range: request.client_data.budget_range || '50k-100k',
        recipients: request.client_data.recipients || ['admin@example.com'],
        triggered_by: request.trigger_source,
        sync_scope: request.sync_scope,
        force_sync: request.trigger_source === 'force_sync'
      },
      metadata: {
        workspace_id: process.env.OPAL_WORKSPACE_ID || 'default-workspace',
        trigger_timestamp: new Date().toISOString(),
        correlation_id: `opal-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        source_system: 'OSA-ForceSync',
        ...request.metadata
      }
    };

    console.log(`📤 [OPAL Webhook] Calling ${webhookUrl}`, {
      workflow: request.workflow_name,
      client: request.client_data.client_name,
      trigger: request.trigger_source
    });

    // Make webhook call to external OPAL system
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'User-Agent': 'OSA-ForceSync/1.0',
        'X-Trigger-Source': request.trigger_source,
        'X-Workflow-Name': request.workflow_name
      },
      body: JSON.stringify(webhookPayload),
      // Add timeout for webhook calls
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });

    const responseData = await response.text();
    let parsedResponse: any = {};

    try {
      parsedResponse = JSON.parse(responseData);
    } catch {
      // Handle non-JSON responses
      parsedResponse = { raw_response: responseData };
    }

    if (!response.ok) {
      throw new Error(`OPAL webhook failed: ${response.status} ${response.statusText} - ${responseData}`);
    }

    const duration = Date.now() - startTime;
    console.log(`✅ [OPAL Webhook] External OPAL workflow triggered successfully (${duration}ms)`, {
      status: response.status,
      workflow_id: parsedResponse.workflow_id,
      session_id: parsedResponse.session_id
    });

    return {
      success: true,
      workflow_id: parsedResponse.workflow_id || `opal-${Date.now()}`,
      session_id: parsedResponse.session_id || parsedResponse.workflow_id,
      message: `External OPAL workflow '${request.workflow_name}' triggered successfully`,
      external_reference: parsedResponse.reference || parsedResponse.id,
      polling_url: parsedResponse.polling_url || parsedResponse.status_url
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error(`❌ [OPAL Webhook] Failed to trigger external OPAL workflow (${duration}ms):`, {
      workflow: request.workflow_name,
      error: errorMessage,
      client: request.client_data.client_name
    });

    return {
      success: false,
      message: `Failed to trigger external OPAL workflow: ${errorMessage}`
    };
  }
}

/**
 * Determines the correct webhook URL for the given workflow
 */
async function determineWebhookUrl(workflowName: string, config: any): Promise<string> {
  // Priority 1: Direct OPAL API URL configuration
  if (config.opal.apiUrl) {
    return `${config.opal.apiUrl}/workflows/${workflowName}/trigger`;
  }

  // Priority 2: Environment-specific webhook URL
  const webhookUrl = process.env.OPAL_WEBHOOK_URL;
  if (webhookUrl) {
    return webhookUrl;
  }

  // Priority 3: Workflow-specific environment variable
  const workflowWebhookUrl = process.env[`OPAL_${workflowName.toUpperCase()}_WEBHOOK_URL`];
  if (workflowWebhookUrl) {
    return workflowWebhookUrl;
  }

  // Priority 4: Check if OPAL_BASE_URL and OPAL_WEBHOOK_ID are configured
  const baseUrl = process.env.OPAL_BASE_URL;
  const webhookId = process.env.OPAL_WEBHOOK_ID;

  if (baseUrl && webhookId) {
    return `${baseUrl}/webhooks/${webhookId}`;
  }

  // Priority 5: Development mode fallback - use mock endpoint
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🎭 [OPAL Webhook] No OPAL configuration found, using mock endpoint for testing`);
    return `${config.app.baseUrl}/api/webhooks/opal-mock-test`;
  }

  // If no configuration is provided in production, throw a descriptive error
  throw new Error(
    `OPAL webhook URL not configured for production. Please set one of:\n` +
    `- OPAL_API_URL (preferred)\n` +
    `- OPAL_WEBHOOK_URL\n` +
    `- OPAL_BASE_URL + OPAL_WEBHOOK_ID\n` +
    `- OPAL_${workflowName.toUpperCase()}_WEBHOOK_URL`
  );
}

/**
 * Gets the appropriate authentication token for the workflow
 */
async function getOpalAuthToken(workflowName: string, config: any): Promise<string> {
  // Priority 1: General OPAL API token
  if (config.opal.apiToken) {
    return config.opal.apiToken;
  }

  // Priority 2: Workflow-specific auth key (from strategy_workflow.json)
  if (workflowName === 'strategy_workflow') {
    const strategyWorkflowKey = process.env.OPAL_STRATEGY_WORKFLOW_AUTH_KEY;
    if (strategyWorkflowKey) {
      return strategyWorkflowKey;
    }
  }

  // Priority 3: General webhook auth key
  if (config.opal.webhookAuthKey) {
    return config.opal.webhookAuthKey;
  }

  // Priority 4: Fallback for development (only if no other auth is configured)
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`⚠️ [OPAL Webhook] No OPAL auth token configured, using fallback for development`);
    return 'opal-workflow-webhook-secret-2025';
  }

  throw new Error('No OPAL authentication token configured. Please set OPAL_API_TOKEN, OPAL_STRATEGY_WORKFLOW_AUTH_KEY, or OPAL_WEBHOOK_AUTH_KEY');
}

/**
 * Triggers the strategy_workflow specifically
 */
export async function triggerStrategyAssistantWorkflow(
  clientData: OpalWebhookTriggerRequest['client_data'],
  syncScope: string = 'priority_platforms',
  triggerSource: 'force_sync' | 'manual_request' = 'force_sync'
): Promise<OpalWebhookTriggerResponse> {
  return triggerOpalWorkflow({
    workflow_name: 'strategy_workflow',
    client_data: clientData,
    trigger_source: triggerSource,
    sync_scope: syncScope,
    metadata: {
      sync_type: 'force_sync',
      platform_integration: 'OSA',
      initiated_from: 'force_sync_button'
    }
  });
}

/**
 * Gets the status of an external OPAL workflow
 */
export async function getOpalWorkflowStatus(
  workflowId: string,
  sessionId?: string
): Promise<{ status: string; progress?: any; error?: string }> {
  try {
    const config = getEnvironmentConfig();

    // Determine status URL
    let statusUrl = '';
    if (config.opal.apiUrl) {
      statusUrl = `${config.opal.apiUrl}/workflows/${workflowId}/status`;
    } else {
      // Use polling URL pattern or default
      const baseUrl = process.env.OPAL_BASE_URL || 'https://webhook.opal.optimizely.com';
      statusUrl = `${baseUrl}/status/${sessionId || workflowId}`;
    }

    const response = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${await getOpalAuthToken('strategy_workflow', config)}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.status}`);
    }

    const statusData = await response.json();
    return {
      status: statusData.status || 'unknown',
      progress: statusData.progress,
      error: statusData.error
    };

  } catch (error) {
    console.error('❌ [OPAL Webhook] Failed to get workflow status:', error);
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}