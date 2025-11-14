/**
 * Enhanced Force Sync Trigger API Route
 * Unified endpoint for all force sync operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { ForceSyncService, type ForceSyncOptions } from '@/lib/force-sync/force-sync-service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    if (!process.env.OPAL_STRATEGY_WORKFLOW_AUTH_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Configuration Error',
        message: 'OPAL authentication not configured'
      }, { status: 500 });
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));

    // Validate and prepare sync options
    const options: ForceSyncOptions = {
      sync_scope: body.sync_scope || 'quick',
      client_context: {
        client_name: body.client_name || body.client_context?.client_name,
        industry: body.industry || body.client_context?.industry,
        recipients: body.recipients || body.client_context?.recipients
      },
      triggered_by: body.triggered_by || 'api_request',
      metadata: {
        user_agent: request.headers.get('user-agent'),
        ip_address: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
        timestamp: new Date().toISOString(),
        ...body.metadata
      }
    };

    // Get sync service instance
    const syncService = ForceSyncService.getInstance();

    // Check for active syncs (prevent concurrent syncs)
    const activeSyncs = syncService.getAllActiveSessions();
    if (activeSyncs.length > 0) {
      console.warn('Force sync requested while another sync is active:', activeSyncs[0]);
      return NextResponse.json({
        success: false,
        error: 'Sync Already Active',
        message: 'Another force sync is currently in progress',
        active_sync: {
          session_id: activeSyncs[0].id,
          status: activeSyncs[0].status,
          polling_url: `/api/force-sync/status/${activeSyncs[0].id}`
        }
      }, { status: 409 });
    }

    // Trigger the sync
    console.log('🔄 [Force Sync] Triggering sync with options:', {
      sync_scope: options.sync_scope,
      triggered_by: options.triggered_by,
      client_name: options.client_context?.client_name
    });

    const result = await syncService.triggerSync(options);

    console.log('✅ [Force Sync] Sync initiated:', {
      success: result.success,
      correlation_id: result.correlation_id,
      session_id: result.session_id
    });

    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': result.correlation_id,
        'X-Session-ID': result.session_id || ''
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    console.error('❌ [Force Sync] API error:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'Internal Server Error',
      message: `Force sync failed: ${errorMessage}`,
      correlation_id: `error-${Date.now()}`,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Get active syncs
export async function GET(request: NextRequest) {
  try {
    const syncService = ForceSyncService.getInstance();
    const activeSyncs = syncService.getAllActiveSessions();
    const lastSyncTimestamp = syncService.getLastSyncTimestamp();

    return NextResponse.json({
      success: true,
      active_syncs: activeSyncs.map(sync => ({
        session_id: sync.id,
        status: sync.status.status,
        progress: sync.status.progress,
        message: sync.status.message,
        started_at: sync.status.started_at,
        updated_at: sync.status.updated_at,
        polling_url: `/api/force-sync/status/${sync.id}`
      })),
      last_sync_timestamp: lastSyncTimestamp,
      has_active_sync: activeSyncs.length > 0
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    console.error('Force sync status API error:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to get sync status',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}