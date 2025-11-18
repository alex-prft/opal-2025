/**
 * Dynamic Context Integration (DCI) Orchestrator Types
 *
 * Advanced Results content generation system that progressively adds context
 * through quality scoring loops to generate specific, implementable, stack-aware
 * recommendations across Strategy Plans, Experience Optimization, Analytics Insights,
 * and DXP Tools sections.
 */

import { ResultsPageContent, MaturityPhase } from './results-content';

// =============================================================================
// Core DCI Types
// =============================================================================

export type ConfidenceLevel = "low" | "medium" | "high";

export type FocusArea =
  | "ContentImprovements"
  | "AnalyticsInsights"
  | "ExperienceTactics"
  | "StrategyPlans";

// =============================================================================
// Enhanced OSA Results Schema (extends existing ResultsPageContent)
// =============================================================================

export interface OSAResults {
  meta: {
    orgName?: string;
    industry?: string;
    region?: string;
    maturityPhase: MaturityPhase;
    primaryGoals: string[]; // e.g. ["Increase membership renewals", "Grow online revenue by 15%"]
    primaryKpis: string[];  // e.g. ["CVR", "AOV", "RPV", "CLV"]
    optiStack: string[];    // e.g. ["Optimizely WebX", "Optimizely CMS", "ODP", "Content Recommendations"]
    generationTimestamp: string;
    dciVersion: string;
    correlationId?: string;
  };

  // 1. Content Improvements (highest priority)
  contentImprovements: {
    overview: string; // brief narrative
    keyIssues: string[]; // e.g., "underperforming PLPs", "weak CTAs on PDPs"
    prioritizedActions: Array<{
      id: string;
      title: string;
      description: string;
      targetPagesOrSections: string[]; // URLs or page names
      expectedImpact: string; // narrative
      difficulty: "low" | "medium" | "high";
      timeFrameWeeks?: number;
      ownerType?: string; // e.g., "content editor", "developer", "designer"
      relatedKpis: string[];
      implementationSteps?: string[];
    }>;
    measurementNotes: string; // how to measure success
  };

  // 2. Actionable Analytics Insights
  analyticsInsights: {
    overview: string;
    keyFindings: Array<{
      id: string;
      summary: string; // human-readable insight
      metric: string;  // e.g., "Checkout CVR", "Blog engagement rate"
      currentValue?: string;
      issueOrOpportunity: "issue" | "opportunity" | "neutral";
      suggestedAction: string;
      relatedKpis: string[];
      confidence: ConfidenceLevel;
      dataSourceHints?: string[]; // e.g., ["Optimizely WebX results", "GA", "Contentsquare"]
      trendDirection?: "up" | "down" | "stable";
    }>;
    dataGaps: string[]; // where data is missing or weak
    recommendedAnalytics: string[]; // what analytics to implement
  };

  // 3. Experience tactics & use cases
  experienceTactics: {
    overview: string;
    experiments: Array<{
      id: string;
      name: string;
      hypothesis: string;
      whereToRun: string[]; // e.g., "Homepage hero", "PLP filters"
      audienceTargeting: string; // segments/personas
      requiredStack: string[];   // which Optimizely tools/features
      estimatedDurationWeeks?: number;
      successMetrics: string[];
      maturityFit: MaturityPhase[]; // where this tactic is appropriate
      implementationComplexity: "low" | "medium" | "high";
      expectedLift?: string; // e.g., "5-15% CVR improvement"
    }>;
    personalizationUseCases: Array<{
      id: string;
      title: string;
      scenario: string;
      audienceDefinition: string;
      logicOrTrigger: string;
      contentOrExperienceChange: string;
      toolsUsed: string[]; // e.g., ["ODP", "Content Recommendations"]
      successMetrics: string[];
      implementationEffort: "low" | "medium" | "high";
      expectedEngagementLift?: string;
    }>;
    uxOptimizations: Array<{
      id: string;
      title: string;
      description: string;
      affectedPages: string[];
      userImpact: string;
      technicalRequirements: string[];
      priority: "high" | "medium" | "low";
    }>;
  };

