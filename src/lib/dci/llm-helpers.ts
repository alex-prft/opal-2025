/**
 * LLM Helper Functions for DCI Orchestrator
 *
 * This module provides LLM integration functions for the Dynamic Context Integration
 * workflow, including prompt templates, response parsing, and error handling.
 */

import {
  OSAResults,
  ResultsQualityScore,
  DciContextBuckets,
  DciExecutionContext,
  LLMRequest,
  LLMResponse,
  DciOrchestratorError,
  DCI_ERROR_CODES
} from '@/types/dci-orchestrator';

// =============================================================================
// LLM Client Integration
// =============================================================================

import { getLLMClient as getClient, type LLMClient as Client } from './llm-client';

// =============================================================================
// Core LLM Helper Functions
// =============================================================================

/**
 * Generate initial OSAResults using minimal context
 */
export async function callLlmGenerateInitialResults(
  baseMeta: OSAResults['meta'],
  context: DciExecutionContext
): Promise<LLMResponse<OSAResults>> {
  const startTime = Date.now();

  try {
    const prompt = buildInitialGenerationPrompt(baseMeta);
    const llmClient = getClient(context.config.llmConfig);

    const response = await Promise.race([
      llmClient.generateCompletion(prompt, context.config.llmConfig),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('LLM timeout')), context.config.llmConfig.timeout)
      )
    ]);

    const parsedResults = parseOSAResultsResponse(response.content);

    return {
      success: true,
      data: parsedResults,
      durationMs: Date.now() - startTime
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('timeout')) {
      throw new DciOrchestratorError(
        'LLM request timed out during initial generation',
        DCI_ERROR_CODES.LLM_TIMEOUT,
        context,
        true // recoverable with retry
      );
    }

    return {
      success: false,
      error: errorMessage,
      durationMs: Date.now() - startTime
    };
  }
}

/**
 * Score the quality of OSAResults using structured rubric
 */
export async function callLlmScoreResults(
  results: OSAResults,
  baseMeta: OSAResults['meta'],
  context: DciExecutionContext
): Promise<LLMResponse<ResultsQualityScore>> {
  const startTime = Date.now();

  try {
    const prompt = buildQualityScoringPrompt(results, baseMeta);
    const llmClient = getClient(context.config.llmConfig);

    const response = await Promise.race([
      llmClient.generateCompletion(prompt, context.config.llmConfig),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('LLM timeout')), context.config.llmConfig.timeout)
      )
    ]);

    const parsedScore = parseQualityScoreResponse(response.content);

    return {
      success: true,
      data: parsedScore,
      durationMs: Date.now() - startTime
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      success: false,
      error: errorMessage,
      durationMs: Date.now() - startTime
    };
  }
}

/**
 * Refine OSAResults with additional context
 */
export async function callLlmRefineResultsWithContext(args: {
  previousResults: OSAResults;
  qualityScore: ResultsQualityScore;
  additionalContext: DciContextBuckets;
  context: DciExecutionContext;
}): Promise<LLMResponse<OSAResults>> {
  const startTime = Date.now();

  try {
    const prompt = buildRefinementPrompt(args);
    const llmClient = getClient(args.context.config.llmConfig);

    const response = await Promise.race([
      llmClient.generateCompletion(prompt, args.context.config.llmConfig),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('LLM timeout')), args.context.config.llmConfig.timeout)
      )
    ]);

    const parsedResults = parseOSAResultsResponse(response.content);

    return {
      success: true,
      data: parsedResults,
      durationMs: Date.now() - startTime
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      success: false,
      error: errorMessage,
      durationMs: Date.now() - startTime
    };
  }
}

/**
 * Optional consistency check to fix internal inconsistencies
 */
export async function callLlmConsistencyCheck(
  results: OSAResults,
  context: DciExecutionContext
): Promise<LLMResponse<OSAResults>> {
  const startTime = Date.now();

  try {
    const prompt = buildConsistencyCheckPrompt(results);
    const llmClient = getClient(context.config.llmConfig);

    const response = await Promise.race([
      llmClient.generateCompletion(prompt, context.config.llmConfig),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('LLM timeout')), context.config.llmConfig.timeout)
      )
    ]);

    const parsedResults = parseOSAResultsResponse(response.content);

    return {
      success: true,
      data: parsedResults,
      durationMs: Date.now() - startTime
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      success: false,
      error: errorMessage,
      durationMs: Date.now() - startTime
    };
  }
}

