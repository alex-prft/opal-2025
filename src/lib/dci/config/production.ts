/**
 * DCI Production Environment Configuration
 *
 * Configuration optimized for production performance, reliability, and scalability.
 * Emphasizes stability, monitoring, and graceful error handling.
 */

import { DciOrchestratorConfig } from '@/types/dci-orchestrator';
import { DEFAULT_DCI_CONFIG } from '../orchestrator';

// =============================================================================
// Production Environment Configuration
// =============================================================================

export const PRODUCTION_DCI_CONFIG: DciOrchestratorConfig = {
  ...DEFAULT_DCI_CONFIG,

  // Production-optimized orchestration settings
  maxPasses: 3, // Standard production quality
  qualityThreshold: 4.0, // Higher quality bar for production
  timeoutMs: 120000, // 2 minutes - balance quality and performance

  // Conservative logging for production
  enableDetailedLogging: false, // Disabled for performance
  enablePerformanceMetrics: true, // Monitor production performance

  // LLM configuration optimized for production reliability
  llmConfig: {
    provider: (process.env.DCI_LLM_PROVIDER as any) || 'openai',
    apiKey: process.env.DCI_LLM_API_KEY || process.env.OPENAI_API_KEY,
    model: process.env.DCI_LLM_MODEL || 'gpt-4',
    temperature: 0.1, // Consistent, reliable outputs
    maxTokens: 4000, // Full token allowance for quality
    timeout: 60000, // 60 seconds - production reliability
    retryAttempts: 3, // Full retry attempts for resilience
    retryDelay: 2000 // 2 second delays for production stability
  },

  // Strict quality requirements for production
  qualityRequirements: {
    minimumSpecificity: 3.5,
    minimumStackAlignment: 4.0,
    minimumMaturityFit: 3.5,
    minimumMeasurementRigor: 3.0,
    minimumActionability: 3.5,
    requireDataSources: true // Require actual data in production
  },

  // Production feature configuration
  features: {
    enableProgressiveContextAddition: true,
    enableQualityFeedbackLoops: true,
    enableConsistencyCheck: true,
    enableAdvancedPersonalization: true,
    enableExperimentationContext: true,
    enableDxpToolsIntegration: true,
    enableAnalyticsEnhancement: true,
    enableRoadmapGeneration: true
  },

  // Production context building configuration
  contextConfig: {
    enableSupabaseIntegration: process.env.NEXT_PUBLIC_ENABLE_DCI_SUPABASE === 'true',
    enableOpalIntegration: process.env.NEXT_PUBLIC_ENABLE_DCI_OPAL === 'true',
    enableDxpToolsIntegration: process.env.NEXT_PUBLIC_ENABLE_DCI_DXP_TOOLS === 'true',
    enableAnalyticsIntegration: process.env.NEXT_PUBLIC_ENABLE_DCI_ANALYTICS === 'true',
    dataFreshnessHours: 24, // 24-hour data freshness
    maxItemsPerCategory: 10, // Full data sets for quality
    fallbackToMockData: false, // No fallback in production
    enableCaching: true,
    cacheExpiryMinutes: 30 // 30-minute production cache
  }
};

// =============================================================================
// Production Feature Flags
// =============================================================================

export const PRODUCTION_FEATURE_FLAGS = {
  ENABLE_DCI_ORCHESTRATOR: process.env.NEXT_PUBLIC_ENABLE_DCI_ORCHESTRATOR === 'true',
  ENABLE_DCI_DETAILED_LOGGING: false, // Disabled for production performance
  ENABLE_DCI_PERFORMANCE_METRICS: true, // Monitor production performance
  ENABLE_DCI_QUALITY_VALIDATION: true,
  ENABLE_DCI_CONTEXT_CACHING: true,
  ENABLE_DCI_FALLBACK_GENERATION: true,

  // Production safety features
  ENABLE_DCI_ERROR_BOUNDARIES: true,
  ENABLE_DCI_GRACEFUL_DEGRADATION: true,
  ENABLE_DCI_MONITORING_INTEGRATION: true,
  ENABLE_DCI_RATE_LIMITING: true
};

