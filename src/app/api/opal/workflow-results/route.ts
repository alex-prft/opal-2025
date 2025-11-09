import { NextRequest, NextResponse } from 'next/server';

/**
 * OPAL Workflow Results Endpoint
 * Redirects to the main OPAL webhook for consistency
 * This endpoint is referenced by opal-tools configuration
 */
export async function POST(request: NextRequest) {
  try {
    // Get the request body and headers
    const body = await request.text();
    const authHeader = request.headers.get('authorization') || '';

    // Forward to main OPAL webhook endpoint
    const webhookUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/opal-workflow`;

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'X-Forwarded-From': '/api/opal/workflow-results'
      },
      body: body
    });

    const result = await response.json();

    return NextResponse.json(result, { status: response.status });

  } catch (error) {
    console.error('Workflow results endpoint error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process workflow results',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET: Return endpoint status
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/opal/workflow-results',
    status: 'active',
    description: 'OPAL workflow results webhook endpoint - forwards to main webhook',
    forwards_to: '/api/webhooks/opal-workflow',
    supported_methods: ['POST'],
    last_updated: new Date().toISOString()
  });
}