// Phase 1 System Health API Endpoint
// Provides comprehensive system health data for admin dashboard

import { NextRequest, NextResponse } from 'next/server';
import { phase1Pipeline } from '@/lib/validation/phase1-integration';
import { validationLogger } from '@/lib/validation/validation-logger';
import { environmentSafety } from '@/lib/validation/environment-safety';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const correlationId = `health_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  try {
    console.log(`📊 [Health API] System health check requested (${correlationId})`);

    // Get comprehensive system health
    const systemHealth = await phase1Pipeline.getSystemHealth();

    // Get uptime statistics
    const uptimeStats = phase1Pipeline.getUptimeStats();

    // Get environment status
    const environmentStatus = environmentSafety.getSystemStatus();

    // Build comprehensive health report
    const healthReport = {
      timestamp: new Date().toISOString(),
      correlation_id: correlationId,

      // Overall System Status
      overall_status: systemHealth.overall_status,

      // Per-Page Status (Green/Yellow/Red indicators for 4 critical pages)
      page_status: systemHealth.page_statuses,

      // System Performance Metrics
      performance: {
        uptime: uptimeStats,
        cache_stats: environmentStatus.cache_stats,
        validation_metrics: systemHealth.system_metrics,
        api_performance: {
          request_duration_ms: Date.now() - startTime
        }
      },

      // Environment Configuration
      environment: {
        node_env: process.env.NODE_ENV || 'development',
        use_real_opal_data: process.env.USE_REAL_OPAL_DATA === 'true',
        database_available: require('@/lib/database/supabase-client').isDatabaseAvailable(),
        environment_config: environmentStatus.environment_config
      },

      // Critical Page Monitoring
      critical_pages: {
        total_pages: 4,
        monitored_pages: Object.keys(systemHealth.page_statuses).length,
        pages_green: Object.values(systemHealth.page_statuses).filter((p: any) => p.status === 'green').length,
        pages_yellow: Object.values(systemHealth.page_statuses).filter((p: any) => p.status === 'yellow').length,
        pages_red: Object.values(systemHealth.page_statuses).filter((p: any) => p.status === 'red').length
      },

      // Alert Status
      alerts: {
        active_alerts: Object.values(systemHealth.page_statuses).filter((p: any) => p.status === 'red').length,
        warning_alerts: Object.values(systemHealth.page_statuses).filter((p: any) => p.status === 'yellow').length,
        last_critical_alert: await getLastCriticalAlert()
      }
    };

    // Set appropriate HTTP status based on system health
    let httpStatus = 200;
    if (systemHealth.overall_status === 'red') {
      httpStatus = 503; // Service Unavailable
    } else if (systemHealth.overall_status === 'yellow') {
      httpStatus = 200; // OK but with warnings
    }

    console.log(`✅ [Health API] Health check completed (${correlationId}) - Status: ${systemHealth.overall_status} in ${Date.now() - startTime}ms`);

    return NextResponse.json(healthReport, {
      status: httpStatus,
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': correlationId,
        'X-System-Status': systemHealth.overall_status,
        'X-Cache-For': '30s', // Cache health data for 30 seconds
        'Cache-Control': 'public, max-age=30'
      }
    });

  } catch (error) {
    console.error(`❌ [Health API] Health check failed (${correlationId}):`, error);

    const errorResponse = {
      timestamp: new Date().toISOString(),
      correlation_id: correlationId,
      overall_status: 'red',
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      performance: {
        api_performance: {
          request_duration_ms: Date.now() - startTime
        }
      }
    };

    return NextResponse.json(errorResponse, {
      status: 503,
      headers: {
        'X-Correlation-ID': correlationId,
        'X-System-Status': 'red'
      }
    });
  }
}

async function getLastCriticalAlert(): Promise<string | null> {
  try {
    const recentLogs = await validationLogger.getValidationLogs({
      status: 'failed',
      hours: 24,
      limit: 1
    });

    if (recentLogs.validation_logs.length > 0) {
      return recentLogs.validation_logs[0].timestamp || null;
    }

    return null;
  } catch (error) {
    console.error('Failed to get last critical alert:', error);
    return null;
  }
}