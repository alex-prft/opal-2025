/**
 * Tier-Level Rendering Rules System
 *
 * Comprehensive mapping that links:
 * URL → Tier-1 → Tier-2 → Tier-3 → Widgets → Data Props → OPAL Config
 *
 * This is the definitive source for all content rendering logic across the OPAL Results system.
 */

export interface TierRenderingRule {
  // URL Routing
  urlPattern: string;
  staticUrlPattern?: string; // For pages like /strategy, /dxptools
  dynamicUrlPattern?: string; // For pages like /strategy-plans/osa

  // Tier Classification
  tier1: {
    name: string;
    displayName: string;
    icon: string;
    description: string;
    color: string;
  };

  tier2: {
    name: string;
    displayName: string;
    icon: string;
    description: string;
    keyFeatures: string[];
  };

  tier3: {
    name: string;
    displayName: string;
    description: string;
    focusArea: string;
  };

  // Widget Configuration
  widgets: {
    primary: string; // Main widget component
    secondary?: string[]; // Additional widgets for tier3
    props: Record<string, string>; // Data prop mappings
    layout: 'tabs' | 'grid' | 'accordion' | 'cards';
  };

  // OPAL Configuration
  opal: {
    agents: string[];
    tools: string[];
    instructions: string[];
    dxpTools: string[];
  };

  // Content Customization
  content: {
    tier2Content: {
      title: string;
      description: string;
      keyMetrics: string[];
    };
    tier3Content: {
      title: string;
      description: string;
      dataFocus: string[];
      chartTypes: string[];
    };
  };
}

// Import expanded rules for complete coverage
import { EXPANDED_TIER_RULES } from './expanded-tier-rules';

/**
 * Complete Tier-Level Rendering Rules
 * Maps all possible URL combinations to their appropriate content and widgets
 */
