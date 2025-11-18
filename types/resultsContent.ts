/**
 * Results Content Types - Normalized Schemas
 *
 * This file defines the normalized TypeScript interfaces for Results page content.
 * These schemas ensure consistency across all Results pages and enable proper
 * data transformation from OPAL agents to Results widgets.
 *
 * @version 1.0
 * @created 2024-11-18
 * @scope Phase 1: Content Recommendations focused, extensible for future DXP tools
 */

// =============================================================================
// BASE TYPES AND ENUMS
// =============================================================================

export type ConfidenceLevel = number; // 0-100
export type TrendDirection = 'up' | 'down' | 'flat';
export type DataSource = 'opal_live' | 'opal_cached' | 'simulated_fallback';
export type ContentType = 'article' | 'page' | 'resource' | 'video' | 'infographic' | 'tool' | 'other';
export type PriorityLevel = 'high' | 'medium' | 'low';
export type ImpactLevel = 'high' | 'medium' | 'low';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type TimeFrame = 'immediate' | 'short_term' | 'medium_term' | 'long_term';

/**
 * Base metadata for all content items
 */
export interface ContentMetadata {
  id: string;
  lastUpdated: string;
  dataSource: DataSource;
  confidence: ConfidenceLevel;
  version?: string;
}

/**
 * Language rules validation result
 */
export interface LanguageValidation {
  isValid: boolean;
  violations: string[];
  confidence: ConfidenceLevel;
}

// =============================================================================
// CONTENT ITEMS AND PERFORMANCE
// =============================================================================

/**
 * Normalized content item representation
 */
export interface ContentItem {
  id: string;
  title: string;
  url: string;
  type: ContentType;
  description?: string;
  publishDate?: string;
  lastModified?: string;
  author?: string;
  tags?: string[];
  category?: string;
  thumbnail?: string;
  metadata: ContentMetadata;
}

/**
 * Content performance metrics
 */
export interface ContentPerformanceMetrics {
  contentId: string;
  timeframe: string; // e.g., "30d", "7d", "24h"
  views: number;
  uniqueUsers: number;
  avgTimeOnPage: number; // seconds
  bounceRate: number; // 0-1
  conversionRate: number; // 0-1
  shareCount: number;
  commentCount: number;
  engagementScore: number; // 0-100 normalized score
  trend: {
    direction: TrendDirection;
    changePercent: number;
    comparisonPeriod: string;
  };
  metadata: ContentMetadata;
}

/**
 * Topic-specific performance data
 */
export interface TopicPerformance {
  topicId: string;
  topicLabel: string;
  description?: string;
  contentCount: number;
  totalInteractions: number;
  uniqueUsers: number;
  avgEngagementScore: number; // 0-100
  trend: {
    direction: TrendDirection;
    changePercent: number;
    timeframe: string;
  };
  topContent: ContentItem[];
  relatedTopics: string[];
  performance: ContentPerformanceMetrics;
  metadata: ContentMetadata;
}

// =============================================================================
// AUDIENCE AND PERSONALIZATION
// =============================================================================

/**
 * Audience segment definition
 */
export interface AudienceSegment {
  segmentId: string;
  segmentName: string;
  description: string;
  size: number; // estimated number of users
  characteristics: string[];
  contentPreferences: string[];
  engagementPatterns: {
    preferredContentTypes: ContentType[];
    avgSessionDuration: number;
    mostActiveHours: number[]; // 0-23 hour format
    devicePreferences: string[];
  };
  metadata: ContentMetadata;
}

/**
 * Persona-specific content summary
 */
export interface PersonaContentSummary {
  personaId: string;
  personaName: string;
  description: string;
  targetAudience: AudienceSegment;
  contentAlignment: {
    stronglyAligned: ContentItem[];
    moderatelyAligned: ContentItem[];
    needsImprovement: ContentItem[];
  };
  topTopics: string[];
  contentGaps: string[];
  recommendedContent: ContentItem[];
  performanceMetrics: ContentPerformanceMetrics;
  metadata: ContentMetadata;
}

/**
 * Personalization opportunity
 */
export interface PersonalizationOpportunity {
  opportunityId: string;
  title: string;
  description: string;
  targetPersona: string;
  targetSegment: AudienceSegment;
  currentPerformance: ContentPerformanceMetrics;
  potentialImpact: {
    level: ImpactLevel;
    estimatedImprovement: number; // percentage
    affectedUsers: number;
    confidenceLevel: ConfidenceLevel;
  };
  implementation: {
    difficulty: DifficultyLevel;
    timeframe: TimeFrame;
    requiredResources: string[];
    estimatedEffort: string; // e.g., "2-4 hours", "1-2 weeks"
  };
  relatedContent: ContentItem[];
  metadata: ContentMetadata;
}

// =============================================================================
// CONTENT QUALITY AND SEO
// =============================================================================

