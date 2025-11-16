/**
 * Metrics Export API Endpoint
 *
 * Provides Prometheus-compatible metrics export for the OSA system,
 * demonstrating the corrected exportMetrics() implementation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { metricsManager } from '@/lib/monitoring/metrics-manager';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 [Metrics API] Export request received');

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'prometheus';
    const includeTimestamp = searchParams.get('timestamp') === 'true';
    const filterPrefix = searchParams.get('filter') || undefined;
    const registryName = searchParams.get('registry') || 'register';

    // Update system metrics before export
    metricsManager.updateUptime();
    metricsManager.updateSystemHealth('api', 'healthy');

    let metricsOutput: string;
    let contentType: string;

    // Handle different export methods
    if (registryName && registryName !== 'register') {
      // Use the specific registry method
      metricsOutput = await metricsManager.exportMetricsFromRegistry(registryName);
      contentType = 'text/plain; charset=utf-8';
    } else {
      // Use the enhanced exportMetrics method (your original method, corrected)
      metricsOutput = await metricsManager.exportMetrics({
        format: format as 'prometheus' | 'json',
        includeTimestamp,
        filterPrefix
      });
      contentType = format === 'json'
        ? 'application/json; charset=utf-8'
        : 'text/plain; charset=utf-8';
    }

    // Record this API call in metrics
    metricsManager.incrementCounter('osa_api_requests_total', 1, {
      endpoint: '/api/admin/metrics',
      method: 'GET',
      status_code: '200'
    });

    console.log(`📊 [Metrics API] Exported ${format} metrics (${metricsOutput.length} chars)`);

    return new NextResponse(metricsOutput, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error: any) {
    console.error('❌ [Metrics API] Export failed:', error);

    // Record error in metrics
    metricsManager.incrementCounter('osa_api_requests_total', 1, {
      endpoint: '/api/admin/metrics',
      method: 'GET',
      status_code: '500'
    });

    return NextResponse.json({
      error: 'Failed to export metrics',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    console.log(`📊 [Metrics API] ${action} request received:`, params);

    switch (action) {
      case 'record_pii_protection':
        metricsManager.recordPIIProtection(
          params.pii_type,
          params.redaction_mode,
          params.processing_time_ms
        );
        break;

      case 'record_webhook_processing':
        metricsManager.recordWebhookProcessing(
          params.agent_id,
          params.status,
          params.processing_time_ms
        );
        break;

      case 'record_agent_execution':
        metricsManager.recordAgentExecution(
          params.agent_id,
          params.status,
          params.execution_time_ms
        );
        break;

      case 'update_system_health':
        metricsManager.updateSystemHealth(
          params.component,
          params.status
        );
        break;

      case 'reset_metrics':
        metricsManager.reset();
        break;

      default:
        return NextResponse.json({
          error: 'Unknown action',
          available_actions: [
            'record_pii_protection',
            'record_webhook_processing',
            'record_agent_execution',
            'update_system_health',
            'reset_metrics'
          ]
        }, { status: 400 });
    }

    metricsManager.incrementCounter('osa_api_requests_total', 1, {
      endpoint: '/api/admin/metrics',
      method: 'POST',
      status_code: '200'
    });

    return NextResponse.json({
      success: true,
      action,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ [Metrics API] POST failed:', error);

    metricsManager.incrementCounter('osa_api_requests_total', 1, {
      endpoint: '/api/admin/metrics',
      method: 'POST',
      status_code: '500'
    });

    return NextResponse.json({
      error: 'Failed to process metrics action',
      message: error.message
    }, { status: 500 });
  }
}