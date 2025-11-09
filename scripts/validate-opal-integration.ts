#!/usr/bin/env node

/**
 * Comprehensive OPAL Integration Validation Script
 *
 * Tests the complete OPAL→OSA data flow with enhanced SDK tools
 * and validates that all webhook delivery issues have been resolved.
 */

import { execSync } from 'child_process';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TIMEOUT = 30000; // 30 second timeout for requests

interface TestResult {
  name: string;
  success: boolean;
  message: string;
  details?: any;
  duration?: number;
}

interface ValidationReport {
  overall_success: boolean;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  tests: TestResult[];
  summary: string;
}

/**
 * Utility function to make HTTP requests with timeout
 */
async function makeRequest(url: string, options: any = {}): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Test 1: Enhanced Tools Discovery Endpoint
 */
async function testDiscoveryEndpoint(): Promise<TestResult> {
  const start = Date.now();

  try {
    console.log('🔍 Testing enhanced tools discovery endpoint...');

    const response = await makeRequest(`${BASE_URL}/api/opal/enhanced-tools`);

    const requiredFields = ['name', 'tools', 'discovery_url', 'critical_fixes_implemented'];
    const missingFields = requiredFields.filter(field => !response[field]);

    if (missingFields.length > 0) {
      return {
        name: 'Discovery Endpoint',
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        duration: Date.now() - start
      };
    }

    const requiredTools = [
      'send_data_to_osa_enhanced',
      'analyze_website_content_enhanced',
      'generate_audience_segments_enhanced',
      'create_experiment_blueprint_enhanced'
    ];

    const availableTools = response.tools.map((tool: any) => tool.name);
    const missingTools = requiredTools.filter(tool => !availableTools.includes(tool));

    if (missingTools.length > 0) {
      return {
        name: 'Discovery Endpoint',
        success: false,
        message: `Missing required tools: ${missingTools.join(', ')}`,
        duration: Date.now() - start
      };
    }

    return {
      name: 'Discovery Endpoint',
      success: true,
      message: 'All required tools and metadata present',
      details: {
        tools_count: response.tools.length,
        available_tools: availableTools
      },
      duration: Date.now() - start
    };

  } catch (error) {
    return {
      name: 'Discovery Endpoint',
      success: false,
      message: `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - start
    };
  }
}

/**
 * Test 2: Enhanced Webhook Delivery (Critical Fix)
 */
async function testEnhancedWebhookDelivery(): Promise<TestResult> {
  const start = Date.now();

  try {
    console.log('📤 Testing enhanced webhook delivery (CRITICAL FIX)...');

    const payload = {
      tool_name: 'send_data_to_osa_enhanced',
      parameters: {
        agent_id: 'validation_test_agent',
        agent_data: {
          test_type: 'integration_validation',
          validation_timestamp: new Date().toISOString(),
          test_results: {
            webhook_routing: 'localhost_expected',
            environment: 'development',
            sdk_enhanced: true
          }
        },
        workflow_id: `validation_workflow_${Date.now()}`,
        execution_status: 'completed',
        target_environment: 'development'
      }
    };

    const response = await makeRequest(`${BASE_URL}/api/opal/enhanced-tools`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    // Validate the response structure
    if (!response.success) {
      return {
        name: 'Enhanced Webhook Delivery',
        success: false,
        message: 'Webhook delivery reported failure',
        details: response,
        duration: Date.now() - start
      };
    }

    // Critical validation: ensure localhost routing in development
    const targetUrl = response.results?.target_url;
    if (!targetUrl || !targetUrl.includes('localhost:3000')) {
      return {
        name: 'Enhanced Webhook Delivery',
        success: false,
        message: 'CRITICAL: Webhook not routing to localhost in development',
        details: {
          expected: 'http://localhost:3000/api/webhooks/opal-workflow',
          actual: targetUrl
        },
        duration: Date.now() - start
      };
    }

    return {
      name: 'Enhanced Webhook Delivery',
      success: true,
      message: 'Enhanced webhook delivery working correctly with localhost routing',
      details: {
        webhook_delivered: response.results.webhook_delivered,
        target_url: response.results.target_url,
        delivery_method: response.results.delivery_method,
        sdk_features_used: response.results.sdk_features_used
      },
      duration: Date.now() - start
    };

  } catch (error) {
    return {
      name: 'Enhanced Webhook Delivery',
      success: false,
      message: `Webhook delivery failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - start
    };
  }
}

