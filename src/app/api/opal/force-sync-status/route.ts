/**
 * Enhanced Force Sync Status API
 * Tracks OPAL force sync operations with comprehensive fallback and caching
 */

import { NextRequest, NextResponse } from 'next/server';
import { webhookEventOperations } from '@/lib/database/webhook-events';
import { promises as fs } from 'fs';
import path from 'path';

// Force sync detection patterns
const FORCE_SYNC_PATTERNS = [
  'opal.force_sync',
  'force_sync',
  'manual_sync',
  'force-sync',
  'manual-sync',
  'sync.force',
  'sync.manual'
];

// Cache for force sync data
let forceSyncCache: {
  data: any;
  timestamp: number;
  ttl: number;
} | null = null;

const CACHE_TTL = 60000; // 1 minute cache for force sync data

interface ForceSyncEvent {
  id?: string;
  workflow_id: string;
  event_type: string;
  received_at: string;
  success: boolean;
  agent_id?: string;
  agent_data?: any;
  trigger_source?: string;
}

/**
 * Enhanced force sync detection with multiple patterns
 */
function detectForceSyncEvents(events: any[]): {
  lastForceSync: string | null;
  forceSyncWorkflowId: string | null;
  forceSyncSuccess: boolean;
  forceSyncAgentCount: number;
  allForceSyncEvents: ForceSyncEvent[];
  forceSyncHistory: any[];
} {
  // Find all potential force sync events
  const forceSyncEvents = events.filter(event => {
    // Check event type patterns
    const eventTypeMatch = FORCE_SYNC_PATTERNS.some(pattern =>
      event.event_type?.toLowerCase().includes(pattern.toLowerCase())
    );

    // Check workflow ID patterns
    const workflowIdMatch = event.workflow_id && FORCE_SYNC_PATTERNS.some(pattern =>
      event.workflow_id.toLowerCase().includes(pattern.toLowerCase())
    );

    // Check trigger source
    const triggerSourceMatch = event.trigger_source && FORCE_SYNC_PATTERNS.some(pattern =>
      event.trigger_source.toLowerCase().includes(pattern.toLowerCase())
    );

    // Check agent data
    const agentDataMatch = event.agent_data && (
      event.agent_data.sync_type === 'force' ||
      event.agent_data.sync_type === 'manual' ||
      event.agent_data.trigger_type === 'force_sync'
    );

    return eventTypeMatch || workflowIdMatch || triggerSourceMatch || agentDataMatch;
  });

  // Sort by timestamp (most recent first)
  forceSyncEvents.sort((a, b) =>
    new Date(b.received_at).getTime() - new Date(a.received_at).getTime()
  );

  const latestForceSyncEvent = forceSyncEvents[0];

  // Count agents involved in the latest force sync
  let agentCount = 0;
  if (latestForceSyncEvent) {
    agentCount = events.filter(event =>
      event.workflow_id === latestForceSyncEvent.workflow_id &&
      event.agent_id
    ).length;
  }

  // Create history summary (last 10 force sync events)
  const forceSyncHistory = forceSyncEvents.slice(0, 10).map(event => ({
    timestamp: event.received_at,
    workflow_id: event.workflow_id,
    success: event.success,
    agent_count: events.filter(e =>
      e.workflow_id === event.workflow_id && e.agent_id
    ).length,
    event_type: event.event_type,
    trigger_source: event.trigger_source
  }));

  return {
    lastForceSync: latestForceSyncEvent?.received_at || null,
    forceSyncWorkflowId: latestForceSyncEvent?.workflow_id || null,
    forceSyncSuccess: latestForceSyncEvent?.success || false,
    forceSyncAgentCount: agentCount,
    allForceSyncEvents: forceSyncEvents,
    forceSyncHistory
  };
}

/**
 * File-based fallback for force sync data
 */
async function getFallbackForceSyncData(): Promise<any> {
  try {
    const fallbackPath = path.join(process.cwd(), 'data', 'fallback', 'force-sync.json');

    // Ensure directory exists
    await fs.mkdir(path.dirname(fallbackPath), { recursive: true });

    // Try to read existing fallback data
    try {
      const data = await fs.readFile(fallbackPath, 'utf8');
      const parsed = JSON.parse(data);

      // Check if data is recent (within last 24 hours)
      if (parsed.timestamp && (Date.now() - new Date(parsed.timestamp).getTime()) < 24 * 60 * 60 * 1000) {
        return {
          ...parsed,
          fallback_source: 'file_storage',
          data_age_hours: Math.floor((Date.now() - new Date(parsed.timestamp).getTime()) / (1000 * 60 * 60))
        };
      }
    } catch (readError) {
      console.log('📁 [Force-Sync] No existing fallback data found');
    }

    // Return default fallback data
    const defaultFallback = {
      lastForceSync: null,
      forceSyncWorkflowId: null,
      forceSyncSuccess: false,
      forceSyncAgentCount: 0,
      forceSyncHistory: [],
      fallback_source: 'default',
      message: 'No force sync data available - database and file storage unavailable',
      timestamp: new Date().toISOString()
    };

    // Save default data for future use
    await fs.writeFile(fallbackPath, JSON.stringify(defaultFallback, null, 2));

    return defaultFallback;
  } catch (error) {
    console.error('❌ [Force-Sync] Fallback data error:', error);
    return {
      lastForceSync: null,
      forceSyncWorkflowId: null,
      forceSyncSuccess: false,
      forceSyncAgentCount: 0,
      forceSyncHistory: [],
      fallback_source: 'emergency_default',
      error: 'All storage systems unavailable'
    };
  }
}

