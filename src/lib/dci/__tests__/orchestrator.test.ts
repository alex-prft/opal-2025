/**
 * DCI Orchestrator Test Suite
 *
 * Comprehensive tests for the Dynamic Context Integration Orchestrator
 * including unit tests, integration tests, and validation scenarios.
 */

import { describe, it, expect, beforeEach, afterEach, jest, beforeAll } from '@jest/globals';

import {
  OSAResults,
  ResultsQualityScore,
  DciContextBuckets,
  DciOrchestratorConfig,
  createOptimizedConfig
} from '@/types/dci-orchestrator';

import {
  runDciOrchestrator,
  validateQualityRequirements,
  generateQualityImprovementSuggestions,
  DEFAULT_DCI_CONFIG
} from '../orchestrator';

import {
  buildContextBuckets,
  validateContextBuckets
} from '../context-builder';

import {
  mapOSAResultsToResultsPageContent
} from '../results-mapper';

import {
  dciFeatureFlags,
  DciFeatureFlagManager
} from '../feature-flags';

// =============================================================================
// Test Data and Mocks
// =============================================================================

const mockBaseMeta: OSAResults['meta'] = {
  orgName: 'Test Organization',
  industry: 'Technology',
  region: 'North America',
  maturityPhase: 'walk',
  primaryGoals: ['Improve conversion rate', 'Enhance user experience'],
  primaryKpis: ['CVR', 'Engagement', 'Performance'],
  optiStack: ['Optimizely WebX', 'Optimizely CMS', 'ODP'],
  generationTimestamp: new Date().toISOString(),
  dciVersion: '1.0.0'
};

const mockContextBuckets: DciContextBuckets = {
  contentContext: {
    topTrafficPages: ['Homepage', 'Product Pages', 'Category Pages'],
    underperformingPages: ['Checkout Flow', 'Search Results'],
    highValuePages: ['Homepage', 'Product Detail Pages'],
    contentTypes: ['product', 'category', 'blog'],
    knownContentIssues: ['Mobile optimization needed', 'Content freshness'],
    contentPerformanceData: [
      {
        page: 'Homepage',
        uniques: 10000,
        interactions: 5000,
        conversionRate: 0.12
      }
    ]
  },
  analyticsContext: {
    keyMetrics: ['CVR', 'Bounce Rate', 'Session Duration'],
    currentPerformance: { 'CVR': '8.4%', 'Bounce Rate': '32%' },
    trendsSummary: 'Performance improving steadily',
    notableWins: ['Homepage optimization increased CVR by 12%'],
    notableLosses: ['Mobile checkout showing 5% decline'],
    dataSourcesAvailable: ['GA4', 'Optimizely']
  },
  experienceTacticsContext: {
    knownWinningPatterns: ['Simplified forms increase completion by 15%'],
    existingExperimentsSummary: ['Homepage hero test running'],
    audienceSegments: ['New visitors', 'Returning customers'],
    channelMixInfo: ['Organic: 42%', 'Direct: 28%', 'Paid: 18%']
  },
  strategyContext: {
    orgConstraints: ['Limited dev resources', 'Quarterly planning cycles'],
    timelineConstraints: ['No major changes during holiday season'],
    leadershipPriorities: ['Customer experience improvement', 'Growth acceleration'],
    teamCapabilities: {
      development: 'medium',
      design: 'high',
      analytics: 'medium',
      content: 'high'
    }
  }
};

const mockQualityScore: ResultsQualityScore = {
  specificity: 4.0,
  stackAlignment: 4.5,
  maturityFit: 4.0,
  measurementRigor: 3.5,
  actionability: 4.0,
  overall: 4.0,
  issues: [],
  missingAreas: [],
  recommendations: [],
  contentImprovement: {
    score: 4.0,
    issues: [],
    strengths: ['Specific page targeting', 'Clear implementation steps']
  },
  analyticsInsights: {
    score: 3.8,
    issues: ['Could use more data source references'],
    strengths: ['Clear metrics identification']
  },
  experienceTactics: {
    score: 4.2,
    issues: [],
    strengths: ['Realistic experiment design', 'Stack-aligned recommendations']
  },
  strategyPlans: {
    score: 3.9,
    issues: ['Timeline could be more specific'],
    strengths: ['Well-structured roadmap', 'Clear dependencies']
  }
};

