/**
 * Results Mapping Configuration - Single Source of Truth
 *
 * This file defines the canonical mapping between Results URLs, OPAL agents,
 * DXP tools, and content requirements. It serves as the authoritative
 * configuration for the Results Content Optimizer system.
 *
 * @version 1.0
 * @created 2024-11-18
 * @scope Phase 1: Content Recommendations focused
 */

// Core mapping types
export type ResultsSectionGroup =
  | 'strategy-plans'
  | 'optimizely-dxp-tools'
  | 'analytics-insights'
  | 'experience-optimization';

export type ResultsTopic =
  | 'content'
  | 'audiences'
  | 'experimentation'
  | 'personalization'
  | 'cx'
  | 'technology'
  | 'osa-core'
  | 'marketing-calendar';

export type DXPSource =
  | 'content-recs'
  | 'cms'
  | 'odp'
  | 'webx'
  | 'cmp'
  | 'osa-internal';

export type ContentUniquenessLevel = 'high' | 'medium' | 'low';
export type ConfidenceThreshold = number; // 0-100

/**
 * Results Page Mapping Interface
 * Defines the complete configuration for a Results page or sub-page
 */
export interface ResultsPageMapping {
  /** Unique identifier for this mapping */
  id: string;

  /** URL pattern or specific route */
  routePattern: string;

  /** High-level section grouping */
  sectionGroup: ResultsSectionGroup;

  /** Primary topic focus */
  primaryTopic: ResultsTopic;

  /** OPAL agents that power this page (ordered by priority) */
  opalAgents: {
    primary: string[];
    secondary: string[];
  };

  /** DXP tools that provide source data */
  dxpSources: DXPSource[];

  /** Widget components that render content */
  widgets: string[];

  /** Content uniqueness and quality requirements */
  contentRequirements: {
    uniquenessLevel: ContentUniquenessLevel;
    confidenceThreshold: ConfidenceThreshold;
    mandatoryElements: string[];
    prohibitedElements: string[];
    crossPageDuplicationThreshold: number; // 0-1, lower = more unique
  };

  /** Fallback behavior configuration */
  fallbackPolicyId: string;

  /** Performance and caching requirements */
  performance: {
    maxLoadTime: number; // milliseconds
    cacheStrategy: 'aggressive' | 'standard' | 'minimal';
    refreshFrequency: string; // cron-like or duration
  };

  /** Metadata */
  meta: {
    displayName: string;
    description: string;
    lastUpdated: string;
    phase: number; // Implementation phase
  };
}

/**
 * Sub-page mapping for complex multi-dashboard pages
 * Used for Content Recs dashboard tabs and similar structures
 */
export interface SubPageMapping extends Omit<ResultsPageMapping, 'routePattern'> {
  /** Sub-page identifier (e.g., 'content-dashboard', 'insight-dashboard') */
  subPageId: string;

  /** Unique value proposition for this sub-page */
  uniqueValueProp: string;

  /** Parent page mapping ID */
  parentMappingId: string;
}

/**
 * Fallback Policy Configuration
 * Defines behavior when primary data sources are unavailable
 */
export interface FallbackPolicy {
  id: string;
  name: string;
  strategy: 'graceful-degradation' | 'cached-data' | 'simulated-content' | 'error-message';
  confidence: ConfidenceThreshold;
  timeoutMs: number;
  retryAttempts: number;
  fallbackContent: {
    heroMessage: string;
    overviewMessage: string;
    insightsPlaceholder: string[];
    opportunitiesPlaceholder: string[];
    nextStepsPlaceholder: string[];
  };
}

// =============================================================================
// PHASE 1: CONTENT RECOMMENDATIONS MAPPINGS
// =============================================================================

/**
 * Content Recommendations Primary Dashboard Mapping
 * Route: /engine/results/optimizely-dxp-tools/content-recs/visitor-analytics-dashboard
 */
