# Page-by-Page Content Requirements

**Based on**: OSA Content Generation v1.0 & Results Content Finalization  
**Created**: November 13, 2024  
**Updated**: November 16, 2024 (Implementation Analysis)  
**Purpose**: Detailed specifications for implementing agent-driven content on each Results page

## 🚀 Current Implementation Status (November 2024)

### **✅ IMPLEMENTED: Multi-Tier Architecture**
The system successfully implements a 3-tier content organization:

- **Tier 1**: High-level summary endpoints (`/api/opal/tier1/[tier1]`)
- **Tier 2**: Section-specific KPIs (`/api/opal/tier2/[tier1]/[tier2]`)
- **Tier 3**: Detailed page content (`/api/opal/tier3/[tier1]/[tier2]/[tier3]`)

### **✅ WORKING: API Data Flow**
Real API endpoints are functional with structured mock data:
```bash
# Verified working endpoints:
GET /api/opal/tier1/strategy-plans                          → Health metrics, KPIs
GET /api/opal/tier3/strategy-plans/phases/phase-1-foundation → Detailed metrics with comparison data
```

### **⚠️ PARTIAL: Widget Integration**
- **15+ Specialized Widgets**: StrategyPlansWidget, IntegrationHealthWidget, ExperimentationWidget, etc.
- **Conditional Rendering**: Sophisticated path-based widget selection via WidgetRenderer.tsx
- **Fallback Handling**: Comprehensive error boundaries and "data not available" states

### **❌ GAPS: Production Agent Integration**
- Most widgets currently use mock data generation instead of live OPAL agent data
- Some agent configurations exist but aren't integrated in the data service layer
- Real-time agent communication needs implementation

---

## Strategy Pages (`/engine/results/strategy`) - IMPLEMENTATION STATUS

### Current OPAL Agent Integration (Verified via Code Analysis)

**Implemented Agent Bindings:**
- ✅ **strategy_workflow**: Primary agent for strategic objectives, success metrics, priority frameworks
  - **Integration**: Properly mapped in `getAgentSourceForPage()` for strategy-plans paths
  - **Widget**: StrategyPlansWidget handles data rendering with tier1/tier2/tier3 structure
  - **Data Quality**: Realistic mock data with confidence scoring and metadata

- ⚠️ **roadmap_generator**: Timeline estimates and milestone tracking
  - **Configuration**: Agent config exists in `opal-config/opal-agents/roadmap_generator.json`
  - **Widget**: RoadmapEnhancedWidget implemented but not fully integrated
  - **Current Issue**: Agent selection logic maps some roadmap paths incorrectly

**Additional Agent Configurations Available:**
- ⚠️ **quick_wins_analyzer**: Configured but not integrated in main mapping
- ⚠️ **maturity_assessment**: Available but needs better widget integration 

### Current Widget Implementation (Verified in Codebase)

#### 1. StrategyPlansWidget - **✅ IMPLEMENTED**
**Location**: `src/components/widgets/StrategyPlansWidget.tsx`
**Data Structure** (from SimpleOpalDataService):
```typescript
// Actual implementation from mergedData structure
interface StrategicOverviewData {
  tier1Summary: any;      // High-level metrics and system status
  tier2KPIs: any;         // Section-specific KPIs and performance data  
  tier3Content: any;      // Detailed page content with charts/tables
  
  agent_source: string;   // e.g., 'strategy_workflow', 'content_review'
  confidence_score: number; // 0.6-0.95 calculated from agent outputs
  timestamp: string;      // ISO timestamp of data generation
  
  // Legacy compatibility
  confidenceScore: number;
  dataMetadata: {
    tier1: TierMetadata;
    tier2: TierMetadata; 
    tier3: TierMetadata;
  };
}
```

**Current Rendering Logic** (WidgetRenderer.tsx):
```typescript
// Path-based conditional rendering
if (pathMatchers.isStrategyPlans(path)) {
  if (pathMatchers.isPhases(path)) {
    return <PhasesEnhancedWidget data={mergedData} context={context} />;
  }
  if (path.includes('osa')) {
    return <OSAWidgetContainer data={mergedData} context={context} />;
  }
  // Fallback to StrategyPlansWidget for unmatched paths
  return <StrategyPlansWidget data={mergedData} className={className} />;
}
```