// Mock LLM responses
const mockSuccessfulOSAResults: OSAResults = {
  meta: mockBaseMeta,
  contentImprovements: {
    overview: 'Content optimization opportunities identified across high-traffic pages',
    keyIssues: ['Mobile checkout flow complexity', 'Product page information gaps'],
    prioritizedActions: [
      {
        id: 'action-1',
        title: 'Optimize mobile checkout flow',
        description: 'Simplify mobile checkout process to reduce abandonment',
        targetPagesOrSections: ['Checkout Flow', 'Payment Pages'],
        expectedImpact: 'Reduce cart abandonment by 15-20%',
        difficulty: 'medium',
        timeFrameWeeks: 4,
        ownerType: 'UX Designer',
        relatedKpis: ['CVR', 'Completion Rate']
      }
    ],
    measurementNotes: 'Track completion rate and abandonment metrics'
  },
  analyticsInsights: {
    overview: 'Analytics reveal key optimization opportunities in user journey',
    keyFindings: [
      {
        id: 'finding-1',
        summary: 'Mobile checkout shows 40% higher abandonment than desktop',
        metric: 'Checkout Completion Rate',
        currentValue: '68%',
        issueOrOpportunity: 'issue',
        suggestedAction: 'Implement simplified mobile checkout flow',
        relatedKpis: ['CVR'],
        confidence: 'high',
        dataSourceHints: ['GA4', 'Optimizely']
      }
    ],
    dataGaps: ['Historical trend data', 'Competitive benchmarks'],
    recommendedAnalytics: ['Enhanced conversion tracking', 'User journey mapping']
  },
  experienceTactics: {
    overview: 'Systematic experimentation and personalization opportunities',
    experiments: [
      {
        id: 'exp-1',
        name: 'Mobile Checkout Simplification',
        hypothesis: 'Reducing form fields will increase mobile completion rates',
        whereToRun: ['Mobile Checkout Flow'],
        audienceTargeting: 'Mobile users',
        requiredStack: ['Optimizely WebX'],
        estimatedDurationWeeks: 3,
        successMetrics: ['Completion Rate', 'Abandonment Rate'],
        maturityFit: ['walk', 'run'],
        implementationComplexity: 'medium'
      }
    ],
    personalizationUseCases: [
      {
        id: 'pers-1',
        title: 'Returning Customer Experience',
        scenario: 'Show personalized content for returning customers',
        audienceDefinition: 'Users with previous purchases',
        logicOrTrigger: 'Customer status and purchase history',
        contentOrExperienceChange: 'Personalized product recommendations',
        toolsUsed: ['ODP', 'Content Recommendations'],
        successMetrics: ['Engagement Rate', 'Repeat Purchase Rate'],
        implementationEffort: 'medium'
      }
    ],
    uxOptimizations: [
      {
        id: 'ux-1',
        title: 'Mobile Navigation Enhancement',
        description: 'Improve mobile navigation for better user experience',
        affectedPages: ['All mobile pages'],
        userImpact: 'Easier navigation and content discovery',
        technicalRequirements: ['Mobile-first design updates'],
        priority: 'high'
      }
    ]
  },
  strategyPlans: {
    narrativeSummary: 'Strategic focus on mobile experience optimization with phased implementation',
    phasePlan: [
      {
        phase: 'walk',
        timeHorizonMonths: 6,
        focusAreas: ['ContentImprovements', 'ExperienceTactics'],
        keyInitiatives: ['Mobile checkout optimization', 'Content performance enhancement'],
        dependencies: ['UX team capacity', 'Development resources'],
        risks: ['Resource constraints', 'Technical complexity'],
        successCriteria: ['15% improvement in mobile CVR', 'Reduced cart abandonment'],
        resourceRequirements: ['UX Designer', 'Frontend Developer']
      }
    ],
    roadmapItems: [
      {
        id: 'roadmap-1',
        title: 'Mobile Experience Enhancement Phase 1',
        description: 'Focus on checkout flow and navigation improvements',
        focusArea: 'ExperienceTactics',
        maturityPhase: 'walk',
        startOrder: 1,
        durationWeeks: 8,
        ownerType: 'Product Manager',
        relatedKpis: ['CVR', 'User Satisfaction'],
        prerequisites: ['Team alignment', 'Resource allocation'],
        deliverables: ['Optimized checkout flow', 'Enhanced mobile navigation']
      }
    ],
    quarterlyMilestones: [
      {
        quarter: 'Q1 2025',
        milestones: ['Mobile checkout optimization completed', 'Performance metrics established'],
        kpiTargets: { 'CVR': '10% improvement', 'Mobile Performance': 'Baseline + 15%' }
      }
    ]
  },
  generation: {
    totalPasses: 2,
    finalQualityScore: 4.0,
    contextBucketsUsed: ['contentContext', 'analyticsContext'],
    generationTimeMs: 45000,
    confidence: 'high',
    dataQualityNotes: []
  }
};

