/**
 * Test script for OPAL Integration Validator
 * 
 * This simulates the validation process without requiring database setup
 */

import { OpalIntegrationValidator } from '../opal/integration-validator';

// Mock data for testing
const mockHealthMetrics = {
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

const mockHealthMetricsWithIssues = {
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

class MockOpalIntegrationValidator extends OpalIntegrationValidator {
  private mockData: any;

  constructor(mockData: any) {
    super();
    this.mockData = mockData;
  }

  protected async collectHealthMetrics(forceSyncWorkflowId: string) {
    console.log(`🔍 Collecting health metrics for workflow: ${forceSyncWorkflowId}`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return this.mockData;
  }

  protected async storeValidationResult(input: any, validationResult: any, healthMetrics: any) {
    console.log('💾 Storing validation result:');
    console.log('  Input:', JSON.stringify(input, null, 2));
    console.log('  Validation Result:', JSON.stringify(validationResult, null, 2));
    console.log('  Health Metrics Summary:', {
      forceSyncStatus: healthMetrics.forceSync.status,
      opalAgentCount: healthMetrics.opal.agentResponseCount,
      osaReceptionRate: `${(healthMetrics.osa.receptionRate * 100).toFixed(0)}%`,
      healthStatus: healthMetrics.health.overallStatus
    });
  }
}

export async function testIntegrationValidator() {
  console.log('🚀 Starting OPAL Integration Validator Tests\n');

  // Test 1: Healthy scenario
  console.log('=== TEST 1: Healthy Integration Pipeline ===');
  const healthyValidator = new MockOpalIntegrationValidator(mockHealthMetrics);
  
  const healthyResult = await healthyValidator.validateWorkflow({
    forceSyncWorkflowId: 'ws_healthy_test_12345',
    opalCorrelationId: 'opal_correlation_healthy',
    tenantId: 'tenant_test'
  });
  
  console.log('✅ Healthy Result:', JSON.stringify(healthyResult, null, 2));
  console.log('');

  // Test 2: Issues scenario
  console.log('=== TEST 2: Integration Pipeline with Issues ===');
  const issuesValidator = new MockOpalIntegrationValidator(mockHealthMetricsWithIssues);
  
  const issuesResult = await issuesValidator.validateWorkflow({
    forceSyncWorkflowId: 'ws_issues_test_12345',
    opalCorrelationId: 'opal_correlation_issues',
    tenantId: 'tenant_test'
  });
  
  console.log('⚠️ Issues Result:', JSON.stringify(issuesResult, null, 2));
  console.log('');

  // Test 3: Validation status history simulation
  console.log('=== TEST 3: Validation Status History ===');
  const validationHistory = [
    {
      workflowId: 'ws_healthy_test_12345',
      overallStatus: 'green',
      summary: 'Force Sync, OPAL agents, OSA ingestion, and results layer are all healthy.',
      validatedAt: new Date().toISOString(),
      osaReceptionRate: 0.89
    },
    {
      workflowId: 'ws_issues_test_12345',
      overallStatus: 'red', 
      summary: 'Critical issues detected in OPAL ↔ OSA integration. Immediate attention required.',
      validatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
      osaReceptionRate: 0.45
    }
  ];
  
  console.log('📊 Validation History:');
  validationHistory.forEach((record, index) => {
    console.log(`   ${index + 1}. ${record.workflowId.slice(-8)} - ${record.overallStatus.toUpperCase()}`);
    console.log(`      Reception: ${(record.osaReceptionRate * 100).toFixed(0)}%`);
    console.log(`      Summary: ${record.summary}`);
    console.log(`      Time: ${new Date(record.validatedAt).toLocaleTimeString()}`);
  });

  console.log('\n🎯 Integration Validator Tests Completed Successfully!');
  
  return {
    healthyResult,
    issuesResult,
    validationHistory
  };
}

// Export for use in other test files
export { MockOpalIntegrationValidator, mockHealthMetrics, mockHealthMetricsWithIssues };