**Implemented Maturity Adaptations**: 
- ⚠️ **Partial**: Widget system supports maturity context but specific adaptations need implementation
- ✅ **Fallback Handling**: Comprehensive error boundaries and loading states
- ✅ **Data Validation**: Safe number formatting and null-safe rendering patterns

#### 2. Tier3 Content Implementation - **✅ WORKING**
**API Endpoint**: `/api/opal/tier3/[tier1]/[tier2]/[tier3]/route.ts`

**Real Data Example** (Phase 1 Foundation):
```json
{
  "pageId": "strategy-plans-phases-phase-1-foundation-0-3-months",
  "data": {
    "metrics": [
      {
        "id": "completion",
        "name": "Phase Completion", 
        "value": 75.2,
        "format": "percentage",
        "comparison": {
          "previous": 68.1,
          "change": 7.1,
          "changeType": "percentage"
        }
      },
      {
        "id": "budget",
        "name": "Budget Utilization",
        "value": 142500,
        "format": "currency", 
        "comparison": {
          "previous": 128000,
          "change": 14500,
          "changeType": "absolute"
        }
      }
    ],
    "charts": [
      {
        "id": "trend-chart",
        "type": "line", 
        "title": "Phase 1 Foundation Performance Trend (30 Days)",
        "data": [...] // Time series data
      }
    ]
  },
  "enrichment": {
    "aiInsights": [
      {
        "type": "prediction",
        "title": "Performance Forecast",
        "description": "Phase 1 projected to achieve 15% improvement over next 30 days",
        "confidence": 87
      }
    ]
  }
}
```

#### 3. Roadmap Timeline Widget - **⚠️ PARTIALLY IMPLEMENTED**
```typescript
interface RoadmapTimelineWidget {
  data_source: "roadmap_generator";
  content: {
    roadmap_items: RoadmapItem[]; // 67 total items
    quarterly_distribution: {
      q1: RoadmapItem[]; // 18 items
      q2: RoadmapItem[]; // 22 items
      q3: RoadmapItem[]; // 15 items
      q4: RoadmapItem[]; // 12 items
    };
    resource_allocation: {
      development_hours: 480;
      design_hours: 120;
      qa_hours: 96;
    };
    priority_distribution: {
      high: 23;
      medium: 28;
      low: 16;
    };
  };
  visualizations: {
    crawl: "Simple Gantt chart, basic timeline";
    walk: "Interactive timeline with milestone hover details";
    run: "Dynamic timeline with dependency mapping";
    fly: "AI-optimized timeline with automatic scheduling";
  };
}
```

#### 3. Strategic KPIs Widget
```typescript
interface StrategicKPIsWidget {
  data_source: ["strategy_workflow", "integration_health"];
  content: {
    primary_kpis: KPI[];
    performance_indicators: PerformanceIndicator[];
    strategic_alignment_score: number;
    implementation_readiness: number;
  };
  tier_structure: {
    tier1: "Executive summary KPIs";
    tier2: "Strategy section specific metrics";
    tier3: "Detailed implementation metrics with drill-down";
  };
}
```

### Content Quality Requirements
- **Data Freshness**: <15 minutes from agent execution
- **Loading Performance**: <2s initial render, <1s for interactions
- **Fallback Strategy**: Cached roadmap templates, industry standard objectives
- **Validation**: Strategic objectives must be SMART criteria compliant

---

## Analytics Insights Pages (`/engine/results/insights`)

### Primary OPAL Agent Binding
- **content_review**: Content quality score (87/100), variation analysis (156 total, 142 approved, 14 flagged), SEO optimization (92%), accessibility compliance (95%), brand consistency (89%)
- **audience_suggester**: 42 segments analyzed, performance metrics (8.5% conversion rate, 12.3% engagement rate, $2,340 LTV), 7 new segments identified
- **geo_audit**: 92/100 AI search optimization score, platform-specific analysis (Google AI: 85, Bing Chat: 78, Claude: 92), 12 content gaps across 15 regions

### Widget Specifications

