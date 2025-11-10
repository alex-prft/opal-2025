/**
 * OPAL Tools Discovery Endpoint
 *
 * This endpoint integrates with the Optimizely OPAL Tools SDK
 * to provide proper tool discovery for our osa_workflow_data function.
 *
 * Route: /api/opal/discovery
 * Method: GET
 * Purpose: SDK-compliant tool discovery for Optimizely Opal
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * CRITICAL: The OPAL Tools SDK expects a very specific format for discovery.
 * Based on the SDK implementation, tools are discovered via reflection on
 * decorated functions, not via manual JSON responses.
 *
 * However, since we're in a Next.js environment, we need to provide the
 * discovery response in the format the SDK would generate.
 */

/**
 * Generate the OPAL-compliant discovery response
 * This matches what the ToolsService would generate internally
 */
function generateOpalDiscoveryResponse() {
  return {
    // The SDK expects a 'tools' key with tool definitions
    tools: {
      osa_workflow_data: {
        name: 'osa_workflow_data',
        description: 'Receives and processes workflow data from Opal agents for OSA (Optimizely Strategy Assistant)',

        // Function signature for the tool
        function: {
          name: 'osa_workflow_data',
          parameters: {
            type: 'object',
            properties: {
              workflow_id: {
                type: 'string',
                description: 'Unique identifier for the Opal workflow execution'
              },
              agent_data: {
                type: 'array',
                description: 'Array of agent execution results and output data',
                items: {
                  type: 'object',
                  properties: {
                    agent_id: {
                      type: 'string',
                      description: 'Unique identifier for the agent',
                      enum: [
                        'experiment_blueprinter',
                        'audience_suggester',
                        'content_review',
                        'roadmap_generator',
                        'integration_health',
                        'personalization_idea_generator',
                        'cmp_organizer',
                        'customer_journey',
                        'geo_audit'
                      ]
                    },
                    agent_name: {
                      type: 'string',
                      description: 'Human-readable name of the agent'
                    },
                    workflow_id: {
                      type: 'string',
                      description: 'Workflow identifier for data correlation'
                    },
                    execution_results: {
                      type: 'object',
                      description: 'Agent-specific execution results and analysis data'
                    },
                    metadata: {
                      type: 'object',
                      description: 'Execution metadata and performance metrics',
                      properties: {
                        execution_time_ms: {
                          type: 'number',
                          description: 'Agent execution time in milliseconds'
                        },
                        timestamp: {
                          type: 'string',
                          description: 'ISO timestamp of agent completion'
                        },
                        success: {
                          type: 'boolean',
                          description: 'Whether the agent executed successfully'
                        },
                        error_message: {
                          type: 'string',
                          description: 'Error details if agent execution failed'
                        }
                      },
                      required: ['execution_time_ms', 'timestamp', 'success']
                    },
                    output_data: {
                      type: 'object',
                      description: 'Agent output data containing analysis results'
                    }
                  },
                  required: ['agent_id', 'agent_name', 'workflow_id', 'metadata']
                }
              },
              client_name: {
                type: 'string',
                description: 'Name of the client organization for context'
              },
              business_objectives: {
                type: 'array',
                description: 'List of business objectives to guide analysis',
                items: {
                  type: 'string'
                }
              }
            },
            required: ['workflow_id', 'agent_data']
          },

          // Return type specification
          returns: {
            type: 'object',
            properties: {
              workflow_id: {
                type: 'string',
                description: 'Workflow identifier confirmation'
              },
              status: {
                type: 'string',
                enum: ['received', 'processing', 'completed', 'failed'],
                description: 'Processing status'
              },
              agents_received: {
                type: 'array',
                items: { type: 'string' },
                description: 'List of agent IDs successfully received'
              },
              total_agents: {
                type: 'number',
                description: 'Total number of agents processed'
              },
              message: {
                type: 'string',
                description: 'Human-readable status message'
              },
              timestamp: {
                type: 'string',
                description: 'ISO timestamp of processing completion'
              }
            }
          }
        },

        // Endpoint information
        endpoint: {
          url: process.env.NODE_ENV === 'production'
            ? 'https://ifpa-strategy.vercel.app/api/opal/osa-workflow'
            : 'http://localhost:3000/api/opal/osa-workflow',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      }
    },

    // Service metadata
    metadata: {
      service_name: 'OSA - Opal Connector Agents',
      version: '1.0.0',
      sdk_version: '@optimizely-opal/opal-tools-sdk',
      description: 'OPAL Connector service for receiving workflow data from 9 Opal agents',
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
      last_updated: new Date().toISOString()
    }
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
    const discoveryResponse = generateOpalDiscoveryResponse();

    // Log the discovery request for monitoring
    console.log('📋 [OpalDiscovery] Returning SDK-compliant response:', {
      tools_count: Object.keys(discoveryResponse.tools).length,
      service_name: discoveryResponse.metadata.service_name,
      endpoint: discoveryResponse.tools.osa_workflow_data.endpoint.url,
      supported_agents: discoveryResponse.metadata.supported_agents.length
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
        'X-Service-Name': 'OSA-Opal-Connector-Agents'
      }
    });

  } catch (error) {
    console.error('❌ [OpalDiscovery] Error processing discovery request:', error);

    // Return structured error response
    const errorResponse = {
      error: 'discovery_endpoint_error',
      message: error instanceof Error ? error.message : 'Unknown discovery error',
      timestamp: new Date().toISOString(),
      service: 'OSA - Opal Connector Agents'
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
    discovery_url: `${request.nextUrl.origin}/api/opal/discovery`
  }, {
    status: 405,
    headers: {
      'Allow': 'GET, OPTIONS',
      'Content-Type': 'application/json'
    }
  });
}