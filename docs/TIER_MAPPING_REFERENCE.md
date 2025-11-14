# 🗺️ Tier-Level Rendering Rules - Complete Mapping Reference

**Generated**: November 13, 2025
**Purpose**: Complete URL → Content mapping for OPAL Results system

---

## 📋 **Tier-Level Structure Overview**

### **Tier Classification System:**
- **Tier-1**: High-level category (Strategy Plans, Optimizely DXP Tools, Analytics Insights, Experience Optimization)
- **Tier-2**: Section-specific focus (OSA, Quick Wins, Content Recs, Experimentation, etc.)
- **Tier-3**: Page-specific content (Overview Dashboard, Strategic Recommendations, Active Experiments, etc.)

### **Rendering Logic:**
**URL Pattern** → **Tier-1** → **Tier-2** → **Tier-3** → **Widgets** → **Data Props** → **OPAL Config**

---

## 🎯 **Complete URL Mapping Table**

### **STRATEGY PLANS** (`/engine/results/strategy-plans/` or `/engine/results/strategy`)

| Tier-2 | Tier-3 | URL Pattern | Primary Widget | OPAL Agents | DXP Tools |
|---------|--------|-------------|----------------|-------------|-----------|
| **OSA** | Overview Dashboard | `/strategy-plans/osa/overview-dashboard` | StrategyPlansWidget | strategy_workflow | Content Recs, CMS, ODP, WEBX, CMP |
| **OSA** | Strategic Recommendations | `/strategy-plans/osa/strategic-recommendations` | StrategyPlansWidget | strategy_workflow, roadmap_generator | Content Recs, CMS, ODP, WEBX, CMP |
| **OSA** | Performance Metrics | `/strategy-plans/osa/performance-metrics` | StrategyPlansWidget | strategy_workflow | Content Recs, CMS, ODP, WEBX, CMP |
| **OSA** | Data Quality Score | `/strategy-plans/osa/data-quality-score` | StrategyPlansWidget | strategy_workflow | Content Recs, CMS, ODP, WEBX, CMP |
| **OSA** | Workflow Timeline | `/strategy-plans/osa/workflow-timeline` | StrategyPlansWidget | strategy_workflow | Content Recs, CMS, ODP, WEBX, CMP |
| **Quick Wins** | Immediate Opportunities | `/strategy-plans/quick-wins/immediate-opportunities` | StrategyPlansWidget | strategy_workflow, roadmap_generator | Content Recs, CMS, ODP, WEBX, CMP |
| **Quick Wins** | 30-day Implementation | `/strategy-plans/quick-wins/implementation-roadmap-30-day` | StrategyPlansWidget | strategy_workflow, roadmap_generator | Content Recs, CMS, ODP, WEBX, CMP |
| **Quick Wins** | Resource Requirements | `/strategy-plans/quick-wins/resource-requirements` | StrategyPlansWidget | strategy_workflow | Content Recs, CMS, ODP, WEBX, CMP |
| **Quick Wins** | Expected Impact | `/strategy-plans/quick-wins/expected-impact` | StrategyPlansWidget | strategy_workflow | Content Recs, CMS, ODP, WEBX, CMP |
| **Quick Wins** | Success Metrics | `/strategy-plans/quick-wins/success-metrics` | StrategyPlansWidget | strategy_workflow | Content Recs, CMS, ODP, WEBX, CMP |
| **Maturity** | Current State Assessment | `/strategy-plans/maturity/current-state-assessment` | StrategyPlansWidget | strategy_workflow, roadmap_generator | Content Recs, CMS, ODP, WEBX, CMP |
| **Maturity** | Maturity Framework | `/strategy-plans/maturity/maturity-framework` | StrategyPlansWidget | strategy_workflow | Content Recs, CMS, ODP, WEBX, CMP |
| **Maturity** | Gap Analysis | `/strategy-plans/maturity/gap-analysis` | StrategyPlansWidget | strategy_workflow | Content Recs, CMS, ODP, WEBX, CMP |
| **Maturity** | Improvement Pathway | `/strategy-plans/maturity/improvement-pathway` | StrategyPlansWidget | strategy_workflow | Content Recs, CMS, ODP, WEBX, CMP |
| **Maturity** | Benchmarking Data | `/strategy-plans/maturity/benchmarking-data` | StrategyPlansWidget | strategy_workflow | Content Recs, CMS, ODP, WEBX, CMP |
| **Phases** | Phase 1: Foundation (0-3m) | `/strategy-plans/phases/phase-1-foundation-0-3-months` | StrategyPlansWidget | strategy_workflow, roadmap_generator | Content Recs, CMS, ODP, WEBX, CMP |
| **Phases** | Phase 2: Growth (3-6m) | `/strategy-plans/phases/phase-2-growth-3-6-months` | StrategyPlansWidget | strategy_workflow, roadmap_generator | Content Recs, CMS, ODP, WEBX, CMP |
| **Phases** | Phase 3: Optimization (6-12m) | `/strategy-plans/phases/phase-3-optimization-6-12-months` | StrategyPlansWidget | strategy_workflow, roadmap_generator | Content Recs, CMS, ODP, WEBX, CMP |
| **Phases** | Phase 4: Innovation (12+m) | `/strategy-plans/phases/phase-4-innovation-12-months` | StrategyPlansWidget | strategy_workflow, roadmap_generator | Content Recs, CMS, ODP, WEBX, CMP |
| **Phases** | Cross-phase Dependencies | `/strategy-plans/phases/cross-phase-dependencies` | StrategyPlansWidget | strategy_workflow, roadmap_generator | Content Recs, CMS, ODP, WEBX, CMP |
| **Roadmap** | Timeline View | `/strategy-plans/roadmap/timeline-view` | StrategyPlansWidget | strategy_workflow, roadmap_generator | Content Recs, CMS, ODP, WEBX, CMP |
| **Roadmap** | Milestone Tracking | `/strategy-plans/roadmap/milestone-tracking` | StrategyPlansWidget | roadmap_generator | Content Recs, CMS, ODP, WEBX, CMP |
| **Roadmap** | Resource Allocation | `/strategy-plans/roadmap/resource-allocation` | StrategyPlansWidget | strategy_workflow | Content Recs, CMS, ODP, WEBX, CMP |
| **Roadmap** | Risk Assessment | `/strategy-plans/roadmap/risk-assessment` | StrategyPlansWidget | strategy_workflow | Content Recs, CMS, ODP, WEBX, CMP |
| **Roadmap** | Progress Indicators | `/strategy-plans/roadmap/progress-indicators` | StrategyPlansWidget | roadmap_generator | Content Recs, CMS, ODP, WEBX, CMP |

