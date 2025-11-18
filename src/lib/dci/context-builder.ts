/**
 * DCI Context Builder - Data Source Integration
 *
 * Builds context buckets from existing OSA data sources including:
 * - Supabase database content
 * - OPAL agent outputs
 * - DXP tools data
 * - Analytics data sources
 */

import {
  DciContextBuckets,
  OSAResults
} from '@/types/dci-orchestrator';

import { dciDataConnector } from './data-connectors';
import { dciLog } from './feature-flags';

// =============================================================================
// Context Builder Configuration
// =============================================================================

interface ContextBuilderConfig {
  enableDetailedLogging: boolean;
  maxItemsPerCategory: number;
  dataFreshnessThresholdHours: number;
  fallbackToMockData: boolean;
}

const DEFAULT_CONTEXT_CONFIG: ContextBuilderConfig = {
  enableDetailedLogging: process.env.NODE_ENV === 'development',
  maxItemsPerCategory: 10,
  dataFreshnessThresholdHours: 24,
  fallbackToMockData: true
};

// =============================================================================
// Main Context Builder Function
// =============================================================================

/**
 * Build complete context buckets from available data sources
 */
export async function buildContextBuckets(
  baseMeta: OSAResults['meta'],
  config: Partial<ContextBuilderConfig> = {}
): Promise<DciContextBuckets> {
  const finalConfig = { ...DEFAULT_CONTEXT_CONFIG, ...config };

  dciLog('info', `Building context buckets for ${baseMeta.orgName || 'organization'}`);

  try {
    // Use production data connector manager for comprehensive context building
    const contextBuckets = await dciDataConnector.buildProductionContextBuckets(baseMeta);

    // Add validation and enhancement if needed
    const validationResult = validateContextBuckets(contextBuckets);

    dciLog('info', `Built ${Object.keys(contextBuckets).length}/4 context buckets (${Math.round(validationResult.coverage * 100)}% coverage)`);

    if (validationResult.coverage < 0.75) {
      dciLog('warn', `Low context coverage: ${validationResult.missingAreas.join(', ')} missing`);
    }

    return contextBuckets;

  } catch (error) {
    dciLog('error', 'Failed to build production context buckets:', error);

    // Fallback to mock data if production data sources fail
    if (finalConfig.fallbackToMockData) {
      dciLog('info', 'Falling back to mock context data');
      return buildFallbackContextBuckets(baseMeta, finalConfig);
    }

    // Return empty context buckets on fatal error without fallback
    return {};
  }
}

// =============================================================================
// Fallback Context Builder
// =============================================================================

/**
 * Fallback context builder using mock data when production sources fail
 */
async function buildFallbackContextBuckets(
  baseMeta: OSAResults['meta'],
  config: ContextBuilderConfig
): Promise<DciContextBuckets> {

  dciLog('info', 'Building fallback context buckets with mock data');

  const [contentContext, analyticsContext, experienceTacticsContext, strategyContext] = await Promise.allSettled([
    buildMockContentContext(baseMeta, config),
    buildMockAnalyticsContext(baseMeta, config),
    buildMockExperienceTacticsContext(baseMeta, config),
    buildMockStrategyContext(baseMeta, config)
  ]);

  const contextBuckets: DciContextBuckets = {};

  if (contentContext.status === 'fulfilled' && contentContext.value) {
    contextBuckets.contentContext = contentContext.value;
  }

  if (analyticsContext.status === 'fulfilled' && analyticsContext.value) {
    contextBuckets.analyticsContext = analyticsContext.value;
  }

  if (experienceTacticsContext.status === 'fulfilled' && experienceTacticsContext.value) {
    contextBuckets.experienceTacticsContext = experienceTacticsContext.value;
  }

  if (strategyContext.status === 'fulfilled' && strategyContext.value) {
    contextBuckets.strategyContext = strategyContext.value;
  }

  return contextBuckets;
}

// =============================================================================
// Mock Data Functions (for fallback scenarios)
// =============================================================================

