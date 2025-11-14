/**
 * OPAL Workflow Tracker API Endpoint
 * Provides access to workflow tracking data for monitoring and debugging
 */

import { NextRequest, NextResponse } from 'next/server';
import { opalWorkflowTracker } from '@/lib/monitoring/opal-workflow-tracker';

export const dynamic = 'force-dynamic';

/**
 * GET /api/opal/workflow-tracker - Get workflow tracking status
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const correlationId = url.searchParams.get('correlation_id');
    const hours = parseInt(url.searchParams.get('hours') || '24');

    if (correlationId) {
      // Get specific workflow details
      const execution = opalWorkflowTracker.getWorkflowExecution(correlationId);
      const callbacks = opalWorkflowTracker.getWorkflowCallbacks(correlationId);

      if (!execution) {
        return NextResponse.json({
          error: 'Workflow not found',
          correlation_id: correlationId
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        correlation_id: correlationId,
        execution,
        callbacks,
        callback_count: callbacks.length
      });
    }

    // Get monitoring report
    const report = opalWorkflowTracker.generateMonitoringReport();
    const stats = opalWorkflowTracker.getWorkflowStats(hours);

    return NextResponse.json({
      success: true,
      monitoring_report: report,
      stats_last_hours: {
        hours,
        ...stats
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Workflow tracker API error:', error);

    return NextResponse.json({
      error: 'Failed to retrieve workflow tracking data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * POST /api/opal/workflow-tracker/cleanup - Cleanup old workflows
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const olderThanHours = body.older_than_hours || 72;

    opalWorkflowTracker.cleanup(olderThanHours);

    return NextResponse.json({
      success: true,
      message: `Cleaned up workflows older than ${olderThanHours} hours`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Workflow tracker cleanup error:', error);

    return NextResponse.json({
      error: 'Failed to cleanup workflow tracking data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}