// =============================================================================
// Prompt Templates
// =============================================================================

/**
 * Base generation prompt template (LLM call #1)
 */
function buildInitialGenerationPrompt(baseMeta: OSAResults['meta']): string {
  return `You are the OSA Results Orchestrator.
You generate structured recommendations for an Optimizely DXP customer, focused on:
1. Content Improvements
2. Actionable Analytics Insights
3. Tactics & use cases for improving the experience
4. Rollup into Strategy Plans, phases, and roadmaps.

Use only the tools, data, and stack provided in the context. Do NOT invent technologies or features.

Your output MUST be valid JSON matching the OSAResults schema.
Be concrete, practical, and aligned with the customer's maturity phase.
Avoid buzzwords and generic advice.

INPUT CONTEXT:
${JSON.stringify({
  task: "generate_initial_results",
  schema: "OSAResults",
  baseInput: {
    meta: baseMeta
  },
  instructions: [
    "Prioritize Content Improvements first.",
    "Then generate Analytics Insights that explain the content and behavioral issues.",
    "Then propose Experience tactics (experiments + personalization use cases).",
    "Finally, roll everything into Strategy Plans and roadmap items.",
    "Ensure all recommendations use only the Optimizely tools specified in optiStack.",
    "Make timeframes and effort estimates realistic for the maturity phase.",
    "Include specific implementation steps and owner types."
  ]
}, null, 2)}

Respond with ONLY a valid JSON object conforming to the OSAResults schema.`;
}

/**
 * Quality scoring prompt template (LLM call #2)
 */
function buildQualityScoringPrompt(results: OSAResults, baseMeta: OSAResults['meta']): string {
  return `You are a strict reviewer for OSA Results.
You evaluate the quality of an OSAResults JSON response against a rubric.
Output MUST be a valid ResultsQualityScore JSON as specified.

EVALUATION INPUT:
${JSON.stringify({
  task: "score_results",
  schema: "ResultsQualityScore",
  inputs: {
    osaResults: results,
    meta: {
      optiStack: baseMeta.optiStack,
      maturityPhase: baseMeta.maturityPhase,
      primaryGoals: baseMeta.primaryGoals,
      primaryKpis: baseMeta.primaryKpis
    }
  },
  rubric: {
    specificity: "Are recommendations tied to actual pages, journeys, and audiences? (1-5)",
    stackAlignment: "Does it use the Optimizely tools the customer actually has? (1-5)",
    maturityFit: "Are recommendations appropriate for the maturity phase? (1-5)",
    measurementRigor: "Are KPIs and measurement approaches clearly defined? (1-5)",
    actionability: "Are recommendations concrete and implementable? (1-5)"
  },
  focusAreaEvaluation: {
    contentImprovement: "Are content improvements specific to pages and have clear implementation steps?",
    analyticsInsights: "Do insights reference actual metrics and provide actionable next steps?",
    experienceTactics: "Are experiments and personalization realistic for the stack and maturity?",
    strategyPlans: "Is the roadmap logical with proper dependencies and realistic timelines?"
  }
}, null, 2)}

Respond with ONLY a valid JSON object conforming to the ResultsQualityScore schema.`;
}

/**
 * Refinement prompt template (LLM call #3+)
 */
function buildRefinementPrompt(args: {
  previousResults: OSAResults;
  qualityScore: ResultsQualityScore;
  additionalContext: DciContextBuckets;
  context: DciExecutionContext;
}): string {
  return `You are improving an OSAResults JSON using additional context.
You MUST:
• Keep the OSAResults schema intact.
• Preserve useful content from the previous version, but improve weak areas.
• Focus first on Content Improvements, then Analytics Insights, then Experience tactics, then Strategy plans.
• Use only context provided by the user. Do not invent data.

Output ONLY a complete OSAResults JSON object.

REFINEMENT INPUT:
${JSON.stringify({
  task: "refine_results_with_context",
  schema: "OSAResults",
  previousResults: args.previousResults,
  qualityScore: args.qualityScore,
  additionalContext: args.additionalContext,
  instructions: [
    "Address each issue in qualityScore.issues and missingAreas.",
    "Make contentImprovements.prioritizedActions specific to the pages in contentContext.",
    "Make analyticsInsights.keyFindings reference metrics in analyticsContext.keyMetrics where possible.",
    "Make experienceTactics.experiments and personalizationUseCases leverage org tools and segments provided.",
    "Adjust strategyPlans.phasePlan and roadmapItems to be realistic given constraints.",
    "Increase specificity by using actual page names, metrics, and tools from context.",
    "Ensure all recommendations are implementable with the provided stack and capabilities."
  ]
}, null, 2)}

Respond with ONLY a complete OSAResults JSON object.`;
}