  // 4. Strategy Plans, phases & roadmaps
  strategyPlans: {
    narrativeSummary: string; // rollup story
    phasePlan: Array<{
      phase: MaturityPhase;
      timeHorizonMonths: number;
      focusAreas: FocusArea[];
      keyInitiatives: string[]; // high-level items
      dependencies?: string[];
      risks?: string[];
      successCriteria: string[];
      resourceRequirements?: string[];
    }>;
    roadmapItems: Array<{
      id: string;
      title: string;
      description: string;
      focusArea: FocusArea;
      maturityPhase: MaturityPhase;
      startOrder: number; // relative ordering
      durationWeeks?: number;
      ownerType?: string;
      relatedKpis: string[];
      prerequisites?: string[];
      deliverables: string[];
    }>;
    quarterlyMilestones: Array<{
      quarter: string; // e.g., "Q1 2025"
      milestones: string[];
      kpiTargets: { [kpi: string]: string };
    }>;
  };

  // Quality & confidence metadata
  generation: {
    totalPasses: number;
    finalQualityScore: number;
    contextBucketsUsed: string[];
    generationTimeMs: number;
    confidence: ConfidenceLevel;
    dataQualityNotes?: string[];
  };
}

// =============================================================================
// Results Quality Scoring Schema
// =============================================================================

export interface ResultsQualityScore {
  specificity: number;       // 1-5: Are recommendations tied to actual pages, journeys, and audiences?
  stackAlignment: number;    // 1-5: Does it use the Optimizely tools the customer actually has?
  maturityFit: number;       // 1-5: Are recommendations appropriate for the maturity phase?
  measurementRigor: number;  // 1-5: Are KPIs and measurement approaches clearly defined?
  actionability: number;     // 1-5: Are recommendations concrete and implementable?
  overall: number;           // 1-5 (not an average; model's judgement)

  issues: string[];          // human-readable list of problems
  missingAreas: FocusArea[]; // which focus areas are weak or missing
  recommendations: string[]; // how the next pass should improve

  // Detailed scoring breakdown
  contentImprovement: {
    score: number;
    issues: string[];
    strengths: string[];
  };
  analyticsInsights: {
    score: number;
    issues: string[];
    strengths: string[];
  };
  experienceTactics: {
    score: number;
    issues: string[];
    strengths: string[];
  };
  strategyPlans: {
    score: number;
    issues: string[];
    strengths: string[];
  };
}

// =============================================================================
// Context Buckets for Progressive Context Addition
// =============================================================================

export interface DciContextBuckets {
  contentContext?: {
    // Content & page-level context
    topTrafficPages: string[];   // URL or logical names
    underperformingPages: string[];
    highValuePages: string[];
    contentTypes: string[];      // e.g., "blog", "product detail", "calculator"
    knownContentIssues?: string[];
    contentPerformanceData?: {
      page: string;
      uniques: number;
      interactions: number;
      conversionRate?: number;
    }[];
    topicsData?: {
      topicId: string;
      topicLabel: string;
      performance: number;
      trendDirection: "up" | "down" | "stable";
    }[];
  };

  analyticsContext?: {
    keyMetrics: string[];        // e.g., ["Checkout CVR", "PLP bounce rate"]
    currentPerformance?: { [metric: string]: string | number };
    trendsSummary?: string;      // brief narrative trend
    notableWins?: string[];
    notableLosses?: string[];
    segmentationHighlights?: string[];
    dataSourcesAvailable: string[]; // e.g., ["GA4", "Optimizely", "Adobe Analytics"]
    dataQualityIssues?: string[];
  };

  experienceTacticsContext?: {
    knownWinningPatterns?: string[]; // e.g., "shorter forms improved completion"
    existingExperimentsSummary?: string[];
    runningExperiments?: {
      name: string;
      status: "running" | "analyzing" | "completed";
      estimatedLift?: string;
    }[];
    audienceSegments?: string[];
    channelMixInfo?: string[];
    deviceAndBrowserData?: {
      desktop: number;
      mobile: number;
      tablet: number;
    };
    userFlowData?: {
      step: string;
      dropOffRate: number;
      optimizationOpportunity?: string;
    }[];
  };

  strategyContext?: {
    orgConstraints?: string[];      // e.g., "limited dev bandwidth", "strict legal"
    timelineConstraints?: string[]; // e.g., "no major changes next 30 days"
    existingRoadmapNotes?: string[];
    leadershipPriorities?: string[];
    budgetConsiderations?: string[];
    technicalDebt?: string[];
    competitiveContext?: string[];
    regulatoryRequirements?: string[];
    teamCapabilities?: {
      development: "low" | "medium" | "high";
      design: "low" | "medium" | "high";
      analytics: "low" | "medium" | "high";
      content: "low" | "medium" | "high";
    };
  };
}

// =============================================================================
// DCI Orchestrator Configuration
// =============================================================================

