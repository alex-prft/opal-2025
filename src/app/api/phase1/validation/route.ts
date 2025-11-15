// Phase 1 Validation API Endpoint
// Provides validated content with comprehensive safety pipeline

import { NextRequest, NextResponse } from 'next/server';
import { phase1Pipeline, type Phase1ValidationRequest } from '@/lib/validation/phase1-integration';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const correlationId = `api_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  try {
    console.log(`📡 [API] Phase 1 validation request received (${correlationId})`);

    // Parse request body
    const body = await request.json();
    const { pageId, widgetId, force_refresh = false } = body;

    // Validate required parameters
    if (!pageId || !widgetId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: pageId and widgetId',
          correlation_id: correlationId
        },
        { status: 400 }
      );
    }

    // Extract request context
    const requestContext = {
      session_id: request.headers.get('x-session-id') || undefined,
      user_agent: request.headers.get('user-agent') || undefined,
      correlation_id: correlationId,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    };

    // Build validation request
    const validationRequest: Phase1ValidationRequest = {
      pageId,
      widgetId,
      requestContext,
      force_refresh
    };

    // Execute validation pipeline
    const response = await phase1Pipeline.getValidatedContent(validationRequest);

    // Add API metadata
    const apiResponse = {
      ...response,
      api_metadata: {
        correlation_id: correlationId,
        api_version: '1.0',
        timestamp: new Date().toISOString(),
        request_duration_ms: Date.now() - startTime
      }
    };

    console.log(`✅ [API] Phase 1 validation completed (${correlationId}) - ${response.success ? 'SUCCESS' : 'FAILED'} in ${Date.now() - startTime}ms`);

    return NextResponse.json(apiResponse, {
      status: response.success ? 200 : 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': correlationId,
        'X-Validation-Status': response.validation_summary.all_gates_passed ? 'passed' : 'failed',
        'X-Confidence-Score': response.validation_summary.confidence_score.toString(),
        'X-Content-Source': response.content.type
      }
    });

  } catch (error) {
    console.error(`❌ [API] Phase 1 validation error (${correlationId}):`, error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        correlation_id: correlationId,
        api_metadata: {
          correlation_id: correlationId,
          api_version: '1.0',
          timestamp: new Date().toISOString(),
          request_duration_ms: Date.now() - startTime
        }
      },
      {
        status: 500,
        headers: {
          'X-Correlation-ID': correlationId
        }
      }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pageId = searchParams.get('pageId');
  const widgetId = searchParams.get('widgetId');

  if (!pageId || !widgetId) {
    return NextResponse.json(
      { error: 'Missing required parameters: pageId and widgetId' },
      { status: 400 }
    );
  }

  // Convert GET to POST request format
  const postRequest = {
    pageId,
    widgetId,
    force_refresh: searchParams.get('force_refresh') === 'true'
  };

  // Execute as if it were a POST request
  const fakeRequest = {
    json: async () => postRequest,
    headers: request.headers
  } as any;

  return POST(fakeRequest);
}