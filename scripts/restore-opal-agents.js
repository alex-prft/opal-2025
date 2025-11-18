#!/usr/bin/env node

/**
 * Script to restore all OPAL agents with correct optimized configurations
 * This ensures all 9 agents have proper JSON output, language rules, and tier-specific metrics
 */

const fs = require('fs');
const path = require('path');

const AGENTS_DIR = path.join(__dirname, '../opal-config/opal-agents');

// Complete agent configurations with all required components
const AGENT_CONFIGS = {
  'audience_suggester.json': {
    name: "Audience Suggester Agent",
    agent_id: "audience_suggester",
    tier: 'insights',
    creativity: 0.4,
    internal_version: 8,
    parameters: [
      {
        "name": "kpi_target",
        "type": "string",
        "default": null,
        "required": false,
        "description": "Primary KPI to optimize audience segments for"
      },
      {
        "name": "channel_focus",
        "type": "string",
        "default": null,
        "required": false,
        "description": "Primary channel for personalization implementation"
      },
      {
        "name": "segment_count",
        "type": "string",
        "default": null,
        "required": false,
        "description": "Target number of audience segments to create"
      }
    ],
    description: "Generates high-value audience segments for personalization based on ODP traits, Salesforce data, and content/technical analysis. Creates actionable segments with clear personalization opportunities.",
    enabled_tools: [
      "osa_validate_language_rules",
      "osa_fetch_audience_segments",
      "osa_analyze_member_behavior",
      "osa_calculate_segment_statistical_power",
      "osa_create_dynamic_segments",
      "osa_analyze_data_insights",
      "osa_retrieve_workflow_context",
      "osa_send_data_to_osa_webhook",
      "osa_store_workflow_data",
      "osa_generate_performance_baseline",
      "osa_compile_final_results",
      "osa_validate_workflow_data",
      "osa_audit_content_structure",
      "osa_analyze_website_content",
      "osa_design_experiments"
    ],
    metrics: [
      {"label": "Recommended Segments", "value": "8 segments", "hint": "High-value audience opportunities identified from behavioral analysis"},
      {"label": "Total Addressable Members", "value": "125K+", "hint": "Combined segment reach potential across all recommendations"},
      {"label": "Segmentation Confidence", "value": "72/100", "hint": "Based on behavioral and profile data quality and completeness"}
    ],
    role: "You are an audience segmentation strategist specializing in member engagement and behavioral analytics.",
    objective: "Generate [[segment_count]] high-value audience segments for personalization optimization targeting [[kpi_target]] via [[channel_focus]] channel using ODP behavioral data and member profiles."
  },

  'cmp_organizer.json': {
    name: "CMP Organizer Agent",
    agent_id: "cmp_organizer",
    tier: 'dxptools',
    creativity: 0.3,
    internal_version: 5,
    parameters: [
      {
        "name": "deliverable_format",
        "type": "string",
        "default": null,
        "required": false,
        "description": "Format for strategy brief deliverable"
      },
      {
        "name": "presentation_format",
        "type": "string",
        "default": null,
        "required": false,
        "description": "Presentation style for stakeholder communication"
      },
      {
        "name": "cmp_integration_level",
        "type": "string",
        "default": null,
        "required": false,
        "description": "Level of CMP platform integration required"
      }
    ],
    description: "Organizes comprehensive personalization strategy into stakeholder-ready CMP strategy briefs with executive summaries, implementation roadmaps, and campaign specifications for Optimizely CMP platform deployment.",
    enabled_tools: [
      "osa_validate_language_rules",
      "osa_compile_strategy_brief",
      "osa_generate_executive_summary",
      "osa_compile_final_results",
      "osa_retrieve_workflow_context",
      "osa_send_data_to_osa_webhook",
      "osa_store_workflow_data",
      "osa_validate_workflow_data",
      "create_canvas",
      "osa_generate_performance_baseline"
    ],
    metrics: [
      {"label": "Campaign Specifications", "value": "12 campaigns", "hint": "CMP-ready implementations identified and documented"},
      {"label": "Strategy Brief Completeness", "value": "95%", "hint": "Comprehensive deliverable coverage across all strategic areas"},
      {"label": "Implementation Readiness", "value": "High", "hint": "Dependencies and requirements validation status"}
    ],
    role: "You are a strategic campaign organizer specializing in CMP platform implementation and stakeholder communication.",
    objective: "Organize comprehensive personalization strategy into [[deliverable_format]] [[presentation_format]] deliverables with [[cmp_integration_level]] CMP integration."
  },

  'content_review.json': {
    name: "Content Review Agent",
    agent_id: "content_review",
    tier: 'insights',
    creativity: 0.3,
    internal_version: 8,
    parameters: [
      {
        "name": "website_url",
        "type": "string",
        "default": null,
        "required": false,
        "description": "Target website URL for content analysis"
      },
      {
        "name": "analysis_depth",
        "type": "string",
        "default": null,
        "required": false,
        "description": "Depth of content analysis to perform"
      }
    ],
    description: "Analyzes website content to identify optimization opportunities, content gaps, and personalization potential. Provides foundational insights for audience segmentation and strategy development.",
    enabled_tools: [
      "osa_validate_language_rules",
      "osa_audit_content_structure",
      "osa_generate_content_templates",
      "osa_measure_content_performance",
      "osa_optimize_existing_content",
      "identify_personalization_opportunities",
      "osa_analyze_website_content",
      "osa_generate_content_insights",
      "osa_retrieve_workflow_context",
      "osa_send_data_to_osa_webhook",
      "osa_store_workflow_data",
      "create_canvas",
      "osa_validate_workflow_data",
      "osa_analyze_member_behavior",
      "osa_fetch_audience_segments",
      "osa_compile_final_results"
    ],
    metrics: [
      {"label": "Content Quality Score", "value": "72/100", "hint": "Overall content effectiveness based on SEO, structure, and member relevance"},
      {"label": "Personalization Opportunities", "value": "18 identified", "hint": "High-impact content customization candidates across member segments"},
      {"label": "SEO Readiness", "value": "65%", "hint": "Technical and content optimization level for search performance"}
    ],
    role: "You are a content strategy expert specializing in content optimization and personalization potential analysis.",
    objective: "Perform comprehensive content analysis of [[website_url]] to identify optimization opportunities, content gaps, and personalization potential with [[analysis_depth]] depth."
  },

  'customer_journey.json': {
    name: "Customer Journey Agent",
    agent_id: "customer_journey",
    tier: 'insights',
    creativity: 0.4,
    internal_version: 6,
    parameters: [
      {
        "name": "journey_scope",
        "type": "string",
        "default": null,
        "required": false,
        "description": "Scope of customer journey analysis (full lifecycle, specific stages, etc.)"
      },
      {
        "name": "analysis_depth",
        "type": "string",
        "default": null,
        "required": false,
        "description": "Level of journey analysis detail"
      }
    ],
    description: "Analyzes customer journey patterns, identifies drop-off points and friction areas, and provides experience optimization recommendations with cross-channel insights and persona-specific journey variations.",
    enabled_tools: [
      "osa_validate_language_rules",
      "osa_analyze_member_behavior",
      "osa_fetch_audience_segments",
      "osa_analyze_data_insights",
      "osa_audit_content_structure",
      "osa_generate_content_insights",
      "osa_retrieve_workflow_context",
      "osa_send_data_to_osa_webhook",
      "osa_store_workflow_data",
      "osa_validate_workflow_data",
      "create_canvas",
      "osa_compile_final_results"
    ],
    metrics: [
      {"label": "Journey Stages Analyzed", "value": "6 stages", "hint": "Complete lifecycle mapping from awareness through advocacy"},
      {"label": "Drop-off Points Identified", "value": "8 friction areas", "hint": "Critical optimization opportunities discovered through behavioral analysis"},
      {"label": "Cross-Channel Insights", "value": "12 touchpoints", "hint": "Multi-device and channel behavior patterns documented"}
    ],
    role: "You are a customer journey analyst specializing in experience optimization and friction point identification.",
    objective: "Analyze customer journey patterns across [[journey_scope]] to identify optimization opportunities and experience gaps with [[analysis_depth]] depth."
  },

  'experiment_blueprinter.json': {
    name: "Experiment Blueprinter Agent",
    agent_id: "experiment_blueprinter",
    tier: 'optimization',
    creativity: 0.5,
    internal_version: 7,
    parameters: [
      {
        "name": "confidence_level",
        "type": "string",
        "default": null,
        "required": false,
        "description": "Statistical confidence level for experiment design"
      },
      {
        "name": "minimum_detectable_effect",
        "type": "string",
        "default": null,
        "required": false,
        "description": "Minimum effect size to detect in experiments"
      },
      {
        "name": "experiment_budget",
        "type": "string",
        "default": null,
        "required": false,
        "description": "Budget constraints for experiment portfolio"
      },
      {
        "name": "testing_timeframe",
        "type": "string",
        "default": null,
        "required": false,
        "description": "Timeline for experiment execution"
      }
    ],
    description: "Converts personalization ideas into rigorous experiment specifications with statistical power analysis, hypothesis frameworks, and implementation blueprints for A/B testing and multivariate optimization.",
    enabled_tools: [
      "osa_validate_language_rules",
      "osa_design_experiments",
      "osa_calculate_segment_statistical_power",
      "osa_generate_performance_baseline",
      "osa_analyze_data_insights",
      "osa_retrieve_workflow_context",
      "osa_send_data_to_osa_webhook",
      "osa_store_workflow_data",
      "osa_validate_workflow_data",
      "create_canvas",
      "osa_compile_final_results"
    ],
    metrics: [
      {"label": "Experiment Specifications", "value": "15 tests", "hint": "Statistically rigorous A/B test designs ready for implementation"},
      {"label": "Testing Portfolio Value", "value": "High impact", "hint": "Expected performance optimization potential across all experiments"},
      {"label": "Statistical Confidence", "value": "95%", "hint": "Confidence level ensuring reliable and actionable results"}
    ],
    role: "You are an experimentation specialist focused on converting personalization ideas into statistically rigorous A/B test specifications.",
    objective: "Convert personalization ideas into statistically rigorous experiment specifications with [[confidence_level]] confidence level and [[minimum_detectable_effect]] minimum detectable effect."
  },

  'geo_audit.json': {
    name: "Geographic Audit Agent",
    agent_id: "geo_audit",
    tier: 'insights',
    creativity: 0.3,
    internal_version: 4,
    parameters: [
      {
        "name": "regional_scope",
        "type": "string",
        "default": null,
        "required": false,
        "description": "Geographic regions to analyze"
      },
      {
        "name": "analysis_depth",
        "type": "string",
        "default": null,
        "required": false,
        "description": "Level of regional performance analysis"
      }
    ],
    description: "Analyzes geographic performance patterns, identifies regional optimization opportunities, and provides location-based personalization recommendations for member engagement enhancement.",
    enabled_tools: [
      "osa_validate_language_rules",
      "osa_analyze_member_behavior",
      "osa_fetch_audience_segments",
      "osa_analyze_data_insights",
      "osa_create_dynamic_segments",
      "osa_retrieve_workflow_context",
      "osa_send_data_to_osa_webhook",
      "osa_store_workflow_data",
      "osa_validate_workflow_data",
      "osa_compile_final_results"
    ],
    metrics: [
      {"label": "Geographic Segments Analyzed", "value": "24 regions", "hint": "Regional performance and opportunity mapping completed"},
      {"label": "High-Value Regions", "value": "8 identified", "hint": "Geographic areas with significant optimization potential"},
      {"label": "Regional Performance Gap", "value": "35%", "hint": "Performance variation across regions indicating opportunity"}
    ],
    role: "You are a geographic performance analyst specializing in regional member engagement and location-based optimization strategies.",
    objective: "Analyze geographic performance patterns across [[regional_scope]] with [[analysis_depth]] analysis to identify regional optimization opportunities and location-based personalization recommendations."
  },

  'integration_health.json': {
    name: "Integration Health Agent",
    agent_id: "integration_health",
    tier: 'dxptools',
    creativity: 0.2,
    internal_version: 6,
    parameters: [
      {
        "name": "assessment_scope",
        "type": "string",
        "default": null,
        "required": false,
        "description": "Scope of integration health assessment"
      },
      {
        "name": "monitoring_depth",
        "type": "string",
        "default": null,
        "required": false,
        "description": "Level of monitoring and analysis detail"
      },
      {
        "name": "performance_window",
        "type": "string",
        "default": null,
        "required": false,
        "description": "Time window for performance analysis"
      },
      {
        "name": "alert_threshold_availability",
        "type": "string",
        "default": null,
        "required": false,
        "description": "Availability threshold for health alerts"
      }
    ],
    description: "Monitors DXP integration health, API connectivity, and system performance across Optimizely platforms. Provides technical readiness assessment and integration status reporting for strategic initiative support.",
    enabled_tools: [
      "osa_validate_language_rules",
      "osa_evaluate_technical_constraints",
      "osa_generate_performance_baseline",
      "osa_analyze_data_insights",
      "osa_retrieve_workflow_context",
      "osa_send_data_to_osa_webhook",
      "osa_store_workflow_data",
      "osa_validate_workflow_data",
      "osa_compile_final_results"
    ],
    metrics: [
      {"label": "Overall Health Score", "value": "87/100", "hint": "Comprehensive DXP tool and integration health assessment"},
      {"label": "System Availability", "value": "99.2%", "hint": "Platform uptime over performance window"},
      {"label": "Integration Issues", "value": "2 active", "hint": "Current issues requiring immediate attention"}
    ],
    role: "You are an integration health specialist focused on DXP platform monitoring and technical readiness assessment.",
    objective: "Monitor DXP tool health and integration status across [[assessment_scope]] with [[monitoring_depth]] monitoring over [[performance_window]]-day window."
  },

  'personalization_idea_generator.json': {
    name: "Personalization Idea Generator Agent",
    agent_id: "personalization_idea_generator",
    tier: 'optimization',
    creativity: 0.6,
    internal_version: 7,
    parameters: [
      {
        "name": "focus_areas",
        "type": "string",
        "default": null,
        "required": false,
        "description": "Primary areas for personalization idea generation"
      },
      {
        "name": "priority_kpis",
        "type": "string",
        "default": null,
        "required": false,
        "description": "Key performance indicators to optimize"
      },
      {
        "name": "personalization_maturity",
        "type": "string",
        "default": null,
        "required": false,
        "description": "Current personalization maturity level"
      },
      {
        "name": "implementation_timeline",
        "type": "string",
        "default": null,
        "required": false,
        "description": "Timeline for personalization implementation"
      }
    ],
    description: "Generates strategic personalization ideas across content, product, and navigation experiences. Creates implementation-ready concepts with technical feasibility assessment and expected impact analysis.",
    enabled_tools: [
      "osa_validate_language_rules",
      "osa_analyze_member_behavior",
      "osa_fetch_audience_segments",
      "identify_personalization_opportunities",
      "osa_generate_content_insights",
      "osa_analyze_data_insights",
      "osa_retrieve_workflow_context",
      "osa_send_data_to_osa_webhook",
      "osa_store_workflow_data",
      "osa_validate_workflow_data",
      "create_canvas",
      "osa_compile_final_results"
    ],
    metrics: [
      {"label": "Personalization Ideas", "value": "22 concepts", "hint": "Strategic audience-specific experience opportunities identified"},
      {"label": "Implementation Complexity", "value": "Crawl-Walk range", "hint": "Aligned with current maturity capabilities and timeline"},
      {"label": "Expected Impact Score", "value": "High", "hint": "Based on segment size, behavior analysis, and KPI alignment"}
    ],
    role: "You are a personalization strategist specializing in generating strategic, actionable personalization concepts for audience-specific experiences.",
    objective: "Generate strategic personalization ideas for [[focus_areas]] tailored to audience segments, aligned with [[priority_kpis]] optimization and [[personalization_maturity]] capabilities."
  },

  'roadmap_generator.json': {
    name: "Roadmap Generator Agent",
    agent_id: "roadmap_generator",
    tier: 'strategy',
    creativity: 0.4,
    internal_version: 5,
    parameters: [
      {
        "name": "timeline_horizon",
        "type": "string",
        "default": null,
        "required": false,
        "description": "Strategic planning timeline in months"
      },
      {
        "name": "resource_constraints",
        "type": "string",
        "default": null,
        "required": false,
        "description": "Resource availability for roadmap implementation"
      },
      {
        "name": "priority_framework",
        "type": "string",
        "default": null,
        "required": false,
        "description": "Methodology for prioritizing roadmap initiatives"
      },
      {
        "name": "milestone_granularity",
        "type": "string",
        "default": null,
        "required": false,
        "description": "Frequency of major milestone tracking"
      }
    ],
    description: "Converts strategic insights and recommendations into comprehensive implementation roadmaps with timeline visualization, milestone tracking, resource allocation planning, and dependency management for OSA strategy execution.",
    enabled_tools: [
      "osa_validate_language_rules",
      "osa_analyze_member_behavior",
      "osa_create_dynamic_segments",
      "osa_evaluate_technical_constraints",
      "osa_generate_performance_baseline",
      "osa_compile_final_results",
      "osa_retrieve_workflow_context",
      "osa_send_data_to_osa_webhook",
      "osa_store_workflow_data",
      "osa_validate_workflow_data",
      "create_canvas",
      "osa_calculate_impact_metrics",
      "osa_generate_roadmap_insights",
      "osa_track_strategy_progress",
      "osa_validate_maturity_level",
      "osa_compile_strategy_brief",
      "osa_generate_executive_summary",
      "osa_fetch_audience_segments"
    ],
    metrics: [
      {"label": "Overall Progress", "value": "25%", "hint": "Foundation phase completion status"},
      {"label": "Timeline Confidence", "value": "60%", "hint": "Schedule adherence tracking based on milestone data"},
      {"label": "Plan Confidence Index", "value": "35/100", "hint": "Confidence level building as data flows in"}
    ],
    role: "You are a strategic planning specialist focused on converting insights into actionable implementation roadmaps.",
    objective: "Transform strategic insights and recommendations into comprehensive implementation roadmaps with [[timeline_horizon]]-month horizon, [[resource_constraints]] resource constraints, using [[priority_framework]] prioritization within [[milestone_granularity]] milestone tracking."
  }
};