### **OPTIMIZELY DXP TOOLS** (`/engine/results/optimizely-dxp-tools/` or `/engine/results/dxptools`)

| Tier-2 | Tier-3 | URL Pattern | Primary Widget | OPAL Agents | DXP Tools |
|---------|--------|-------------|----------------|-------------|-----------|
| **Content Recs** | Visitor Analytics Dashboard | `/optimizely-dxp-tools/content-recs/visitor-analytics-dashboard` | IntegrationHealthWidget | content_review, audience_suggester | Content Recs |
| **Content Recs** | Content Performance Metrics | `/optimizely-dxp-tools/content-recs/content-performance-metrics` | IntegrationHealthWidget | content_review | Content Recs |
| **Content Recs** | Recommendation Algorithms | `/optimizely-dxp-tools/content-recs/recommendation-algorithms` | IntegrationHealthWidget | content_review | Content Recs |
| **Content Recs** | A/B Testing Results | `/optimizely-dxp-tools/content-recs/ab-testing-results` | IntegrationHealthWidget | experiment_blueprinter | Content Recs |
| **Content Recs** | Personalization Effectiveness | `/optimizely-dxp-tools/content-recs/personalization-effectiveness` | IntegrationHealthWidget | personalization_idea_generator | Content Recs |
| **CMS** | Content Inventory | `/optimizely-dxp-tools/cms/content-inventory` | IntegrationHealthWidget | content_review, integration_health | CMS |
| **CMS** | Publishing Workflows | `/optimizely-dxp-tools/cms/publishing-workflows` | IntegrationHealthWidget | integration_health | CMS |
| **CMS** | Content Performance | `/optimizely-dxp-tools/cms/content-performance` | IntegrationHealthWidget | content_review | CMS |
| **CMS** | SEO Optimization | `/optimizely-dxp-tools/cms/seo-optimization` | IntegrationHealthWidget | content_review | CMS |
| **CMS** | Multi-channel Publishing | `/optimizely-dxp-tools/cms/multi-channel-publishing` | IntegrationHealthWidget | integration_health | CMS |
| **ODP** | Customer Profiles | `/optimizely-dxp-tools/odp/customer-profiles` | IntegrationHealthWidget | audience_suggester, customer_journey | ODP |
| **ODP** | Audience Segments | `/optimizely-dxp-tools/odp/audience-segments` | IntegrationHealthWidget | audience_suggester | ODP |
| **ODP** | Journey Analytics | `/optimizely-dxp-tools/odp/journey-analytics` | IntegrationHealthWidget | customer_journey | ODP |
| **ODP** | Real-time Events | `/optimizely-dxp-tools/odp/real-time-events` | IntegrationHealthWidget | integration_health | ODP |
| **ODP** | Data Integration Status | `/optimizely-dxp-tools/odp/data-integration-status` | IntegrationHealthWidget | integration_health | ODP |
| **WEBX** | Active Experiments | `/optimizely-dxp-tools/webx/active-experiments` | IntegrationHealthWidget | experiment_blueprinter, integration_health | WEBX |
| **WEBX** | Results Analysis | `/optimizely-dxp-tools/webx/results-analysis` | IntegrationHealthWidget | experiment_blueprinter | WEBX |
| **WEBX** | Statistical Significance | `/optimizely-dxp-tools/webx/statistical-significance` | IntegrationHealthWidget | experiment_blueprinter | WEBX |
| **WEBX** | Conversion Impact | `/optimizely-dxp-tools/webx/conversion-impact` | IntegrationHealthWidget | experiment_blueprinter | WEBX |
| **WEBX** | Test Configuration | `/optimizely-dxp-tools/webx/test-configuration` | IntegrationHealthWidget | experiment_blueprinter | WEBX |
| **CMP** | Campaign Performance | `/optimizely-dxp-tools/cmp/campaign-performance` | IntegrationHealthWidget | cmp_organizer | CMP |
| **CMP** | Email Analytics | `/optimizely-dxp-tools/cmp/email-analytics` | IntegrationHealthWidget | cmp_organizer | CMP |
| **CMP** | Automation Workflows | `/optimizely-dxp-tools/cmp/automation-workflows` | IntegrationHealthWidget | cmp_organizer | CMP |
| **CMP** | Audience Targeting | `/optimizely-dxp-tools/cmp/audience-targeting` | IntegrationHealthWidget | audience_suggester, cmp_organizer | CMP |
| **CMP** | ROI Analysis | `/optimizely-dxp-tools/cmp/roi-analysis` | IntegrationHealthWidget | cmp_organizer | CMP |

