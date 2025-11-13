/**
 * OPAL Health Check Endpoint
 * Production-grade health monitoring for OPAL integration with comprehensive metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { WebhookDatabase } from '@/app/api/webhooks/opal-workflow/route';
import { loadOpalConfig } from '@/lib/config/opal-env';
import { HealthCheck } from '@/lib/schemas/opal-schemas';

/**
 * GET /api/opal/health - OPAL Integration Health Check
 * Returns comprehensive health status for OPAL integration
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Reduced console noise - only log health checks in debug mode or for significant events
    if (process.env.OPAL_DEBUG_MODE === 'true' || process.env.NODE_ENV === 'development') {
      console.log('🏥 [Health] OPAL health check request received');
    }

    // Load configuration
    const config = loadOpalConfig();

    // Get event statistics from database
    const stats = await WebhookDatabase.getEventStats();

    // Calculate time since last valid webhook
    const lastWebhookMinutesAgo = stats.last_event_timestamp
      ? Math.floor((Date.now() - new Date(stats.last_event_timestamp).getTime()) / (1000 * 60))
      : null;

    // Calculate signature validation rate
    const signatureValidRate = stats.signature_valid_rate || 0;

    // Calculate 24h error rate
    const errorRate24h = stats.total_events_24h > 0
      ? stats.failed_events_24h / stats.total_events_24h
      : 0;

    // Configuration checks
    const configChecks = {
      osa_webhook_secret_configured: !!config.osaWebhookSecret && config.osaWebhookSecret.length >= 32,
      osa_webhook_url_configured: !!config.osaSelfWebhookUrl,
      opal_tools_discovery_url_configured: !!config.opalToolsDiscoveryUrl,
      external_opal_configured: !!config.opalWebhookUrl,
      webhook_secret_length_adequate: config.osaWebhookSecret ? config.osaWebhookSecret.length >= 32 : false,
      discovery_url_format_valid: config.opalToolsDiscoveryUrl?.startsWith('https://') || false,
      webhook_url_format_valid: config.osaSelfWebhookUrl?.startsWith('https://') || false
    };

    // Determine overall status based on criteria
    let overallStatus: 'green' | 'yellow' | 'red' = 'green';

    const healthConditions = {
      hasRecentEvents: lastWebhookMinutesAgo !== null && lastWebhookMinutesAgo <= 10,
      goodSignatureRate: signatureValidRate >= 0.98,
      lowErrorRate: errorRate24h <= 0.02,
      configurationValid: Object.values(configChecks).filter(Boolean).length >= 6
    };

    // Determine status
    if (!healthConditions.configurationValid) {
      overallStatus = 'red';
    } else if (lastWebhookMinutesAgo === null) {
      overallStatus = 'yellow'; // No events yet, but configuration looks good
    } else if (healthConditions.hasRecentEvents && healthConditions.goodSignatureRate && healthConditions.lowErrorRate) {
      overallStatus = 'green';
    } else if (healthConditions.goodSignatureRate && healthConditions.lowErrorRate) {
      overallStatus = 'yellow'; // Functional but stale
    } else {
      overallStatus = 'red'; // Active issues
    }

    // Detailed metrics
    const metrics = {
      total_events_24h: stats.total_events_24h,
      successful_events_24h: stats.successful_events_24h,
      failed_events_24h: stats.failed_events_24h,
      last_event_timestamp: stats.last_event_timestamp
        ? new Date(stats.last_event_timestamp).toISOString()
        : null,
      signature_validation_rate: signatureValidRate,
      error_rate_24h: errorRate24h,
      uptime_indicators: {
        webhook_receiver_responding: true, // If we're responding, receiver is up
        configuration_loaded: true,
        database_accessible: true // If we got stats, DB is accessible
      }
    };

    // Health status details
    const statusDetails = {
      status_reason: getStatusReason(overallStatus, healthConditions, lastWebhookMinutesAgo, configChecks),
      last_status_change: new Date().toISOString(), // In production, track actual changes
      status_history: {
        green_periods_24h: calculateGreenPeriods(stats),
        downtime_minutes_24h: calculateDowntimeMinutes(stats),
        last_green_timestamp: getLastGreenTimestamp(stats)
      }
    };

    const healthResponse: HealthCheck = {
      overall_status: overallStatus,
      last_webhook_minutes_ago: lastWebhookMinutesAgo,
      signature_valid_rate: signatureValidRate,
      error_rate_24h: errorRate24h,
      config_checks: {
        osa_webhook_secret_configured: configChecks.osa_webhook_secret_configured,
        osa_webhook_url_configured: configChecks.osa_webhook_url_configured,
        opal_tools_discovery_url_configured: configChecks.opal_tools_discovery_url_configured
      },
      metrics
    };

    // Only log health check results in debug mode or when status changes
    if (process.env.OPAL_DEBUG_MODE === 'true' || process.env.NODE_ENV === 'development' || overallStatus !== 'green') {
      console.log('✅ [Health] Health check completed', {
        overall_status: overallStatus,
        last_webhook_minutes_ago: lastWebhookMinutesAgo,
        signature_valid_rate: (signatureValidRate * 100).toFixed(1) + '%',
        error_rate_24h: (errorRate24h * 100).toFixed(1) + '%',
        total_events_24h: stats.total_events_24h
      });
    }

    // Add detailed response for troubleshooting
    const detailedResponse = {
      ...healthResponse,
      status_details: statusDetails,
      health_conditions: healthConditions,
      config_diagnostics: configChecks,
      endpoints: {
        discovery: `${config.opalToolsDiscoveryUrl}/api/opal/enhanced-tools`,
        webhook_receiver: config.osaSelfWebhookUrl,
        diagnostics: `${config.osaSelfWebhookUrl?.replace('/api/webhooks/opal-workflow', '')}/api/diagnostics/last-webhook`,
        health_check: `${config.osaSelfWebhookUrl?.replace('/api/webhooks/opal-workflow', '')}/api/opal/health`
      },
      generated_at: new Date().toISOString()
    };

    const responseStatus = overallStatus === 'red' ? 503 : 200; // Service Unavailable for red status

    // Only log when returning 503 in debug mode - this is expected behavior
    if (responseStatus === 503 && (process.env.OPAL_DEBUG_MODE === 'true' || process.env.NODE_ENV === 'development')) {
      console.log('📟 [Health] Returning 503 status due to red health status (this is expected behavior)');
    }

    return NextResponse.json(detailedResponse, {
      status: responseStatus,
      headers: {
        'Cache-Control': 'no-cache, max-age=0',
        'Content-Type': 'application/json',
        'X-Health-Status': overallStatus,
        'X-Last-Event-Minutes-Ago': lastWebhookMinutesAgo?.toString() || 'null'
      }
    });

  } catch (error) {
    // Only log actual errors, not expected behavior
    console.error('❌ [Health] Health check failed due to unexpected error:', error);

    return NextResponse.json({
      overall_status: 'red',
      error: 'Health check failed',
      message: 'Unable to assess OPAL integration health',
      last_webhook_minutes_ago: null,
      signature_valid_rate: 0,
      error_rate_24h: 1,
      config_checks: {
        osa_webhook_secret_configured: false,
        osa_webhook_url_configured: false,
        opal_tools_discovery_url_configured: false
      },
      metrics: {
        total_events_24h: 0,
        successful_events_24h: 0,
        failed_events_24h: 0,
        last_event_timestamp: null
      },
      generated_at: new Date().toISOString(),
      error_details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 });
  }
}

/**
 * Get human-readable status reason
 */
