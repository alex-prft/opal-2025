// API Route: Manual Force Sync for Opal DXP Data
// Triggers a complete refresh of DXP data and RAG model updates
// Used for manual syncing of latest insights from all integrated platforms

import { NextRequest, NextResponse } from 'next/server';
import { opalWorkflowEngine } from '@/lib/opal/workflow-engine';
import { workflowDb } from '@/lib/database/workflow-operations';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('🔄 [Force Sync] Manual DXP sync request received');

    // Parse request body
    const body = await request.json();

    const {
      sync_scope = 'all_platforms',
      include_rag_update = true,
      triggered_by = 'manual_user_request',
      client_context = {}
    } = body;

    // Log performance metrics
    await workflowDb.logAPIPerformance({
      endpoint: '/api/opal/sync',
      method: 'POST',
      responseTimeMs: Date.now() - startTime,
      statusCode: 200,
      payloadSizeBytes: JSON.stringify(body).length,
      dxpPlatform: 'opal_sync',
      apiCallType: 'force_sync'
    });

    console.log(`🚀 [Force Sync] Triggering ${sync_scope} sync with RAG update: ${include_rag_update}`);

    // Create a synthetic workflow request for force sync
    const forceSyncRequest = {
      client_name: client_context.client_name || 'Force Sync Operation',
      industry: client_context.industry || 'Data Sync',
      company_size: 'System Operation',
      current_capabilities: ['DXP Integration', 'Data Synchronization'],
      business_objectives: ['Update RAG Model', 'Refresh DXP Insights'],
      additional_marketing_technology: ['All Integrated Platforms'],
      timeline_preference: 'Real-time',
      budget_range: 'System Operation',
      recipients: client_context.recipients || ['system@opal.ai'],
      triggered_by: 'force_sync' as const,
      force_sync: true,
      sync_scope: sync_scope
    };

    // Trigger workflow execution with force sync flag
    const workflowResponse = await opalWorkflowEngine.triggerWorkflow(forceSyncRequest);

    const syncResponse = {
      success: true,
      sync_id: workflowResponse.workflow_id,
      session_id: workflowResponse.session_id,
      message: `Force sync initiated for ${sync_scope}`,
      polling_url: workflowResponse.polling_url,
      sync_details: {
        scope: sync_scope,
        platforms_included: getSyncPlatforms(sync_scope),
        rag_update_enabled: include_rag_update,
        estimated_duration: getEstimatedDuration(sync_scope),
        triggered_by: triggered_by,
        sync_timestamp: new Date().toISOString()
      }
    };

    const totalDuration = Date.now() - startTime;
    console.log(`✅ [Force Sync] Sync initiated successfully (${totalDuration}ms)`);

    return NextResponse.json(syncResponse);

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    console.error('❌ [Force Sync] Failed to initiate sync:', error);

    // Log error performance
    await workflowDb.logAPIPerformance({
      endpoint: '/api/opal/sync',
      method: 'POST',
      responseTimeMs: duration,
      statusCode: 500,
      dxpPlatform: 'opal_sync',
      apiCallType: 'force_sync',
      errorMessage
    });

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
    description: 'Manually triggers a complete DXP data sync and RAG model update',
    usage: 'Used for refreshing all DXP insights and updating the knowledge base on-demand',
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
      sync_details: 'comprehensive sync configuration and timeline'
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