/**
 * Test 3: Content Analysis Tool
 */
async function testContentAnalysis(): Promise<TestResult> {
  const start = Date.now();

  try {
    console.log('🔍 Testing enhanced content analysis tool...');

    const payload = {
      tool_name: 'analyze_website_content_enhanced',
      parameters: {
        website_url: 'https://www.foodprocessing.com',
        analysis_config: {
          depth: 'comprehensive',
          include_seo: true,
          include_accessibility: true
        },
        workflow_context: {
          workflow_id: `test_workflow_${Date.now()}`,
          agent_id: 'content_analysis_test',
          execution_order: 1
        }
      }
    };

    const response = await makeRequest(`${BASE_URL}/api/opal/enhanced-tools`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.success) {
      return {
        name: 'Content Analysis Tool',
        success: false,
        message: 'Content analysis execution failed',
        details: response,
        duration: Date.now() - start
      };
    }

    const requiredMetrics = [
      'content_quality_score',
      'technical_score',
      'personalization_readiness'
    ];

    const analysis = response.results?.website_analysis?.quality_metrics;
    if (!analysis) {
      return {
        name: 'Content Analysis Tool',
        success: false,
        message: 'Missing quality metrics in analysis results',
        duration: Date.now() - start
      };
    }

    const missingMetrics = requiredMetrics.filter(metric => analysis[metric] === undefined);
    if (missingMetrics.length > 0) {
      return {
        name: 'Content Analysis Tool',
        success: false,
        message: `Missing analysis metrics: ${missingMetrics.join(', ')}`,
        duration: Date.now() - start
      };
    }

    return {
      name: 'Content Analysis Tool',
      success: true,
      message: 'Content analysis tool functioning correctly',
      details: {
        quality_metrics: analysis,
        personalization_opportunities: response.results.website_analysis.personalization_opportunities,
        workflow_coordination: response.results.workflow_coordination
      },
      duration: Date.now() - start
    };

  } catch (error) {
    return {
      name: 'Content Analysis Tool',
      success: false,
      message: `Content analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - start
    };
  }
}

/**
 * Test 4: Audience Segmentation Tool
 */
async function testAudienceSegmentation(): Promise<TestResult> {
  const start = Date.now();

  try {
    console.log('👥 Testing enhanced audience segmentation tool...');

    const payload = {
      tool_name: 'generate_audience_segments_enhanced',
      parameters: {
        business_objectives: 'Increase member engagement and conversion rates for food processing industry professionals',
        segmentation_config: {
          segment_size_min: 1000,
          geographic_scope: 'global',
          behavioral_weight: 0.6,
          demographic_weight: 0.4
        },
        workflow_context: {
          workflow_id: `test_workflow_${Date.now()}`,
          agent_id: 'audience_segmentation_test',
          execution_order: 2
        }
      }
    };

    const response = await makeRequest(`${BASE_URL}/api/opal/enhanced-tools`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.success) {
      return {
        name: 'Audience Segmentation Tool',
        success: false,
        message: 'Audience segmentation execution failed',
        details: response,
        duration: Date.now() - start
      };
    }

    const segments = response.results?.generated_segments?.primary_segments;
    if (!segments || segments.length === 0) {
      return {
        name: 'Audience Segmentation Tool',
        success: false,
        message: 'No audience segments generated',
        duration: Date.now() - start
      };
    }

    const validation = response.results?.generated_segments?.statistical_validation;
    if (!validation || validation.confidence_interval !== '95%') {
      return {
        name: 'Audience Segmentation Tool',
        success: false,
        message: 'Statistical validation missing or insufficient',
        duration: Date.now() - start
      };
    }

    return {
      name: 'Audience Segmentation Tool',
      success: true,
      message: 'Audience segmentation tool functioning correctly',
      details: {
        segments_generated: segments.length,
        statistical_validation: validation,
        personalization_recommendations: response.results.personalization_recommendations
      },
      duration: Date.now() - start
    };

  } catch (error) {
    return {
      name: 'Audience Segmentation Tool',
      success: false,
      message: `Audience segmentation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - start
    };
  }
}