/**
 * Save force sync data to fallback file
 */
async function saveFallbackForceSyncData(data: any): Promise<void> {
  try {
    const fallbackPath = path.join(process.cwd(), 'data', 'fallback', 'force-sync.json');
    await fs.mkdir(path.dirname(fallbackPath), { recursive: true });
    await fs.writeFile(fallbackPath, JSON.stringify({
      ...data,
      timestamp: new Date().toISOString()
    }, null, 2));
  } catch (error) {
    console.warn('⚠️ [Force-Sync] Failed to save fallback data:', error);
  }
}

/**
 * GET /api/opal/force-sync-status - Enhanced force sync tracking
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get('hours') || '24', 10);
    const useCache = searchParams.get('cache') !== 'false';

    console.log('🔄 [Force-Sync] Force sync status request received', { hours, useCache });

    // Check cache first
    if (useCache && forceSyncCache && (Date.now() - forceSyncCache.timestamp) < forceSyncCache.ttl) {
      console.log('📦 [Force-Sync] Returning cached force sync data');
      return NextResponse.json({
        ...forceSyncCache.data,
        cached: true,
        cache_age_seconds: Math.floor((Date.now() - forceSyncCache.timestamp) / 1000)
      });
    }

    let forceSyncData;
    let dataSource = 'database';

    try {
      // Attempt to get events from database
      const recentEvents = await webhookEventOperations.getWebhookEvents({
        limit: 1000,
        start_date: new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
      });

      console.log(`📊 [Force-Sync] Retrieved ${recentEvents.length} events from database`);

      // Detect force sync events
      const forceSyncAnalysis = detectForceSyncEvents(recentEvents);

      forceSyncData = {
        ...forceSyncAnalysis,
        data_source: dataSource,
        events_analyzed: recentEvents.length,
        time_range_hours: hours,
        generated_at: new Date().toISOString()
      };

      // Save to fallback storage
      await saveFallbackForceSyncData(forceSyncData);

    } catch (dbError) {
      console.warn('⚠️ [Force-Sync] Database unavailable, using fallback data');
      dataSource = 'fallback';

      const fallbackData = await getFallbackForceSyncData();
      forceSyncData = {
        ...fallbackData,
        data_source: dataSource,
        database_error: dbError instanceof Error ? dbError.message : 'Database connection failed'
      };
    }

    // Cache the result
    forceSyncCache = {
      data: forceSyncData,
      timestamp: Date.now(),
      ttl: CACHE_TTL
    };

    console.log('✅ [Force-Sync] Force sync status completed', {
      data_source: dataSource,
      last_sync: forceSyncData.lastForceSync ? 'found' : 'none',
      cached: false
    });

    return NextResponse.json(forceSyncData, {
      status: 200,
      headers: {
        'Cache-Control': `public, max-age=${Math.floor(CACHE_TTL / 1000)}`,
        'Content-Type': 'application/json',
        'X-Data-Source': dataSource,
        'X-Force-Sync-Status': forceSyncData.lastForceSync ? 'available' : 'none'
      }
    });

  } catch (error) {
    console.error('❌ [Force-Sync] Unexpected error:', error);

    return NextResponse.json({
      lastForceSync: null,
      forceSyncWorkflowId: null,
      forceSyncSuccess: false,
      forceSyncAgentCount: 0,
      forceSyncHistory: [],
      data_source: 'error_fallback',
      error: 'Force sync status check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      generated_at: new Date().toISOString()
    }, { status: 200 }); // Still return 200 for UI consumption
  }
}

/**
 * POST /api/opal/force-sync-status - Clear force sync cache or trigger manual sync
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'clear_cache') {
      forceSyncCache = null;
      console.log('🧹 [Force-Sync] Force sync cache cleared');

      return NextResponse.json({
        success: true,
        message: 'Force sync cache cleared successfully',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: false,
      message: 'Invalid action. Supported actions: clear_cache'
    }, { status: 400 });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to process force sync request',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}