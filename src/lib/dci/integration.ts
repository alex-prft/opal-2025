/**
 * DCI Orchestrator Integration with results-content-optimizer
 *
 * This module provides the integration layer between the DCI Orchestrator
 * and the existing results-content-optimizer agent, enabling enhanced
 * Results content generation while maintaining backward compatibility.
 */

import {
  OSAResults,
  DciContextBuckets,
  DciOrchestratorConfig,
  createOptimizedConfig
} from '@/types/dci-orchestrator';

import {
  ResultsPageContent
} from '@/types/results-content';

import {
  runDciOrchestrator,
  validateQualityRequirements,
  generateQualityImprovementSuggestions
} from './orchestrator';

import {
  buildContextBuckets
} from './context-builder';

import {
  mapOSAResultsToResultsPageContent
} from './results-mapper';

// =============================================================================
// Feature Flags and Configuration
// =============================================================================

const DCI_FEATURE_FLAGS = {
  enableDciOrchestrator: process.env.NEXT_PUBLIC_ENABLE_DCI_ORCHESTRATOR === 'true',
  enableAdvancedMapping: process.env.NEXT_PUBLIC_ENABLE_DCI_ADVANCED_MAPPING === 'true',
  enableQualityValidation: process.env.NEXT_PUBLIC_ENABLE_DCI_QUALITY_VALIDATION === 'true',
  enableDetailedLogging: process.env.NODE_ENV === 'development',
  fallbackToExistingResults: true // Always allow fallback for safety
};

// =============================================================================
// Main Integration Interface
// =============================================================================

/**
 * Enhanced results generation using DCI Orchestrator
 * Drop-in replacement for existing results generation with fallback safety
 */