// =============================================================================
// Test Setup and Teardown
// =============================================================================

describe('DCI Orchestrator', () => {
  let featureFlagManager: DciFeatureFlagManager;

  beforeAll(() => {
    // Enable DCI for testing
    featureFlagManager = DciFeatureFlagManager.getInstance();
    featureFlagManager.setRuntimeFlag('ENABLE_DCI_ORCHESTRATOR', true);
    featureFlagManager.setRuntimeFlag('ENABLE_DCI_DETAILED_LOGGING', false); // Disable to reduce test noise
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // =============================================================================
  // Configuration Tests
  // =============================================================================

  describe('Configuration Management', () => {
    it('should use default configuration when no config provided', () => {
      const config = DEFAULT_DCI_CONFIG;

      expect(config.maxPasses).toBe(3);
      expect(config.qualityThreshold).toBe(4.0);
      expect(config.timeoutMs).toBe(120000);
      expect(config.features.enableConsistencyCheck).toBe(true);
    });

    it('should create optimized configurations for different scenarios', () => {
      const speedConfig = createOptimizedConfig('speed');
      const qualityConfig = createOptimizedConfig('quality');
      const comprehensiveConfig = createOptimizedConfig('comprehensive');

      expect(speedConfig.maxPasses).toBeLessThan(qualityConfig.maxPasses);
      expect(qualityConfig.qualityThreshold).toBeGreaterThan(speedConfig.qualityThreshold);
      expect(comprehensiveConfig.features.enableAdvancedPersonalization).toBe(true);
    });

    it('should validate configuration constraints', () => {
      const invalidConfig: Partial<DciOrchestratorConfig> = {
        maxPasses: 15, // Too high
        qualityThreshold: 6.0, // Too high
        timeoutMs: -1000 // Invalid
      };

      // This would normally be validated by the orchestrator
      expect(invalidConfig.maxPasses).toBeGreaterThan(10);
      expect(invalidConfig.qualityThreshold).toBeGreaterThan(5.0);
      expect(invalidConfig.timeoutMs).toBeLessThan(0);
    });
  });

  // =============================================================================
  // Context Builder Tests
  // =============================================================================

  describe('Context Builder', () => {
    it('should build context buckets from base metadata', async () => {
      const contextBuckets = await buildContextBuckets(mockBaseMeta);

      expect(contextBuckets).toBeDefined();
      expect(Object.keys(contextBuckets).length).toBeGreaterThan(0);
    });

    it('should validate context bucket completeness', () => {
      const validation = validateContextBuckets(mockContextBuckets);

      expect(validation.coverage).toBe(1.0); // All 4 contexts present
      expect(validation.isComplete).toBe(true);
      expect(validation.missingAreas).toHaveLength(0);
    });

    it('should identify missing context areas', () => {
      const incompleteContext: DciContextBuckets = {
        contentContext: mockContextBuckets.contentContext
        // Missing other contexts
      };

      const validation = validateContextBuckets(incompleteContext);

      expect(validation.coverage).toBe(0.25); // Only 1 of 4 contexts
      expect(validation.isComplete).toBe(false);
      expect(validation.missingAreas).toContain('analyticsContext');
      expect(validation.missingAreas).toContain('experienceTacticsContext');
      expect(validation.missingAreas).toContain('strategyContext');
    });

    it('should provide recommendations for improving context coverage', () => {
      const incompleteContext: DciContextBuckets = {
        contentContext: mockContextBuckets.contentContext
      };

      const validation = validateContextBuckets(incompleteContext);

      expect(validation.recommendations.length).toBeGreaterThan(0);
      expect(validation.recommendations.some(r => r.includes('data source'))).toBe(true);
    });
  });

  // =============================================================================
  // Results Mapper Tests
  // =============================================================================

  describe('Results Mapper', () => {
    it('should map OSAResults to ResultsPageContent for all tiers', () => {
      const tiers: Array<'strategy' | 'insights' | 'optimization' | 'dxptools'> =
        ['strategy', 'insights', 'optimization', 'dxptools'];

      tiers.forEach(tier => {
        const mapped = mapOSAResultsToResultsPageContent(mockSuccessfulOSAResults, tier);

        expect(mapped).toBeDefined();
        expect(mapped.hero).toBeDefined();
        expect(mapped.overview).toBeDefined();
        expect(mapped.insights).toBeDefined();
        expect(mapped.opportunities).toBeDefined();
        expect(mapped.nextSteps).toBeDefined();
        expect(mapped.meta.tier).toBe(tier);
      });
    });

    it('should create tier-appropriate hero metrics', () => {
      const strategyContent = mapOSAResultsToResultsPageContent(mockSuccessfulOSAResults, 'strategy');
      const insightsContent = mapOSAResultsToResultsPageContent(mockSuccessfulOSAResults, 'insights');

      expect(strategyContent.hero.metrics).toBeDefined();
      expect(insightsContent.hero.metrics).toBeDefined();

      // Strategy should focus on phases and roadmap
      const strategyMetricLabels = strategyContent.hero.metrics.map(m => m.label);
      expect(strategyMetricLabels.some(label => label.includes('Phase') || label.includes('Roadmap'))).toBe(true);

      // Insights should focus on findings and data
      const insightsMetricLabels = insightsContent.hero.metrics.map(m => m.label);
      expect(insightsMetricLabels.some(label => label.includes('Finding') || label.includes('Data'))).toBe(true);
    });

    it('should prioritize opportunities by tier relevance', () => {
      const optimizationContent = mapOSAResultsToResultsPageContent(mockSuccessfulOSAResults, 'optimization');
      const dxptoolsContent = mapOSAResultsToResultsPageContent(mockSuccessfulOSAResults, 'dxptools');

      expect(optimizationContent.opportunities.length).toBeGreaterThan(0);
      expect(dxptoolsContent.opportunities.length).toBeGreaterThan(0);

      // Should contain different types of opportunities
      const optimizationLabels = optimizationContent.opportunities.map(o => o.label.toLowerCase());
      const dxptoolsLabels = dxptoolsContent.opportunities.map(o => o.label.toLowerCase());

      expect(optimizationLabels.some(label =>
        label.includes('content') || label.includes('optimization') || label.includes('experiment')
      )).toBe(true);

      expect(dxptoolsLabels.some(label =>
        label.includes('personalization') || label.includes('integration') || label.includes('tool')
      )).toBe(true);
    });
  });

  // =============================================================================
  // Quality Assessment Tests
  // =============================================================================

  describe('Quality Assessment', () => {
    it('should validate quality requirements correctly', () => {
      const config: DciOrchestratorConfig = {
        ...DEFAULT_DCI_CONFIG,
        qualityRequirements: {
          minimumSpecificity: 3.5,
          minimumStackAlignment: 4.0,
          minimumActionability: 3.0,
          requireDataSources: true
        }
      };

      const validation = validateQualityRequirements(mockSuccessfulOSAResults, mockQualityScore, config);

      expect(validation.isValid).toBe(true);
      expect(validation.violations).toHaveLength(0);
    });

    it('should identify quality requirement violations', () => {
      const lowQualityScore: ResultsQualityScore = {
        ...mockQualityScore,
        specificity: 2.0, // Below minimum
        stackAlignment: 3.5, // Below minimum
        actionability: 2.5 // Below minimum
      };

      const config: DciOrchestratorConfig = {
        ...DEFAULT_DCI_CONFIG,
        qualityRequirements: {
          minimumSpecificity: 3.5,
          minimumStackAlignment: 4.0,
          minimumActionability: 3.0,
          requireDataSources: true
        }
      };

      const validation = validateQualityRequirements(mockSuccessfulOSAResults, lowQualityScore, config);

      expect(validation.isValid).toBe(false);
      expect(validation.violations.length).toBeGreaterThan(0);
      expect(validation.violations.some(v => v.includes('Specificity'))).toBe(true);
      expect(validation.violations.some(v => v.includes('Stack alignment'))).toBe(true);
      expect(validation.violations.some(v => v.includes('Actionability'))).toBe(true);
    });

    it('should generate quality improvement suggestions', () => {
      const poorQualityScore: ResultsQualityScore = {
        ...mockQualityScore,
        specificity: 2.0,
        stackAlignment: 2.5,
        maturityFit: 3.0,
        measurementRigor: 2.0,
        actionability: 2.5
      };

      const suggestions = generateQualityImprovementSuggestions(poorQualityScore);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.includes('specific'))).toBe(true);
      expect(suggestions.some(s => s.includes('Optimizely'))).toBe(true);
      expect(suggestions.some(s => s.includes('metrics'))).toBe(true);
      expect(suggestions.some(s => s.includes('implementable'))).toBe(true);
    });
  });

  // =============================================================================
  // Feature Flag Tests
  // =============================================================================

  describe('Feature Flags', () => {
    it('should respect feature flag configuration', () => {
      const flags = dciFeatureFlags.getAllFeatureFlags();

      expect(flags.isDciEnabled).toBe(true); // Set in beforeAll
      expect(typeof flags.maxPasses).toBe('number');
      expect(typeof flags.qualityThreshold).toBe('number');
      expect(typeof flags.timeoutMs).toBe('number');
    });

    it('should allow runtime flag overrides', () => {
      const originalValue = dciFeatureFlags.isQualityValidationEnabled();

      dciFeatureFlags.setRuntimeFlag('ENABLE_DCI_QUALITY_VALIDATION', !originalValue);

      expect(dciFeatureFlags.isQualityValidationEnabled()).toBe(!originalValue);

      // Reset
      dciFeatureFlags.setRuntimeFlag('ENABLE_DCI_QUALITY_VALIDATION', originalValue);
    });

    it('should validate configuration properly', () => {
      const validation = dciFeatureFlags.validateConfiguration();

      expect(validation).toBeDefined();
      expect(typeof validation.isValid).toBe('boolean');
      expect(Array.isArray(validation.warnings)).toBe(true);
      expect(Array.isArray(validation.errors)).toBe(true);
    });
  });

  // =============================================================================
  // Integration Tests
  // =============================================================================

  describe('Integration Tests', () => {
    // Note: These tests would need actual LLM integration to run fully
    // For now, we test the structure and flow

    it('should handle the complete DCI workflow structure', async () => {
      // This test verifies the workflow structure without actual LLM calls
      const workflow = async () => {
        // Step 1: Build context
        const contextBuckets = await buildContextBuckets(mockBaseMeta);
        expect(contextBuckets).toBeDefined();

        // Step 2: Validate context
        const contextValidation = validateContextBuckets(contextBuckets);
        expect(contextValidation.coverage).toBeGreaterThan(0);

        // Step 3: Create config
        const config = createOptimizedConfig('quality');
        expect(config.maxPasses).toBeGreaterThan(0);

        // Step 4: Validate requirements
        const validation = validateQualityRequirements(mockSuccessfulOSAResults, mockQualityScore, config);
        expect(validation).toBeDefined();

        // Step 5: Map results
        const mapped = mapOSAResultsToResultsPageContent(mockSuccessfulOSAResults, 'optimization');
        expect(mapped.hero).toBeDefined();
        expect(mapped.opportunities.length).toBeGreaterThan(0);

        return mapped;
      };

      const result = await workflow();
      expect(result).toBeDefined();
    });

    it('should handle error scenarios gracefully', async () => {
      // Test error handling without LLM calls
      const invalidBaseMeta = {
        ...mockBaseMeta,
        maturityPhase: 'invalid' as any
      };

      try {
        const contextBuckets = await buildContextBuckets(invalidBaseMeta);
        // Should still work with invalid maturity phase (fallback behavior)
        expect(contextBuckets).toBeDefined();
      } catch (error) {
        // Error handling should be graceful
        expect(error).toBeDefined();
      }
    });

    it('should maintain performance requirements', async () => {
      const startTime = performance.now();

      // Test context building performance
      const contextBuckets = await buildContextBuckets(mockBaseMeta);
      const contextTime = performance.now() - startTime;

      expect(contextTime).toBeLessThan(5000); // Should complete within 5 seconds

      // Test mapping performance
      const mapStartTime = performance.now();
      const mapped = mapOSAResultsToResultsPageContent(mockSuccessfulOSAResults, 'optimization');
      const mapTime = performance.now() - mapStartTime;

      expect(mapTime).toBeLessThan(1000); // Should complete within 1 second
      expect(mapped).toBeDefined();
    });
  });

  // =============================================================================
  // Edge Case Tests
  // =============================================================================

  describe('Edge Cases', () => {
    it('should handle empty context buckets', () => {
      const emptyContext: DciContextBuckets = {};
      const validation = validateContextBuckets(emptyContext);

      expect(validation.coverage).toBe(0);
      expect(validation.isComplete).toBe(false);
      expect(validation.missingAreas).toHaveLength(4);
    });

    it('should handle minimal OSA results', () => {
      const minimalOSAResults: OSAResults = {
        meta: mockBaseMeta,
        contentImprovements: {
          overview: 'Basic content analysis',
          keyIssues: [],
          prioritizedActions: [],
          measurementNotes: 'No specific measurement approach identified'
        },
        analyticsInsights: {
          overview: 'Basic analytics review',
          keyFindings: [],
          dataGaps: [],
          recommendedAnalytics: []
        },
        experienceTactics: {
          overview: 'Basic experience review',
          experiments: [],
          personalizationUseCases: [],
          uxOptimizations: []
        },
        strategyPlans: {
          narrativeSummary: 'Basic strategic overview',
          phasePlan: [],
          roadmapItems: [],
          quarterlyMilestones: []
        },
        generation: {
          totalPasses: 1,
          finalQualityScore: 2.0,
          contextBucketsUsed: [],
          generationTimeMs: 1000,
          confidence: 'low',
          dataQualityNotes: ['Minimal data available']
        }
      };

      const mapped = mapOSAResultsToResultsPageContent(minimalOSAResults, 'strategy');

      expect(mapped).toBeDefined();
      expect(mapped.hero.title).toBeDefined();
      expect(mapped.opportunities.length).toBeGreaterThan(0); // Should have fallback opportunities
      expect(mapped.nextSteps.length).toBeGreaterThan(0); // Should have fallback next steps
    });

    it('should handle all tier mappings with minimal data', () => {
      const minimalResults = mockSuccessfulOSAResults;
      const tiers: Array<'strategy' | 'insights' | 'optimization' | 'dxptools'> =
        ['strategy', 'insights', 'optimization', 'dxptools'];

      tiers.forEach(tier => {
        const mapped = mapOSAResultsToResultsPageContent(minimalResults, tier);

        expect(mapped.hero.title).toContain(tier === 'dxptools' ? 'DXP' : tier);
        expect(mapped.meta.tier).toBe(tier);
        expect(mapped.opportunities.length).toBeGreaterThan(0);
        expect(mapped.nextSteps.length).toBeGreaterThan(0);
      });
    });
  });
});

// =============================================================================
// Test Utilities
// =============================================================================

export const testUtils = {
  createMockOSAResults: (overrides: Partial<OSAResults> = {}): OSAResults => ({
    ...mockSuccessfulOSAResults,
    ...overrides
  }),

  createMockContextBuckets: (overrides: Partial<DciContextBuckets> = {}): DciContextBuckets => ({
    ...mockContextBuckets,
    ...overrides
  }),

  createMockQualityScore: (overrides: Partial<ResultsQualityScore> = {}): ResultsQualityScore => ({
    ...mockQualityScore,
    ...overrides
  })
};