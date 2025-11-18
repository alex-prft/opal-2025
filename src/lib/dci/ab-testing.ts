/**
 * DCI A/B Testing Integration
 *
 * Provides A/B testing capabilities for DCI rollout with feature flagging,
 * traffic allocation, and performance monitoring to ensure safe production deployment.
 */

import { DciOrchestratorConfig, OSAResults } from '@/types/dci-orchestrator';
import { dciLog } from './feature-flags';

// =============================================================================
// A/B Testing Configuration
// =============================================================================

export interface DciAbTestConfig {
  testId: string;
  testName: string;
  description: string;
  enabled: boolean;
  trafficAllocation: {
    control: number; // Percentage (0-100)
    treatment: number; // Percentage (0-100)
  };
  targetAudience: {
    includeAll: boolean;
    includedOrgIds?: string[];
    excludedOrgIds?: string[];
    maturityPhases?: string[];
    industries?: string[];
  };
  metrics: {
    primary: string[];
    secondary: string[];
  };
  duration: {
    startDate: string;
    endDate: string;
    minRunDays: number;
  };
  successCriteria: {
    primaryMetricImprovement: number; // Minimum % improvement required
    statisticalSignificance: number; // p-value threshold (e.g., 0.05)
    minSampleSize: number;
  };
  safeguards: {
    maxErrorRate: number; // Maximum error rate before auto-disable
    maxLatencyMs: number; // Maximum latency before auto-disable
    emergencyDisable: boolean;
  };
}

export interface DciAbTestResult {
  userId: string;
  orgId: string;
  testId: string;
  variant: 'control' | 'treatment';
  assigned: boolean;
  reason: string;
  timestamp: string;
}

export interface DciAbTestMetrics {
  testId: string;
  variant: 'control' | 'treatment';
  metrics: {
    requests: number;
    successes: number;
    errors: number;
    averageLatencyMs: number;
    averageQualityScore: number;
    userSatisfactionScore?: number;
  };
  timestamp: string;
}

// =============================================================================
// Default A/B Test Configuration
// =============================================================================

export const DEFAULT_DCI_AB_TEST: DciAbTestConfig = {
  testId: 'dci-rollout-2024-q4',
  testName: 'DCI Orchestrator Production Rollout',
  description: 'Gradual rollout of DCI Orchestrator to validate production performance and quality improvements',
  enabled: process.env.NEXT_PUBLIC_ENABLE_DCI_AB_TEST === 'true',
  trafficAllocation: {
    control: 90, // 90% get existing results system
    treatment: 10 // 10% get DCI Orchestrator
  },
  targetAudience: {
    includeAll: false,
    maturityPhases: ['walk', 'run', 'fly'], // Exclude 'crawl' initially
    industries: [], // All industries
    includedOrgIds: [], // Can specify specific orgs for beta testing
    excludedOrgIds: [] // Can exclude problematic orgs
  },
  metrics: {
    primary: [
      'results_generation_success_rate',
      'results_quality_score',
      'user_engagement_time',
      'recommendation_implementation_rate'
    ],
    secondary: [
      'api_response_time',
      'error_rate',
      'user_satisfaction_score',
      'content_specificity_score'
    ]
  },
  duration: {
    startDate: '2024-12-01T00:00:00Z',
    endDate: '2024-12-31T23:59:59Z',
    minRunDays: 14 // Minimum 2 weeks
  },
  successCriteria: {
    primaryMetricImprovement: 15, // 15% improvement required
    statisticalSignificance: 0.05, // 95% confidence
    minSampleSize: 1000 // 1000 users minimum
  },
  safeguards: {
    maxErrorRate: 0.05, // 5% error rate
    maxLatencyMs: 180000, // 3 minutes max latency
    emergencyDisable: true
  }
};

// =============================================================================
// A/B Testing Service
// =============================================================================

export class DciAbTestingService {
  private static instance: DciAbTestingService;
  private config: DciAbTestConfig;
  private metricsStore: Map<string, DciAbTestMetrics[]> = new Map();

  constructor(config: DciAbTestConfig = DEFAULT_DCI_AB_TEST) {
    this.config = config;
  }

  static getInstance(config?: DciAbTestConfig): DciAbTestingService {
    if (!DciAbTestingService.instance) {
      DciAbTestingService.instance = new DciAbTestingService(config);
    }
    return DciAbTestingService.instance;
  }

