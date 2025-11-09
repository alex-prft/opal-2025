import { NextRequest, NextResponse } from 'next/server';
import { requireAuthentication, createAuthErrorResponse } from '@/lib/utils/auth';
import { opalDataStore } from '@/lib/opal/supabase-data-store';

/**
 * Opal Status API - Polls Optimizely Opal for workflow status and results
 * Since we can't use custom webhook URLs, we use polling to check workflow completion
 */

export async function GET(request: NextRequest) {
  try {
    // Authenticate request
    const authResult = requireAuthentication(request);
    if (!authResult.isValid) {
      return NextResponse.json(createAuthErrorResponse(authResult.error!), { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get('workflow_id');
    const executionId = searchParams.get('execution_id');

    if (!workflowId) {
      return NextResponse.json(
        { error: 'Missing workflow_id parameter' },
        { status: 400 }
      );
    }

    console.log('Polling Opal for workflow status:', { workflowId, executionId });

    // Get Opal API credentials
    const opalApiUrl = process.env.OPAL_API_URL || 'https://api.opal.optimizely.com';
    const opalApiToken = process.env.OPAL_API_TOKEN;

    if (!opalApiToken) {
      // Return local simulation data if no API token
      console.log('No Opal API token found, returning simulation data');
      const localWorkflow = opalDataStore.getWorkflow(workflowId);

      if (localWorkflow) {
        return NextResponse.json({
          success: true,
          workflow_id: workflowId,
          status: localWorkflow.status,
          execution_id: executionId || 'simulation',
          agents: localWorkflow.results,
          simulation_mode: true,
          timestamp: new Date().toISOString()
        });
      }

      return NextResponse.json(
        { error: 'Workflow not found in simulation data' },
        { status: 404 }
      );
    }

    // Make API call to Opal to get workflow status
    const statusUrl = executionId
      ? `${opalApiUrl}/workflows/${workflowId}/executions/${executionId}`
      : `${opalApiUrl}/workflows/${workflowId}/executions`;

    console.log('Calling Opal API:', statusUrl);

    const opalResponse = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${opalApiToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!opalResponse.ok) {
      console.error('Opal API error:', {
        status: opalResponse.status,
        statusText: opalResponse.statusText
      });

      return NextResponse.json({
        error: 'Failed to fetch workflow status from Opal',
        status: opalResponse.status,
        workflow_id: workflowId,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    const opalData = await opalResponse.json();
    console.log('Opal API response:', opalData);

    // Transform Opal response to our format
    let workflowStatus = 'running';
    let agents = {};

    if (Array.isArray(opalData)) {
      // Latest execution if we got an array
      const latestExecution = opalData[0];
      workflowStatus = mapOpalStatus(latestExecution.status);
      agents = extractAgentResults(latestExecution);
    } else if (opalData.status) {
      // Single execution
      workflowStatus = mapOpalStatus(opalData.status);
      agents = extractAgentResults(opalData);
    }

    // Update local data store with Opal results
    if (workflowStatus === 'completed') {
      const localWorkflow = opalDataStore.getWorkflow(workflowId);
      if (localWorkflow) {
        opalDataStore.updateWorkflowStatus(workflowId, 'completed');

        // Add agent results if we extracted them
        Object.entries(agents).forEach(([agentId, result]: [string, any]) => {
          opalDataStore.addAgentResult(workflowId, agentId, result);
        });
      }
    }

    return NextResponse.json({
      success: true,
      workflow_id: workflowId,
      execution_id: executionId || opalData.execution_id,
      status: workflowStatus,
      agents,
      opal_data: opalData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Opal status polling error:', error);

    // Extract workflowId from request URL for error response
    const { searchParams } = new URL(request.url);
    const errorWorkflowId = searchParams.get('workflow_id');

    return NextResponse.json({
      error: 'Failed to poll Opal workflow status',
      message: error instanceof Error ? error.message : 'Unknown error',
      workflow_id: errorWorkflowId,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * Trigger Opal workflow with polling-based result retrieval
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = requireAuthentication(request);
    if (!authResult.isValid) {
      return NextResponse.json(createAuthErrorResponse(authResult.error!), { status: 401 });
    }

    const { workflow_name, input_data, metadata } = await request.json();

    if (!workflow_name || !input_data) {
      return NextResponse.json(
        { error: 'Missing required fields: workflow_name, input_data' },
        { status: 400 }
      );
    }

    console.log('Triggering Opal workflow with polling approach');

    const opalApiUrl = process.env.OPAL_API_URL || 'https://api.opal.optimizely.com';
    const opalApiToken = process.env.OPAL_API_TOKEN;
    const opalWorkflowId = process.env.OPAL_WORKFLOW_ID || '3a620654-64e6-4e90-8c78-326dd4c81fac';

    if (!opalApiToken) {
      console.log('No Opal API token, using simulation mode');

      // Generate simulation workflow
      const simulatedWorkflowId = `sim-opal-poll-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const workflow = opalDataStore.createWorkflow(simulatedWorkflowId, input_data, metadata?.session_id);

      // Start simulation after delay
      setTimeout(async () => {
        await simulateOpalWorkflowCompletion(simulatedWorkflowId, input_data);
      }, 3000);

      return NextResponse.json({
        success: true,
        workflow_id: simulatedWorkflowId,
        execution_id: `sim-exec-${Date.now()}`,
        status: 'triggered',
        message: 'Simulation workflow triggered',
        simulation_mode: true,
        polling_url: `/api/opal/status?workflow_id=${simulatedWorkflowId}`,
        timestamp: new Date().toISOString()
      });
    }

    // Real Opal API call
    console.log('Calling real Opal API to trigger workflow');

    const triggerUrl = `${opalApiUrl}/workflows/${opalWorkflowId}/trigger`;
    const opalResponse = await fetch(triggerUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${opalApiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: input_data,
        metadata: {
          ...metadata,
          triggered_at: new Date().toISOString(),
          engine_version: '2.0.0-polling'
        }
      })
    });

    if (!opalResponse.ok) {
      throw new Error(`Opal API error: ${opalResponse.status} - ${opalResponse.statusText}`);
    }

    const opalResult = await opalResponse.json();
    const workflowId = opalResult.workflow_id || opalResult.id;
    const executionId = opalResult.execution_id || opalResult.id;

    console.log('Opal workflow triggered:', { workflowId, executionId });

    // Create local workflow record for tracking
    opalDataStore.createWorkflow(workflowId, input_data, metadata?.session_id);

    return NextResponse.json({
      success: true,
      workflow_id: workflowId,
      execution_id: executionId,
      status: 'triggered',
      message: 'Opal workflow triggered successfully',
      polling_url: `/api/opal/status?workflow_id=${workflowId}&execution_id=${executionId}`,
      opal_data: opalResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Opal trigger error:', error);
    return NextResponse.json({
      error: 'Failed to trigger Opal workflow',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper functions
function mapOpalStatus(opalStatus: string): string {
  switch (opalStatus?.toLowerCase()) {
    case 'completed':
    case 'success':
    case 'finished':
      return 'completed';
    case 'failed':
    case 'error':
      return 'failed';
    case 'running':
    case 'in_progress':
    case 'executing':
      return 'running';
    case 'pending':
    case 'queued':
      return 'pending';
    default:
      return 'running';
  }
}

function extractAgentResults(opalExecution: any): any {
  const agents: any = {};

  // Try to extract agent results from Opal execution data
  if (opalExecution.agent_results) {
    return opalExecution.agent_results;
  }

  if (opalExecution.results) {
    // Map Opal result format to our agent format
    Object.entries(opalExecution.results).forEach(([key, result]: [string, any]) => {
      agents[key] = {
        agent_id: key,
        agent_name: key,
        output: result,
        success: true,
        execution_time_ms: result.execution_time_ms || 0,
        timestamp: new Date().toISOString()
      };
    });
  }

  return agents;
}

async function simulateOpalWorkflowCompletion(workflowId: string, inputData: any) {
  console.log('Starting simulation for workflow:', workflowId);

  const agents = ['agent_1', 'agent_2', 'agent_3'];

  // Simulate each agent completing
  for (let i = 0; i < agents.length; i++) {
    const agentId = agents[i];
    const delay = (i + 1) * 2000; // 2s, 4s, 6s, 8s, 10s

    setTimeout(() => {
      const agentResult = {
        agent_id: agentId,
        agent_name: agentId,
        output: generateSimulatedAgentOutput(agentId, inputData),
        success: true,
        execution_time_ms: Math.floor(Math.random() * 3000) + 1000,
        timestamp: new Date().toISOString()
      };

      opalDataStore.addAgentResult(workflowId, agentId, agentResult);
      console.log(`Simulated agent completed: ${agentId}`);

      // Mark workflow as complete when all agents finish
      if (i === agents.length - 1) {
        opalDataStore.updateWorkflowStatus(workflowId, 'completed');
        console.log('Simulation workflow completed:', workflowId);
      }
    }, delay);
  }
}

function generateSimulatedAgentOutput(agentId: string, inputData: any): string {
  const clientName = inputData.client_name || 'OSA Client';

  return `# ${agentId} Analysis for ${clientName}

## Analysis Summary
Comprehensive analysis completed successfully for ${clientName}.

## Key Findings
- Strategic assessment completed
- Personalization opportunities identified
- Implementation roadmap developed
- Success metrics defined

## Recommendations
1. Review strategic recommendations
2. Prioritize implementation phases
3. Set up measurement framework
4. Monitor progress and optimize

## Next Steps
Ready for strategic planning and implementation based on analysis results.

*This is a simulated response generated for demonstration purposes.*`;
}