export const BASE_TIER_RENDERING_RULES: TierRenderingRule[] = [

  // ============================================
  // STRATEGY PLANS - Tier 1 Category
  // ============================================

  // Strategy Plans → OSA (Tier-2) → Overview Dashboard (Tier-3)
  {
    urlPattern: "/engine/results/strategy-plans/osa/overview-dashboard",
    staticUrlPattern: "/engine/results/strategy",
    dynamicUrlPattern: "/engine/results/strategy-plans/osa",

    tier1: {
      name: "strategy-plans",
      displayName: "Strategy Plans",
      icon: "Target",
      description: "Comprehensive strategic planning and roadmap analysis for Optimizely implementation",
      color: "blue"
    },

    tier2: {
      name: "osa",
      displayName: "OSA",
      icon: "BarChart3",
      description: "Comprehensive Optimizely Site Analytics with strategic insights, performance metrics, and data quality assessments",
      keyFeatures: ["Strategic recommendations", "Performance tracking", "Data quality scoring", "Workflow analysis"]
    },

    tier3: {
      name: "overview-dashboard",
      displayName: "Overview Dashboard",
      description: "High-level strategic overview with key performance indicators and executive summary",
      focusArea: "Executive KPIs and strategic summary"
    },

    widgets: {
      primary: "StrategyPlansWidget",
      secondary: ["ConfidenceGauge", "KPISummaryWidget"],
      props: {
        confidenceScore: "confidenceScore",
        roadmapData: "roadmapData",
        maturityData: "maturityData",
        performanceMetrics: "performanceMetrics",
        overviewMetrics: "overviewMetrics"
      },
      layout: "tabs"
    },

    opal: {
      agents: ["strategy_workflow"],
      tools: ["workflow_data_sharing"],
      instructions: ["company-overview", "marketing-strategy"],
      dxpTools: ["Content Recs", "CMS", "ODP", "WEBX", "CMP"]
    },

    content: {
      tier2Content: {
        title: "Strategic Analytics Overview",
        description: "Comprehensive strategic insights powered by Optimizely Site Analytics",
        keyMetrics: ["Confidence Score", "Strategic Alignment", "Performance Index", "Implementation Progress"]
      },
      tier3Content: {
        title: "Executive Dashboard",
        description: "High-level strategic KPIs and performance summary for executive review",
        dataFocus: ["Strategic KPIs", "Confidence metrics", "Progress indicators", "Executive summary"],
        chartTypes: ["confidence-gauge", "kpi-cards", "progress-bars", "trend-lines"]
      }
    }
  },

  // Strategy Plans → OSA → Strategic Recommendations
  {
    urlPattern: "/engine/results/strategy-plans/osa/strategic-recommendations",
    staticUrlPattern: "/engine/results/strategy",
    dynamicUrlPattern: "/engine/results/strategy-plans/osa",

    tier1: {
      name: "strategy-plans",
      displayName: "Strategy Plans",
      icon: "Target",
      description: "Strategic planning and roadmap analysis",
      color: "blue"
    },

    tier2: {
      name: "osa",
      displayName: "OSA",
      icon: "BarChart3",
      description: "Optimizely Site Analytics insights",
      keyFeatures: ["Strategic recommendations", "Performance tracking", "Data quality scoring", "Workflow analysis"]
    },

    tier3: {
      name: "strategic-recommendations",
      displayName: "Strategic Recommendations",
      description: "AI-powered strategic recommendations based on data analysis and best practices",
      focusArea: "Strategic recommendations and optimization opportunities"
    },

    widgets: {
      primary: "StrategyPlansWidget",
      secondary: ["RecommendationsWidget", "ImpactAnalysisWidget"],
      props: {
        recommendations: "strategicRecommendations",
        impactAnalysis: "impactAnalysis",
        priorityMatrix: "priorityMatrix",
        implementationPlan: "implementationPlan"
      },
      layout: "cards"
    },

    opal: {
      agents: ["strategy_workflow", "roadmap_generator"],
      tools: ["workflow_data_sharing"],
      instructions: ["company-overview", "marketing-strategy"],
      dxpTools: ["Content Recs", "CMS", "ODP", "WEBX", "CMP"]
    },

    content: {
      tier2Content: {
        title: "Strategic Recommendations Engine",
        description: "AI-powered recommendations for strategic optimization",
        keyMetrics: ["Recommendation Score", "Implementation Priority", "Expected Impact", "Success Probability"]
      },
      tier3Content: {
        title: "Strategic Recommendations",
        description: "Detailed strategic recommendations with implementation guidance and impact analysis",
        dataFocus: ["Recommendation priorities", "Implementation roadmap", "Impact assessment", "Success metrics"],
        chartTypes: ["priority-matrix", "impact-charts", "implementation-timeline", "success-probability"]
      }
    }
  },

  // Strategy Plans → Quick Wins (Tier-2) → Immediate Opportunities (Tier-3)
  {
    urlPattern: "/engine/results/strategy-plans/quick-wins/immediate-opportunities",
    staticUrlPattern: "/engine/results/strategy",
    dynamicUrlPattern: "/engine/results/strategy-plans/quick-wins",

    tier1: {
      name: "strategy-plans",
      displayName: "Strategy Plans",
      icon: "Target",
      description: "Strategic planning and roadmap analysis",
      color: "blue"
    },

    tier2: {
      name: "quick-wins",
      displayName: "Quick Wins",
      icon: "TrendingUp",
      description: "Immediate optimization opportunities with 30-day implementation roadmaps and expected impact analysis",
      keyFeatures: ["Immediate opportunities", "30-day roadmap", "Resource planning", "Impact metrics"]
    },

    tier3: {
      name: "immediate-opportunities",
      displayName: "Immediate Opportunities",
      description: "High-impact, low-effort optimization opportunities that can be implemented immediately",
      focusArea: "Quick implementation wins with immediate ROI"
    },

    widgets: {
      primary: "StrategyPlansWidget",
      secondary: ["QuickWinsWidget", "OpportunityMatrix"],
      props: {
        quickWins: "quickWinOpportunities",
        impactMatrix: "impactEffortMatrix",
        implementationPlan: "quickImplementationPlan",
        roi: "quickWinROI"
      },
      layout: "grid"
    },

    opal: {
      agents: ["strategy_workflow", "roadmap_generator"],
      tools: ["workflow_data_sharing"],
      instructions: ["company-overview", "marketing-strategy"],
      dxpTools: ["Content Recs", "CMS", "ODP", "WEBX", "CMP"]
    },

    content: {
      tier2Content: {
        title: "Quick Wins Identification",
        description: "Immediate optimization opportunities with fast implementation",
        keyMetrics: ["Implementation Time", "Expected Impact", "Resource Required", "Success Probability"]
      },
      tier3Content: {
        title: "Immediate Opportunities",
        description: "High-impact opportunities that can be implemented within 30 days",
        dataFocus: ["Opportunity scoring", "Implementation effort", "Expected ROI", "Risk assessment"],
        chartTypes: ["opportunity-matrix", "impact-effort-chart", "roi-timeline", "risk-assessment"]
      }
    }
  },

  // ============================================
  // OPTIMIZELY DXP TOOLS - Tier 1 Category
  // ============================================

  // DXP Tools → Content Recs → Visitor Analytics Dashboard
  {
    urlPattern: "/engine/results/optimizely-dxp-tools/content-recs/visitor-analytics-dashboard",
    staticUrlPattern: "/engine/results/dxptools",
    dynamicUrlPattern: "/engine/results/optimizely-dxp-tools/content-recs",

    tier1: {
      name: "optimizely-dxp-tools",
      displayName: "Optimizely DXP Tools",
      icon: "Settings",
      description: "Integration health and performance monitoring for Optimizely DXP platform tools",
      color: "purple"
    },

    tier2: {
      name: "content-recs",
      displayName: "Content Recs",
      icon: "Activity",
      description: "Advanced content recommendation analytics with visitor insights, A/B testing, and personalization effectiveness",
      keyFeatures: ["Visitor analytics", "Content performance", "A/B testing results", "Personalization metrics"]
    },

    tier3: {
      name: "visitor-analytics-dashboard",
      displayName: "Visitor Analytics Dashboard",
      description: "Comprehensive visitor behavior analytics and content engagement insights",
      focusArea: "Visitor behavior patterns and content interaction analysis"
    },

    widgets: {
      primary: "IntegrationHealthWidget",
      secondary: ["VisitorAnalyticsWidget", "ContentPerformanceWidget"],
      props: {
        visitorData: "visitorAnalytics",
        contentMetrics: "contentRecommendationMetrics",
        engagementData: "visitorEngagement",
        performanceData: "contentPerformance"
      },
      layout: "tabs"
    },

    opal: {
      agents: ["content_review", "audience_suggester"],
      tools: ["osa_contentrecs_tools"],
      instructions: ["content-strategy", "audience-analysis"],
      dxpTools: ["Content Recs"]
    },

    content: {
      tier2Content: {
        title: "Content Recommendations Analytics",
        description: "Visitor behavior and content recommendation performance insights",
        keyMetrics: ["Click-through Rate", "Engagement Score", "Conversion Rate", "Recommendation Accuracy"]
      },
      tier3Content: {
        title: "Visitor Analytics Dashboard",
        description: "Deep dive into visitor behavior patterns and content interaction metrics",
        dataFocus: ["Visitor segments", "Content engagement", "Behavior patterns", "Recommendation performance"],
        chartTypes: ["visitor-flow", "engagement-heatmap", "behavior-funnel", "recommendation-performance"]
      }
    }
  },

  // ============================================
  // ANALYTICS INSIGHTS - Tier 1 Category
  // ============================================

  // Analytics Insights → Content → Engagement
  {
    urlPattern: "/engine/results/analytics-insights/content/engagement",
    staticUrlPattern: "/engine/results/insights",
    dynamicUrlPattern: "/engine/results/analytics-insights/content",

    tier1: {
      name: "analytics-insights",
      displayName: "Analytics Insights",
      icon: "BarChart3",
      description: "Advanced analytics and data insights with AI-powered visibility and engagement analysis",
      color: "green"
    },

    tier2: {
      name: "content",
      displayName: "Content",
      icon: "Activity",
      description: "Deep content analytics with engagement metrics, topic analysis, AI visibility insights, and geographic performance",
      keyFeatures: ["Engagement tracking", "Topic modeling", "AI visibility", "Geographic analysis"]
    },

    tier3: {
      name: "engagement",
      displayName: "Engagement",
      description: "Content engagement analytics including page views, time on page, bounce rates, and user interaction patterns",
      focusArea: "Content engagement metrics and user behavior analysis"
    },

    widgets: {
      primary: "EngagementAnalyticsWidget",
      secondary: ["ContentEngagementWidget", "UserInteractionWidget"],
      props: {
        engagementMetrics: "contentEngagementData",
        interactionData: "userInteractionData",
        behaviorAnalytics: "engagementBehavior",
        performanceData: "contentPerformanceMetrics"
      },
      layout: "tabs"
    },

    opal: {
      agents: ["content_review", "audience_suggester"],
      tools: ["workflow_data_sharing"],
      instructions: ["content-analysis", "engagement-optimization"],
      dxpTools: ["Content Recs", "CMS", "ODP"]
    },

    content: {
      tier2Content: {
        title: "Content Analytics Hub",
        description: "Comprehensive content performance and engagement analytics",
        keyMetrics: ["Page Views", "Engagement Rate", "Time on Page", "Bounce Rate"]
      },
      tier3Content: {
        title: "Engagement Analytics",
        description: "Detailed analysis of content engagement patterns and user interaction behavior",
        dataFocus: ["Engagement metrics", "User behavior", "Interaction patterns", "Performance trends"],
        chartTypes: ["engagement-trends", "interaction-heatmap", "behavior-flow", "performance-comparison"]
      }
    }
  },

  // ============================================
  // EXPERIENCE OPTIMIZATION - Tier 1 Category
  // ============================================

  // Experience Optimization → Experimentation → Experiment Design Framework
  {
    urlPattern: "/engine/results/experience-optimization/experimentation/experiment-design-framework",
    staticUrlPattern: "/engine/results/optimization",
    dynamicUrlPattern: "/engine/results/experience-optimization/experimentation",

    tier1: {
      name: "experience-optimization",
      displayName: "Experience Optimization",
      icon: "TrendingUp",
      description: "Comprehensive experimentation, personalization, and user experience optimization",
      color: "orange"
    },

    tier2: {
      name: "experimentation",
      displayName: "Experimentation",
      icon: "Activity",
      description: "Comprehensive experimentation framework with hypothesis validation, statistical testing, and impact assessment",
      keyFeatures: ["Experiment design", "Statistical testing", "Hypothesis validation", "Impact analysis"]
    },

    tier3: {
      name: "experiment-design-framework",
      displayName: "Experiment Design Framework",
      description: "Systematic approach to designing and validating experiments with statistical rigor and business impact focus",
      focusArea: "Experiment methodology and design principles"
    },

    widgets: {
      primary: "ExperimentationWidget",
      secondary: ["ExperimentDesignWidget", "HypothesisValidationWidget"],
      props: {
        experimentDesigns: "experimentDesignData",
        hypothesesData: "hypothesisValidation",
        designPrinciples: "designFramework",
        validationMetrics: "validationCriteria"
      },
      layout: "accordion"
    },

    opal: {
      agents: ["experiment_blueprinter", "customer_journey"],
      tools: ["osa_webx_tools"],
      instructions: ["experimentation-strategy", "statistical-analysis"],
      dxpTools: ["WEBX", "ODP"]
    },

    content: {
      tier2Content: {
        title: "Experimentation Framework",
        description: "Systematic approach to experimentation design and validation",
        keyMetrics: ["Experiment Success Rate", "Statistical Power", "Sample Size", "Effect Size"]
      },
      tier3Content: {
        title: "Experiment Design Framework",
        description: "Comprehensive framework for designing statistically valid and business-relevant experiments",
        dataFocus: ["Design principles", "Statistical methodology", "Hypothesis formation", "Success criteria"],
        chartTypes: ["design-framework", "statistical-power", "hypothesis-tree", "success-criteria"]
      }
    }
  }
];

