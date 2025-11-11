// API Route: Manual Force Sync for Opal DXP Data with Comprehensive Telemetry
// Triggers a complete refresh of DXP data and RAG model updates
// Used for manual syncing of latest insights from all integrated platforms
// Now includes comprehensive telemetry, logging, and event emission

import { NextRequest, NextResponse } from 'next/server';
import { opalWorkflowEngine } from '@/lib/opal/workflow-engine';
import { triggerStrategyAssistantWorkflow } from '@/lib/opal/webhook-trigger';
import { triggerStrategyAssistantWorkflowProduction } from '@/lib/opal/production-webhook-caller';
import { ForceSyncTelemetryManager, ForceSyncRequest, ForceSyncResponse } from '@/lib/telemetry/force-sync-telemetry';

export async function POST(request: NextRequest) {
  let telemetryManager: ForceSyncTelemetryManager | null = null;

  try {
    console.log('🔄 [Force Sync] Manual DXP sync request received with telemetry');

    // Parse request body
    const body = await request.json();

    // Create Force Sync request from body
    const forceSyncRequest: ForceSyncRequest = {
      sync_scope: body.sync_scope || 'priority_platforms',
      include_rag_update: body.include_rag_update ?? true,
      triggered_by: body.triggered_by || 'manual_user_request',
      client_context: {
        client_name: body.client_context?.client_name,
        industry: body.client_context?.industry,
        recipients: body.client_context?.recipients
      },
      metadata: body.metadata || {}
    };

    // Initialize telemetry manager and start span (non-blocking)
    telemetryManager = new ForceSyncTelemetryManager(forceSyncRequest);
    try {
      await telemetryManager.startSpan();
      const spanInfo = telemetryManager.getSpanInfo();
      console.log(`📊 [Force Sync] Telemetry span started: ${spanInfo.span_id}`);
    } catch (telemetryError) {
      console.warn(`⚠️ [Force Sync] Telemetry start failed (non-blocking):`, telemetryError instanceof Error ? telemetryError.message : telemetryError);
      // Continue with Force Sync even if telemetry fails
    }

    // Record internal workflow start time
    const internalWorkflowStartTime = Date.now();

    // Create a synthetic workflow request for force sync
    const workflowRequest = {
      client_name: forceSyncRequest.client_context.client_name || 'Force Sync Operation',
      industry: forceSyncRequest.client_context.industry || 'Data Sync',
      company_size: 'System Operation',
      current_capabilities: ['DXP Integration', 'Data Synchronization'],
      business_objectives: ['Update RAG Model', 'Refresh DXP Insights'],
      additional_marketing_technology: ['All Integrated Platforms'],
      timeline_preference: 'Real-time',
      budget_range: 'System Operation',
      recipients: forceSyncRequest.client_context.recipients || ['system@opal.ai'],
      triggered_by: 'force_sync' as const,
      force_sync: true,
      sync_scope: forceSyncRequest.sync_scope
    };

    console.log(`🚀 [Force Sync] Triggering dual workflow execution: internal + external OPAL`);

    // 1. Trigger internal workflow execution with force sync flag
    const workflowResponse = await opalWorkflowEngine.triggerWorkflow(workflowRequest);
    const internalWorkflowDuration = Date.now() - internalWorkflowStartTime;
    telemetryManager.recordInternalWorkflowMetrics(internalWorkflowDuration);

    // 2. Trigger external OPAL strategy_assistant_workflow via production webhook
    const externalWebhookStartTime = Date.now();
    let opalWebhookResponse;

    // Check if we have production OPAL configuration
    const hasProductionConfig = process.env.OPAL_WEBHOOK_URL && process.env.OPAL_STRATEGY_WORKFLOW_AUTH_KEY;

    try {
      if (hasProductionConfig) {
        console.log(`🏭 [Force Sync] Using production OPAL webhook configuration`);
        opalWebhookResponse = await triggerStrategyAssistantWorkflowProduction(
          {
            client_name: forceSyncRequest.client_context.client_name || 'Force Sync Operation',
            industry: forceSyncRequest.client_context.industry || 'Data Sync',
            company_size: 'System Operation',
            current_capabilities: ['DXP Integration', 'Data Synchronization'],
            business_objectives: ['Update RAG Model', 'Refresh DXP Insights'],
            additional_marketing_technology: ['All Integrated Platforms'],
            timeline_preference: 'Real-time',
            budget_range: 'System Operation',
            recipients: forceSyncRequest.client_context.recipients || ['system@opal.ai']
          },
          {
            sync_scope: forceSyncRequest.sync_scope,
            triggered_by: 'force_sync',
            force_sync: true,
            correlation_id: `force-sync-${workflowResponse.workflow_id}`,
            additional_metadata: {
              internal_workflow_id: workflowResponse.workflow_id,
              internal_session_id: workflowResponse.session_id,
              force_sync_context: forceSyncRequest
            }
          }
        );
      } else {
        console.log(`🧪 [Force Sync] Using development/fallback webhook configuration`);
        opalWebhookResponse = await triggerStrategyAssistantWorkflow(
          {
            client_name: forceSyncRequest.client_context.client_name || 'Force Sync Operation',
            industry: forceSyncRequest.client_context.industry || 'Data Sync',
            company_size: 'System Operation',
            current_capabilities: ['DXP Integration', 'Data Synchronization'],
            business_objectives: ['Update RAG Model', 'Refresh DXP Insights'],
            additional_marketing_technology: ['All Integrated Platforms'],
            timeline_preference: 'Real-time',
            budget_range: 'System Operation',
            recipients: forceSyncRequest.client_context.recipients || ['system@opal.ai']
          },
          forceSyncRequest.sync_scope,
          'force_sync'
        );
      }

      const externalWebhookDuration = Date.now() - externalWebhookStartTime;
      telemetryManager.recordExternalWebhookMetrics(externalWebhookDuration);

      if (!opalWebhookResponse.success) {
        console.warn(`⚠️ [Force Sync] External OPAL workflow trigger failed: ${opalWebhookResponse.message}`);
      }
    } catch (webhookError) {
      const externalWebhookDuration = Date.now() - externalWebhookStartTime;
      telemetryManager.recordExternalWebhookMetrics(externalWebhookDuration);

      console.error(`❌ [Force Sync] External OPAL webhook error:`, webhookError);
      opalWebhookResponse = {
        success: false,
        message: `External OPAL webhook failed: ${webhookError instanceof Error ? webhookError.message : 'Unknown error'}`,
        workflow_id: undefined,
        session_id: undefined,
        polling_url: undefined
      };
    }

    console.log(`📊 [Force Sync] Workflow trigger results:`, {
      internal_workflow: {
        success: true,
        workflow_id: workflowResponse.workflow_id,
        session_id: workflowResponse.session_id,
        duration_ms: internalWorkflowDuration
      },
      external_opal: {
        success: opalWebhookResponse.success,
        workflow_id: opalWebhookResponse.workflow_id,
        message: opalWebhookResponse.message
      }
    });

    // Determine overall success message
    const overallMessage = opalWebhookResponse.success
      ? `Force sync initiated for ${forceSyncRequest.sync_scope} (internal + external OPAL workflows triggered)`
      : `Force sync initiated for ${forceSyncRequest.sync_scope} (internal workflow only - external OPAL webhook failed)`;

    // Build the Force Sync response
    const syncResponse: ForceSyncResponse = {
      success: true, // Internal workflow always succeeds if we get here
      sync_id: workflowResponse.workflow_id,
      session_id: workflowResponse.session_id,
      message: overallMessage,
      polling_url: workflowResponse.polling_url,
      sync_details: {
        scope: forceSyncRequest.sync_scope,
        platforms_included: getSyncPlatforms(forceSyncRequest.sync_scope),
        rag_update_enabled: forceSyncRequest.include_rag_update,
        estimated_duration: getEstimatedDuration(forceSyncRequest.sync_scope),
        triggered_by: forceSyncRequest.triggered_by,
        sync_timestamp: new Date().toISOString(),
        // Add external OPAL workflow information
        external_opal: {
          triggered: opalWebhookResponse.success,
          workflow_id: opalWebhookResponse.workflow_id,
          session_id: opalWebhookResponse.session_id,
          message: opalWebhookResponse.message,
          polling_url: opalWebhookResponse.polling_url
        }
      }
    };

    // Complete the telemetry span with success (non-blocking)
    try {
      await telemetryManager.completeSpan(syncResponse);
      console.log(`✅ [Force Sync] Sync initiated successfully with telemetry span completed`);
    } catch (telemetryError) {
      console.warn(`⚠️ [Force Sync] Telemetry completion failed (non-blocking):`, telemetryError instanceof Error ? telemetryError.message : telemetryError);
    }

    console.log(`✅ [Force Sync] Sync initiated successfully`);

    return NextResponse.json(syncResponse);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('❌ [Force Sync] Failed to initiate sync:', error);

    // Complete the telemetry span with failure if manager exists (non-blocking)
    if (telemetryManager) {
      try {
        await telemetryManager.failSpan(error instanceof Error ? error : new Error(errorMessage));
        console.log(`📊 [Force Sync] Telemetry failure span completed`);
      } catch (telemetryError) {
        console.warn(`⚠️ [Force Sync] Telemetry failure recording failed (non-blocking):`, telemetryError instanceof Error ? telemetryError.message : telemetryError);
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: `Failed to initiate force sync: ${errorMessage}`
    }, { status: 500 });
  }
}

