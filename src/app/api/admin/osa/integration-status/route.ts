import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin, isDatabaseAvailable } from '@/lib/database/supabase-client';

export async function GET(request: NextRequest) {
  try {
    // Check if database is configured before attempting connection
    if (!isDatabaseAvailable()) {
      return NextResponse.json({
        success: false,
        error: 'Integration validation system not initialized - database configuration required',
        fallback: true,
        hint: 'This is expected in demo environments or during initial setup'
      }, { status: 503 });
    }

    const supabase = createSupabaseAdmin();
    const { searchParams } = new URL(request.url);

    const forceSyncWorkflowId = searchParams.get('forceSyncWorkflowId');
    const tenantId = searchParams.get('tenantId');
    const limit = parseInt(searchParams.get('limit') || '1');

    let query = supabase
      .from('opal_integration_validation')
      .select('*')
      .order('validated_at', { ascending: false })
      .limit(limit);

    if (forceSyncWorkflowId) {
      query = query.eq('force_sync_workflow_id', forceSyncWorkflowId);
    }

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[integration-status] DB error', error);

      // Graceful fallback if table doesn't exist in production
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        return NextResponse.json({
          success: false,
          error: 'Integration validation system not yet initialized',
          fallback: true
        }, { status: 404 });
      }

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No integration validation record found' },
        { status: 404 }
      );
    }

    const record = data[0] as any;

    // Shape this for consumption by monitoring dashboards
    return NextResponse.json({
      success: true,
      integrationStatus: {
        overallStatus: record.overall_status,
        summary: record.summary,
        validatedAt: record.validated_at,
        workflowId: record.force_sync_workflow_id,
        correlationId: record.opal_correlation_id,

        forceSync: {
          lastAt: record.force_sync_last_at,
          status: record.force_sync_status,
          agentCount: record.force_sync_agent_count
        },

        opal: {
          workflowStatus: record.opal_workflow_status,
          agentStatuses: record.opal_agent_statuses,
          agentResponseCount: record.opal_agent_response_count
        },

        osa: {
          lastWebhookAt: record.osa_last_webhook_at,
          lastAgentDataAt: record.osa_last_agent_data_at,
          lastForceSyncAt: record.osa_last_force_sync_at,
          workflowData: record.osa_workflow_data,
          receptionRate: record.osa_reception_rate
        },

        health: {
          overallStatus: record.health_overall_status,
          signatureValidRate: record.health_signature_valid_rate,
          errorRate24h: record.health_error_rate_24h,
          lastWebhookMinutesAgo: record.health_last_webhook_minutes_ago
        },

        errors: record.errors,
        
        // Meta information
        meta: {
          tenantId: record.tenant_id,
          validationStatus: record.validation_status,
          recordId: record.id
        }
      }
    });
  } catch (err: any) {
    console.error('[integration-status] Unexpected error', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Unexpected error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if database is configured before attempting connection
    if (!isDatabaseAvailable()) {
      return NextResponse.json({
        success: false,
        error: 'Integration validation system not initialized - database configuration required',
        fallback: true
      }, { status: 503 });
    }

    const supabase = createSupabaseAdmin();
    const body = await request.json();

    const {
      tenantId,
      forceSyncWorkflowId,
      opalCorrelationId,
      overallStatus,
      summary,
      forceSyncData,
      opalData,
      osaData,
      healthData,
      errors
    } = body;

    const record = {
      tenant_id: tenantId || null,
      force_sync_workflow_id: forceSyncWorkflowId,
      opal_correlation_id: opalCorrelationId || null,
      overall_status: overallStatus,
      summary,

      // Force Sync layer
      force_sync_last_at: forceSyncData?.lastAt || null,
      force_sync_status: forceSyncData?.status || null,
      force_sync_agent_count: forceSyncData?.agentCount || null,

      // OPAL layer
      opal_workflow_status: opalData?.workflowStatus || null,
      opal_agent_statuses: opalData?.agentStatuses || {},
      opal_agent_response_count: opalData?.agentResponseCount || 0,

      // OSA layer
      osa_last_webhook_at: osaData?.lastWebhookAt || null,
      osa_last_agent_data_at: osaData?.lastAgentDataAt || null,
      osa_last_force_sync_at: osaData?.lastForceSyncAt || null,
      osa_workflow_data: osaData?.workflowData || {},
      osa_reception_rate: osaData?.receptionRate || 0,

      // Health signals
      health_overall_status: healthData?.overallStatus || null,
      health_signature_valid_rate: healthData?.signatureValidRate || 0,
      health_error_rate_24h: healthData?.errorRate24h || 0,
      health_last_webhook_minutes_ago: healthData?.lastWebhookMinutesAgo || 999,

      // Error details
      errors: errors || {},

      validated_at: new Date().toISOString(),
      validation_status: 'completed'
    };

    const { data, error } = await supabase
      .from('opal_integration_validation')
      .insert(record)
      .select()
      .single();

    if (error) {
      console.error('[integration-status] Insert error', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Integration validation record created',
      recordId: data.id
    });
  } catch (err: any) {
    console.error('[integration-status] POST error', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Unexpected error' },
      { status: 500 }
    );
  }
}