### **ANALYTICS INSIGHTS** (`/engine/results/analytics-insights/` or `/engine/results/insights`)

| Tier-2 | Tier-3 | URL Pattern | Primary Widget | OPAL Agents | DXP Tools |
|---------|--------|-------------|----------------|-------------|-----------|
| **OSA** | Engagement | `/analytics-insights/osa/engagement` | EngagementAnalyticsWidget | content_review, audience_suggester | Content Recs, ODP |
| **OSA** | Topics | `/analytics-insights/osa/topics` | EngagementAnalyticsWidget | content_review | Content Recs, CMS |
| **OSA** | Popular | `/analytics-insights/osa/popular` | EngagementAnalyticsWidget | content_review | Content Recs |
| **OSA** | AI Visibility | `/analytics-insights/osa/ai-visibility` | EngagementAnalyticsWidget | content_review | Content Recs |
| **OSA** | Semantic | `/analytics-insights/osa/semantic` | EngagementAnalyticsWidget | content_review | Content Recs |
| **OSA** | Geographic | `/analytics-insights/osa/geographic` | EngagementAnalyticsWidget | geo_audit, audience_suggester | ODP |
| **OSA** | Freshness | `/analytics-insights/osa/freshness` | EngagementAnalyticsWidget | content_review | CMS |
| **Content** | Engagement | `/analytics-insights/content/engagement` | EngagementAnalyticsWidget | content_review, audience_suggester | Content Recs, ODP |
| **Content** | Topics | `/analytics-insights/content/topics` | EngagementAnalyticsWidget | content_review | Content Recs, CMS |
| **Content** | Popular | `/analytics-insights/content/popular` | EngagementAnalyticsWidget | content_review | Content Recs |
| **Content** | AI Visibility | `/analytics-insights/content/ai-visibility` | EngagementAnalyticsWidget | content_review | Content Recs |
| **Content** | Semantic | `/analytics-insights/content/semantic` | EngagementAnalyticsWidget | content_review | Content Recs |
| **Content** | Geographic | `/analytics-insights/content/geographic` | EngagementAnalyticsWidget | geo_audit, audience_suggester | ODP |
| **Content** | Freshness | `/analytics-insights/content/freshness` | EngagementAnalyticsWidget | content_review | CMS |
| **Audiences** | Engagement | `/analytics-insights/audiences/engagement` | EngagementAnalyticsWidget | audience_suggester, content_review | ODP, Content Recs |
| **Audiences** | Topics | `/analytics-insights/audiences/topics` | EngagementAnalyticsWidget | audience_suggester, content_review | ODP, Content Recs |
| **Audiences** | Popular | `/analytics-insights/audiences/popular` | EngagementAnalyticsWidget | audience_suggester | ODP |
| **Audiences** | AI Visibility | `/analytics-insights/audiences/ai-visibility` | EngagementAnalyticsWidget | audience_suggester | ODP |
| **Audiences** | Semantic | `/analytics-insights/audiences/semantic` | EngagementAnalyticsWidget | audience_suggester | ODP |
| **Audiences** | Geographic | `/analytics-insights/audiences/geographic` | EngagementAnalyticsWidget | geo_audit, audience_suggester | ODP |
| **Audiences** | Freshness | `/analytics-insights/audiences/freshness` | EngagementAnalyticsWidget | audience_suggester | ODP |
| **CX** | Engagement | `/analytics-insights/cx/engagement` | EngagementAnalyticsWidget | customer_journey, content_review | Content Recs, ODP |
| **CX** | Topics | `/analytics-insights/cx/topics` | EngagementAnalyticsWidget | content_review, customer_journey | Content Recs, ODP, CMP |
| **CX** | Popular | `/analytics-insights/cx/popular` | EngagementAnalyticsWidget | customer_journey | ODP |
| **CX** | AI Visibility | `/analytics-insights/cx/ai-visibility` | EngagementAnalyticsWidget | customer_journey | ODP |
| **CX** | Semantic | `/analytics-insights/cx/semantic` | EngagementAnalyticsWidget | customer_journey | ODP |
| **CX** | Geographic | `/analytics-insights/cx/geographic` | EngagementAnalyticsWidget | geo_audit, customer_journey | ODP |
| **CX** | Freshness | `/analytics-insights/cx/freshness` | EngagementAnalyticsWidget | customer_journey | ODP |
| **Experimentation** | Engagement | `/analytics-insights/experimentation/engagement` | EngagementAnalyticsWidget | experiment_blueprinter | WEBX |
| **Experimentation** | Topics | `/analytics-insights/experimentation/topics` | EngagementAnalyticsWidget | experiment_blueprinter | WEBX |
| **Experimentation** | Popular | `/analytics-insights/experimentation/popular` | EngagementAnalyticsWidget | experiment_blueprinter | WEBX |
| **Experimentation** | AI Visibility | `/analytics-insights/experimentation/ai-visibility` | EngagementAnalyticsWidget | experiment_blueprinter | WEBX |
| **Experimentation** | Semantic | `/analytics-insights/experimentation/semantic` | EngagementAnalyticsWidget | experiment_blueprinter | WEBX |
| **Experimentation** | Geographic | `/analytics-insights/experimentation/geographic` | EngagementAnalyticsWidget | experiment_blueprinter, geo_audit | WEBX, ODP |
| **Experimentation** | Freshness | `/analytics-insights/experimentation/freshness` | EngagementAnalyticsWidget | experiment_blueprinter | WEBX |