/**
 * Mock content context builder for fallback scenarios
 */
async function buildMockContentContext(
  baseMeta: OSAResults['meta'],
  config: ContextBuilderConfig
): Promise<DciContextBuckets['contentContext']> {

  // Mock data based on industry and maturity phase
  const isEcommerce = baseMeta.industry?.toLowerCase().includes('retail') ||
                     baseMeta.industry?.toLowerCase().includes('commerce');

  const mockTopPages = isEcommerce
    ? ['Product Category Pages', 'Product Detail Pages', 'Homepage', 'Checkout Pages']
    : ['Homepage', 'About Page', 'Services Pages', 'Contact Page'];

  return {
    topTrafficPages: mockTopPages,
    underperformingPages: [
      'Cart abandonment flow',
      'Mobile product filters',
      'Search results page'
    ],
    highValuePages: [
      'Homepage hero section',
      'Primary conversion flow',
      'Key landing pages'
    ],
    contentTypes: isEcommerce
      ? ['product', 'category', 'blog', 'promotional']
      : ['service', 'blog', 'case-study', 'landing-page'],
    knownContentIssues: [
      'Mobile experience optimization needed',
      'Content freshness and relevancy',
      'Cross-device consistency gaps'
    ],
    contentPerformanceData: [
      {
        page: 'Homepage',
        uniques: 15420,
        interactions: 8932,
        conversionRate: 0.12
      },
      {
        page: 'Product Category',
        uniques: 12380,
        interactions: 7651,
        conversionRate: 0.08
      },
      {
        page: 'Product Detail',
        uniques: 9872,
        interactions: 6543,
        conversionRate: 0.15
      }
    ],
    topicsData: [
      {
        topicId: 'primary-value-prop',
        topicLabel: 'Primary Value Proposition',
        performance: 85,
        trendDirection: 'up'
      },
      {
        topicId: 'product-features',
        topicLabel: 'Product Features & Benefits',
        performance: 72,
        trendDirection: 'stable'
      },
      {
        topicId: 'social-proof',
        topicLabel: 'Customer Reviews & Testimonials',
        performance: 68,
        trendDirection: 'down'
      }
    ]
  };
}

/**
 * Mock analytics context builder for fallback scenarios
 */
async function buildMockAnalyticsContext(
  baseMeta: OSAResults['meta'],
  config: ContextBuilderConfig
): Promise<DciContextBuckets['analyticsContext']> {

  // Mock metrics based on primary KPIs
  const mockCurrentPerformance: { [metric: string]: string | number } = {};

  baseMeta.primaryKpis.forEach(kpi => {
    switch (kpi.toLowerCase()) {
      case 'cvr':
      case 'conversion rate':
        mockCurrentPerformance[kpi] = '8.4%';
        break;
      case 'aov':
      case 'average order value':
        mockCurrentPerformance[kpi] = '$127.50';
        break;
      case 'bounce rate':
        mockCurrentPerformance[kpi] = '32.1%';
        break;
      case 'engagement':
        mockCurrentPerformance[kpi] = '4.2 pages/session';
        break;
      default:
        mockCurrentPerformance[kpi] = 'Tracking';
    }
  });

  return {
    keyMetrics: baseMeta.primaryKpis || ['Conversion Rate', 'Engagement', 'Performance'],
    currentPerformance: mockCurrentPerformance,
    trendsSummary: 'Performance showing steady growth with mobile engagement up 15% over last quarter',
    notableWins: [
      'Homepage conversion rate improved by 12%',
      'Mobile checkout flow optimization increased completions by 8%',
      'Content recommendation engine driving 23% more engagement'
    ],
    notableLosses: [
      'Search results page showing 5% drop in engagement',
      'Product filter usage decreased on mobile devices',
      'Email campaign click-through rates declined 3%'
    ],
    segmentationHighlights: [
      'Returning customers show 40% higher engagement',
      'Mobile users represent 65% of traffic but 45% of conversions',
      'Premium segment customers have 3x higher lifetime value'
    ],
    dataSourcesAvailable: [
      'Google Analytics 4',
      'Optimizely Web Experimentation',
      ...(baseMeta.optiStack.includes('ODP') ? ['Optimizely Data Platform'] : []),
      ...(baseMeta.optiStack.includes('Content Recommendations') ? ['Content Intelligence'] : [])
    ],
    dataQualityIssues: [
      'Mobile attribution tracking needs enhancement',
      'Cross-device journey mapping incomplete',
      'Historical data normalization in progress'
    ]
  };

}

