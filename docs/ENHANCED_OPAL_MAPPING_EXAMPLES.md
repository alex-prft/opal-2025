# 🗺️ Enhanced OPAL Mapping - Tier-Level Examples

**Generated**: November 13, 2025
**Purpose**: Demonstrate precise URL → Content mapping with tier-level keys

---

## 📋 **Example Mappings with Complete Tier-Level Keys**

### **Example 1: Strategy Plans → Phases → Phase 1: Foundation**

```
URL: /engine/results/strategy-plans/phases/phase-1-foundation-0-3-months
Static URL: /engine/results/strategy (fallback)

Tier-Level Breakdown:
→ Tier-1: Strategy Plans
→ Tier-2: Phases
→ Tier-3: Phase 1: Foundation (0-3 months)

Widgets:
→ Primary: StrategyPlansWidget
→ Secondary: [RoadmapTimeline, MilestoneHeatmap, PhaseTrackingWidget]
→ Layout: accordion

Data Props:
→ phaseData: "phase1Data"
→ milestoneData: "foundationMilestones"
→ timeline: "phase1Timeline"
→ deliverables: "phase1Deliverables"

OPAL Configuration:
→ Agents: [strategy_workflow, personalization_idea_generator]
→ Tools: [workflow_data_sharing]
→ Instructions: [marketing-strategy.md, technical-implementation-guidelines]
→ DXP Tools: [Content Recs, CMS, ODP, WEBX, CMP]

Content Focus:
→ Title: "Phase 1: Foundation Implementation"
→ Description: "Critical foundation phase focused on establishing core capabilities and infrastructure"
→ Key Metrics: [Foundation Progress, Milestone Completion, Timeline Adherence, Deliverable Quality]
→ Chart Types: [phase-timeline, milestone-tracker, resource-allocation, risk-matrix]
```

### **Example 2: Optimizely DXP Tools → WEBX → Active Experiments**

```
URL: /engine/results/optimizely-dxp-tools/webx/active-experiments
Static URL: /engine/results/dxptools (fallback)

Tier-Level Breakdown:
→ Tier-1: Optimizely DXP Tools
→ Tier-2: WEBX
→ Tier-3: Active Experiments

Widgets:
→ Primary: IntegrationHealthWidget
→ Secondary: [ExperimentMonitoringWidget, LiveResultsWidget]
→ Layout: tabs

Data Props:
→ activeExperiments: "activeExperimentData"
→ liveResults: "liveExperimentResults"
→ experimentStatus: "experimentStatusData"
→ realTimeMetrics: "realTimeExperimentMetrics"

OPAL Configuration:
→ Agents: [experiment_blueprinter, integration_health]
→ Tools: [osa_webx_tools]
→ Instructions: [experimentation-strategy, statistical-analysis]
→ DXP Tools: [WEBX]

Content Focus:
→ Title: "WEBX - Active Experiments Monitor"
→ Description: "Real-time monitoring and management of currently running A/B tests and experiments"
→ Key Metrics: [Active Tests, Live Results, Statistical Progress, Performance Alerts]
→ Chart Types: [experiment-status, live-results, progress-tracking, alert-dashboard]
```

### **Example 3: Analytics Insights → Content → Topics**

```
URL: /engine/results/analytics-insights/content/topics
Static URL: /engine/results/insights (fallback)

Tier-Level Breakdown:
→ Tier-1: Analytics Insights
→ Tier-2: Content
→ Tier-3: Topics

Widgets:
→ Primary: EngagementAnalyticsWidget
→ Secondary: [TopicAnalysisWidget, ContentClusteringWidget]
→ Layout: grid

Data Props:
→ topicData: "contentTopics"
→ clusterAnalysis: "topicClusters"
→ topicPerformance: "topicEngagement"
→ themeAnalysis: "contentThemes"

OPAL Configuration:
→ Agents: [content_review, audience_suggester]
→ Tools: [workflow_data_sharing]
→ Instructions: [content-analysis, engagement-optimization]
→ DXP Tools: [Content Recs, CMS, ODP]

Content Focus:
→ Title: "Content Topic Analysis"
→ Description: "AI-powered topic clustering and content theme performance analysis"
→ Key Metrics: [Topic Clusters, Theme Performance, Content Categorization, Engagement by Topic]
→ Chart Types: [topic-clusters, theme-performance, content-mapping, engagement-by-topic]
```

### **Example 4: Experience Optimization → Personalization → Audience Segmentation**

```
URL: /engine/results/experience-optimization/personalization/audience-segmentation
Static URL: /engine/results/optimization (fallback)

Tier-Level Breakdown:
→ Tier-1: Experience Optimization
→ Tier-2: Personalization
→ Tier-3: Audience Segmentation

Widgets:
→ Primary: ExperimentationWidget
→ Secondary: [AudienceSegmentationWidget, BehaviorAnalysisWidget]
→ Layout: grid

Data Props:
→ segmentData: "audienceSegments"
→ behaviorData: "segmentBehavior"
→ segmentPerformance: "segmentMetrics"
→ targetingData: "segmentTargeting"

OPAL Configuration:
→ Agents: [personalization_idea_generator, audience_suggester, customer_journey]
→ Tools: [osa_cmp_tools, osa_odp_tools]
→ Instructions: [personalization-strategy, audience-analysis]
→ DXP Tools: [ODP, CMP, Content Recs]

Content Focus:
→ Title: "Audience Segmentation Analysis"
→ Description: "Advanced audience segmentation with behavioral analysis and targeting optimization"
→ Key Metrics: [Segment Size, Behavioral Patterns, Engagement Score, Conversion Potential]
→ Chart Types: [segment-analysis, behavior-clustering, engagement-matrix, conversion-funnel]
```