export const CONTENT_RECS_PRIMARY_MAPPING: ResultsPageMapping = {
  id: 'content-recs-primary-dashboard',
  routePattern: '/engine/results/optimizely-dxp-tools/content-recs/visitor-analytics-dashboard',
  sectionGroup: 'optimizely-dxp-tools',
  primaryTopic: 'content',

  opalAgents: {
    primary: [
      'osa_analyze_website_content',
      'assess_content_performance',
      'generate_content_recommendations',
      'identify_personalization_opportunities'
    ],
    secondary: [
      'get_available_content_catalog',
      'create_content_matrix',
      'optimize_content_for_seo'
    ]
  },

  dxpSources: ['content-recs'],

  widgets: [
    'ContentRecommendationsDashboardWidget',
    'ContentQualityOverviewWidget',
    'PersonalizationInsightsWidget',
    'TopicPerformanceWidget',
    'EngagementOptimizationWidget'
  ],

  contentRequirements: {
    uniquenessLevel: 'high',
    confidenceThreshold: 75,
    mandatoryElements: [
      'content_quality_metrics',
      'personalization_opportunities',
      'topic_performance_data',
      'engagement_strategies'
    ],
    prohibitedElements: [
      'revenue_metrics',
      'roi_calculations',
      'generic_insights'
    ],
    crossPageDuplicationThreshold: 0.3
  },

  fallbackPolicyId: 'content-recs-standard',

  performance: {
    maxLoadTime: 3000,
    cacheStrategy: 'standard',
    refreshFrequency: '4h'
  },

  meta: {
    displayName: 'Content Recommendations Dashboard',
    description: 'Comprehensive content optimization dashboard with 4 specialized views',
    lastUpdated: '2024-11-18',
    phase: 1
  }
};

/**
 * Content Recommendations Sub-Dashboard Mappings
 * Maps the 4 specialized dashboard tabs with unique content requirements
 */
