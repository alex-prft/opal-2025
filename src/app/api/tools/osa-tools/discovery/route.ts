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

/**
 * GET /api/tools/osa-tools/discovery
 *
 * Returns comprehensive tool discovery information for OPAL integration in canonical format
 */
/**
 * Validates Bearer token authentication for OPAL discovery endpoint
 * Supports multiple authentication modes for different environments
 */
function validateBearerToken(authHeader: string | null): { valid: boolean; reason?: string } {
  // First check if authentication is configured in environment
  const expectedToken = process.env.OPAL_DISCOVERY_TOKEN || process.env.OPAL_TOOLS_AUTH_TOKEN;

  // If no token is configured, allow open access regardless of environment
  if (!expectedToken) {
    console.warn('⚠️ [OPAL Discovery] No authentication token configured in environment - allowing open access');
    return { valid: true };
  }

  // Authentication is configured, so require Bearer token
  if (!authHeader) {
    return { valid: false, reason: 'Missing Authorization header' };
  }

  // Extract Bearer token
  const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!tokenMatch) {
    return { valid: false, reason: 'Invalid Authorization format. Expected: Bearer <token>' };
  }

  const providedToken = tokenMatch[1];

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

    // Fallback to static discovery data
    if (!discoveryData) {
      const toolsArray = [
          {
            name: "osa_cms_analyze_content",
            description: "Analyze CMS content performance, structure, and optimization opportunities with fresh produce industry context",
            version: "3.0.0",
            parameters: [
              { name: "content_type", type: "string", required: false, description: "Type of content to analyze (articles, pages, resources)" },
              { name: "performance_metrics", type: "list", required: false, description: "Performance metrics to evaluate" },
              { name: "analysis_depth", type: "string", required: false, description: "Depth of analysis (basic, comprehensive, expert)" },
              { name: "workflow_id", type: "string", required: false, description: "Workflow identifier for correlation tracking" }
            ]
          },
          {
            name: "osa_cms_content_structure",
            description: "Analyze and optimize CMS content structure for fresh produce industry standards and IFPA compliance",
            version: "3.0.0",
            parameters: [
              { name: "structure_scope", type: "string", required: false, description: "Scope of structure analysis" },
              { name: "include_taxonomy_analysis", type: "boolean", required: false, description: "Include content taxonomy analysis" },
              { name: "optimization_focus", type: "string", required: false, description: "Primary optimization focus area" },
              { name: "workflow_id", type: "string", required: false, description: "Workflow identifier for correlation tracking" }
            ]
          },
          {
            name: "osa_contentrecs_topic",
            description: "Generate content recommendations based on topic analysis and fresh produce industry trends",
            version: "3.0.0",
            parameters: [
              { name: "topic_category", type: "string", required: false, description: "Content topic category to analyze" },
              { name: "content_format", type: "string", required: false, description: "Preferred content format" },
              { name: "seasonal_relevance", type: "boolean", required: false, description: "Include seasonal produce considerations" },
              { name: "workflow_id", type: "string", required: false, description: "Workflow identifier for correlation tracking" }
            ]
          },
          {
            name: "osa_cmp_send_strategy",
            description: "Send comprehensive marketing strategy recommendations to CMP with fresh produce campaign optimization",
            version: "3.0.0",
            parameters: [
              { name: "strategy_type", type: "string", required: false, description: "Type of marketing strategy" },
              { name: "campaign_scope", type: "string", required: false, description: "Campaign scope and reach" },
              { name: "include_seasonal_strategies", type: "boolean", required: false, description: "Include seasonal produce marketing strategies" },
              { name: "workflow_id", type: "string", required: false, description: "Workflow identifier for correlation tracking" }
            ]
          },
          {
            name: "osa_cmp_get_calendar",
            description: "Retrieve marketing calendar with seasonal fresh produce cycles and IFPA event integration",
            version: "3.0.0",
            parameters: [
              { name: "calendar_scope", type: "string", required: false, description: "Calendar timeframe and scope" },
              { name: "time_horizon", type: "string", required: false, description: "Planning time horizon" },
              { name: "include_seasonal_events", type: "boolean", required: false, description: "Include seasonal produce events" },
              { name: "workflow_id", type: "string", required: false, description: "Workflow identifier for correlation tracking" }
            ]
          },
          {
            name: "osa_canvas_audience",
            description: "Generate audience segmentation Canvas visualizations with IFPA member categorization",
            version: "3.0.0",
            parameters: [
              { name: "audience_scope", type: "string", required: false, description: "Audience segmentation scope" },
              { name: "visualization_style", type: "string", required: false, description: "Canvas visualization style" },
              { name: "include_industry_context", type: "boolean", required: false, description: "Include fresh produce industry context" },
              { name: "workflow_id", type: "string", required: false, description: "Workflow identifier for correlation tracking" }
            ]
          },
          {
            name: "osa_canvas_engagement",
            description: "Generate engagement pattern visualizations with Canvas-style charts for fresh produce analytics",
            version: "3.0.0",
            parameters: [
              { name: "visualization_type", type: "string", required: false, description: "Type of engagement visualization" },
              { name: "data_source", type: "string", required: false, description: "Engagement data source" },
              { name: "include_seasonal_overlays", type: "boolean", required: false, description: "Include seasonal engagement patterns" },
              { name: "workflow_id", type: "string", required: false, description: "Workflow identifier for correlation tracking" }
            ]
          },
          {
            name: "osa_canvas_behavioral",
            description: "Create behavioral pattern Canvas visualizations for member journey analysis and fresh produce professional workflows",
            version: "3.0.0",
            parameters: [
              { name: "pattern_type", type: "string", required: false, description: "Type of behavioral pattern" },
              { name: "analysis_depth", type: "string", required: false, description: "Depth of behavioral analysis" },
              { name: "include_member_segmentation", type: "boolean", required: false, description: "Include member segmentation analysis" },
              { name: "workflow_id", type: "string", required: false, description: "Workflow identifier for correlation tracking" }
            ]
          },
          {
            name: "osa_dxp_analyze_insights",
            description: "Analyze DXP behavioral insights and user engagement patterns with fresh produce industry context",
            version: "3.0.0",
            parameters: [
              { name: "analysis_scope", type: "string", required: false, description: "Scope of DXP analysis" },
              { name: "include_behavioral_analysis", type: "boolean", required: false, description: "Include behavioral pattern analysis" },
              { name: "include_engagement_insights", type: "boolean", required: false, description: "Include engagement insights" },
              { name: "workflow_id", type: "string", required: false, description: "Workflow identifier for correlation tracking" }
            ]
          },
          {
            name: "osa_dxp_behavioral_insights",
            description: "Generate behavioral pattern analysis from DXP data for fresh produce professional workflows",
            version: "3.0.0",
            parameters: [
              { name: "behavioral_scope", type: "string", required: false, description: "Scope of behavioral analysis" },
              { name: "analysis_period", type: "string", required: false, description: "Time period for analysis" },
              { name: "include_seasonal_patterns", type: "boolean", required: false, description: "Include seasonal behavioral patterns" },
              { name: "workflow_id", type: "string", required: false, description: "Workflow identifier for correlation tracking" }
            ]
          },
          {
            name: "osa_odp_audience_segments",
            description: "Retrieve and analyze ODP audience segments with IFPA member targeting and fresh produce context",
            version: "3.0.0",
            parameters: [
              { name: "segmentation_scope", type: "string", required: false, description: "Scope of audience segmentation" },
              { name: "include_performance_metrics", type: "boolean", required: false, description: "Include segment performance metrics" },
              { name: "segment_types", type: "list", required: false, description: "Types of segments to analyze" },
              { name: "workflow_id", type: "string", required: false, description: "Workflow identifier for correlation tracking" }
            ]
          },
          {
            name: "osa_odp_generate_segment",
            description: "Generate new audience segment profiles based on fresh produce industry criteria and member behavior",
            version: "3.0.0",
            parameters: [
              { name: "segment_criteria", type: "dictionary", required: false, description: "Criteria for segment generation" },
              { name: "target_audience_type", type: "string", required: false, description: "Target audience type" },
              { name: "include_seasonal_targeting", type: "boolean", required: false, description: "Include seasonal targeting criteria" },
              { name: "workflow_id", type: "string", required: false, description: "Workflow identifier for correlation tracking" }
            ]
          },
          {
            name: "osa_opal_send_to_osa",
            description: "Send OPAL execution results and data directly to OSA system for integration and processing",
            version: "3.0.0",
            parameters: [
              { name: "execution_data", type: "dictionary", required: true, description: "OPAL execution data to send" },
              { name: "target_system", type: "string", required: false, description: "Target OSA system component" },
              { name: "priority_level", type: "string", required: false, description: "Processing priority level" },
              { name: "workflow_id", type: "string", required: false, description: "Workflow identifier for correlation tracking" }
            ]
          },
          {
            name: "osa_opal_validate_data",
            description: "Validate OPAL execution data for consistency, completeness, and business rule compliance",
            version: "3.0.0",
            parameters: [
              { name: "validation_data", type: "dictionary", required: true, description: "Data to validate" },
              { name: "validation_rules", type: "list", required: false, description: "Specific validation rules to apply" },
              { name: "compliance_level", type: "string", required: false, description: "Level of compliance validation" },
              { name: "workflow_id", type: "string", required: false, description: "Workflow identifier for correlation tracking" }
            ]
          },
          {
            name: "osa_opal_store_workflow_data",
            description: "Store and persist OPAL workflow execution data with comprehensive metadata tracking",
            version: "3.0.0",
            parameters: [
              { name: "workflow_id", type: "string", required: true, description: "Unique workflow identifier" },
              { name: "agent_name", type: "string", required: true, description: "Name of the executing agent" },
              { name: "execution_data", type: "dictionary", required: true, description: "Workflow execution data" },
              { name: "storage_tier", type: "string", required: false, description: "Storage tier preference" }
            ]
          },
          {
            name: "osa_opal_workflow_context",
            description: "Retrieve comprehensive OPAL workflow context and execution state information",
            version: "3.0.0",
            parameters: [
              { name: "workflow_id", type: "string", required: true, description: "Unique workflow identifier" },
              { name: "context_scope", type: "string", required: false, description: "Scope of context to retrieve" },
              { name: "include_execution_history", type: "boolean", required: false, description: "Include execution history" }
            ]
          },
          {
            name: "osa_opal_final_results",
            description: "Compile comprehensive final results with executive summary, implementation roadmap, and fresh produce metrics",
            version: "3.0.0",
            parameters: [
              { name: "compilation_scope", type: "string", required: false, description: "Scope of results compilation" },
              { name: "include_executive_summary", type: "boolean", required: false, description: "Include executive summary" },
              { name: "include_implementation_roadmap", type: "boolean", required: false, description: "Include implementation roadmap" },
              { name: "include_performance_metrics", type: "boolean", required: false, description: "Include performance metrics" },
              { name: "workflow_id", type: "string", required: false, description: "Workflow identifier for correlation tracking" }
            ]
          }
      ];

      // Canonical OPAL Discovery Format (matches Optimizely ODP/CMS/Analytics format)
      discoveryData = {
        functions: toolsArray
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