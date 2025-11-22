/**
 * OPAL Webhook Diagnostics Endpoint - DISABLED
 * Note: DiagnosticsPanel functionality has been removed while preserving Force Sync operations
 * This endpoint now returns empty responses to prevent 500 errors from legacy frontend polling
 */

import { NextRequest } from 'next/server';
import { createApiHandler } from '@/lib/api/base-api-handler';
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
 * GET /api/diagnostics/last-webhook - Webhook Event Diagnostics (DISABLED)
 * Note: Diagnostics functionality has been disabled as part of DiagnosticsPanel removal
 * Returns empty response to prevent 500 errors from legacy frontend polling
 */
export async function GET(request: NextRequest) {
  return handler.handle(request, async (req, context) => {
    console.log('🔍 [Diagnostics] Legacy diagnostics request received (functionality disabled)', {
      correlation_id: context.correlationId,
      endpoint: '/api/diagnostics/last-webhook',
      note: 'DiagnosticsPanel removed - returning empty response'
    });

    // Return empty diagnostics response to prevent frontend errors
    // Note: DiagnosticsPanel functionality has been removed as requested
    const response = {
      success: true,
      events: [],
      summary: {
        total_count: 0,
        returned_count: 0,
        signature_valid_count: 0,
        error_count: 0,
        date_range: {
          from: null,
          to: null
        },
        filters_applied: {
          limit: 25,
          workflow_id: null,
          agent_id: null,
          status: 'all',
          hours: 24
        }
      },
      config_diagnostics: {
        diagnostics_disabled: true,
        reason: 'DiagnosticsPanel functionality removed to preserve Force Sync operations',
        alternative: 'Use /api/webhook-events/stats for webhook monitoring'
      },
      troubleshooting: {
        overall_health: 'diagnostics_disabled',
        issues_detected: ['Diagnostics functionality has been disabled'],
        recommendations: ['Use Force Sync and admin monitoring tools instead'],
        quick_fixes: ['Switch to /api/webhook-events/stats endpoint for basic webhook monitoring']
      },
      query_info: {
        parameters: { disabled: true },
        total_events_matching_filters: 0,
        events_returned: 0
      },
      message: 'Diagnostics endpoint disabled - DiagnosticsPanel functionality removed while preserving Force Sync'
    };

    console.log('✅ [Diagnostics] Disabled response generated', {
      correlation_id: context.correlationId,
      status: 'disabled',
      reason: 'DiagnosticsPanel removed'
    });

    return response;
  });
}

// Note: generateTroubleshootingGuidance function removed since diagnostics functionality is disabled