/**
 * Consistency check prompt template (LLM call #final)
 */
function buildConsistencyCheckPrompt(results: OSAResults): string {
  return `You are a consistency checker.
Given an OSAResults JSON, fix internal inconsistencies and unrealistic claims, but keep the overall structure and intent.
Output ONLY a corrected OSAResults JSON.

CONSISTENCY CHECK INPUT:
${JSON.stringify({
  task: "consistency_check",
  osaResults: results,
  constraints: [
    "Do not change the maturityPhase.",
    "Do not remove core goals or KPIs.",
    "Ensure time frames and difficulty levels are realistic and consistent.",
    "Verify that KPI references are consistent across all sections.",
    "Check that tool references match the available optiStack.",
    "Ensure roadmap dependencies are logical and achievable.",
    "Validate that effort estimates align with implementation complexity."
  ]
}, null, 2)}

Respond with ONLY a corrected OSAResults JSON object.`;
}

// =============================================================================
// Response Parsing Functions
// =============================================================================

/**
 * Parse and validate OSAResults JSON response
 */
function parseOSAResultsResponse(response: string): OSAResults {
  try {
    // Clean response of any markdown formatting or extra text
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Basic validation of required fields
    if (!parsed.meta || !parsed.contentImprovements || !parsed.analyticsInsights ||
        !parsed.experienceTactics || !parsed.strategyPlans) {
      throw new Error('Missing required sections in OSAResults');
    }

    // Add generation metadata if missing
    if (!parsed.generation) {
      parsed.generation = {
        totalPasses: 1,
        finalQualityScore: 0,
        contextBucketsUsed: [],
        generationTimeMs: 0,
        confidence: 'medium' as const,
        dataQualityNotes: []
      };
    }

    return parsed as OSAResults;

  } catch (error) {
    throw new DciOrchestratorError(
      `Failed to parse OSAResults response: ${error instanceof Error ? error.message : 'Unknown error'}`,
      DCI_ERROR_CODES.INVALID_JSON_RESPONSE,
      {},
      false
    );
  }
}

/**
 * Parse and validate ResultsQualityScore JSON response
 */
function parseQualityScoreResponse(response: string): ResultsQualityScore {
  try {
    // Clean response of any markdown formatting or extra text
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Basic validation of required fields
    if (typeof parsed.specificity !== 'number' || typeof parsed.stackAlignment !== 'number' ||
        typeof parsed.maturityFit !== 'number' || typeof parsed.measurementRigor !== 'number' ||
        typeof parsed.overall !== 'number') {
      throw new Error('Missing or invalid scoring fields in ResultsQualityScore');
    }

    // Ensure arrays exist
    if (!Array.isArray(parsed.issues)) parsed.issues = [];
    if (!Array.isArray(parsed.missingAreas)) parsed.missingAreas = [];
    if (!Array.isArray(parsed.recommendations)) parsed.recommendations = [];

    return parsed as ResultsQualityScore;

  } catch (error) {
    throw new DciOrchestratorError(
      `Failed to parse ResultsQualityScore response: ${error instanceof Error ? error.message : 'Unknown error'}`,
      DCI_ERROR_CODES.INVALID_JSON_RESPONSE,
      {},
      false
    );
  }
}

// =============================================================================
// Context Selection Logic
// =============================================================================

/**
 * Select which context buckets to add based on quality score and priority
 */