export const CONTENT_RECS_SUB_MAPPINGS: SubPageMapping[] = [
  {
    // Content Dashboard Tab - Technical optimization focus
    id: 'content-recs-content-dashboard',
    subPageId: 'content-dashboard',
    uniqueValueProp: 'Technical content quality and SEO optimization insights',
    parentMappingId: 'content-recs-primary-dashboard',

    sectionGroup: 'optimizely-dxp-tools',
    primaryTopic: 'content',

    opalAgents: {
      primary: ['osa_analyze_website_content', 'optimize_content_for_seo'],
      secondary: ['assess_content_performance', 'get_available_content_catalog']
    },

    dxpSources: ['content-recs'],

    widgets: [
      'ContentQualityWidget',
      'SEOReadinessWidget',
      'PerformanceBenchmarkWidget',
      'ContentCatalogOverviewWidget'
    ],

    contentRequirements: {
      uniquenessLevel: 'high',
      confidenceThreshold: 70,
      mandatoryElements: [
        'content_quality_score',
        'seo_readiness_assessment',
        'performance_benchmarks'
      ],
      prohibitedElements: [
        'audience_insights',
        'engagement_strategies',
        'personalization_data'
      ],
      crossPageDuplicationThreshold: 0.2
    },

    fallbackPolicyId: 'content-recs-technical',

    performance: {
      maxLoadTime: 2500,
      cacheStrategy: 'aggressive',
      refreshFrequency: '6h'
    },

    meta: {
      displayName: 'Content Quality Dashboard',
      description: 'Technical content optimization and SEO analysis',
      lastUpdated: '2024-11-18',
      phase: 1
    }
  },

  {
    // Insight Dashboard Tab - Personalization focus
    id: 'content-recs-insight-dashboard',
    subPageId: 'insight-dashboard',
    uniqueValueProp: 'Strategic audience personalization and content gap insights',
    parentMappingId: 'content-recs-primary-dashboard',

    sectionGroup: 'optimizely-dxp-tools',
    primaryTopic: 'content',

    opalAgents: {
      primary: ['identify_personalization_opportunities', 'create_content_matrix'],
      secondary: ['assess_content_performance', 'get_available_content_catalog']
    },

    dxpSources: ['content-recs'],

    widgets: [
      'PersonalizationOpportunityWidget',
      'AudienceSegmentWidget',
      'ContentGapAnalysisWidget',
      'PersonaInsightsWidget'
    ],

    contentRequirements: {
      uniquenessLevel: 'high',
      confidenceThreshold: 65,
      mandatoryElements: [
        'personalization_opportunities',
        'audience_segment_analysis',
        'content_gap_identification'
      ],
      prohibitedElements: [
        'technical_seo_metrics',
        'performance_benchmarks',
        'content_quality_scores'
      ],
      crossPageDuplicationThreshold: 0.2
    },

    fallbackPolicyId: 'content-recs-personalization',

    performance: {
      maxLoadTime: 2500,
      cacheStrategy: 'standard',
      refreshFrequency: '4h'
    },

    meta: {
      displayName: 'Personalization Insights',
      description: 'Audience-focused content personalization opportunities',
      lastUpdated: '2024-11-18',
      phase: 1
    }
  },

  {
    // Topic Performance Tab - Analytics focus
    id: 'content-recs-topic-performance',
    subPageId: 'topic-performance',
    uniqueValueProp: 'Granular topic-level performance analytics and recommendations',
    parentMappingId: 'content-recs-primary-dashboard',

    sectionGroup: 'optimizely-dxp-tools',
    primaryTopic: 'content',

    opalAgents: {
      primary: ['get_content_recommendations_by_topic', 'assess_content_performance'],
      secondary: ['create_content_matrix', 'get_available_content_catalog']
    },

    dxpSources: ['content-recs'],

    widgets: [
      'TopicAnalyticsWidget',
      'TopicTrendingWidget',
      'TopicRecommendationsWidget',
      'TopicEngagementWidget'
    ],

    contentRequirements: {
      uniquenessLevel: 'high',
      confidenceThreshold: 75,
      mandatoryElements: [
        'topic_specific_analytics',
        'performance_trending_data',
        'topic_based_recommendations'
      ],
      prohibitedElements: [
        'generic_audience_insights',
        'broad_personalization_data',
        'technical_seo_metrics'
      ],
      crossPageDuplicationThreshold: 0.1 // Highest uniqueness requirement
    },

    fallbackPolicyId: 'content-recs-analytics',

    performance: {
      maxLoadTime: 2000,
      cacheStrategy: 'aggressive',
      refreshFrequency: '2h' // More frequent due to performance data
    },

    meta: {
      displayName: 'Topic Performance Analytics',
      description: 'Detailed topic-level content performance and optimization',
      lastUpdated: '2024-11-18',
      phase: 1
    }
  },

  {
    // Engage Dashboard Tab - Optimization focus
    id: 'content-recs-engage-dashboard',
    subPageId: 'engage-dashboard',
    uniqueValueProp: 'Actionable engagement optimization strategies and recommendations',
    parentMappingId: 'content-recs-primary-dashboard',

    sectionGroup: 'optimizely-dxp-tools',
    primaryTopic: 'content',

    opalAgents: {
      primary: ['generate_content_recommendations'],
      secondary: [
        'identify_personalization_opportunities',
        'optimize_content_for_seo',
        'assess_content_performance'
      ]
    },

    dxpSources: ['content-recs'],

    widgets: [
      'EngagementStrategyWidget',
      'ContentOptimizationWidget',
      'ConversionInsightsWidget',
      'ActionPlanWidget'
    ],

    contentRequirements: {
      uniquenessLevel: 'high',
      confidenceThreshold: 70,
      mandatoryElements: [
        'engagement_optimization_strategies',
        'actionable_recommendations',
        'conversion_insights'
      ],
      prohibitedElements: [
        'technical_analysis_data',
        'content_quality_metrics',
        'raw_performance_data'
      ],
      crossPageDuplicationThreshold: 0.2
    },

    fallbackPolicyId: 'content-recs-engagement',

    performance: {
      maxLoadTime: 2500,
      cacheStrategy: 'standard',
      refreshFrequency: '4h'
    },

    meta: {
      displayName: 'Engagement Optimization',
      description: 'Strategic engagement improvement and action recommendations',
      lastUpdated: '2024-11-18',
      phase: 1
    }
  }
];

// =============================================================================
// FALLBACK POLICIES
// =============================================================================

