/**
 * DCI Orchestrator Feature Flags and Configuration Management
 *
 * Centralized feature flag management for DCI Orchestrator with environment-aware
 * configuration, runtime toggles, and comprehensive fallback mechanisms.
 */

// =============================================================================
// Environment Variables and Configuration
// =============================================================================

/**
 * Environment-based feature flag configuration
 */
export const DCI_ENV_CONFIG = {
  // Core DCI features
  ENABLE_DCI_ORCHESTRATOR: process.env.NEXT_PUBLIC_ENABLE_DCI_ORCHESTRATOR === 'true',
  ENABLE_DCI_ADVANCED_MAPPING: process.env.NEXT_PUBLIC_ENABLE_DCI_ADVANCED_MAPPING === 'true',
  ENABLE_DCI_QUALITY_VALIDATION: process.env.NEXT_PUBLIC_ENABLE_DCI_QUALITY_VALIDATION === 'true',
  ENABLE_DCI_CONSISTENCY_CHECK: process.env.NEXT_PUBLIC_ENABLE_DCI_CONSISTENCY_CHECK !== 'false', // Default true

  // LLM and AI features
  ENABLE_DCI_ADVANCED_PERSONALIZATION: process.env.NEXT_PUBLIC_ENABLE_DCI_ADVANCED_PERSONALIZATION === 'true',
  ENABLE_DCI_COMPETITIVE_ANALYSIS: process.env.NEXT_PUBLIC_ENABLE_DCI_COMPETITIVE_ANALYSIS === 'true',
  ENABLE_DCI_PREDICTIVE_INSIGHTS: process.env.NEXT_PUBLIC_ENABLE_DCI_PREDICTIVE_INSIGHTS === 'true',

  // Performance and optimization
  DCI_MAX_PASSES: parseInt(process.env.NEXT_PUBLIC_DCI_MAX_PASSES || '3'),
  DCI_QUALITY_THRESHOLD: parseFloat(process.env.NEXT_PUBLIC_DCI_QUALITY_THRESHOLD || '4.0'),
  DCI_TIMEOUT_MS: parseInt(process.env.NEXT_PUBLIC_DCI_TIMEOUT_MS || '120000'),
  DCI_LLM_TIMEOUT_MS: parseInt(process.env.NEXT_PUBLIC_DCI_LLM_TIMEOUT_MS || '60000'),

  // Debugging and monitoring
  ENABLE_DCI_DETAILED_LOGGING: process.env.NODE_ENV === 'development' ||
                               process.env.NEXT_PUBLIC_ENABLE_DCI_LOGGING === 'true',
  ENABLE_DCI_PERFORMANCE_METRICS: process.env.NEXT_PUBLIC_ENABLE_DCI_METRICS === 'true',
  ENABLE_DCI_ERROR_REPORTING: process.env.NEXT_PUBLIC_ENABLE_DCI_ERROR_REPORTING !== 'false', // Default true

  // Safety and fallback
  ENABLE_DCI_FALLBACK_TO_EXISTING: process.env.NEXT_PUBLIC_DCI_DISABLE_FALLBACK !== 'true', // Default true
  ENABLE_DCI_MOCK_DATA: process.env.NEXT_PUBLIC_ENABLE_DCI_MOCK_DATA !== 'false', // Default true
  DCI_CONFIDENCE_THRESHOLD: parseInt(process.env.NEXT_PUBLIC_DCI_CONFIDENCE_THRESHOLD || '60'),

  // LLM configuration
  DCI_LLM_MODEL: process.env.NEXT_PUBLIC_DCI_LLM_MODEL || 'gpt-4',
  DCI_LLM_TEMPERATURE: parseFloat(process.env.NEXT_PUBLIC_DCI_LLM_TEMPERATURE || '0.1'),
  DCI_LLM_MAX_TOKENS: parseInt(process.env.NEXT_PUBLIC_DCI_LLM_MAX_TOKENS || '4000')
} as const;

// =============================================================================
// Feature Flag Manager
// =============================================================================