#### 1. Content Performance Analytics Widget
```typescript
interface ContentPerformanceWidget {
  data_source: "content_review";
  content: {
    quality_metrics: {
      overall_quality_score: 87; // /100
      content_variations: {
        total: 156;
        approved: 142;
        flagged: 14;
      };
      optimization_levels: {
        seo_optimization: 92; // %
        accessibility_compliance: 95; // %
        brand_consistency: 89; // %
      };
    };
    optimization_opportunities: ContentOptimizationOpportunity[];
    performance_trends: ContentPerformanceTrend[];
  };
  maturity_adaptations: {
    crawl: "Basic content metrics, simple bar charts";
    walk: "Comparative analysis, trend visualization";
    run: "Predictive content performance, AI recommendations";
    fly: "Autonomous content optimization suggestions";
  };
}
```

#### 2. Audience Segmentation Widget
```typescript
interface AudienceSegmentationWidget {
  data_source: "audience_suggester";
  content: {
    segment_analysis: {
      total_segments_analyzed: 42;
      high_value_segments: HighValueSegment[];
      performance_metrics: {
        conversion_rate: 8.5; // %
        engagement_rate: 12.3; // %
        lifetime_value: 2340; // $
      };
    };
    segment_discovery: {
      new_segments_identified: 7;
      statistical_validation: ValidationResult[];
      targeting_recommendations: TargetingRecommendation[];
    };
    segment_prioritization: SegmentPriority[];
  };
  visualizations: {
    crawl: "Simple segment list, basic metrics";
    walk: "Interactive segment comparison, performance heatmaps";
    run: "Dynamic segment modeling, predictive value scoring";
    fly: "AI-driven segment discovery, autonomous targeting";
  };
}
```

#### 3. Geographic & AI Optimization Widget
```typescript
interface GeoAIOptimizationWidget {
  data_source: "geo_audit";
  content: {
    ai_search_optimization: {
      overall_score: 92; // /100
      platform_scores: {
        google_ai: 85;
        bing_chat: 78;
        claude: 92;
      };
    };
    regional_analysis: {
      regions_analyzed: 15;
      content_gaps_identified: 12;
      geographic_performance: GeographicPerformanceData[];
    };
    optimization_recommendations: AIOptimizationRecommendation[];
  };
  geo_visualization: "Interactive world map with performance overlays";
}
```

### Content Quality Requirements
- **Real-time Updates**: Content performance metrics update every 5 minutes
- **Data Validation**: All percentage scores must be 0-100 range
- **Geographic Accuracy**: Regional data must be validated against known geographic boundaries
- **Performance Targets**: Segment analysis rendering <1.5s, geo-visualization <3s

---

## Experience Optimization Pages (`/engine/results/optimization`)

### Primary OPAL Agent Binding
- **experiment_blueprinter**: 18 experiments designed, 34 hypotheses generated, confidence distribution (High: 12, Medium: 15, Low: 7), impact projections (12-18% conversion lift, $125K-$180K revenue)
- **personalization_idea_generator**: 45 personalization ideas, targeting strategy breakdown, complexity analysis (Simple: 20, Moderate: 15, Complex: 10), ROI projections (25-35% engagement lift, $200K-$350K annual ROI)
- **customer_journey**: 8 stages mapped, touchpoint analysis (34 total, 28 optimized), lifecycle rates (15% acquisition, 68% retention, 12% advocacy), 22 optimization opportunities

### Widget Specifications

#### 1. Experiment Design & Impact Widget
```typescript
interface ExperimentDesignWidget {
  data_source: "experiment_blueprinter";
  content: {
    experiment_portfolio: {
      experiments_designed: 18;
      hypotheses_generated: 34;
      confidence_distribution: {
        high: 12;
        medium: 15;
        low: 7;
      };
    };
    impact_modeling: {
      conversion_lift_estimate: "12-18%";
      revenue_impact_projection: "$125K-$180K";
      statistical_power_analysis: StatisticalPowerResult[];
    };
    implementation_blueprints: ExperimentBlueprint[];
  };
  maturity_adaptations: {
    crawl: "Basic A/B test suggestions, simple impact estimates";
    walk: "Multi-variate test designs, statistical significance calculators";
    run: "AI-powered experiment optimization, predictive modeling";
    fly: "Autonomous experiment management, real-time optimization";
  };
}
```