/**
 * Content quality assessment
 */
export interface ContentQualityAssessment {
  contentId: string;
  overallScore: number; // 0-100
  qualityFactors: {
    readability: {
      score: number; // 0-100
      readingLevel: string;
      avgSentenceLength: number;
      complexWordPercentage: number;
    };
    structure: {
      score: number; // 0-100
      hasHeadings: boolean;
      headingHierarchy: number; // 1-6 levels deep
      paragraphCount: number;
      listUsage: number;
    };
    engagement: {
      score: number; // 0-100
      hasCallToAction: boolean;
      imageCount: number;
      linkCount: number;
      interactiveElements: number;
    };
    freshness: {
      score: number; // 0-100
      lastUpdated: string;
      contentAge: number; // days
      needsUpdate: boolean;
    };
  };
  recommendations: string[];
  metadata: ContentMetadata;
}

/**
 * SEO assessment and recommendations
 */
export interface SEOAssessment {
  contentId: string;
  overallScore: number; // 0-100
  seoFactors: {
    technical: {
      score: number; // 0-100
      hasMetaTitle: boolean;
      hasMetaDescription: boolean;
      titleLength: number;
      descriptionLength: number;
      hasStructuredData: boolean;
      mobileOptimized: boolean;
    };
    content: {
      score: number; // 0-100
      keywordDensity: number; // 0-1
      primaryKeywords: string[];
      secondaryKeywords: string[];
      keywordDistribution: number; // 0-100
      contentLength: number; // word count
    };
    performance: {
      score: number; // 0-100
      loadTime: number; // milliseconds
      imageOptimization: number; // 0-100
      cacheStatus: boolean;
    };
  };
  improvements: {
    priority: PriorityLevel;
    category: string;
    description: string;
    estimatedImpact: ImpactLevel;
    implementationEffort: DifficultyLevel;
  }[];
  targetKeywords: string[];
  competitorAnalysis?: {
    avgCompetitorScore: number;
    competitorUrls: string[];
    opportunityAreas: string[];
  };
  metadata: ContentMetadata;
}

// =============================================================================
// RECOMMENDATIONS AND OPTIMIZATION
// =============================================================================

/**
 * Content recommendation
 */
export interface ContentRecommendation {
  recommendationId: string;
  title: string;
  description: string;
  category: 'creation' | 'optimization' | 'promotion' | 'analytics' | 'seo' | 'personalization';
  priority: PriorityLevel;
  impact: {
    level: ImpactLevel;
    estimatedImprovement: string;
    metricsAffected: string[];
    confidenceLevel: ConfidenceLevel;
  };
  implementation: {
    difficulty: DifficultyLevel;
    timeframe: TimeFrame;
    steps: string[];
    requiredTools: string[];
    estimatedEffort: string;
  };
  relatedContent: ContentItem[];
  successMetrics: string[];
  rationale: string;
  metadata: ContentMetadata;
}

/**
 * Engagement optimization strategy
 */
export interface EngagementStrategy {
  strategyId: string;
  name: string;
  description: string;
  targetAudience: AudienceSegment[];
  currentMetrics: {
    engagementRate: number; // 0-1
    avgTimeOnSite: number; // seconds
    conversionRate: number; // 0-1
    retentionRate: number; // 0-1
  };
  targetMetrics: {
    engagementRate: number; // 0-1
    avgTimeOnSite: number; // seconds
    conversionRate: number; // 0-1
    retentionRate: number; // 0-1
  };
  tactics: {
    tacticId: string;
    name: string;
    description: string;
    priority: PriorityLevel;
    estimatedImpact: ImpactLevel;
    implementationSteps: string[];
    successCriteria: string[];
  }[];
  timeline: string;
  budget: string;
  riskFactors: string[];
  metadata: ContentMetadata;
}

// =============================================================================
// DASHBOARD-SPECIFIC CONTENT MODELS
// =============================================================================

/**
 * Content Dashboard specific data model
 */
export interface ContentDashboardData {
  overview: {
    totalContent: number;
    avgQualityScore: number;
    avgSEOScore: number;
    contentNeedingAttention: number;
    lastAnalysisDate: string;
  };
  qualityDistribution: {
    high: number; // count of high-quality content
    medium: number;
    low: number;
    percentageBreakdown: {
      high: number; // 0-100
      medium: number;
      low: number;
    };
  };
  seoReadiness: {
    optimized: number; // count
    needsWork: number;
    critical: number;
    avgScore: number; // 0-100
  };
  topContent: ContentItem[];
  improvements: ContentRecommendation[];
  metadata: ContentMetadata;
}

/**
 * Insight Dashboard specific data model
 */
