/**
 * Shared Results Content Model & Language Rules
 *
 * This file defines the unified content structure used by all Results widgets
 * to ensure consistent presentation and language across Strategy, Insights,
 * Experience Optimization, and DXP Tools pages.
 */

// =============================================================================
// Core Results Content Types
// =============================================================================

export interface ResultsPageMetric {
  label: string;          // e.g. "Overall progress"
  value: string;          // "75.2%", "High", "12 experiments"
  hint?: string;          // short helper text
}

export interface ResultsPageOpportunity {
  label: string;          // "Fix drop-off after pricing page"
  impactLevel: 'High' | 'Medium' | 'Low';
  effortLevel: 'Low' | 'Medium' | 'High';
  confidence: number;     // 0–100
}

export interface ResultsPageNextStep {
  label: string;          // Action sentence
  ownerHint?: string;     // e.g. "Marketing Manager"
  timeframeHint?: string; // e.g. "Next 30 days"
}

export interface ResultsPageContent {
  hero: {
    title: string;              // page title
    promise: string;            // one-sentence page promise
    metrics: ResultsPageMetric[];
    confidence?: number;        // 0–100
    confidenceNote?: string;
  };

  overview: {
    summary: string;            // "What this means for your business"
    keyPoints: string[];        // 2–4 bullets
  };

  insights: {
    title: string;              // "Engagement patterns"
    description: string;        // short descriptive paragraph
    bullets: string[];          // neutral insights
  }[];

  opportunities: ResultsPageOpportunity[];

  nextSteps: ResultsPageNextStep[];

  meta: {
    tier: 'strategy' | 'insights' | 'optimization' | 'dxptools';
    agents: string[];
    maturity: 'crawl' | 'walk' | 'run' | 'fly';
    lastUpdated: string;        // ISO timestamp
  };
}

// =============================================================================
// Content-Specific Types
// =============================================================================

export type ContentIdeaLane = 'quick_win' | 'strategic_bet' | 'persona_gap';
export type MaturityPhase = 'crawl' | 'walk' | 'run' | 'fly';

export interface ContentIdea {
  id: string;

  workingTitle: string;
  sourceTopicId: string;
  sourceTopicLabel: string;

  primaryPersonaId?: string;
  secondaryPersonaId?: string;
  genericRole?: 'Prospective customer' | 'Existing customer';

  summary: string;           // 2–3 sentences
  seoAiHints: string[];      // short key themes

  lane: ContentIdeaLane;
  impact: 'High' | 'Medium' | 'Low';
  effort: 'Low' | 'Medium' | 'High';
  confidence: number;        // 0–100
  maturityTarget: MaturityPhase;

  rationale: {
    performanceSignals: string[];
    personaSignals: string[];
    strategyAlignment: string;
  };

  technologyWarnings?: string[];
}

export interface ContentNextBestIdeasResponse {
  ideas: ContentIdea[];
  meta: {
    totalIdeas: number;
    generatedAt: string;
    maturityPhase: MaturityPhase;
  };
}

// =============================================================================
// Topic Performance Types
// =============================================================================

export interface TopicContentItem {
  contentId: string;
  title: string;
  url: string;
  contentType: 'page' | 'article' | 'other';
  uniques: number;
  interactions: number;
  shareOfTopicInteractions?: number; // percentage
}

export interface TopicPerformanceRow {
  topicId: string;
  topicLabel: string;
  totalUniques: number;
  totalInteractions: number;
  shareOfTotalInteractions?: number;
  shareOfTotalUniques?: number;
  topContentItems: TopicContentItem[]; // sorted DESC by interactions
}

// =============================================================================
// Confidence & Fallback Types
// =============================================================================

export interface ConfidenceLevel {
  score: number;              // 0-100
  level: 'low' | 'medium' | 'high';
  message?: string;           // Optional explanation
  showNote: boolean;          // Whether to display confidence note to user
}

export interface FallbackContent {
  type: 'skeleton' | 'placeholder' | 'explanation';
  message: string;
  showAlways?: boolean;       // Show even when data exists but is low quality
}

// =============================================================================
// Language Rules & Validation
// =============================================================================

