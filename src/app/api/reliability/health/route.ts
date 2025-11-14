/**
 * OPAL Reliability Health Monitoring API
 * Provides comprehensive health status for reliability components
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOPALReliabilityManager } from '@/lib/reliability/opal-reliability-manager';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'detailed';
    const include = searchParams.get('include')?.split(',') || [];

    const reliabilityManager = getOPALReliabilityManager();
    const healthStatus = reliabilityManager.getHealthStatus();
    const metrics = reliabilityManager.getMetrics();

    // Basic health response
    const basicResponse = {
      success: true,
      timestamp: new Date().toISOString(),
      health: healthStatus.overallHealth,
      status: healthStatus.overallHealth === 'healthy' ? 'operational' :
              healthStatus.overallHealth === 'degraded' ? 'degraded' : 'outage'
    };

    if (format === 'basic') {
      return NextResponse.json(basicResponse);
    }

    // Detailed health response
    const detailedResponse = {
      ...basicResponse,
      components: {
        circuit_breaker: {
          status: healthStatus.circuitBreaker.state,
          health: healthStatus.circuitBreaker.state === 'CLOSED' ? 'healthy' :
                  healthStatus.circuitBreaker.state === 'HALF_OPEN' ? 'degraded' : 'unhealthy',
          failure_count: healthStatus.circuitBreaker.failureCount,
          success_count: healthStatus.circuitBreaker.successCount,
          uptime_percentage: healthStatus.circuitBreaker.uptimePercentage,
          next_attempt_time: healthStatus.circuitBreaker.nextAttemptTime
        },
        cache: {
          status: 'operational',
          health: healthStatus.cache.hasLastSuccessful ? 'healthy' : 'degraded',
          has_fallback_data: healthStatus.cache.hasLastSuccessful,
          recent_sync_count: healthStatus.cache.recentSyncCount,
          success_rate_percentage: Math.round(healthStatus.cache.successRate * 100) / 100,
          average_duration_ms: healthStatus.cache.averageDuration
        },
        alerting: {
          status: 'operational',
          health: healthStatus.alerting.activeAlerts === 0 ? 'healthy' :
                  healthStatus.alerting.criticalAlerts > 0 ? 'unhealthy' : 'degraded',
          active_alerts: healthStatus.alerting.activeAlerts,
          critical_alerts: healthStatus.alerting.criticalAlerts,
          high_severity_alerts: healthStatus.alerting.highSeverityAlerts,
          total_alerts: healthStatus.alerting.totalAlerts
        }
      },
      metrics: {
        success_rate_percentage: metrics.success_rate_percentage,
        uptime_percentage: metrics.uptime_percentage,
        circuit_breaker_state: metrics.circuit_breaker_state,
        cache_hit_available: metrics.cache_hit_available
      }
    };

    // Add optional components based on include parameter
    if (include.includes('alerts')) {
      const activeAlerts = reliabilityManager.getActiveAlerts();
      detailedResponse.active_alerts = activeAlerts.map(alert => ({
        id: alert.id,
        category: alert.category,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        timestamp: alert.timestamp,
        occurrence_count: alert.occurrenceCount
      }));
    }

    if (include.includes('raw_metrics')) {
      detailedResponse.raw_metrics = metrics;
    }

    console.log(`🏥 [Reliability Health] Health check completed`, {
      overall_health: healthStatus.overallHealth,
      circuit_state: healthStatus.circuitBreaker.state,
      active_alerts: healthStatus.alerting.activeAlerts,
      cache_available: healthStatus.cache.hasLastSuccessful
    });

    return NextResponse.json(detailedResponse, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Reliability health API error:', error);

    return NextResponse.json({
      success: false,
      health: 'unhealthy',
      status: 'outage',
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * POST endpoint for manual reliability operations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, alert_id, reason } = body;

    const reliabilityManager = getOPALReliabilityManager();

    switch (action) {
      case 'reset_circuit_breaker':
        reliabilityManager.resetCircuitBreaker();
        console.log(`⚙️ [Reliability Health] Circuit breaker reset via API`);
        return NextResponse.json({
          success: true,
          message: 'Circuit breaker reset successfully',
          timestamp: new Date().toISOString()
        });

      case 'clear_cache':
        reliabilityManager.clearCache();
        console.log(`⚙️ [Reliability Health] Cache cleared via API`);
        return NextResponse.json({
          success: true,
          message: 'Cache cleared successfully',
          timestamp: new Date().toISOString()
        });

      case 'resolve_alert':
        if (!alert_id) {
          return NextResponse.json({
            success: false,
            error: 'alert_id is required for resolve_alert action'
          }, { status: 400 });
        }

        const resolved = reliabilityManager.resolveAlert(alert_id, reason);
        console.log(`⚙️ [Reliability Health] Alert resolution via API`, {
          alert_id,
          success: resolved,
          reason
        });

        return NextResponse.json({
          success: resolved,
          message: resolved ? 'Alert resolved successfully' : 'Alert not found or already resolved',
          alert_id,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
          available_actions: ['reset_circuit_breaker', 'clear_cache', 'resolve_alert']
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Reliability health API POST error:', error);

    return NextResponse.json({
      success: false,
      error: 'Operation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}