export const FALLBACK_POLICIES: FallbackPolicy[] = [
  {
    id: 'content-recs-standard',
    name: 'Content Recs Standard Fallback',
    strategy: 'graceful-degradation',
    confidence: 40,
    timeoutMs: 5000,
    retryAttempts: 2,
    fallbackContent: {
      heroMessage: 'Content recommendations analysis in progress',
      overviewMessage: 'Building comprehensive content optimization insights based on your content strategy and performance data.',
      insightsPlaceholder: [
        'Content quality assessment is being prepared',
        'Personalization opportunities are being identified',
        'Performance analytics are being compiled'
      ],
      opportunitiesPlaceholder: [
        'Content optimization recommendations will appear here',
        'SEO enhancement suggestions are being generated',
        'Engagement improvement strategies are being developed'
      ],
      nextStepsPlaceholder: [
        'Implement content quality improvements',
        'Review personalization opportunities',
        'Monitor performance optimization results'
      ]
    }
  },

  {
    id: 'content-recs-technical',
    name: 'Content Recs Technical Fallback',
    strategy: 'graceful-degradation',
    confidence: 35,
    timeoutMs: 3000,
    retryAttempts: 3,
    fallbackContent: {
      heroMessage: 'Content quality analysis initializing',
      overviewMessage: 'Technical content assessment and SEO optimization analysis are being prepared.',
      insightsPlaceholder: [
        'Content quality scoring in progress',
        'SEO readiness assessment underway',
        'Performance benchmarking being calculated'
      ],
      opportunitiesPlaceholder: [
        'Technical optimization recommendations being generated',
        'SEO improvement suggestions being prepared',
        'Content quality enhancement opportunities being identified'
      ],
      nextStepsPlaceholder: [
        'Review content quality scores',
        'Implement SEO optimization recommendations',
        'Monitor technical performance improvements'
      ]
    }
  },

  {
    id: 'content-recs-personalization',
    name: 'Content Recs Personalization Fallback',
    strategy: 'graceful-degradation',
    confidence: 45,
    timeoutMs: 4000,
    retryAttempts: 2,
    fallbackContent: {
      heroMessage: 'Personalization insights being prepared',
      overviewMessage: 'Audience segmentation and personalization opportunity analysis are being compiled.',
      insightsPlaceholder: [
        'Audience segment analysis in progress',
        'Personalization opportunities being identified',
        'Content gap analysis being performed'
      ],
      opportunitiesPlaceholder: [
        'Personalization strategy recommendations being developed',
        'Audience-specific content suggestions being generated',
        'Content gap solutions being identified'
      ],
      nextStepsPlaceholder: [
        'Review audience segmentation insights',
        'Implement personalization strategies',
        'Address identified content gaps'
      ]
    }
  },

  {
    id: 'content-recs-analytics',
    name: 'Content Recs Analytics Fallback',
    strategy: 'graceful-degradation',
    confidence: 50,
    timeoutMs: 3500,
    retryAttempts: 2,
    fallbackContent: {
      heroMessage: 'Topic performance analytics loading',
      overviewMessage: 'Detailed topic-level content performance analysis and trending data are being processed.',
      insightsPlaceholder: [
        'Topic performance metrics being calculated',
        'Content trending analysis in progress',
        'Topic-specific recommendations being generated'
      ],
      opportunitiesPlaceholder: [
        'Topic optimization opportunities being identified',
        'Performance improvement strategies being developed',
        'Content enhancement recommendations being prepared'
      ],
      nextStepsPlaceholder: [
        'Review topic performance trends',
        'Implement topic-specific optimizations',
        'Monitor topic engagement improvements'
      ]
    }
  },

  {
    id: 'content-recs-engagement',
    name: 'Content Recs Engagement Fallback',
    strategy: 'graceful-degradation',
    confidence: 40,
    timeoutMs: 4000,
    retryAttempts: 2,
    fallbackContent: {
      heroMessage: 'Engagement optimization strategies being prepared',
      overviewMessage: 'Strategic engagement improvement recommendations and action plans are being developed.',
      insightsPlaceholder: [
        'Engagement strategy analysis in progress',
        'Optimization recommendations being compiled',
        'Conversion insights being prepared'
      ],
      opportunitiesPlaceholder: [
        'Engagement improvement strategies being developed',
        'Content optimization actions being identified',
        'Conversion enhancement opportunities being analyzed'
      ],
      nextStepsPlaceholder: [
        'Implement engagement optimization strategies',
        'Execute recommended content improvements',
        'Track conversion performance improvements'
      ]
    }
  },

  // ODP Data Platform Standard Fallback
  {
    id: 'odp-data-platform-standard',
    name: 'ODP Data Platform Standard Fallback',
    strategy: 'graceful-degradation',
    confidence: 45,
    timeoutMs: 5000,
    retryAttempts: 2,
    fallbackContent: {
      heroMessage: 'ODP customer data platform analysis in progress',
      overviewMessage: 'Customer data insights and audience segmentation analysis are being compiled from your Optimizely Data Platform.',
      insightsPlaceholder: [
        'Customer profile analysis being prepared',
        'Audience segmentation insights being generated',
        'Data quality assessment in progress'
      ],
      opportunitiesPlaceholder: [
        'Customer profile optimization recommendations being developed',
        'Audience segmentation opportunities being identified',
        'Data quality improvement strategies being prepared'
      ],
      nextStepsPlaceholder: [
        'Review customer profile completeness',
        'Implement audience segmentation strategies',
        'Monitor data quality improvements'
      ]
    }
  }
];

