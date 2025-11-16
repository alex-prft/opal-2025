import { NextRequest, NextResponse } from 'next/server';
import { webhookEventOperations } from '@/lib/database/webhook-events';

// Enhanced force sync detection for OPAL integration
function detectForceSync(events: any[]) {
  const forceSyncEvent = events.find(event =>
    event.event_type === 'opal.force_sync' ||
    event.event_type === 'force_sync' ||
    event.event_type === 'manual_sync' ||
    (event.workflow_id && event.workflow_id.includes('force-sync')) ||
    (event.workflow_id && event.workflow_id.includes('manual-sync')) ||
    event.trigger_source === 'manual_sync' ||
    event.trigger_source === 'force_sync' ||
    (event.agent_data && event.agent_data.sync_type === 'force')
  );

  // Extract OPAL correlation ID and workflow info from recent force sync
  const opalCorrelationId = forceSyncEvent?.correlation_id ||
    (forceSyncEvent?.workflow_id?.startsWith('force-sync-') ? forceSyncEvent.workflow_id : null);

  return {
    lastForceSync: forceSyncEvent?.received_at || new Date().toISOString(),
    forceSyncWorkflowId: forceSyncEvent?.workflow_id || null,
    forceSyncSuccess: forceSyncEvent?.success ?? true,
    forceSyncAgentCount: forceSyncEvent ?
      events.filter(e => e.workflow_id === forceSyncEvent.workflow_id && e.agent_id).length : 0,
    // OPAL integration fields - only return if actual workflow exists
    opalCorrelationId: opalCorrelationId || null,
    opalWorkflowId: forceSyncEvent?.opal_workflow_id || null,
    opalStatus: forceSyncEvent ? 'in_progress' : null,
    opalProgress: forceSyncEvent ? 50 : null
  };
}

// OSA Workflow Data Tools integration tracking
function analyzeOSAWorkflowDataTools(events: any[]) {
  const osaToolEvents = events.filter(event =>
    event.event_type?.includes('osa_workflow_data') ||
    event.event_type?.includes('osa.tool') ||
    event.tool_name === 'send_data_to_osa_enhanced' ||
    (event.agent_data && event.agent_data.tool_type === 'osa_workflow_data')
  );

  const agentDataReception = {
    integration_health: null,
    content_review: null,
    geo_audit: null,
    audience_suggester: null,
    experiment_blueprinter: null,
    personalization_idea_generator: null,
    customer_journey: null,
    roadmap_generator: null,
    cmp_organizer: null
  };

  // Map OSA tool executions to agents
  osaToolEvents.forEach(event => {
    if (event.agent_id && agentDataReception.hasOwnProperty(event.agent_id)) {
      if (!agentDataReception[event.agent_id] ||
          new Date(event.received_at) > new Date(agentDataReception[event.agent_id].timestamp)) {
        agentDataReception[event.agent_id] = {
          timestamp: event.received_at,
          success: event.success,
          tool_execution_time: event.processing_time_ms || null,
          data_size: event.agent_data?.data_size || null
        };
      }
    }
  });

  return {
    lastOSAToolExecution: osaToolEvents[0]?.received_at || null,
    totalOSAToolExecutions: osaToolEvents.length,
    agentDataReception,
    successfulReceptions: Object.values(agentDataReception).filter(r => r && r.success).length
  };
}

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

    // Force sync detection
    const forceSyncData = detectForceSync(recentEvents);

    // OSA Workflow Data Tools analysis
    const osaToolsData = analyzeOSAWorkflowDataTools(recentEvents);

    // Enhanced agent status mapping with OSA tool data
    Object.keys(agentStatuses).forEach(agentId => {
      const osaReception = osaToolsData.agentDataReception[agentId];
      if (osaReception) {
        agentStatuses[agentId] = osaReception.success ? 'success' : 'failed';
      }

      // Fallback to webhook events if no OSA tool data
      if (agentStatuses[agentId] === 'unknown') {
        const recentAgentEvent = recentEvents.find(e => e.agent_id === agentId);
        if (recentAgentEvent) {
          agentStatuses[agentId] = recentAgentEvent.success ? 'success' : 'failed';
        }
      }
    });

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
      // Enhanced OPAL force sync data
      forceSync: {
        lastForceSync: forceSyncData.lastForceSync,
        forceSyncWorkflowId: forceSyncData.forceSyncWorkflowId,
        forceSyncSuccess: forceSyncData.forceSyncSuccess,
        forceSyncAgentCount: forceSyncData.forceSyncAgentCount,
        // OPAL integration fields
        opalCorrelationId: forceSyncData.opalCorrelationId,
        opalWorkflowId: forceSyncData.opalWorkflowId,
        opalStatus: forceSyncData.opalStatus,
        opalProgress: forceSyncData.opalProgress
      },
      // OSA Workflow Data Tools integration
      osaWorkflowData: {
        lastOSAToolExecution: osaToolsData.lastOSAToolExecution,
        totalOSAToolExecutions: osaToolsData.totalOSAToolExecutions,
        agentDataReception: osaToolsData.agentDataReception,
        successfulReceptions: osaToolsData.successfulReceptions,
        dataReceptionRate: osaToolsData.successfulReceptions / Object.keys(agentStatuses).length
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