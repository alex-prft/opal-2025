/**
 * OPAL API Route Template
 * Standard template for creating OPAL integration API routes
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // 1. Authentication check
    if (!process.env.OPAL_STRATEGY_WORKFLOW_AUTH_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Configuration Error',
        message: 'OPAL authentication not configured'
      }, { status: 500 });
    }

    // 2. Parse request body with fallback
    const body = await req.json().catch(() => ({}));

    // 3. Generate correlation ID for tracking
    const correlationId = `opal-${Date.now()}-${Math.random().toString(36).substring(2)}`;

    console.log('🔄 [OPAL API] Starting operation with correlation ID:', correlationId);

    // 4. YOUR OPAL LOGIC HERE
    // Replace this section with your specific OPAL workflow logic

    // 5. Return standardized response
    return NextResponse.json({
      success: true,
      correlation_id: correlationId,
      message: 'OPAL operation completed successfully'
    });

  } catch (error) {
    console.error('❌ [OPAL API] Error:', error);

    return NextResponse.json({
      success: false,
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    // Standard GET handler for OPAL status/health checks
    return NextResponse.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Health check failed'
    }, { status: 500 });
  }
}