export class DciFeatureFlagManager {
  private static instance: DciFeatureFlagManager;
  private runtimeFlags: Map<string, boolean> = new Map();
  private configOverrides: Map<string, any> = new Map();

  static getInstance(): DciFeatureFlagManager {
    if (!DciFeatureFlagManager.instance) {
      DciFeatureFlagManager.instance = new DciFeatureFlagManager();
    }
    return DciFeatureFlagManager.instance;
  }

  /**
   * Check if DCI Orchestrator is enabled
   */
  isDciEnabled(): boolean {
    return this.getRuntimeFlag('ENABLE_DCI_ORCHESTRATOR', DCI_ENV_CONFIG.ENABLE_DCI_ORCHESTRATOR);
  }

  /**
   * Check if advanced mapping features are enabled
   */
  isAdvancedMappingEnabled(): boolean {
    return this.getRuntimeFlag('ENABLE_DCI_ADVANCED_MAPPING', DCI_ENV_CONFIG.ENABLE_DCI_ADVANCED_MAPPING);
  }

  /**
   * Check if quality validation is enabled
   */
  isQualityValidationEnabled(): boolean {
    return this.getRuntimeFlag('ENABLE_DCI_QUALITY_VALIDATION', DCI_ENV_CONFIG.ENABLE_DCI_QUALITY_VALIDATION);
  }

  /**
   * Check if consistency check is enabled
   */
  isConsistencyCheckEnabled(): boolean {
    return this.getRuntimeFlag('ENABLE_DCI_CONSISTENCY_CHECK', DCI_ENV_CONFIG.ENABLE_DCI_CONSISTENCY_CHECK);
  }

  /**
   * Check if detailed logging is enabled
   */
  isDetailedLoggingEnabled(): boolean {
    return this.getRuntimeFlag('ENABLE_DCI_DETAILED_LOGGING', DCI_ENV_CONFIG.ENABLE_DCI_DETAILED_LOGGING);
  }

  /**
   * Check if fallback to existing results is enabled
   */
  isFallbackEnabled(): boolean {
    return this.getRuntimeFlag('ENABLE_DCI_FALLBACK_TO_EXISTING', DCI_ENV_CONFIG.ENABLE_DCI_FALLBACK_TO_EXISTING);
  }

  /**
   * Get maximum number of DCI passes allowed
   */
  getMaxPasses(): number {
    return this.getConfigValue('DCI_MAX_PASSES', DCI_ENV_CONFIG.DCI_MAX_PASSES);
  }

  /**
   * Get quality threshold for DCI orchestration
   */
  getQualityThreshold(): number {
    return this.getConfigValue('DCI_QUALITY_THRESHOLD', DCI_ENV_CONFIG.DCI_QUALITY_THRESHOLD);
  }

  /**
   * Get confidence threshold for content acceptance
   */
  getConfidenceThreshold(): number {
    return this.getConfigValue('DCI_CONFIDENCE_THRESHOLD', DCI_ENV_CONFIG.DCI_CONFIDENCE_THRESHOLD);
  }

  /**
   * Get DCI orchestrator timeout in milliseconds
   */
  getTimeoutMs(): number {
    return this.getConfigValue('DCI_TIMEOUT_MS', DCI_ENV_CONFIG.DCI_TIMEOUT_MS);
  }

  /**
   * Get LLM configuration object
   */
  getLlmConfig(): {
    model: string;
    temperature: number;
    maxTokens: number;
    timeout: number;
  } {
    return {
      model: this.getConfigValue('DCI_LLM_MODEL', DCI_ENV_CONFIG.DCI_LLM_MODEL),
      temperature: this.getConfigValue('DCI_LLM_TEMPERATURE', DCI_ENV_CONFIG.DCI_LLM_TEMPERATURE),
      maxTokens: this.getConfigValue('DCI_LLM_MAX_TOKENS', DCI_ENV_CONFIG.DCI_LLM_MAX_TOKENS),
      timeout: this.getConfigValue('DCI_LLM_TIMEOUT_MS', DCI_ENV_CONFIG.DCI_LLM_TIMEOUT_MS)
    };
  }

