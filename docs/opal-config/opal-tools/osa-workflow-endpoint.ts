/**
 * OSA Workflow Data Endpoint
 *
 * This endpoint receives osa_workflow_data from Optimizely Opal agents
 * and integrates with the existing webhook infrastructure.
 *
 * Route: /api/opal/osa-workflow
 * Method: POST
 * Purpose: Receive and process agent execution results
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  opalConnector,
  OSAWorkflowParameters,
  OSAWorkflowResult
} from '@/lib/opal-connector/opal-tools-service';

/**
 * POST /api/opal/osa-workflow
 *
 * Receives OSA workflow data from Opal agents and processes it
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // Parse request body
    const body: OSAWorkflowParameters = await request.json();

    // Validate required fields
    if (!body.workflow_id) {
      return NextResponse.json({
        error: 'Missing workflow_id',
        message: 'workflow_id is required in request body',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    if (!body.agent_data || !Array.isArray(body.agent_data)) {
      return NextResponse.json({
        error: 'Missing or invalid agent_data',
        message: 'agent_data must be an array of agent execution results',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Log incoming request
    console.log('🚀 OSA Workflow Data received:', {
      workflow_id: body.workflow_id,
      agent_count: body.agent_data.length,
      client: body.client_name || 'Unknown',
      user_agent: request.headers.get('user-agent'),
      content_length: request.headers.get('content-length')
    });

    // Validate authentication (using existing webhook auth if available)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('⚠️ Missing or invalid authentication header');

      // In development, allow requests without auth for testing
      if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({
          error: 'Authentication required',
          message: 'Bearer token required in Authorization header',
          timestamp: new Date().toISOString()
        }, { status: 401 });
      }
    }

    // Process the workflow data
    console.log('🔄 Processing OSA workflow data...');
    const result: OSAWorkflowResult = await opalConnector.processOSAWorkflowData(body);

    // Calculate processing time
    const processingTime = Date.now() - startTime;

    // Log successful processing
    console.log('✅ OSA workflow data processed successfully:', {
      workflow_id: result.workflow_id,
      status: result.status,
      agents_processed: result.agents_received.length,
      processing_time_ms: processingTime
    });

    // Return success response
    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Processing-Time': processingTime.toString(),
        'X-Workflow-ID': result.workflow_id
      }
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;

    console.error('❌ Error processing OSA workflow data:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      processing_time_ms: processingTime
    });

    return NextResponse.json({
      error: 'Processing failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Processing-Time': processingTime.toString()
      }
    });
  }
}

/**
 * GET /api/opal/osa-workflow
 *
 * Returns service status and configuration
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const status = opalConnector.getServiceStatus();

    console.log('ℹ️ OSA Connector status requested:', {
      requester: request.headers.get('user-agent'),
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(status, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('❌ Error getting service status:', error);

    return NextResponse.json({
      error: 'Status check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * OPTIONS /api/opal/osa-workflow
 *
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}