/**
 * Mock experience tactics context builder for fallback scenarios
 */
async function buildMockExperienceTacticsContext(
  baseMeta: OSAResults['meta'],
  config: ContextBuilderConfig
): Promise<DciContextBuckets['experienceTacticsContext']> {

  const hasWebX = baseMeta.optiStack.includes('Optimizely WebX');
  const hasODP = baseMeta.optiStack.includes('ODP');

  return {
    knownWinningPatterns: [
      'Simplified checkout flows increase completion by 15-25%',
      'Personalized product recommendations drive 20% more engagement',
      'Mobile-first design patterns show consistent performance gains',
      'Social proof elements improve conversion by 8-12%'
    ],
    existingExperimentsSummary: hasWebX ? [
      'Homepage hero messaging test - 3 variations running',
      'Product page layout optimization - analyzing results',
      'Checkout flow simplification - 12% improvement observed',
      'Mobile navigation enhancement - testing in progress'
    ] : [
      'Experience optimization framework being established',
      'A/B testing capabilities assessment in progress'
    ],
    runningExperiments: hasWebX ? [
      {
        name: 'Homepage Value Proposition Test',
        status: 'running',
        estimatedLift: '5-10% CVR improvement'
      },
      {
        name: 'Product Filter Enhancement',
        status: 'analyzing',
        estimatedLift: 'TBD - data collection phase'
      },
      {
        name: 'Mobile Checkout Optimization',
        status: 'completed',
        estimatedLift: '12% completion rate increase'
      }
    ] : [],
    audienceSegments: hasODP ? [
      'New visitors (35% of traffic)',
      'Returning customers (28% of traffic)',
      'High-value prospects (12% of traffic)',
      'Mobile-primary users (65% of traffic)',
      'Premium segment (8% of traffic)'
    ] : [
      'General website visitors',
      'Mobile vs desktop users',
      'Geographic segments'
    ],
    channelMixInfo: [
      'Organic search: 42% of traffic',
      'Direct traffic: 28% of traffic',
      'Paid advertising: 18% of traffic',
      'Social media: 8% of traffic',
      'Email campaigns: 4% of traffic'
    ],
    deviceAndBrowserData: {
      desktop: 35,
      mobile: 58,
      tablet: 7
    },
    userFlowData: [
      {
        step: 'Homepage Entry',
        dropOffRate: 0.15,
        optimizationOpportunity: 'Improve above-fold value proposition clarity'
      },
      {
        step: 'Category/Product Browse',
        dropOffRate: 0.25,
        optimizationOpportunity: 'Enhance product discovery and filtering'
      },
      {
        step: 'Product Detail View',
        dropOffRate: 0.35,
        optimizationOpportunity: 'Strengthen product information and social proof'
      },
      {
        step: 'Add to Cart',
        dropOffRate: 0.20,
        optimizationOpportunity: 'Reduce friction in cart addition process'
      },
      {
        step: 'Checkout Process',
        dropOffRate: 0.40,
        optimizationOpportunity: 'Simplify checkout flow and reduce form fields'
      }
    ]
  };

}

/**
 * Mock strategy context builder for fallback scenarios
 */
