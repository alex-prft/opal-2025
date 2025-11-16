# OPAL Mapping Validation Tool

**Purpose**: Validate existing OPAL mappings against requirements and identify gaps
**Created**: November 13, 2024
**Status**: Implementation Ready

---

## Overview

This document provides a comprehensive validation framework to ensure existing OPAL mappings align with the OSA Content Generation process.

## 🚀 November 2025 Implementation Status

Based on comprehensive codebase analysis, the OPAL mapping system has been significantly implemented with the following architecture:

### ✅ **COMPLETED: Core Implementation**
- **Multi-tier API System**: Fully functional tier1/tier2/tier3 endpoints with mock data
- **Widget Architecture**: 15+ specialized widgets with conditional rendering logic
- **Path Detection System**: Advanced URL pattern matching and tier extraction
- **Data Service Integration**: SimpleOpalDataService with caching and fallback mechanisms
- **Enhanced Mapping Files**: Both basic and enhanced mapping configurations available

### ⚠️ **PARTIALLY IMPLEMENTED: Integration Layer**
- **Agent Bindings**: Some agents properly mapped, others using fallback routing
- **Real OPAL API**: Mock data serving as fallback, production API integration needed
- **Specialized Widgets**: Many implemented, some still using generic fallback rendering
- **Error Handling**: Comprehensive system in place but some areas need refinement

### ❌ **NOT YET IMPLEMENTED: Production Features**
- **Live Agent Integration**: Most agents using mock data generation
- **Real-time Validation**: Schema validation for agent outputs missing
- **Performance Optimization**: Some inefficiencies in confidence score calculation
- **Cross-agent Correlation**: Limited correlation between related agents

---

## Current OPAL Mapping Inventory (VERIFIED via Codebase Analysis)

### **Core Mapping Files** (Located in `src/data/` and `opal-config/opal-mapping/`)
- ✅ **`opal-mapping.json`**: Main navigation structure mapping (25+ tier2 sections defined)
- ✅ **`enhanced-opal-mapping.json`**: Enhanced mapping with tier3 URL patterns and widget specifications
- ✅ **`opal-mapping.ts`**: TypeScript mapping interface definitions

### **Agent Configuration Files** (Located in `opal-config/opal-agents/`)
- ✅ **`strategy_assistant_workflow.json`**: Primary strategy agent configuration
- ✅ **`roadmap_generator.json`**: Roadmap and timeline generation
- ✅ **`content_review.json`**: Content analysis and quality scoring
- ✅ **`audience_suggester.json`**: Audience segmentation and targeting
- ✅ **`experiment_blueprinter.json`**: A/B testing and experimentation
- ✅ **`personalization_idea_generator.json`**: Personalization strategy development
- ✅ **`customer_journey.json`**: User journey mapping and optimization
- ✅ **`integration_health.json`**: System health monitoring
- ✅ **`cmp_organizer.json`**: Campaign management platform integration
- ✅ **`geo_audit.json`**: Geographic performance analysis
- ⚠️ **`quick_wins_analyzer.json`**: Configured but not integrated in main mapping
- ⚠️ **`maturity_assessment.json`**: Configured but needs better widget integration

### **Tool Integration Mappings** (Located in `opal-config/opal-mapping/`)
- ✅ **`agent-configurations.json`**: Agent metadata and capabilities
- ✅ **`tool-configurations.json`**: Integration health and monitoring setup
- ✅ **`dxp-tool-configurations.json`**: Optimizely DXP platform integrations
- ✅ **`instruction-configurations.json`**: OPAL instruction templates
- ⚠️ **`mapping-utils.ts`**: Utility functions for mapping operations (needs enhancement)
- ⚠️ **`types.ts`**: TypeScript definitions (incomplete coverage)

### **OPAL Tools Integration** (Located in `opal-config/opal-tools/`)
- ✅ **`osa_webx_tools.json`**: Web experimentation platform integration
- ✅ **`osa_contentrecs_tools.json`**: Content recommendations API integration
- ✅ **`osa_cmspaas_tools.json`**: CMS platform integration
- ✅ **`osa_odp_tools.json`**: Optimizely Data Platform integration
- ✅ **`osa_cmp_tools.json`**: Campaign management platform integration
- ✅ **`workflow_data_sharing.json`**: Data sharing between OPAL workflows