/**
 * URL Pattern Matching and Normalization
 */

// URL normalization functions
export function normalizeUrl(url: string): string {
  return url.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '');
}

// Tier name conversions
export const TIER_NAME_MAPPINGS = {
  // URL segment → Display name mappings
  'strategy-plans': 'Strategy Plans',
  'strategy': 'Strategy Plans',
  'optimizely-dxp-tools': 'Optimizely DXP Tools',
  'dxptools': 'Optimizely DXP Tools',
  'analytics-insights': 'Analytics Insights',
  'insights': 'Analytics Insights',
  'experience-optimization': 'Experience Optimization',
  'optimization': 'Experience Optimization',

  // Tier-2 mappings
  'osa': 'OSA',
  'quick-wins': 'Quick Wins',
  'maturity': 'Maturity',
  'phases': 'Phases',
  'roadmap': 'Roadmap',
  'content-recs': 'Content Recs',
  'cms': 'CMS',
  'odp': 'ODP',
  'webx': 'WEBX',
  'cmp': 'CMP',
  'content': 'Content',
  'audiences': 'Audiences',
  'cx': 'CX',
  'experimentation': 'Experimentation',
  'personalization': 'Personalization',
  'ux': 'UX',
  'technology': 'Technology'
};

/**
 * Core Lookup Functions
 */

