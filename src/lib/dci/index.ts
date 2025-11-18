/**
 * DCI Orchestrator - Main Export Module
 *
 * Dynamic Context Integration (DCI) Orchestrator for OSA Results generation.
 * Provides comprehensive, progressive context integration with quality scoring
 * loops to generate specific, implementable, stack-aware recommendations.
 */

// =============================================================================
// Core Types
// =============================================================================

export type {
  OSAResults,
  ResultsQualityScore,
  DciContextBuckets,
  DciExecutionContext,
  DciOrchestratorConfig,
  DciOrchestratorError,
  LLMRequest,
  LLMResponse,
  OSAIntegrationPoints,
  ConfidenceLevel,
  FocusArea
} from '@/types/dci-orchestrator';

// =============================================================================
// Core Orchestrator
// =============================================================================

export {
  runDciOrchestrator,
  validateQualityRequirements,
  generateQualityImprovementSuggestions,
  createOptimizedConfig,
  DEFAULT_DCI_CONFIG,
  generateCorrelationId
} from './orchestrator';

// =============================================================================
// Context Building
// =============================================================================

export {
  buildContextBuckets,
  validateContextBuckets,
  DEFAULT_CONTEXT_CONFIG,
  type ContextBuilderConfig
} from './context-builder';

// =============================================================================
// LLM Integration
// =============================================================================

export {
  callLlmGenerateInitialResults,
  callLlmScoreResults,
  callLlmRefineResultsWithContext,
  callLlmConsistencyCheck,
  selectContextForNextPass,
  generateFallbackResults
} from './llm-helpers';

// =============================================================================
// Results Mapping
// =============================================================================

export {
  mapOSAResultsToResultsPageContent,
  calculateOverallConfidence,
  extractUniqueFocusAreas,
  getQuickWinsCount
} from './results-mapper';

// =============================================================================
// Feature Flags & Configuration
// =============================================================================

export {
  DCI_ENV_CONFIG,
  DciFeatureFlagManager,
  DciFallbackManager,
  dciFeatureFlags,
  dciFallbackManager,
  withDciEnabled,
  withDciEnabledAsync,
  dciLog,
  withPerformanceMetrics,
  withPerformanceMetricsAsync,
  isProductionEnvironment,
  isDevelopmentEnvironment,
  getEnvironmentAwareDciConfig
} from './feature-flags';

// =============================================================================
// Integration Layer
// =============================================================================

export {
  generateEnhancedResults as generateResults,
  EnhancedResultsContentOptimizer,
  enhancedResultsOptimizer,
  DCI_FEATURE_FLAGS
} from './integration';

// =============================================================================
// Main DCI Interface
// =============================================================================

/**
 * Main DCI Orchestrator interface for enhanced Results generation
 *
 * @example
 * ```typescript
 * import { DciOrchestrator } from '@/lib/dci';
 *
 * const orchestrator = new DciOrchestrator();
 * const results = await orchestrator.generateEnhancedResults({
 *   pageId: 'strategy-plans/osa/overview',
 *   tier: 'strategy',
 *   opalInstructions: {...},
 *   agentOutputs: [...],
 *   dxpData: [...]
 * });
 * ```
 */
export class DciOrchestrator {
  private static instance: DciOrchestrator;

  static getInstance(): DciOrchestrator {
    if (!DciOrchestrator.instance) {
      DciOrchestrator.instance = new DciOrchestrator();
    }
    return DciOrchestrator.instance;
  }

  /**
   * Generate enhanced Results using full DCI orchestration
   */
  async generateEnhancedResults(input: {
    pageId: string;
    tier: 'strategy' | 'insights' | 'optimization' | 'dxptools';
    opalInstructions: any;
    agentOutputs: any[];
    dxpData: any[];
    existingContent?: any;
    generationMode?: 'preview' | 'apply';
    confidenceThreshold?: number;
  }) {
    const { generateResults } = await import('./integration');
    return generateResults(input);
  }

  /**
   * Build context buckets from available data sources
   */
  async buildContextBuckets(baseMeta: OSAResults['meta']) {
    const { buildContextBuckets } = await import('./context-builder');
    return buildContextBuckets(baseMeta);
  }

