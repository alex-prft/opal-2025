/**
 * DCI Orchestrator Core Implementation
 *
 * Dynamic Context Integration Orchestrator that progressively adds context
 * to improve Results content quality through iterative LLM passes with
 * quality scoring feedback loops.
 */

import {
  OSAResults,
  ResultsQualityScore,
  DciContextBuckets,
  DciExecutionContext,
  DciOrchestratorConfig,
  DciOrchestratorError,
  DCI_ERROR_CODES,
  ConfidenceLevel
} from '@/types/dci-orchestrator';

import {
  callLlmGenerateInitialResults,
  callLlmScoreResults,
  callLlmRefineResultsWithContext,
  callLlmConsistencyCheck,
  selectContextForNextPass,
  generateFallbackResults
} from './llm-helpers';

// =============================================================================
// Default Configuration
// =============================================================================

const DEFAULT_DCI_CONFIG: DciOrchestratorConfig = {
  maxPasses: 3,
  qualityThreshold: 4.0,
  timeoutMs: 120000, // 2 minutes

  contextStrategy: 'priority_based',

  llmConfig: {
    model: 'gpt-4', // TODO: Configure based on available LLM service
    temperature: 0.1,
    maxTokens: 4000,
    timeout: 60000 // 1 minute per call
  },

  features: {
    enableConsistencyCheck: true,
    enableAdvancedPersonalization: true,
    enableCompetitiveAnalysis: false,
    enablePredictiveInsights: false
  },

  qualityRequirements: {
    minimumSpecificity: 3.0,
    minimumStackAlignment: 4.0,
    minimumActionability: 3.5,
    requireDataSources: true
  }
};

// =============================================================================
// Core DCI Orchestrator Implementation
// =============================================================================

/**
 * Main DCI Orchestrator function - coordinates the entire dynamic context integration workflow
 */