export function selectContextForNextPass(input: {
  quality: ResultsQualityScore;
  contextBuckets: DciContextBuckets;
  currentPass: number;
}): DciContextBuckets {
  const { quality, contextBuckets, currentPass } = input;
  const selected: DciContextBuckets = {};

  // Priority order based on DCI specification:
  // 1) ContentImprovements -> contentContext
  // 2) AnalyticsInsights -> analyticsContext
  // 3) ExperienceTactics -> experienceTacticsContext
  // 4) StrategyPlans -> strategyContext

  // Always prioritize based on missing areas first
  for (const area of quality.missingAreas) {
    if (area === "ContentImprovements" && contextBuckets.contentContext) {
      selected.contentContext = contextBuckets.contentContext;
    }
    if (area === "AnalyticsInsights" && contextBuckets.analyticsContext) {
      selected.analyticsContext = contextBuckets.analyticsContext;
    }
    if (area === "ExperienceTactics" && contextBuckets.experienceTacticsContext) {
      selected.experienceTacticsContext = contextBuckets.experienceTacticsContext;
    }
    if (area === "StrategyPlans" && contextBuckets.strategyContext) {
      selected.strategyContext = contextBuckets.strategyContext;
    }
  }

  // If no missing areas, add context based on lowest scores
  if (Object.keys(selected).length === 0) {
    const scores = [
      { area: "ContentImprovements", score: quality.contentImprovement?.score || 0, context: contextBuckets.contentContext },
      { area: "AnalyticsInsights", score: quality.analyticsInsights?.score || 0, context: contextBuckets.analyticsContext },
      { area: "ExperienceTactics", score: quality.experienceTactics?.score || 0, context: contextBuckets.experienceTacticsContext },
      { area: "StrategyPlans", score: quality.strategyPlans?.score || 0, context: contextBuckets.strategyContext }
    ].filter(item => item.context) // Only include available contexts
     .sort((a, b) => a.score - b.score); // Sort by lowest score first

    // Add context for the lowest scoring area
    if (scores.length > 0) {
      const lowestScore = scores[0];
      if (lowestScore.area === "ContentImprovements") {
        selected.contentContext = contextBuckets.contentContext;
      } else if (lowestScore.area === "AnalyticsInsights") {
        selected.analyticsContext = contextBuckets.analyticsContext;
      } else if (lowestScore.area === "ExperienceTactics") {
        selected.experienceTacticsContext = contextBuckets.experienceTacticsContext;
      } else if (lowestScore.area === "StrategyPlans") {
        selected.strategyContext = contextBuckets.strategyContext;
      }
    }
  }

  // Limit context addition based on pass number to avoid overwhelming the model
  if (currentPass >= 2) {
    // After pass 2, be more selective and only add one context bucket
    const keys = Object.keys(selected);
    if (keys.length > 1) {
      const firstKey = keys[0] as keyof DciContextBuckets;
      const firstValue = selected[firstKey];
      return { [firstKey]: firstValue } as DciContextBuckets;
    }
  }

  return selected;
}

// =============================================================================
// Fallback Functions
// =============================================================================

/**
 * Generate fallback OSAResults when LLM calls fail
 */