// Universal JSON schema for all agents
const JSON_SCHEMA = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "hero": {
      "type": "object",
      "required": ["title", "promise", "metrics", "confidence"],
      "properties": {
        "title": { "type": "string" },
        "promise": { "type": "string", "maxLength": 200 },
        "metrics": {
          "type": "array",
          "minItems": 3,
          "maxItems": 3,
          "items": {
            "type": "object",
            "properties": {
              "label": { "type": "string" },
              "value": { "type": "string" },
              "hint": { "type": "string" }
            },
            "required": ["label", "value"]
          }
        },
        "confidence": { "type": "number", "minimum": 0, "maximum": 100 },
        "confidenceNote": { "type": "string" }
      }
    },
    "overview": {
      "type": "object",
      "required": ["summary", "keyPoints"],
      "properties": {
        "summary": { "type": "string" },
        "keyPoints": {
          "type": "array",
          "minItems": 2,
          "maxItems": 4,
          "items": { "type": "string" }
        }
      }
    },
    "insights": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "properties": {
          "title": { "type": "string" },
          "description": { "type": "string" },
          "bullets": {
            "type": "array",
            "items": { "type": "string" }
          }
        },
        "required": ["title", "description", "bullets"]
      }
    },
    "opportunities": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "properties": {
          "label": { "type": "string" },
          "impactLevel": { "enum": ["High", "Medium", "Low"] },
          "effortLevel": { "enum": ["Low", "Medium", "High"] },
          "confidence": { "type": "number", "minimum": 0, "maximum": 100 }
        },
        "required": ["label", "impactLevel", "effortLevel", "confidence"]
      }
    },
    "nextSteps": {
      "type": "array",
      "minItems": 2,
      "items": {
        "type": "object",
        "properties": {
          "label": { "type": "string" },
          "ownerHint": { "type": "string" },
          "timeframeHint": { "type": "string" }
        },
        "required": ["label"]
      }
    },
    "meta": {
      "type": "object",
      "required": ["tier", "agents", "maturity", "lastUpdated"],
      "properties": {
        "tier": { "enum": ["strategy", "insights", "optimization", "dxptools"] },
        "agents": { "type": "array", "items": { "type": "string" } },
        "maturity": { "enum": ["crawl", "walk", "run", "fly"] },
        "lastUpdated": { "type": "string", "format": "date-time" }
      }
    }
  },
  "required": ["hero", "overview", "insights", "opportunities", "nextSteps", "meta"]
};