---

## 🔍 Current Implementation Analysis (November 2025)

### **Data Service Implementation** - `src/lib/simple-opal-data-service.ts`

**Current Agent-to-Page Mapping Logic:**
```typescript
// Verified implementation from getAgentSourceForPage()
private getAgentSourceForPage(pageId: string): string {
  if (pageId.includes('strategy-plans')) {
    if (pageId.includes('osa')) return 'strategy_workflow';
    if (pageId.includes('roadmap')) return 'roadmap_generator';
    if (pageId.includes('maturity')) return 'maturity_assessment';
    if (pageId.includes('quick-wins')) return 'quick_wins_analyzer';
    if (pageId.includes('phases')) return 'strategy_workflow';
    return 'strategy_workflow'; // Default for strategy plans
  }
  
  if (pageId.includes('insights')) return 'content_review';
  if (pageId.includes('analytics-insights')) return 'content_review';
  if (pageId.includes('optimization')) return 'content_review';
  if (pageId.includes('dxptools')) return 'strategy_workflow';
  if (pageId.includes('experience-optimization')) return 'content_review';
  
  return 'strategy_workflow'; // Final fallback
}
```

**Issues Identified:**
- ❌ **Incorrect DXP Tools Mapping**: DXP tools pages mapped to `strategy_workflow` instead of `integration_health`
- ❌ **Missing Agent Utilization**: `quick_wins_analyzer` and `maturity_assessment` agents not used effectively
- ❌ **Overly Broad Fallbacks**: Too many sections defaulting to `strategy_workflow`

### **Widget Rendering Implementation** - `src/components/widgets/WidgetRenderer.tsx`

**Current Conditional Rendering Structure:**
```typescript
// Verified implementation showing widget container logic
const renderTier2WidgetContainer = () => {
  const path = pathname.toLowerCase();
  
  // Strategy Plans tier-2 containers
  if (pathMatchers.isStrategyPlans(path)) {
    if (pathMatchers.isPhases(path)) {
      return <PhasesEnhancedWidget data={mergedData} context={context} />;
    }
    if (path.includes('osa')) {
      return <OSAWidgetContainer data={mergedData} context={context} />;
    }
    // ... additional mappings
  }
  
  // DXP Tools, Analytics, Experience Optimization similar patterns...
}
```

**Strengths:**
- ✅ **Comprehensive Path Matching**: Sophisticated URL pattern detection
- ✅ **Fallback Handling**: Every widget container has error handling and "data not available" states
- ✅ **Context Awareness**: Full tier1/tier2/tier3 context passed to widgets

**Areas for Improvement:**
- ⚠️ **Complex Conditional Logic**: Deep nesting makes maintenance difficult
- ❌ **Inconsistent Widget Availability**: Many containers still show generic "not available" messages
- ❌ **Static URL Duplication**: Enhanced mapping has duplicate static URLs causing confusion

---

### 1. Agent-to-Widget Binding Validation (UPDATED with Real Implementation)

