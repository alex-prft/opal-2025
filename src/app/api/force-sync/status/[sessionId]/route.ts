/**
 * Force Sync Status API Route
 * Provides real-time status updates for force sync operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { ForceSyncService } from '@/lib/force-sync/force-sync-service';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{
    sessionId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json({
        error: 'Session ID is required'
      }, { status: 400 });
    }

    const syncService = ForceSyncService.getInstance();
    const status = syncService.getSessionStatus(sessionId);

    if (!status) {
      return NextResponse.json({
        error: 'Sync session not found',
        session_id: sessionId
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      session_id: sessionId,
      status: status.status,
      progress: status.progress,
      message: status.message,
      started_at: status.started_at,
      updated_at: status.updated_at,
      details: status.details,
      polling_interval: status.status === 'in_progress' ? 2000 : null // 2 seconds while in progress
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Force sync status API error:', error);

    return NextResponse.json({
      error: 'Failed to get sync status',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Cancel a sync operation
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json({
        error: 'Session ID is required'
      }, { status: 400 });
    }

    const syncService = ForceSyncService.getInstance();
    const cancelled = await syncService.cancelSync(sessionId);

    if (!cancelled) {
      return NextResponse.json({
        error: 'Cannot cancel sync session',
        session_id: sessionId,
        message: 'Session not found or not in cancellable state'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      session_id: sessionId,
      message: 'Sync operation cancelled successfully'
    });

  } catch (error) {
    console.error('Force sync cancel API error:', error);

    return NextResponse.json({
      error: 'Failed to cancel sync',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}