#### 2. Personalization Strategy Widget
```typescript
interface PersonalizationStrategyWidget {
  data_source: "personalization_idea_generator";
  content: {
    personalization_portfolio: {
      ideas_generated: 45;
      targeting_strategy_breakdown: TargetingStrategy[];
      complexity_analysis: {
        simple: 20;
        moderate: 15;
        complex: 10;
      };
    };
    roi_projections: {
      engagement_lift: "25-35%";
      annual_roi: "$200K-$350K";
      implementation_timeline: ImplementationTimeline[];
    };
    personalization_maturity_alignment: MaturityAlignment;
  };
  implementation_guidance: {
    crawl: "Basic segment targeting, simple content variations";
    walk: "Dynamic content blocks, behavioral triggers";
    run: "AI-driven personalization, real-time adaptation";
    fly: "Autonomous personalization optimization, predictive experiences";
  };
}
```

#### 3. Customer Journey Optimization Widget
```typescript
interface CustomerJourneyWidget {
  data_source: "customer_journey";
  content: {
    journey_mapping: {
      stages_mapped: 8;
      touchpoint_analysis: {
        total_touchpoints: 34;
        optimized_touchpoints: 28;
        optimization_opportunities: 22;
      };
    };
    lifecycle_analytics: {
      acquisition_rate: 15; // %
      retention_rate: 68; // %
      advocacy_rate: 12; // %
    };
    bottleneck_analysis: BottleneckAnalysis[];
    optimization_recommendations: JourneyOptimizationRecommendation[];
  };
  journey_visualization: "Interactive journey flow with conversion funnels";
}
```

### Content Quality Requirements
- **Statistical Validity**: All impact projections must include confidence intervals
- **Real-time Testing**: Experiment results update within 1 minute of data availability
- **Journey Accuracy**: Customer journey stages validated against actual user flows
- **ROI Validation**: All revenue projections must include methodology and assumptions

---

## DXP Tools Pages (`/engine/results/dxptools`)

### Primary OPAL Agent Binding
- **integration_health**: 99.8% uptime tracking, API response analysis (avg 120ms), error monitoring (0.01-0.02% error rate), 0-100 scale system health assessment
- **cmp_organizer**: 156 campaigns organized, performance metrics (340% ROI, 8.7% conversion rate, 15.2% engagement rate), 23 automation opportunities, 12 process standardizations

### Widget Specifications

#### 1. Integration Health Dashboard Widget
```typescript
interface IntegrationHealthWidget {
  data_source: "integration_health";
  content: {
    system_health_scoring: {
      overall_health_score: number; // 0-100 scale
      uptime_tracking: 99.8; // %
      api_performance: {
        average_response_time: 120; // ms
        p95_response_time: number;
        error_rate: "0.01-0.02%";
      };
    };
    service_availability: ServiceAvailabilityStatus[];
    performance_metrics: PerformanceMetric[];
    health_alerts: HealthAlert[];
  };
  real_time_monitoring: {
    update_frequency: "30 seconds";
    alert_thresholds: AlertThreshold[];
    auto_recovery: AutoRecoveryStatus[];
  };
}
```

#### 2. Campaign Management Optimization Widget
```typescript
interface CampaignOptimizationWidget {
  data_source: "cmp_organizer";
  content: {
    campaign_portfolio: {
      campaigns_organized: 156;
      performance_metrics: {
        roi: 340; // %
        conversion_rate: 8.7; // %
        engagement_rate: 15.2; // %
      };
    };
    workflow_optimization: {
      automation_opportunities: 23;
      process_standardizations: 12;
      efficiency_improvements: EfficiencyImprovement[];
    };
    campaign_analytics: CampaignAnalytics[];
  };
  optimization_tools: {
    workflow_analyzer: "Identifies bottlenecks and optimization opportunities";
    automation_recommender: "Suggests automation for repetitive tasks";
    performance_predictor: "Forecasts campaign performance";
  };
}
```

#### 3. System Performance & Monitoring Widget
```typescript
interface SystemPerformanceWidget {
  data_source: ["integration_health", "cmp_organizer"];
  content: {
    technical_metrics: {
      api_response_times: ResponseTimeMetrics[];
      error_monitoring: ErrorMonitoringData[];
      system_load: SystemLoadMetrics[];
    };
    business_metrics: {
      campaign_efficiency: number;
      automation_adoption: number;
      process_optimization_score: number;
    };
    predictive_analytics: {
      capacity_forecasting: CapacityForecast[];
      maintenance_recommendations: MaintenanceRecommendation[];
      optimization_opportunities: SystemOptimizationOpportunity[];
    };
  };
}
```

