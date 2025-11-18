# Content Recommendations Mapping - Current State & Future Blueprint

**Document Version**: 1.0
**Created**: 2024-11-18
**Scope**: Content Recommendations Results Page Mapping Analysis and Enhancement Plan

---

## Executive Summary

This document provides comprehensive mapping of Content Recommendations Results pages, their current OPAL agent assignments, and the blueprint for enhanced content optimization. It serves as the foundation for implementing the canonical `config/resultsMapping.ts` configuration.

### Mapping Overview
- **Primary Section**: Optimizely DXP Tools → Content Recommendations
- **Current Pages**: 1 primary dashboard with 4 sub-dashboards
- **OPAL Tools**: 11 specialized Content Recommendations tools
- **Widget System**: Multi-tab dashboard with audience segmentation
- **Enhancement Target**: Unique, context-appropriate content per Results page

---

## 1. Current Content Recommendations Results Structure

### 1.1 URL Hierarchy and Routing
```
Content Recommendations Results Hierarchy:

/engine/results/optimizely-dxp-tools/content-recs/
└── visitor-analytics-dashboard (Primary Page)
    ├── content-dashboard (Tab 1)
    ├── insight-dashboard (Tab 2)
    ├── topic-performance (Tab 3)
    └── engage-dashboard (Tab 4)

URL Analysis:
✅ SEO-friendly base structure
✅ Clear DXP Tools categorization
✅ Content Recs namespace properly defined
⚠️ Tab-based navigation (not separate URLs) may limit granular analytics
```

### 1.2 Widget and Component Mapping
```
Component Architecture:
ContentRecommendationsDashboardWidget (src/components/widgets/)
├── Primary Container: visitor-analytics-dashboard
├── Tab System: Radix UI Tabs implementation
├── Base Component: ResultsPageBase
├── Data Source: transformContentRecsDashboardData()
├── Validation: useLanguageRules hook
└── Caching: React Query integration

Content Dashboard Tab:
├── Content quality analysis display
├── SEO readiness assessment
├── Performance benchmarking widgets
└── Content catalog overview

Insight Dashboard Tab:
├── Audience segment analysis
├── Personalization opportunity display
├── Content gap identification
└── Persona-specific insights

Topic Performance Tab:
├── Topic-specific analytics widgets
├── Performance trending visualizations
├── Content recommendations by topic
└── Topic engagement metrics

Engage Dashboard Tab:
├── Engagement strategy recommendations
├── Content optimization suggestions
├── Audience engagement metrics
└── Conversion optimization insights
```

---

## 2. Current OPAL Agent Assignments

