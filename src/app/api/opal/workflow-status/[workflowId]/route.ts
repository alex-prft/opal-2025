/**
 * OPAL Workflow Status Polling API Endpoint
 * Provides real-time status updates for OPAL workflow execution
 * Used by UI components for polling after Force Sync completion
 */

import { NextRequest, NextResponse } from 'next/server';
import { opalWorkflowTracker } from '@/lib/monitoring/opal-workflow-tracker';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    workflowId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { workflowId } = await params;

  console.log(`🔍 [OPAL Status] Polling status for workflow: ${workflowId}`);

  if (!workflowId) {
    return NextResponse.json({
      success: false,
      error: 'Workflow ID is required',
      workflow_id: 'unknown',
      polling: {
        should_continue: false,
        interval_ms: 0,
        stop_reason: 'missing_workflow_id'
      },
      timestamp: new Date().toISOString()
    }, { status: 400 });
  }

  try {
    // Try to find workflow by various IDs (correlation ID, workflow ID, session ID)
    let execution = opalWorkflowTracker.getWorkflowExecution(workflowId);

    // If not found by direct match, search through all workflows (active and completed)
    if (!execution) {
      // First try active workflows
      const allActiveWorkflows = opalWorkflowTracker.getActiveWorkflows();
      execution = allActiveWorkflows.find(w =>
        w.workflow_id === workflowId ||
        w.span_id === workflowId ||
        w.correlation_id?.includes(workflowId) ||
        w.correlation_id === workflowId
      );

      // If still not found, search all executions (including completed)
      if (!execution) {
        const allExecutions = opalWorkflowTracker.getAllWorkflows();
        execution = allExecutions.find(w =>
          w.workflow_id === workflowId ||
          w.span_id === workflowId ||
          w.correlation_id?.includes(workflowId) ||
          w.correlation_id === workflowId
        );
      }
    }

    if (!execution) {
      console.log(`⚠️ [OPAL Status] No workflow found for ID: ${workflowId}`);

      // Enhanced 404 response with proper polling control
      return NextResponse.json({
        success: false,
        error: 'OPAL workflow not found',
        workflow_id: workflowId,
        message: 'The workflow may have completed, expired, or never existed. Polling will continue with exponential backoff.',
        polling: {
          should_continue: true,  // Allow continued polling with backoff
          interval_ms: 5000,      // Increase interval for missing workflows
          stop_reason: null,
          max_attempts_remaining: 15  // Hint for client-side limiting
        },
        status: 'not_found',
        timestamp: new Date().toISOString(),
        suggestions: [
          'Check if Force Sync was triggered successfully',
          'Verify correlation ID matches Force Sync session',
          'Try refreshing the page if polling persists'
        ]
      }, {
        status: 404,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Retry-After': '5'  // Suggest 5 second retry
        }
      });
    }

    // Get callbacks for this workflow
    const callbacks = opalWorkflowTracker.getWorkflowCallbacks(execution.correlation_id);
    const latestCallback = callbacks.length > 0 ? callbacks[callbacks.length - 1] : null;

    // Determine polling interval based on status
    let pollingInterval = null;
    if (execution.status === 'in_progress' || execution.status === 'initiated') {
      pollingInterval = 3000; // Poll every 3 seconds while in progress
    }

    // Calculate progress percentage
    let progressPercentage = 0;
    switch (execution.status) {
      case 'initiated':
        progressPercentage = 10;
        break;
      case 'in_progress':
        progressPercentage = callbacks.length > 0 ? 75 : 50;
        break;
      case 'completed':
        progressPercentage = 100;
        break;
      case 'failed':
        progressPercentage = 0;
        break;
    }

    // Build response with comprehensive status information
    const statusResponse = {
      success: true,
      workflow_id: workflowId,
      opal_status: {
        workflow_id: execution.workflow_id,
        correlation_id: execution.correlation_id,
        status: execution.status,
        progress_percentage: progressPercentage,
        started_at: execution.started_at,
        updated_at: execution.updated_at,
        completed_at: execution.completed_at,
        duration_ms: execution.duration_ms,
        workflow_name: execution.workflow_name,
        client_name: execution.client_name,
        callback_received: execution.callback_received,
        callback_timestamp: execution.callback_timestamp
      },
      callbacks: {
        total_callbacks: callbacks.length,
        latest_callback: latestCallback ? {
          agent_id: latestCallback.agent_id,
          execution_status: latestCallback.execution_status,
          received_at: latestCallback.received_at,
          signature_valid: latestCallback.signature_valid
        } : null
      },
      polling: {
        should_continue: execution.status === 'in_progress' || execution.status === 'initiated',
        interval_ms: pollingInterval,
        next_poll_at: pollingInterval ? new Date(Date.now() + pollingInterval).toISOString() : null
      },
      execution_details: execution.response_data || null,
      error_details: execution.error_details || null,
      timestamp: new Date().toISOString()
    };

    console.log(`✅ [OPAL Status] Status retrieved for workflow ${workflowId}:`, {
      status: execution.status,
      progress: progressPercentage,
      callbacks: callbacks.length,
      should_poll: statusResponse.polling.should_continue
    });

    return NextResponse.json(statusResponse, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('OPAL workflow status API error:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to get OPAL workflow status',
      workflow_id: workflowId || 'unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      polling: {
        should_continue: false,  // Stop polling on server errors
        interval_ms: 0,
        stop_reason: 'server_error'
      },
      status: 'error',
      timestamp: new Date().toISOString(),
      suggestions: [
        'Check server logs for detailed error information',
        'Try refreshing the page',
        'Contact support if the issue persists'
      ]
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
}