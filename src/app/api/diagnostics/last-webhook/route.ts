/**
 * OPAL Webhook Diagnostics Endpoint - Phase 3 Implementation
 * Provides detailed diagnostics and troubleshooting information for OPAL webhook events
 * Uses Base API Handler for consistency and file-based storage for persistence
 */

import { NextRequest } from 'next/server';
import { createApiHandler } from '@/lib/api/base-api-handler';
import { WebhookDatabase } from '@/lib/storage/webhook-database';
import { loadOpalConfig } from '@/lib/config/opal-env';
import { truncatePayloadForPreview } from '@/lib/schemas/opal-schemas';
import { z } from 'zod';

// Query parameters validation schema
const DiagnosticsQuerySchema = z.object({
  limit: z.string().optional().default('25').transform(val => parseInt(val, 10)).pipe(z.number().int().min(1).max(100)),
  workflow_id: z.string().optional().nullable().transform(val => val === 'null' || val === '' || !val ? undefined : val),
  agent_id: z.string().optional().nullable().transform(val => val === 'null' || val === '' || !val ? undefined : val),
  status: z.string().optional().default('all').pipe(z.enum(['success', 'failure', 'all'])),
  hours: z.string().optional().default('24').transform(val => parseInt(val, 10)).pipe(z.number().int().min(1).max(168))
});

// Create API handler with diagnostics-specific configuration
const handler = createApiHandler({
  endpoint: '/api/diagnostics/last-webhook',
  validation: {
    query: DiagnosticsQuerySchema
  },
  rateLimit: {
    enabled: true,
    windowMs: 60000,    // 1 minute window
    maxRequests: 200,   // Higher limit for diagnostics
    keyGenerator: (req, ctx) => `diagnostics:${ctx.ip}`
  },
  requireAuth: false,
  cors: true,
  compression: true
});

/**
 * GET /api/diagnostics/last-webhook - Webhook Event Diagnostics
 * Returns recent webhook events with detailed diagnostic information
 */
export async function GET(request: NextRequest) {
  return handler.handle(request, async (req, context) => {
    // Extract and validate query parameters manually
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    const queryParams = {
      limit: searchParams.get('limit') || '25',
      workflow_id: searchParams.get('workflow_id'),
      agent_id: searchParams.get('agent_id'),
      status: searchParams.get('status') || 'all',
      hours: searchParams.get('hours') || '24'
    };

    const validatedParams = DiagnosticsQuerySchema.parse(queryParams);

    console.log('🔍 [Diagnostics] Last webhook request received', {
      correlation_id: context.correlationId,
      filters: validatedParams
    });

    // Load configuration for status checks
    const config = loadOpalConfig();

    // Get filtered events from file-based storage
    const { events: filteredEvents, total_count } = await WebhookDatabase.getFilteredEvents({
      limit: validatedParams.limit,
      status: validatedParams.status,
      agent_id: validatedParams.agent_id,
      workflow_id: validatedParams.workflow_id,
      hours: validatedParams.hours
    });

    // Transform events for response with Phase 3 required fields
    const diagnosticEvents = filteredEvents.map(event => ({
      id: event.id,
      workflow_id: event.workflow_id,
      agent_id: event.agent_id,
      status: event.status,
      signature_valid: event.signature_valid,
      received_at: event.received_at,
      processing_time_ms: event.processing_time_ms,
      error_details: event.error_details,
      payload_size_bytes: event.payload_size_bytes,
      http_status: event.http_status,
      dedup_hash: event.dedup_hash.substring(0, 12) + '...', // Truncated for display
      payload_preview: truncatePayloadForPreview(event.payload_json, 150)
    }));

    // Calculate summary statistics
    const summary = {
      total_count: total_count,
      returned_count: diagnosticEvents.length,
      signature_valid_count: filteredEvents.filter(e => e.signature_valid).length,
      error_count: filteredEvents.filter(e => e.error_details).length,
      date_range: {
        from: filteredEvents.length > 0
          ? filteredEvents[filteredEvents.length - 1].received_at
          : null,
        to: filteredEvents.length > 0
          ? filteredEvents[0].received_at
          : null
      },
      filters_applied: {
        limit: validatedParams.limit,
        workflow_id: validatedParams.workflow_id || null,
        agent_id: validatedParams.agent_id || null,
        status: validatedParams.status,
        hours: validatedParams.hours
      }
    };

    // Configuration diagnostic checks
    const configDiagnostics = {
      osa_webhook_secret_configured: !!config.osaWebhookSecret,
      osa_webhook_url_configured: !!config.osaSelfWebhookUrl,
      opal_tools_discovery_url_configured: !!config.opalToolsDiscoveryUrl,
      external_opal_configured: !!config.opalWebhookUrl,

      // URL validations
      osa_webhook_url_accessible: config.osaSelfWebhookUrl?.startsWith('https://'),
      discovery_url_accessible: config.opalToolsDiscoveryUrl?.startsWith('https://'),

      // Secret validations
      webhook_secret_length_ok: config.osaWebhookSecret ? config.osaWebhookSecret.length >= 32 : false,
      auth_key_configured: !!config.opalAuthKey
    };

    // Common troubleshooting guidance
    const troubleshootingGuidance = generateTroubleshootingGuidance(
      summary,
      configDiagnostics,
      filteredEvents
    );

    const response = {
      events: diagnosticEvents,
      summary,
      config_diagnostics: configDiagnostics,
      troubleshooting: troubleshootingGuidance,
      query_info: {
        parameters: validatedParams,
        total_events_matching_filters: total_count,
        events_returned: diagnosticEvents.length
      }
    };

    console.log('✅ [Diagnostics] Response generated', {
      correlation_id: context.correlationId,
      total_events: response.summary.total_count,
      returned_events: response.summary.returned_count,
      signature_valid_rate: response.summary.total_count > 0
        ? (response.summary.signature_valid_count / response.summary.total_count * 100).toFixed(1) + '%'
        : '0%'
    });

    return response;
  });
}

