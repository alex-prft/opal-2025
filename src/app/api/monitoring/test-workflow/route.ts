/**
 * Test API endpoint for simulating OPAL workflow events
 * Use this to test the monitoring dashboard and agent status tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { webhookAgentIntegration } from '@/lib/integrations/webhook-agent-integration';

export async function POST(request: NextRequest) {
  try {
    const testWorkflowId = `test-workflow-${Date.now()}`;
    const testWorkflowName = 'Test OPAL Workflow';

    console.log(`🧪 [TestWorkflow] Starting test workflow: ${testWorkflowId}`);

    // 1. Trigger workflow started event
    await webhookAgentIntegration.processWebhookEvent({
      event_type: 'workflow.triggered',
      workflow_id: testWorkflowId,
      workflow_name: testWorkflowName,
      timestamp: new Date().toISOString(),
      trigger_source: 'manual',
      metadata: {
        client_id: 'test-client',
        environment: 'development',
        user_id: 'test-user'
      }
    });

    // 2. Simulate agent execution with realistic delays
    const agents = ['content_review', 'geo_audit', 'audience_suggester', 'experiment_blueprinter', 'personalization_idea_generator'];

    for (let i = 0; i < agents.length; i++) {
      const agentId = agents[i];
      const delay = (i + 1) * 2000; // 2s, 4s, 6s, 8s, 10s

      setTimeout(async () => {
        try {
          // Start agent
          console.log(`🚀 [TestWorkflow] Starting agent: ${agentId}`);
          await webhookAgentIntegration.processWebhookEvent({
            event_type: 'agent.started',
            workflow_id: testWorkflowId,
            workflow_name: testWorkflowName,
            timestamp: new Date().toISOString(),
            agent_id: agentId,
            agent_name: agentId.replace(/_/g, ' ').toUpperCase()
          });

          // Complete agent after execution time
          setTimeout(async () => {
            const success = Math.random() > 0.15; // 85% success rate
            const executionTime = 15000 + Math.random() * 25000; // 15-40 seconds

            console.log(`${success ? '✅' : '❌'} [TestWorkflow] ${success ? 'Completing' : 'Failing'} agent: ${agentId}`);

            await webhookAgentIntegration.processWebhookEvent({
              event_type: 'agent.completed',
              workflow_id: testWorkflowId,
              workflow_name: testWorkflowName,
              timestamp: new Date().toISOString(),
              agent_id: agentId,
              agent_name: agentId.replace(/_/g, ' ').toUpperCase(),
              agent_success: success,
              execution_time_ms: Math.floor(executionTime),
              agent_error: success ? undefined : 'Simulated agent failure for testing',
              agent_output: success ? {
                status: 'completed',
                results: `Mock results for ${agentId}`,
                metrics: {
                  processed_items: Math.floor(Math.random() * 1000) + 100,
                  confidence_score: Math.random() * 0.4 + 0.6 // 0.6-1.0
                }
              } : undefined
            });

            // If this is the last agent, complete the workflow
            if (i === agents.length - 1) {
              setTimeout(async () => {
                console.log(`🏁 [TestWorkflow] Completing workflow: ${testWorkflowId}`);
                await webhookAgentIntegration.processWebhookEvent({
                  event_type: 'workflow.completed',
                  workflow_id: testWorkflowId,
                  workflow_name: testWorkflowName,
                  timestamp: new Date().toISOString(),
                  trigger_source: 'manual'
                });
              }, 1000);
            }
          }, 8000 + Math.random() * 12000); // 8-20 second execution time
        } catch (error) {
          console.error(`❌ [TestWorkflow] Error processing agent ${agentId}:`, error);
        }
      }, delay);
    }

    return NextResponse.json({
      success: true,
      workflow_id: testWorkflowId,
      message: 'Test workflow started successfully',
      agents: agents.length,
      estimated_duration: '60-90 seconds'
    });

  } catch (error) {
    console.error('❌ [TestWorkflow] Failed to start test workflow:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to start test workflow',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'OPAL Monitoring Test Workflow API',
    usage: 'POST to /api/monitoring/test-workflow to simulate a complete OPAL workflow execution',
    description: 'This endpoint simulates workflow.triggered, agent.started, agent.completed, and workflow.completed events',
    agents: ['content_review', 'geo_audit', 'audience_suggester', 'experiment_blueprinter', 'personalization_idea_generator'],
    timing: 'Agents start every 2 seconds, execute for 8-20 seconds each'
  });
}