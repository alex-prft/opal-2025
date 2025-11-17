/**
 * Mock OPAL Integration Validator for Testing
 * This version works without database dependencies for immediate testing
 */

import { OpalIntegrationValidator, IntegrationHealthMetrics, ValidationTriggerInput, ValidationResult } from './integration-validator';

// Mock data for realistic testing
const MOCK_HEALTHY_METRICS: IntegrationHealthMetrics = {
  forceSync: {
    lastAt: new Date().toISOString(),
    status: 'completed',
    agentCount: 9
  },
  opal: {
    workflowStatus: 'completed',
    agentResponseCount: 9,
    agentStatuses: {
      'integration_health': 'success',
      'content_review': 'success',
      'geo_audit': 'success',
      'content_recs': 'success',
      'tech_audit': 'success',
      'personalization_audit': 'success',
      'experimentation_audit': 'success',
      'analytics_integration': 'success',
      'results_optimizer': 'success'
    }
  },
  osa: {
    receptionRate: 0.89, // 89% reception rate
    lastWebhookAt: new Date().toISOString(),
    workflowData: {
      agentDataReception: {
        'integration_health': true,
        'content_review': true,
        'geo_audit': true,
        'content_recs': true,
        'tech_audit': true,
        'personalization_audit': true,
        'experimentation_audit': true,
        'analytics_integration': true,
        'results_optimizer': true
      },
      dataReceptionRate: 0.89
    }
  },
  health: {
    overallStatus: 'green',
    signatureValidRate: 0.95, // 95% signature validation
    errorRate24h: 0.02 // 2% error rate
  }
};

const MOCK_ISSUES_METRICS: IntegrationHealthMetrics = {
  forceSync: {
    lastAt: new Date().toISOString(),
    status: 'completed',
    agentCount: 9
  },
  opal: {
    workflowStatus: 'completed',
    agentResponseCount: 7, // 2 agents failed
    agentStatuses: {
      'integration_health': 'success',
      'content_review': 'failed',
      'geo_audit': 'success',
      'content_recs': 'success',
      'tech_audit': 'failed',
      'personalization_audit': 'success',
      'experimentation_audit': 'success',
      'analytics_integration': 'success',
      'results_optimizer': 'success'
    }
  },
  osa: {
    receptionRate: 0.45, // Low reception rate
    lastWebhookAt: new Date().toISOString(),
    workflowData: {
      agentDataReception: {
        'integration_health': true,
        'content_review': false, // Missing
        'geo_audit': true,
        'content_recs': true,
        'tech_audit': false, // Missing
        'personalization_audit': true,
        'experimentation_audit': true,
        'analytics_integration': false, // Missing
        'results_optimizer': true
      },
      dataReceptionRate: 0.45
    }
  },
  health: {
    overallStatus: 'red',
    signatureValidRate: 0.78, // Lower signature validation
    errorRate24h: 0.15 // Higher error rate
  }
};

export class MockOpalIntegrationValidator extends OpalIntegrationValidator {
  private mockMode: 'healthy' | 'issues' | 'random' = 'random';

  constructor(mockMode: 'healthy' | 'issues' | 'random' = 'random') {
    super();
    this.mockMode = mockMode;
  }

