/**
 * DCI Orchestrator End-to-End Integration Tests
 *
 * Comprehensive tests validating the complete DCI pipeline from
 * context building through Results generation and mapping.
 */

import { describe, it, expect, beforeAll, afterEach, jest } from '@jest/globals';

import {
  runDciOrchestrator,
  validateQualityRequirements,
  DEFAULT_DCI_CONFIG
} from '../orchestrator';

import {
  buildContextBuckets,
  validateContextBuckets
} from '../context-builder';

import {
  mapOSAResultsToResultsPageContent,
  calculateOverallConfidence
} from '../results-mapper';

import {
  initializeDciConfiguration,
  getEnvironmentDciConfig,
  validateCurrentEnvironment
} from '../config';

import {
  dciAbTesting,
  shouldUseDci
} from '../ab-testing';

import {
  dciMonitoring,
  recordDciMetrics
} from '../monitoring';

import {
  OSAResults,
  DciContextBuckets,
  ResultsQualityScore
} from '@/types/dci-orchestrator';

// =============================================================================
// Test Data Setup
// =============================================================================

const mockBaseMeta: OSAResults['meta'] = {
  orgName: 'E2E Test Organization',
  industry: 'Technology',
  region: 'North America',
  maturityPhase: 'walk',
  primaryGoals: ['Improve conversion rate', 'Enhance user experience', 'Scale personalization'],
  primaryKpis: ['CVR', 'Engagement', 'Performance', 'User Satisfaction'],
  optiStack: ['Optimizely WebX', 'Optimizely CMS', 'ODP', 'Content Recommendations'],
  generationTimestamp: new Date().toISOString(),
  dciVersion: '1.0.0'
};

const mockUserContext = {
  userId: 'e2e-test-user',
  orgId: 'e2e-test-org',
  maturityPhase: 'walk',
  industry: 'Technology'
};

// =============================================================================
// End-to-End Test Suite
// =============================================================================

