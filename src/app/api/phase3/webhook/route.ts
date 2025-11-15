// Phase 3: Enhanced Webhook Processing API with Cross-Page Validation
// Integrates security, Phase 2 validation, cross-page dependencies, and real-time streaming

import { NextRequest, NextResponse } from 'next/server';
import { phase3WebhookPipeline, type WebhookProcessingRequest } from '@/lib/webhooks/phase3-webhook-pipeline';
import { webhookEventStreaming } from '@/lib/webhooks/webhook-event-streaming';
import { webhookCacheCoordinator, type CacheInvalidationRequest } from '@/lib/webhooks/webhook-cache-coordinator';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const correlationId = `phase3_api_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  try {
    console.log(`🌐 [Phase3 API] Enhanced webhook request received (${correlationId})`);

    // Extract client information
    const clientInfo = {
      ip: request.headers.get('x-forwarded-for') ||
          request.headers.get('x-real-ip') ||
          request.headers.get('cf-connecting-ip') ||
          'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      timestamp: Date.now()
    };

    // Get request body
    const body = await request.text();

    // Create stream event for webhook received
    await webhookEventStreaming.createStreamEvent(
      'webhook_received',
      correlationId,
      {
        webhook_source: 'api',
        client_info: clientInfo,
        payload_size: body.length
      },
      {
        channels: ['webhook', 'monitoring'],
        priority: 5,
        ttl: 300
      }
    );

    // Extract headers
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Build processing request
    const processingRequest: WebhookProcessingRequest = {
      correlation_id: correlationId,
      payload: body,
      headers,
      client_info: clientInfo,
      webhook_source: 'api',
      processing_options: {
        enable_claude_enhancement: true,
        cache_strategy: 'prefer_fresh',
        cross_page_processing: true,
        force_validation: false
      }
    };

    // Process through Phase 3 pipeline
    const processingResult = await phase3WebhookPipeline.processWebhook(processingRequest);

    // Create stream event for processing completed
    await webhookEventStreaming.createStreamEvent(
      processingResult.success ? 'processing_completed' : 'error_occurred',
      correlationId,
      {
        processing_status: processingResult.processing_status,
        performance_metrics: processingResult.performance_metrics,
        phase2_success: processingResult.phase2_results?.success,
        cross_page_operations: processingResult.cross_page_results?.triggered_dependencies || 0,
        error_details: processingResult.error_details
      },
      {
        pageId: processingResult.parsed_content?.page_id,
        widgetId: processingResult.parsed_content?.widget_id,
        channels: ['webhook', 'monitoring'],
        priority: processingResult.success ? 5 : 8,
        ttl: 600
      }
    );

    // Build comprehensive API response
    const apiResponse = {
      success: processingResult.success,
      correlation_id: correlationId,
      processing_status: processingResult.processing_status,

      // Enhanced Phase 3 information
      phase3_processing: {
        security_validation: {
          passed: processingResult.security_validation.valid,
          score: processingResult.security_validation.security_score,
          rate_limit_remaining: processingResult.security_validation.rate_limit_remaining
        },
        parsed_content: processingResult.parsed_content,
        phase2_integration: {
          attempted: !!processingResult.phase2_results,
          success: processingResult.phase2_results?.success,
          cache_info: processingResult.phase2_results?.cache_info,
          claude_info: processingResult.phase2_results?.claude_info
        },
        cross_page_processing: {
          dependencies_triggered: processingResult.cross_page_results?.triggered_dependencies || 0,
          invalidations_performed: processingResult.cross_page_results?.invalidations_performed || 0,
          validations_triggered: processingResult.cross_page_results?.validations_triggered || 0
        }
      },

      // Performance metrics
      performance_metrics: {
        ...processingResult.performance_metrics,
        api_overhead_ms: Date.now() - startTime - processingResult.performance_metrics.total_processing_ms
      },

      // Error handling
      error_details: processingResult.error_details,

      // Phase 3 capabilities
      phase3_features: {
        enhanced_security: 'enabled',
        cross_page_validation: 'enabled',
        intelligent_cache_coordination: 'enabled',
        real_time_streaming: 'enabled',
        audit_trail: 'complete'
      }
    };

    console.log(`✅ [Phase3 API] Webhook processing completed for ${correlationId}: ${processingResult.processing_status} in ${Date.now() - startTime}ms`);

    return NextResponse.json(apiResponse);

  } catch (error) {
    console.error(`❌ [Phase3 API] Webhook processing failed (${correlationId}):`, error);

    // Create error stream event
    await webhookEventStreaming.createStreamEvent(
      'error_occurred',
      correlationId,
      {
        error_type: 'api_error',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        processing_time_ms: Date.now() - startTime
      },
      {
        channels: ['webhook', 'monitoring', 'errors'],
        priority: 9,
        ttl: 3600
      }
    );

    return NextResponse.json({
      success: false,
      correlation_id: correlationId,
      error: error instanceof Error ? error.message : 'Unknown webhook processing error',
      error_code: 'PHASE3_WEBHOOK_ERROR',
      performance_metrics: {
        total_processing_ms: Date.now() - startTime,
        error_occurred: true
      }
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'stats':
        // Get comprehensive Phase 3 statistics
        const pipelineStats = phase3WebhookPipeline.getProcessingStatistics();
        const streamingStats = webhookEventStreaming.getStreamingStatistics();
        const cacheStats = webhookCacheCoordinator.getCacheCoordinationStatistics();

        return NextResponse.json({
          success: true,
          phase3_statistics: {
            webhook_pipeline: pipelineStats,
            event_streaming: streamingStats,
            cache_coordination: cacheStats,
            system_health: await phase3WebhookPipeline.healthCheck()
          }
        });

      case 'health':
        // Comprehensive health check
        const healthStatus = await phase3WebhookPipeline.healthCheck();
        const streamingHealth = await webhookEventStreaming.generateHealthReport();

        return NextResponse.json({
          success: true,
          phase3_health: {
            webhook_pipeline: healthStatus,
            event_streaming: streamingHealth,
            overall_status: healthStatus.status === 'critical' || streamingHealth.status === 'critical' ? 'critical' :
                           healthStatus.status === 'degraded' || streamingHealth.status === 'degraded' ? 'degraded' : 'healthy'
          }
        });

      case 'recent_events':
        // Get recent processing events
        const limit = parseInt(searchParams.get('limit') || '50');
        const recentLogs = await phase3WebhookPipeline.getRecentProcessingLogs(limit);

        return NextResponse.json({
          success: true,
          recent_events: recentLogs,
          total_returned: recentLogs.length
        });

      default:
        return NextResponse.json({
          endpoint: 'Phase 3 Enhanced Webhook Processing',
          description: 'Cross-page validated webhook pipeline with comprehensive security and monitoring',
          version: '3.0.0',
          capabilities: [
            'Enhanced HMAC security validation with rate limiting',
            'Phase 2 integration for intelligent cache and Claude processing',
            'Cross-page dependency tracking and validation',
            'Webhook-triggered cache invalidation coordination',
            'Real-time event streaming and monitoring',
            'Complete audit trail and performance analytics'
          ],
          usage: {
            'POST /': 'Process webhook with full Phase 3 pipeline',
            'GET ?action=stats': 'Get comprehensive system statistics',
            'GET ?action=health': 'Get detailed health status',
            'GET ?action=recent_events': 'Get recent processing events'
          },
          integration: {
            phase1_validation: 'inherited',
            phase2_enhancements: 'fully_integrated',
            cross_page_validation: 'enabled',
            real_time_monitoring: 'active'
          }
        });
    }

  } catch (error) {
    console.error('❌ [Phase3 API] GET error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown API error'
    }, { status: 500 });
  }
}

// Cache management endpoint
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, target_page_id, target_widget_id, invalidation_type, reason } = body;

    const correlationId = `cache_api_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    switch (action) {
      case 'invalidate':
        if (!target_page_id) {
          return NextResponse.json({
            success: false,
            error: 'target_page_id is required for cache invalidation'
          }, { status: 400 });
        }

        const invalidationRequest: CacheInvalidationRequest = {
          correlation_id: correlationId,
          trigger_source: 'manual',
          invalidation_type: invalidation_type || 'specific',
          target_page_id,
          target_widget_id,
          reason: reason || 'manual_api_invalidation'
        };

        const invalidationResult = await webhookCacheCoordinator.processWebhookInvalidation(invalidationRequest);

        // Create stream event
        await webhookEventStreaming.createStreamEvent(
          'cache_invalidated',
          correlationId,
          {
            invalidation_result: invalidationResult,
            manual_trigger: true
          },
          {
            pageId: target_page_id,
            widgetId: target_widget_id,
            channels: ['cache', 'monitoring'],
            priority: 6,
            ttl: 300
          }
        );

        return NextResponse.json({
          success: invalidationResult.success,
          correlation_id: correlationId,
          invalidation_result: invalidationResult
        });

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown action: ${action}`,
          available_actions: ['invalidate']
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ [Phase3 API] PUT error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown cache operation error'
    }, { status: 500 });
  }
}