function getStatusReason(
  status: string,
  conditions: any,
  lastWebhookMinutesAgo: number | null,
  configChecks: any
): string {
  switch (status) {
    case 'green':
      return 'All systems operational - recent webhook activity with high success rate';

    case 'yellow':
      if (lastWebhookMinutesAgo === null) {
        return 'Configuration appears valid but no webhook events received yet';
      } else if (lastWebhookMinutesAgo > 10) {
        return `No recent webhook activity (${lastWebhookMinutesAgo} minutes ago) but system functional`;
      } else {
        return 'System functional but experiencing some issues with error rate or signature validation';
      }

    case 'red':
      const issues = [];
      if (!configChecks.osa_webhook_secret_configured) issues.push('webhook secret not configured');
      if (!configChecks.osa_webhook_url_configured) issues.push('webhook URL not configured');
      if (!configChecks.opal_tools_discovery_url_configured) issues.push('discovery URL not configured');
      if (!conditions.goodSignatureRate) issues.push('high signature validation failure rate');
      if (!conditions.lowErrorRate) issues.push('high error rate');

      return issues.length > 0
        ? `Critical issues detected: ${issues.join(', ')}`
        : 'System experiencing critical issues';

    default:
      return 'Unknown status';
  }
}

/**
 * Calculate green periods in last 24h (simplified)
 */
function calculateGreenPeriods(stats: any): number {
  // In production, implement actual green period calculation
  // For now, return estimated based on success rate
  return stats.successful_events_24h > 0 ? Math.max(1, Math.floor(stats.successful_events_24h / 10)) : 0;
}

/**
 * Calculate downtime minutes in last 24h (simplified)
 */
function calculateDowntimeMinutes(stats: any): number {
  // In production, implement actual downtime calculation
  // For now, estimate based on failure rate
  const totalPossibleMinutes = 24 * 60;
  const failureRate = stats.total_events_24h > 0 ? stats.failed_events_24h / stats.total_events_24h : 0;
  return Math.floor(totalPossibleMinutes * failureRate * 0.1); // Rough estimate
}

/**
 * Get last green timestamp (simplified)
 */
function getLastGreenTimestamp(stats: any): string | null {
  // In production, track actual status changes
  // For now, return last event timestamp if it was successful
  return stats.successful_events_24h > 0 ? stats.last_event_timestamp : null;
}