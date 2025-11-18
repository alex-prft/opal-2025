#!/usr/bin/env node

/**
 * Script to update all OPAL agents with Results content optimization
 *
 * This script updates the remaining 8 OPAL agents to:
 * 1. Change output from text to JSON with proper schema
 * 2. Add osa_validate_language_rules tool
 * 3. Add language rules and never blank rules to prompt templates
 * 4. Add tier-specific JSON output structures
 */

const fs = require('fs');
const path = require('path');

const AGENTS_DIR = path.join(__dirname, '../opal-config/opal-agents');

// Agent configurations with tier assignments and metrics
const AGENT_CONFIGS = {
  'audience_suggester.json': {
    tier: 'insights',
    metrics: [
      {"label": "Recommended Segments", "value": "8 segments", "hint": "High-value audience opportunities identified from behavioral analysis"},
      {"label": "Total Addressable Members", "value": "125K+", "hint": "Combined segment reach potential across all recommendations"},
      {"label": "Segmentation Confidence", "value": "72/100", "hint": "Based on behavioral and profile data quality and completeness"}
    ]
  },
  'cmp_organizer.json': {
    tier: 'dxptools',
    metrics: [
      {"label": "Campaign Specifications", "value": "12 campaigns", "hint": "CMP-ready implementations identified and documented"},
      {"label": "Strategy Brief Completeness", "value": "95%", "hint": "Comprehensive deliverable coverage across all strategic areas"},
      {"label": "Implementation Readiness", "value": "High", "hint": "Dependencies and requirements validation status"}
    ]
  },
  'content_review.json': {
    tier: 'insights',
    metrics: [
      {"label": "Content Quality Score", "value": "72/100", "hint": "Overall content effectiveness based on SEO, structure, and member relevance"},
      {"label": "Personalization Opportunities", "value": "18 identified", "hint": "High-impact content customization candidates across member segments"},
      {"label": "SEO Readiness", "value": "65%", "hint": "Technical and content optimization level for search performance"}
    ]
  },
  'customer_journey.json': {
    tier: 'insights',
    metrics: [
      {"label": "Journey Stages Analyzed", "value": "6 stages", "hint": "Complete lifecycle mapping from awareness through advocacy"},
      {"label": "Drop-off Points Identified", "value": "8 friction areas", "hint": "Critical optimization opportunities discovered through behavioral analysis"},
      {"label": "Cross-Channel Insights", "value": "12 touchpoints", "hint": "Multi-device and channel behavior patterns documented"}
    ]
  },
  'experiment_blueprinter.json': {
    tier: 'optimization',
    metrics: [
      {"label": "Experiment Specifications", "value": "15 tests", "hint": "Statistically rigorous A/B test designs ready for implementation"},
      {"label": "Testing Portfolio Value", "value": "High impact", "hint": "Expected performance optimization potential across all experiments"},
      {"label": "Statistical Confidence", "value": "95%", "hint": "Confidence level ensuring reliable and actionable results"}
    ]
  },
  'geo_audit.json': {
    tier: 'insights',
    metrics: [
      {"label": "Geographic Segments Analyzed", "value": "24 regions", "hint": "Regional performance and opportunity mapping completed"},
      {"label": "High-Value Regions", "value": "8 identified", "hint": "Geographic areas with significant optimization potential"},
      {"label": "Regional Performance Gap", "value": "35%", "hint": "Performance variation across regions indicating opportunity"}
    ]
  },
  'integration_health.json': {
    tier: 'dxptools',
    metrics: [
      {"label": "Overall Health Score", "value": "87/100", "hint": "Comprehensive DXP tool and integration health assessment"},
      {"label": "System Availability", "value": "99.2%", "hint": "Platform uptime over performance window"},
      {"label": "Integration Issues", "value": "2 active", "hint": "Current issues requiring immediate attention"}
    ]
  },
  'personalization_idea_generator.json': {
    tier: 'optimization',
    metrics: [
      {"label": "Personalization Ideas", "value": "22 concepts", "hint": "Strategic audience-specific experience opportunities identified"},
      {"label": "Implementation Complexity", "value": "Crawl-Walk range", "hint": "Aligned with current maturity capabilities and timeline"},
      {"label": "Expected Impact Score", "value": "High", "hint": "Based on segment size, behavior analysis, and KPI alignment"}
    ]
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

// Language rules and Never Blank rules (universal for all agents)
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
   - Ensure all metrics, insights, opportunities, and next steps are compliant

**Example Compliant Phrasing:**
✅ "Optimize engagement performance by 23%"
❌ "Increase revenue by $50K"

✅ "High impact on conversion performance"
❌ "Strong ROI projection of 150%"

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
   - Empty opportunities: "Identifying opportunities based on incoming data"
   - Empty next steps: "Analyzing to determine optimal next steps"

3. **Partial Data Handling:**
   - If only some data available, provide what you have with appropriate confidence note
   - Never leave sections completely empty
   - Always explain data limitations in confidenceNote field`;

function updateAgent(filename) {
  const filePath = path.join(AGENTS_DIR, filename);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filename}`);
    return false;
  }

  const config = AGENT_CONFIGS[filename];
  if (!config) {
    console.log(`⚠️  No configuration found for: ${filename}`);
    return false;
  }

  try {
    const agent = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Update output format to JSON with schema
    agent.output = {
      type: "json",
      schema: JSON_SCHEMA,
      description: "Structured JSON output conforming to ResultsPageContent interface for OSA dashboard consumption"
    };

    // Add osa_validate_language_rules tool if not present
    if (!agent.enabled_tools.includes('osa_validate_language_rules')) {
      agent.enabled_tools.unshift('osa_validate_language_rules');
    }

    // Update prompt template with language rules and JSON structure
    if (agent.prompt_template) {
      // Remove any revenue/ROI mentions from existing prompt
      agent.prompt_template = agent.prompt_template.replace(/revenue|ROI|profit|\$[\d,]+/gi, 'performance');

      // Add language rules and never blank rules
      agent.prompt_template += LANGUAGE_RULES;

      // Add JSON output structure
      agent.prompt_template += `

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
    "agents": ["${agent.agent_id}"],
    "maturity": "crawl",
    "lastUpdated": "[ISO 8601 timestamp]"
  }
}
\`\`\`

***CRITICAL: Use \`osa_store_workflow_data\` and \`osa_send_data_to_osa_webhook\` with this JSON structure for Results page population.***`;
    }

    // Write updated agent back to file
    fs.writeFileSync(filePath, JSON.stringify(agent, null, 2), 'utf8');
    console.log(`✅ Updated: ${filename}`);
    return true;
  } catch (error) {
    console.error(`❌ Error updating ${filename}:`, error.message);
    return false;
  }
}