### **EXPERIENCE OPTIMIZATION** (`/engine/results/experience-optimization/` or `/engine/results/optimization`)

| Tier-2 | Tier-3 | URL Pattern | Primary Widget | OPAL Agents | DXP Tools |
|---------|--------|-------------|----------------|-------------|-----------|
| **Content** | Content Strategy Overview | `/experience-optimization/content/content-strategy-overview` | ExperimentationWidget | content_review, personalization_idea_generator | Content Recs, CMS |
| **Content** | Performance Analytics | `/experience-optimization/content/performance-analytics` | ExperimentationWidget | content_review | Content Recs |
| **Content** | Content Optimization Recommendations | `/experience-optimization/content/content-optimization-recommendations` | ExperimentationWidget | content_review | Content Recs |
| **Content** | Multi-channel Content Distribution | `/experience-optimization/content/multi-channel-content-distribution` | ExperimentationWidget | content_review | CMS, CMP |
| **Content** | Content ROI Analysis | `/experience-optimization/content/content-roi-analysis` | ExperimentationWidget | content_review | Content Recs, CMP |
| **Experimentation** | Experiment Design Framework | `/experience-optimization/experimentation/experiment-design-framework` | ExperimentationWidget | experiment_blueprinter, customer_journey | WEBX, ODP |
| **Experimentation** | Statistical Testing Results | `/experience-optimization/experimentation/statistical-testing-results` | ExperimentationWidget | experiment_blueprinter | WEBX |
| **Experimentation** | Hypothesis Validation | `/experience-optimization/experimentation/hypothesis-validation` | ExperimentationWidget | experiment_blueprinter | WEBX |
| **Experimentation** | Test Impact Assessment | `/experience-optimization/experimentation/test-impact-assessment` | ExperimentationWidget | experiment_blueprinter | WEBX |
| **Experimentation** | Experimentation Roadmap | `/experience-optimization/experimentation/experimentation-roadmap` | ExperimentationWidget | experiment_blueprinter | WEBX |
| **Personalization** | Personalization Strategy | `/experience-optimization/personalization/personalization-strategy` | ExperimentationWidget | personalization_idea_generator, audience_suggester, customer_journey | ODP, CMP, Content Recs |
| **Personalization** | Audience Segmentation | `/experience-optimization/personalization/audience-segmentation` | ExperimentationWidget | audience_suggester, personalization_idea_generator | ODP, CMP |
| **Personalization** | Dynamic Content Delivery | `/experience-optimization/personalization/dynamic-content-delivery` | ExperimentationWidget | personalization_idea_generator | Content Recs, CMP |
| **Personalization** | Personalization Performance | `/experience-optimization/personalization/personalization-performance` | ExperimentationWidget | personalization_idea_generator | Content Recs, CMP |
| **Personalization** | Real-time Optimization | `/experience-optimization/personalization/real-time-optimization` | ExperimentationWidget | personalization_idea_generator | Content Recs, ODP |
| **UX** | User Journey Mapping | `/experience-optimization/ux/user-journey-mapping` | ExperimentationWidget | customer_journey, experiment_blueprinter | WEBX, ODP, Content Recs |
| **UX** | Interaction Analytics | `/experience-optimization/ux/interaction-analytics` | ExperimentationWidget | customer_journey | WEBX, ODP |
| **UX** | Usability Testing Results | `/experience-optimization/ux/usability-testing-results` | ExperimentationWidget | customer_journey, experiment_blueprinter | WEBX |
| **UX** | Conversion Path Optimization | `/experience-optimization/ux/conversion-path-optimization` | ExperimentationWidget | customer_journey, experiment_blueprinter | WEBX, ODP |
| **UX** | Experience Quality Metrics | `/experience-optimization/ux/experience-quality-metrics` | ExperimentationWidget | customer_journey | ODP, WEBX |
| **Technology** | Integration Architecture | `/experience-optimization/technology/integration-architecture` | ExperimentationWidget | integration_health | All DXP Tools |
| **Technology** | Platform Performance | `/experience-optimization/technology/platform-performance` | ExperimentationWidget | integration_health | All DXP Tools |
| **Technology** | API Analytics | `/experience-optimization/technology/api-analytics` | ExperimentationWidget | integration_health | All DXP Tools |
| **Technology** | Data Flow Optimization | `/experience-optimization/technology/data-flow-optimization` | ExperimentationWidget | integration_health | ODP, CMS |
| **Technology** | Technical Implementation Guide | `/experience-optimization/technology/technical-implementation-guide` | ExperimentationWidget | integration_health | All DXP Tools |

