import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/database/supabase-client';
import { webhookEventOperations } from '@/lib/database/webhook-events';

export type OsaRecentStatus = {
  lastWebhookAt: string | null;
  lastAgentDataAt: string | null;
  lastForceSyncAt: string | null;
  lastWorkflowStatus: 'idle' | 'running' | 'completed' | 'failed';
};

/**
 * GET /api/admin/osa/recent-status
 *
 * Returns lightweight OSA status information for the admin UI.
 * This endpoint is designed to be efficient and called frequently.
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = createSupabaseAdmin();

    // Execute all queries in parallel for better performance
    const [
      lastWebhookResult,
      lastAgentResult,
      lastForceSyncResult,
      workflowStatusResult
    ] = await Promise.allSettled([
      getLastWebhookTimestamp(supabase),
      getLastAgentDataTimestamp(supabase),
      getLastForceSyncTimestamp(supabase),
      getCurrentWorkflowStatus(supabase)
    ]);

    // Extract results safely, defaulting to null on error
    const lastWebhookAt = lastWebhookResult.status === 'fulfilled' ? lastWebhookResult.value : null;
    const lastAgentDataAt = lastAgentResult.status === 'fulfilled' ? lastAgentResult.value : null;
    const lastForceSyncAt = lastForceSyncResult.status === 'fulfilled' ? lastForceSyncResult.value : null;
    const lastWorkflowStatus = workflowStatusResult.status === 'fulfilled' ?
      workflowStatusResult.value : 'idle' as const;

    const response: OsaRecentStatus = {
      lastWebhookAt,
      lastAgentDataAt,
      lastForceSyncAt,
      lastWorkflowStatus
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('OSA recent status API error:', error);

    // Return graceful fallback with null values
    return NextResponse.json({
      lastWebhookAt: null,
      lastAgentDataAt: null,
      lastForceSyncAt: null,
      lastWorkflowStatus: 'idle'
    } as OsaRecentStatus);
  }
}

/**
 * Get the most recent successful webhook timestamp
 */
async function getLastWebhookTimestamp(supabase: ReturnType<typeof createSupabaseAdmin>): Promise<string | null> {
  try {
    // First try using webhook events operations (may include fallback data)
    const recentEvents = await webhookEventOperations.getWebhookEvents({
      limit: 1,
      success: true
    });

    if (recentEvents.length > 0) {
      return recentEvents[0].received_at || null;
    }

    // Fallback: query webhook_events table directly if it exists
    const { data, error } = await supabase
      .from('webhook_events')
      .select('received_at')
      .eq('success', true)
      .order('received_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return data.received_at;

  } catch (error) {
    console.warn('Error getting last webhook timestamp:', error);
    return null;
  }
}

/**
 * Get the most recent successful agent data timestamp
 */
async function getLastAgentDataTimestamp(supabase: ReturnType<typeof createSupabaseAdmin>): Promise<string | null> {
  try {
    // Query the opal_agent_executions table for the latest successful agent completion
    const { data, error } = await supabase
      .from('opal_agent_executions')
      .select('completed_at')
      .eq('status', 'completed')
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      // Fallback: check webhook events for agent data reception
      const recentEvents = await webhookEventOperations.getWebhookEvents({
        limit: 10,
        success: true
      });

      const agentEvent = recentEvents.find(event =>
        event.agent_id && event.success && event.received_at
      );

      return agentEvent?.received_at || null;
    }

    return data.completed_at;

  } catch (error) {
    console.warn('Error getting last agent data timestamp:', error);
    return null;
  }
}

/**
 * Get the most recent Force Sync timestamp
 */
async function getLastForceSyncTimestamp(supabase: ReturnType<typeof createSupabaseAdmin>): Promise<string | null> {
  try {
    // Check opal_webhook_events for force sync events
    const { data, error } = await supabase
      .from('opal_webhook_events')
      .select('created_at, event_data, event_type')
      .or('event_data->>triggered_by.eq.force_sync,event_type.eq.force_sync_completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!error && data) {
      return data.created_at;
    }

    // Fallback: check webhook events for force sync patterns
    const recentEvents = await webhookEventOperations.getWebhookEvents({
      limit: 20,
      success: true
    });

    const forceSyncEvent = recentEvents.find(event =>
      event.event_type === 'opal.force_sync' ||
      event.event_type === 'force_sync' ||
      event.event_type === 'manual_sync' ||
      (event.workflow_id && event.workflow_id.includes('force-sync')) ||
      event.trigger_source === 'manual_sync' ||
      event.trigger_source === 'force_sync'
    );

    return forceSyncEvent?.received_at || null;

  } catch (error) {
    console.warn('Error getting last force sync timestamp:', error);
    return null;
  }
}

/**
 * Determine the current workflow status
 */
async function getCurrentWorkflowStatus(supabase: ReturnType<typeof createSupabaseAdmin>): Promise<'idle' | 'running' | 'completed' | 'failed'> {
  try {
    // Get the most recent workflow execution
    const { data, error } = await supabase
      .from('opal_workflow_executions')
      .select('status, trigger_timestamp, started_at, completed_at, failed_at')
      .order('trigger_timestamp', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return 'idle';
    }

    const workflow = data;

    // Check if workflow is currently running
    if (workflow.status === 'running' ||
        (workflow.status === 'triggered' && workflow.started_at)) {

      // Consider a workflow stale if it's been running for more than 30 minutes
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      const startTime = new Date(workflow.started_at || workflow.trigger_timestamp);

      if (startTime < thirtyMinutesAgo) {
        return 'failed'; // Assume failed if running too long
      }

      return 'running';
    }

    // Check final status
    if (workflow.status === 'completed') {
      return 'completed';
    }

    if (workflow.status === 'failed' || workflow.failed_at) {
      return 'failed';
    }

    // Default to idle
    return 'idle';

  } catch (error) {
    console.warn('Error getting current workflow status:', error);
    return 'idle';
  }
}