async function buildMockStrategyContext(
  baseMeta: OSAResults['meta'],
  config: ContextBuilderConfig
): Promise<DciContextBuckets['strategyContext']> {

  // Context varies by maturity phase
  const maturityConstraints = {
    crawl: ['Limited technical resources', 'Basic analytics infrastructure', 'Learning organizational processes'],
    walk: ['Growing technical capabilities', 'Expanding team bandwidth', 'Moderate budget allocation'],
    run: ['Established technical team', 'Mature processes', 'Significant optimization budget'],
    fly: ['Advanced technical capabilities', 'Dedicated optimization teams', 'Strategic investment focus']
  };

  const maturityCapabilities = {
    crawl: { development: 'low', design: 'low', analytics: 'low', content: 'medium' },
    walk: { development: 'medium', design: 'medium', analytics: 'medium', content: 'medium' },
    run: { development: 'medium', design: 'high', analytics: 'high', content: 'high' },
    fly: { development: 'high', design: 'high', analytics: 'high', content: 'high' }
  };

  return {
    orgConstraints: maturityConstraints[baseMeta.maturityPhase] || maturityConstraints.walk,
    timelineConstraints: [
      'Quarter-end business reviews impact major changes',
      'Holiday seasons require stable experiences',
      'Peak traffic periods limit experimental risk'
    ],
    existingRoadmapNotes: [
      'Mobile experience enhancement priority Q1',
      'Analytics infrastructure upgrade planned Q2',
      'Personalization capabilities expansion Q3',
      'International expansion considerations Q4'
    ],
    leadershipPriorities: baseMeta.primaryGoals || [
      'Improve customer experience quality',
      'Increase conversion performance',
      'Enhance competitive positioning',
      'Drive sustainable growth'
    ],
    budgetConsiderations: [
      'Optimization budget allocated quarterly',
      'ROI measurement requirements for major initiatives',
      'Cost-effective quick wins prioritized',
      'Long-term strategic investments evaluated annually'
    ],
    technicalDebt: [
      'Legacy system integrations need modernization',
      'Mobile experience consistency gaps',
      'Analytics tracking standardization needed',
      'Cross-platform data synchronization challenges'
    ],
    competitiveContext: [
      'Industry leaders investing heavily in personalization',
      'Mobile-first competitors gaining market share',
      'Customer experience expectations rising rapidly',
      'Technology adoption pace increasing across sector'
    ],
    regulatoryRequirements: [
      'GDPR compliance for international visitors',
      'Accessibility standards (WCAG 2.1 AA)',
      'Industry-specific privacy regulations',
      'Data retention and consent management'
    ],
    teamCapabilities: maturityCapabilities[baseMeta.maturityPhase] || maturityCapabilities.walk
  };
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Validate context bucket completeness and quality
 */
export function validateContextBuckets(contextBuckets: DciContextBuckets): {
  isComplete: boolean;
  coverage: number;
  missingAreas: string[];
  recommendations: string[];
} {
  const availableContexts = Object.keys(contextBuckets);
  const totalPossibleContexts = 4; // content, analytics, experienceTactics, strategy

  const coverage = availableContexts.length / totalPossibleContexts;

  const missingAreas: string[] = [];
  if (!contextBuckets.contentContext) missingAreas.push('contentContext');
  if (!contextBuckets.analyticsContext) missingAreas.push('analyticsContext');
  if (!contextBuckets.experienceTacticsContext) missingAreas.push('experienceTacticsContext');
  if (!contextBuckets.strategyContext) missingAreas.push('strategyContext');

  const recommendations: string[] = [];
  if (coverage < 0.5) {
    recommendations.push('Consider implementing additional data source integrations');
  }
  if (!contextBuckets.contentContext) {
    recommendations.push('Content performance data would significantly improve content recommendations');
  }
  if (!contextBuckets.analyticsContext) {
    recommendations.push('Analytics data integration would enhance insights quality');
  }

  return {
    isComplete: coverage === 1.0,
    coverage,
    missingAreas,
    recommendations
  };
}

/**
 * Get date N days ago in YYYY-MM-DD format
 */
function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

// =============================================================================
// Export Functions
// =============================================================================

export {
  DEFAULT_CONTEXT_CONFIG,
  type ContextBuilderConfig
};