/**
 * Generate troubleshooting guidance based on diagnostic data
 */
function generateTroubleshootingGuidance(
  summary: any,
  configDiagnostics: any,
  events: any[]
): any {
  const guidance = {
    overall_health: 'unknown',
    issues_detected: [] as string[],
    recommendations: [] as string[],
    quick_fixes: [] as string[]
  };

  // Determine overall health
  const signatureValidRate = summary.total_count > 0
    ? summary.signature_valid_count / summary.total_count
    : 0;

  const errorRate = summary.total_count > 0
    ? summary.error_count / summary.total_count
    : 0;

  if (summary.total_count === 0) {
    guidance.overall_health = 'no_data';
    guidance.issues_detected.push('No webhook events received in the specified time range');
    guidance.recommendations.push('Verify OPAL agents are configured and running');
    guidance.recommendations.push('Check OPAL_TOOLS_DISCOVERY_URL is accessible');
  } else if (signatureValidRate >= 0.98 && errorRate <= 0.02) {
    guidance.overall_health = 'healthy';
  } else if (signatureValidRate >= 0.9 && errorRate <= 0.1) {
    guidance.overall_health = 'degraded';
    guidance.issues_detected.push(`Signature validation rate: ${(signatureValidRate * 100).toFixed(1)}%`);
    guidance.issues_detected.push(`Error rate: ${(errorRate * 100).toFixed(1)}%`);
  } else {
    guidance.overall_health = 'unhealthy';
    guidance.issues_detected.push(`High error rate: ${(errorRate * 100).toFixed(1)}%`);
    guidance.issues_detected.push(`Low signature validation rate: ${(signatureValidRate * 100).toFixed(1)}%`);
  }

  // Configuration issues
  if (!configDiagnostics.osa_webhook_secret_configured) {
    guidance.issues_detected.push('OSA_WEBHOOK_SECRET not configured');
    guidance.quick_fixes.push('Set OSA_WEBHOOK_SECRET environment variable (min 32 chars)');
  }

  if (!configDiagnostics.webhook_secret_length_ok) {
    guidance.issues_detected.push('OSA_WEBHOOK_SECRET too short');
    guidance.quick_fixes.push('Use webhook secret with at least 32 characters');
  }

  if (!configDiagnostics.osa_webhook_url_configured) {
    guidance.issues_detected.push('OSA_WEBHOOK_URL not configured');
    guidance.quick_fixes.push('Set OSA_WEBHOOK_URL environment variable');
  }

  if (!configDiagnostics.opal_tools_discovery_url_configured) {
    guidance.issues_detected.push('OPAL_TOOLS_DISCOVERY_URL not configured');
    guidance.quick_fixes.push('Set OPAL_TOOLS_DISCOVERY_URL environment variable');
  }

  // Event pattern analysis
  if (summary.total_count > 0) {
    const recentErrors = events
      .filter(e => e.error_details)
      .slice(0, 3)
      .map(e => e.error_details);

    if (recentErrors.length > 0) {
      guidance.issues_detected.push(`Recent errors: ${recentErrors.length} different error types`);
      guidance.recommendations.push('Review error patterns in recent events');
    }

    // Check for signature failures
    const signatureFailures = events.filter(e => !e.signature_valid);
    if (signatureFailures.length > 0) {
      guidance.issues_detected.push(`${signatureFailures.length} signature validation failures`);
      guidance.recommendations.push('Verify webhook secret consistency between sender and receiver');
      guidance.recommendations.push('Check for time skew between systems (max 5 minutes)');
    }
  }

  return guidance;
}