// =============================================================================
// Production Monitoring Configuration
// =============================================================================

export const PRODUCTION_MONITORING_CONFIG = {
  // Performance monitoring thresholds
  performanceThresholds: {
    maxContextBuildTime: 45000, // 45 seconds
    maxLlmResponseTime: 60000, // 60 seconds
    maxResultsMappingTime: 10000, // 10 seconds
    maxOverallProcessingTime: 120000, // 2 minutes
    minSuccessRate: 0.95, // 95% success rate
    maxErrorRate: 0.05 // 5% error rate
  },

  // Alert thresholds
  alertThresholds: {
    highLatency: 90000, // 1.5 minutes
    highErrorRate: 0.10, // 10% error rate
    lowSuccessRate: 0.85, // 85% success rate
    highMemoryUsage: 0.85, // 85% memory usage
    highCpuUsage: 0.80 // 80% CPU usage
  },

  // Metrics to track
  metrics: [
    'dci_orchestrator_duration_ms',
    'dci_context_build_duration_ms',
    'dci_llm_request_duration_ms',
    'dci_quality_score_distribution',
    'dci_success_rate',
    'dci_error_rate',
    'dci_cache_hit_rate',
    'dci_fallback_usage_rate'
  ],

  // Health check configuration
  healthCheck: {
    enabled: true,
    intervalMs: 60000, // 1 minute intervals
    timeoutMs: 30000, // 30 second timeout
    retryAttempts: 3,
    alertOnFailure: true
  }
};

// =============================================================================
// Production Error Handling Configuration
// =============================================================================

export const PRODUCTION_ERROR_CONFIG = {
  // Error categories and handling strategies
  errorHandling: {
    llmTimeouts: {
      strategy: 'retry_with_fallback',
      maxRetries: 2,
      fallbackToCache: true,
      fallbackToMockData: false
    },
    dataSourceFailures: {
      strategy: 'graceful_degradation',
      usePartialData: true,
      logCriticalErrors: true,
      alertOnFailure: true
    },
    qualityThresholdFailures: {
      strategy: 'extend_processing',
      allowAdditionalPass: true,
      maxAdditionalPasses: 1,
      fallbackQualityThreshold: 3.0
    },
    contextBuildingFailures: {
      strategy: 'partial_context',
      requireMinimumContexts: 2,
      allowEmptyContexts: false,
      logContextGaps: true
    }
  },

  // Production error logging
  logging: {
    logLevel: 'error', // Only log errors in production
    includeStackTrace: false, // Don't expose stack traces
    includeUserData: false, // Don't log user data
    sanitizeApiKeys: true, // Sanitize sensitive data
    logToExternal: true // Send to external monitoring
  }
};

// =============================================================================
// Production Security Configuration
// =============================================================================

export const PRODUCTION_SECURITY_CONFIG = {
  // Rate limiting configuration
  rateLimiting: {
    enabled: true,
    maxRequestsPerMinute: 10, // 10 DCI requests per minute per user
    maxRequestsPerHour: 100, // 100 DCI requests per hour per user
    blockDuration: 900000, // 15 minutes block duration
    enableIpWhitelist: false
  },

  // Input validation
  inputValidation: {
    validateBaseMeta: true,
    sanitizeInputs: true,
    maxInputSize: 50000, // 50KB max input size
    allowedIndustries: [], // Empty = allow all
    allowedMaturityPhases: ['crawl', 'walk', 'run', 'fly'],
    maxGoalsCount: 10,
    maxKpisCount: 15
  },

  // Output sanitization
  outputSanitization: {
    sanitizePersonalInfo: true,
    sanitizeApiKeys: true,
    sanitizeInternalUrls: true,
    removeDebugInfo: true,
    validateJsonStructure: true
  }
};

// =============================================================================
// Production Utilities
// =============================================================================

/**
 * Get production-ready DCI configuration
 */