export async function runDciOrchestrator(input: {
  baseMeta: OSAResults['meta'];
  contextBuckets: DciContextBuckets;
  config?: Partial<DciOrchestratorConfig>;
  correlationId?: string;
}): Promise<OSAResults> {

  const config = { ...DEFAULT_DCI_CONFIG, ...input.config };
  const correlationId = input.correlationId || generateCorrelationId();

  // Initialize execution context
  const context: DciExecutionContext = {
    correlationId,
    baseMeta: input.baseMeta,
    contextBuckets: input.contextBuckets,
    config,
    startTime: Date.now(),
    currentPass: 0,
    passHistory: [],
    errors: [],
    enableFallback: true,
    enableDetailedLogging: process.env.NODE_ENV === 'development'
  };

  try {
    if (context.enableDetailedLogging) {
      console.log(`[DCI] Starting orchestration for ${input.baseMeta.orgName || 'organization'} (${correlationId})`);
    }

    // Step 1: Generate initial results with minimal context
    let results = await generateInitialResults(context);
    let currentPass = 1;

    // Step 2: Iterative improvement through quality scoring and context addition
    while (currentPass <= config.maxPasses) {
      const passStartTime = Date.now();

      try {
        // Score current results quality
        const qualityResponse = await callLlmScoreResults(results, input.baseMeta, context);

        if (!qualityResponse.success || !qualityResponse.data) {
          if (context.enableDetailedLogging) {
            console.warn(`[DCI] Quality scoring failed on pass ${currentPass}: ${qualityResponse.error}`);
          }
          break; // Exit loop if scoring fails
        }

        const qualityScore = qualityResponse.data;

        // Log pass results
        const passDuration = Date.now() - passStartTime;
        context.passHistory.push({
          pass: currentPass,
          qualityScore,
          contextsAdded: [], // Will be populated if refinement occurs
          durationMs: passDuration
        });

        if (context.enableDetailedLogging) {
          console.log(`[DCI] Pass ${currentPass} quality: ${qualityScore.overall}/5 (target: ${config.qualityThreshold})`);
          if (qualityScore.issues.length > 0) {
            console.log(`[DCI] Issues identified:`, qualityScore.issues);
          }
        }

        // Check if quality threshold is met
        if (qualityScore.overall >= config.qualityThreshold) {
          if (context.enableDetailedLogging) {
            console.log(`[DCI] Quality threshold met on pass ${currentPass}`);
          }
          break;
        }

        // Check if we've reached max passes
        if (currentPass >= config.maxPasses) {
          if (context.enableDetailedLogging) {
            console.log(`[DCI] Max passes (${config.maxPasses}) reached`);
          }
          break;
        }

        // Select additional context for next refinement
        const additionalContext = selectContextForNextPass({
          quality: qualityScore,
          contextBuckets: input.contextBuckets,
          currentPass
        });

        if (Object.keys(additionalContext).length === 0) {
          if (context.enableDetailedLogging) {
            console.log(`[DCI] No additional context available for refinement`);
          }
          break;
        }

        // Track contexts being added
        const contextsAdded = Object.keys(additionalContext);
        context.passHistory[context.passHistory.length - 1].contextsAdded = contextsAdded;

        if (context.enableDetailedLogging) {
          console.log(`[DCI] Adding context for refinement:`, contextsAdded);
        }

        // Refine results with additional context
        const refinementResponse = await callLlmRefineResultsWithContext({
          previousResults: results,
          qualityScore,
          additionalContext,
          context
        });

        if (refinementResponse.success && refinementResponse.data) {
          results = refinementResponse.data;

          // Update generation metadata
          results.generation = {
            ...results.generation,
            totalPasses: currentPass + 1,
            contextBucketsUsed: [...new Set([
              ...results.generation.contextBucketsUsed,
              ...contextsAdded
            ])],
            generationTimeMs: Date.now() - context.startTime
          };
        } else {
          if (context.enableDetailedLogging) {
            console.warn(`[DCI] Refinement failed on pass ${currentPass}: ${refinementResponse.error}`);
          }
          break;
        }

        currentPass++;
        context.currentPass = currentPass;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        context.errors.push({
          pass: currentPass,
          error: errorMessage,
          recoverable: error instanceof DciOrchestratorError ? error.recoverable : false
        });

        if (context.enableDetailedLogging) {
          console.error(`[DCI] Error on pass ${currentPass}:`, errorMessage);
        }

        // Continue to next pass if error is recoverable, otherwise break
        if (!(error instanceof DciOrchestratorError) || !error.recoverable) {
          break;
        }

        currentPass++;
        context.currentPass = currentPass;
      }
    }

    // Step 3: Optional consistency check
    if (config.features.enableConsistencyCheck) {
      try {
        const consistencyResponse = await callLlmConsistencyCheck(results, context);

        if (consistencyResponse.success && consistencyResponse.data) {
          results = consistencyResponse.data;

          if (context.enableDetailedLogging) {
            console.log(`[DCI] Consistency check completed successfully`);
          }
        }
      } catch (error) {
        if (context.enableDetailedLogging) {
          console.warn(`[DCI] Consistency check failed, using previous results:`, error);
        }
        // Continue with previous results if consistency check fails
      }
    }

    // Step 4: Finalize results with metadata
    const finalResults = finalizeResults(results, context);

    if (context.enableDetailedLogging) {
      const totalDuration = Date.now() - context.startTime;
      console.log(`[DCI] Orchestration completed in ${totalDuration}ms with ${context.passHistory.length} passes`);
    }

    return finalResults;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (context.enableDetailedLogging) {
      console.error(`[DCI] Fatal error in orchestration:`, errorMessage);
    }

    // Return fallback results if main orchestration fails
    if (context.enableFallback) {
      const fallbackResults = generateFallbackResults(input.baseMeta);

      fallbackResults.generation = {
        ...fallbackResults.generation,
        totalPasses: context.passHistory.length,
        generationTimeMs: Date.now() - context.startTime,
        dataQualityNotes: [
          ...(fallbackResults.generation.dataQualityNotes || []),
          `Fallback generated due to orchestration error: ${errorMessage}`
        ]
      };

      return fallbackResults;
    }

    throw new DciOrchestratorError(
      `DCI Orchestration failed: ${errorMessage}`,
      DCI_ERROR_CODES.MAX_PASSES_EXCEEDED,
      context,
      false
    );
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Generate initial results with minimal context
 */
async function generateInitialResults(context: DciExecutionContext): Promise<OSAResults> {
  try {
    const response = await callLlmGenerateInitialResults(context.baseMeta, context);

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Initial generation failed');
    }

    const results = response.data;

    // Initialize generation metadata
    results.generation = {
      totalPasses: 1,
      finalQualityScore: 0,
      contextBucketsUsed: [],
      generationTimeMs: response.durationMs,
      confidence: 'medium' as ConfidenceLevel,
      dataQualityNotes: []
    };

    return results;

  } catch (error) {
    if (context.enableDetailedLogging) {
      console.warn(`[DCI] Initial generation failed, using fallback:`, error);
    }

    // Use fallback if initial generation fails
    return generateFallbackResults(context.baseMeta);
  }
}

/**
 * Finalize results with complete metadata and quality assessment
 */
function finalizeResults(results: OSAResults, context: DciExecutionContext): OSAResults {
  const totalDuration = Date.now() - context.startTime;

  // Calculate final quality score from pass history
  const finalQualityScore = context.passHistory.length > 0
    ? context.passHistory[context.passHistory.length - 1].qualityScore.overall
    : 2.5; // Default moderate score

  // Determine final confidence level
  const confidence: ConfidenceLevel =
    finalQualityScore >= 4.0 ? 'high' :
    finalQualityScore >= 3.0 ? 'medium' : 'low';

  // Collect all context buckets used
  const allContextsUsed = context.passHistory
    .flatMap(pass => pass.contextsAdded)
    .filter((context, index, array) => array.indexOf(context) === index);

  // Prepare data quality notes
  const dataQualityNotes: string[] = [];

  if (context.errors.length > 0) {
    dataQualityNotes.push(`${context.errors.length} processing errors encountered during generation`);
  }

  if (finalQualityScore < 3.0) {
    dataQualityNotes.push('Quality score below optimal threshold - recommendations may need validation');
  }

  if (allContextsUsed.length === 0) {
    dataQualityNotes.push('Generated with minimal context - specificity may be limited');
  }

  // Update final results with complete metadata
  return {
    ...results,
    meta: {
      ...results.meta,
      generationTimestamp: new Date().toISOString(),
      dciVersion: '1.0.0',
      correlationId: context.correlationId
    },
    generation: {
      totalPasses: context.passHistory.length || 1,
      finalQualityScore,
      contextBucketsUsed: allContextsUsed,
      generationTimeMs: totalDuration,
      confidence,
      dataQualityNotes
    }
  };
}

/**
 * Generate a unique correlation ID for tracking
 */
function generateCorrelationId(): string {
  return `dci_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// =============================================================================
// Quality Assessment Functions
// =============================================================================

/**
 * Validate if results meet minimum quality requirements
 */
export function validateQualityRequirements(
  results: OSAResults,
  qualityScore: ResultsQualityScore,
  config: DciOrchestratorConfig
): { isValid: boolean; violations: string[] } {
  const violations: string[] = [];

  if (qualityScore.specificity < config.qualityRequirements.minimumSpecificity) {
    violations.push(`Specificity score ${qualityScore.specificity} below minimum ${config.qualityRequirements.minimumSpecificity}`);
  }

  if (qualityScore.stackAlignment < config.qualityRequirements.minimumStackAlignment) {
    violations.push(`Stack alignment score ${qualityScore.stackAlignment} below minimum ${config.qualityRequirements.minimumStackAlignment}`);
  }

  if (qualityScore.actionability < config.qualityRequirements.minimumActionability) {
    violations.push(`Actionability score ${qualityScore.actionability} below minimum ${config.qualityRequirements.minimumActionability}`);
  }

  if (config.qualityRequirements.requireDataSources) {
    // Check if analytics insights reference actual data sources
    const hasDataSources = results.analyticsInsights.keyFindings.some(
      finding => finding.dataSourceHints && finding.dataSourceHints.length > 0
    );

    if (!hasDataSources) {
      violations.push('No data sources referenced in analytics insights');
    }
  }

  return {
    isValid: violations.length === 0,
    violations
  };
}

/**
 * Generate quality improvement suggestions
 */
export function generateQualityImprovementSuggestions(
  qualityScore: ResultsQualityScore
): string[] {
  const suggestions: string[] = [];

  if (qualityScore.specificity < 3.5) {
    suggestions.push('Add more specific page names, URLs, and target audience details');
    suggestions.push('Include concrete examples and use cases rather than generic recommendations');
  }

  if (qualityScore.stackAlignment < 3.5) {
    suggestions.push('Ensure all recommendations reference only the available Optimizely tools');
    suggestions.push('Align experiment and personalization suggestions with actual DXP capabilities');
  }

  if (qualityScore.maturityFit < 3.5) {
    suggestions.push('Adjust recommendation complexity to match the current maturity phase');
    suggestions.push('Ensure timeline and resource estimates are realistic for the maturity level');
  }

  if (qualityScore.measurementRigor < 3.5) {
    suggestions.push('Define clear success metrics and measurement approaches for each recommendation');
    suggestions.push('Link recommendations to specific KPIs and provide measurement timelines');
  }

  if (qualityScore.actionability < 3.5) {
    suggestions.push('Break down high-level recommendations into specific, implementable steps');
    suggestions.push('Include owner types, timeframes, and prerequisites for each action item');
  }

  return suggestions;
}

// =============================================================================
// Configuration Utilities
// =============================================================================

/**
 * Create DCI config optimized for specific scenarios
 */
export function createOptimizedConfig(scenario: 'speed' | 'quality' | 'comprehensive'): DciOrchestratorConfig {
  const baseConfig = { ...DEFAULT_DCI_CONFIG };

  switch (scenario) {
    case 'speed':
      return {
        ...baseConfig,
        maxPasses: 2,
        qualityThreshold: 3.0,
        timeoutMs: 60000,
        features: {
          ...baseConfig.features,
          enableConsistencyCheck: false,
          enableAdvancedPersonalization: false
        }
      };

    case 'quality':
      return {
        ...baseConfig,
        maxPasses: 4,
        qualityThreshold: 4.5,
        timeoutMs: 180000,
        qualityRequirements: {
          ...baseConfig.qualityRequirements,
          minimumSpecificity: 4.0,
          minimumActionability: 4.0
        }
      };

    case 'comprehensive':
      return {
        ...baseConfig,
        maxPasses: 5,
        qualityThreshold: 4.0,
        timeoutMs: 300000,
        contextStrategy: 'comprehensive',
        features: {
          enableConsistencyCheck: true,
          enableAdvancedPersonalization: true,
          enableCompetitiveAnalysis: true,
          enablePredictiveInsights: true
        }
      };

    default:
      return baseConfig;
  }
}

// =============================================================================
// Export Functions
// =============================================================================

export {
  DEFAULT_DCI_CONFIG,
  generateCorrelationId
};