// =============================================================================
// MAPPING UTILITIES AND EXPORTS
// =============================================================================

/**
 * Get mapping by route pattern
 */
export function getMappingByRoute(routePattern: string): ResultsPageMapping | undefined {
  return ALL_MAPPINGS.find(mapping => mapping.routePattern === routePattern);
}

/**
 * Get mappings by section group
 */
export function getMappingsBySection(sectionGroup: ResultsSectionGroup): ResultsPageMapping[] {
  return ALL_MAPPINGS.filter(mapping => mapping.sectionGroup === sectionGroup);
}

/**
 * Get mappings by DXP source
 */
export function getMappingsByDXPSource(dxpSource: DXPSource): ResultsPageMapping[] {
  return ALL_MAPPINGS.filter(mapping => mapping.dxpSources.includes(dxpSource));
}

/**
 * Get fallback policy by ID
 */
export function getFallbackPolicy(policyId: string): FallbackPolicy | undefined {
  return FALLBACK_POLICIES.find(policy => policy.id === policyId);
}

/**
 * Get sub-page mappings for a parent mapping
 */
export function getSubPageMappings(parentMappingId: string): SubPageMapping[] {
  return CONTENT_RECS_SUB_MAPPINGS.filter(subMapping =>
    subMapping.parentMappingId === parentMappingId
  );
}

// Phase expansion placeholder (future phases will add more mappings)
export const PHASE_2_MAPPINGS: ResultsPageMapping[] = [
  // CMS mappings will be added here
];

export const PHASE_3_MAPPINGS: ResultsPageMapping[] = [
  // ODP Data Platform Dashboard
  {
    id: 'odp-data-platform-dashboard',
    routePattern: '/engine/results/optimizely-dxp-tools/odp/data-platform-dashboard',
    sectionGroup: 'optimizely-dxp-tools',
    primaryTopic: 'audiences',

    opalAgents: {
      primary: ['audience_suggester', 'integration_health'],
      secondary: ['customer_journey']
    },

    dxpSources: ['odp'],

    widgets: ['ODPWidget'],

    contentRequirements: {
      uniquenessLevel: 'high',
      confidenceThreshold: 75,
      mandatoryElements: [
        'customer_metrics',
        'audience_segments',
        'data_quality',
        'integration_status'
      ],
      prohibitedElements: [
        'revenue_metrics',
        'roi_calculations',
        'financial_projections'
      ],
      crossPageDuplicationThreshold: 0.2
    },

    fallbackPolicyId: 'odp-data-platform-standard',

    performance: {
      maxLoadTime: 4000,
      cacheStrategy: 'standard',
      refreshFrequency: '2h'
    },

    meta: {
      displayName: 'ODP Data Platform Dashboard',
      description: 'Comprehensive customer data platform overview with audience insights and data quality metrics',
      lastUpdated: '2024-11-18',
      phase: 3
    }
  }
];

// Combined mappings export (Phase 1: Content Recs, Phase 3: ODP)
// NOTE: Using function to avoid Temporal Dead Zone (TDZ) errors during module initialization
function getAllMappings(): ResultsPageMapping[] {
  return [
    CONTENT_RECS_PRIMARY_MAPPING,
    ...PHASE_3_MAPPINGS
  ];
}

export const ALL_MAPPINGS: ResultsPageMapping[] = getAllMappings();

// Default export for easy importing
export default {
  mappings: ALL_MAPPINGS,
  subMappings: CONTENT_RECS_SUB_MAPPINGS,
  fallbackPolicies: FALLBACK_POLICIES,
  utils: {
    getMappingByRoute,
    getMappingsBySection,
    getMappingsByDXPSource,
    getFallbackPolicy,
    getSubPageMappings
  }
};