### 2.1 Content Recommendations OPAL Tools (11 Tools)
```
OPAL Tool Configuration: osa_contentrecs_tools.json

Primary Content Analysis Tools:
├── osa_analyze_website_content
│   ├── Purpose: Content quality and SEO analysis
│   ├── Data Output: Content quality scores, SEO recommendations
│   ├── Dashboard Usage: Content Dashboard (primary), SEO insights
│   └── Update Frequency: Daily batch + on-demand

├── assess_content_performance
│   ├── Purpose: Performance metric evaluation
│   ├── Data Output: Performance reports, trending indicators
│   ├── Dashboard Usage: Topic Performance, Engage Dashboard
│   └── Update Frequency: Hourly for performance metrics

└── get_available_content_catalog
    ├── Purpose: Content inventory and categorization
    ├── Data Output: Structured content catalog
    ├── Dashboard Usage: All dashboards (foundation data)
    └── Update Frequency: Daily refresh

Personalization and Optimization Tools:
├── identify_personalization_opportunities
│   ├── Purpose: Segment-based personalization insights
│   ├── Data Output: Personalization recommendations
│   ├── Dashboard Usage: Insight Dashboard (primary)
│   └── Update Frequency: 4-hour refresh cycle

├── generate_content_recommendations
│   ├── Purpose: Content optimization recommendations
│   ├── Data Output: Prioritized recommendations with rationale
│   ├── Dashboard Usage: Engage Dashboard (primary), Content Dashboard
│   └── Update Frequency: On-demand + scheduled refresh

├── create_content_matrix
│   ├── Purpose: Content-to-audience mapping
│   ├── Data Output: Content matrix with audience alignment
│   ├── Dashboard Usage: Insight Dashboard, Topic Performance
│   └── Update Frequency: Daily audience analysis

└── optimize_content_for_seo
    ├── Purpose: SEO optimization suggestions
    ├── Data Output: SEO improvement recommendations
    ├── Dashboard Usage: Content Dashboard (primary)
    └── Update Frequency: Weekly SEO analysis

Specialized Query Tools:
├── get_content_recommendations_by_topic
│   ├── Purpose: Topic-filtered recommendations
│   ├── Data Output: Topic-specific recommendation sets
│   ├── Dashboard Usage: Topic Performance (primary)
│   └── Update Frequency: Real-time filtering

├── get_content_recommendations_by_section
│   ├── Purpose: Section-filtered recommendations
│   ├── Data Output: Section-specific recommendation sets
│   ├── Dashboard Usage: Content Dashboard organization
│   └── Update Frequency: Real-time filtering

├── generate_tier_based_content_data
│   ├── Purpose: Tier-specific data structuring
│   ├── Data Output: Tier-appropriate data formats
│   ├── Dashboard Usage: All dashboards (data structuring)
│   └── Update Frequency: On-demand transformation

└── refresh_content_recommendations_cache
    ├── Purpose: Cache management and optimization
    ├── Data Output: Cache status and performance metrics
    ├── Dashboard Usage: System performance (background)
    └── Update Frequency: Intelligent cache invalidation
```

### 2.2 Results-Content-Optimizer Agent Integration
```
Current results-content-optimizer Role:
├── Data Input: All 11 OPAL tool outputs
├── Transformation: Raw OPAL data → structured Results content
├── Validation: Language rules compliance enforcement
├── Confidence Scoring: Data reliability assessment
├── Fallback Generation: Simulated content when data unavailable
└── Output Format: ResultsPageBase compatible structure

Enhancement Opportunities:
├── Content Uniqueness: Ensure distinctive content per dashboard tab
├── Contextual Adaptation: Tab-specific content optimization
├── Performance Optimization: Reduce transformation overhead
├── Real-time Updates: Improved data freshness handling
└── Monitoring Integration: Health status reporting
```

---

## 3. Content Mapping Analysis

### 3.1 Current Content Distribution
```
Content Dashboard (Tab 1):
Primary Focus: Content Quality and SEO
├── OPAL Data Sources:
│   ├── osa_analyze_website_content (primary)
│   ├── assess_content_performance (secondary)
│   ├── optimize_content_for_seo (primary)
│   └── get_available_content_catalog (foundation)
├── Content Types:
│   ├── Content quality metrics and scoring
│   ├── SEO readiness assessment
│   ├── Performance benchmarking data
│   └── Content catalog overview
└── Unique Value: Technical content optimization focus

Insight Dashboard (Tab 2):
Primary Focus: Audience and Personalization
├── OPAL Data Sources:
│   ├── identify_personalization_opportunities (primary)
│   ├── create_content_matrix (primary)
│   ├── assess_content_performance (context)
│   └── get_available_content_catalog (foundation)
├── Content Types:
│   ├── Audience segment analysis
│   ├── Personalization opportunities
│   ├── Content gap identification
│   └── Persona-specific insights
└── Unique Value: Strategic personalization insights

Topic Performance (Tab 3):
Primary Focus: Topic-Specific Analytics
├── OPAL Data Sources:
│   ├── get_content_recommendations_by_topic (primary)
│   ├── assess_content_performance (primary)
│   ├── create_content_matrix (context)
│   └── get_available_content_catalog (foundation)
├── Content Types:
│   ├── Topic-specific performance metrics
│   ├── Content performance trending
│   ├── Topic-based recommendations
│   └── Topic engagement analysis
└── Unique Value: Granular topic-level insights

Engage Dashboard (Tab 4):
Primary Focus: Engagement and Optimization
├── OPAL Data Sources:
│   ├── generate_content_recommendations (primary)
│   ├── identify_personalization_opportunities (secondary)
│   ├── assess_content_performance (context)
│   └── optimize_content_for_seo (secondary)
├── Content Types:
│   ├── Engagement optimization strategies
│   ├── Content enhancement suggestions
│   ├── Audience engagement metrics
│   └── Conversion optimization insights
└── Unique Value: Actionable engagement strategies
```