export interface InsightDashboardData {
  audienceOverview: {
    totalSegments: number;
    mostEngagedSegment: AudienceSegment;
    fastestGrowingSegment: AudienceSegment;
    contentAlignmentScore: number; // 0-100
  };
  personalizationMetrics: {
    opportunitiesIdentified: number;
    implementationRate: number; // 0-1
    avgImpactScore: number; // 0-100
    totalAffectedUsers: number;
  };
  contentGaps: {
    totalGaps: number;
    highPriorityGaps: number;
    gapsByCategory: { [category: string]: number };
    topGaps: string[];
  };
  opportunities: PersonalizationOpportunity[];
  personas: PersonaContentSummary[];
  metadata: ContentMetadata;
}

/**
 * Topic Performance Dashboard specific data model
 */
export interface TopicPerformanceDashboardData {
  overview: {
    totalTopics: number;
    topPerformingTopic: TopicPerformance;
    fastestGrowingTopic: TopicPerformance;
    avgEngagementScore: number; // 0-100
  };
  performanceDistribution: {
    highPerforming: number; // count
    average: number;
    underperforming: number;
    percentageBreakdown: {
      high: number; // 0-100
      average: number;
      underperforming: number;
    };
  };
  trendAnalysis: {
    growingTopics: TopicPerformance[];
    decliningTopics: TopicPerformance[];
    stableTopics: TopicPerformance[];
  };
  topicDetails: TopicPerformance[];
  recommendations: ContentRecommendation[];
  metadata: ContentMetadata;
}

/**
 * Engage Dashboard specific data model
 */
export interface EngageDashboardData {
  engagementOverview: {
    avgEngagementRate: number; // 0-1
    totalEngagements: number;
    engagementTrend: TrendDirection;
    bestPerformingContent: ContentItem;
  };
  optimizationMetrics: {
    recommendationsGenerated: number;
    implementedRecommendations: number;
    implementationRate: number; // 0-1
    avgImprovementSeen: number; // percentage
  };
  conversionInsights: {
    conversionRate: number; // 0-1
    conversionTrend: TrendDirection;
    topConvertingContent: ContentItem[];
    conversionOptimizationOpportunities: number;
  };
  strategies: EngagementStrategy[];
  recommendations: ContentRecommendation[];
  actionPlan: {
    immediateActions: string[];
    shortTermGoals: string[];
    longTermObjectives: string[];
  };
  metadata: ContentMetadata;
}

// =============================================================================
// RESULTS PAGE BASE STRUCTURE
// =============================================================================

/**
 * Results page hero section data
 */
export interface ResultsPageHero {
  title: string;
  promise: string; // One-sentence value proposition
  metrics: {
    label: string;
    value: string;
    hint?: string;
    trend?: {
      direction: TrendDirection;
      changePercent: number;
    };
  }[];
  confidence: ConfidenceLevel;
  lastUpdated: string;
}

/**
 * Results page overview section
 */
export interface ResultsPageOverview {
  summary: string; // Business impact explanation
  keyPoints: string[]; // 2-4 key takeaways
  context?: string; // Additional context when needed
  confidence: ConfidenceLevel;
}

/**
 * Results page insight item
 */
export interface ResultsPageInsight {
  insightId: string;
  title: string;
  description: string;
  category: string;
  priority: PriorityLevel;
  dataPoints: string[];
  visualData?: any; // Chart/graph data if applicable
  relatedContent?: ContentItem[];
  confidence: ConfidenceLevel;
}

/**
 * Results page opportunity item
 */
export interface ResultsPageOpportunity {
  opportunityId: string;
  title: string;
  description: string;
  impact: ImpactLevel;
  effort: DifficultyLevel;
  timeframe: TimeFrame;
  category: string;
  requirements: string[];
  expectedOutcome: string;
  relatedInsights: string[]; // References to insight IDs
  confidence: ConfidenceLevel;
}

/**
 * Results page next step item
 */
export interface ResultsPageNextStep {
  stepId: string;
  title: string;
  description: string;
  priority: PriorityLevel;
  timeframe: TimeFrame;
  effort: string;
  prerequisites: string[];
  deliverables: string[];
  successMetrics: string[];
  relatedOpportunities: string[]; // References to opportunity IDs
}

/**
 * Complete Results page content structure
 * This is the final format that all Results pages should conform to
 */
export interface ResultsPageContent {
  hero: ResultsPageHero;
  overview: ResultsPageOverview;
  insights: ResultsPageInsight[];
  opportunities: ResultsPageOpportunity[];
  nextSteps: ResultsPageNextStep[];
  meta: {
    pageId: string;
    tier: number;
    agents: string[];
    maturity: number; // 0-100 how complete/mature the content is
    lastUpdated: string;
    dataSource: DataSource;
    languageValidation: LanguageValidation;
    contentFingerprint: string; // Hash for uniqueness validation
  };
}