export async function generateEnhancedResults(input: {
  pageId: string;
  tier: 'strategy' | 'insights' | 'optimization' | 'dxptools';
  opalInstructions: any; // From existing agent configuration
  agentOutputs: any[];   // From existing OPAL agents
  dxpData: any[];        // From existing DXP tools
  existingContent?: ResultsPageContent;
  generationMode?: 'preview' | 'apply';
  confidenceThreshold?: number;
}): Promise<{
  success: boolean;
  content?: ResultsPageContent;
  metadata: {
    source: 'dci_orchestrator' | 'fallback' | 'existing';
    dciEnabled: boolean;
    qualityScore?: number;
    generationTimeMs: number;
    confidence: number;
    contextBucketsUsed?: string[];
    passesCompleted?: number;
    errors?: string[];
  };
}> {

  const startTime = Date.now();
  const correlationId = `results_${input.pageId}_${Date.now()}`;

  if (DCI_FEATURE_FLAGS.enableDetailedLogging) {
    console.log(`[DCI Integration] Starting enhanced results generation for ${input.pageId}`);
  }

  try {
    // Check if DCI is enabled and viable
    if (!DCI_FEATURE_FLAGS.enableDciOrchestrator) {
      if (DCI_FEATURE_FLAGS.enableDetailedLogging) {
        console.log(`[DCI Integration] DCI Orchestrator disabled, using fallback`);
      }

      return await generateFallbackResults(input, startTime);
    }

    // Build base metadata from OPAL instructions and data
    const baseMeta = await buildBaseMetaFromInputs(input);

    // Build context buckets from available data sources
    const contextBuckets = await buildContextBuckets(baseMeta, {
      enableDetailedLogging: DCI_FEATURE_FLAGS.enableDetailedLogging,
      fallbackToMockData: true
    });

    // Configure DCI orchestrator based on generation mode
    const dciConfig = createDciConfig(input.generationMode, input.confidenceThreshold);

    // Run DCI orchestrator
    const osaResults = await runDciOrchestrator({
      baseMeta,
      contextBuckets,
      config: dciConfig,
      correlationId
    });

    // Validate quality if enabled
    let qualityValidation: { isValid: boolean; violations: string[] } | undefined;
    if (DCI_FEATURE_FLAGS.enableQualityValidation && osaResults.generation.finalQualityScore > 0) {
      // Note: Would need to re-run quality scoring here if needed
      // For now, use the final quality score from generation metadata
      qualityValidation = {
        isValid: osaResults.generation.finalQualityScore >= (input.confidenceThreshold || 60),
        violations: osaResults.generation.dataQualityNotes || []
      };
    }

    // Map OSAResults to ResultsPageContent
    const content = mapOSAResultsToResultsPageContent(osaResults, input.tier);

    // Calculate final metadata
    const metadata = {
      source: 'dci_orchestrator' as const,
      dciEnabled: true,
      qualityScore: osaResults.generation.finalQualityScore,
      generationTimeMs: Date.now() - startTime,
      confidence: calculateConfidenceScore(osaResults),
      contextBucketsUsed: osaResults.generation.contextBucketsUsed,
      passesCompleted: osaResults.generation.totalPasses,
      errors: qualityValidation?.violations
    };

    if (DCI_FEATURE_FLAGS.enableDetailedLogging) {
      console.log(`[DCI Integration] DCI generation completed:`, {
        qualityScore: metadata.qualityScore,
        confidence: metadata.confidence,
        passesCompleted: metadata.passesCompleted,
        generationTimeMs: metadata.generationTimeMs
      });
    }

    return {
      success: true,
      content,
      metadata
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (DCI_FEATURE_FLAGS.enableDetailedLogging) {
      console.error(`[DCI Integration] DCI generation failed:`, errorMessage);
    }

    // Fallback to existing results generation
    if (DCI_FEATURE_FLAGS.fallbackToExistingResults) {
      return await generateFallbackResults(input, startTime, errorMessage);
    }

    throw error;
  }
}

// =============================================================================
// Configuration Builders
// =============================================================================

function createDciConfig(
  generationMode: 'preview' | 'apply' = 'preview',
  confidenceThreshold: number = 70
): Partial<DciOrchestratorConfig> {

  if (generationMode === 'preview') {
    // Fast preview mode
    return createOptimizedConfig('speed');
  } else {
    // High-quality apply mode
    return {
      ...createOptimizedConfig('quality'),
      qualityThreshold: Math.max(confidenceThreshold / 100 * 5, 3.0) // Convert 0-100 to 1-5 scale
    };
  }
}

async function buildBaseMetaFromInputs(input: {
  pageId: string;
  tier: 'strategy' | 'insights' | 'optimization' | 'dxptools';
  opalInstructions: any;
  agentOutputs: any[];
  dxpData: any[];
}): Promise<OSAResults['meta']> {

  // Extract organization info from OPAL instructions
  const orgName = input.opalInstructions?.orgContext?.name || 'Organization';
  const industry = input.opalInstructions?.orgContext?.industry || 'Technology';
  const region = input.opalInstructions?.orgContext?.region || 'North America';

  // Extract maturity phase from OPAL instructions
  const maturityPhase = input.opalInstructions?.maturityRubric?.currentPhase || 'walk';

  // Extract primary goals from OPAL instructions
  const primaryGoals = input.opalInstructions?.businessGoals || [
    'Improve customer experience',
    'Increase conversion performance',
    'Enhance competitive positioning'
  ];

  // Extract KPIs from OPAL instructions
  const primaryKpis = input.opalInstructions?.kpis?.map((kpi: any) => kpi.name || kpi) || [
    'Conversion Rate',
    'Engagement',
    'Performance'
  ];

  // Extract Optimizely stack from DXP data
  const optiStack = extractOptiStackFromDxpData(input.dxpData);

  return {
    orgName,
    industry,
    region,
    maturityPhase,
    primaryGoals,
    primaryKpis,
    optiStack,
    generationTimestamp: new Date().toISOString(),
    dciVersion: '1.0.0'
  };
}

function extractOptiStackFromDxpData(dxpData: any[]): string[] {
  const defaultStack = ['Optimizely WebX', 'Optimizely CMS'];

  if (!dxpData || dxpData.length === 0) {
    return defaultStack;
  }

  const detectedTools = new Set<string>();

  dxpData.forEach(data => {
    if (data.toolName) {
      switch (data.toolName) {
        case 'webx':
          detectedTools.add('Optimizely WebX');
          break;
        case 'cms':
        case 'cmspaas':
          detectedTools.add('Optimizely CMS');
          break;
        case 'odp':
          detectedTools.add('Optimizely Data Platform');
          break;
        case 'content_recs':
          detectedTools.add('Content Recommendations');
          break;
        case 'cmp':
          detectedTools.add('Campaign Management Platform');
          break;
      }
    }
  });

  return detectedTools.size > 0 ? Array.from(detectedTools) : defaultStack;
}

// =============================================================================
// Fallback Results Generation
// =============================================================================

async function generateFallbackResults(
  input: {
    pageId: string;
    tier: 'strategy' | 'insights' | 'optimization' | 'dxptools';
    existingContent?: ResultsPageContent;
  },
  startTime: number,
  errorMessage?: string
): Promise<{
  success: boolean;
  content?: ResultsPageContent;
  metadata: {
    source: 'dci_orchestrator' | 'fallback' | 'existing';
    dciEnabled: boolean;
    qualityScore?: number;
    generationTimeMs: number;
    confidence: number;
    contextBucketsUsed?: string[];
    passesCompleted?: number;
    errors?: string[];
  };
}> {

  let content: ResultsPageContent;
  let source: 'fallback' | 'existing' = 'fallback';

  if (input.existingContent) {
    // Use existing content if available
    content = input.existingContent;
    source = 'existing';
  } else {
    // Generate fallback content using existing Results system
    const { createDefaultResultsContent } = await import('@/types/results-content');

    content = createDefaultResultsContent(
      input.tier,
      `${input.tier.charAt(0).toUpperCase() + input.tier.slice(1)} Results`,
      45 // Default moderate confidence
    );
  }

  const metadata = {
    source,
    dciEnabled: DCI_FEATURE_FLAGS.enableDciOrchestrator,
    qualityScore: 2.5, // Moderate fallback quality score
    generationTimeMs: Date.now() - startTime,
    confidence: 45,
    errors: errorMessage ? [errorMessage] : undefined
  };

  return {
    success: true,
    content,
    metadata
  };
}

// =============================================================================
// Utility Functions
// =============================================================================

function calculateConfidenceScore(osaResults: OSAResults): number {
  const baseConfidence = osaResults.generation.confidence === 'high' ? 85 :
                        osaResults.generation.confidence === 'medium' ? 65 : 45;

  // Adjust based on quality factors
  let adjustment = 0;

  if (osaResults.generation.contextBucketsUsed.length >= 3) adjustment += 10;
  if (osaResults.generation.totalPasses >= 2) adjustment += 5;
  if (osaResults.generation.finalQualityScore >= 4.0) adjustment += 10;

  return Math.min(baseConfidence + adjustment, 95);
}

// =============================================================================
// Agent Integration Helper
// =============================================================================

/**
 * Enhanced wrapper for the existing results-content-optimizer agent
 * Maintains compatibility while adding DCI capabilities
 */
export class EnhancedResultsContentOptimizer {
  private static instance: EnhancedResultsContentOptimizer;

  static getInstance(): EnhancedResultsContentOptimizer {
    if (!EnhancedResultsContentOptimizer.instance) {
      EnhancedResultsContentOptimizer.instance = new EnhancedResultsContentOptimizer();
    }
    return EnhancedResultsContentOptimizer.instance;
  }

  /**
   * Generate enhanced results with full DCI orchestration
   */
  async generateResults(input: {
    pageId: string;
    tier: 'strategy' | 'insights' | 'optimization' | 'dxptools';
    opalInstructions: any;
    agentOutputs: any[];
    dxpData: any[];
    existingContent?: ResultsPageContent;
    generationMode?: 'preview' | 'apply';
    confidenceThreshold?: number;
  }): Promise<ResultsPageContent> {

    const result = await generateEnhancedResults(input);

    if (!result.success || !result.content) {
      throw new Error(`Enhanced results generation failed: ${result.metadata.errors?.join(', ')}`);
    }

    return result.content;
  }

  /**
   * Quick preview generation (faster, lower quality)
   */
  async generatePreview(input: {
    pageId: string;
    tier: 'strategy' | 'insights' | 'optimization' | 'dxptools';
    opalInstructions: any;
  }): Promise<ResultsPageContent> {

    return this.generateResults({
      ...input,
      agentOutputs: [],
      dxpData: [],
      generationMode: 'preview',
      confidenceThreshold: 50
    });
  }

  /**
   * Check if DCI orchestrator is available and enabled
   */
  isDciEnabled(): boolean {
    return DCI_FEATURE_FLAGS.enableDciOrchestrator;
  }

  /**
   * Get current feature flags status
   */
  getFeatureFlags(): typeof DCI_FEATURE_FLAGS {
    return { ...DCI_FEATURE_FLAGS };
  }
}

// =============================================================================
// Export Main Interface
// =============================================================================

export {
  DCI_FEATURE_FLAGS,
  generateEnhancedResults as generateResults,
  EnhancedResultsContentOptimizer
};

// Export convenience instance
export const enhancedResultsOptimizer = EnhancedResultsContentOptimizer.getInstance();