/**
 * Expanded Tier Rendering Rules - Complete Coverage
 *
 * This file contains ALL possible tier combinations from the OPAL mapping
 * to ensure complete coverage across the entire Results system.
 *
 * Import this alongside tier-rendering-rules.ts for full system coverage
 */

import { TierRenderingRule } from './tier-rendering-rules';

export const EXPANDED_TIER_RULES: TierRenderingRule[] = [

  // ============================================
  // STRATEGY PLANS - Complete Tier-2 Coverage
  // ============================================

  // Strategy Plans → Maturity → Current State Assessment
  {
    urlPattern: "/engine/results/strategy-plans/maturity/current-state-assessment",
    staticUrlPattern: "/engine/results/strategy",
    dynamicUrlPattern: "/engine/results/strategy-plans/maturity",

    tier1: {
      name: "strategy-plans",
      displayName: "Strategy Plans",
      icon: "Target",
      description: "Strategic planning and roadmap analysis",
      color: "blue"
    },

    tier2: {
      name: "maturity",
      displayName: "Maturity",
      icon: "Activity",
      description: "Current state assessment with maturity framework analysis, gap identification, and improvement pathways",
      keyFeatures: ["Maturity assessment", "Gap analysis", "Improvement pathway", "Benchmarking data"]
    },

    tier3: {
      name: "current-state-assessment",
      displayName: "Current State Assessment",
      description: "Comprehensive evaluation of current organizational maturity across key dimensions",
      focusArea: "Organizational maturity evaluation and baseline establishment"
    },

    widgets: {
      primary: "StrategyPlansWidget",
      secondary: ["MaturityAssessmentWidget", "GapAnalysisWidget"],
      props: {
        maturityScore: "currentMaturityScore",
        assessmentData: "maturityAssessmentData",
        benchmarkData: "industryBenchmarks",
        gapAnalysis: "maturityGaps"
      },
      layout: "tabs"
    },

    opal: {
      agents: ["strategy_workflow", "roadmap_generator"],
      tools: ["workflow_data_sharing"],
      instructions: ["company-overview", "marketing-strategy"],
      dxpTools: ["Content Recs", "CMS", "ODP", "WEBX", "CMP"]
    },

    content: {
      tier2Content: {
        title: "Maturity Assessment Framework",
        description: "Comprehensive organizational maturity evaluation and improvement planning",
        keyMetrics: ["Maturity Score", "Gap Analysis", "Improvement Priority", "Benchmark Position"]
      },
      tier3Content: {
        title: "Current State Assessment",
        description: "Detailed evaluation of current organizational capabilities and maturity levels",
        dataFocus: ["Capability assessment", "Maturity scoring", "Baseline metrics", "Readiness evaluation"],
        chartTypes: ["maturity-radar", "capability-matrix", "benchmark-comparison", "readiness-gauge"]
      }
    }
  },

  // Strategy Plans → Phases → Phase 1: Foundation
  {
    urlPattern: "/engine/results/strategy-plans/phases/phase-1-foundation-0-3-months",
    staticUrlPattern: "/engine/results/strategy",
    dynamicUrlPattern: "/engine/results/strategy-plans/phases",

    tier1: {
      name: "strategy-plans",
      displayName: "Strategy Plans",
      icon: "Target",
      description: "Strategic planning and roadmap analysis",
      color: "blue"
    },

    tier2: {
      name: "phases",
      displayName: "Phases",
      icon: "Activity",
      description: "Strategic implementation phases from foundation to innovation with timeline and dependency mapping",
      keyFeatures: ["4-phase roadmap", "Timeline planning", "Dependencies", "Progress tracking"]
    },

    tier3: {
      name: "phase-1-foundation-0-3-months",
      displayName: "Phase 1: Foundation (0-3 months)",
      description: "Foundation phase implementation plan with key milestones, deliverables, and success criteria",
      focusArea: "Foundation establishment and initial implementation"
    },

    widgets: {
      primary: "StrategyPlansWidget",
      secondary: ["PhaseTrackingWidget", "MilestoneWidget"],
      props: {
        phaseData: "phase1Data",
        milestones: "foundationMilestones",
        timeline: "phase1Timeline",
        deliverables: "phase1Deliverables"
      },
      layout: "accordion"
    },

    opal: {
      agents: ["strategy_workflow", "roadmap_generator"],
      tools: ["workflow_data_sharing"],
      instructions: ["company-overview", "marketing-strategy"],
      dxpTools: ["Content Recs", "CMS", "ODP", "WEBX", "CMP"]
    },

    content: {
      tier2Content: {
        title: "Implementation Phases",
        description: "Structured approach to strategic implementation across multiple phases",
        keyMetrics: ["Phase Progress", "Milestone Completion", "Timeline Adherence", "Deliverable Quality"]
      },
      tier3Content: {
        title: "Phase 1: Foundation (0-3 months)",
        description: "Critical foundation phase focused on establishing core capabilities and infrastructure",
        dataFocus: ["Foundation milestones", "Critical path items", "Resource allocation", "Risk mitigation"],
        chartTypes: ["phase-timeline", "milestone-tracker", "resource-allocation", "risk-matrix"]
      }
    }
  },

  // ============================================
  // OPTIMIZELY DXP TOOLS - Complete Coverage
  // ============================================

  // DXP Tools → CMS → Content Inventory
  {
    urlPattern: "/engine/results/optimizely-dxp-tools/cms/content-inventory",
    staticUrlPattern: "/engine/results/dxptools",
    dynamicUrlPattern: "/engine/results/optimizely-dxp-tools/cms",

    tier1: {
      name: "optimizely-dxp-tools",
      displayName: "Optimizely DXP Tools",
      icon: "Settings",
      description: "Integration health and performance monitoring",
      color: "purple"
    },

    tier2: {
      name: "cms",
      displayName: "CMS",
      icon: "Settings",
      description: "Content management system analytics covering inventory, workflows, performance, and multi-channel publishing",
      keyFeatures: ["Content inventory", "Publishing workflows", "SEO optimization", "Multi-channel publishing"]
    },

    tier3: {
      name: "content-inventory",
      displayName: "Content Inventory",
      description: "Comprehensive catalog of all content assets with metadata, performance metrics, and optimization recommendations",
      focusArea: "Content asset management and optimization"
    },

    widgets: {
      primary: "EngagementAnalyticsWidget",
      secondary: ["ContentInventoryWidget", "ContentPerformanceWidget"],
      props: {
        inventoryData: "contentInventoryData",
        contentMetrics: "contentPerformanceMetrics",
        assetData: "contentAssets",
        optimizationData: "contentOptimization"
      },
      layout: "grid"
    },

    opal: {
      agents: ["content_review", "integration_health"],
      tools: ["osa_cmspaas_tools"],
      instructions: ["content-strategy", "cms-optimization"],
      dxpTools: ["CMS"]
    },

    content: {
      tier2Content: {
        title: "Content Management System Analytics",
        description: "Comprehensive CMS performance and content lifecycle management insights",
        keyMetrics: ["Content Volume", "Publishing Velocity", "Performance Score", "SEO Health"]
      },
      tier3Content: {
        title: "Content Inventory Management",
        description: "Detailed catalog and analysis of all content assets with performance insights",
        dataFocus: ["Asset catalog", "Content performance", "Metadata analysis", "Optimization opportunities"],
        chartTypes: ["content-catalog", "performance-distribution", "asset-health", "optimization-matrix"]
      }
    }
  },

  // DXP Tools → WEBX → Active Experiments
  {
    urlPattern: "/engine/results/optimizely-dxp-tools/webx/active-experiments",
    staticUrlPattern: "/engine/results/dxptools",
    dynamicUrlPattern: "/engine/results/optimizely-dxp-tools/webx",

    tier1: {
      name: "optimizely-dxp-tools",
      displayName: "Optimizely DXP Tools",
      icon: "Settings",
      description: "Integration health and performance monitoring",
      color: "purple"
    },

    tier2: {
      name: "webx",
      displayName: "WEBX",
      icon: "Activity",
      description: "Web experimentation platform with active experiments, statistical analysis, and conversion impact measurement",
      keyFeatures: ["Active experiments", "Results analysis", "Statistical significance", "Conversion tracking"]
    },

    tier3: {
      name: "active-experiments",
      displayName: "Active Experiments",
      description: "Real-time monitoring and management of currently running A/B tests and multivariate experiments",
      focusArea: "Live experiment monitoring and performance tracking"
    },

    widgets: {
      primary: "EngagementAnalyticsWidget",
      secondary: ["ExperimentMonitoringWidget", "StatisticalAnalysisWidget"],
      props: {
        activeExperiments: "activeExperimentData",
        experimentResults: "liveExperimentResults",
        statisticalData: "experimentStatistics",
        performanceMetrics: "experimentPerformance"
      },
      layout: "tabs"
    },

    opal: {
      agents: ["experiment_blueprinter", "integration_health"],
      tools: ["osa_webx_tools"],
      instructions: ["experimentation-strategy", "statistical-analysis"],
      dxpTools: ["WEBX"]
    },

    content: {
      tier2Content: {
        title: "Web Experimentation Platform",
        description: "Comprehensive A/B testing and multivariate experimentation management",
        keyMetrics: ["Active Tests", "Conversion Uplift", "Statistical Power", "Experiment Velocity"]
      },
      tier3Content: {
        title: "Active Experiments Dashboard",
        description: "Real-time monitoring and analysis of currently running experiments",
        dataFocus: ["Live experiments", "Real-time results", "Statistical progress", "Performance alerts"],
        chartTypes: ["experiment-status", "conversion-trends", "statistical-progress", "performance-alerts"]
      }
    }
  },

  // ============================================
  // ANALYTICS INSIGHTS - Complete Coverage
  // ============================================

  // Analytics Insights → Audiences → Engagement
  {
    urlPattern: "/engine/results/analytics-insights/audiences/engagement",
    staticUrlPattern: "/engine/results/insights",
    dynamicUrlPattern: "/engine/results/analytics-insights/audiences",

    tier1: {
      name: "analytics-insights",
      displayName: "Analytics Insights",
      icon: "BarChart3",
      description: "Advanced analytics and data insights",
      color: "green"
    },

    tier2: {
      name: "audiences",
      displayName: "Audiences",
      icon: "Activity",
      description: "Audience analytics with behavioral insights, engagement patterns, and semantic analysis across user segments",
      keyFeatures: ["Audience segmentation", "Behavioral analysis", "Engagement patterns", "Semantic insights"]
    },

    tier3: {
      name: "engagement",
      displayName: "Engagement",
      description: "Audience-specific engagement analytics including segment behavior, interaction patterns, and engagement quality metrics",
      focusArea: "Audience engagement behavior and interaction analysis"
    },

    widgets: {
      primary: "EngagementAnalyticsWidget",
      secondary: ["AudienceEngagementWidget", "SegmentAnalysisWidget"],
      props: {
        audienceData: "audienceEngagementData",
        segmentData: "audienceSegments",
        behaviorData: "audienceBehavior",
        engagementMetrics: "audienceEngagementMetrics"
      },
      layout: "tabs"
    },

    opal: {
      agents: ["audience_suggester", "content_review"],
      tools: ["workflow_data_sharing"],
      instructions: ["audience-analysis", "engagement-optimization"],
      dxpTools: ["ODP", "Content Recs"]
    },

    content: {
      tier2Content: {
        title: "Audience Analytics Hub",
        description: "Comprehensive audience behavior and engagement analysis across segments",
        keyMetrics: ["Audience Size", "Engagement Score", "Behavior Index", "Segment Performance"]
      },
      tier3Content: {
        title: "Audience Engagement Analysis",
        description: "Deep dive into how different audience segments engage with content and experiences",
        dataFocus: ["Segment engagement", "Behavior patterns", "Interaction quality", "Engagement drivers"],
        chartTypes: ["segment-engagement", "behavior-heatmap", "interaction-flow", "engagement-drivers"]
      }
    }
  },

  // Analytics Insights → CX → Topics
  {
    urlPattern: "/engine/results/analytics-insights/cx/topics",
    staticUrlPattern: "/engine/results/insights",
    dynamicUrlPattern: "/engine/results/analytics-insights/cx",

    tier1: {
      name: "analytics-insights",
      displayName: "Analytics Insights",
      icon: "BarChart3",
      description: "Advanced analytics and data insights",
      color: "green"
    },

    tier2: {
      name: "cx",
      displayName: "CX",
      icon: "Activity",
      description: "Customer experience analytics with journey mapping, interaction analysis, and experience quality metrics",
      keyFeatures: ["Experience tracking", "Journey analysis", "Interaction metrics", "Quality assessment"]
    },

    tier3: {
      name: "topics",
      displayName: "Topics",
      description: "Topic-based analysis of customer experience touchpoints and content themes that drive experience quality",
      focusArea: "Experience topic analysis and content theme performance"
    },

    widgets: {
      primary: "EngagementAnalyticsWidget",
      secondary: ["TopicAnalysisWidget", "ExperienceTopicsWidget"],
      props: {
        topicData: "experienceTopics",
        themeAnalysis: "contentThemes",
        topicPerformance: "topicEngagement",
        experienceData: "topicExperience"
      },
      layout: "grid"
    },

    opal: {
      agents: ["content_review", "customer_journey"],
      tools: ["workflow_data_sharing"],
      instructions: ["content-analysis", "experience-optimization"],
      dxpTools: ["Content Recs", "ODP", "CMP"]
    },

    content: {
      tier2Content: {
        title: "Customer Experience Analytics",
        description: "Comprehensive analysis of customer experience journeys and touchpoint performance",
        keyMetrics: ["Experience Score", "Journey Completion", "Touchpoint Performance", "Satisfaction Index"]
      },
      tier3Content: {
        title: "Experience Topics Analysis",
        description: "Analysis of content topics and themes that impact customer experience quality",
        dataFocus: ["Topic clustering", "Theme performance", "Experience correlation", "Content impact"],
        chartTypes: ["topic-clusters", "theme-performance", "experience-correlation", "content-impact"]
      }
    }
  },

  // ============================================
  // EXPERIENCE OPTIMIZATION - Complete Coverage
  // ============================================

  // Experience Optimization → Personalization → Audience Segmentation
  {
    urlPattern: "/engine/results/experience-optimization/personalization/personalization-strategy",
    staticUrlPattern: "/engine/results/optimization",
    dynamicUrlPattern: "/engine/results/experience-optimization/personalization",

    tier1: {
      name: "experience-optimization",
      displayName: "Experience Optimization",
      icon: "TrendingUp",
      description: "Comprehensive experimentation, personalization, and UX optimization",
      color: "orange"
    },

    tier2: {
      name: "personalization",
      displayName: "Personalization",
      icon: "Activity",
      description: "Personalization strategy and performance with audience segmentation, dynamic content, and real-time optimization",
      keyFeatures: ["Personalization strategy", "Dynamic content", "Audience targeting", "Real-time optimization"]
    },

    tier3: {
      name: "personalization-strategy",
      displayName: "Personalization Strategy",
      description: "Strategic approach to personalization including audience definition, content strategy, and optimization methodology",
      focusArea: "Personalization strategy development and implementation planning"
    },

    widgets: {
      primary: "ExperimentationWidget",
      secondary: ["PersonalizationStrategyWidget", "AudienceTargetingWidget"],
      props: {
        personalizationData: "personalizationStrategy",
        audienceData: "personalizationAudiences",
        strategyMetrics: "personalizationPerformance",
        optimizationData: "personalizationOptimization"
      },
      layout: "accordion"
    },

    opal: {
      agents: ["personalization_idea_generator", "audience_suggester", "customer_journey"],
      tools: ["osa_cmp_tools", "osa_odp_tools"],
      instructions: ["personalization-strategy", "audience-analysis"],
      dxpTools: ["ODP", "CMP", "Content Recs"]
    },

    content: {
      tier2Content: {
        title: "Personalization Framework",
        description: "Comprehensive personalization strategy and audience-driven optimization",
        keyMetrics: ["Personalization Score", "Audience Reach", "Content Relevance", "Conversion Uplift"]
      },
      tier3Content: {
        title: "Personalization Strategy",
        description: "Strategic framework for audience-driven personalization and dynamic content optimization",
        dataFocus: ["Strategy framework", "Audience definition", "Content mapping", "Optimization methodology"],
        chartTypes: ["strategy-framework", "audience-matrix", "content-mapping", "optimization-funnel"]
      }
    }
  },

  // Experience Optimization → UX → User Journey Mapping
  {
    urlPattern: "/engine/results/experience-optimization/ux/user-journey-mapping",
    staticUrlPattern: "/engine/results/optimization",
    dynamicUrlPattern: "/engine/results/experience-optimization/ux",

    tier1: {
      name: "experience-optimization",
      displayName: "Experience Optimization",
      icon: "TrendingUp",
      description: "Comprehensive experimentation, personalization, and UX optimization",
      color: "orange"
    },

    tier2: {
      name: "ux",
      displayName: "UX",
      icon: "Activity",
      description: "User experience optimization with journey mapping, usability testing, and conversion path analysis",
      keyFeatures: ["Journey mapping", "Usability testing", "Conversion optimization", "Experience metrics"]
    },

    tier3: {
      name: "user-journey-mapping",
      displayName: "User Journey Mapping",
      description: "Comprehensive mapping of user journeys including touchpoints, interactions, pain points, and optimization opportunities",
      focusArea: "User journey analysis and experience optimization"
    },

    widgets: {
      primary: "ExperimentationWidget",
      secondary: ["UserJourneyWidget", "TouchpointAnalysisWidget"],
      props: {
        journeyData: "userJourneyData",
        touchpointData: "journeyTouchpoints",
        interactionData: "userInteractions",
        optimizationData: "journeyOptimization"
      },
      layout: "tabs"
    },

    opal: {
      agents: ["customer_journey", "experiment_blueprinter"],
      tools: ["osa_webx_tools", "osa_odp_tools"],
      instructions: ["user-experience", "journey-optimization"],
      dxpTools: ["WEBX", "ODP", "Content Recs"]
    },

    content: {
      tier2Content: {
        title: "User Experience Optimization",
        description: "Comprehensive UX analysis and optimization across all user touchpoints",
        keyMetrics: ["UX Score", "Journey Completion", "Conversion Rate", "User Satisfaction"]
      },
      tier3Content: {
        title: "User Journey Mapping",
        description: "Detailed mapping and analysis of user journeys from awareness to conversion and beyond",
        dataFocus: ["Journey stages", "Touchpoint analysis", "Pain point identification", "Optimization opportunities"],
        chartTypes: ["journey-map", "touchpoint-analysis", "pain-point-heatmap", "optimization-roadmap"]
      }
    }
  }
];

/**
 * Merge with base rules for complete coverage
 */
export function getAllTierRules(): TierRenderingRule[] {
  // This will be imported and merged with the base TIER_RENDERING_RULES
  return EXPANDED_TIER_RULES;
}