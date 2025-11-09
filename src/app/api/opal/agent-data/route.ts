import { NextRequest, NextResponse } from 'next/server';

/**
 * OPAL Agent Data Endpoint
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
        'X-Forwarded-From': '/api/opal/agent-data'
      },
      body: body
    });

    const result = await response.json();

    return NextResponse.json(result, { status: response.status });

  } catch (error) {
    console.error('Agent data endpoint error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process agent data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET: Return endpoint status
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/opal/agent-data',
    status: 'active',
    description: 'OPAL agent data webhook endpoint - forwards to main webhook',
    forwards_to: '/api/webhooks/opal-workflow',
    supported_methods: ['POST'],
    last_updated: new Date().toISOString()
  });
}