// Required Agent Bindings
const ContentBindings = {
  strategy: {
    primary_agents: ["strategy_workflow", "roadmap_generator"],
    supporting_agents: ["content_review", "integration_health"],
    required_outputs: [
      "strategic_objectives",
      "roadmap_items_67",
      "quarterly_distribution",
      "resource_allocation"
    ]
  },

  insights: {
    primary_agents: ["content_review", "audience_suggester", "geo_audit"],
    supporting_agents: ["integration_health"],
    required_outputs: [
      "content_quality_score_87",
      "segments_analyzed_42",
      "ai_optimization_score_92",
      "performance_metrics"
    ]
  },

  optimization: {
    primary_agents: ["experiment_blueprinter", "personalization_idea_generator", "customer_journey"],
    supporting_agents: ["content_review", "audience_suggester"],
    required_outputs: [
      "experiments_designed_18",
      "personalization_ideas_45",
      "journey_stages_8",
      "impact_projections"
    ]
  },

  dxptools: {
    primary_agents: ["integration_health", "cmp_organizer"],
    supporting_agents: ["content_review"],
    required_outputs: [
      "health_score_0_100",
      "uptime_tracking_99_8",
      "campaigns_organized_156",
      "automation_opportunities_23"
    ]
  }
};
```

### 2. Maturity Level Support Validation

```typescript
// Required Maturity Configurations 
const MaturityRequirements = {
  crawl: {
    chart_types: ["bar", "line", "pie"],
    interaction_level: "basic",
    complexity: "single_dimension",
    required_fields: ["chart_type", "data_source", "basic_interactions"]
  },

  walk: {
    chart_types: ["scatter", "heatmap", "funnel", "cohort"],
    interaction_level: "intermediate",
    complexity: "two_dimension",
    required_fields: ["chart_type", "data_source", "filtering_options", "grouping_options"]
  },

  run: {
    chart_types: ["sankey", "network", "treemap", "correlation_matrix"],
    interaction_level: "advanced",
    complexity: "multi_dimension",
    required_fields: ["chart_type", "data_source", "ai_assistance", "predictive_elements"]
  },

  fly: {
    chart_types: ["custom_ai_visualizations", "3d_data_models"],
    interaction_level: "autonomous",
    complexity: "ai_driven",
    required_fields: ["chart_type", "data_source", "ai_optimization", "autonomous_features"]
  }
};
```

### 3. Tier Structure Validation

```typescript
// Required Tier Structure 
const TierRequirements = {
  tier1: {
    purpose: "high_level_summaries",
    content_types: ["system_health_overview", "overall_kpis", "strategic_priorities"],
    required_fields: ["summary_metrics", "executive_dashboard_content"]
  },

  tier2: {
    purpose: "section_specific_kpis",
    content_types: ["category_navigation", "section_metrics", "mid_level_widgets"],
    required_fields: ["section_kpis", "navigation_content", "category_summaries"]
  },

  tier3: {
    purpose: "detailed_page_content",
    content_types: ["charts", "tables", "detailed_insights", "interactive_components"],
    required_fields: ["detailed_data", "drill_down_analysis", "interactive_elements"]
  }
};
```

---

## 🧪 Real Implementation Validation Results (November 2025)

### **API Endpoint Testing Results**

**Tier Data Endpoints Status:**
```bash
# Verified via curl testing
✅ GET /api/opal/tier1/strategy-plans         → 200 OK (mock data)
✅ GET /api/opal/tier3/.../phase-1-foundation → 200 OK (structured metrics)
❌ GET /api/opal/health                       → 500 UNHEALTHY (multiple failures)

Health Check Details:
- ❌ Database: "Failed to parse URL" 
- ❌ Webhooks: "Failed to parse URL"
- ❌ Workflow Engine: "Failed to parse URL"
- ⚠️  OPAL API: 2116ms response (timeout warnings)
```

**Build & Runtime Validation:**
```bash
# TypeScript Compilation Results
❌ scripts/start-production-sdk-tools.ts: 20+ syntax errors (lines 114, 130, 143+)
⚠️  Next.js Build: Completes with React key prop warnings
❌ Global Error Page: Prerender failure "Cannot read properties of null"

