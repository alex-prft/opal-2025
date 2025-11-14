/**
 * Mock OPAL Webhook Endpoint for Development
 * Simulates OPAL workflow responses for testing Force Sync integration
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * POST /api/webhooks/opal-mock-test - Mock OPAL Webhook for Development
 * Accepts any Force Sync request and returns a successful mock response
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const correlationId = `mock-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const workflowId = `workflow-${Date.now()}`;
  const sessionId = `session-${Date.now()}`;

  console.log('🧪 [Mock OPAL] Development webhook triggered', {
    correlationId,
    workflowId,
    sessionId
  });

  try {
    // Read the request payload
    const payload = await request.json();

    console.log('📋 [Mock OPAL] Request received', {
      correlationId,
      workflow_name: payload.workflow_name,
      client_name: payload.input_data?.client_name,
      triggered_by: payload.input_data?.triggered_by
    });

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Return a successful mock response that matches OPAL's expected format
    const mockResponse = {
      success: true,
      workflow_id: workflowId,
      session_id: sessionId,
      message: 'Mock OPAL workflow initiated successfully',
      status: 'initiated',
      estimated_completion: '3-5 minutes',
      polling_url: `/api/mock-opal/status/${sessionId}`,
      reference: `mock-ref-${correlationId}`,
      timestamp: new Date().toISOString(),
      mock: true // Indicates this is a mock response
    };

    console.log('✅ [Mock OPAL] Returning successful response', {
      correlationId,
      workflow_id: workflowId,
      session_id: sessionId,
      mock: true
    });

    return NextResponse.json(mockResponse, { status: 200 });

  } catch (error) {
    console.error('❌ [Mock OPAL] Processing failed:', {
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json({
      success: false,
      error: 'Mock OPAL processing failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      correlation_id: correlationId,
      mock: true
    }, { status: 500 });
  }
}

/**
 * GET /api/webhooks/opal-mock-test - Mock Webhook Health Check
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'healthy',
    message: 'Mock OPAL webhook endpoint running',
    endpoint: '/api/webhooks/opal-mock-test',
    environment: 'development',
    mock: true,
    timestamp: new Date().toISOString()
  });
}