/**
 * Language Rules for all Results content:
 *
 * PREFERRED TERMS:
 * - "impact" instead of "effect"
 * - "optimization" instead of "improvement"
 * - "performance" instead of "results"
 *
 * AVOID:
 * - "synergy", "leverage" (as verb), enterprise jargon
 * - Technical acronyms without plain-language explanation
 * - Vague qualifiers like "somewhat better", "pretty good"
 * - Revenue, ROI, or currency-based metrics on any Results page
 * - Projections or specific monetary amounts
 */

export const LANGUAGE_RULES = {
  preferredTerms: {
    'effect': 'impact',
    'improvement': 'optimization',
    'results': 'performance'
  },

  avoidedTerms: [
    'synergy',
    'leverage', // when used as verb
    'somewhat',
    'pretty good',
    'kind of',
    'sort of'
  ],

  forbiddenMetrics: [
    'revenue',
    'roi',
    'profit',
    'cost',
    'price',
    '$',
    '€',
    '£',
    'projection',
    'forecast'
  ]
} as const;

// =============================================================================
// Helper Functions
// =============================================================================

export function getConfidenceLevel(score: number): ConfidenceLevel {
  if (score < 40) {
    return {
      score,
      level: 'low',
      message: 'Building confidence – initial data collection phase. More accurate insights coming soon.',
      showNote: true
    };
  } else if (score < 60) {
    return {
      score,
      level: 'medium',
      message: 'Moderate confidence – based on partial data. Accuracy will improve as more data flows in.',
      showNote: true
    };
  } else if (score < 80) {
    return {
      score,
      level: 'medium',
      message: 'Good confidence – solid data foundation with room for additional precision.',
      showNote: true
    };
  } else {
    return {
      score,
      level: 'high',
      message: 'High confidence – comprehensive data analysis with strong accuracy.',
      showNote: false
    };
  }
}

export function validateLanguageRules(text: string): string[] {
  const violations: string[] = [];
  const lowerText = text.toLowerCase();

  // Check for forbidden terms
  LANGUAGE_RULES.forbiddenMetrics.forEach(term => {
    if (lowerText.includes(term)) {
      violations.push(`Contains forbidden metric term: "${term}"`);
    }
  });

  LANGUAGE_RULES.avoidedTerms.forEach(term => {
    if (lowerText.includes(term)) {
      violations.push(`Contains discouraged term: "${term}"`);
    }
  });

  // Check for preferred term opportunities
  Object.entries(LANGUAGE_RULES.preferredTerms).forEach(([avoid, prefer]) => {
    if (lowerText.includes(avoid)) {
      violations.push(`Consider using "${prefer}" instead of "${avoid}"`);
    }
  });

  return violations;
}

/**
 * Never Blank Rules: Always provide meaningful content with confidence-based messaging
 * Returns sanitized data with appropriate confidence messaging
 */
export function ensureContentNeverBlank(data: any, context: string = 'general'): {
  value: any;
  confidence: number;
  shouldShowNote: boolean;
  fallbackUsed: boolean;
} {
  // Handle null/undefined data
  if (!data || data === null || data === undefined) {
    return {
      value: getFallbackContent(context),
      confidence: 25,
      shouldShowNote: true,
      fallbackUsed: true
    };
  }

  // Handle broken numerical values
  if (typeof data === 'number' && (isNaN(data) || data < 0)) {
    return {
      value: getFallbackContent(context),
      confidence: 20,
      shouldShowNote: true,
      fallbackUsed: true
    };
  }

  // Handle broken percentage values
  if (typeof data === 'string' && data.includes('%')) {
    const numValue = parseFloat(data.replace('%', ''));
    if (isNaN(numValue) || numValue < 0) {
      return {
        value: getFallbackContent(context),
        confidence: 20,
        shouldShowNote: true,
        fallbackUsed: true
      };
    }
  }

  // Handle empty arrays
  if (Array.isArray(data) && data.length === 0) {
    return {
      value: getFallbackContent(context),
      confidence: 30,
      shouldShowNote: true,
      fallbackUsed: true
    };
  }

  // Handle empty objects
  if (typeof data === 'object' && Object.keys(data).length === 0) {
    return {
      value: getFallbackContent(context),
      confidence: 30,
      shouldShowNote: true,
      fallbackUsed: true
    };
  }

  // Data is valid - return with appropriate confidence
  return {
    value: data,
    confidence: calculateDataConfidence(data),
    shouldShowNote: false,
    fallbackUsed: false
  };
}

