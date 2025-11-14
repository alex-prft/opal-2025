/**
 * Simple OPAL Workflow Trigger Function
 * Simplified wrapper around the existing OPAL production webhook caller
 */

import { triggerStrategyAssistantWorkflowProduction } from './production-webhook-caller';
import { loadOpalConfig } from '@/lib/config/opal-env';

export interface TriggerWorkflowRequest {
  client_name?: string;
  industry?: string;
  company_size?: string;
  current_capabilities?: string[];
  business_objectives?: string[];
  additional_marketing_technology?: string[];
  timeline_preference?: string;
  budget_range?: string;
  recipients?: string[];
  sync_scope?: string;
  triggered_by?: string;
  force_sync?: boolean;
  metadata?: Record<string, any>;
}

export interface TriggerWorkflowResponse {
  success: boolean;
  workflow_id?: string;
  session_id?: string;
  message: string;
  polling_url?: string;
  error?: string;
  correlation_id: string;
  duration_ms: number;
}

/**
 * Simple function to trigger OPAL workflow
 * Uses the existing production webhook caller with sensible defaults
 */
export async function triggerOpalWorkflow(request: TriggerWorkflowRequest = {}): Promise<TriggerWorkflowResponse> {
  const startTime = Date.now();
  const correlationId = `trigger-${Date.now()}-${Math.random().toString(36).substring(2)}`;

  console.log('🚀 [TriggerWorkflow] Starting OPAL workflow trigger:', {
    correlation_id: correlationId,
    client_name: request.client_name,
    triggered_by: request.triggered_by
  });

  try {
    // Check configuration
    try {
      loadOpalConfig();
    } catch (configError) {
      console.warn('⚠️ [TriggerWorkflow] OPAL configuration warning:', configError);
      // Continue - production webhook caller handles development mode
    }

    // Set up client data with defaults
    const clientData = {
      client_name: request.client_name || 'OPAL Sync Operation',
      industry: request.industry || 'Technology',
      company_size: request.company_size || 'Medium',
      current_capabilities: request.current_capabilities || ['Data Integration', 'Analytics'],
      business_objectives: request.business_objectives || ['Optimize Performance', 'Improve Insights'],
      additional_marketing_technology: request.additional_marketing_technology || [],
      timeline_preference: request.timeline_preference || '6-months',
      budget_range: request.budget_range || '50k-100k',
      recipients: request.recipients || ['admin@example.com']
    };

    // Set up options
    const options = {
      sync_scope: request.sync_scope || 'priority_platforms',
      triggered_by: request.triggered_by || 'api_trigger',
      force_sync: request.force_sync ?? true,
      correlation_id: correlationId,
      additional_metadata: {
        simple_trigger: true,
        trigger_timestamp: new Date().toISOString(),
        ...request.metadata
      }
    };

    // Call the production webhook
    const result = await triggerStrategyAssistantWorkflowProduction(clientData, options);

    const duration = Date.now() - startTime;

    console.log('✅ [TriggerWorkflow] OPAL workflow triggered successfully:', {
      correlation_id: correlationId,
      workflow_id: result.workflow_id,
      session_id: result.session_id,
      duration_ms: duration
    });

    return {
      success: result.success,
      workflow_id: result.workflow_id,
      session_id: result.session_id,
      message: result.message,
      polling_url: result.polling_url,
      correlation_id: correlationId,
      duration_ms: duration
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    console.error('❌ [TriggerWorkflow] OPAL workflow trigger failed:', {
      correlation_id: correlationId,
      error: errorMessage,
      duration_ms: duration
    });

    return {
      success: false,
      message: 'OPAL workflow trigger failed',
      error: errorMessage,
      correlation_id: correlationId,
      duration_ms: duration
    };
  }
}

/**
 * Even simpler trigger function with minimal parameters
 */
export async function triggerOpalWorkflowSimple(clientName?: string): Promise<TriggerWorkflowResponse> {
  return triggerOpalWorkflow({
    client_name: clientName || 'Simple OPAL Trigger',
    triggered_by: 'simple_api'
  });
}