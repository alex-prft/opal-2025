/**
 * Professional Webhook Management API Endpoint
 *
 * Provides enterprise webhook delivery capabilities with retry logic,
 * monitoring integration, and comprehensive error handling for OSA.
 */

import { NextRequest, NextResponse } from 'next/server';
import { webhookDeliveryService } from '@/lib/webhooks/webhook-delivery-service';
import { prometheusMetrics } from '@/lib/monitoring/prometheus-metrics';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    console.log(`🔗 [Webhook API] ${action} request received:`, {
      action,
      webhook_count: params.webhooks?.length || 1,
      has_url: !!params.url,
      has_payload: !!params.payload
    });

    switch (action) {
      case 'deliver_webhook':
        return await handleSingleDelivery(params);

      case 'deliver_batch':
        return await handleBatchDelivery(params);

      case 'test_endpoint':
        return await handleEndpointTest(params);

      case 'deliver_with_context':
        return await handleContextualDelivery(params);

      case 'get_delivery_stats':
        return await handleGetStats();

      case 'update_config':
        return await handleConfigUpdate(params);

      default:
        return NextResponse.json({
          error: 'Unknown action',
          available_actions: [
            'deliver_webhook',
            'deliver_batch',
            'test_endpoint',
            'deliver_with_context',
            'get_delivery_stats',
            'update_config'
          ]
        }, { status: 400 });
    }

  } catch (error: any) {
    console.error('❌ [Webhook API] Request failed:', error);

    prometheusMetrics.recordAPIRequest(
      'POST',
      '/api/admin/webhooks',
      500,
      Date.now(),
      request.headers.get('user-agent') || 'unknown'
    );

    return NextResponse.json({
      error: 'Failed to process webhook request',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'health_check';

    console.log(`🔗 [Webhook API] GET ${action} request received`);

    switch (action) {
      case 'health_check':
        return NextResponse.json({
          service: 'webhook-delivery',
          status: 'operational',
          config: webhookDeliveryService.getConfig(),
          timestamp: new Date().toISOString()
        });

      case 'get_config':
        return NextResponse.json({
          config: webhookDeliveryService.getConfig(),
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          error: 'Unknown GET action',
          available_actions: ['health_check', 'get_config']
        }, { status: 400 });
    }

  } catch (error: any) {
    console.error('❌ [Webhook API] GET request failed:', error);
    return NextResponse.json({
      error: 'Failed to process GET request',
      message: error.message
    }, { status: 500 });
  }
}

// ============================================================================
// ACTION HANDLERS
// ============================================================================

/**
 * Handle single webhook delivery
 */
async function handleSingleDelivery(params: any): Promise<NextResponse> {
  const { webhook_id, url, payload, headers } = params;

  if (!webhook_id || !url || !payload) {
    return NextResponse.json({
      error: 'Missing required parameters',
      required: ['webhook_id', 'url', 'payload']
    }, { status: 400 });
  }

  console.log(`🔗 [Webhook API] Delivering webhook ${webhook_id} to ${url}`);

  const startTime = Date.now();
  const result = await webhookDeliveryService.deliverWebhook(
    webhook_id,
    url,
    payload,
    headers || {}
  );

  const duration = Date.now() - startTime;

  // Record metrics
  prometheusMetrics.recordAPIRequest(
    'POST',
    '/api/admin/webhooks',
    result.success ? 200 : 500,
    duration,
    'webhook-api'
  );

  if (result.success) {
    console.log(`✅ [Webhook API] Webhook ${webhook_id} delivered successfully`);
  } else {
    console.log(`❌ [Webhook API] Webhook ${webhook_id} delivery failed: ${result.error_message}`);
  }

  return NextResponse.json({
    success: true,
    action: 'deliver_webhook',
    result,
    timestamp: new Date().toISOString()
  });
}

/**
 * Handle batch webhook delivery
 */
async function handleBatchDelivery(params: any): Promise<NextResponse> {
  const { webhooks, concurrency } = params;

  if (!webhooks || !Array.isArray(webhooks)) {
    return NextResponse.json({
      error: 'Invalid webhooks parameter',
      required: 'Array of webhook objects with webhook_id, url, payload'
    }, { status: 400 });
  }

  console.log(`🔗 [Webhook API] Starting batch delivery of ${webhooks.length} webhooks`);

  const startTime = Date.now();
  const results = await webhookDeliveryService.deliverBatch(webhooks, concurrency || 5);
  const duration = Date.now() - startTime;

  const successCount = results.filter(r => r.success).length;
  const failureCount = results.length - successCount;

  console.log(`🔗 [Webhook API] Batch delivery complete: ${successCount} success, ${failureCount} failures`);

  // Record batch metrics
  prometheusMetrics.recordAPIRequest(
    'POST',
    '/api/admin/webhooks/batch',
    200,
    duration,
    'webhook-api'
  );

  return NextResponse.json({
    success: true,
    action: 'deliver_batch',
    summary: {
      total_webhooks: webhooks.length,
      successful_deliveries: successCount,
      failed_deliveries: failureCount,
      total_duration_ms: duration
    },
    results,
    timestamp: new Date().toISOString()
  });
}

/**
 * Handle endpoint connectivity test
 */
async function handleEndpointTest(params: any): Promise<NextResponse> {
  const { url } = params;

  if (!url) {
    return NextResponse.json({
      error: 'Missing required parameter: url'
    }, { status: 400 });
  }

  console.log(`🔗 [Webhook API] Testing endpoint connectivity: ${url}`);

  const result = await webhookDeliveryService.testEndpoint(url);

  return NextResponse.json({
    success: true,
    action: 'test_endpoint',
    url,
    result,
    timestamp: new Date().toISOString()
  });
}

/**
 * Handle contextual webhook delivery (OSA-specific)
 */
async function handleContextualDelivery(params: any): Promise<NextResponse> {
  const { context, url, payload, headers } = params;

  if (!context || !url || !payload) {
    return NextResponse.json({
      error: 'Missing required parameters',
      required: ['context', 'url', 'payload'],
      context_required_fields: ['webhook_id', 'event_type', 'priority']
    }, { status: 400 });
  }

  console.log(`🔗 [Webhook API] Delivering contextual webhook for ${context.event_type}`);

  const startTime = Date.now();
  const result = await webhookDeliveryService.deliverWithContext(
    context,
    url,
    payload,
    headers || {}
  );

  const duration = Date.now() - startTime;

  // Record OSA-specific metrics
  prometheusMetrics.recordWebhookProcessing(
    context.agent_id || 'api',
    result.success ? 'success' : 'error',
    duration,
    'osal',
    JSON.stringify(payload).length
  );

  return NextResponse.json({
    success: true,
    action: 'deliver_with_context',
    context,
    result,
    timestamp: new Date().toISOString()
  });
}

/**
 * Get delivery statistics
 */
async function handleGetStats(): Promise<NextResponse> {
  const config = webhookDeliveryService.getConfig();

  return NextResponse.json({
    success: true,
    action: 'get_delivery_stats',
    stats: {
      service_status: 'operational',
      configuration: config,
      uptime_seconds: process.uptime(),
      memory_usage: process.memoryUsage(),
      current_time: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  });
}

/**
 * Update webhook delivery configuration
 */
async function handleConfigUpdate(params: any): Promise<NextResponse> {
  const { config_updates } = params;

  if (!config_updates || typeof config_updates !== 'object') {
    return NextResponse.json({
      error: 'Invalid config_updates parameter',
      example: {
        config_updates: {
          max_attempts: 3,
          initial_delay_ms: 2000,
          timeout_ms: 45000
        }
      }
    }, { status: 400 });
  }

  console.log(`🔗 [Webhook API] Updating configuration:`, config_updates);

  webhookDeliveryService.updateConfig(config_updates);

  return NextResponse.json({
    success: true,
    action: 'update_config',
    updated_config: webhookDeliveryService.getConfig(),
    timestamp: new Date().toISOString()
  });
}