### Content Quality Requirements
- **Real-time Accuracy**: System health metrics must reflect actual system state within 30 seconds
- **Performance Standards**: All response time metrics validated against actual API calls
- **Alerting Requirements**: Critical alerts must trigger within 1 minute of threshold breach
- **Historical Tracking**: Performance trends maintained for 90-day rolling analysis

---

## Cross-Page Requirements

### Universal Content Quality Standards

#### Data Integrity
```typescript
interface UniversalDataStandards {
  freshness_requirements: {
    tier1_data: "< 5 minutes";
    tier2_data: "< 10 minutes";
    tier3_data: "< 15 minutes";
  };

  validation_rules: {
    percentage_fields: "0-100 range validation";
    currency_fields: "Non-negative with proper formatting";
    count_fields: "Non-negative integers only";
    confidence_scores: "0-100 with 2 decimal precision";
  };

  performance_targets: {
    initial_load: "< 2 seconds";
    widget_interactions: "< 500ms";
    chart_rendering: "< 1 second";
    data_refresh: "< 3 seconds";
  };
}
```

#### Maturity-Based Personalization Standards
```typescript
interface MaturityPersonalizationStandards {
  crawl_requirements: {
    chart_types: ["bar", "line", "pie"];
    interaction_level: "basic_hover_and_click";
    complexity_limit: "single_dimension_analysis";
    help_content: "extensive_tooltips_and_guidance";
  };

  walk_requirements: {
    chart_types: ["scatter", "heatmap", "funnel", "cohort"];
    interaction_level: "filtering_and_grouping";
    complexity_limit: "two_dimension_analysis";
    help_content: "contextual_suggestions";
  };

  run_requirements: {
    chart_types: ["sankey", "network", "treemap", "correlation_matrix"];
    interaction_level: "ai_assisted_exploration";
    complexity_limit: "multi_dimension_analysis";
    help_content: "predictive_insights";
  };

  fly_requirements: {
    chart_types: ["custom_ai_visualizations", "3d_data_models"];
    interaction_level: "natural_language_querying";
    complexity_limit: "autonomous_analysis";
    help_content: "proactive_recommendations";
  };
}
```

### Accessibility & Compliance Requirements

#### WCAG 2.1 AA Compliance
```typescript
interface AccessibilityRequirements {
  color_contrast: {
    normal_text: "4.5:1 minimum";
    large_text: "3.0:1 minimum";
    ui_components: "3.0:1 minimum";
  };

  keyboard_navigation: {
    tab_order: "logical_sequence";
    focus_indicators: "visible_and_consistent";
    skip_links: "available_for_main_content";
  };

  screen_reader_support: {
    aria_labels: "comprehensive_for_all_interactive_elements";
    alt_text: "descriptive_for_all_images_and_charts";
    table_headers: "properly_associated_with_data_cells";
  };

  responsive_design: {
    minimum_width: "320px";
    zoom_support: "up_to_200%_without_horizontal_scroll";
    orientation_support: "portrait_and_landscape";
  };
}
```



---

## Implementation Validation Checklist

### Pre-Implementation Validation
- [ ] All OPAL agent outputs mapped to specific widgets per page or fill with recommeded data
- [ ] Maturity-based personalization rules defined for each widget
- [ ] Tiered data architecture (T1/T2/T3) specified for each content area
- [ ] Performance targets established for each page and widget

### Post-Implementation Validation
- [ ] Agent data successfully populates all widgets
- [ ] Maturity-based personalization functions correctly across all levels
- [ ] Tiered content hierarchy renders appropriately
- [ ] Performance targets met under normal and stress conditions
- [ ] Accessibility standards (WCAG 2.1 AA) verified across all pages
- [ ] Cross-browser compatibility confirmed

### Ongoing Monitoring Requirements
- [ ] Content quality metrics tracked continuously
- [ ] User engagement analytics monitored per maturity level
- [ ] Performance metrics maintained within targets
- [ ] Error rates kept below 1% threshold
- [ ] Admin override capabilities tested monthly
- [ ] Documentation updated with any implementation changes

---

**Document Owner**: Development Team
**Reference Documents**: OSA_CONTENT_GENERATION_, RESULTS_CONTENT_FINALIZATION_ROADMAP
**Last Updated**: November 13, 2024