export interface DciOrchestratorConfig {
  maxPasses: number;           // default: 3
  qualityThreshold: number;    // 1-5, default: 4
  timeoutMs: number;          // default: 120000 (2 minutes)

  // Context addition strategy
  contextStrategy: "priority_based" | "quality_driven" | "comprehensive";

  // LLM configuration
  llmConfig: {
    model: string;             // e.g., "gpt-4" or "claude-3-sonnet"
    temperature: number;       // default: 0.1 for consistency
    maxTokens: number;         // default: 4000
    timeout: number;           // per-call timeout in ms
  };

  // Feature flags
  features: {
    enableConsistencyCheck: boolean;
    enableAdvancedPersonalization: boolean;
    enableCompetitiveAnalysis: boolean;
    enablePredictiveInsights: boolean;
  };

  // Quality requirements
  qualityRequirements: {
    minimumSpecificity: number;      // 1-5
    minimumStackAlignment: number;   // 1-5
    minimumActionability: number;    // 1-5
    requireDataSources: boolean;     // must reference actual data sources
  };
}

// =============================================================================
// Integration with Existing Results System
// =============================================================================

/**
 * Mapping function to convert OSAResults to existing ResultsPageContent
 * This ensures backward compatibility with existing Results components
 */
export interface OSAResultsToResultsPageMapping {
  convertToResultsPageContent(osaResults: OSAResults, tier: 'strategy' | 'insights' | 'optimization' | 'dxptools'): ResultsPageContent;
}

// =============================================================================
// DCI Orchestrator Execution Context
// =============================================================================

export interface DciExecutionContext {
  correlationId: string;
  userId?: string;
  orgId?: string;

  // Input metadata
  baseMeta: OSAResults['meta'];
  contextBuckets: DciContextBuckets;
  config: DciOrchestratorConfig;

  // Execution tracking
  startTime: number;
  currentPass: number;
  passHistory: {
    pass: number;
    qualityScore: ResultsQualityScore;
    contextsAdded: string[];
    durationMs: number;
  }[];

  // Error handling
  errors: {
    pass: number;
    error: string;
    recoverable: boolean;
  }[];

  // Feature flags
  enableFallback: boolean;
  enableDetailedLogging: boolean;
}

// =============================================================================
// LLM Integration Types
// =============================================================================

export interface LLMRequest {
  type: 'generate_initial_results' | 'score_results' | 'refine_results_with_context' | 'consistency_check';
  payload: any;
  config: DciOrchestratorConfig['llmConfig'];
  timeoutMs: number;
}

export interface LLMResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  durationMs: number;
  tokensUsed?: number;
}

// =============================================================================
// Error Types & Handling
// =============================================================================

export class DciOrchestratorError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context: Partial<DciExecutionContext>,
    public readonly recoverable: boolean = false
  ) {
    super(message);
    this.name = 'DciOrchestratorError';
  }
}

export const DCI_ERROR_CODES = {
  LLM_TIMEOUT: 'LLM_TIMEOUT',
  INVALID_JSON_RESPONSE: 'INVALID_JSON_RESPONSE',
  CONTEXT_FETCH_FAILED: 'CONTEXT_FETCH_FAILED',
  QUALITY_THRESHOLD_NOT_MET: 'QUALITY_THRESHOLD_NOT_MET',
  MAX_PASSES_EXCEEDED: 'MAX_PASSES_EXCEEDED',
  CONFIGURATION_INVALID: 'CONFIGURATION_INVALID'
} as const;

// =============================================================================
// Integration Points with Existing OSA System
// =============================================================================

export interface OSAIntegrationPoints {
  // Data sources that feed into context buckets
  dataConnectors: {
    supabaseClient: any;        // existing Supabase client
    opalAgentOutputs: any[];    // agent outputs from OPAL system
    dxpToolsData: any[];        // data from DXP tools integration
    analyticsData: any;         // analytics data sources
  };

  // Content generation integration
  resultsSystem: {
    existingContentGenerator: (input: any) => Promise<ResultsPageContent>;
    resultsCacheManager: {
      get: (key: string) => Promise<any>;
      set: (key: string, value: any, ttl?: number) => Promise<void>;
    };
  };

  // Agent integration
  agentIntegration: {
    resultsContentOptimizer: {
      invoke: (input: any) => Promise<any>;
      config: any; // existing agent configuration
    };
  };
}

// =============================================================================
// Export Bundle
// =============================================================================

export {
  // Re-export existing types for convenience
  type ResultsPageContent,
  type MaturityPhase
} from './results-content';