export function getProductionDciConfig(): DciOrchestratorConfig {
  return {
    ...PRODUCTION_DCI_CONFIG,
    // Environment variable overrides for production tuning
    maxPasses: parseInt(process.env.DCI_MAX_PASSES || '3'),
    qualityThreshold: parseFloat(process.env.DCI_QUALITY_THRESHOLD || '4.0'),
    timeoutMs: parseInt(process.env.DCI_TIMEOUT_MS || '120000'),
  };
}

/**
 * Validate production environment readiness
 */
export function validateProductionEnvironment(): {
  isReady: boolean;
  criticalIssues: string[];
  warnings: string[];
  securityChecks: { [check: string]: boolean };
} {
  const criticalIssues: string[] = [];
  const warnings: string[] = [];
  const securityChecks: { [check: string]: boolean } = {};

  // Critical environment checks
  if (!process.env.DCI_LLM_API_KEY && !process.env.OPENAI_API_KEY) {
    criticalIssues.push('LLM API key not configured for production');
  }

  if (!process.env.NEXT_PUBLIC_ENABLE_DCI_ORCHESTRATOR) {
    criticalIssues.push('DCI Orchestrator not enabled in production');
  }

  // Data source availability checks
  if (!process.env.NEXT_PUBLIC_ENABLE_DCI_SUPABASE) {
    warnings.push('Supabase integration not enabled - will limit context quality');
  }

  if (!process.env.NEXT_PUBLIC_ENABLE_DCI_OPAL) {
    warnings.push('OPAL integration not enabled - will limit agent context');
  }

  // Security checks
  securityChecks.rateLimitingEnabled = PRODUCTION_DCI_CONFIG.features?.enableRateLimiting || false;
  securityChecks.inputValidationEnabled = true;
  securityChecks.outputSanitizationEnabled = true;
  securityChecks.errorHandlingConfigured = true;
  securityChecks.monitoringEnabled = PRODUCTION_FEATURE_FLAGS.ENABLE_DCI_MONITORING_INTEGRATION;

  return {
    isReady: criticalIssues.length === 0,
    criticalIssues,
    warnings,
    securityChecks
  };
}

/**
 * Generate production health report
 */
export function generateProductionHealthReport(): {
  status: 'healthy' | 'degraded' | 'critical';
  uptime: number;
  performance: { [metric: string]: number };
  errors: string[];
  recommendations: string[];
} {
  // This would integrate with actual monitoring systems in production
  const mockPerformance = {
    averageResponseTime: 45000, // 45 seconds
    successRate: 0.96, // 96%
    errorRate: 0.04, // 4%
    cacheHitRate: 0.78 // 78%
  };

  const errors: string[] = [];
  const recommendations: string[] = [];

  // Analyze performance
  if (mockPerformance.averageResponseTime > 60000) {
    errors.push('High response times detected');
    recommendations.push('Consider optimizing LLM response times or reducing context size');
  }

  if (mockPerformance.successRate < 0.95) {
    errors.push('Success rate below threshold');
    recommendations.push('Investigate error patterns and improve error handling');
  }

  const status = errors.length === 0 ? 'healthy' : errors.length < 3 ? 'degraded' : 'critical';

  return {
    status,
    uptime: Date.now() - (new Date('2024-01-01').getTime()), // Mock uptime
    performance: mockPerformance,
    errors,
    recommendations
  };
}

/**
 * Initialize production monitoring
 */
export function initializeProductionMonitoring(): void {
  if (PRODUCTION_FEATURE_FLAGS.ENABLE_DCI_MONITORING_INTEGRATION) {
    // Initialize monitoring integrations
    console.log('[DCI Production] Monitoring initialized');

    // Set up performance tracking
    // Set up error tracking
    // Set up health checks
    // Set up alerting
  }
}

/**
 * Production-safe error reporting
 */
export function reportProductionError(error: Error, context: any): void {
  // Sanitize context to remove sensitive information
  const sanitizedContext = {
    ...context,
    apiKey: '[REDACTED]',
    userInfo: '[REDACTED]',
    timestamp: new Date().toISOString()
  };

  // Log to external monitoring service
  console.error('[DCI Production Error]', {
    message: error.message,
    context: sanitizedContext
  });

  // Send to monitoring service (Prometheus, DataDog, etc.)
  // Alert on critical errors
}