  protected async collectHealthMetrics(forceSyncWorkflowId: string): Promise<IntegrationHealthMetrics> {
    console.log(`🧪 [Mock Validator] Collecting mock health metrics for workflow: ${forceSyncWorkflowId}`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Determine which mock data to return
    let mockData: IntegrationHealthMetrics;
    
    if (this.mockMode === 'healthy') {
      mockData = MOCK_HEALTHY_METRICS;
    } else if (this.mockMode === 'issues') {
      mockData = MOCK_ISSUES_METRICS;
    } else {
      // Random mode - simulate real-world variability
      const isHealthy = Math.random() > 0.3; // 70% chance of healthy
      mockData = isHealthy ? MOCK_HEALTHY_METRICS : MOCK_ISSUES_METRICS;
      
      if (isHealthy) {
        // Add some variation to healthy metrics
        mockData = {
          ...MOCK_HEALTHY_METRICS,
          osa: {
            ...MOCK_HEALTHY_METRICS.osa,
            receptionRate: 0.80 + Math.random() * 0.15 // 80-95%
          },
          health: {
            ...MOCK_HEALTHY_METRICS.health,
            signatureValidRate: 0.90 + Math.random() * 0.10, // 90-100%
            errorRate24h: Math.random() * 0.05 // 0-5%
          }
        };
      }
    }
    
    console.log(`🎯 [Mock Validator] Generated mock data - Status would be: ${this.predictStatus(mockData)}`);
    return mockData;
  }

  protected async storeValidationResult(input: ValidationTriggerInput, validationResult: any, healthMetrics: IntegrationHealthMetrics): Promise<void> {
    console.log('💾 [Mock Validator] Mock storing validation result:');
    console.log('  Input:', {
      workflowId: input.forceSyncWorkflowId,
      correlationId: input.opalCorrelationId,
      tenantId: input.tenantId
    });
    console.log('  Validation Result:', {
      overallStatus: validationResult.overallStatus,
      summary: validationResult.summary
    });
    console.log('  Health Metrics Summary:', {
      forceSyncStatus: healthMetrics.forceSync.status,
      opalAgentCount: healthMetrics.opal.agentResponseCount,
      osaReceptionRate: `${(healthMetrics.osa.receptionRate * 100).toFixed(0)}%`,
      healthStatus: healthMetrics.health.overallStatus
    });
    
    // Simulate database operation delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('✅ [Mock Validator] Validation result stored (mock)');
  }

  private predictStatus(metrics: IntegrationHealthMetrics): 'green' | 'yellow' | 'red' {
    const failedAgents = Object.entries(metrics.opal.agentStatuses || {})
      .filter(([agent, status]) => status === 'failed').length;
    
    const hasRedIssues = 
      metrics.forceSync.status === 'failed' ||
      failedAgents > 2 ||
      metrics.osa.receptionRate < 0.3 ||
      metrics.health.errorRate24h > 0.2;

    const hasYellowIssues = 
      failedAgents > 0 ||
      metrics.osa.receptionRate < 0.8 ||
      metrics.health.signatureValidRate < 0.9;

    return hasRedIssues ? 'red' : hasYellowIssues ? 'yellow' : 'green';
  }
}

/**
 * Test scenarios for different validation states
 */
export const VALIDATION_TEST_SCENARIOS = {
  healthy: {
    name: 'Healthy Integration Pipeline',
    description: 'All layers operational, high reception rate, minimal errors',
    expectedStatus: 'green',
    validator: () => new MockOpalIntegrationValidator('healthy')
  },
  
  issues: {
    name: 'Integration Pipeline with Issues',
    description: 'Some agent failures, low reception rate, elevated error rate',
    expectedStatus: 'red',
    validator: () => new MockOpalIntegrationValidator('issues')
  },
  
  random: {
    name: 'Random Real-World Simulation',
    description: 'Simulates realistic variability in pipeline performance',
    expectedStatus: 'varies',
    validator: () => new MockOpalIntegrationValidator('random')
  }
};

/**
 * Comprehensive test suite for the mock validator
 */
export async function runMockValidatorTests(): Promise<{
  success: boolean;
  results: Array<{
    scenario: string;
    status: string;
    success: boolean;
    summary: string;
    duration: number;
  }>;
  summary: {
    total: number;
    passed: number;
    failed: number;
    successRate: number;
  };
}> {
  console.log('🚀 [Mock Validator Tests] Starting comprehensive validation test suite\n');
  
  const results = [];
  const startTime = Date.now();

  for (const [scenarioKey, scenario] of Object.entries(VALIDATION_TEST_SCENARIOS)) {
    const testStart = Date.now();
    
    try {
      console.log(`=== Testing: ${scenario.name} ===`);
      
      const validator = scenario.validator();
      const testWorkflowId = `ws_test_${scenarioKey}_${Date.now()}`;
      
      const validationResult = await validator.validateWorkflow({
        forceSyncWorkflowId: testWorkflowId,
        opalCorrelationId: `opal_${scenarioKey}_${Date.now()}`,
        tenantId: 'test-tenant'
      });

      const duration = Date.now() - testStart;
      
      const result = {
        scenario: scenario.name,
        status: validationResult.overallStatus || 'unknown',
        success: validationResult.success || false,
        summary: validationResult.summary || 'No summary available',
        duration
      };

      results.push(result);
      
      console.log(`✅ Result: ${result.status.toUpperCase()} - ${result.summary}`);
      console.log(`⏱️  Duration: ${duration}ms\n`);
      
    } catch (error: any) {
      const duration = Date.now() - testStart;
      
      const result = {
        scenario: scenario.name,
        status: 'error',
        success: false,
        summary: `Test failed: ${error.message}`,
        duration
      };

      results.push(result);
      
      console.error(`❌ ${scenario.name} failed:`, error.message);
      console.error(`⏱️  Duration: ${duration}ms\n`);
    }
  }

  const totalDuration = Date.now() - startTime;
  const passed = results.filter(r => r.success).length;
  const failed = results.length - passed;
  const successRate = (passed / results.length) * 100;

  const summary = {
    total: results.length,
    passed,
    failed,
    successRate
  };

  console.log('📊 [Mock Validator Tests] Test Suite Summary:');
  console.log(`   Total Tests: ${summary.total}`);
  console.log(`   Passed: ${passed} ✅`);
  console.log(`   Failed: ${failed} ${failed > 0 ? '❌' : '✅'}`);
  console.log(`   Success Rate: ${successRate.toFixed(1)}%`);
  console.log(`   Total Duration: ${totalDuration}ms`);

  return {
    success: failed === 0,
    results,
    summary
  };
}

// Export mock data for other tests
export { MOCK_HEALTHY_METRICS, MOCK_ISSUES_METRICS };