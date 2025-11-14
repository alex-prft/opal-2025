/**
 * Test endpoint to manually complete OPAL workflows for UI testing
 * Only for development/testing purposes
 */

import { NextRequest, NextResponse } from 'next/server';
import { opalWorkflowTracker } from '@/lib/monitoring/opal-workflow-tracker';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { correlation_id, status = 'completed' } = body;

    if (!correlation_id) {
      return NextResponse.json({
        error: 'correlation_id is required'
      }, { status: 400 });
    }

    console.log(`🧪 [Test] Manually updating workflow status: ${correlation_id} -> ${status}`);

    // Update workflow status
    opalWorkflowTracker.updateWorkflowStatus(correlation_id, status, {
      callback_received: true,
      callback_timestamp: new Date().toISOString()
    });

    const updatedExecution = opalWorkflowTracker.getWorkflowExecution(correlation_id);

    return NextResponse.json({
      success: true,
      message: `Workflow ${correlation_id} updated to ${status}`,
      execution: updatedExecution,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Test complete workflow error:', error);

    return NextResponse.json({
      error: 'Failed to update workflow status',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}