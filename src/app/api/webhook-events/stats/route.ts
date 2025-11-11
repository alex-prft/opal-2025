import { NextRequest, NextResponse } from 'next/server';
import { webhookEventOperations } from '@/lib/database/webhook-events';

// Analyze workflow status from recent events
function analyzeWorkflowStatus(events: any[]) {
  const now = Date.now();
  const last30Minutes = now - (30 * 60 * 1000);
  const last24Hours = now - (24 * 60 * 60 * 1000);

  // Find recent workflow-related events
  const workflowEvents = events.filter(event => {
    const eventTime = new Date(event.received_at).getTime();
    return eventTime > last24Hours && (
      event.event_type?.includes('workflow') ||
      event.event_type?.includes('sync') ||
      event.event_type?.includes('trigger') ||
      event.agent_id ||
      event.agent_name
    );
  });

  // Recent activity (last 30 minutes)
  const recentEvents = workflowEvents.filter(event =>
    new Date(event.received_at).getTime() > last30Minutes
  );

  // Look for workflow completion patterns
  const completedWorkflows = workflowEvents.filter(event =>
    event.success && (
      event.event_type?.includes('completed') ||
      event.event_type?.includes('finished') ||
      (event.event_type?.includes('agent.') && event.success)
    )
  );

  // Look for failed workflows
  const failedWorkflows = workflowEvents.filter(event =>
    !event.success && (
      event.event_type?.includes('workflow') ||
      event.event_type?.includes('sync') ||
      event.event_type?.includes('agent.')
    )
  );

  // Find triggered workflows
  const triggeredWorkflows = workflowEvents.filter(event =>
    event.event_type?.includes('trigger') ||
    event.event_type?.includes('start') ||
    event.event_type?.includes('sync')
  );

  return {
    hasRecentActivity: recentEvents.length > 0,
    hasCompletedWorkflow: completedWorkflows.length > 0,
    hasActiveWorkflow: triggeredWorkflows.length > 0,
    hasFailedWorkflow: failedWorkflows.length > 0,
    lastCompletedWorkflow: completedWorkflows[0]?.received_at || null,
    lastFailedWorkflow: failedWorkflows[0]?.received_at || null,
    lastTriggeredWorkflow: triggeredWorkflows[0]?.received_at || null,
    agentResponseCount: workflowEvents.filter(event => event.agent_id || event.agent_name).length,
    totalWorkflowEvents: workflowEvents.length
  };
}

// GET general webhook statistics for admin dashboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get('hours') || '24', 10);

    // Get webhook statistics
    const stats = await webhookEventOperations.getWebhookStats(hours);

    // Get webhook status
    const status = await webhookEventOperations.getWebhookStatus();

    // Get recent events for agent status mapping
    const recentEvents = await webhookEventOperations.getWebhookEvents({
      limit: 50,
      start_date: new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
    });

    // Map agent statuses based on recent webhook events
    const agentStatuses: {[key: string]: 'unknown' | 'success' | 'failed'} = {
      integration_health: 'unknown',
      content_review: 'unknown',
      geo_audit: 'unknown',
      audience_suggester: 'unknown',
      experiment_blueprinter: 'unknown',
      personalization_idea_generator: 'unknown',
      customer_journey: 'unknown',
      roadmap_generator: 'unknown',
      cmp_organizer: 'unknown'
    };

    // Update agent statuses based on recent webhook events
    recentEvents.forEach(event => {
      if (event.agent_id && agentStatuses.hasOwnProperty(event.agent_id)) {
        agentStatuses[event.agent_id] = event.success ? 'success' : 'failed';
      }
    });

    // Find last successful trigger timestamp (broader detection for Force Sync and other triggers)
    const lastSuccessfulTrigger = recentEvents.find(event => {
      // Look for various types of workflow triggers and successful agent events
      const isTriggerEvent = event.event_type === 'workflow.triggered' ||
                           event.event_type === 'workflow.started' ||
                           event.event_type === 'force_sync' ||
                           event.event_type === 'opal.sync' ||
                           (event.event_type && event.event_type.includes('trigger')) ||
                           (event.event_type && event.event_type.includes('workflow')) ||
                           (event.event_type && event.event_type.includes('sync'));

      // Also consider successful agent events as indicators of active workflow
      const isAgentActivity = event.event_type && (
        event.event_type.includes('agent.') ||
        event.event_type.includes('strategy_') ||
        event.agent_id ||
        event.agent_name
      );

      return (isTriggerEvent || isAgentActivity) && event.success;
    });

    // Enhanced workflow status detection
    const workflowAnalysis = analyzeWorkflowStatus(recentEvents);

    // Determine overall workflow status
    let workflowStatus = 'none';
    let lastWorkflowTime = null;

    // Prioritize based on activity and success
    if (workflowAnalysis.hasCompletedWorkflow && workflowAnalysis.agentResponseCount > 0) {
      workflowStatus = 'success';
      lastWorkflowTime = workflowAnalysis.lastCompletedWorkflow;
    } else if (workflowAnalysis.hasActiveWorkflow || workflowAnalysis.hasRecentActivity) {
      if (workflowAnalysis.hasFailedWorkflow && !workflowAnalysis.hasCompletedWorkflow) {
        workflowStatus = 'failed';
        lastWorkflowTime = workflowAnalysis.lastFailedWorkflow;
      } else {
        workflowStatus = workflowAnalysis.hasRecentActivity ? 'processing' : 'success';
        lastWorkflowTime = workflowAnalysis.lastTriggeredWorkflow || workflowAnalysis.lastCompletedWorkflow;
      }
    } else if (workflowAnalysis.totalWorkflowEvents > 0) {
      // Have historical events but no recent activity
      workflowStatus = 'success';
      lastWorkflowTime = workflowAnalysis.lastCompletedWorkflow || workflowAnalysis.lastTriggeredWorkflow;
    }

    // Fallback to successful trigger detection
    if (!lastWorkflowTime && lastSuccessfulTrigger) {
      workflowStatus = 'success';
      lastWorkflowTime = lastSuccessfulTrigger.received_at;
    }

    return NextResponse.json({
      success: true,
      stats: {
        total_received: stats.total_events,
        successful: Math.round(stats.total_events * (stats.success_rate / 100)),
        failed: stats.failed_events,
        last_24h: stats.total_events
      },
      status: {
        system_status: status.webhook_health,
        connection_status: status.connection_status,
        last_webhook_received: status.last_webhook_received,
        recent_failures: status.recent_failures
      },
      agentStatuses,
      lastTriggerTime: lastWorkflowTime || lastSuccessfulTrigger?.received_at || null,
      workflowStatus: workflowStatus,
      workflowAnalysis: {
        hasRecentActivity: workflowAnalysis.hasRecentActivity,
        agentResponseCount: workflowAnalysis.agentResponseCount,
        totalWorkflowEvents: workflowAnalysis.totalWorkflowEvents,
        hasCompletedWorkflow: workflowAnalysis.hasCompletedWorkflow,
        hasActiveWorkflow: workflowAnalysis.hasActiveWorkflow,
        hasFailedWorkflow: workflowAnalysis.hasFailedWorkflow
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Webhook stats API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch webhook statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}