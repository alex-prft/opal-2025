// Phase 2: Enhanced Validation API with Cache, Claude, and Background Jobs
// Integrates all Phase 2 components for production-ready content validation

import { NextRequest, NextResponse } from 'next/server';
import { phase2Pipeline, type Phase2ValidationRequest } from '@/lib/validation/phase2-integration';
import { validationLogger } from '@/lib/validation/validation-logger';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const correlationId = `phase2_api_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  try {
    console.log(`🚀 [Phase2 API] Validation request received (${correlationId})`);

    // Parse and validate request
    const body = await request.json();
    const { pageId, widgetId, force_refresh, enable_claude_enhancement, cache_strategy, claude_enhancement_type } = body;

    // Input validation
    if (!pageId || !widgetId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: pageId and widgetId are required',
        correlation_id: correlationId
      }, { status: 400 });
    }

    // Extract request headers for context
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const referer = request.headers.get('referer') || 'direct';
    const xForwardedFor = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    // Build Phase 2 validation request
    const phase2Request: Phase2ValidationRequest = {
      pageId,
      widgetId,
      force_refresh: force_refresh || false,
      enable_claude_enhancement: enable_claude_enhancement || false,
      cache_strategy: cache_strategy || 'prefer_cache',
      claude_enhancement_type: claude_enhancement_type || 'enrichment',
      requestContext: {
        correlation_id: correlationId,
        source: 'phase2_api',
        timestamp: new Date().toISOString(),
        user_agent: userAgent,
        referer: referer,
        ip_address: xForwardedFor
      }
    };

    console.log(`🔍 [Phase2 API] Processing ${pageId}/${widgetId} with strategy: ${cache_strategy}, Claude: ${enable_claude_enhancement}`);

    // Execute Phase 2 validation pipeline
    const validationResponse = await phase2Pipeline.getValidatedContent(phase2Request);

    // Log the validation result
    await validationLogger.logValidation({
      correlation_id: correlationId,
      page_id: pageId,
      widget_id: widgetId,
      validation_type: 'phase2_api',
      result: validationResponse.success ? 'passed' : 'failed',
      confidence_score: validationResponse.validation_summary.confidence_score,
      duration_ms: Date.now() - startTime,
      source: 'phase2_api_endpoint',
      cache_hit: validationResponse.cache_info.cache_hit,
      claude_attempted: validationResponse.claude_info?.enhancement_attempted || false,
      claude_success: validationResponse.claude_info?.enhancement_success || false
    });

    // Build comprehensive API response
    const apiResponse = {
      success: validationResponse.success,
      correlation_id: correlationId,
      content: validationResponse.content,
      validation_summary: validationResponse.validation_summary,
      performance_metrics: {
        ...validationResponse.performance_metrics,
        api_processing_ms: Date.now() - startTime
      },
      cache_info: validationResponse.cache_info,
      claude_info: validationResponse.claude_info,
      audit_trail: validationResponse.audit_trail,
      phase2_enhancements: {
        intelligent_cache_used: true,
        background_jobs_active: true,
        audit_trail_enabled: true,
        rollback_available: validationResponse.audit_trail.rollback_available
      }
    };

    console.log(`✅ [Phase2 API] Validation completed in ${Date.now() - startTime}ms (${correlationId})`);

    return NextResponse.json(apiResponse);

  } catch (error) {
    console.error(`❌ [Phase2 API] Validation failed (${correlationId}):`, error);

    // Log the error
    await validationLogger.logValidation({
      correlation_id: correlationId,
      page_id: 'unknown',
      widget_id: 'unknown',
      validation_type: 'phase2_api',
      result: 'error',
      confidence_score: 0,
      duration_ms: Date.now() - startTime,
      source: 'phase2_api_endpoint',
      error_message: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json({
      success: false,
      correlation_id: correlationId,
      error: error instanceof Error ? error.message : 'Unknown validation error',
      error_code: 'phase2_validation_error',
      performance_metrics: {
        total_duration_ms: Date.now() - startTime,
        error_occurred: true
      }
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'Phase 2 Enhanced Validation API',
    description: 'Production-ready validation with intelligent cache, Claude integration, and background jobs',
    version: '2.0.0',
    capabilities: [
      'Intelligent tiered caching (Tier 1: 5min, Tier 2: 10min, Tier 3: 15min)',
      'Real Claude API integration with hard retry limits (max 2 attempts)',
      'Background job system for cache warming and validation',
      'Complete audit trail with rollback capabilities',
      'Cross-page consistency validation',
      'Performance monitoring and metrics'
    ],
    usage: {
      method: 'POST',
      required_fields: ['pageId', 'widgetId'],
      optional_fields: ['force_refresh', 'enable_claude_enhancement', 'cache_strategy', 'claude_enhancement_type'],
      cache_strategies: ['prefer_cache', 'prefer_fresh', 'cache_only', 'fresh_only'],
      claude_enhancement_types: ['summarization', 'enrichment', 'formatting', 'analysis']
    }
  });
}