/**
 * OSA - Workflow Data Sharing Tools Discovery Endpoint
 * Core workflow data sharing and communication tools for OSA personalization strategy agents
 */

import { NextRequest, NextResponse } from 'next/server';

const WORKFLOW_DATA_TOOLS_CONFIG = {
  name: "OSA Workflow Data Sharing Tools",
  description: "Core workflow data sharing and communication tools for OSA personalization strategy agents",
  version: "1.0.0",
  registry_id: "osa_workflow_data_tools",

  discovery_url: "https://opal-2025.vercel.app/api/tools/workflow-data/discovery",

  functions: [
    {
      name: "store_workflow_data",
      description: "Store agent results in shared workflow context for use by subsequent agents",
      parameters: [
        {
          name: "agent_id",
          type: "string",
          description: "ID of the agent storing data (content_review, geo_audit, etc.)",
          required: true
        },
        {
          name: "agent_results",
          type: "object",
          description: "Complete structured results from the agent execution",
          required: true
        },
        {
          name: "workflow_id",
          type: "string",
          description: "Unique identifier for the workflow execution",
          required: true
        },
        {
          name: "execution_order",
          type: "number",
          description: "Sequential order of agent execution (1-6)",
          required: true
        },
        {
          name: "data_quality_score",
          type: "number",
          description: "Quality score of the data (0.0-1.0)",
          required: false
        }
      ],
      endpoint: "/tools/store_workflow_data",
      http_method: "POST"
    },
    {
      name: "retrieve_workflow_context",
      description: "Retrieve accumulated workflow context data for current agent execution",
      parameters: [
        {
          name: "workflow_id",
          type: "string",
          description: "Unique identifier for the workflow execution",
          required: true
        },
        {
          name: "requesting_agent",
          type: "string",
          description: "ID of agent requesting context data",
          required: true
        },
        {
          name: "include_agents",
          type: "array",
          description: "Specific agent IDs to include in context (empty = all previous)",
          required: false
        }
      ],
      endpoint: "/tools/retrieve_workflow_context",
      http_method: "POST"
    },
    {
      name: "send_data_to_osa_webhook",
      description: "Send agent data and results to OSA application via webhook for real-time updates",
      parameters: [
        {
          name: "agent_id",
          type: "string",
          description: "ID of the agent sending data",
          required: true
        },
        {
          name: "agent_data",
          type: "object",
          description: "Agent execution results and insights",
          required: true
        },
        {
          name: "workflow_id",
          type: "string",
          description: "Unique workflow execution identifier",
          required: true
        },
        {
          name: "execution_status",
          type: "string",
          description: "Current execution status (in_progress, completed, failed, partial)",
          required: true
        },
        {
          name: "progress_percentage",
          type: "number",
          description: "Workflow completion percentage (0-100)",
          required: false
        }
      ],
      endpoint: "/tools/send_data_to_osa_webhook",
      http_method: "POST"
    },
    {
      name: "validate_workflow_data",
      description: "Validate workflow data quality and completeness before agent execution",
      parameters: [
        {
          name: "workflow_id",
          type: "string",
          description: "Workflow execution identifier",
          required: true
        },
        {
          name: "validation_criteria",
          type: "object",
          description: "Criteria for data quality validation",
          required: false
        },
        {
          name: "minimum_quality_score",
          type: "number",
          description: "Minimum acceptable quality score (0.0-1.0)",
          required: false
        }
      ],
      endpoint: "/tools/validate_workflow_data",
      http_method: "POST"
    },
    {
      name: "compile_final_results",
      description: "Compile all workflow agent results into comprehensive strategy brief for final delivery",
      parameters: [
        {
          name: "workflow_id",
          type: "string",
          description: "Workflow execution identifier",
          required: true
        },
        {
          name: "compilation_format",
          type: "string",
          description: "Output format for compiled results (executive_summary, detailed_brief, comprehensive)",
          required: false
        },
        {
          name: "include_quality_metrics",
          type: "boolean",
          description: "Include data quality and validation metrics",
          required: false
        }
      ],
      endpoint: "/tools/compile_final_results",
      http_method: "POST"
    }
  ]
};

export async function GET() {
  try {
    console.log('📋 [Workflow Data Tools] Discovery endpoint called');

    // Return OPAL-compatible format with functions at root level
    return NextResponse.json({
      functions: WORKFLOW_DATA_TOOLS_CONFIG.functions
    });
  } catch (error) {
    console.error('❌ [Workflow Data Tools] Discovery failed:', error);
    return NextResponse.json({
      error: 'Workflow Data Tools discovery failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}