/**
 * Test 5: Experiment Blueprint Tool
 */
async function testExperimentBlueprint(): Promise<TestResult> {
  const start = Date.now();

  try {
    console.log('🧪 Testing enhanced experiment blueprint tool...');

    const payload = {
      tool_name: 'create_experiment_blueprint_enhanced',
      parameters: {
        personalization_goals: [
          'Dynamic content recommendations',
          'Member-specific resource suggestions',
          'Behavioral trigger content'
        ],
        available_traffic: 50000,
        experiment_config: {
          confidence_level: 95,
          minimum_effect_size: 5,
          test_duration_weeks: 4,
          traffic_allocation: '50/50'
        },
        workflow_context: {
          workflow_id: `test_workflow_${Date.now()}`,
          agent_id: 'experiment_blueprint_test',
          execution_order: 3
        }
      }
    };

    const response = await makeRequest(`${BASE_URL}/api/opal/enhanced-tools`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.success) {
      return {
        name: 'Experiment Blueprint Tool',
        success: false,
        message: 'Experiment blueprint execution failed',
        details: response,
        duration: Date.now() - start
      };
    }

    const portfolio = response.results?.experiment_portfolio;
    if (!portfolio || !portfolio.experiment_blueprints || portfolio.experiment_blueprints.length === 0) {
      return {
        name: 'Experiment Blueprint Tool',
        success: false,
        message: 'No experiment blueprints generated',
        duration: Date.now() - start
      };
    }

    const powerAnalysis = portfolio.statistical_power_analysis;
    if (!powerAnalysis || powerAnalysis.statistical_power < 0.8) {
      return {
        name: 'Experiment Blueprint Tool',
        success: false,
        message: 'Insufficient statistical power in experiment design',
        duration: Date.now() - start
      };
    }

    return {
      name: 'Experiment Blueprint Tool',
      success: true,
      message: 'Experiment blueprint tool functioning correctly',
      details: {
        experiments_created: portfolio.experiment_blueprints.length,
        statistical_power: powerAnalysis.statistical_power,
        risk_assessment: portfolio.risk_assessment
      },
      duration: Date.now() - start
    };

  } catch (error) {
    return {
      name: 'Experiment Blueprint Tool',
      success: false,
      message: `Experiment blueprint failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - start
    };
  }
}

/**
 * Test 6: Configuration File Validation
 */
async function testConfigurationFiles(): Promise<TestResult> {
  const start = Date.now();

  try {
    console.log('⚙️ Testing OPAL configuration files...');

    // Check that workflow_data_sharing.json has been updated
    const fs = await import('fs');
    const configPath = './opal-config/opal-tools/workflow_data_sharing.json';

    if (!fs.existsSync(configPath)) {
      return {
        name: 'Configuration Files',
        success: false,
        message: 'workflow_data_sharing.json file not found',
        duration: Date.now() - start
      };
    }

    const configContent = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configContent);

    // Critical validation: ensure localhost URLs in development
    const endpoints = config.integration_endpoints;
    if (!endpoints) {
      return {
        name: 'Configuration Files',
        success: false,
        message: 'Missing integration_endpoints in configuration',
        duration: Date.now() - start
      };
    }

    const requiredLocalhost = [
      'data_storage',
      'osa_webhook_agent',
      'osa_webhook_results',
      'validation_service'
    ];

    const prodUrls = requiredLocalhost.filter(endpoint =>
      endpoints[endpoint] && endpoints[endpoint].includes('ifpa-strategy.vercel.app')
    );

    if (prodUrls.length > 0) {
      return {
        name: 'Configuration Files',
        success: false,
        message: `CRITICAL: Production URLs still present in development config: ${prodUrls.join(', ')}`,
        details: {
          problematic_endpoints: prodUrls.map(ep => ({ [ep]: endpoints[ep] })),
          fix_required: 'Update to localhost URLs for development'
        },
        duration: Date.now() - start
      };
    }

    // Validate discovery URL points to enhanced tools
    if (!config.discovery_url.includes('/api/opal/enhanced-tools')) {
      return {
        name: 'Configuration Files',
        success: false,
        message: 'Discovery URL not pointing to enhanced tools endpoint',
        duration: Date.now() - start
      };
    }

    return {
      name: 'Configuration Files',
      success: true,
      message: 'Configuration files properly updated for localhost development',
      details: {
        discovery_url: config.discovery_url,
        integration_endpoints: endpoints
      },
      duration: Date.now() - start
    };

  } catch (error) {
    return {
      name: 'Configuration Files',
      success: false,
      message: `Configuration validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - start
    };
  }
}