### 3.2 Content Uniqueness Assessment
```
Current Uniqueness Status:
✅ Dashboard tabs have distinct primary OPAL tool assignments
✅ Each tab serves different user needs and workflows
✅ Data transformation creates tab-specific content structures
⚠️ Some foundation data (catalog, performance) used across multiple tabs
❌ Risk of similar insights appearing in multiple dashboards
❌ No explicit content uniqueness validation

Enhancement Requirements:
├── Implement content fingerprinting to detect duplicate insights
├── Add tab-specific content generation rules
├── Create unique value propositions for each dashboard
├── Establish content overlap thresholds and monitoring
└── Implement cross-tab content deduplication logic
```

---

## 4. Future Canonical Mapping Blueprint

### 4.1 Enhanced Results Mapping Structure
```typescript
// Future config/resultsMapping.ts structure for Content Recs

interface ContentRecsMapping {
  routePattern: '/engine/results/optimizely-dxp-tools/content-recs/visitor-analytics-dashboard';
  sectionGroup: 'optimizely-dxp-tools';
  primaryTopic: 'content';

  // Sub-dashboard mappings
  subPages: {
    contentDashboard: {
      primaryAgents: ['osa_analyze_website_content', 'optimize_content_for_seo'];
      secondaryAgents: ['assess_content_performance'];
      uniqueValueProp: 'Technical content quality and SEO optimization';
      widgets: ['ContentQualityWidget', 'SEOReadinessWidget', 'PerformanceBenchmarkWidget'];
    };

    insightDashboard: {
      primaryAgents: ['identify_personalization_opportunities', 'create_content_matrix'];
      secondaryAgents: ['assess_content_performance'];
      uniqueValueProp: 'Strategic audience personalization insights';
      widgets: ['PersonalizationWidget', 'AudienceSegmentWidget', 'ContentGapWidget'];
    };

    topicPerformance: {
      primaryAgents: ['get_content_recommendations_by_topic', 'assess_content_performance'];
      secondaryAgents: ['create_content_matrix'];
      uniqueValueProp: 'Granular topic-level performance analytics';
      widgets: ['TopicAnalyticsWidget', 'TopicTrendingWidget', 'TopicRecsWidget'];
    };

    engageDashboard: {
      primaryAgents: ['generate_content_recommendations'];
      secondaryAgents: ['identify_personalization_opportunities', 'optimize_content_for_seo'];
      uniqueValueProp: 'Actionable engagement optimization strategies';
      widgets: ['EngagementStrategyWidget', 'ContentOptimizationWidget', 'ConversionWidget'];
    };
  };

  dxpSources: ['content-recs'];
  fallbackPolicyId: 'content-recs-standard';
  contentUniquenessRules: {
    crossTabDuplication: 'prevent';
    insightOverlapThreshold: 0.3;
    recommendationDedupe: true;
  };
}
```

