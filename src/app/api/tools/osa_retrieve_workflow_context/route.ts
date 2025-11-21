/**
 * OPAL Integration Wrapper: osa_retrieve_workflow_context
 *
 * Purpose: Retrieves workflow context and agent execution data for OPAL agents
 *
 * Correlation ID Propagation:
 * - Format: opal-workflow-context-{timestamp}-{random7char}
 * - Must be included in ALL log statements for distributed tracing
 * - Forwarded in X-Correlation-ID response header for client debugging
 * - Used to track requests across the entire OPAL integration pipeline
 *
 * Performance Guidelines:
 * - Target response time: <50ms for mock data, <200ms for database queries
 * - Use graceful fallback to mock data when database is unavailable
 * - Include processing time in metadata for monitoring
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // MANDATORY: Generate correlation ID for distributed tracing across OPAL pipeline
  // Format follows CLAUDE.md standard: {service}-{timestamp}-{random}
  const correlationId = `opal-workflow-context-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  try {
    console.log("🔄 [OPAL Wrapper] osa_retrieve_workflow_context request received", { correlationId });

    const opalBody = await request.json();
    const { workflow_id, requesting_agent } = opalBody;

    if (!workflow_id || !requesting_agent) {
      return NextResponse.json({
        success: false,
        error: "Missing required parameters",
        _metadata: { correlation_id: correlationId, processing_time_ms: Date.now() - startTime, timestamp: new Date().toISOString() }
      }, { status: 400 });
    }

    const responseData = {
      success: true,
      workflow_context: {
        workflow_id,
        requesting_agent,
        workflow_execution: {
          session_id: `mock_session_${Date.now()}`,
          status: "in_progress",
          progress_percentage: 65,
          client_name: "FreshProduce.com",
          industry: "Fresh Produce & Agriculture"
        },
        agent_executions: [
          {
            agent_name: "content_review",
            execution_id: `exec_${Date.now()}_1`,
            status: "completed",
            agent_data: { content_analysis: { pages_analyzed: 47, content_quality_score: 0.78 } }
          }
        ]
      },
      _metadata: {
        data_source: "mock_workflow_context",
        processing_time_ms: Date.now() - startTime,
        correlation_id: correlationId,
        timestamp: new Date().toISOString()
      }
    };

    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        "X-Correlation-ID": correlationId,
        "X-Processing-Time": (Date.now() - startTime).toString(),
        "X-Data-Source": "mock_workflow_context"
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "Workflow context retrieval failed",
      _metadata: { correlation_id: correlationId, processing_time_ms: Date.now() - startTime, timestamp: new Date().toISOString() }
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    tool_id: "osa_retrieve_workflow_context",
    name: "Workflow Context Retrieval Tool",
    status: "healthy",
    timestamp: new Date().toISOString()
  });
}
