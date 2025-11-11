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
      parameters: {
        type: "object",
        properties: {
          agent_id: {
            type: "string",
            description: "ID of the agent storing data (content_review, geo_audit, etc.)"
          },
          agent_results: {
            type: "object",
            description: "Complete structured results from the agent execution"
          },
          workflow_id: {
            type: "string",
            description: "Unique identifier for the workflow execution"
          },
          execution_order: {
            type: "number",
            description: "Sequential order of agent execution (1-6)"
          },
          data_quality_score: {
            type: "number",
            description: "Quality score of the data (0.0-1.0)"
          }
        },
        required: ["agent_id", "agent_results", "workflow_id", "execution_order"]
      }
    },
    {
      name: "retrieve_workflow_context",
      description: "Retrieve accumulated workflow context data for current agent execution",
      parameters: {
        type: "object",
        properties: {
          workflow_id: {
            type: "string",
            description: "Unique identifier for the workflow execution"
          },
          requesting_agent: {
            type: "string",
            description: "ID of agent requesting context data"
          },
          include_agents: {
            type: "array",
            items: { type: "string" },
            description: "Specific agent IDs to include in context (empty = all previous)"
          }
        },
        required: ["workflow_id", "requesting_agent"]
      }
    },
    {
      name: "send_data_to_osa_webhook",
      description: "Send agent data and results to OSA application via webhook for real-time updates",
      parameters: {
        type: "object",
        properties: {
          agent_id: {
            type: "string",
            description: "ID of the agent sending data"
          },
          agent_data: {
            type: "object",
            description: "Agent execution results and insights"
          },
          workflow_id: {
            type: "string",
            description: "Unique workflow execution identifier"
          },
          execution_status: {
            type: "string",
            enum: ["in_progress", "completed", "failed", "partial"],
            description: "Current execution status"
          },
          progress_percentage: {
            type: "number",
            minimum: 0,
            maximum: 100,
            description: "Workflow completion percentage"
          }
        },
        required: ["agent_id", "agent_data", "workflow_id", "execution_status"]
      }
    },
    {
      name: "validate_workflow_data",
      description: "Validate workflow data quality and completeness before agent execution",
      parameters: {
        type: "object",
        properties: {
          workflow_id: {
            type: "string",
            description: "Workflow execution identifier"
          },
          validation_criteria: {
            type: "object",
            description: "Criteria for data quality validation"
          },
          minimum_quality_score: {
            type: "number",
            minimum: 0.0,
            maximum: 1.0,
            description: "Minimum acceptable quality score"
          }
        },
        required: ["workflow_id"]
      }
    },
    {
      name: "compile_final_results",
      description: "Compile all workflow agent results into comprehensive strategy brief for final delivery",
      parameters: {
        type: "object",
        properties: {
          workflow_id: {
            type: "string",
            description: "Workflow execution identifier"
          },
          compilation_format: {
            type: "string",
            enum: ["executive_summary", "detailed_brief", "comprehensive"],
            default: "comprehensive",
            description: "Output format for compiled results"
          },
          include_quality_metrics: {
            type: "boolean",
            default: true,
            description: "Include data quality and validation metrics"
          }
        },
        required: ["workflow_id"]
      }
    }
  ]
};

export async function GET() {
  try {
    console.log('📋 [Workflow Data Tools] Discovery endpoint called');

    return NextResponse.json({
      ...WORKFLOW_DATA_TOOLS_CONFIG,
      timestamp: new Date().toISOString(),
      status: "ready",
      authentication: {
        type: "bearer",
        required: true
      },
      endpoints: {
        discovery: "https://opal-2025.vercel.app/api/tools/workflow-data/discovery",
        execution: "https://opal-2025.vercel.app/api/tools/workflow-data/execute"
      }
    });
  } catch (error) {
    console.error('❌ [Workflow Data Tools] Discovery failed:', error);
    return NextResponse.json({
      error: 'Workflow Data Tools discovery failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}