/**
 * Main validation function
 */
async function runValidation(): Promise<ValidationReport> {
  console.log('🚀 Starting comprehensive OPAL integration validation...\n');

  const tests = [
    testDiscoveryEndpoint,
    testEnhancedWebhookDelivery,
    testContentAnalysis,
    testAudienceSegmentation,
    testExperimentBlueprint,
    testConfigurationFiles
  ];

  const results: TestResult[] = [];

  for (const test of tests) {
    try {
      const result = await test();
      results.push(result);

      const status = result.success ? '✅' : '❌';
      const duration = result.duration ? ` (${result.duration}ms)` : '';
      console.log(`${status} ${result.name}: ${result.message}${duration}`);

      if (result.details && !result.success) {
        console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
      }

    } catch (error) {
      const errorResult: TestResult = {
        name: test.name,
        success: false,
        message: `Test execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
      results.push(errorResult);
      console.log(`❌ ${errorResult.name}: ${errorResult.message}`);
    }

    console.log(''); // Add spacing between tests
  }

  const passedTests = results.filter(r => r.success).length;
  const failedTests = results.length - passedTests;
  const overallSuccess = failedTests === 0;

  const summary = overallSuccess
    ? '🎉 All tests passed! OPAL→OSA integration is fully functional.'
    : `⚠️ ${failedTests} test(s) failed. Integration requires attention.`;

  const report: ValidationReport = {
    overall_success: overallSuccess,
    total_tests: results.length,
    passed_tests: passedTests,
    failed_tests: failedTests,
    tests: results,
    summary
  };

  return report;
}

/**
 * Main execution
 */
async function main() {
  try {
    const report = await runValidation();

    console.log('\n' + '='.repeat(80));
    console.log('📊 VALIDATION SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Tests: ${report.total_tests}`);
    console.log(`Passed: ${report.passed_tests}`);
    console.log(`Failed: ${report.failed_tests}`);
    console.log(`Overall Status: ${report.overall_success ? 'SUCCESS' : 'FAILURE'}`);
    console.log('\n' + report.summary);

    if (!report.overall_success) {
      console.log('\n🔧 FAILED TESTS:');
      report.tests
        .filter(t => !t.success)
        .forEach(test => {
          console.log(`\n❌ ${test.name}`);
          console.log(`   Error: ${test.message}`);
          if (test.details) {
            console.log(`   Details: ${JSON.stringify(test.details, null, 2)}`);
          }
        });
    }

    console.log('\n' + '='.repeat(80) + '\n');

    // Exit with appropriate code
    process.exit(report.overall_success ? 0 : 1);

  } catch (error) {
    console.error('❌ Validation script failed:', error);
    process.exit(1);
  }
}

// Run the validation
if (require.main === module) {
  main();
}

export { runValidation, ValidationReport, TestResult };