/**
 * Complete rendering rules combining base and expanded rules
 */
export const TIER_RENDERING_RULES: TierRenderingRule[] = [
  ...BASE_TIER_RENDERING_RULES,
  ...EXPANDED_TIER_RULES
];

/**
 * Find rendering rule by URL pattern
 */
export function findRenderingRule(url: string): TierRenderingRule | null {
  const normalizedUrl = normalizeUrl(url);

  // Try exact match first
  let rule = TIER_RENDERING_RULES.find(rule =>
    normalizedUrl === normalizeUrl(rule.urlPattern) ||
    normalizedUrl === normalizeUrl(rule.staticUrlPattern || '') ||
    normalizedUrl.startsWith(normalizeUrl(rule.dynamicUrlPattern || ''))
  );

  if (rule) return rule;

  // Try tier-level partial matching
  for (const rule of TIER_RENDERING_RULES) {
    const tier1Match = normalizedUrl.includes(normalizeUrl(rule.tier1.name));
    const tier2Match = normalizedUrl.includes(normalizeUrl(rule.tier2.name));

    if (tier1Match && tier2Match) {
      return rule;
    }
  }

  return null;
}

/**
 * Extract tier information from URL
 */
export function extractTierInfo(url: string): { tier1: string; tier2: string; tier3: string } {
  const segments = url.split('/').filter(Boolean);

  // Handle different URL patterns
  if (segments.includes('results')) {
    const resultsIndex = segments.indexOf('results');
    return {
      tier1: segments[resultsIndex + 1] || '',
      tier2: segments[resultsIndex + 2] || '',
      tier3: segments[resultsIndex + 3] || ''
    };
  }

  return { tier1: '', tier2: '', tier3: '' };
}