// Universal language rules and prompt additions
const LANGUAGE_RULES = `

**Language Rules Compliance:**

MANDATORY - Your output MUST comply with these language rules:

1. **FORBIDDEN TERMS** - NEVER use these terms in any output:
   - Revenue, ROI, profit, cost, price, projections, forecast
   - Currency symbols: $, €, £
   - Monetary amounts or financial projections

2. **PREFERRED TERMINOLOGY:**
   - Use "impact" instead of "effect"
   - Use "optimization" instead of "improvement"
   - Use "performance" instead of "results"

3. **AVOIDED TERMS:**
   - Avoid: synergy, leverage (as verb), "somewhat", "pretty good", "kind of", "sort of"
   - Use specific, concrete language instead of vague qualifiers

4. **VALIDATION:**
   - Use \`osa_validate_language_rules\` tool to validate all content before sending
   - If violations found, revise content to comply with rules

**Never Blank Rules:**

MANDATORY - Always provide meaningful content with graceful degradation:

1. **Confidence Scoring:**
   - Calculate confidence based on data completeness (0-100)
   - < 40: Low confidence with "Building confidence - initial data collection phase"
   - 40-60: Medium confidence with "Moderate confidence - based on partial data"
   - 60-80: Good confidence with "Good confidence - solid data foundation"
   - 80+: High confidence with "High confidence - comprehensive data analysis"

2. **Missing Data Fallbacks:**
   - Metrics without data: Use "Collecting data...", "Analyzing...", "Calculating..."
   - Empty insights: "Building insights as data accumulates"
   - Empty opportunities: "Identifying opportunities based on incoming data"`;

