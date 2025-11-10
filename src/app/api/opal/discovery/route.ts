/**
 * OPAL Tools SDK Discovery Endpoint
 *
 * This endpoint provides discovery information for tools decorated with @tool
 * in the format expected by Optimizely OPAL Tools Management Service.
 *
 * Route: /api/opal/discovery
 * Method: GET
 * Purpose: SDK-compliant tool discovery for Optimizely Opal
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * CRITICAL: Based on @optimizely-opal/opal-tools-sdk documentation,
 * the discovery endpoint should return information about functions
 * decorated with @tool in a specific format.
 *
 * The OPAL Tools SDK expects discovery responses to contain
 * information about the decorated functions, not manual tool definitions.
 */

/**
 * Generate the OPAL SDK-compliant discovery response
 * Based on the @tool decorator usage in opal-tools-service.ts
 */
function generateOpalSdkDiscoveryResponse() {
  // The SDK discovery format based on @tool decorators
  return {
    // Functions array - each @tool decorated function becomes an entry
    functions: [
      {
        name: 'osa_workflow_data',
        description: 'Receives and processes workflow data from Opal agents for OSA (Optimizely Strategy Assistant)',

        // Parameter schema - this should match the OSAWorkflowParameters interface
        parameters: [
          {
            name: 'workflow_id',
            type: 'string',
            description: 'Unique identifier for the Opal workflow execution',
            required: true
          },
          {
            name: 'agent_data',
            type: 'array',
            description: 'Array of agent execution results and output data',
            required: true
          },
          {
            name: 'client_name',
            type: 'string',
            description: 'Name of the client organization for context',
            required: false
          },
          {
            name: 'business_objectives',
            type: 'array',
            description: 'List of business objectives to guide analysis',
            required: false
          }
        ],

        // Endpoint information - where the tool can be called
        endpoint: '/api/opal/osa-workflow',
        http_method: 'POST',

        // Additional metadata
        auth_required: false,
        version: '1.0.0'
      }
    ],

    // Service metadata
    name: 'OSA - Opal Connector Agents',
    description: 'OPAL Connector service for receiving workflow data from 9 Opal agents',
    version: '1.0.0',
    sdk_version: '@optimizely-opal/opal-tools-sdk',

    // Supported agent types
    supported_agents: [
      'experiment_blueprinter',
      'audience_suggester',
      'content_review',
      'roadmap_generator',
      'integration_health',
      'personalization_idea_generator',
      'cmp_organizer',
      'customer_journey',
      'geo_audit'
    ],

    // Discovery metadata
    discovery_generated_at: new Date().toISOString(),
    tools_count: 1
  };
}

/**
 * GET /api/opal/discovery
 *
 * Returns the SDK-compliant tool discovery response for Optimizely Opal
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const userAgent = request.headers.get('user-agent') || 'unknown';
    console.log('🔍 [OpalDiscovery] Request received from:', userAgent);

    // Generate the discovery response using OPAL SDK format
    const discoveryResponse = generateOpalSdkDiscoveryResponse();

    // Log the discovery request for monitoring
    console.log('📋 [OpalDiscovery] Returning SDK-compliant discovery response:', {
      functions_count: discoveryResponse.functions.length,
      service_name: discoveryResponse.name,
      supported_agents: discoveryResponse.supported_agents.length,
      discovery_format: 'functions_array'
    });

    // Return the discovery response with proper headers
    return NextResponse.json(discoveryResponse, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'X-OPAL-Discovery-Version': '1.0.0',
        'X-Service-Name': 'OSA-Opal-Connector-Agents',
        'X-SDK-Generated': 'true'
      }
    });

  } catch (error) {
    console.error('❌ [OpalDiscovery] Error processing discovery request:', error);

    // Return structured error response with fallback timestamp
    let timestamp: string;
    try {
      timestamp = new Date().toISOString();
    } catch (dateError) {
      // Fallback if Date constructor fails
      timestamp = '1970-01-01T00:00:00.000Z';
    }

    const errorResponse = {
      error: 'discovery_endpoint_error',
      message: error instanceof Error ? error.message : 'Unknown discovery error',
      timestamp: timestamp,
      service: 'OSA - Opal Connector Agents',
      functions: [] // Ensure we always return a functions array even on error
    };

    return NextResponse.json(errorResponse, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Error-Source': 'opal-discovery'
      }
    });
  }
}

/**
 * OPTIONS /api/opal/discovery
 *
 * Handle CORS preflight requests for cross-origin discovery
 */
export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  console.log('🔧 [OpalDiscovery] CORS preflight request received');

  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
      'X-CORS-Enabled': 'true'
    }
  });
}

/**
 * POST /api/opal/discovery (fallback)
 *
 * Some OPAL implementations might send POST requests to discovery
 * Redirect them to use GET method instead
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  console.warn('⚠️ [OpalDiscovery] POST request to discovery endpoint - redirecting to GET');

  return NextResponse.json({
    error: 'method_not_allowed',
    message: 'Discovery endpoint only supports GET requests',
    correct_method: 'GET',
    discovery_url: `${request.nextUrl.origin}/api/opal/discovery`,
    functions: [] // Maintain consistency with functions array format
  }, {
    status: 405,
    headers: {
      'Allow': 'GET, OPTIONS',
      'Content-Type': 'application/json'
    }
  });
}