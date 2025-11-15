#!/usr/bin/env tsx

/**
 * OPAL Deployment Validation Script
 *
 * Comprehensive validation suite to ensure OPAL system is deployment-ready:
 * - Database connectivity and schema validation
 * - API endpoint availability and correctness
 * - Error handling and recovery mechanisms
 * - Performance benchmarks
 * - Security validations
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from '../src/lib/types/database';

interface ValidationResult {
  category: string;
  test: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  details?: any;
  duration?: number;
}

interface ValidationSummary {
  totalTests: number;
  passed: number;
  failed: number;
  warnings: number;
  duration: number;
  deploymentReady: boolean;
}

class OpalDeploymentValidator {
  private results: ValidationResult[] = [];
  private baseUrl: string;
  private supabaseClient: ReturnType<typeof createClient<Database>> | null = null;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    this.initializeSupabase();
  }

  private initializeSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      this.supabaseClient = createClient<Database>(supabaseUrl, supabaseKey);
    }
  }

  private async recordResult(
    category: string,
    test: string,
    status: 'PASS' | 'FAIL' | 'WARN',
    message: string,
    details?: any,
    duration?: number
  ) {
    this.results.push({
      category,
      test,
      status,
      message,
      details,
      duration
    });

    const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    const durationText = duration ? ` (${Math.round(duration)}ms)` : '';
    console.log(`${emoji} [${category}] ${test}: ${message}${durationText}`);
  }

  async validateEnvironmentConfiguration(): Promise<void> {
    console.log('\n🔧 Validating Environment Configuration...\n');

    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'NODE_ENV'
    ];

    const optionalVars = [
      'REDIS_HOST',
      'REDIS_PORT',
      'REDIS_PASSWORD'
    ];

    // Check required environment variables
    for (const varName of requiredVars) {
      if (process.env[varName]) {
        await this.recordResult('Environment', `${varName} exists`, 'PASS', 'Required variable is set');
      } else {
        await this.recordResult('Environment', `${varName} missing`, 'FAIL', 'Required environment variable is missing');
      }
    }

    // Check optional environment variables
    for (const varName of optionalVars) {
      if (process.env[varName]) {
        await this.recordResult('Environment', `${varName} exists`, 'PASS', 'Optional variable is set');
      } else {
        await this.recordResult('Environment', `${varName} missing`, 'WARN', 'Optional variable not set - will use defaults');
      }
    }

    // Validate NODE_ENV
    const nodeEnv = process.env.NODE_ENV;
    if (['development', 'production', 'test'].includes(nodeEnv || '')) {
      await this.recordResult('Environment', 'NODE_ENV valid', 'PASS', `Environment: ${nodeEnv}`);
    } else {
      await this.recordResult('Environment', 'NODE_ENV invalid', 'WARN', `Unknown environment: ${nodeEnv}`);
    }
  }

  async validateDatabaseConnectivity(): Promise<void> {
    console.log('\n🗄️ Validating Database Connectivity...\n');

    if (!this.supabaseClient) {
      await this.recordResult('Database', 'Connection', 'FAIL', 'Supabase client not initialized');
      return;
    }

    const startTime = performance.now();

    try {
      // Test basic connectivity
      const { error: connectError } = await this.supabaseClient
        .from('opal_confidence_scores')
        .select('count', { count: 'exact', head: true });

      const duration = performance.now() - startTime;

      if (connectError) {
        if (connectError.message.includes('relation "opal_confidence_scores" does not exist')) {
          await this.recordResult('Database', 'Tables Missing', 'FAIL', 'OPAL tracking tables do not exist - run migrations', connectError, duration);
        } else {
          await this.recordResult('Database', 'Connection', 'FAIL', `Database connection failed: ${connectError.message}`, connectError, duration);
        }
      } else {
        await this.recordResult('Database', 'Connection', 'PASS', 'Database connected successfully', undefined, duration);
      }

      // Test table structure
      await this.validateTableStructure();

      // Test write permissions
      await this.validateDatabasePermissions();

    } catch (error) {
      const duration = performance.now() - startTime;
      await this.recordResult('Database', 'Connection', 'FAIL', `Database connection error: ${error}`, error, duration);
    }
  }

  private async validateTableStructure(): Promise<void> {
    if (!this.supabaseClient) return;

    try {
      // Check opal_confidence_scores table
      const { error: confidenceError } = await this.supabaseClient
        .from('opal_confidence_scores')
        .select('id, page_id, agent_type, confidence_score')
        .limit(1);

      if (confidenceError) {
        await this.recordResult('Database', 'Table Structure', 'FAIL', `opal_confidence_scores table issue: ${confidenceError.message}`);
      } else {
        await this.recordResult('Database', 'Confidence Scores Table', 'PASS', 'Table structure is correct');
      }

      // Check opal_fallback_usage table
      const { error: fallbackError } = await this.supabaseClient
        .from('opal_fallback_usage')
        .select('id, page_id, agent_type, trigger_reason')
        .limit(1);

      if (fallbackError) {
        await this.recordResult('Database', 'Fallback Usage Table', 'FAIL', `opal_fallback_usage table issue: ${fallbackError.message}`);
      } else {
        await this.recordResult('Database', 'Fallback Usage Table', 'PASS', 'Table structure is correct');
      }

    } catch (error) {
      await this.recordResult('Database', 'Table Structure', 'FAIL', `Table validation error: ${error}`);
    }
  }

  private async validateDatabasePermissions(): Promise<void> {
    if (!this.supabaseClient) return;

    try {
      // Test insert permission
      const testRecord = {
        page_id: `validation-test-${Date.now()}`,
        agent_type: 'strategy_workflow' as const,
        confidence_score: 0.85,
        response_time_ms: 1000,
        content_hash: 'validation_test',
        validation_passed: true
      };

      const { error: insertError } = await this.supabaseClient
        .from('opal_confidence_scores')
        .insert(testRecord);

      if (insertError) {
        await this.recordResult('Database', 'Write Permissions', 'FAIL', `Cannot insert: ${insertError.message}`);
      } else {
        await this.recordResult('Database', 'Write Permissions', 'PASS', 'Database write permissions working');

        // Clean up test record
        await this.supabaseClient
          .from('opal_confidence_scores')
          .delete()
          .eq('page_id', testRecord.page_id);
      }

    } catch (error) {
      await this.recordResult('Database', 'Write Permissions', 'FAIL', `Permission test error: ${error}`);
    }
  }

  async validateApiEndpoints(): Promise<void> {
    console.log('\n🚀 Validating API Endpoints...\n');

    const agentTypes = [
      'strategy_workflow',
      'roadmap_generator',
      'maturity_assessment',
      'quick_wins_analyzer',
      'content_review'
    ];

    // Test each agent endpoint
    for (const agent of agentTypes) {
      await this.testAgentEndpoint(agent);
    }

    // Test error handling
    await this.testErrorHandling();

    // Test input validation
    await this.testInputValidation();
  }

  private async testAgentEndpoint(agent: string): Promise<void> {
    const startTime = performance.now();

    try {
      const response = await fetch(`${this.baseUrl}/api/opal/workflows/${agent}/output?page_id=validation-test`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const duration = performance.now() - startTime;

      if (response.status === 200) {
        const data = await response.json();

        if (data.success && data.data && data.metadata) {
          await this.recordResult('API', `${agent} endpoint`, 'PASS', 'Endpoint working correctly', data, duration);

          // Validate response structure
          if (data.confidence_score >= 0 && data.confidence_score <= 1) {
            await this.recordResult('API', `${agent} confidence score`, 'PASS', `Score: ${data.confidence_score}`);
          } else {
            await this.recordResult('API', `${agent} confidence score`, 'WARN', `Invalid confidence score: ${data.confidence_score}`);
          }

        } else {
          await this.recordResult('API', `${agent} endpoint`, 'FAIL', 'Invalid response structure', data, duration);
        }

      } else {
        await this.recordResult('API', `${agent} endpoint`, 'FAIL', `HTTP ${response.status}: ${response.statusText}`, undefined, duration);
      }

    } catch (error) {
      const duration = performance.now() - startTime;
      await this.recordResult('API', `${agent} endpoint`, 'FAIL', `Request failed: ${error}`, error, duration);
    }
  }

  private async testErrorHandling(): Promise<void> {
    // Test invalid agent type
    try {
      const response = await fetch(`${this.baseUrl}/api/opal/workflows/invalid_agent/output`, {
        method: 'GET'
      });

      if (response.status === 400) {
        await this.recordResult('API', 'Error Handling', 'PASS', 'Invalid agent type correctly rejected');
      } else {
        await this.recordResult('API', 'Error Handling', 'WARN', `Expected 400, got ${response.status}`);
      }

    } catch (error) {
      await this.recordResult('API', 'Error Handling', 'FAIL', `Error handling test failed: ${error}`);
    }
  }

  private async testInputValidation(): Promise<void> {
    const maliciousInputs = [
      'strategy-plans/../../../etc/passwd',
      'test<script>alert("xss")</script>',
      'test; DROP TABLE users; --'
    ];

    for (const maliciousInput of maliciousInputs) {
      try {
        const response = await fetch(`${this.baseUrl}/api/opal/workflows/strategy_workflow/output?page_id=${encodeURIComponent(maliciousInput)}`, {
          method: 'GET'
        });

        if (response.status === 200) {
          const data = await response.json();

          if (data.success && !data.data.page_id?.includes('../') && !data.data.page_id?.includes('<script>')) {
            await this.recordResult('Security', 'Input Sanitization', 'PASS', 'Malicious input properly sanitized');
          } else {
            await this.recordResult('Security', 'Input Sanitization', 'FAIL', 'Malicious input not properly sanitized', data);
          }
        } else {
          await this.recordResult('Security', 'Input Sanitization', 'WARN', `Unexpected response: ${response.status}`);
        }

      } catch (error) {
        await this.recordResult('Security', 'Input Sanitization', 'FAIL', `Input validation test failed: ${error}`);
      }
    }
  }

  async validatePerformance(): Promise<void> {
    console.log('\n⚡ Validating Performance...\n');

    // Single request performance
    await this.testSingleRequestPerformance();

    // Concurrent request handling
    await this.testConcurrentPerformance();

    // Load testing
    await this.testLoadPerformance();
  }

  private async testSingleRequestPerformance(): Promise<void> {
    const startTime = performance.now();

    try {
      const response = await fetch(`${this.baseUrl}/api/opal/workflows/strategy_workflow/output?page_id=performance-test`, {
        method: 'GET'
      });

      const duration = performance.now() - startTime;

      if (response.status === 200) {
        if (duration < 2000) {
          await this.recordResult('Performance', 'Single Request', 'PASS', `Response time: ${Math.round(duration)}ms`, undefined, duration);
        } else if (duration < 5000) {
          await this.recordResult('Performance', 'Single Request', 'WARN', `Response time: ${Math.round(duration)}ms (acceptable but slow)`, undefined, duration);
        } else {
          await this.recordResult('Performance', 'Single Request', 'FAIL', `Response time: ${Math.round(duration)}ms (too slow)`, undefined, duration);
        }
      } else {
        await this.recordResult('Performance', 'Single Request', 'FAIL', `Request failed with status ${response.status}`, undefined, duration);
      }

    } catch (error) {
      const duration = performance.now() - startTime;
      await this.recordResult('Performance', 'Single Request', 'FAIL', `Performance test failed: ${error}`, error, duration);
    }
  }

  private async testConcurrentPerformance(): Promise<void> {
    const concurrentRequests = 5;
    const startTime = performance.now();

    try {
      const promises = Array.from({ length: concurrentRequests }, (_, i) =>
        fetch(`${this.baseUrl}/api/opal/workflows/quick_wins_analyzer/output?page_id=concurrent-test-${i}`, {
          method: 'GET'
        })
      );

      const responses = await Promise.all(promises);
      const duration = performance.now() - startTime;

      const allSuccessful = responses.every(r => r.status === 200);
      const avgResponseTime = duration / concurrentRequests;

      if (allSuccessful && avgResponseTime < 3000) {
        await this.recordResult('Performance', 'Concurrent Requests', 'PASS', `${concurrentRequests} requests, avg: ${Math.round(avgResponseTime)}ms`, undefined, duration);
      } else if (allSuccessful) {
        await this.recordResult('Performance', 'Concurrent Requests', 'WARN', `${concurrentRequests} requests, avg: ${Math.round(avgResponseTime)}ms (slow)`, undefined, duration);
      } else {
        await this.recordResult('Performance', 'Concurrent Requests', 'FAIL', 'Some concurrent requests failed', responses.map(r => r.status), duration);
      }

    } catch (error) {
      const duration = performance.now() - startTime;
      await this.recordResult('Performance', 'Concurrent Requests', 'FAIL', `Concurrent test failed: ${error}`, error, duration);
    }
  }

  private async testLoadPerformance(): Promise<void> {
    const loadRequests = 10;
    const startTime = performance.now();

    try {
      const promises = Array.from({ length: loadRequests }, (_, i) =>
        fetch(`${this.baseUrl}/api/opal/workflows/maturity_assessment/output?page_id=load-test-${i}`, {
          method: 'GET'
        })
      );

      const responses = await Promise.all(promises);
      const duration = performance.now() - startTime;

      const successCount = responses.filter(r => r.status === 200).length;
      const successRate = (successCount / loadRequests) * 100;
      const avgResponseTime = duration / loadRequests;

      if (successRate >= 95 && avgResponseTime < 5000) {
        await this.recordResult('Performance', 'Load Test', 'PASS', `${successCount}/${loadRequests} successful (${successRate}%), avg: ${Math.round(avgResponseTime)}ms`, undefined, duration);
      } else if (successRate >= 90) {
        await this.recordResult('Performance', 'Load Test', 'WARN', `${successCount}/${loadRequests} successful (${successRate}%), avg: ${Math.round(avgResponseTime)}ms`, undefined, duration);
      } else {
        await this.recordResult('Performance', 'Load Test', 'FAIL', `${successCount}/${loadRequests} successful (${successRate}%), avg: ${Math.round(avgResponseTime)}ms`, undefined, duration);
      }

    } catch (error) {
      const duration = performance.now() - startTime;
      await this.recordResult('Performance', 'Load Test', 'FAIL', `Load test failed: ${error}`, error, duration);
    }
  }

  async validateErrorRecovery(): Promise<void> {
    console.log('\n🛡️ Validating Error Recovery...\n');

    // Test fallback mechanisms
    await this.testFallbackMechanisms();

    // Test resilience to bad input
    await this.testResilienceToBadInput();
  }

  private async testFallbackMechanisms(): Promise<void> {
    // Test with database unavailable (simulate by using invalid credentials)
    const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    try {
      // Temporarily disable database access
      process.env.NEXT_PUBLIC_SUPABASE_URL = '';
      process.env.SUPABASE_SERVICE_ROLE_KEY = '';

      const response = await fetch(`${this.baseUrl}/api/opal/workflows/content_review/output?page_id=fallback-test`, {
        method: 'GET'
      });

      if (response.status === 200) {
        const data = await response.json();

        if (data.success && data.metadata.database_connected === false) {
          await this.recordResult('Recovery', 'Database Fallback', 'PASS', 'System gracefully handles database unavailability');
        } else {
          await this.recordResult('Recovery', 'Database Fallback', 'WARN', 'Fallback mechanism unclear', data);
        }
      } else {
        await this.recordResult('Recovery', 'Database Fallback', 'FAIL', `System fails when database unavailable: ${response.status}`);
      }

      // Restore original environment
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
      process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;

    } catch (error) {
      // Restore original environment
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
      process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;

      await this.recordResult('Recovery', 'Database Fallback', 'FAIL', `Fallback test failed: ${error}`);
    }
  }

  private async testResilienceToBadInput(): Promise<void> {
    const badInputs = [
      { pageId: '', description: 'Empty page ID' },
      { pageId: 'a'.repeat(1000), description: 'Very long page ID' },
      { pageId: null, description: 'Null page ID' }
    ];

    for (const badInput of badInputs) {
      try {
        const url = badInput.pageId !== null
          ? `${this.baseUrl}/api/opal/workflows/strategy_workflow/output?page_id=${encodeURIComponent(badInput.pageId)}`
          : `${this.baseUrl}/api/opal/workflows/strategy_workflow/output`;

        const response = await fetch(url, { method: 'GET' });

        if (response.status === 200) {
          const data = await response.json();

          if (data.success) {
            await this.recordResult('Recovery', `Bad Input: ${badInput.description}`, 'PASS', 'System handles bad input gracefully');
          } else {
            await this.recordResult('Recovery', `Bad Input: ${badInput.description}`, 'WARN', 'System rejects bad input but returns error', data);
          }
        } else {
          await this.recordResult('Recovery', `Bad Input: ${badInput.description}`, 'WARN', `System returns HTTP error: ${response.status}`);
        }

      } catch (error) {
        await this.recordResult('Recovery', `Bad Input: ${badInput.description}`, 'FAIL', `Bad input test failed: ${error}`);
      }
    }
  }

  generateSummary(): ValidationSummary {
    const totalTests = this.results.length;
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const warnings = this.results.filter(r => r.status === 'WARN').length;

    const totalDuration = this.results
      .filter(r => r.duration)
      .reduce((sum, r) => sum + (r.duration || 0), 0);

    const deploymentReady = failed === 0 && passed >= totalTests * 0.8;

    return {
      totalTests,
      passed,
      failed,
      warnings,
      duration: totalDuration,
      deploymentReady
    };
  }

  printSummary(): void {
    const summary = this.generateSummary();

    console.log('\n' + '='.repeat(60));
    console.log('🏁 OPAL DEPLOYMENT VALIDATION SUMMARY');
    console.log('='.repeat(60));

    console.log(`📊 Tests Run: ${summary.totalTests}`);
    console.log(`✅ Passed: ${summary.passed}`);
    console.log(`❌ Failed: ${summary.failed}`);
    console.log(`⚠️ Warnings: ${summary.warnings}`);
    console.log(`⏱️ Total Duration: ${Math.round(summary.duration)}ms`);

    console.log('\n🎯 DEPLOYMENT STATUS:');

    if (summary.deploymentReady) {
      console.log('🟢 READY FOR DEPLOYMENT');
      console.log('✨ All critical tests passed. System is deployment-ready.');
    } else {
      console.log('🔴 NOT READY FOR DEPLOYMENT');
      console.log('❗ Critical issues detected. Address failed tests before deployment.');
    }

    // Print failed tests
    const failedTests = this.results.filter(r => r.status === 'FAIL');
    if (failedTests.length > 0) {
      console.log('\n❌ FAILED TESTS:');
      failedTests.forEach(test => {
        console.log(`   • [${test.category}] ${test.test}: ${test.message}`);
      });
    }

    // Print warnings
    const warningTests = this.results.filter(r => r.status === 'WARN');
    if (warningTests.length > 0) {
      console.log('\n⚠️ WARNINGS:');
      warningTests.forEach(test => {
        console.log(`   • [${test.category}] ${test.test}: ${test.message}`);
      });
    }

    console.log('\n' + '='.repeat(60));

    // Exit with appropriate code
    process.exit(summary.deploymentReady ? 0 : 1);
  }

  async runFullValidation(): Promise<void> {
    console.log('🚀 Starting OPAL Deployment Validation...');
    console.log(`🌐 Base URL: ${this.baseUrl}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);

    const startTime = performance.now();

    await this.validateEnvironmentConfiguration();
    await this.validateDatabaseConnectivity();
    await this.validateApiEndpoints();
    await this.validatePerformance();
    await this.validateErrorRecovery();

    const totalDuration = performance.now() - startTime;
    console.log(`\n⏱️ Total validation time: ${Math.round(totalDuration)}ms`);

    this.printSummary();
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new OpalDeploymentValidator();
  validator.runFullValidation().catch(error => {
    console.error('❌ Validation script failed:', error);
    process.exit(1);
  });
}

export { OpalDeploymentValidator };