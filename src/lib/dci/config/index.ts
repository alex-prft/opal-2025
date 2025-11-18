/**
 * DCI Environment Configuration Manager
 *
 * Provides environment-aware configuration selection and validation
 * for the Dynamic Context Integration system across development,
 * staging, and production environments.
 */

import { DciOrchestratorConfig } from '@/types/dci-orchestrator';
import { DEFAULT_DCI_CONFIG } from '../orchestrator';

// Environment-specific configurations
import {
  STAGING_DCI_CONFIG,
  STAGING_FEATURE_FLAGS,
  getStagingDciConfig,
  validateStagingEnvironment
} from './staging';

import {
  PRODUCTION_DCI_CONFIG,
  PRODUCTION_FEATURE_FLAGS,
  getProductionDciConfig,
  validateProductionEnvironment,
  initializeProductionMonitoring
} from './production';

// =============================================================================
// Environment Detection
// =============================================================================

export type DciEnvironment = 'development' | 'staging' | 'production' | 'test';

/**
 * Detect current environment with fallback logic
 */
export function detectEnvironment(): DciEnvironment {
  // Check explicit DCI environment variable first
  if (process.env.DCI_ENVIRONMENT) {
    return process.env.DCI_ENVIRONMENT as DciEnvironment;
  }

  // Check Next.js environment
  if (process.env.NODE_ENV === 'production') {
    // Check if this is staging masquerading as production
    if (process.env.VERCEL_ENV === 'preview' ||
        process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview' ||
        process.env.STAGING_ENVIRONMENT === 'true') {
      return 'staging';
    }
    return 'production';
  }

  if (process.env.NODE_ENV === 'test') {
    return 'test';
  }

  // Default to development
  return 'development';
}

/**
 * Check if running in production environment
 */
export function isProduction(): boolean {
  return detectEnvironment() === 'production';
}

/**
 * Check if running in staging environment
 */
export function isStaging(): boolean {
  return detectEnvironment() === 'staging';
}

/**
 * Check if running in development environment
 */
export function isDevelopment(): boolean {
  const env = detectEnvironment();
  return env === 'development' || env === 'test';
}

// =============================================================================
// Configuration Selection
// =============================================================================

/**
 * Get environment-appropriate DCI configuration
 */
export function getEnvironmentDciConfig(): DciOrchestratorConfig {
  const environment = detectEnvironment();

  switch (environment) {
    case 'production':
      return getProductionDciConfig();

    case 'staging':
      return getStagingDciConfig();

    case 'development':
    case 'test':
    default:
      return {
        ...DEFAULT_DCI_CONFIG,
        // Development overrides
        enableDetailedLogging: true,
        enablePerformanceMetrics: true,
        llmConfig: {
          ...DEFAULT_DCI_CONFIG.llmConfig,
          provider: 'mock', // Use mock provider in development
          timeout: 30000, // Faster timeouts for development
          retryAttempts: 1 // Fewer retries for faster feedback
        },
        contextConfig: {
          ...DEFAULT_DCI_CONFIG.contextConfig,
          fallbackToMockData: true, // Always allow mock data in development
          enableCaching: false, // Disable caching for development
          maxItemsPerCategory: 5 // Smaller datasets for faster development
        }
      };
  }
}

/**
 * Get environment-appropriate feature flags
 */
export function getEnvironmentFeatureFlags() {
  const environment = detectEnvironment();

  switch (environment) {
    case 'production':
      return PRODUCTION_FEATURE_FLAGS;

    case 'staging':
      return STAGING_FEATURE_FLAGS;

    case 'development':
    case 'test':
    default:
      return {
        ENABLE_DCI_ORCHESTRATOR: true,
        ENABLE_DCI_DETAILED_LOGGING: true,
        ENABLE_DCI_PERFORMANCE_METRICS: true,
        ENABLE_DCI_QUALITY_VALIDATION: true,
        ENABLE_DCI_CONTEXT_CACHING: false,
        ENABLE_DCI_FALLBACK_GENERATION: true,
        ENABLE_DCI_DEBUG_MODE: true,
        ENABLE_DCI_MOCK_DATA_TESTING: true
      };
  }
}