  /**
   * Determine if user should receive DCI treatment
   */
  async assignVariant(userId: string, orgId: string, context?: {
    maturityPhase?: string;
    industry?: string;
  }): Promise<DciAbTestResult> {
    const result: DciAbTestResult = {
      userId,
      orgId,
      testId: this.config.testId,
      variant: 'control',
      assigned: false,
      reason: 'not_assigned',
      timestamp: new Date().toISOString()
    };

    // Check if A/B testing is enabled
    if (!this.config.enabled) {
      result.reason = 'ab_testing_disabled';
      return result;
    }

    // Check if test is within date range
    const now = new Date();
    const startDate = new Date(this.config.duration.startDate);
    const endDate = new Date(this.config.duration.endDate);

    if (now < startDate || now > endDate) {
      result.reason = 'outside_test_duration';
      return result;
    }

    // Check safeguards
    const currentMetrics = await this.getCurrentMetrics();
    if (this.shouldDisableTest(currentMetrics)) {
      result.reason = 'safeguards_triggered';
      dciLog('warn', 'DCI A/B test disabled due to safeguard triggers');
      return result;
    }

    // Check target audience criteria
    if (!this.isEligibleForTest(orgId, context)) {
      result.reason = 'not_in_target_audience';
      return result;
    }

    // Perform traffic allocation
    const hash = this.hashUserId(userId);
    const trafficBucket = hash % 100;

    if (trafficBucket < this.config.trafficAllocation.treatment) {
      result.variant = 'treatment';
      result.assigned = true;
      result.reason = 'assigned_to_treatment';

      dciLog('info', `User ${userId} assigned to DCI treatment variant`);
    } else {
      result.variant = 'control';
      result.assigned = true;
      result.reason = 'assigned_to_control';
    }

    // Record assignment for analysis
    await this.recordAssignment(result);

    return result;
  }

