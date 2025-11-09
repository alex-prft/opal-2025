import { NextRequest, NextResponse } from 'next/server';

/**
 * OPAL Tool Health Check Endpoint
 * Provides tool availability and status for OPAL registry
 */

const TOOL_MAPPINGS = {
  'workflow': 'OSA Workflow Data Sharing',
  'odp': 'OSA Optimizely Data Platform Tools',
  'contentrecs': 'OSA Content Recommendations Tools',
  'webx': 'OSA Web Experimentation Tools',
  'cmp': 'OSA Campaign Management Tools',
  'cmspaas': 'OSA Content Management Tools'
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tool: string }> }
) {
  let tool: string = '';

  try {
    const resolvedParams = await params;
    tool = resolvedParams.tool;

    // Validate tool parameter
    if (!TOOL_MAPPINGS[tool as keyof typeof TOOL_MAPPINGS]) {
      return NextResponse.json(
        {
          status: 'error',
          error: `Unknown tool: ${tool}`,
          available_tools: Object.keys(TOOL_MAPPINGS)
        },
        { status: 404 }
      );
    }

    // Check tool health
    const toolName = TOOL_MAPPINGS[tool as keyof typeof TOOL_MAPPINGS];

    const healthStatus = {
      tool_id: tool,
      tool_name: toolName,
      status: 'healthy',
      availability: 'online',
      last_check: new Date().toISOString(),
      version: '1.0.0',
      endpoints: {
        discovery: `${process.env.NEXT_PUBLIC_BASE_URL}/api/tools/${tool}/discovery`,
        execution: `${process.env.NEXT_PUBLIC_BASE_URL}/api/tools/${tool}/execute`,
        health: `${process.env.NEXT_PUBLIC_BASE_URL}/api/tools/${tool}/health`
      },
      osa_integration: {
        webhook_endpoints: {
          agent_data: `${process.env.NEXT_PUBLIC_BASE_URL}/api/opal/agent-data`,
          workflow_results: `${process.env.NEXT_PUBLIC_BASE_URL}/api/opal/workflow-results`
        },
        status: 'connected'
      }
    };

    return NextResponse.json(healthStatus, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });

  } catch (error) {
    console.error(`Tool health check error for ${tool}:`, error);
    return NextResponse.json(
      {
        status: 'error',
        error: 'Failed to check tool health',
        message: error instanceof Error ? error.message : 'Unknown error',
        tool: tool,
        last_check: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}