// Main execution
console.log('🚀 Starting OPAL agents update...\n');

const agentFiles = Object.keys(AGENT_CONFIGS);
let updated = 0;
let failed = 0;

for (const filename of agentFiles) {
  if (filename === 'roadmap_generator.json') {
    console.log(`⏭️  Skipped: ${filename} (already updated manually)`);
    continue;
  }

  if (updateAgent(filename)) {
    updated++;
  } else {
    failed++;
  }
}

console.log(`\n📊 Update Summary:`);
console.log(`✅ Successfully updated: ${updated} agents`);
console.log(`❌ Failed to update: ${failed} agents`);
console.log(`⏭️  Already updated: 1 agent (roadmap_generator)`);
console.log(`🎯 Total agents processed: ${updated + failed + 1} / 9`);

if (updated > 0) {
  console.log('\n🎉 OPAL agents have been updated with Results content optimization!');
  console.log('\nKey improvements:');
  console.log('• Output format changed from text to structured JSON');
  console.log('• Added osa_validate_language_rules tool for compliance');
  console.log('• Added language rules (no revenue metrics, preferred terms)');
  console.log('• Added Never Blank rules for graceful degradation');
  console.log('• Added tier-specific hero metrics for Results pages');
  console.log('• Added confidence scoring for data reliability');
}