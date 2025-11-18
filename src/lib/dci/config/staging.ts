/**
 * DCI Staging Environment Configuration
 *
 * Configuration optimized for staging environment validation and testing.
 * Balances production-like behavior with comprehensive testing capabilities.
 */

import { DciOrchestratorConfig } from '@/types/dci-orchestrator';
import { DEFAULT_DCI_CONFIG } from '../orchestrator';

// =============================================================================
// Staging Environment Configuration
// =============================================================================

export const STAGING_DCI_CONFIG: DciOrchestratorConfig = {
  ...DEFAULT_DCI_CONFIG,

  // Staging-specific orchestration settings
  maxPasses: 2, // Reduced for faster testing cycles
  qualityThreshold: 3.5, // Slightly lower for testing edge cases
  timeoutMs: 90000, // 1.5 minutes - faster than production

  // Enhanced logging for staging validation
  enableDetailedLogging: true,
  enablePerformanceMetrics: true,

  // LLM configuration optimized for staging
  llmConfig: {
    provider: (process.env.STAGING_DCI_LLM_PROVIDER as any) || 'mock',
    apiKey: process.env.STAGING_DCI_LLM_API_KEY,
    model: process.env.STAGING_DCI_LLM_MODEL || 'gpt-4',
    temperature: 0.1, // Lower temperature for consistent testing
    maxTokens: 3000, // Reduced for faster responses
    timeout: 45000, // 45 seconds
    retryAttempts: 2, // Fewer retries for faster feedback
    retryDelay: 1000
  },

  // Quality requirements tuned for staging validation
  qualityRequirements: {
    minimumSpecificity: 3.0,
    minimumStackAlignment: 3.5,
    minimumMaturityFit: 3.0,
    minimumMeasurementRigor: 2.5,
    minimumActionability: 3.0,
    requireDataSources: false // Allow testing with mock data
  },

  // Feature flags optimized for staging testing
  features: {
    enableProgressiveContextAddition: true,
    enableQualityFeedbackLoops: true,
    enableConsistencyCheck: true,
    enableAdvancedPersonalization: true, // Test advanced features
    enableExperimentationContext: true,
    enableDxpToolsIntegration: true,
    enableAnalyticsEnhancement: true,
    enableRoadmapGeneration: true
  },

  // Context building configuration for staging
  contextConfig: {
    enableSupabaseIntegration: process.env.STAGING_ENABLE_SUPABASE === 'true',
    enableOpalIntegration: process.env.STAGING_ENABLE_OPAL === 'true',
    enableDxpToolsIntegration: process.env.STAGING_ENABLE_DXP_TOOLS === 'true',
    enableAnalyticsIntegration: process.env.STAGING_ENABLE_ANALYTICS === 'true',
    dataFreshnessHours: 12, // Fresher data for testing
    maxItemsPerCategory: 8, // Smaller datasets for faster processing
    fallbackToMockData: true, // Always allow fallback for testing
    enableCaching: true,
    cacheExpiryMinutes: 15 // Shorter cache for testing
  }
};

// =============================================================================
// Staging Feature Flags
// =============================================================================

export const STAGING_FEATURE_FLAGS = {
  ENABLE_DCI_ORCHESTRATOR: process.env.STAGING_ENABLE_DCI_ORCHESTRATOR === 'true',
  ENABLE_DCI_DETAILED_LOGGING: true, // Always enabled in staging
  ENABLE_DCI_PERFORMANCE_METRICS: true, // Always enabled for validation
  ENABLE_DCI_QUALITY_VALIDATION: true,
  ENABLE_DCI_CONTEXT_CACHING: true,
  ENABLE_DCI_FALLBACK_GENERATION: true,

  // Staging-specific feature flags
  ENABLE_DCI_DEBUG_MODE: true,
  ENABLE_DCI_MOCK_DATA_TESTING: true,
  ENABLE_DCI_INTEGRATION_TESTING: true,
  ENABLE_DCI_PERFORMANCE_PROFILING: true
};

// =============================================================================
// Staging Validation Configuration
// =============================================================================