/**
 * Get appropriate widgets for a tier combination
 */
export function getWidgetsForTier(tier1: string, tier2?: string, tier3?: string): string[] {
  const rule = findRenderingRule(`/engine/results/${tier1}/${tier2}/${tier3}`);

  if (rule) {
    return [rule.widgets.primary, ...(rule.widgets.secondary || [])];
  }

  // Fallback to tier1-level widget mapping
  const tier1Normalized = TIER_NAME_MAPPINGS[tier1.toLowerCase()] || tier1;

  switch (tier1Normalized) {
    case 'Strategy Plans':
      return ['StrategyPlansWidget'];
    case 'Optimizely DXP Tools':
      return ['IntegrationHealthWidget'];
    case 'Analytics Insights':
      return ['EngagementAnalyticsWidget'];
    case 'Experience Optimization':
      return ['ExperimentationWidget'];
    default:
      return ['GenericWidget'];
  }
}

/**
 * Get OPAL configuration for a tier combination
 */
export function getOPALConfig(tier1: string, tier2?: string): {
  agents: string[];
  tools: string[];
  instructions: string[];
  dxpTools: string[];
} {
  const rule = findRenderingRule(`/engine/results/${tier1}/${tier2}`);

  if (rule) {
    return rule.opal;
  }

  // Default OPAL config
  return {
    agents: ['strategy_workflow'],
    tools: ['workflow_data_sharing'],
    instructions: ['company-overview'],
    dxpTools: []
  };
}

/**
 * Get content configuration for tier-specific customization
 */
export function getContentConfig(tier1: string, tier2?: string, tier3?: string) {
  const rule = findRenderingRule(`/engine/results/${tier1}/${tier2}/${tier3}`);

  if (rule) {
    return rule.content;
  }

  return null;
}

/**
 * Validate if a tier combination is valid
 */
export function isValidTierCombination(tier1: string, tier2?: string, tier3?: string): boolean {
  const rule = findRenderingRule(`/engine/results/${tier1}/${tier2}/${tier3}`);
  return rule !== null;
}