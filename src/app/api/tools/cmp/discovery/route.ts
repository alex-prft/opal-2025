/**
 * OSA - CMP Integration Tools Discovery Endpoint
 * Campaign Management Platform integration tools for strategy compilation and campaign creation
 */

import { NextRequest, NextResponse } from 'next/server';

const CMP_TOOLS_CONFIG = {
  name: "OSA - CMP Integration Tools",
  description: "Campaign Management Platform integration tools for strategy compilation, campaign creation, and executive deliverable generation in OSA workflows",
  version: "1.0.0",
  registry_id: "osa_cmp_tools",

  discovery_url: "https://opal-2025.vercel.app/api/tools/cmp/discovery",

  functions: [
    {
      name: "osa_compile_strategy_brief",
      description: "Compile comprehensive personalization strategy brief from all workflow agent results",
      parameters: [
        {
          name: "workflow_results",
          type: "object",
          description: "Complete workflow results from all agents",
          required: true
        },
        {
          name: "compilation_format",
          type: "string",
          description: "Level of detail for strategy brief (executive_summary, detailed_brief, comprehensive)",
          required: false
        },
        {
          name: "target_audience",
          type: "string",
          description: "Target audience for the brief formatting (technical_team, business_stakeholders, executive_leadership)",
          required: false
        }
      ],
      endpoint: "/tools/compile_strategy_brief",
      http_method: "POST"
    },
    {
      name: "osa_generate_executive_summary",
      description: "Create executive-ready summary with key recommendations and business impact projections",
      parameters: [
        {
          name: "strategy_insights",
          type: "object",
          description: "Key insights from complete strategy analysis",
          required: true
        },
        {
          name: "business_impact_projections",
          type: "object",
          description: "Business impact projections and ROI estimates",
          required: false
        },
        {
          name: "priority_recommendations",
          type: "array",
          description: "Top priority recommendations for executive attention",
          required: true
        }
      ],
      endpoint: "/tools/generate_executive_summary",
      http_method: "POST"
    },
    {
      name: "osa_create_campaign_specifications",
      description: "Generate detailed campaign specifications ready for CMP platform implementation",
      parameters: [
        {
          name: "personalization_ideas",
          type: "array",
          description: "Personalization ideas to convert into campaigns",
          required: true
        },
        {
          name: "audience_segments",
          type: "array",
          description: "Audience segments for campaign targeting",
          required: true
        },
        {
          name: "campaign_objectives",
          type: "array",
          description: "Primary campaign objectives (awareness, engagement, conversion, retention, cross_sell, upsell)",
          required: true
        }
      ],
      endpoint: "/tools/create_campaign_specifications",
      http_method: "POST"
    },
    {
      name: "osa_format_cmp_deliverables",
      description: "Format campaign specifications for direct import into CMP platforms",
      parameters: [
        {
          name: "campaign_specifications",
          type: "array",
          description: "Campaign specifications to format",
          required: true
        },
        {
          name: "cmp_platform_type",
          type: "string",
          description: "Target CMP platform for formatting (optimizely_web, optimizely_feature, adobe_target, google_optimize, generic_json)",
          required: true
        },
        {
          name: "export_format",
          type: "string",
          description: "Export format for CMP platform (api_payload, csv_import, json_config, xml_export)",
          required: false
        }
      ],
      endpoint: "/tools/format_cmp_deliverables",
      http_method: "POST"
    }
  ]
};

export async function GET() {
  try {
    console.log('📋 [CMP Tools] Discovery endpoint called');

    // Return OPAL-compatible format with functions at root level
    return NextResponse.json({
      functions: CMP_TOOLS_CONFIG.functions
    });
  } catch (error) {
    console.error('❌ [CMP Tools] Discovery failed:', error);
    return NextResponse.json({
      error: 'CMP Tools discovery failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}