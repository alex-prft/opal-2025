import { NextRequest, NextResponse } from 'next/server';
import { webhookEventOperations } from '@/lib/database/webhook-events';

// OSA Workflow Data Tools status tracking interface
interface OSAAgentDataStatus {
  agent_id: string;
  agent_name: string;
  last_data_received: string | null;
  data_reception_success: boolean;
  tool_execution_count: number;
  avg_processing_time: number;
  last_error: string | null;
  data_freshness_minutes: number | null;
}

// GET OSA Workflow Data Tools status for all agents
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get('hours') || '24', 10);
    const agentId = searchParams.get('agent_id');

    // Get recent OSA workflow data tool events
    const recentEvents = await webhookEventOperations.getWebhookEvents({
      limit: 500,
      start_date: new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
    });

    // Filter for OSA Workflow Data Tools events
    const osaToolEvents = recentEvents.filter(event =>
      event.event_type?.includes('osa_workflow_data') ||
      event.event_type?.includes('osa.tool') ||
      event.tool_name === 'send_data_to_osa_enhanced' ||
      (event.agent_data && event.agent_data.tool_type === 'osa_workflow_data') ||
      event.event_type === 'agent.data_received' ||
      event.event_type === 'workflow.data_sync'
    );

    // Agent mapping with display names
    const agentMapping = {
      integration_health: 'Integration Health Monitor',
      content_review: 'Content Analysis Engine',
      geo_audit: 'Geographic Performance Auditor',
      audience_suggester: 'Audience Intelligence Engine',
      experiment_blueprinter: 'Experiment Design Assistant',
      personalization_idea_generator: 'Personalization Strategy AI',
      customer_journey: 'Customer Journey Mapper',
      roadmap_generator: 'Strategic Roadmap Planner',
      cmp_organizer: 'Campaign Management Optimizer'
    };

    // Build agent status data
    const agentStatusData: OSAAgentDataStatus[] = Object.entries(agentMapping).map(([id, name]) => {
      // Find all events for this agent
      const agentEvents = osaToolEvents.filter(event => event.agent_id === id);
      const successfulEvents = agentEvents.filter(event => event.success);
      const latestEvent = agentEvents[0]; // Events are ordered by timestamp desc

      let dataFreshnessMinutes = null;
      if (latestEvent?.received_at) {
        dataFreshnessMinutes = Math.floor(
          (Date.now() - new Date(latestEvent.received_at).getTime()) / (1000 * 60)
        );
      }

      const avgProcessingTime = agentEvents.length > 0 ?
        agentEvents.reduce((sum, event) => sum + (event.processing_time_ms || 0), 0) / agentEvents.length :
        0;

      const lastError = agentEvents.find(event => !event.success)?.error_text || null;

      return {
        agent_id: id,
        agent_name: name,
        last_data_received: latestEvent?.received_at || null,
        data_reception_success: latestEvent?.success || false,
        tool_execution_count: agentEvents.length,
        avg_processing_time: Math.round(avgProcessingTime),
        last_error: lastError,
        data_freshness_minutes: dataFreshnessMinutes
      };
    });

    // Filter by specific agent if requested
    const filteredData = agentId ?
      agentStatusData.filter(agent => agent.agent_id === agentId) :
      agentStatusData;

    // Calculate summary statistics
    const totalAgents = agentStatusData.length;
    const activeAgents = agentStatusData.filter(agent =>
      agent.last_data_received && agent.data_reception_success
    ).length;
    const agentsWithRecentData = agentStatusData.filter(agent =>
      agent.data_freshness_minutes !== null && agent.data_freshness_minutes <= 60
    ).length;
    const totalExecutions = agentStatusData.reduce((sum, agent) => sum + agent.tool_execution_count, 0);

    return NextResponse.json({
      success: true,
      summary: {
        total_agents: totalAgents,
        active_agents: activeAgents,
        agents_with_recent_data: agentsWithRecentData,
        data_reception_rate: activeAgents / totalAgents,
        total_osa_tool_executions: totalExecutions,
        avg_processing_time: Math.round(
          agentStatusData.reduce((sum, agent) => sum + agent.avg_processing_time, 0) / totalAgents
        )
      },
      agents: filteredData,
      last_updated: new Date().toISOString(),
      time_range_hours: hours
    });

  } catch (error) {
    console.error('OSA Workflow Data Tools status API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch OSA Workflow Data Tools status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST to manually trigger OSA Workflow Data Tools test
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agent_ids, test_payload } = body;

    const results = [];

    // Test each agent or all if none specified
    const agentsToTest = agent_ids || [
      'integration_health', 'content_review', 'geo_audit',
      'audience_suggester', 'experiment_blueprinter', 'personalization_idea_generator',
      'customer_journey', 'roadmap_generator', 'cmp_organizer'
    ];

    for (const agentId of agentsToTest) {
      try {
        const startTime = Date.now();

        // Call the enhanced OSA tools endpoint
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/opal/enhanced-tools`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tool_name: "send_data_to_osa_enhanced",
            parameters: {
              workflow_id: `osa-tools-test-${Date.now()}`,
              agent_id: agentId,
              execution_status: "success",
              agent_data: test_payload || {
                test: "osa_workflow_data_tools_test",
                timestamp: new Date().toISOString(),
                agent_id: agentId
              }
            }
          })
        });

        const data = await response.json();
        const responseTime = Date.now() - startTime;

        results.push({
          agent_id: agentId,
          success: data.success || false,
          response_time_ms: responseTime,
          message: data.message || 'Test completed',
          error: data.error || null
        });

      } catch (error) {
        results.push({
          agent_id: agentId,
          success: false,
          response_time_ms: 0,
          message: 'Test failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;

    return NextResponse.json({
      success: successCount > 0,
      test_results: results,
      summary: {
        agents_tested: results.length,
        successful_tests: successCount,
        failed_tests: results.length - successCount,
        avg_response_time: Math.round(
          results.reduce((sum, r) => sum + r.response_time_ms, 0) / results.length
        )
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('OSA Workflow Data Tools test API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to test OSA Workflow Data Tools',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}