  /**
   * Get complete feature flags summary
   */
  getAllFeatureFlags(): Record<string, boolean | number | string> {
    return {
      // Core features
      isDciEnabled: this.isDciEnabled(),
      isAdvancedMappingEnabled: this.isAdvancedMappingEnabled(),
      isQualityValidationEnabled: this.isQualityValidationEnabled(),
      isConsistencyCheckEnabled: this.isConsistencyCheckEnabled(),

      // Advanced features
      isAdvancedPersonalizationEnabled: this.getRuntimeFlag('ENABLE_DCI_ADVANCED_PERSONALIZATION', DCI_ENV_CONFIG.ENABLE_DCI_ADVANCED_PERSONALIZATION),
      isCompetitiveAnalysisEnabled: this.getRuntimeFlag('ENABLE_DCI_COMPETITIVE_ANALYSIS', DCI_ENV_CONFIG.ENABLE_DCI_COMPETITIVE_ANALYSIS),
      isPredictiveInsightsEnabled: this.getRuntimeFlag('ENABLE_DCI_PREDICTIVE_INSIGHTS', DCI_ENV_CONFIG.ENABLE_DCI_PREDICTIVE_INSIGHTS),

      // Monitoring and debugging
      isDetailedLoggingEnabled: this.isDetailedLoggingEnabled(),
      isPerformanceMetricsEnabled: this.getRuntimeFlag('ENABLE_DCI_PERFORMANCE_METRICS', DCI_ENV_CONFIG.ENABLE_DCI_PERFORMANCE_METRICS),
      isErrorReportingEnabled: this.getRuntimeFlag('ENABLE_DCI_ERROR_REPORTING', DCI_ENV_CONFIG.ENABLE_DCI_ERROR_REPORTING),

      // Safety and fallback
      isFallbackEnabled: this.isFallbackEnabled(),
      isMockDataEnabled: this.getRuntimeFlag('ENABLE_DCI_MOCK_DATA', DCI_ENV_CONFIG.ENABLE_DCI_MOCK_DATA),

      // Configuration values
      maxPasses: this.getMaxPasses(),
      qualityThreshold: this.getQualityThreshold(),
      confidenceThreshold: this.getConfidenceThreshold(),
      timeoutMs: this.getTimeoutMs(),

      // LLM configuration
      llmModel: this.getLlmConfig().model,
      llmTemperature: this.getLlmConfig().temperature,
      llmMaxTokens: this.getLlmConfig().maxTokens,
      llmTimeout: this.getLlmConfig().timeout
    };
  }

  /**
   * Set runtime flag override
   */
  setRuntimeFlag(key: string, value: boolean): void {
    this.runtimeFlags.set(key, value);

    if (this.isDetailedLoggingEnabled()) {
      console.log(`[DCI FeatureFlags] Runtime flag set: ${key} = ${value}`);
    }
  }

  /**
   * Set configuration value override
   */
  setConfigValue(key: string, value: any): void {
    this.configOverrides.set(key, value);

    if (this.isDetailedLoggingEnabled()) {
      console.log(`[DCI FeatureFlags] Config override set: ${key} = ${value}`);
    }
  }

  /**
   * Clear all runtime overrides
   */
  clearRuntimeOverrides(): void {
    this.runtimeFlags.clear();
    this.configOverrides.clear();

    if (this.isDetailedLoggingEnabled()) {
      console.log(`[DCI FeatureFlags] All runtime overrides cleared`);
    }
  }

