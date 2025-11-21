/**
 * OPAL Tools Discovery Endpoint
 *
 * This endpoint exposes all OPAL SDK-compliant tools for discovery by OPAL agents.
 * It serves as the bridge between the main.ts Express application and Next.js API routes.
 *
 * URL: https://opal-2025.vercel.app/api/tools/osa-tools/discovery
 * Method: GET
 *
 * Integration Pattern:
 * - Uses Node.js import() to dynamically load the main.ts application
 * - Delegates to the Express app's /discovery endpoint created by ToolsService
 * - Maintains compatibility with both development and production environments
 */

import { NextRequest, NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import { join } from 'path';

/**
 * GET /api/tools/osa-tools/discovery
 *
 * Returns comprehensive tool discovery information for OPAL integration
 */
/**
 * Dynamically discovers all available OSA tools by scanning the filesystem
 * @returns Array of OPAL-compatible tool definitions
 */
async function discoverOSATools(): Promise<any[]> {
  const correlationId = `discovery-scan-${Date.now()}`;
  console.log('🔍 [Dynamic Discovery] Starting OSA tool scan', { correlationId });

  try {
    const toolsBasePath = process.cwd() + '/src/app/api/tools';
    const toolDirs = await readdir(toolsBasePath, { withFileTypes: true });
    const discoveredTools: any[] = [];

    for (const dirent of toolDirs) {
      // Only scan directories that start with 'osa_'
      if (dirent.isDirectory() && dirent.name.startsWith('osa_')) {
        const toolPath = join(toolsBasePath, dirent.name, 'route.ts');

        try {
          // Check if route.ts exists for this tool
          const fs = await import('fs/promises');
          await fs.access(toolPath);

          // Create tool definition based on naming conventions
          const toolName = dirent.name;
          const toolDefinition = createToolDefinition(toolName);
          discoveredTools.push(toolDefinition);

          console.log('✅ [Dynamic Discovery] Found tool:', { toolName, correlationId });
        } catch (toolError) {
          console.warn('⚠️ [Dynamic Discovery] Tool directory without route.ts:', { toolName: dirent.name, correlationId });
        }
      }
    }

    console.log('🔍 [Dynamic Discovery] Scan complete', {
      correlationId,
      total_tools_found: discoveredTools.length,
      tools: discoveredTools.map(t => t.name)
    });

    return discoveredTools;
  } catch (error) {
    console.error('❌ [Dynamic Discovery] Scan failed:', {
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    // Return empty array on failure - fallback to static discovery
    return [];
  }
}

/**
 * Creates a tool definition based on tool name and common patterns
 * @param toolName - Name of the tool (e.g., 'osa_fetch_audience_segments')
 * @returns OPAL-compatible tool definition
 */
function createToolDefinition(toolName: string): any {
  const baseDefinition = {
    name: toolName,
    version: "1.0.0",
    parameters: [
      { name: "workflow_id", type: "string", required: false, description: "Workflow identifier for correlation tracking" }
    ]
  };

  // Tool-specific definitions with descriptions and parameters
  const toolDefinitions: Record<string, any> = {
    osa_fetch_audience_segments: {
      description: "Retrieves existing audience segments from Optimizely ODP including metadata, performance data, and implementation roadmaps for OSA strategy development.",
      parameters: [
        { name: "member_tiers", type: "list", required: false, description: "Member tier segments to include" },
        { name: "engagement_levels", type: "list", required: false, description: "Engagement level filters" },
        { name: "behavioral_patterns", type: "list", required: false, description: "Behavioral pattern criteria" },
        { name: "geographic_filters", type: "dictionary", required: false, description: "Geographic targeting filters" },
        { name: "include_size_estimates", type: "boolean", required: false, description: "Include segment size estimates" },
        { name: "include_attributes", type: "boolean", required: false, description: "Include detailed segment attributes" },
        { name: "workflow_id", type: "string", required: false, description: "Workflow identifier for correlation tracking" },
        { name: "projectId", type: "string", required: false, description: "ODP project identifier" },
        { name: "limit", type: "number", required: false, description: "Max number of segments to return" },
        { name: "page", type: "number", required: false, description: "Page of results to fetch" }
      ]
    },
    osa_send_data_to_osa_webhook: {
      description: "Send agent data and results to OSA application via webhook for real-time updates. Bridges OPAL chat interface calls to enhanced tools infrastructure.",
      parameters: [
        { name: "agent_name", type: "string", required: true, description: "Name of the agent sending data" },
        { name: "execution_results", type: "dictionary", required: true, description: "Agent execution results and insights" },
        { name: "workflow_id", type: "string", required: true, description: "Unique workflow execution identifier" },
        { name: "metadata", type: "dictionary", required: true, description: "Agent execution metadata" },
        { name: "webhook_endpoint", type: "string", required: false, description: "OSA webhook endpoint path" }
      ]
    },
    osa_analyze_member_behavior: {
      description: "Analyze member behavioral patterns, engagement metrics, and provide predictive insights for personalization and retention strategies.",
      parameters: [
        { name: "member_segment", type: "string", required: false, description: "Target member segment for analysis" },
        { name: "analysis_timeframe", type: "string", required: false, description: "Timeframe for behavioral analysis" },
        { name: "behavioral_focus", type: "list", required: false, description: "Specific behavioral aspects to focus on" },
        { name: "include_predictive_insights", type: "boolean", required: false, description: "Include AI-powered predictive insights" },
        { name: "workflow_id", type: "string", required: false, description: "Workflow identifier for correlation tracking" }
      ]
    },
    osa_validate_language_rules: {
      description: "Validate content against language rules for readability, inclusivity, professionalism, and accuracy compliance.",
      parameters: [
        { name: "content_text", type: "string", required: true, description: "Text content to validate" },
        { name: "content_type", type: "string", required: false, description: "Type of content being validated" },
        { name: "target_audience", type: "string", required: false, description: "Target audience for content" },
        { name: "validation_level", type: "string", required: false, description: "Level of validation strictness" },
        { name: "custom_rules", type: "list", required: false, description: "Additional custom validation rules" }
      ]
    },
    osa_store_workflow_data: {
      description: "Store workflow execution data and metadata for analysis and reporting",
      parameters: [
        { name: "workflow_id", type: "string", required: true, description: "Workflow identifier" },
        { name: "workflow_data", type: "dictionary", required: true, description: "Workflow data to store" }
      ]
    },
    osa_create_dynamic_segments: {
      description: "Create dynamic audience segments based on behavioral criteria",
      parameters: [
        { name: "segment_criteria", type: "dictionary", required: true, description: "Segmentation criteria" },
        { name: "segment_name", type: "string", required: true, description: "Name for the new segment" }
      ]
    },
    osa_retrieve_workflow_context: {
      description: "Retrieve workflow execution context and metadata",
      parameters: [
        { name: "workflow_id", type: "string", required: true, description: "Workflow identifier" }
      ]
    },
    osa_analyze_data_insights: {
      description: "Analyze data patterns and generate actionable insights",
      parameters: [
        { name: "data_source", type: "string", required: true, description: "Data source to analyze" },
        { name: "analysis_type", type: "string", required: false, description: "Type of analysis" }
      ]
    },
    osa_calculate_segment_statistical_power: {
      description: "Calculate statistical power for segment analysis",
      parameters: [
        { name: "segment_size", type: "number", required: true, description: "Segment size" },
        { name: "effect_size", type: "number", required: true, description: "Expected effect size" }
      ]
    },
    osa_get_member_journey_data: {
      description: "Retrieve member journey data and touchpoint analysis",
      parameters: [
        { name: "member_id", type: "string", required: false, description: "Member identifier" },
        { name: "journey_stage", type: "string", required: false, description: "Specific journey stage" }
      ]
    }
  };

  // Use specific definition if available, otherwise create a generic one
  const specificDef = toolDefinitions[toolName];
  if (specificDef) {
    return { ...baseDefinition, ...specificDef };
  }

  // Generic definition for tools not in the specific definitions
  return {
    ...baseDefinition,
    description: `${toolName.replace(/_/g, ' ').replace(/^osa /, 'OSA ')} tool for OPAL agent integration`,
    parameters: [
      { name: "workflow_id", type: "string", required: false, description: "Workflow identifier for correlation tracking" },
      { name: "data", type: "dictionary", required: false, description: "Tool-specific data parameters" }
    ]
  };
}

/**
 * Validates Bearer token authentication for OPAL discovery endpoint
 * Supports multiple authentication modes for different environments
 */
function validateBearerToken(authHeader: string | null): { valid: boolean; reason?: string } {
  // Allow access without authentication in development for testing
  if (process.env.NODE_ENV === 'development' && !process.env.OPAL_DISCOVERY_TOKEN) {
    return { valid: true };
  }

  // Check for Authorization header
  if (!authHeader) {
    return { valid: false, reason: 'Missing Authorization header' };
  }

  // Extract Bearer token
  const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!tokenMatch) {
    return { valid: false, reason: 'Invalid Authorization format. Expected: Bearer <token>' };
  }

  const providedToken = tokenMatch[1];

  // Get expected token from environment
  const expectedToken = process.env.OPAL_DISCOVERY_TOKEN || process.env.OPAL_TOOLS_AUTH_TOKEN;

  if (!expectedToken) {
    // No token configured - allow access with warning
    console.warn('⚠️ [OPAL Discovery] No authentication token configured in environment');
    return { valid: true };
  }

  // Validate token
  if (providedToken !== expectedToken) {
    return { valid: false, reason: 'Invalid authentication token' };
  }

  return { valid: true };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const correlationId = `discovery-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  try {
    console.log('🔍 [OPAL Discovery] Discovery request received', {
      correlationId,
      userAgent: request.headers.get('user-agent'),
      origin: request.headers.get('origin'),
      hasAuth: !!request.headers.get('authorization')
    });

    // Validate Bearer token authentication
    const authHeader = request.headers.get('authorization');
    const authValidation = validateBearerToken(authHeader);

    if (!authValidation.valid) {
      console.warn('🚫 [OPAL Discovery] Authentication failed', {
        correlationId,
        reason: authValidation.reason,
        authHeaderPresent: !!authHeader
      });

      return NextResponse.json({
        error: 'Authentication required',
        message: authValidation.reason || 'Valid Bearer token required',
        correlation_id: correlationId,
        timestamp: new Date().toISOString(),
        authentication: {
          required: true,
          format: 'Bearer <token>',
          header: 'Authorization'
        }
      }, {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-ID': correlationId,
          'WWW-Authenticate': 'Bearer realm="OPAL Tools Discovery"'
        }
      });
    }

    console.log('✅ [OPAL Discovery] Authentication successful', { correlationId });

    // In development, we can try to use the running Express server
    // In production/serverless, we'll provide a static discovery response
    let discoveryData;

    if (process.env.NODE_ENV === 'development') {
      try {
        // Try to fetch from local Express server if running
        const localDiscoveryUrl = 'http://localhost:3001/discovery';
        const response = await fetch(localDiscoveryUrl, {
          method: 'GET',
          headers: {
            'X-Correlation-ID': correlationId,
          },
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });

        if (response.ok) {
          discoveryData = await response.json();
          console.log('✅ [OPAL Discovery] Retrieved from local Express server', { correlationId });
        } else {
          throw new Error(`Express server returned ${response.status}`);
        }
      } catch (localError) {
        console.warn('⚠️ [OPAL Discovery] Local Express server not available, using static discovery', {
          correlationId,
          error: localError instanceof Error ? localError.message : 'Unknown error'
        });
        discoveryData = null;
      }
    }

    // Fallback to dynamic discovery data
    if (!discoveryData) {
      console.log('🔍 [OPAL Discovery] Using dynamic OSA tool discovery', { correlationId });

      // Use dynamic tool discovery instead of static array
      const toolsArray = await discoverOSATools();

      console.log('✅ [OPAL Discovery] Dynamic discovery complete', {
        correlationId,
        tools_discovered: toolsArray.length,
        tool_names: toolsArray.map(t => t.name)
      });

      // OPAL-Compatible Discovery Format
      discoveryData = {
        functions: toolsArray,
        tools: toolsArray, // Keep backward compatibility
        discovery_info: {
          service_name: "OSA OPAL Tools Registry",
          version: "1.0.0",
          total_tools: toolsArray.length,
          sdk_version: "@optimizely-opal/opal-tools-sdk@0.1.3-dev",
          discovery_url: request.url,
          environment: process.env.NODE_ENV || 'development',
          discovery_method: "dynamic_filesystem_scan",
          capabilities: [
            "audience_segmentation",
            "behavioral_analysis",
            "workflow_management",
            "data_validation",
            "webhook_integration",
            "predictive_insights",
            "canvas_visualization",
            "content_strategy",
            "cmp_integration",
            "performance_analytics"
          ],
          integration_health: {
            status: toolsArray.length > 0 ? "healthy" : "degraded",
            last_check: new Date().toISOString(),
            tools_registered: toolsArray.length,
            tools_available: toolsArray.length,
            dynamic_discovery: true
          }
        }
      };
    }

    const processingTime = Date.now() - startTime;

    console.log('✅ [OPAL Discovery] Discovery response generated', {
      correlationId,
      functions_count: discoveryData.functions?.length || 0,
      tools_count: discoveryData.tools?.length || discoveryData.discovery_info?.total_tools,
      processing_time_ms: processingTime,
      source: discoveryData.functions ? 'opal_format' : 'static_data'
    });

    return NextResponse.json(discoveryData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': correlationId,
        'X-Processing-Time': processingTime.toString(),
        'X-Functions-Count': (discoveryData.functions?.length || 0).toString(),
        'X-Tools-Count': (discoveryData.tools?.length || discoveryData.discovery_info?.total_tools || 0).toString(),
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Correlation-ID'
      }
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;

    console.error('❌ [OPAL Discovery] Discovery failed:', {
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      processing_time_ms: processingTime
    });

    return NextResponse.json({
      error: 'Discovery failed',
      message: 'Failed to retrieve OPAL tools discovery information',
      correlation_id: correlationId,
      timestamp: new Date().toISOString(),
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    }, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': correlationId,
        'X-Processing-Time': processingTime.toString()
      }
    });
  }
}

/**
 * OPTIONS /api/tools/osa-tools/discovery
 *
 * Handle CORS preflight requests for cross-origin tool discovery
 */
export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Correlation-ID',
      'Access-Control-Max-Age': '86400'
    }
  });
}