// =============================================================================
// SPECIALIZED CONTENT RECOMMENDATIONS TYPES
// =============================================================================

/**
 * Content Recommendations specific dashboard aggregation
 */
export interface ContentRecsDashboardContent {
  primaryDashboard: ResultsPageContent;
  subDashboards: {
    contentDashboard: ContentDashboardData & { resultsContent: ResultsPageContent };
    insightDashboard: InsightDashboardData & { resultsContent: ResultsPageContent };
    topicPerformance: TopicPerformanceDashboardData & { resultsContent: ResultsPageContent };
    engageDashboard: EngageDashboardData & { resultsContent: ResultsPageContent };
  };
  aggregatedMetrics: {
    overallHealthScore: number; // 0-100
    contentMaturityScore: number; // 0-100
    personalizationReadiness: number; // 0-100
    optimizationOpportunities: number;
    totalRecommendations: number;
  };
  metadata: ContentMetadata;
}

// =============================================================================
// VALIDATION AND UTILITY TYPES
// =============================================================================

/**
 * Content uniqueness validation result
 */
export interface ContentUniquenessResult {
  isUnique: boolean;
  similarityScore: number; // 0-1, higher = more similar
  duplicateElements: string[];
  similarContent: {
    pageId: string;
    similarity: number;
    overlappingElements: string[];
  }[];
  uniquenessScore: number; // 0-100, higher = more unique
}

/**
 * Data transformation result
 */
export interface DataTransformationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  warnings: string[];
  confidence: ConfidenceLevel;
  processingTime: number; // milliseconds
  dataSource: DataSource;
  transformationId: string;
}

/**
 * Cache metadata for Results content
 */
export interface ResultsContentCache {
  key: string;
  content: ResultsPageContent;
  expiry: string;
  lastAccessed: string;
  hitCount: number;
  metadata: ContentMetadata;
}

// =============================================================================
// EXPORT UTILITIES
// =============================================================================

/**
 * Type guards for data validation
 */
export const TypeGuards = {
  isContentItem: (obj: any): obj is ContentItem => {
    return obj && typeof obj.id === 'string' && typeof obj.title === 'string' && typeof obj.url === 'string';
  },

  isResultsPageContent: (obj: any): obj is ResultsPageContent => {
    return obj && obj.hero && obj.overview && Array.isArray(obj.insights) && Array.isArray(obj.opportunities) && Array.isArray(obj.nextSteps);
  },

  isContentPerformanceMetrics: (obj: any): obj is ContentPerformanceMetrics => {
    return obj && typeof obj.contentId === 'string' && typeof obj.views === 'number' && typeof obj.uniqueUsers === 'number';
  },

  isPersonalizationOpportunity: (obj: any): obj is PersonalizationOpportunity => {
    return obj && typeof obj.opportunityId === 'string' && typeof obj.title === 'string' && obj.potentialImpact && obj.implementation;
  }
};

/**
 * Default/empty content generators for fallback scenarios
 */
export const DefaultContent = {
  createEmptyResultsPageContent: (pageId: string): ResultsPageContent => ({
    hero: {
      title: 'Content Analysis in Progress',
      promise: 'Comprehensive content insights are being prepared for your review.',
      metrics: [
        { label: 'Analysis Progress', value: 'In Progress', hint: 'Content analysis is being performed' },
        { label: 'Data Confidence', value: '25%', hint: 'Building confidence as data flows in' },
        { label: 'Recommendations', value: 'Generating', hint: 'Optimization recommendations being prepared' }
      ],
      confidence: 25,
      lastUpdated: new Date().toISOString()
    },
    overview: {
      summary: 'Content optimization analysis is currently in progress. Results will be available shortly.',
      keyPoints: [
        'Content analysis is being performed across your digital properties',
        'Personalization opportunities are being identified',
        'Performance metrics are being compiled for comprehensive insights'
      ],
      confidence: 25
    },
    insights: [],
    opportunities: [],
    nextSteps: [],
    meta: {
      pageId,
      tier: 1,
      agents: [],
      maturity: 25,
      lastUpdated: new Date().toISOString(),
      dataSource: 'simulated_fallback',
      languageValidation: { isValid: true, violations: [], confidence: 100 },
      contentFingerprint: 'fallback-' + pageId + '-' + Date.now()
    }
  }),

  createEmptyContentMetadata: (): ContentMetadata => ({
    id: 'temp-' + Date.now(),
    lastUpdated: new Date().toISOString(),
    dataSource: 'simulated_fallback',
    confidence: 25,
    version: '1.0'
  })
};

// Re-export key types for easy importing
export type {
  ContentItem,
  ContentPerformanceMetrics,
  TopicPerformance,
  PersonalizationOpportunity,
  ContentRecommendation,
  ResultsPageContent,
  ContentRecsDashboardContent
};

export default {
  TypeGuards,
  DefaultContent
};