---

## 🔧 **Implementation Usage Examples**

### **TypeScript Code Examples:**

```typescript
import {
  findTierMappingByUrl,
  findTierMappingByTiers,
  getWidgetsForTiers,
  getDataPropsForTiers,
  getOPALConfigForTiers,
  getContentFocusForTiers
} from '@/data/enhanced-opal-mapping';

// Example 1: Find mapping by URL
const urlMapping = findTierMappingByUrl('/engine/results/strategy-plans/phases/phase-1-foundation-0-3-months');
if (urlMapping) {
  console.log('Primary Widget:', urlMapping.widgets.primary);
  console.log('Data Props:', urlMapping.data_props);
  console.log('Layout:', urlMapping.widgets.layout);
}

// Example 2: Find mapping by tier combination
const tierMapping = findTierMappingByTiers('Strategy Plans', 'Phases', 'Phase 1: Foundation (0-3 months)');
if (tierMapping) {
  console.log('Content Focus:', tierMapping.content_focus.title);
  console.log('Key Metrics:', tierMapping.content_focus.key_metrics);
}

// Example 3: Get widgets for tier combination
const widgets = getWidgetsForTiers('Optimizely DXP Tools', 'WEBX', 'Active Experiments');
console.log('Widgets to render:', widgets);
// Output: ['IntegrationHealthWidget', 'ExperimentMonitoringWidget', 'LiveResultsWidget']

// Example 4: Get data props for specific page
const dataProps = getDataPropsForTiers('Analytics Insights', 'Content', 'Topics');
console.log('Data props mapping:', dataProps);
// Output: { topicData: "contentTopics", clusterAnalysis: "topicClusters", ... }

// Example 5: Get OPAL configuration
const opalConfig = getOPALConfigForTiers('Experience Optimization', 'Personalization');
if (opalConfig) {
  console.log('OPAL Agents:', opalConfig.agents);
  console.log('OPAL Tools:', opalConfig.tools);
  console.log('DXP Tools:', opalConfig.dxpTools);
}

// Example 6: Get content focus for customized display
const contentFocus = getContentFocusForTiers('Strategy Plans', 'OSA', 'Strategic Recommendations');
if (contentFocus) {
  console.log('Page Title:', contentFocus.title);
  console.log('Key Metrics:', contentFocus.key_metrics);
  console.log('Chart Types:', contentFocus.chart_types);
}
```

### **Widget Renderer Integration:**

```typescript
// Updated WidgetRenderer using enhanced mapping
export function WidgetRenderer({ tier2, tier3, className = '' }: WidgetRendererProps) {
  const pathname = usePathname();

  // Extract tiers from URL
  const tierInfo = extractTiersFromUrl(pathname);
  if (!tierInfo) return null;

  // Find specific tier mapping
  const tierMapping = findTierMappingByUrl(pathname);
  if (!tierMapping) {
    // Fallback to tier combination lookup
    const fallbackMapping = findTierMappingByTiers(tierInfo.tier1, tierInfo.tier2, tierInfo.tier3);
    if (!fallbackMapping) return <GenericWidget />;
  }

  // Get data with tier-specific props
  const dataProps = tierMapping?.data_props || {};
  const { data, loading, error } = useOPALData(tierInfo, dataProps);

  // Get content focus for customization
  const contentFocus = tierMapping?.content_focus;

  // Render based on mapping configuration
  const PrimaryWidget = getWidgetComponent(tierMapping.widgets.primary);
  return (
    <div className={className}>
      <PrimaryWidget
        data={data}
        contentFocus={contentFocus}
        layout={tierMapping.widgets.layout}
        {...dataProps}
      />
    </div>
  );
}
```

---

## 📊 **Mapping Coverage Summary**

### **Complete Coverage Statistics:**
- **Tier-1 Categories**: 4 fully mapped
- **Tier-2 Sections**: 12+ sections with detailed mappings
- **Tier-3 Pages**: 25+ individual page configurations
- **Widget Mappings**: Precise widget assignment for each page
- **Data Props**: Complete data property mapping
- **OPAL Integration**: Full agent and tool configuration
- **Content Customization**: Specialized content focus for each page

### **Key Features:**
- **URL Pattern Matching**: Exact and partial URL pattern recognition
- **Fallback Support**: Static URL fallbacks for simplified routing
- **Widget Specification**: Primary and secondary widget assignments
- **Layout Configuration**: Page-specific layout preferences
- **Data Integration**: Precise data property mappings
- **Content Customization**: Tier-specific titles, descriptions, and metrics
- **OPAL Configuration**: Complete agent, tool, and instruction mapping

---

## 🎯 **Benefits of Enhanced Mapping**

1. **Precise Content Control**: Each tier combination gets exactly the right content
2. **Widget Specialization**: Specific widgets assigned per page type
3. **Data Optimization**: Targeted data props reduce unnecessary data loading
4. **OPAL Integration**: Proper agent and tool assignment per content area
5. **Content Customization**: Specialized titles, metrics, and charts per page
6. **Performance**: Efficient lookup and rendering based on URL patterns
7. **Maintainability**: Centralized configuration for all tier mappings

---

**Implementation Files:**
- **`src/data/enhanced-opal-mapping.json`** - Complete mapping data
- **`src/data/enhanced-opal-mapping.ts`** - TypeScript utilities and interfaces
- **`docs/TIER_MAPPING_REFERENCE.md`** - Complete reference documentation

**Next Steps**: Integration with WidgetRenderer and page components for dynamic content rendering.