  /**
   * Run core DCI orchestration workflow
   */
  async runOrchestration(input: {
    baseMeta: OSAResults['meta'];
    contextBuckets: DciContextBuckets;
    config?: Partial<DciOrchestratorConfig>;
    correlationId?: string;
  }) {
    const { runDciOrchestrator } = await import('./orchestrator');
    return runDciOrchestrator(input);
  }

  /**
   * Map OSA results to Results page content
   */
  mapToResultsPageContent(
    osaResults: OSAResults,
    tier: 'strategy' | 'insights' | 'optimization' | 'dxptools',
    qualityScore?: ResultsQualityScore
  ) {
    const { mapOSAResultsToResultsPageContent } = require('./results-mapper');
    return mapOSAResultsToResultsPageContent(osaResults, tier, qualityScore);
  }

  /**
   * Validate quality requirements
   */
  validateQuality(
    results: OSAResults,
    qualityScore: ResultsQualityScore,
    config: DciOrchestratorConfig
  ) {
    const { validateQualityRequirements } = require('./orchestrator');
    return validateQualityRequirements(results, qualityScore, config);
  }

  /**
   * Get feature flags status
   */
  getFeatureFlags() {
    return dciFeatureFlags.getAllFeatureFlags();
  }

  /**
   * Check if DCI is enabled and available
   */
  isEnabled(): boolean {
    return dciFeatureFlags.isDciEnabled();
  }

  /**
   * Get optimized configuration for specific scenarios
   */
  getOptimizedConfig(scenario: 'speed' | 'quality' | 'comprehensive') {
    const { createOptimizedConfig } = require('./orchestrator');
    return createOptimizedConfig(scenario);
  }
}

// =============================================================================
// Default Export - Singleton Instance
// =============================================================================

/**
 * Default DCI Orchestrator instance
 * Ready-to-use singleton for enhanced Results generation
 */
export const dciOrchestrator = DciOrchestrator.getInstance();

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Quick DCI orchestration with sensible defaults
 *
 * @param baseMeta - Organization and context metadata
 * @param scenario - Optimization scenario: 'speed', 'quality', or 'comprehensive'
 * @returns Enhanced OSA Results
 */
export async function quickOrchestration(
  baseMeta: OSAResults['meta'],
  scenario: 'speed' | 'quality' | 'comprehensive' = 'quality'
): Promise<OSAResults> {
  const contextBuckets = await dciOrchestrator.buildContextBuckets(baseMeta);
  const config = dciOrchestrator.getOptimizedConfig(scenario);

  return dciOrchestrator.runOrchestration({
    baseMeta,
    contextBuckets,
    config
  });
}

/**
 * Generate Results page content with DCI enhancement
 *
 * @param pageId - Results page identifier
 * @param tier - Content tier focus
 * @param opalInstructions - OPAL configuration and context
 * @returns Enhanced Results page content
 */
export async function generateResultsPageContent(
  pageId: string,
  tier: 'strategy' | 'insights' | 'optimization' | 'dxptools',
  opalInstructions: any
) {
  const result = await dciOrchestrator.generateEnhancedResults({
    pageId,
    tier,
    opalInstructions,
    agentOutputs: [],
    dxpData: [],
    generationMode: 'apply'
  });

  if (!result.success || !result.content) {
    throw new Error(`Results generation failed: ${result.metadata.errors?.join(', ')}`);
  }

  return result.content;
}

/**
 * Health check for DCI system
 *
 * @returns System health status and configuration
 */
export function dciHealthCheck() {
  const featureFlags = dciFeatureFlags.getAllFeatureFlags();
  const configValidation = dciFeatureFlags.validateConfiguration();

  return {
    isEnabled: dciFeatureFlags.isDciEnabled(),
    isHealthy: configValidation.isValid && configValidation.errors.length === 0,
    configuration: featureFlags,
    validation: configValidation,
    timestamp: new Date().toISOString()
  };
}

// =============================================================================
// Version Information
// =============================================================================

export const DCI_VERSION = '1.0.0';
export const DCI_BUILD_INFO = {
  version: DCI_VERSION,
  built: new Date().toISOString(),
  features: [
    'Progressive context integration',
    'Quality scoring loops',
    'Multi-tier content mapping',
    'Comprehensive fallback systems',
    'Feature flag management',
    'Performance optimization'
  ]
};