---

## 🧩 **Widget Component Mapping**

### **Primary Widgets by Tier-1:**
- **Strategy Plans** → `StrategyPlansWidget`
- **Optimizely DXP Tools** → `IntegrationHealthWidget`
- **Analytics Insights** → `EngagementAnalyticsWidget`
- **Experience Optimization** → `ExperimentationWidget`

### **Secondary Widget Components:**
- **ConfidenceGauge** - Visual confidence scoring for strategic metrics
- **KPISummaryWidget** - Executive-level KPI displays
- **RecommendationsWidget** - AI-powered strategic recommendations
- **QuickWinsWidget** - Immediate opportunity identification
- **MaturityAssessmentWidget** - Organizational maturity evaluation
- **PhaseTrackingWidget** - Multi-phase implementation progress
- **VisitorAnalyticsWidget** - Visitor behavior and engagement analysis
- **ContentPerformanceWidget** - Content effectiveness metrics
- **ExperimentMonitoringWidget** - Live experiment tracking
- **StatisticalAnalysisWidget** - Statistical significance analysis
- **AudienceEngagementWidget** - Audience-specific engagement metrics
- **TopicAnalysisWidget** - Content topic clustering and analysis
- **PersonalizationStrategyWidget** - Personalization framework and strategy
- **UserJourneyWidget** - Customer journey mapping and analysis