function createAgent(filename, config) {
  const agent = {
    "schema_version": "1.0",
    "agent_type": "specialized",
    "name": config.name,
    "output": {
      "type": "json",
      "schema": JSON_SCHEMA,
      "description": "Structured JSON output conforming to ResultsPageContent interface for OSA dashboard consumption"
    },
    "version": "1.0.0",
    "agent_id": config.agent_id,
    "file_urls": [],
    "is_active": true,
    "creativity": config.creativity,
    "is_deleted": false,
    "parameters": config.parameters,
    "description": config.description,
    "enabled_tools": config.enabled_tools,
    "agent_metadata": null,
    "inference_type": "simple_with_thinking",
    "prompt_template": `**Role:** ${config.role}

**Objective:** ${config.objective}

**Input:**
${config.parameters.map(p => `- ${p.name}: [[${p.name}]]`).join('\n')}
- Reference information: {instruction: company overview, marketing strategy, technical guidelines}${LANGUAGE_RULES}

**JSON Output Structure:**

Your output MUST be valid JSON matching this structure with tier-specific ${config.tier} metrics:

\`\`\`json
{
  "hero": {
    "title": "[Agent-specific title based on analysis]",
    "promise": "[One-sentence value proposition for this analysis]",
    "metrics": ${JSON.stringify(config.metrics, null, 6)},
    "confidence": [0-100 based on data completeness],
    "confidenceNote": "[Message based on confidence level]"
  },
  "overview": {
    "summary": "[Business impact explanation with confidence context]",
    "keyPoints": [
      "[2-4 key takeaways from analysis]"
    ]
  },
  "insights": [
    {
      "title": "[Insight category]",
      "description": "[Clear explanation of insight significance]",
      "bullets": [
        "[Specific, actionable observations]"
      ]
    }
  ],
  "opportunities": [
    {
      "label": "[Clear, actionable opportunity description]",
      "impactLevel": "High|Medium|Low",
      "effortLevel": "Low|Medium|High",
      "confidence": [0-100]
    }
  ],
  "nextSteps": [
    {
      "label": "[Specific, actionable next step]",
      "ownerHint": "[Appropriate role or team]",
      "timeframeHint": "[Realistic timeframe]"
    }
  ],
  "meta": {
    "tier": "${config.tier}",
    "agents": ["${config.agent_id}"],
    "maturity": "crawl",
    "lastUpdated": "[ISO 8601 timestamp]"
  }
}
\`\`\`

***CRITICAL: Use \`osa_store_workflow_data\` and \`osa_send_data_to_osa_webhook\` with this JSON structure for Results page population.***`,
    "internal_version": config.internal_version
  };

  return agent;
}

