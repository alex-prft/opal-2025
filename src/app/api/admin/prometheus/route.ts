/**
 * Professional Prometheus Metrics API Endpoint
 *
 * Uses your prom-client implementation for industry-standard metrics export.
 * Provides Prometheus-compatible metrics with proper content-type headers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prometheusMetrics } from '@/lib/monitoring/prometheus-metrics';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 [Prometheus API] Professional metrics export request received');

    // Update system health before export
    prometheusMetrics.updateSystemHealth('api', 1.0, 'production');
    prometheusMetrics.updateSystemHealth('database', 1.0, 'production');
    prometheusMetrics.updateSystemHealth('cache', 0.9, 'production');

    // Your corrected exportMetrics() method with proper prom-client integration
    const { metrics, contentType } = await prometheusMetrics.exportMetricsWithContentType();

    // Record this API call
    prometheusMetrics.recordAPIRequest(
      'GET',
      '/api/admin/prometheus',
      200,
      Date.now() - Date.now(), // Will be measured by middleware
      request.headers.get('user-agent') || 'unknown'
    );

    console.log(`📊 [Prometheus API] Exported professional metrics (${metrics.length} chars)`);

    return new NextResponse(metrics, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error: any) {
    console.error('❌ [Prometheus API] Export failed:', error);

    prometheusMetrics.recordAPIRequest(
      'GET',
      '/api/admin/prometheus',
      500,
      Date.now() - Date.now(),
      request.headers.get('user-agent') || 'unknown'
    );

    return NextResponse.json({
      error: 'Failed to export Prometheus metrics',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    console.log(`📊 [Prometheus API] Recording ${action}:`, params);

    // Record different types of metrics using your professional implementation
    switch (action) {
      case 'record_pii_protection':
        prometheusMetrics.recordPIIProtection(
          params.pii_type,
          params.redaction_mode,
          params.processing_time_ms,
          params.confidence_level || 'high'
        );
        break;

      case 'record_agent_execution':
        prometheusMetrics.recordAgentExecution(
          params.agent_id,
          params.status,
          params.execution_time_ms,
          params.workflow_type || 'strategy',
          params.confidence_score,
          params.workflow_id
        );
        break;

      case 'record_webhook_processing':
        prometheusMetrics.recordWebhookProcessing(
          params.agent_id,
          params.status,
          params.processing_time_ms,
          params.webhook_type || 'opal',
          params.payload_size_bytes
        );
        break;

      case 'update_system_health':
        prometheusMetrics.updateSystemHealth(
          params.component,
          params.health_score,
          params.environment || 'production'
        );
        break;

      case 'record_strategy_recommendation':
        prometheusMetrics.recordStrategyRecommendation(
          params.recommendation_type,
          params.confidence_level,
          params.user_segment || 'general'
        );
        break;

      case 'record_compliance_violation':
        prometheusMetrics.recordComplianceViolation(
          params.violation_type,
          params.severity,
          params.framework
        );
        break;

      case 'record_cache_operation':
        prometheusMetrics.recordCacheOperation(
          params.operation,
          params.cache_type,
          params.status || 'success'
        );
        break;

      case 'update_cache_hit_ratio':
        prometheusMetrics.updateCacheHitRatio(
          params.cache_type,
          params.hit_ratio
        );
        break;

      case 'get_metrics_summary':
        const summary = await prometheusMetrics.getMetricsSummary();
        return NextResponse.json({
          success: true,
          action,
          summary,
          timestamp: new Date().toISOString()
        });

      case 'get_registry_stats':
        const stats = prometheusMetrics.getRegistryStats();
        return NextResponse.json({
          success: true,
          action,
          stats,
          timestamp: new Date().toISOString()
        });

      case 'reset_metrics':
        prometheusMetrics.reset();
        break;

      default:
        return NextResponse.json({
          error: 'Unknown action',
          available_actions: [
            'record_pii_protection',
            'record_agent_execution',
            'record_webhook_processing',
            'update_system_health',
            'record_strategy_recommendation',
            'record_compliance_violation',
            'record_cache_operation',
            'update_cache_hit_ratio',
            'get_metrics_summary',
            'get_registry_stats',
            'reset_metrics'
          ]
        }, { status: 400 });
    }

    prometheusMetrics.recordAPIRequest(
      'POST',
      '/api/admin/prometheus',
      200,
      Date.now() - Date.now(),
      request.headers.get('user-agent') || 'unknown'
    );

    return NextResponse.json({
      success: true,
      action,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ [Prometheus API] POST failed:', error);

    prometheusMetrics.recordAPIRequest(
      'POST',
      '/api/admin/prometheus',
      500,
      Date.now() - Date.now(),
      request.headers.get('user-agent') || 'unknown'
    );

    return NextResponse.json({
      error: 'Failed to process Prometheus metrics action',
      message: error.message
    }, { status: 500 });
  }
}