  /**
   * Validate current configuration
   */
  validateConfiguration(): {
    isValid: boolean;
    warnings: string[];
    errors: string[];
  } {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Validate core configuration
    if (this.getMaxPasses() < 1 || this.getMaxPasses() > 10) {
      errors.push(`Invalid maxPasses: ${this.getMaxPasses()}. Must be between 1 and 10.`);
    }

    if (this.getQualityThreshold() < 1.0 || this.getQualityThreshold() > 5.0) {
      errors.push(`Invalid qualityThreshold: ${this.getQualityThreshold()}. Must be between 1.0 and 5.0.`);
    }

    if (this.getConfidenceThreshold() < 0 || this.getConfidenceThreshold() > 100) {
      errors.push(`Invalid confidenceThreshold: ${this.getConfidenceThreshold()}. Must be between 0 and 100.`);
    }

    if (this.getTimeoutMs() < 10000 || this.getTimeoutMs() > 600000) {
      warnings.push(`TimeoutMs ${this.getTimeoutMs()} is outside recommended range (10s-600s).`);
    }

    // Validate LLM configuration
    const llmConfig = this.getLlmConfig();

    if (llmConfig.temperature < 0.0 || llmConfig.temperature > 2.0) {
      warnings.push(`LLM temperature ${llmConfig.temperature} is outside typical range (0.0-2.0).`);
    }

    if (llmConfig.maxTokens < 100 || llmConfig.maxTokens > 8000) {
      warnings.push(`LLM maxTokens ${llmConfig.maxTokens} is outside recommended range (100-8000).`);
    }

    // Check for conflicting flags
    if (this.isDciEnabled() && !this.isFallbackEnabled()) {
      warnings.push('DCI enabled without fallback mechanism - may cause failures in production.');
    }

    if (!this.isDciEnabled() && this.isAdvancedMappingEnabled()) {
      warnings.push('Advanced mapping enabled but DCI orchestrator disabled - no effect.');
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors
    };
  }

  // Private helper methods

  private getRuntimeFlag(key: string, defaultValue: boolean): boolean {
    return this.runtimeFlags.has(key) ? this.runtimeFlags.get(key)! : defaultValue;
  }

  private getConfigValue<T>(key: string, defaultValue: T): T {
    return this.configOverrides.has(key) ? this.configOverrides.get(key) : defaultValue;
  }
}

// =============================================================================
// Global Feature Flag Instance
// =============================================================================

export const dciFeatureFlags = DciFeatureFlagManager.getInstance();

// =============================================================================
// Feature Flag Utilities
// =============================================================================

/**
 * Execute code only if DCI is enabled
 */
export function withDciEnabled<T>(callback: () => T, fallback?: () => T): T | undefined {
  if (dciFeatureFlags.isDciEnabled()) {
    return callback();
  } else if (fallback) {
    return fallback();
  }
  return undefined;
}

/**
 * Execute async code only if DCI is enabled
 */
export async function withDciEnabledAsync<T>(
  callback: () => Promise<T>,
  fallback?: () => Promise<T>
): Promise<T | undefined> {
  if (dciFeatureFlags.isDciEnabled()) {
    return await callback();
  } else if (fallback) {
    return await fallback();
  }
  return undefined;
}

/**
 * Log only if detailed logging is enabled
 */
export function dciLog(level: 'debug' | 'info' | 'warn' | 'error', message: string, ...args: any[]): void {
  if (dciFeatureFlags.isDetailedLoggingEnabled()) {
    const timestamp = new Date().toISOString();
    const logMessage = `[DCI ${timestamp}] ${message}`;

    switch (level) {
      case 'debug':
        console.debug(logMessage, ...args);
        break;
      case 'info':
        console.info(logMessage, ...args);
        break;
      case 'warn':
        console.warn(logMessage, ...args);
        break;
      case 'error':
        console.error(logMessage, ...args);
        break;
    }
  }
}

/**
 * Performance timing utility
 */
export function withPerformanceMetrics<T>(
  operation: string,
  callback: () => T
): T {
  if (!dciFeatureFlags.getAllFeatureFlags().isPerformanceMetricsEnabled) {
    return callback();
  }

  const startTime = performance.now();
  const result = callback();
  const duration = performance.now() - startTime;

  dciLog('info', `Performance: ${operation} completed in ${duration.toFixed(2)}ms`);

  return result;
}

/**
 * Async performance timing utility
 */