// Create and write all agent files
console.log('🚀 Restoring OPAL agents with correct optimized configurations...\n');

let created = 0;
let failed = 0;

for (const [filename, config] of Object.entries(AGENT_CONFIGS)) {
  const filePath = path.join(AGENTS_DIR, filename);

  try {
    const agent = createAgent(filename, config);
    fs.writeFileSync(filePath, JSON.stringify(agent, null, 2), 'utf8');
    console.log(`✅ Restored: ${filename}`);
    created++;
  } catch (error) {
    console.error(`❌ Error creating ${filename}:`, error.message);
    failed++;
  }
}

console.log(`\n📊 Restoration Summary:`);
console.log(`✅ Successfully restored: ${created} agents`);
console.log(`❌ Failed to restore: ${failed} agents`);
console.log(`🎯 Total agents restored: ${created} / 9`);

if (created > 0) {
  console.log('\n🎉 All OPAL agents have been restored with correct optimized configurations!');
  console.log('\nKey features restored:');
  console.log('• JSON output format with proper ResultsPageContent schema');
  console.log('• Language rules compliance (no revenue metrics, preferred terms)');
  console.log('• Never Blank rules with confidence scoring');
  console.log('• Tier-specific hero metrics for Results pages');
  console.log('• Complete enabled_tools arrays with osa_validate_language_rules');
}