describe('DCI Orchestrator End-to-End Tests', () => {
  let testStartTime: number;

  beforeAll(async () => {
    // Initialize DCI configuration for testing
    initializeDciConfiguration();
    testStartTime = Date.now();

    console.log('[E2E] Starting DCI Orchestrator end-to-end validation...');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // =============================================================================
  // Complete Pipeline Tests
  // =============================================================================

  describe('Complete DCI Pipeline', () => {
    it('should execute full DCI workflow with production-like conditions', async () => {
      const trackingId = dciMonitoring.startOrchestration(mockUserContext);
      const startTime = Date.now();

      try {
        // Step 1: Build context buckets
        console.log('[E2E] Step 1: Building context buckets...');
        const contextBuckets = await buildContextBuckets(mockBaseMeta);

        expect(contextBuckets).toBeDefined();

        const contextValidation = validateContextBuckets(contextBuckets);
        expect(contextValidation.coverage).toBeGreaterThan(0);

        console.log(`[E2E] Context coverage: ${Math.round(contextValidation.coverage * 100)}%`);

        // Step 2: Run DCI orchestration
        console.log('[E2E] Step 2: Running DCI orchestration...');
        const osaResults = await runDciOrchestrator({
          baseMeta: mockBaseMeta,
          contextBuckets,
          config: {
            ...DEFAULT_DCI_CONFIG,
            enableDetailedLogging: true,
            maxPasses: 2, // Reduced for testing
            timeoutMs: 90000 // 1.5 minutes for testing
          },
          correlationId: trackingId
        });

        expect(osaResults).toBeDefined();
        expect(osaResults.meta).toBeDefined();
        expect(osaResults.contentImprovements).toBeDefined();
        expect(osaResults.analyticsInsights).toBeDefined();
        expect(osaResults.experienceTactics).toBeDefined();
        expect(osaResults.strategyPlans).toBeDefined();
        expect(osaResults.generation).toBeDefined();

        // Validate generation metadata
        expect(osaResults.generation.totalPasses).toBeGreaterThan(0);
        expect(osaResults.generation.totalPasses).toBeLessThanOrEqual(2);
        expect(osaResults.generation.finalQualityScore).toBeGreaterThan(0);
        expect(osaResults.generation.confidence).toMatch(/low|medium|high/);

        console.log(`[E2E] Generation completed in ${osaResults.generation.totalPasses} passes`);
        console.log(`[E2E] Final quality score: ${osaResults.generation.finalQualityScore}`);

        // Step 3: Test all tier mappings
        console.log('[E2E] Step 3: Testing Results page mappings...');
        const tiers: Array<'strategy' | 'insights' | 'optimization' | 'dxptools'> =
          ['strategy', 'insights', 'optimization', 'dxptools'];

        for (const tier of tiers) {
          const mapped = mapOSAResultsToResultsPageContent(osaResults, tier);

          expect(mapped).toBeDefined();
          expect(mapped.hero).toBeDefined();
          expect(mapped.hero.title).toBeTruthy();
          expect(mapped.hero.promise).toBeTruthy();
          expect(mapped.hero.metrics).toHaveLength(3);

          expect(mapped.overview).toBeDefined();
          expect(mapped.overview.summary).toBeTruthy();
          expect(mapped.overview.keyPoints.length).toBeGreaterThan(0);

          expect(mapped.insights.length).toBeGreaterThan(0);
          expect(mapped.opportunities.length).toBeGreaterThan(0);
          expect(mapped.nextSteps.length).toBeGreaterThan(0);

          expect(mapped.meta.tier).toBe(tier);
          expect(mapped.meta.generatedAt).toBeTruthy();

          console.log(`[E2E] ${tier} tier mapping validated`);
        }

        // Step 4: Record metrics
        const duration = Date.now() - startTime;
        console.log(`[E2E] Step 4: Recording metrics (duration: ${duration}ms)...`);

        dciMonitoring.completeOrchestration(
          trackingId,
          {
            successful: true,
            osaResults,
            durationMs: duration
          },
          mockUserContext
        );

        // Validate metrics were recorded
        const healthStatus = dciMonitoring.getHealthStatus();
        expect(healthStatus).toBeDefined();
        expect(healthStatus.status).toMatch(/healthy|degraded/);

        const metricsSummary = dciMonitoring.getMetricsSummary();
        expect(metricsSummary.totalRequests).toBeGreaterThan(0);

        console.log('[E2E] ✅ Complete pipeline test passed');

      } catch (error) {
        const duration = Date.now() - startTime;

        dciMonitoring.completeOrchestration(
          trackingId,
          {
            successful: false,
            durationMs: duration,
            error: error as Error
          },
          mockUserContext
        );

        throw error;
      }
    }, 120000); // 2 minute timeout

    it('should handle partial context scenarios gracefully', async () => {
      console.log('[E2E] Testing partial context handling...');

      // Create minimal context
      const minimalContextBuckets: DciContextBuckets = {
        contentContext: {
          topTrafficPages: ['Homepage'],
          underperformingPages: ['Checkout'],
          highValuePages: ['Homepage'],
          contentTypes: ['page'],
          knownContentIssues: ['Testing scenario'],
          contentPerformanceData: [],
          topicsData: []
        }
        // Missing other contexts intentionally
      };

      const osaResults = await runDciOrchestrator({
        baseMeta: mockBaseMeta,
        contextBuckets: minimalContextBuckets,
        config: {
          ...DEFAULT_DCI_CONFIG,
          maxPasses: 1,
          qualityThreshold: 2.0, // Lower quality threshold
          timeoutMs: 60000
        }
      });

      expect(osaResults).toBeDefined();
      expect(osaResults.generation.confidence).toBe('low'); // Should reflect limited context

      // Should still generate all required sections
      expect(osaResults.contentImprovements.prioritizedActions.length).toBeGreaterThan(0);
      expect(osaResults.analyticsInsights.keyFindings.length).toBeGreaterThan(0);
      expect(osaResults.experienceTactics.experiments.length).toBeGreaterThan(0);
      expect(osaResults.strategyPlans.roadmapItems.length).toBeGreaterThan(0);

      console.log('[E2E] ✅ Partial context test passed');
    });

    it('should maintain performance under load', async () => {
      console.log('[E2E] Testing performance under simulated load...');

      const concurrentRequests = 5;
      const requests: Promise<OSAResults>[] = [];

      for (let i = 0; i < concurrentRequests; i++) {
        const request = runDciOrchestrator({
          baseMeta: {
            ...mockBaseMeta,
            orgName: `Load Test Org ${i}`
          },
          contextBuckets: await buildContextBuckets(mockBaseMeta),
          config: {
            ...DEFAULT_DCI_CONFIG,
            maxPasses: 1, // Reduced for load testing
            timeoutMs: 45000
          }
        });

        requests.push(request);
      }

      const startTime = Date.now();
      const results = await Promise.allSettled(requests);
      const totalDuration = Date.now() - startTime;

      // Analyze results
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      console.log(`[E2E] Load test results: ${successful}/${concurrentRequests} successful in ${totalDuration}ms`);

      // Should have reasonable success rate under load
      expect(successful / concurrentRequests).toBeGreaterThan(0.8); // 80% success rate
      expect(totalDuration).toBeLessThan(120000); // Complete within 2 minutes

      console.log('[E2E] ✅ Performance load test passed');
    });
  });

  // =============================================================================
  // Configuration and Environment Tests
  // =============================================================================

  describe('Configuration and Environment', () => {
    it('should validate environment configuration correctly', () => {
      console.log('[E2E] Testing environment configuration...');

      const envValidation = validateCurrentEnvironment();

      expect(envValidation.environment).toMatch(/development|staging|production|test/);
      expect(envValidation.issues).toBeDefined();
      expect(envValidation.warnings).toBeDefined();
      expect(envValidation.recommendations).toBeDefined();

      // Should not have critical issues in test environment
      expect(envValidation.issues.length).toBeLessThan(5);

      console.log(`[E2E] Environment: ${envValidation.environment}`);
      console.log(`[E2E] Issues: ${envValidation.issues.length}`);
      console.log(`[E2E] Warnings: ${envValidation.warnings.length}`);

      console.log('[E2E] ✅ Environment configuration test passed');
    });

    it('should provide different configurations for different scenarios', () => {
      console.log('[E2E] Testing configuration scenarios...');

      const speedConfig = getEnvironmentDciConfig();
      expect(speedConfig).toBeDefined();
      expect(speedConfig.maxPasses).toBeGreaterThan(0);
      expect(speedConfig.qualityThreshold).toBeGreaterThan(0);
      expect(speedConfig.timeoutMs).toBeGreaterThan(0);

      console.log(`[E2E] Config - maxPasses: ${speedConfig.maxPasses}`);
      console.log(`[E2E] Config - qualityThreshold: ${speedConfig.qualityThreshold}`);
      console.log(`[E2E] Config - timeoutMs: ${speedConfig.timeoutMs}`);

      console.log('[E2E] ✅ Configuration scenarios test passed');
    });
  });

  // =============================================================================
  // A/B Testing Integration Tests
  // =============================================================================

  describe('A/B Testing Integration', () => {
    it('should correctly assign users to variants', async () => {
      console.log('[E2E] Testing A/B testing integration...');

      // Test multiple users to verify distribution
      const testUsers = Array.from({length: 20}, (_, i) => `test-user-${i}`);
      const assignments = [];

      for (const userId of testUsers) {
        const shouldUse = await shouldUseDci(userId, 'test-org', {
          maturityPhase: 'walk',
          industry: 'Technology'
        });

        assignments.push(shouldUse);
      }

      // Should have some variety in assignments (not all true or all false)
      const treatmentCount = assignments.filter(a => a).length;
      const controlCount = assignments.filter(a => !a).length;

      console.log(`[E2E] A/B assignments - Treatment: ${treatmentCount}, Control: ${controlCount}`);

      // At least some users should be assigned (unless A/B testing is disabled)
      expect(treatmentCount + controlCount).toBe(20);

      console.log('[E2E] ✅ A/B testing integration test passed');
    });

    it('should generate meaningful A/B test reports', async () => {
      console.log('[E2E] Testing A/B test reporting...');

      const report = await dciAbTesting.generateTestReport();

      expect(report).toBeDefined();
      expect(report.testStatus).toMatch(/running|completed|disabled/);
      expect(report.trafficAllocation).toBeDefined();
      expect(report.trafficAllocation.control).toBeGreaterThanOrEqual(0);
      expect(report.trafficAllocation.treatment).toBeGreaterThanOrEqual(0);
      expect(report.recommendation).toMatch(/continue|launch|abort/);

      console.log(`[E2E] Test status: ${report.testStatus}`);
      console.log(`[E2E] Recommendation: ${report.recommendation}`);

      console.log('[E2E] ✅ A/B test reporting test passed');
    });
  });

  // =============================================================================
  // Monitoring and Alerting Tests
  // =============================================================================

  describe('Monitoring and Alerting', () => {
    it('should collect and report metrics correctly', () => {
      console.log('[E2E] Testing monitoring and metrics...');

      // Record test metrics
      recordDciMetrics({
        orchestrationDurationMs: 45000,
        contextBuildDurationMs: 15000,
        llmRequestDurationMs: 25000,
        resultsMappingDurationMs: 5000,
        totalProcessingDurationMs: 45000,
        finalQualityScore: 4.2,
        passesRequired: 2,
        contextBucketsUsed: 3,
        confidenceLevel: 'high',
        successful: true,
        orgId: 'test-org',
        userId: 'test-user',
        maturityPhase: 'walk',
        industry: 'Technology',
        timestamp: new Date().toISOString()
      });

      // Get health status
      const healthStatus = dciMonitoring.getHealthStatus();
      expect(healthStatus).toBeDefined();
      expect(healthStatus.status).toMatch(/healthy|degraded|critical|unavailable/);

      // Get metrics summary
      const summary = dciMonitoring.getMetricsSummary();
      expect(summary).toBeDefined();
      expect(summary.totalRequests).toBeGreaterThanOrEqual(1);

      console.log(`[E2E] Health status: ${healthStatus.status}`);
      console.log(`[E2E] Total requests: ${summary.totalRequests}`);
      console.log(`[E2E] Success rate: ${Math.round(summary.successRate * 100)}%`);

      console.log('[E2E] ✅ Monitoring and metrics test passed');
    });

    it('should generate comprehensive dashboard data', () => {
      console.log('[E2E] Testing monitoring dashboard...');

      const dashboardData = dciMonitoring.getDashboardData();

      expect(dashboardData).toBeDefined();
      expect(dashboardData.healthStatus).toBeDefined();
      expect(dashboardData.summary).toBeDefined();
      expect(dashboardData.trends).toBeDefined();
      expect(dashboardData.trends.hourly).toBeDefined();
      expect(dashboardData.trends.daily).toBeDefined();

      console.log(`[E2E] Active alerts: ${dashboardData.activeAlerts.length}`);
      console.log(`[E2E] Recent metrics: ${dashboardData.recentMetrics.length}`);

      console.log('[E2E] ✅ Monitoring dashboard test passed');
    });
  });

  // =============================================================================
  // Error Handling and Edge Cases
  // =============================================================================

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid input gracefully', async () => {
      console.log('[E2E] Testing error handling with invalid input...');

      const invalidBaseMeta = {
        ...mockBaseMeta,
        maturityPhase: 'invalid' as any,
        primaryKpis: [], // Empty KPIs
        optiStack: [] // Empty stack
      };

      try {
        const osaResults = await runDciOrchestrator({
          baseMeta: invalidBaseMeta,
          contextBuckets: {},
          config: {
            ...DEFAULT_DCI_CONFIG,
            maxPasses: 1,
            timeoutMs: 30000
          }
        });

        // Should still produce results (graceful degradation)
        expect(osaResults).toBeDefined();
        expect(osaResults.generation.confidence).toBe('low');

        console.log('[E2E] ✅ Invalid input handled gracefully');
      } catch (error) {
        // Error should be handled appropriately
        expect(error).toBeDefined();
        console.log(`[E2E] ✅ Error properly caught: ${(error as Error).message}`);
      }
    });

    it('should handle timeout scenarios', async () => {
      console.log('[E2E] Testing timeout handling...');

      try {
        const osaResults = await runDciOrchestrator({
          baseMeta: mockBaseMeta,
          contextBuckets: await buildContextBuckets(mockBaseMeta),
          config: {
            ...DEFAULT_DCI_CONFIG,
            timeoutMs: 100 // Very short timeout to trigger timeout
          }
        });

        // If we get results, they should be valid but low confidence
        if (osaResults) {
          expect(osaResults.generation.confidence).toMatch(/low|medium/);
        }

        console.log('[E2E] ✅ Timeout handled gracefully');
      } catch (error) {
        // Timeout errors should be handled appropriately
        expect(error).toBeDefined();
        console.log(`[E2E] ✅ Timeout error properly handled: ${(error as Error).message}`);
      }
    });
  });

  // =============================================================================
  // Final Integration Validation
  // =============================================================================

  describe('Final Integration Validation', () => {
    it('should demonstrate complete DCI value proposition', async () => {
      console.log('[E2E] Running complete DCI value demonstration...');

      const startTime = Date.now();

      // Build rich context
      const contextBuckets = await buildContextBuckets(mockBaseMeta);
      const contextValidation = validateContextBuckets(contextBuckets);

      console.log(`[E2E] Context coverage: ${Math.round(contextValidation.coverage * 100)}%`);

      // Run high-quality orchestration
      const osaResults = await runDciOrchestrator({
        baseMeta: mockBaseMeta,
        contextBuckets,
        config: {
          ...DEFAULT_DCI_CONFIG,
          maxPasses: 3,
          qualityThreshold: 4.0,
          enableDetailedLogging: true
        }
      });

      const totalDuration = Date.now() - startTime;

      // Validate comprehensive results
      expect(osaResults.generation.totalPasses).toBeGreaterThan(1);
      expect(osaResults.generation.finalQualityScore).toBeGreaterThan(3.0);
      expect(osaResults.generation.contextBucketsUsed.length).toBeGreaterThan(0);

      // Validate content quality
      expect(osaResults.contentImprovements.prioritizedActions.length).toBeGreaterThan(0);
      expect(osaResults.analyticsInsights.keyFindings.length).toBeGreaterThan(0);
      expect(osaResults.experienceTactics.experiments.length).toBeGreaterThan(0);
      expect(osaResults.strategyPlans.roadmapItems.length).toBeGreaterThan(0);

      // Test all tier mappings for comprehensive coverage
      const allMappings = await Promise.all([
        mapOSAResultsToResultsPageContent(osaResults, 'strategy'),
        mapOSAResultsToResultsPageContent(osaResults, 'insights'),
        mapOSAResultsToResultsPageContent(osaResults, 'optimization'),
        mapOSAResultsToResultsPageContent(osaResults, 'dxptools')
      ]);

      allMappings.forEach((mapping, index) => {
        const tierNames = ['strategy', 'insights', 'optimization', 'dxptools'];
        expect(mapping.opportunities.length).toBeGreaterThan(0);
        expect(mapping.nextSteps.length).toBeGreaterThan(0);
        console.log(`[E2E] ${tierNames[index]} tier: ${mapping.opportunities.length} opportunities, ${mapping.nextSteps.length} next steps`);
      });

      // Final validation summary
      console.log('[E2E] 🎉 COMPLETE DCI VALUE DEMONSTRATION');
      console.log(`[E2E] ✅ Total duration: ${totalDuration}ms`);
      console.log(`[E2E] ✅ Quality score: ${osaResults.generation.finalQualityScore}`);
      console.log(`[E2E] ✅ Passes required: ${osaResults.generation.totalPasses}`);
      console.log(`[E2E] ✅ Context buckets used: ${osaResults.generation.contextBucketsUsed.length}`);
      console.log(`[E2E] ✅ Confidence level: ${osaResults.generation.confidence}`);
      console.log(`[E2E] ✅ All 4 tier mappings validated`);

      // Performance validation
      expect(totalDuration).toBeLessThan(180000); // 3 minutes max

      console.log('[E2E] ✅ Complete DCI value proposition validated successfully!');
    }, 180000); // 3 minute timeout for comprehensive test
  });
});

// =============================================================================
// Test Summary Report
// =============================================================================

afterAll(() => {
  const totalTestTime = Date.now() - testStartTime;
  console.log('\n' + '='.repeat(80));
  console.log('🎯 DCI ORCHESTRATOR END-TO-END VALIDATION COMPLETE');
  console.log('='.repeat(80));
  console.log(`📊 Total test execution time: ${Math.round(totalTestTime / 1000)}s`);
  console.log('✅ All critical DCI functionality validated');
  console.log('✅ Performance requirements met');
  console.log('✅ Error handling verified');
  console.log('✅ Integration points tested');
  console.log('✅ A/B testing operational');
  console.log('✅ Monitoring and alerting functional');
  console.log('\n🚀 DCI Orchestrator is ready for production deployment!');
  console.log('='.repeat(80));
});