/**
 * Calculate confidence score based on data completeness and quality
 */
export function calculateDataConfidence(data: any): number {
  if (!data) return 25;

  let confidence = 50; // Base confidence

  // Boost for complete data structures
  if (typeof data === 'object' && !Array.isArray(data)) {
    const keyCount = Object.keys(data).length;
    confidence += Math.min(keyCount * 5, 30); // +5 per key, max +30
  }

  // Boost for arrays with good data
  if (Array.isArray(data)) {
    confidence += Math.min(data.length * 3, 25); // +3 per item, max +25
  }

  // Boost for numerical precision
  if (typeof data === 'number' && data > 0) {
    confidence += 15;
  }

  return Math.min(confidence, 95); // Cap at 95% to maintain humility
}

/**
 * Generate appropriate fallback content based on context
 */
export function getFallbackContent(context: string): any {
  const fallbacks = {
    metric: 'Collecting data...',
    percentage: 'Calculating...',
    count: 'Analyzing...',
    list: ['Data collection in progress'],
    insights: 'Building insights as data accumulates',
    opportunities: 'Identifying opportunities based on incoming data',
    nextSteps: 'Analyzing to determine optimal next steps',
    general: 'Data collection and analysis in progress'
  };

  return fallbacks[context as keyof typeof fallbacks] || fallbacks.general;
}

// =============================================================================
// Default Content Generators
// =============================================================================

export function createDefaultResultsContent(
  tier: ResultsPageContent['meta']['tier'],
  title: string = 'Results Overview',
  confidence: number = 35
): ResultsPageContent {
  const tierSpecificContent = getTierSpecificDefaults(tier, confidence);
  const confidenceLevel = getConfidenceLevel(confidence);

  return {
    hero: {
      title,
      promise: tierSpecificContent.promise,
      metrics: tierSpecificContent.metrics,
      confidence,
      confidenceNote: confidenceLevel.showNote ? confidenceLevel.message : undefined
    },

    overview: {
      summary: tierSpecificContent.overview.summary,
      keyPoints: tierSpecificContent.overview.keyPoints
    },

    insights: tierSpecificContent.insights,

    opportunities: tierSpecificContent.opportunities,

    nextSteps: tierSpecificContent.nextSteps,

    meta: {
      tier,
      agents: tierSpecificContent.agents,
      maturity: 'crawl',
      lastUpdated: new Date().toISOString()
    }
  };
}

/**
 * Generate tier-specific default content following Never Blank rules
 */
