/**
 * Enhanced OPAL Health Check Endpoint with Graceful Fallback
 * Always returns 200 with degraded state information for UI consumption
 */

import { NextRequest, NextResponse } from 'next/server';
import { WebhookDatabase } from '@/app/api/webhooks/opal-workflow/route';
import { loadOpalConfig } from '@/lib/config/opal-env';
import { HealthCheck } from '@/lib/schemas/opal-schemas';

// In-memory cache for health data
let healthCache: {
  data: any;
  timestamp: number;
  ttl: number;
} | null = null;

const CACHE_TTL = 30000; // 30 seconds
const DEGRADED_CACHE_TTL = 300000; // 5 minutes for degraded state

/**
 * GET /api/opal/health-with-fallback - Always returns 200 with health status
 * Provides graceful fallback data when OPAL is unavailable
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('🏥 [Health-Fallback] Enhanced health check request received');

    // Check cache first
    if (healthCache && (Date.now() - healthCache.timestamp) < healthCache.ttl) {
      console.log('📦 [Health-Fallback] Returning cached health data');
      return NextResponse.json({
        ...healthCache.data,
        cached: true,
        cache_age_seconds: Math.floor((Date.now() - healthCache.timestamp) / 1000)
      }, { status: 200 });
    }

    // Load configuration
    const config = loadOpalConfig();

    // Attempt to get event statistics from database
    let stats;
    let databaseAvailable = true;

    try {
      stats = await WebhookDatabase.getEventStats();
    } catch (dbError) {
      console.warn('⚠️ [Health-Fallback] Database unavailable, using fallback data');
      databaseAvailable = false;
      stats = {
        total_events_24h: 0,
        successful_events_24h: 0,
        failed_events_24h: 0,
        last_event_timestamp: null,
        signature_valid_rate: 0
      };
    }

    // Calculate health metrics
    const lastWebhookMinutesAgo = stats.last_event_timestamp
      ? Math.floor((Date.now() - new Date(stats.last_event_timestamp).getTime()) / (1000 * 60))
      : null;

    const signatureValidRate = stats.signature_valid_rate || 0;
    const errorRate24h = stats.total_events_24h > 0
      ? stats.failed_events_24h / stats.total_events_24h
      : 0;

    // Configuration checks
    const configChecks = {
      osa_webhook_secret_configured: !!config.osaWebhookSecret && config.osaWebhookSecret.length >= 32,
      osa_webhook_url_configured: !!config.osaSelfWebhookUrl,
      opal_tools_discovery_url_configured: !!config.opalToolsDiscoveryUrl,
      external_opal_configured: !!config.opalWebhookUrl,
      database_available: databaseAvailable
    };

    // Determine overall status with enhanced fallback logic
    let overallStatus: 'green' | 'yellow' | 'red' | 'degraded' = 'green';
    let statusReason = '';

    if (!databaseAvailable) {
      overallStatus = 'degraded';
      statusReason = 'Database unavailable - operating in degraded mode with file storage fallback';
    } else if (!configChecks.osa_webhook_secret_configured || !configChecks.osa_webhook_url_configured) {
      overallStatus = 'red';
      statusReason = 'Critical configuration missing';
    } else if (lastWebhookMinutesAgo === null) {
      overallStatus = 'yellow';
      statusReason = 'Configuration valid but no webhook events received yet';
    } else if (lastWebhookMinutesAgo <= 10 && signatureValidRate >= 0.98 && errorRate24h <= 0.02) {
      overallStatus = 'green';
      statusReason = 'All systems operational';
    } else if (signatureValidRate >= 0.90 && errorRate24h <= 0.05) {
      overallStatus = 'yellow';
      statusReason = 'System functional with minor issues';
    } else {
      overallStatus = 'red';
      statusReason = 'System experiencing issues';
    }

    // Enhanced response with fallback data
    const healthResponse = {
      overall_status: overallStatus,
      status_reason: statusReason,
      last_webhook_minutes_ago: lastWebhookMinutesAgo,
      signature_valid_rate: signatureValidRate,
      error_rate_24h: errorRate24h,
      database_available: databaseAvailable,
      config_checks: configChecks,
      metrics: {
        total_events_24h: stats.total_events_24h,
        successful_events_24h: stats.successful_events_24h,
        failed_events_24h: stats.failed_events_24h,
        last_event_timestamp: stats.last_event_timestamp
      },
      fallback_data: !databaseAvailable ? {
        message: 'Operating in degraded mode with file storage',
        limitations: ['Real-time metrics unavailable', 'Historical data limited', 'Performance may be reduced'],
        recovery_suggestions: ['Check database connection', 'Verify environment variables', 'Review system logs']
      } : null,
      generated_at: new Date().toISOString(),
      cached: false
    };

    // Cache the response
    const cacheTtl = overallStatus === 'degraded' ? DEGRADED_CACHE_TTL : CACHE_TTL;
    healthCache = {
      data: healthResponse,
      timestamp: Date.now(),
      ttl: cacheTtl
    };

    console.log('✅ [Health-Fallback] Health check completed', {
      status: overallStatus,
      database_available: databaseAvailable,
      cached_for: cacheTtl / 1000 + 's'
    });

    // Always return 200 for UI consumption
    return NextResponse.json(healthResponse, {
      status: 200,
      headers: {
        'Cache-Control': `public, max-age=${Math.floor(cacheTtl / 1000)}`,
        'Content-Type': 'application/json',
        'X-Health-Status': overallStatus,
        'X-Database-Available': databaseAvailable.toString()
      }
    });

  } catch (error) {
    console.error('❌ [Health-Fallback] Unexpected error in health check:', error);

    // Return degraded fallback response
    const fallbackResponse = {
      overall_status: 'degraded',
      status_reason: 'Health check system error - minimal functionality available',
      last_webhook_minutes_ago: null,
      signature_valid_rate: 0,
      error_rate_24h: 1,
      database_available: false,
      config_checks: {
        osa_webhook_secret_configured: false,
        osa_webhook_url_configured: false,
        opal_tools_discovery_url_configured: false,
        external_opal_configured: false,
        database_available: false
      },
      metrics: {
        total_events_24h: 0,
        successful_events_24h: 0,
        failed_events_24h: 0,
        last_event_timestamp: null
      },
      error_details: error instanceof Error ? error.message : 'Unknown error',
      fallback_data: {
        message: 'Critical system error - operating in emergency fallback mode',
        limitations: ['All real-time features disabled', 'Historical data unavailable', 'Configuration cannot be verified'],
        recovery_suggestions: ['Check system logs', 'Restart application', 'Verify environment configuration', 'Contact system administrator']
      },
      generated_at: new Date().toISOString(),
      cached: false
    };

    return NextResponse.json(fallbackResponse, { status: 200 });
  }
}

/**
 * POST /api/opal/health-with-fallback - Clear health cache
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    healthCache = null;
    console.log('🧹 [Health-Fallback] Health cache cleared');

    return NextResponse.json({
      success: true,
      message: 'Health cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to clear health cache',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}