export const STAGING_VALIDATION_CONFIG = {
  // Test scenarios to validate in staging
  testScenarios: [
    {
      name: 'Basic DCI Flow',
      baseMeta: {
        orgName: 'Staging Test Org',
        industry: 'Technology',
        maturityPhase: 'walk' as const,
        primaryGoals: ['Improve conversion rate', 'Enhance user experience'],
        primaryKpis: ['CVR', 'Engagement'],
        optiStack: ['Optimizely WebX', 'Optimizely CMS'],
        generationTimestamp: new Date().toISOString(),
        dciVersion: '1.0.0'
      },
      expectedMinQuality: 3.0,
      expectedMaxDuration: 90000 // 1.5 minutes
    },
    {
      name: 'High Maturity DCI Flow',
      baseMeta: {
        orgName: 'Advanced Staging Org',
        industry: 'E-commerce',
        maturityPhase: 'run' as const,
        primaryGoals: ['Scale personalization', 'Optimize advanced features'],
        primaryKpis: ['CVR', 'AOV', 'LTV'],
        optiStack: ['Optimizely WebX', 'ODP', 'Content Recommendations'],
        generationTimestamp: new Date().toISOString(),
        dciVersion: '1.0.0'
      },
      expectedMinQuality: 3.5,
      expectedMaxDuration: 120000 // 2 minutes
    },
    {
      name: 'Minimal Context DCI Flow',
      baseMeta: {
        orgName: 'Minimal Test Org',
        industry: 'Services',
        maturityPhase: 'crawl' as const,
        primaryGoals: ['Establish foundation'],
        primaryKpis: ['Performance'],
        optiStack: ['Optimizely WebX'],
        generationTimestamp: new Date().toISOString(),
        dciVersion: '1.0.0'
      },
      expectedMinQuality: 2.5,
      expectedMaxDuration: 60000 // 1 minute
    }
  ],

  // Performance benchmarks for staging validation
  performanceBenchmarks: {
    maxContextBuildTime: 30000, // 30 seconds
    maxLlmResponseTime: 45000, // 45 seconds
    maxResultsMappingTime: 5000, // 5 seconds
    maxOverallProcessingTime: 120000, // 2 minutes
    minCacheHitRate: 0.6 // 60% cache hit rate
  },

  // Quality assurance checks
  qualityChecks: {
    validateResultsStructure: true,
    validateLanguageRules: true,
    validateStackAlignment: true,
    validateMaturityFit: true,
    validateContentNeverBlank: true,
    validateConfidenceScoring: true
  }
};

// =============================================================================
// Staging Environment Utilities
// =============================================================================

/**
 * Get staging-specific configuration with environment overrides
 */
export function getStagingDciConfig(): DciOrchestratorConfig {
  return {
    ...STAGING_DCI_CONFIG,
    // Allow environment variable overrides
    maxPasses: parseInt(process.env.STAGING_DCI_MAX_PASSES || '2'),
    qualityThreshold: parseFloat(process.env.STAGING_DCI_QUALITY_THRESHOLD || '3.5'),
    timeoutMs: parseInt(process.env.STAGING_DCI_TIMEOUT_MS || '90000'),
  };
}

/**
 * Validate staging environment readiness
 */
export function validateStagingEnvironment(): {
  isReady: boolean;
  issues: string[];
  warnings: string[];
} {
  const issues: string[] = [];
  const warnings: string[] = [];

  // Check required environment variables
  if (!process.env.STAGING_DCI_LLM_PROVIDER && !process.env.STAGING_ENABLE_MOCK_LLM) {
    issues.push('STAGING_DCI_LLM_PROVIDER not configured');
  }

  // Check optional integrations
  if (!process.env.STAGING_ENABLE_SUPABASE) {
    warnings.push('Supabase integration not enabled in staging');
  }

  if (!process.env.STAGING_ENABLE_OPAL) {
    warnings.push('OPAL integration not enabled in staging');
  }

  // Check staging-specific configurations
  if (!STAGING_FEATURE_FLAGS.ENABLE_DCI_ORCHESTRATOR) {
    issues.push('DCI Orchestrator not enabled in staging environment');
  }

  return {
    isReady: issues.length === 0,
    issues,
    warnings
  };
}

/**
 * Generate staging test report
 */
export function generateStagingTestReport(results: any[]): {
  summary: string;
  passedTests: number;
  failedTests: number;
  warnings: string[];
  recommendations: string[];
} {
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = results.filter(r => !r.passed).length;
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Analyze test results
  results.forEach(result => {
    if (result.performanceIssues) {
      warnings.push(`Performance issue in ${result.testName}: ${result.performanceIssues}`);
    }

    if (result.qualityScore < 3.0) {
      recommendations.push(`Improve quality for ${result.testName}: current score ${result.qualityScore}`);
    }
  });

  const summary = `Staging Tests: ${passedTests}/${results.length} passed (${Math.round(passedTests / results.length * 100)}%)`;

  return {
    summary,
    passedTests,
    failedTests,
    warnings,
    recommendations
  };
}