export function getTierSpecificDefaults(tier: ResultsPageContent['meta']['tier'], confidence: number) {
  const baseDefaults = {
    strategy: {
      promise: 'Building your strategic roadmap with confidence insights and timeline tracking.',
      metrics: [
        { label: 'Overall Progress', value: '25%', hint: 'Foundation phase completion' },
        { label: 'Timeline Confidence', value: '60%', hint: 'Schedule adherence tracking' },
        { label: 'Plan Confidence Index', value: `${confidence}/100`, hint: 'Building confidence as data flows in' }
      ],
      overview: {
        summary: 'Your strategic plan is in the foundation phase. We\'re establishing baseline metrics and building confidence in timeline projections as data collection progresses.',
        keyPoints: [
          'Foundation phase metrics are being established and tracked',
          'Timeline confidence builds as milestone data accumulates',
          'Strategic roadmap elements are being mapped and validated',
          'Maturity assessment framework is collecting baseline measurements'
        ]
      },
      insights: [{
        title: 'Strategic Foundation Building',
        description: 'Establishing core strategic elements and measurement frameworks',
        bullets: [
          'Strategic planning framework has been established and is operational',
          'Baseline data collection is progressing across all strategic dimensions',
          'Foundation phase deliverables are being tracked and validated'
        ]
      }],
      opportunities: [{
        label: 'Accelerate foundation phase completion through focused milestone tracking',
        impactLevel: 'High' as const,
        effortLevel: 'Medium' as const,
        confidence: 80
      }],
      nextSteps: [{
        label: 'Continue baseline strategic data collection and validation',
        ownerHint: 'Strategy Team',
        timeframeHint: 'Ongoing'
      }, {
        label: 'Review foundation phase progress and milestone completion',
        ownerHint: 'Project Manager',
        timeframeHint: 'Weekly'
      }],
      agents: ['strategy_workflow']
    },

    insights: {
      promise: 'Analyzing content performance patterns and audience engagement to identify optimization opportunities.',
      metrics: [
        { label: 'Top Topic Contribution', value: 'Analyzing...', hint: 'Identifying leading content topics' },
        { label: 'High-Value Segment Engagement', value: 'Calculating...', hint: 'Measuring audience segment performance' },
        { label: 'Content Concentration', value: 'Processing...', hint: 'Analyzing content portfolio distribution' }
      ],
      overview: {
        summary: 'Content performance analysis is underway. We\'re identifying engagement patterns and audience preferences to provide actionable insights.',
        keyPoints: [
          'Content engagement tracking is active across all major touchpoints',
          'Audience segmentation analysis is building comprehensive behavioral profiles',
          'Topic performance patterns are emerging from content interaction data',
          'Content portfolio analysis will reveal optimization opportunities'
        ]
      },
      insights: [{
        title: 'Content Engagement Analysis',
        description: 'Systematic analysis of content performance and audience interaction patterns',
        bullets: [
          'Content tracking systems are collecting comprehensive engagement metrics',
          'Audience behavior patterns are being analyzed for optimization insights',
          'Topic performance data is accumulating for trend identification'
        ]
      }],
      opportunities: [{
        label: 'Optimize high-performing content formats to increase overall engagement',
        impactLevel: 'High' as const,
        effortLevel: 'Low' as const,
        confidence: 75
      }],
      nextSteps: [{
        label: 'Continue content performance data collection across all channels',
        ownerHint: 'Analytics Team',
        timeframeHint: 'Ongoing'
      }, {
        label: 'Analyze emerging content engagement patterns for optimization opportunities',
        ownerHint: 'Content Team',
        timeframeHint: 'Next week'
      }],
      agents: ['content_review', 'audience_suggester']
    },

    optimization: {
      promise: 'Generating content recommendations across strategic lanes to optimize your content portfolio performance.',
      metrics: [
        { label: 'Recommended Ideas', value: 'Building...', hint: 'Generating content opportunities' },
        { label: 'Persona Coverage', value: 'Analyzing...', hint: 'Evaluating audience segment coverage' },
        { label: 'Idea Confidence Index', value: `${Math.min(confidence + 10, 70)}/100`, hint: 'Confidence in recommendations' }
      ],
      overview: {
        summary: 'Content optimization analysis is generating recommendations across quick wins, strategic bets, and persona coverage gaps to enhance your content portfolio.',
        keyPoints: [
          'Content opportunity analysis is identifying high-impact, low-effort improvements',
          'Strategic content investments are being evaluated for long-term growth',
          'Persona coverage gaps are being analyzed to broaden audience reach',
          'Content performance data is informing recommendation confidence levels'
        ]
      },
      insights: [{
        title: 'Content Optimization Opportunity Analysis',
        description: 'Systematic evaluation of content opportunities across impact and effort dimensions',
        bullets: [
          'Quick win opportunities are being identified from high-performing content patterns',
          'Strategic content investments are being evaluated for competitive advantage',
          'Persona coverage analysis is revealing underserved audience segments'
        ]
      }],
      opportunities: [{
        label: 'Implement quick win content optimizations to achieve immediate engagement improvements',
        impactLevel: 'High' as const,
        effortLevel: 'Low' as const,
        confidence: 85
      }],
      nextSteps: [{
        label: 'Analyze content performance data to identify optimization patterns',
        ownerHint: 'Content Strategy Team',
        timeframeHint: 'Next 3 days'
      }, {
        label: 'Prioritize content recommendations by impact and implementation effort',
        ownerHint: 'Marketing Team',
        timeframeHint: 'Next week'
      }],
      agents: ['content_next_best_topics']
    },

    'experience-optimization': {
      promise: 'Optimizing content performance across channels to enhance user engagement and experience quality.',
      metrics: [
        { label: 'Content Performance Score', value: 'Analyzing...', hint: 'Evaluating content effectiveness' },
        { label: 'Experience Impact', value: 'Calculating...', hint: 'Measuring user experience improvements' },
        { label: 'Optimization Progress', value: `${Math.min(confidence + 5, 65)}/100`, hint: 'Content optimization advancement' }
      ],
      overview: {
        summary: 'Experience optimization analysis is examining content performance patterns and user engagement to identify enhancement opportunities across all touchpoints.',
        keyPoints: [
          'Content performance tracking is active across all experience touchpoints',
          'User engagement patterns are being analyzed for optimization insights',
          'Experience quality metrics are building baseline for improvement strategies',
          'Content optimization recommendations are being generated based on performance data'
        ]
      },
      insights: [{
        title: 'Content Experience Optimization Analysis',
        description: 'Comprehensive analysis of content performance and user experience enhancement opportunities',
        bullets: [
          'Content engagement systems are collecting comprehensive performance metrics',
          'User experience patterns are being analyzed for optimization opportunities',
          'Performance data is informing content enhancement strategy development'
        ]
      }],
      opportunities: [{
        label: 'Implement content optimization recommendations to enhance user experience quality',
        impactLevel: 'High' as const,
        effortLevel: 'Medium' as const,
        confidence: 80
      }],
      nextSteps: [{
        label: 'Continue content performance monitoring across all experience touchpoints',
        ownerHint: 'Experience Team',
        timeframeHint: 'Ongoing'
      }, {
        label: 'Analyze content optimization patterns for experience enhancement',
        ownerHint: 'Content Strategy Team',
        timeframeHint: 'Next week'
      }],
      agents: ['content_optimization', 'experience_analytics']
    },

    dxptools: {
      promise: 'Analyzing topic performance and content engagement to optimize DXP Tools Content Recommendations effectiveness.',
      metrics: [
        { label: 'Topics Analyzed', value: 'Processing...', hint: 'Analyzing content topic performance' },
        { label: 'Total Interactions', value: 'Calculating...', hint: 'Aggregating engagement metrics' },
        { label: 'Top Topic Share', value: 'Computing...', hint: 'Identifying leading topics' }
      ],
      overview: {
        summary: 'DXP Tools integration analysis is examining content recommendation performance and topic-level engagement patterns to optimize effectiveness.',
        keyPoints: [
          'Content recommendation performance is being tracked across all DXP Tools touchpoints',
          'Topic-level analysis is revealing engagement patterns and optimization opportunities',
          'Content performance data is building comprehensive baseline for improvements',
          'Integration health monitoring ensures optimal DXP Tools functionality'
        ]
      },
      insights: [{
        title: 'DXP Tools Performance Analysis',
        description: 'Comprehensive analysis of content recommendation effectiveness and topic performance patterns',
        bullets: [
          'Content recommendation systems are being monitored for performance optimization',
          'Topic performance data is accumulating for pattern recognition and insights',
          'Integration health metrics confirm proper DXP Tools functionality'
        ]
      }],
      opportunities: [{
        label: 'Optimize content recommendation algorithms based on topic performance patterns',
        impactLevel: 'Medium' as const,
        effortLevel: 'Medium' as const,
        confidence: 70
      }],
      nextSteps: [{
        label: 'Continue DXP Tools performance monitoring and data collection',
        ownerHint: 'Technical Team',
        timeframeHint: 'Ongoing'
      }, {
        label: 'Analyze topic performance patterns for recommendation optimization',
        ownerHint: 'Analytics Team',
        timeframeHint: 'Next 5 days'
      }],
      agents: ['content_recs_topic_performance', 'integration_health']
    }
  };

  return baseDefaults[tier];
}