export async function GET() {
  // Return API information for discovery
  return NextResponse.json({
    endpoint: '/api/opal/sync',
    method: 'POST',
    description: 'Manually triggers a complete DXP data sync and RAG model update via internal workflow AND external OPAL strategy_assistant_workflow',
    usage: 'Used for refreshing all DXP insights, updating the knowledge base, and triggering external OPAL workflow execution',
    parameters: {
      sync_scope: 'all_platforms | priority_platforms | specific_platform',
      include_rag_update: true,
      triggered_by: 'manual_user_request | form_submission | scheduled_sync',
      client_context: {
        client_name: 'optional client identifier',
        industry: 'optional industry context',
        recipients: ['optional email list for notifications']
      }
    },
    response: {
      success: true,
      sync_id: 'uuid of sync workflow',
      session_id: 'uuid for status polling',
      polling_url: '/api/opal/status/{session_id}',
      message: 'Force sync initiated for {scope} (internal + external OPAL workflows triggered)',
      sync_details: {
        scope: 'sync scope',
        platforms_included: ['list of platforms'],
        rag_update_enabled: true,
        estimated_duration: 'estimated time',
        triggered_by: 'trigger source',
        sync_timestamp: 'ISO timestamp',
        external_opal: {
          triggered: true,
          workflow_id: 'external OPAL workflow ID',
          session_id: 'external OPAL session ID',
          message: 'external OPAL response message',
          polling_url: 'external OPAL polling URL'
        }
      }
    }
  });
}

// Helper function to determine which platforms are included in sync
function getSyncPlatforms(syncScope: string): string[] {
  switch (syncScope) {
    case 'all_platforms':
      return [
        'Optimizely Data Platform (ODP)',
        'Content Recommendations',
        'CMS PaaS v12',
        'Content Marketing Platform (CMP)',
        'WebX Analytics'
      ];
    case 'priority_platforms':
      return [
        'Optimizely Data Platform (ODP)',
        'Content Recommendations',
        'CMS PaaS v12',
        'Content Marketing Platform (CMP)'
      ];
    case 'odp_only':
      return ['Optimizely Data Platform (ODP)'];
    case 'content_platforms':
      return ['Content Recommendations', 'CMS PaaS v12', 'Content Marketing Platform (CMP)'];
    default:
      return ['All Available Platforms'];
  }
}

// Helper function to estimate sync duration based on scope
function getEstimatedDuration(syncScope: string): string {
  switch (syncScope) {
    case 'all_platforms':
      return '8-12 minutes';
    case 'priority_platforms':
      return '6-8 minutes';
    case 'odp_only':
      return '2-3 minutes';
    case 'content_platforms':
      return '4-6 minutes';
    default:
      return '5-10 minutes';
  }
}