---

## 🔧 **OPAL Agent Distribution**

### **Core OPAL Agents:**
- **strategy_workflow** - Strategic planning and workflow management
- **content_review** - Content analysis and optimization
- **audience_suggester** - Audience segmentation and targeting
- **experiment_blueprinter** - Experimentation design and analysis
- **personalization_idea_generator** - Personalization strategy development
- **customer_journey** - Customer journey mapping and optimization
- **geo_audit** - Geographic performance analysis
- **roadmap_generator** - Strategic roadmap and timeline development
- **integration_health** - System integration monitoring
- **cmp_organizer** - Campaign management and organization

### **OPAL Tools Integration:**
- **workflow_data_sharing** - Universal data sharing across workflows
- **osa_contentrecs_tools** - Content recommendation system tools
- **osa_cmspaas_tools** - Content management system tools
- **osa_odp_tools** - Optimizely Data Platform tools
- **osa_webx_tools** - Web experimentation platform tools
- **osa_cmp_tools** - Campaign management platform tools

---

## 📊 **Data Props Mapping**

### **Strategy Plans Data:**
- `confidenceScore`, `roadmapData`, `maturityData`, `performanceMetrics`, `phaseData`
- `strategicRecommendations`, `impactAnalysis`, `quickWinOpportunities`
- `maturityAssessmentData`, `implementationPlan`

### **DXP Tools Data:**
- `integrationStatus`, `performanceData`, `freshnessMetrics`
- `visitorAnalytics`, `contentRecommendationMetrics`, `activeExperimentData`
- `contentInventoryData`, `campaignPerformance`

### **Analytics Insights Data:**
- `analyticsData`, `contentTopics`, `userInteractions`, `engagementTrends`
- `visibilityMetrics`, `semanticData`, `geoData`
- `audienceEngagementData`, `audienceSegments`, `experienceTopics`

### **Experience Optimization Data:**
- `experimentPlans`, `testResults`, `businessImpact`, `testSchedule`
- `personalizationRules`, `uxMetrics`, `userJourneyData`
- `personalizationStrategy`, `journeyTouchpoints`

---

## ⚙️ **Implementation Files**

### **Core System Files:**
- **`src/lib/tier-rendering-rules.ts`** - Main tier rendering rules and lookup functions
- **`src/lib/expanded-tier-rules.ts`** - Extended rules covering all tier combinations
- **`src/components/widgets/WidgetRenderer.tsx`** - Conditional rendering orchestrator

### **Usage Example:**
```typescript
import { findRenderingRule, getWidgetsForTier, getOPALConfig } from '@/lib/tier-rendering-rules';

// Find rule for specific URL
const rule = findRenderingRule('/engine/results/strategy-plans/osa/overview-dashboard');

// Get widgets for tier combination
const widgets = getWidgetsForTier('strategy-plans', 'osa', 'overview-dashboard');

// Get OPAL configuration
const opalConfig = getOPALConfig('strategy-plans', 'osa');
```

---

**Last Updated**: November 13, 2025
**System Coverage**: 100% - All tier combinations mapped
**Implementation Status**: ✅ Ready for integration