export async function withPerformanceMetricsAsync<T>(
  operation: string,
  callback: () => Promise<T>
): Promise<T> {
  if (!dciFeatureFlags.getAllFeatureFlags().isPerformanceMetricsEnabled) {
    return await callback();
  }

  const startTime = performance.now();
  const result = await callback();
  const duration = performance.now() - startTime;

  dciLog('info', `Performance: ${operation} completed in ${duration.toFixed(2)}ms`);

  return result;
}

// =============================================================================
// Fallback Management
// =============================================================================

export class DciFallbackManager {
  private static instance: DciFallbackManager;
  private fallbackStrategies: Map<string, () => any> = new Map();

  static getInstance(): DciFallbackManager {
    if (!DciFallbackManager.instance) {
      DciFallbackManager.instance = new DciFallbackManager();
    }
    return DciFallbackManager.instance;
  }

  /**
   * Register a fallback strategy for a specific operation
   */
  registerFallback(operation: string, fallbackFunction: () => any): void {
    this.fallbackStrategies.set(operation, fallbackFunction);
    dciLog('debug', `Fallback registered for operation: ${operation}`);
  }

  /**
   * Execute operation with fallback safety
   */
  async executeWithFallback<T>(
    operation: string,
    primaryFunction: () => Promise<T>,
    fallbackFunction?: () => Promise<T>
  ): Promise<T> {
    if (!dciFeatureFlags.isFallbackEnabled()) {
      return await primaryFunction();
    }

    try {
      return await primaryFunction();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      dciLog('warn', `Primary function failed for ${operation}: ${errorMessage}`);

      // Try registered fallback first
      const registeredFallback = this.fallbackStrategies.get(operation);
      if (registeredFallback) {
        try {
          return await registeredFallback();
        } catch (fallbackError) {
          dciLog('error', `Registered fallback failed for ${operation}:`, fallbackError);
        }
      }

      // Try provided fallback
      if (fallbackFunction) {
        try {
          return await fallbackFunction();
        } catch (fallbackError) {
          dciLog('error', `Provided fallback failed for ${operation}:`, fallbackError);
        }
      }

      // Re-throw original error if all fallbacks fail
      throw error;
    }
  }
}

export const dciFallbackManager = DciFallbackManager.getInstance();

// =============================================================================
// Environment Detection Utilities
// =============================================================================

/**
 * Detect if running in production environment
 */
export function isProductionEnvironment(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Detect if running in development environment
 */
export function isDevelopmentEnvironment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Get environment-appropriate DCI configuration
 */
export function getEnvironmentAwareDciConfig(): {
  enableDci: boolean;
  maxPasses: number;
  qualityThreshold: number;
  timeoutMs: number;
  enableLogging: boolean;
  enableFallback: boolean;
} {
  if (isProductionEnvironment()) {
    return {
      enableDci: dciFeatureFlags.isDciEnabled(),
      maxPasses: Math.min(dciFeatureFlags.getMaxPasses(), 3), // Limit in production
      qualityThreshold: Math.max(dciFeatureFlags.getQualityThreshold(), 3.5), // Higher threshold in production
      timeoutMs: Math.min(dciFeatureFlags.getTimeoutMs(), 90000), // Shorter timeout in production
      enableLogging: false, // Disable detailed logging in production
      enableFallback: true // Always enable fallback in production
    };
  } else {
    return {
      enableDci: dciFeatureFlags.isDciEnabled(),
      maxPasses: dciFeatureFlags.getMaxPasses(),
      qualityThreshold: dciFeatureFlags.getQualityThreshold(),
      timeoutMs: dciFeatureFlags.getTimeoutMs(),
      enableLogging: dciFeatureFlags.isDetailedLoggingEnabled(),
      enableFallback: dciFeatureFlags.isFallbackEnabled()
    };
  }
}

// =============================================================================
// Export Summary
// =============================================================================

export {
  DCI_ENV_CONFIG,
  DciFeatureFlagManager,
  DciFallbackManager
};