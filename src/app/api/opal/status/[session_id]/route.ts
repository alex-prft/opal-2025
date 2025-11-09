// API Route: Get Opal Workflow Status
// Provides real-time workflow progress and completion status
// Used for polling workflow execution progress from frontend

import { NextRequest, NextResponse } from 'next/server';
import { opalWorkflowEngine } from '@/lib/opal/workflow-engine';
import { workflowDb } from '@/lib/database/workflow-operations';
import { WorkflowStatusResponse } from '@/lib/types/opal';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ session_id: string }> }
) {
  const startTime = Date.now();
  const resolvedParams = await params;
  const sessionId = resolvedParams.session_id;

  try {

    if (!sessionId) {
      return NextResponse.json({
        error: 'Missing session_id parameter',
        message: 'Session ID is required to check workflow status'
      }, { status: 400 });
    }

    console.log(`📊 [API] Status check for session: ${sessionId}`);

    // Get workflow status from engine
    const statusData = await opalWorkflowEngine.getWorkflowStatus(sessionId);

    const response: WorkflowStatusResponse = {
      workflow_id: statusData.workflow.id,
      session_id: statusData.workflow.session_id,
      status: statusData.workflow.status,
      progress: statusData.progress,
      current_step: statusData.workflow.current_step,
      estimated_completion: statusData.progress.estimated_completion,
      results: statusData.results
    };

    // Log performance metrics
    await workflowDb.logAPIPerformance({
      endpoint: `/api/opal/status/${sessionId}`,
      method: 'GET',
      workflowId: statusData.workflow.id,
      responseTimeMs: Date.now() - startTime,
      statusCode: 200,
      payloadSizeBytes: JSON.stringify(response).length,
      dxpPlatform: 'opal',
      apiCallType: 'status_check'
    });

    const totalDuration = Date.now() - startTime;
    console.log(`✅ [API] Status check completed for ${sessionId} (${totalDuration}ms)`);

    return NextResponse.json(response);

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    console.error(`❌ [API] Status check failed for session ${sessionId}:`, error);

    // Log error performance
    await workflowDb.logAPIPerformance({
      endpoint: `/api/opal/status/${sessionId}`,
      method: 'GET',
      responseTimeMs: duration,
      statusCode: 500,
      dxpPlatform: 'opal',
      apiCallType: 'status_check',
      errorMessage
    });

    // Check if it's a "not found" error
    if (errorMessage.includes('Workflow not found')) {
      return NextResponse.json({
        error: 'Workflow not found',
        message: `No workflow found for session: ${sessionId}`
      }, { status: 404 });
    }

    return NextResponse.json({
      error: 'Internal server error',
      message: `Failed to get workflow status: ${errorMessage}`
    }, { status: 500 });
  }
}

// OPTIONS for CORS support
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}