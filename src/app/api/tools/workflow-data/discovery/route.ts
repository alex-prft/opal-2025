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
      name: "osa_store_workflow_data",
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
      endpoint: "/tools/osa_store_workflow_data",
      http_method: "POST"
    },
    {
      name: "osa_retrieve_workflow_context",
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
      endpoint: "/tools/osa_retrieve_workflow_context",
      http_method: "POST"
    },
    {
      name: "osa_send_data_to_osa_webhook",
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
      endpoint: "/tools/osa_send_data_to_osa_webhook",
      http_method: "POST"
    },
    {
      name: "osa_validate_workflow_data",
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
      endpoint: "/tools/osa_validate_workflow_data",
      http_method: "POST"
    },
    {
      name: "osa_compile_final_results",
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
      endpoint: "/tools/osa_compile_final_results",
      http_method: "POST"
    },
    {
      name: "osa_track_strategy_progress",
      description: "Monitor strategy implementation progress across phases with milestone tracking and confidence scoring",
      parameters: [
        {
          name: "phase_data",
          type: "object",
          description: "Implementation phase progress and completion metrics",
          required: true
        }
      ],
      endpoint: "/tools/osa_track_strategy_progress",
      http_method: "POST"
    },
    {
      name: "osa_validate_maturity_level",
      description: "Assess organizational personalization maturity and readiness for advanced strategies",
      parameters: [
        {
          name: "maturity_indicators",
          type: "object",
          description: "Technical, content, and organizational maturity metrics",
          required: true
        }
      ],
      endpoint: "/tools/osa_validate_maturity_level",
      http_method: "POST"
    },
    {
      name: "osa_generate_roadmap_insights",
      description: "Create strategic roadmap with timeline, priorities, and implementation guidance",
      parameters: [
        {
          name: "timeline_data",
          type: "object",
          description: "Implementation timeline with phases and dependencies",
          required: true
        },
        {
          name: "priority_analysis",
          type: "object",
          description: "Priority scoring and rationale for initiatives",
          required: true
        }
      ],
      endpoint: "/tools/osa_generate_roadmap_insights",
      http_method: "POST"
    },
    {
      name: "osa_monitor_workflow_health",
      description: "Monitor real-time workflow execution health with performance metrics and alerts",
      parameters: [
        {
          name: "health_metrics",
          type: "object",
          description: "Real-time workflow health indicators and performance data",
          required: true
        }
      ],
      endpoint: "/tools/osa_monitor_workflow_health",
      http_method: "POST"
    },
    {
      name: "osa_track_agent_performance",
      description: "Track individual OPAL agent performance metrics and optimization opportunities",
      parameters: [
        {
          name: "agent_metrics",
          type: "object",
          description: "Performance metrics for individual agents",
          required: true
        }
      ],
      endpoint: "/tools/osa_track_agent_performance",
      http_method: "POST"
    },
    {
      name: "osa_analyze_data_insights",
      description: "Analyze aggregated workflow data to generate strategic insights and recommendations",
      parameters: [
        {
          name: "analytics_scope",
          type: "object",
          description: "Scope and parameters for data analysis",
          required: true
        },
        {
          name: "insight_categories",
          type: "array",
          description: "Categories of insights to generate (content, audience, technical, etc.)",
          required: true
        }
      ],
      endpoint: "/tools/osa_analyze_data_insights",
      http_method: "POST"
    },
    {
      name: "osa_calculate_impact_metrics",
      description: "Calculate business impact metrics and performance improvements from personalization strategies",
      parameters: [
        {
          name: "impact_categories",
          type: "array",
          description: "Categories of impact to measure (engagement, conversion, performance, etc.)",
          required: true
        },
        {
          name: "baseline_data",
          type: "object",
          description: "Baseline metrics for comparison",
          required: true
        }
      ],
      endpoint: "/tools/osa_calculate_impact_metrics",
      http_method: "POST"
    },
    {
      name: "osa_generate_content_insights",
      description: "Generate insights about content performance, gaps, and optimization opportunities across topics",
      parameters: [
        {
          name: "content_analysis",
          type: "object",
          description: "Content performance and topic analysis data",
          required: true
        }
      ],
      endpoint: "/tools/osa_generate_content_insights",
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