### 4.2 Content Optimization Rules
```typescript
// Enhanced content generation rules for results-content-optimizer

interface ContentRecsOptimizationRules {
  contentDashboard: {
    mandatoryElements: ['content_quality_score', 'seo_readiness', 'performance_benchmark'];
    prohibitedContent: ['audience_insights', 'engagement_strategies'];
    uniquenessThreshold: 0.8;
    confidenceMinimum: 70;
  };

  insightDashboard: {
    mandatoryElements: ['personalization_opportunities', 'audience_segments', 'content_gaps'];
    prohibitedContent: ['technical_seo', 'performance_benchmarks'];
    uniquenessThreshold: 0.8;
    confidenceMinimum: 65;
  };

  topicPerformance: {
    mandatoryElements: ['topic_analytics', 'performance_trends', 'topic_recommendations'];
    prohibitedContent: ['generic_insights', 'broad_audience_data'];
    uniquenessThreshold: 0.9;
    confidenceMinimum: 75;
  };

  engageDashboard: {
    mandatoryElements: ['engagement_strategies', 'optimization_actions', 'conversion_insights'];
    prohibitedContent: ['technical_analysis', 'content_quality_metrics'];
    uniquenessThreshold: 0.8;
    confidenceMinimum: 70;
  };
}
```

---

## 5. Implementation Priorities

### 5.1 Phase 1 Enhancement Targets
```
Priority 1: Unique Widget ID System
├── Target: Add unique IDs to all dashboard tab wrapper divs
├── Pattern: content-recs-{dashboard-name}-{widget-type}-{unique-id}
├── Implementation: Enhance ContentRecommendationsDashboardWidget
└── Validation: Automated ID uniqueness verification

Priority 2: Console Cleanup
├── Target: Remove development logging and notification overlays
├── Components: ContentRecommendationsDashboardWidget, base components
├── Implementation: Environment-aware logging patterns
└── Validation: Production console monitoring

Priority 3: URL Optimization
├── Target: Ensure all Content Recs routes are SEO-friendly
├── Current: visitor-analytics-dashboard (good)
├── Enhancement: Validate no special characters in nested routes
└── Implementation: URL slug optimization utility

Priority 4: Performance Optimization
├── Target: Optimize data transformation pipeline
├── Focus: transformContentRecsDashboardData() method
├── Implementation: Parallel processing, intelligent caching
└── Validation: Performance monitoring and benchmarking
```

### 5.2 Phase 2+ Enhancement Roadmap
```
Advanced Content Optimization:
├── Content uniqueness validation across dashboard tabs
├── Real-time health monitoring for OPAL pipeline
├── Enhanced personalization based on user segments
├── Predictive content recommendations
└── Advanced performance analytics and alerting

Extensibility Preparation:
├── Generic patterns for other DXP tools (CMS, ODP, WebX, CMP)
├── Scalable admin dashboard architecture
├── Reusable content optimization components
├── Standardized OPAL agent integration patterns
└── Comprehensive testing and validation frameworks
```

---

## 6. Success Metrics and Validation

### 6.1 Content Quality Metrics
```
Content Uniqueness Validation:
├── Cross-tab content similarity score < 30%
├── Unique insights per dashboard tab ≥ 80%
├── Recommendation deduplication effectiveness > 95%
└── User-perceived content distinctiveness > 90%

Performance and Reliability:
├── Dashboard load time improvement ≥ 20%
├── OPAL data freshness < 4 hours
├── Fallback content usage < 10%
└── User confidence score > 85%
```

### 6.2 Technical Implementation Metrics
```
Implementation Quality:
├── Widget unique ID coverage = 100%
├── Console error reduction ≥ 95%
├── SEO-friendly URL compliance = 100%
└── Performance regression = 0%

Integration Health:
├── OPAL tool success rate > 95%
├── Data transformation reliability > 98%
├── Cache hit ratio > 80%
└── Error recovery effectiveness > 90%
```

---

## Conclusion

The Content Recommendations mapping analysis reveals a sophisticated multi-dashboard system with comprehensive OPAL integration. The current architecture provides an excellent foundation for the Results Content Optimizer enhancements, with clear pathways for implementing unique content generation, performance optimization, and comprehensive health monitoring.

**Key Opportunities**: Content uniqueness validation, performance optimization, enhanced monitoring, and extensible patterns for future DXP tools.

**Implementation Readiness**: High - Strong existing architecture ready for targeted enhancements in Phase 1.

**Mapping Maturity Score**: 8.3/10 - Well-structured system ready for optimization and monitoring enhancements.