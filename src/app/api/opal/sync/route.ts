/**
 * OPAL Sync Endpoint
 * Simple endpoint to trigger OPAL workflow synchronization
 */

import { NextRequest, NextResponse } from 'next/server';
import { triggerOpalWorkflow } from '@/lib/opal/trigger-workflow';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    if (!process.env.OPAL_STRATEGY_WORKFLOW_AUTH_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Configuration Error',
        message: 'OPAL authentication not configured'
      }, { status: 500 });
    }

    // Parse request body
    const body = await req.json().catch(() => ({}));

    // Generate correlation ID
    const correlationId = `force-sync-${Date.now()}-${Math.random().toString(36).substring(2)}`;

    console.log('🔄 [OPAL Sync] Starting force sync with correlation ID:', correlationId);

    // Trigger OPAL workflow
    const result = await triggerOpalWorkflow({
      client_name: body.client_name || body.client_context?.client_name,
      industry: body.industry || body.client_context?.industry,
      company_size: body.company_size,
      current_capabilities: body.current_capabilities,
      business_objectives: body.business_objectives,
      additional_marketing_technology: body.additional_marketing_technology,
      timeline_preference: body.timeline_preference,
      budget_range: body.budget_range,
      recipients: body.recipients || body.client_context?.recipients,
      sync_scope: body.sync_scope,
      triggered_by: body.triggered_by || 'force_sync',
      force_sync: true,
      metadata: {
        correlation_id: correlationId,
        api_request: true,
        ...body.metadata
      }
    });

    console.log('✅ [OPAL Sync] Force sync completed:', {
      success: result.success,
      workflow_id: result.workflow_id,
      correlation_id: correlationId
    });

    return NextResponse.json({
      success: result.success,
      correlationId: result.correlation_id,
      message: result.success ? 'Force sync completed' : 'Force sync failed',
      details: {
        workflow_id: result.workflow_id,
        session_id: result.session_id,
        polling_url: result.polling_url,
        duration_ms: result.duration_ms,
        error: result.error
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    console.error('❌ [OPAL Sync] Force sync failed:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'Internal Server Error',
      message: `Force sync failed: ${errorMessage}`,
      correlationId: `error-${Date.now()}`,
      details: {
        error_type: error instanceof Error ? error.constructor.name : 'UnknownError',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/opal/sync',
    method: 'POST',
    description: 'Triggers OPAL workflow synchronization',
    usage: 'Send POST request to trigger force sync of OPAL workflow',
    required_env: [
      'OPAL_STRATEGY_WORKFLOW_AUTH_KEY'
    ],
    optional_parameters: {
      client_name: 'Client identifier',
      industry: 'Client industry',
      company_size: 'Company size category',
      current_capabilities: 'Array of current capabilities',
      business_objectives: 'Array of business objectives',
      sync_scope: 'Scope of sync operation',
      triggered_by: 'Source of trigger (defaults to force_sync)',
      recipients: 'Email recipients for notifications'
    },
    example_request: {
      client_name: 'Example Corp',
      industry: 'Technology',
      sync_scope: 'priority_platforms',
      recipients: ['admin@example.com']
    }
  });
}