export function generateFallbackResults(baseMeta: OSAResults['meta']): OSAResults {
  return {
    meta: {
      ...baseMeta,
      generationTimestamp: new Date().toISOString(),
      dciVersion: '1.0.0'
    },
    contentImprovements: {
      overview: "Content analysis is in progress. We're building insights as data collection continues.",
      keyIssues: ["Data collection and analysis in progress"],
      prioritizedActions: [{
        id: 'fallback-1',
        title: 'Continue content data collection and analysis',
        description: 'Baseline content performance metrics are being established to identify optimization opportunities.',
        targetPagesOrSections: ['All content areas'],
        expectedImpact: 'Foundation for future optimization insights',
        difficulty: 'low',
        timeFrameWeeks: 2,
        ownerType: 'Content Team',
        relatedKpis: baseMeta.primaryKpis || ['Engagement', 'Performance']
      }],
      measurementNotes: 'Metrics will be tracked as baseline data accumulates'
    },
    analyticsInsights: {
      overview: "Analytics tracking is being established to provide comprehensive insights.",
      keyFindings: [{
        id: 'analytics-fallback-1',
        summary: 'Analytics systems are operational and collecting baseline performance data',
        metric: 'System Health',
        currentValue: 'Active',
        issueOrOpportunity: 'neutral',
        suggestedAction: 'Continue data collection to build comprehensive analytics baseline',
        relatedKpis: baseMeta.primaryKpis || ['Performance'],
        confidence: 'medium'
      }],
      dataGaps: ['Historical performance trends', 'Comparative benchmarks'],
      recommendedAnalytics: ['Performance tracking', 'Engagement measurement', 'Conversion analysis']
    },
    experienceTactics: {
      overview: "Experience optimization framework is being established for systematic improvements.",
      experiments: [{
        id: 'exp-fallback-1',
        name: 'Baseline Performance Measurement',
        hypothesis: 'Establishing comprehensive baseline metrics will enable identification of optimization opportunities',
        whereToRun: ['Primary content areas'],
        audienceTargeting: 'All users',
        requiredStack: baseMeta.optiStack || ['Optimizely WebX'],
        estimatedDurationWeeks: 4,
        successMetrics: baseMeta.primaryKpis || ['Engagement'],
        maturityFit: [baseMeta.maturityPhase],
        implementationComplexity: 'low'
      }],
      personalizationUseCases: [{
        id: 'pers-fallback-1',
        title: 'Content Relevance Optimization',
        scenario: 'Deliver more relevant content based on user behavior patterns',
        audienceDefinition: 'All users with sufficient interaction data',
        logicOrTrigger: 'User engagement patterns and content preferences',
        contentOrExperienceChange: 'Personalized content recommendations and layout optimization',
        toolsUsed: baseMeta.optiStack || ['Content Recommendations'],
        successMetrics: ['Engagement rate', 'Time on page'],
        implementationEffort: 'medium'
      }],
      uxOptimizations: [{
        id: 'ux-fallback-1',
        title: 'User Experience Baseline Assessment',
        description: 'Comprehensive assessment of current user experience patterns and optimization opportunities',
        affectedPages: ['All major user touchpoints'],
        userImpact: 'Improved understanding of user needs and experience gaps',
        technicalRequirements: ['Analytics tracking', 'User feedback collection'],
        priority: 'high'
      }]
    },
    strategyPlans: {
      narrativeSummary: `Strategic planning for ${baseMeta.orgName || 'your organization'} is focused on building a solid foundation in the ${baseMeta.maturityPhase} phase. We're establishing baseline metrics, implementing tracking systems, and preparing for systematic optimization as data accumulates.`,
      phasePlan: [{
        phase: baseMeta.maturityPhase,
        timeHorizonMonths: baseMeta.maturityPhase === 'crawl' ? 3 : baseMeta.maturityPhase === 'walk' ? 6 : 12,
        focusAreas: ['ContentImprovements', 'AnalyticsInsights'],
        keyInitiatives: [
          'Establish comprehensive analytics baseline',
          'Implement systematic content tracking',
          'Build optimization framework'
        ],
        dependencies: ['Analytics implementation', 'Content audit completion'],
        risks: ['Insufficient data collection', 'Resource constraints'],
        successCriteria: ['Comprehensive data collection operational', 'Baseline metrics established'],
        resourceRequirements: ['Analytics team', 'Content team coordination']
      }],
      roadmapItems: [{
        id: 'roadmap-fallback-1',
        title: 'Analytics and Tracking Foundation',
        description: 'Establish comprehensive analytics tracking and baseline measurement systems',
        focusArea: 'AnalyticsInsights',
        maturityPhase: baseMeta.maturityPhase,
        startOrder: 1,
        durationWeeks: 4,
        ownerType: 'Analytics Team',
        relatedKpis: baseMeta.primaryKpis || ['Performance'],
        prerequisites: ['Team alignment'],
        deliverables: ['Analytics implementation', 'Baseline metrics dashboard', 'Tracking validation']
      }],
      quarterlyMilestones: [{
        quarter: 'Current Quarter',
        milestones: ['Analytics foundation established', 'Baseline data collection operational'],
        kpiTargets: baseMeta.primaryKpis.reduce((acc, kpi) => ({ ...acc, [kpi]: 'Baseline established' }), {})
      }]
    },
    generation: {
      totalPasses: 1,
      finalQualityScore: 2.5, // Fallback quality score
      contextBucketsUsed: [],
      generationTimeMs: 0,
      confidence: 'low',
      dataQualityNotes: ['Fallback content generated due to system constraints']
    }
  };
}