// =============================================================================
// Environment Validation
// =============================================================================

/**
 * Validate current environment configuration
 */
export function validateCurrentEnvironment(): {
  environment: DciEnvironment;
  isValid: boolean;
  issues: string[];
  warnings: string[];
  recommendations: string[];
} {
  const environment = detectEnvironment();
  const issues: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  switch (environment) {
    case 'production': {
      const validation = validateProductionEnvironment();
      issues.push(...validation.criticalIssues);
      warnings.push(...validation.warnings);

      if (!validation.securityChecks.rateLimitingEnabled) {
        recommendations.push('Enable rate limiting for production security');
      }

      if (!validation.securityChecks.monitoringEnabled) {
        recommendations.push('Enable comprehensive monitoring for production observability');
      }
      break;
    }

    case 'staging': {
      const validation = validateStagingEnvironment();
      issues.push(...validation.issues);
      warnings.push(...validation.warnings);

      if (validation.warnings.length > 0) {
        recommendations.push('Consider enabling all integrations in staging for comprehensive testing');
      }
      break;
    }

    case 'development':
    case 'test': {
      // Basic development environment checks
      if (!process.env.NEXT_PUBLIC_ENABLE_DCI_ORCHESTRATOR) {
        warnings.push('DCI Orchestrator not explicitly enabled - will use default configuration');
      }

      recommendations.push('Ensure all environment variables are documented for team members');
      break;
    }
  }

  return {
    environment,
    isValid: issues.length === 0,
    issues,
    warnings,
    recommendations
  };
}

// =============================================================================
// Configuration Optimization
// =============================================================================

/**
 * Create optimized configuration for specific scenarios
 */
export function createOptimizedConfig(
  scenario: 'speed' | 'quality' | 'comprehensive' | 'testing'
): DciOrchestratorConfig {
  const baseConfig = getEnvironmentDciConfig();

  switch (scenario) {
    case 'speed':
      return {
        ...baseConfig,
        maxPasses: 1,
        qualityThreshold: 3.0,
        timeoutMs: 60000,
        llmConfig: {
          ...baseConfig.llmConfig,
          maxTokens: 2000,
          temperature: 0.2,
          timeout: 30000
        },
        contextConfig: {
          ...baseConfig.contextConfig,
          maxItemsPerCategory: 5,
          enableCaching: true,
          cacheExpiryMinutes: 60
        }
      };

    case 'quality':
      return {
        ...baseConfig,
        maxPasses: 4,
        qualityThreshold: 4.5,
        timeoutMs: 180000,
        llmConfig: {
          ...baseConfig.llmConfig,
          maxTokens: 5000,
          temperature: 0.1,
          timeout: 90000
        },
        features: {
          ...baseConfig.features,
          enableConsistencyCheck: true,
          enableAdvancedPersonalization: true
        }
      };

    case 'comprehensive':
      return {
        ...baseConfig,
        maxPasses: 5,
        qualityThreshold: 4.0,
        timeoutMs: 300000,
        features: {
          ...baseConfig.features,
          enableProgressiveContextAddition: true,
          enableQualityFeedbackLoops: true,
          enableConsistencyCheck: true,
          enableAdvancedPersonalization: true,
          enableExperimentationContext: true,
          enableDxpToolsIntegration: true,
          enableAnalyticsEnhancement: true,
          enableRoadmapGeneration: true
        },
        contextConfig: {
          ...baseConfig.contextConfig,
          maxItemsPerCategory: 15,
          dataFreshnessHours: 12
        }
      };

    case 'testing':
      return {
        ...baseConfig,
        maxPasses: 2,
        qualityThreshold: 2.5,
        timeoutMs: 45000,
        enableDetailedLogging: true,
        llmConfig: {
          ...baseConfig.llmConfig,
          provider: 'mock',
          timeout: 15000,
          retryAttempts: 1
        },
        contextConfig: {
          ...baseConfig.contextConfig,
          fallbackToMockData: true,
          enableCaching: false,
          maxItemsPerCategory: 3
        }
      };

    default:
      return baseConfig;
  }
}