# Security Validation
✅ Security validation script runs successfully
✅ Environment configuration validation passes
```

### **Strategy Pages Implementation Status**

#### ✅ **WORKING: Strategy Plans Data Flow**
- **Agent Binding**: `strategy_workflow` → `StrategyPlansWidget` → Tier data rendered
- **URL Patterns**: `/engine/results/strategy-plans/*` correctly detected and routed
- **Data Structure**: Proper tier1/tier2/tier3 data merging with confidence scoring
- **Widget Rendering**: PhasesEnhancedWidget, OSAWidget, QuickWinsWidget implemented

#### ⚠️ **PARTIAL: Roadmap Integration**
- **Agent Available**: `roadmap_generator.json` configured in opal-config
- **Widget Implementation**: RoadmapEnhancedWidget exists but uses fallback data
- **Data Binding**: Agent not properly integrated in getAgentSourceForPage() logic
- **Mock Data**: generateTier3MockData() provides realistic roadmap structure

#### ❌ **GAPS IDENTIFIED: Quick Wins & Maturity**
- **Agent Configs Exist**: Both `quick_wins_analyzer.json` and `maturity_assessment.json` available  
- **Widget Containers**: QuickWinsWidget and MaturityWidget implemented
- **Missing Integration**: Agents not included in main opal-mapping.json structure
- **Fallback Behavior**: Show "data not available" messages instead of agent data

#### ⚠️ NEEDS UPDATE: `strategy-plans-navigation-mapping.json`
```json
{
  "validation_status": "PARTIAL_COMPLIANCE",
  "gaps_identified": [
    "Missing strategy_workflow agent binding",
    "No maturity-based widget selection",
    "Incomplete tier1 summary content",
    "No fallback configuration"
  ],
  "required_updates": [
    "Add strategy_workflow agent output mapping",
    "Implement 4-level maturity system",
    "Define tier1 strategic summary content",
    "Configure fallback strategies"
  ],
  "priority": "HIGH"
}
```

### **Analytics Insights Implementation Status**

#### ✅ **WORKING: Content Analysis Pipeline**
- **Agent Integration**: `content_review` agent properly mapped to analytics-insights paths
- **Widget System**: EngagementAnalyticsWidget handles content performance metrics
- **Data Processing**: Tier3 mock data includes realistic engagement metrics:
  ```json
  {
    "engagement": { "value": 68.4, "format": "percentage", "comparison": { "previous": 64.2, "change": 4.2 }},
    "views": { "value": 142350, "format": "number" },
    "time": { "value": 185, "format": "duration" }
  }
  ```

#### ⚠️ **PARTIAL: Audience Segmentation**
- **Agent Available**: `audience_suggester.json` configured with 42 segments target
- **Widget Rendering**: AudienceAnalyticsWidget implemented but shows fallback
- **URL Routing**: `/analytics-insights/audiences/*` paths correctly detected
- **Missing Integration**: Agent not consistently mapped in data service layer

#### ❌ **NOT IMPLEMENTED: Geographic Analysis** 
- **Agent Configuration**: `geo_audit.json` exists with AI optimization scoring
- **Expected Output**: 92/100 AI optimization score, platform breakdown (Google AI: 85, Bing: 78, Claude: 92)
- **Current Status**: Generic fallback widget, no specialized geo visualization
- **Missing Features**: Interactive world map, regional performance overlays

#### ⚠️ NEEDS UPDATE: `aeo-seo-mapping.json`
```json
{
  "validation_status": "REQUIRES_ENHANCEMENT",
  "agent_binding": {
    "primary_agent": "geo_audit",
    "compliance_score": 60
  },
  "required_updates": [
    "Add explicit AI optimization scoring",
    "Map platform-specific analysis results",
    "Structure regional gap analysis data",
    "Implement maturity-based geo-visualization complexity"
  ]
}
```

### Experience Optimization Validation

#### ✅ COMPLIANT: `experimentation-mapping.json`
```json
{
  "agent_binding": {
    "primary_agent": "experiment_blueprinter",
    "outputs_mapped": [
      "experiments_designed_18",
      "hypotheses_generated_34",
      "confidence_distribution",
      "impact_projections"
    ],
    "compliance_score": 95
  },
  "impact_modeling_validation": {
    "conversion_lift_12_18_percent": "✅ Mapped",
    "revenue_impact_125k_180k": "✅ Mapped",
    "confidence_high_12_medium_15_low_7": "✅ Mapped"
  }
}
```

#### ⚠️ NEEDS UPDATE: `personalization-mapping.json`
```json
{
  "validation_status": "PARTIAL_COMPLIANCE",
  "gaps_identified": [
    "Missing personalization_idea_generator specific outputs",
    "ROI projections (25-35% engagement lift, $200K-$350K) not mapped",
    "Complexity analysis (Simple: 20, Moderate: 15, Complex: 10) missing",
    "No maturity-based personalization adaptation"
  ],
  "required_updates": [
    "Map 45 personalization ideas output",
    "Add ROI projection calculations",
    "Structure complexity analysis data",
    "Align personalization complexity with user maturity levels"
  ]
}
```

### DXP Tools Validation

#### ✅ COMPLIANT: `cmp-mapping.json`
```json
{
  "agent_binding": {
    "primary_agent": "cmp_organizer",
    "outputs_mapped": [
      "campaigns_organized_156",
      "roi_340_percent",
      "conversion_rate_8_7_percent",
      "engagement_rate_15_2_percent",
      "automation_opportunities_23",
      "process_standardizations_12"
    ],
    "compliance_score": 100
  }
}
```

#### ⚠️ NEEDS UPDATE: `tool-configurations.json`
```json
{
  "validation_status": "REQUIRES_MAJOR_UPDATE",
  "gaps_identified": [
    "No integration_health agent binding",
    "Missing system health scoring (0-100 scale)",
    "Uptime tracking (99.8%) not configured",
    "API performance metrics (avg 120ms) missing",
    "Error monitoring (0.01-0.02%) not structured"
  ],
  "required_updates": [
    "Add integration_health agent as primary data source",
    "Implement 0-100 health scoring system",
    "Configure uptime tracking metrics",
    "Map API performance analysis",
    "Structure error monitoring data"
  ],
  "priority": "CRITICAL"
}
```

---

## Gap Analysis Summary

### Critical Gaps 

1. **Integration Health Agent Binding**: DXP Tools pages missing primary agent
2. **Maturity-Based Personalization**: Most mappings lack 4-level maturity support
3. **Tier1 Summary Content**: Executive-level summaries not configured

### High Priority Gaps (Important for Full Functionality)

1. **Specific Metric Mapping**: Exact metrics (e.g., 92/100 AI score) not explicitly mapped
2. **Cross-Agent Correlation**: Relationships between agents not defined
3. **Real-time Update Configuration**: Data freshness requirements not specified
4. **Performance Validation**: Load time and rendering targets not configured

### Medium Priority Gaps (Enhancement Opportunities)

1. **Advanced Chart Types**: Fly-level visualizations not fully configured
2. **AI-Assisted Features**: Run and Fly level AI capabilities missing
3. **Predictive Analytics**: Forecasting and trend analysis not mapped
4. **Autonomous Features**: Self-optimizing capabilities not configured

---

## Implementation Action Plan

### Phase 1: Critical Gap Resolution (Days 1-2)

#### Update `tool-configurations.json` for Integration Health
```json
{
  "agent_binding": {
    "primary_agent": "integration_health",
    "data_sources": [
      "system_health_scores",
      "uptime_tracking",
      "api_performance",
      "error_monitoring"
    ]
  },
  "health_scoring": {
    "scale": "0-100",
    "update_frequency": "30_seconds",
    "alert_thresholds": {
      "critical": 30,
      "warning": 70,
      "good": 90
    }
  },
  "performance_metrics": {
    "uptime_target": 99.8,
    "response_time_target": 120,
    "error_rate_threshold": 0.02
  }
}
```

#### Add Maturity Support to All Mappings
```json
{
  "maturity_configurations": {
    "crawl": {
      "chart_types": ["bar", "line", "pie"],
      "interaction_level": "basic",
      "help_content": "extensive"
    },
    "walk": {
      "chart_types": ["scatter", "heatmap", "funnel"],
      "interaction_level": "intermediate",
      "help_content": "contextual"
    },
    "run": {
      "chart_types": ["sankey", "network", "treemap"],
      "interaction_level": "advanced",
      "help_content": "predictive"
    },
    "fly": {
      "chart_types": ["custom_ai", "3d_models"],
      "interaction_level": "autonomous",
      "help_content": "proactive"
    }
  }
}
```

### Phase 2: High Priority Enhancements (Days 3-5)

#### Enhance Agent-Specific Metric Mapping
```json
{
  "content_review_metrics": {
    "quality_score": 87,
    "content_variations": {
      "total": 156,
      "approved": 142,
      "flagged": 14
    },
    "optimization_levels": {
      "seo": 92,
      "accessibility": 95,
      "brand_consistency": 89
    }
  },
  "audience_suggester_metrics": {
    "segments_analyzed": 42,
    "performance": {
      "conversion_rate": 8.5,
      "engagement_rate": 12.3,
      "lifetime_value": 2340
    },
    "discovery": {
      "new_segments": 7,
      "statistical_validation": true
    }
  }
}
```

#### Add Tier Structure Configuration
```json
{
  "tier_structure": {
    "tier1": {
      "content_type": "executive_summary",
      "refresh_frequency": "5_minutes",
      "fallback_strategy": "cached_summary"
    },
    "tier2": {
      "content_type": "section_kpis",
      "refresh_frequency": "10_minutes",
      "fallback_strategy": "historical_trends"
    },
    "tier3": {
      "content_type": "detailed_analysis",
      "refresh_frequency": "15_minutes",
      "fallback_strategy": "static_templates"
    }
  }
}
```

### Phase 3: Advanced Features (Days 6-7)

#### Implement Predictive and AI Features
```json
{
  "advanced_features": {
    "predictive_analytics": {
      "trend_forecasting": true,
      "anomaly_detection": true,
      "impact_modeling": true
    },
    "ai_assistance": {
      "insight_generation": true,
      "recommendation_optimization": true,
      "autonomous_adjustment": true
    },
    "real_time_adaptation": {
      "user_behavior_learning": true,
      "content_optimization": true,
      "performance_tuning": true
    }
  }
}
```

---

## Validation Testing Procedures

### 1. Agent Data Flow Testing
```typescript
// Test each agent's data flow through mappings
const testAgentDataFlow = async (agentName: string, mappingFile: string) => {
  const mockAgentData = generateMockAgentData(agentName);
  const mappingConfig = loadMappingConfig(mappingFile);
  const widgetData = applyMapping(mockAgentData, mappingConfig);

  // Validate all required fields present
  validateRequiredFields(widgetData,agentName);

  // Test maturity adaptation
  validateMaturityAdaptation(widgetData);

  // Test fallback scenarios
  validateFallbackBehavior(widgetData);
};
```

### 2. Performance Validation
```typescript
// Test mapping performance under load
const testMappingPerformance = async (mappingFile: string) => {
  const startTime = performance.now();

  // Simulate high-volume data processing
  const results = await processMappingAtScale(mappingFile, 1000);

  const endTime = performance.now();
  const processingTime = endTime - startTime;

  // Validate performance 
  assert(processingTime < 2000, 'Mapping processing must complete within 2 seconds');
};
```

### 3. Quality Validation
```typescript
// Validate mapping output quality
const validateMappingQuality = async (mappingFile: string) => {
  const mappingConfig = loadMappingConfig(mappingFile);

  // Validate data integrity rules
  validateDataIntegrity(mappingConfig);

  // Check accessibility requirements
  validateAccessibilityCompliance(mappingConfig);
};
```

---

## Monitoring & Maintenance

### Ongoing Validation Requirements
1. **Mapping Review**: Validate all mappings 
2. **Performance Monitoring**: Track mapping processing times and optimize as needed
3. **Quality Metrics**: Monitor content quality scores and user satisfaction
4. **Update Procedures**: Process for updating mappings 

### Automated Validation Pipeline
```typescript
// Continuous validation pipeline
const validationPipeline = {
  triggers: [
    'mapping_file_changes',
    'agent_output_schema_changes',
    'performance_degradation_alerts'
  ],

  validation_steps: [
    'agent_binding_validation',
    'maturity_support_validation',
    'tier_structure_validation',
    'performance_testing',
    'quality_assessment'
  ],

  reporting: {
    dashboard_integration: true,
    alert_thresholds: {
      compliance_score: 90,
      performance_degradation: 20,
      quality_issues: 5
    }
  }
};
```

---

## Success Metrics

### Validation Success Criteria
- **Performance Targets**: All mappings process 
- **Quality Standards**: All outputs meet content quality requirements
- **User Experience**: Maturity-based personalization functions correctly
- **Reliability**: Fallback systems activate properly during failures

### Ongoing Monitoring KPIs
- **Mapping Processing Time**: Average <1s for standard operations
- **Data Quality Score**: >90% accuracy across all agent outputs
- **User Satisfaction**: >4.0/5.0 rating for content relevance
- **System Reliability**: >99% uptime for mapping services
- **Admin Override Rate**: <10% manual interventions required

---

**Document Owner**: Platform Engineering Team
**Stakeholders**: Development Team, QA Team, Product Team
**Review Schedule**: Weekly during implementation, Monthly after deployment