  /**
   * Check if user/org is eligible for the test
   */
  private isEligibleForTest(orgId: string, context?: { maturityPhase?: string; industry?: string }): boolean {
    const { targetAudience } = this.config;

    // Check if all users are included
    if (targetAudience.includeAll) {
      return true;
    }

    // Check excluded orgs
    if (targetAudience.excludedOrgIds?.includes(orgId)) {
      return false;
    }

    // Check included orgs (if specified)
    if (targetAudience.includedOrgIds?.length && !targetAudience.includedOrgIds.includes(orgId)) {
      return false;
    }

    // Check maturity phase
    if (targetAudience.maturityPhases?.length && context?.maturityPhase) {
      if (!targetAudience.maturityPhases.includes(context.maturityPhase)) {
        return false;
      }
    }

    // Check industry
    if (targetAudience.industries?.length && context?.industry) {
      if (!targetAudience.industries.includes(context.industry)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Hash user ID for consistent traffic allocation
   */
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Record metrics for A/B test analysis
   */
  async recordMetrics(
    testId: string,
    variant: 'control' | 'treatment',
    metrics: Partial<DciAbTestMetrics['metrics']>
  ): Promise<void> {
    const key = `${testId}-${variant}`;
    const existingMetrics = this.metricsStore.get(key) || [];

    const newMetric: DciAbTestMetrics = {
      testId,
      variant,
      metrics: {
        requests: 0,
        successes: 0,
        errors: 0,
        averageLatencyMs: 0,
        averageQualityScore: 0,
        ...metrics
      },
      timestamp: new Date().toISOString()
    };

    existingMetrics.push(newMetric);
    this.metricsStore.set(key, existingMetrics);

    // In production, this would send to analytics service
    dciLog('debug', `Recorded A/B test metrics for ${variant}:`, newMetric);
  }

  /**
   * Get current aggregated metrics
   */
  private async getCurrentMetrics(): Promise<{ control: any; treatment: any }> {
    const controlKey = `${this.config.testId}-control`;
    const treatmentKey = `${this.config.testId}-treatment`;

    const controlMetrics = this.metricsStore.get(controlKey) || [];
    const treatmentMetrics = this.metricsStore.get(treatmentKey) || [];

    return {
      control: this.aggregateMetrics(controlMetrics),
      treatment: this.aggregateMetrics(treatmentMetrics)
    };
  }

  /**
   * Aggregate metrics for analysis
   */
  private aggregateMetrics(metrics: DciAbTestMetrics[]): any {
    if (metrics.length === 0) {
      return {
        requests: 0,
        successes: 0,
        errors: 0,
        errorRate: 0,
        averageLatencyMs: 0,
        averageQualityScore: 0
      };
    }

    const totals = metrics.reduce((acc, m) => ({
      requests: acc.requests + m.metrics.requests,
      successes: acc.successes + m.metrics.successes,
      errors: acc.errors + m.metrics.errors,
      totalLatency: acc.totalLatency + (m.metrics.averageLatencyMs * m.metrics.requests),
      totalQuality: acc.totalQuality + (m.metrics.averageQualityScore * m.metrics.requests)
    }), { requests: 0, successes: 0, errors: 0, totalLatency: 0, totalQuality: 0 });

    return {
      requests: totals.requests,
      successes: totals.successes,
      errors: totals.errors,
      errorRate: totals.requests > 0 ? totals.errors / totals.requests : 0,
      averageLatencyMs: totals.requests > 0 ? totals.totalLatency / totals.requests : 0,
      averageQualityScore: totals.requests > 0 ? totals.totalQuality / totals.requests : 0
    };
  }

  /**
   * Check if test should be disabled due to safeguards
   */
  private shouldDisableTest(metrics: { control: any; treatment: any }): boolean {
    const { safeguards } = this.config;

    // Check treatment error rate
    if (metrics.treatment.errorRate > safeguards.maxErrorRate) {
      dciLog('error', `Treatment error rate ${metrics.treatment.errorRate} exceeds threshold ${safeguards.maxErrorRate}`);
      return true;
    }

    // Check treatment latency
    if (metrics.treatment.averageLatencyMs > safeguards.maxLatencyMs) {
      dciLog('error', `Treatment latency ${metrics.treatment.averageLatencyMs}ms exceeds threshold ${safeguards.maxLatencyMs}ms`);
      return true;
    }

    return false;
  }

  /**
   * Generate A/B test report
   */
  async generateTestReport(): Promise<{
    testStatus: 'running' | 'completed' | 'disabled';
    duration: { daysRunning: number; totalDays: number };
    trafficAllocation: { control: number; treatment: number };
    metrics: { control: any; treatment: any };
    significance: { isSignificant: boolean; pValue?: number };
    recommendation: 'continue' | 'launch' | 'abort';
    insights: string[];
  }> {
    const now = new Date();
    const startDate = new Date(this.config.duration.startDate);
    const endDate = new Date(this.config.duration.endDate);

    const daysRunning = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    const testStatus = now > endDate ? 'completed' : this.config.enabled ? 'running' : 'disabled';
    const metrics = await this.getCurrentMetrics();

    // Simple significance calculation (in production, use proper statistical tests)
    const isSignificant = this.calculateSignificance(metrics);

    // Generate recommendation
    let recommendation: 'continue' | 'launch' | 'abort' = 'continue';
    const insights: string[] = [];

    if (testStatus === 'completed' || daysRunning >= this.config.duration.minRunDays) {
      if (isSignificant && metrics.treatment.averageQualityScore > metrics.control.averageQualityScore) {
        recommendation = 'launch';
        insights.push('Treatment shows statistically significant improvement in quality');
      } else if (metrics.treatment.errorRate > metrics.control.errorRate * 1.5) {
        recommendation = 'abort';
        insights.push('Treatment shows significantly higher error rate');
      } else {
        insights.push('Results are inconclusive - consider extending test duration');
      }
    }

    if (metrics.treatment.averageLatencyMs > metrics.control.averageLatencyMs * 1.2) {
      insights.push('Treatment shows higher latency - consider performance optimization');
    }

    return {
      testStatus,
      duration: { daysRunning, totalDays },
      trafficAllocation: this.config.trafficAllocation,
      metrics,
      significance: { isSignificant, pValue: isSignificant ? 0.03 : 0.15 }, // Mock p-value
      recommendation,
      insights
    };
  }

  /**
   * Simple significance calculation (mock implementation)
   */
  private calculateSignificance(metrics: { control: any; treatment: any }): boolean {
    // In production, this would use proper statistical tests (t-test, chi-square, etc.)
    const controlRequests = metrics.control.requests;
    const treatmentRequests = metrics.treatment.requests;

    // Need minimum sample size
    if (controlRequests < this.config.successCriteria.minSampleSize ||
        treatmentRequests < this.config.successCriteria.minSampleSize) {
      return false;
    }

    // Mock significance check - in production, use actual statistical analysis
    const qualityImprovement = (metrics.treatment.averageQualityScore - metrics.control.averageQualityScore) / metrics.control.averageQualityScore;
    return qualityImprovement > (this.config.successCriteria.primaryMetricImprovement / 100);
  }

  /**
   * Record assignment for analysis
   */
  private async recordAssignment(result: DciAbTestResult): Promise<void> {
    // In production, this would store in analytics database
    dciLog('debug', 'A/B test assignment recorded:', result);
  }

  /**
   * Update test configuration (admin only)
   */
  updateTestConfig(updates: Partial<DciAbTestConfig>): void {
    this.config = { ...this.config, ...updates };
    dciLog('info', 'A/B test configuration updated');
  }

  /**
   * Emergency disable test
   */
  emergencyDisable(reason: string): void {
    this.config.enabled = false;
    dciLog('error', `A/B test emergency disabled: ${reason}`);
  }
}

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Initialize DCI A/B testing
 */
export function initializeDciAbTesting(config?: DciAbTestConfig): DciAbTestingService {
  return DciAbTestingService.getInstance(config);
}

/**
 * Check if user should use DCI
 */
export async function shouldUseDci(
  userId: string,
  orgId: string,
  context?: { maturityPhase?: string; industry?: string }
): Promise<boolean> {
  const abTest = DciAbTestingService.getInstance();
  const result = await abTest.assignVariant(userId, orgId, context);
  return result.variant === 'treatment' && result.assigned;
}

/**
 * Record DCI usage metrics
 */
export async function recordDciMetrics(
  userId: string,
  variant: 'control' | 'treatment',
  metrics: {
    success: boolean;
    latencyMs: number;
    qualityScore?: number;
    errorMessage?: string;
  }
): Promise<void> {
  const abTest = DciAbTestingService.getInstance();

  await abTest.recordMetrics(DEFAULT_DCI_AB_TEST.testId, variant, {
    requests: 1,
    successes: metrics.success ? 1 : 0,
    errors: metrics.success ? 0 : 1,
    averageLatencyMs: metrics.latencyMs,
    averageQualityScore: metrics.qualityScore || 0
  });
}

// =============================================================================
// Export Default Instance
// =============================================================================

export const dciAbTesting = DciAbTestingService.getInstance();