// =============================================================================
// Runtime Configuration Management
// =============================================================================

let runtimeConfig: DciOrchestratorConfig | null = null;

/**
 * Initialize DCI configuration for the current environment
 */
export function initializeDciConfiguration(): DciOrchestratorConfig {
  if (runtimeConfig) {
    return runtimeConfig;
  }

  const environment = detectEnvironment();
  runtimeConfig = getEnvironmentDciConfig();

  // Initialize environment-specific features
  if (environment === 'production') {
    initializeProductionMonitoring();
  }

  console.log(`[DCI Config] Initialized for ${environment} environment`);
  return runtimeConfig;
}

/**
 * Get current runtime configuration
 */
export function getCurrentDciConfig(): DciOrchestratorConfig {
  if (!runtimeConfig) {
    return initializeDciConfiguration();
  }
  return runtimeConfig;
}

/**
 * Update runtime configuration (for testing/development)
 */
export function updateRuntimeConfig(updates: Partial<DciOrchestratorConfig>): void {
  if (!isDevelopment() && !isStaging()) {
    console.warn('[DCI Config] Runtime configuration updates only allowed in development/staging');
    return;
  }

  runtimeConfig = {
    ...getCurrentDciConfig(),
    ...updates
  };

  console.log('[DCI Config] Runtime configuration updated');
}

// =============================================================================
// Configuration Utilities
// =============================================================================

/**
 * Get configuration summary for debugging
 */
export function getConfigurationSummary() {
  const environment = detectEnvironment();
  const config = getCurrentDciConfig();
  const validation = validateCurrentEnvironment();

  return {
    environment,
    validation: {
      isValid: validation.isValid,
      issueCount: validation.issues.length,
      warningCount: validation.warnings.length
    },
    config: {
      maxPasses: config.maxPasses,
      qualityThreshold: config.qualityThreshold,
      timeoutMs: config.timeoutMs,
      llmProvider: config.llmConfig.provider,
      enabledFeatures: Object.keys(config.features || {}).filter(
        key => config.features?.[key as keyof typeof config.features]
      ).length
    }
  };
}

/**
 * Log configuration information (development/staging only)
 */
export function logConfigurationInfo(): void {
  if (isProduction()) {
    return; // Don't log in production
  }

  const summary = getConfigurationSummary();
  console.log('[DCI Config] Current Configuration:', summary);

  const validation = validateCurrentEnvironment();
  if (validation.issues.length > 0) {
    console.warn('[DCI Config] Configuration Issues:', validation.issues);
  }

  if (validation.warnings.length > 0) {
    console.info('[DCI Config] Configuration Warnings:', validation.warnings);
  }
}

// =============================================================================
// Exports
// =============================================================================

export {
  // Configuration functions
  getEnvironmentDciConfig,
  getEnvironmentFeatureFlags,
  createOptimizedConfig,

  // Environment detection
  detectEnvironment,
  isProduction,
  isStaging,
  isDevelopment,

  // Configuration management
  initializeDciConfiguration,
  getCurrentDciConfig,
  updateRuntimeConfig,

  // Validation and utilities
  validateCurrentEnvironment,
  getConfigurationSummary,
  logConfigurationInfo
};

// Default export for convenience
export default {
  getConfig: getCurrentDciConfig,
  initialize: initializeDciConfiguration,
  validate: validateCurrentEnvironment,
  environment: detectEnvironment()
};