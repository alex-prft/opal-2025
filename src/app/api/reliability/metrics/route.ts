/**
 * OPAL Reliability Metrics API
 * Provides detailed metrics for monitoring and analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOPALReliabilityManager } from '@/lib/reliability/opal-reliability-manager';
import { getFallbackCache } from '@/lib/reliability/fallback-cache';
import { getAlertingSystem } from '@/lib/reliability/alerting-system';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '24h';
    const includeHistory = searchParams.get('include_history') === 'true';

    const reliabilityManager = getOPALReliabilityManager();
    const fallbackCache = getFallbackCache();
    const alertingSystem = getAlertingSystem();

    // Get current metrics
    const metrics = reliabilityManager.getMetrics();
    const healthStatus = reliabilityManager.getHealthStatus();
    const cacheStats = fallbackCache.getForceSyncStats();
    const alertStats = alertingSystem.getStats();

    // Base metrics response
    const metricsResponse = {
      success: true,
      timestamp: metrics.timestamp,
      timeframe,

      // Reliability metrics
      reliability: {
        overall_health: metrics.health,
        uptime_percentage: metrics.uptime_percentage,
        success_rate_percentage: metrics.success_rate_percentage,
        circuit_breaker_state: metrics.circuit_breaker_state,
        cache_hit_available: metrics.cache_hit_available
      },

      // Performance metrics
      performance: {
        average_response_time_ms: cacheStats.averageDuration,
        total_requests: cacheStats.totalSyncs,
        successful_requests: cacheStats.successfulSyncs,
        failed_requests: cacheStats.failedSyncs,
        cache_utilization: {
          has_fallback_data: cacheStats.hasLastSuccessful,
          recent_sync_count: cacheStats.recentSyncCount,
          last_update_time: cacheStats.lastUpdateTime
        }
      },

      // Circuit breaker metrics
      circuit_breaker: {
        state: healthStatus.circuitBreaker.state,
        failure_count: healthStatus.circuitBreaker.failureCount,
        success_count: healthStatus.circuitBreaker.successCount,
        uptime_percentage: healthStatus.circuitBreaker.uptimePercentage,
        next_attempt_time: healthStatus.circuitBreaker.nextAttemptTime
      },

      // Alert metrics
      alerting: {
        active_alerts: alertStats.activeAlerts,
        total_alerts: alertStats.totalAlerts,
        resolved_alerts: alertStats.resolvedAlerts,
        alerts_by_severity: alertStats.by_severity || {},
        alerts_by_category: alertStats.by_category || {},
        rules: alertStats.rules
      },

      // System metrics
      system: {
        components_healthy: Object.values({
          circuit_breaker: healthStatus.circuitBreaker.state === 'CLOSED',
          cache: healthStatus.cache.hasLastSuccessful,
          alerting: alertStats.activeAlerts === 0
        }).filter(Boolean).length,
        total_components: 3,
        degraded_components: Object.entries({
          circuit_breaker: healthStatus.circuitBreaker.state,
          cache_status: healthStatus.cache.hasLastSuccessful ? 'healthy' : 'degraded',
          alerting_status: alertStats.activeAlerts > 0 ? 'degraded' : 'healthy'
        }).filter(([, status]) => status === 'HALF_OPEN' || status === 'degraded').length
      }
    };

    // Add historical data if requested
    if (includeHistory) {
      const recentSyncs = fallbackCache.getRecentSyncs();
      const activeAlerts = alertingSystem.getActiveAlerts();

      metricsResponse.history = {
        recent_operations: recentSyncs.map(sync => ({
          workflow_id: sync.workflowId,
          correlation_id: sync.correlationId,
          success: sync.success,
          duration_ms: sync.duration,
          started_at: sync.startedAt,
          completed_at: sync.completedAt,
          client_name: sync.clientName
        })).slice(0, 10), // Last 10 operations

        recent_alerts: activeAlerts.map(alert => ({
          id: alert.id,
          category: alert.category,
          severity: alert.severity,
          title: alert.title,
          timestamp: alert.timestamp,
          occurrence_count: alert.occurrenceCount,
          first_occurrence: alert.firstOccurrence,
          last_occurrence: alert.lastOccurrence
        })).slice(0, 5) // Last 5 active alerts
      };
    }

    console.log(`📊 [Reliability Metrics] Metrics retrieved`, {
      overall_health: metrics.health,
      success_rate: metrics.success_rate_percentage,
      active_alerts: alertStats.activeAlerts,
      include_history: includeHistory
    });

    return NextResponse.json(metricsResponse, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Reliability metrics API error:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve reliability metrics',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * POST endpoint for recording custom metrics or events
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event_type, category, message, details, correlation_id } = body;

    if (!event_type || !category || !message) {
      return NextResponse.json({
        success: false,
        error: 'event_type, category, and message are required'
      }, { status: 400 });
    }

    const alertingSystem = getAlertingSystem();

    // Process the custom event through the alerting system
    const alert = alertingSystem.processEvent({
      type: event_type,
      category: category,
      message: message,
      details: details || {},
      correlationId: correlation_id,
      source: 'External API',
      timestamp: new Date().toISOString()
    });

    console.log(`📝 [Reliability Metrics] Custom event recorded`, {
      event_type,
      category,
      correlation_id,
      alert_triggered: !!alert
    });

    return NextResponse.json({
      success: true,
      message: 'Event recorded successfully',
      event: {
        type: event_type,
        category: category,
        timestamp: new Date().toISOString()
      },
      alert_triggered: !!alert,
      alert_id: alert?.id
    });

  } catch (error) {
    console.error('Reliability metrics API POST error:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to record event',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}