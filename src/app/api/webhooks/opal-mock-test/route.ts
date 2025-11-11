/**
 * OPAL Mock Test Webhook Endpoint
 *
 * Comprehensive webhook endpoint that:
 * 1. Validates HMAC signatures and Bearer tokens with detailed logging
 * 2. Simulates OPAL strategy_assistant_workflow responses for development
 * 3. Provides full telemetry and diagnostics integration
 * 4. Supports both development testing and production webhook validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { webhookValidator } from '@/lib/webhook/security-validation';
import { logWebhookAttempt } from '@/app/api/diagnostics/last-webhook/route';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `mock-webhook-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  console.log(`🎭 [Mock OPAL Webhook] Incoming request: ${requestId}`, {
    method: 'POST',
    url: request.url,
    content_type: request.headers.get('content-type'),
    user_agent: request.headers.get('user-agent')
  });

  try {
    // Read request body
    const body = await request.text();
    const bodySize = Buffer.byteLength(body, 'utf8');

    // Parse JSON payload
    let payload;
    try {
      payload = JSON.parse(body);
    } catch (error) {
      console.error(`❌ [Mock OPAL Webhook] Invalid JSON payload: ${requestId}`, error);

      return NextResponse.json({
        success: false,
        error: 'invalid_payload',
        message: 'Request body must be valid JSON',
        request_id: requestId
      }, { status: 400 });
    }

    console.log(`📋 [Mock OPAL Webhook] Parsed payload: ${requestId}`, {
      workflow_name: payload.workflow_name,
      client_name: payload.input_data?.client_name,
      correlation_id: payload.metadata?.correlation_id,
      payload_size_bytes: bodySize
    });

    // Perform security validation
    const validationResult = await webhookValidator.validateWebhookRequest({
      headers: request.headers,
      body: body,
      method: 'POST',
      url: request.url
    }, 'manual');

    console.log(`🔐 [Mock OPAL Webhook] Security validation result: ${requestId}`, {
      valid: validationResult.valid,
      method: validationResult.method,
      error: validationResult.error_message
    });

    // Log the webhook attempt regardless of validation result
    logWebhookAttempt({
      webhook_url: request.url,
      method: 'POST',
      headers: Object.fromEntries(request.headers.entries()),
      payload_size_bytes: bodySize,
      response_status: validationResult.valid ? 200 : 401,
      response_time_ms: Date.now() - startTime,
      success: validationResult.valid,
      error_message: validationResult.error_message,
      correlation_id: payload.metadata?.correlation_id || `mock-${requestId}`,
      span_id: payload.metadata?.span_id || `mock-span-${requestId}`,
      source: 'manual',
      environment: process.env.NODE_ENV || 'development',
      auth_method: validationResult.method,
      payload_summary: {
        workflow_name: payload.workflow_name,
        client_name: payload.input_data?.client_name || 'Unknown',
        validation_result: validationResult.valid ? 'passed' : 'failed',
        request_id: requestId
      }
    });

    // Return 401 if validation failed
    if (!validationResult.valid) {
      console.warn(`⚠️ [Mock OPAL Webhook] Authentication failed: ${requestId}`, {
        error: validationResult.error_message,
        validation_details: validationResult.validation_details
      });

      return NextResponse.json({
        success: false,
        error: 'authentication_failed',
        message: validationResult.error_message,
        validation_details: validationResult.validation_details,
        request_id: requestId,
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }

    // Validation passed - simulate OPAL workflow execution
    console.log(`✅ [Mock OPAL Webhook] Authentication successful: ${requestId}`, {
      method: validationResult.method
    });

    // Simulate processing time (100-500ms)
    const processingTime = 100 + Math.random() * 400;
    await new Promise(resolve => setTimeout(resolve, processingTime));

    // Generate mock OPAL response
    const mockWorkflowId = `opal-${Date.now()}`;
    const mockSessionId = `session-${Date.now()}`;

    const mockResponse = {
      success: true,
      message: `Mock OPAL workflow '${payload.workflow_name}' triggered successfully`,
      workflow_id: mockWorkflowId,
      session_id: mockSessionId,
      execution_details: {
        workflow_name: payload.workflow_name,
        client_name: payload.input_data?.client_name || 'Mock Client',
        triggered_by: payload.input_data?.triggered_by || 'webhook',
        processing_time_ms: Math.round(processingTime),
        estimated_completion: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes from now
        agents_scheduled: [
          'content_review',
          'audience_segmentation',
          'personalization_strategy',
          'experiment_design',
          'strategy_compilation'
        ]
      },
      polling_url: `/api/opal/status/${mockSessionId}`,
      webhook_metadata: {
        request_id: requestId,
        validation_method: validationResult.method,
        received_at: new Date().toISOString(),
        correlation_id: payload.metadata?.correlation_id,
        span_id: payload.metadata?.span_id,
        source_system: payload.metadata?.source_system || 'Unknown'
      },
      mock_simulation: {
        note: 'This is a mock OPAL response for development testing',
        real_opal_url: process.env.OPAL_WEBHOOK_URL || 'Not configured',
        environment: process.env.NODE_ENV || 'development'
      }
    };

    const duration = Date.now() - startTime;

    console.log(`🎉 [Mock OPAL Webhook] Successfully processed: ${requestId}`, {
      workflow_id: mockWorkflowId,
      session_id: mockSessionId,
      duration_ms: duration,
      validation_method: validationResult.method
    });

    return NextResponse.json(mockResponse);

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error(`💥 [Mock OPAL Webhook] Processing failed: ${requestId} (${duration}ms)`, errorMessage);

    // Log failed attempt
    logWebhookAttempt({
      webhook_url: request.url,
      method: 'POST',
      headers: Object.fromEntries(request.headers.entries()),
      payload_size_bytes: 0,
      response_time_ms: duration,
      success: false,
      error_message: `Processing error: ${errorMessage}`,
      correlation_id: `error-${requestId}`,
      span_id: `error-span-${requestId}`,
      source: 'manual',
      environment: process.env.NODE_ENV || 'development',
      auth_method: 'none',
      payload_summary: {
        error: 'processing_failed',
        request_id: requestId
      }
    });

    return NextResponse.json({
      success: false,
      error: 'processing_failed',
      message: `Webhook processing failed: ${errorMessage}`,
      request_id: requestId,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    endpoint: '/api/webhooks/opal-mock-test',
    description: 'OPAL Mock Test Webhook with Security Validation',
    capabilities: [
      'HMAC signature validation with detailed failure logging',
      'Bearer token authentication',
      'strategy_assistant_workflow simulation',
      'Comprehensive telemetry and diagnostics integration',
      'Environment-aware configuration detection'
    ],
    validation_status: webhookValidator.getValidationStatus(),
    testing: {
      bearer_token_test: 'Send Authorization: Bearer <token> header',
      hmac_signature_test: 'Send X-Webhook-Signature: sha256=<signature> header',
      timestamp_validation: 'Include X-Timestamp header for HMAC validation'
    },
    sample_payload: {
      workflow_name: 'strategy_assistant_workflow',
      input_data: {
        client_name: 'Test Client',
        industry: 'Technology',
        triggered_by: 'webhook_test'
      },
      metadata: {
        workspace_id: 'test-workspace',
        correlation_id: 'test-correlation-id'
      }
    }
  });
}

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Webhook-Signature, X-Timestamp, X-Correlation-ID, X-Span-ID'
    }
  });
}