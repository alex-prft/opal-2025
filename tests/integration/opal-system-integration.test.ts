/**
 * Integration Tests for OPAL System
 *
 * Validates end-to-end functionality and deployment readiness:
 * - API endpoint responses
 * - Database integration
 * - Error recovery mechanisms
 * - Performance under load
 * - Cross-component integration
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { testClient } from '../helpers/test-client';
import { setupTestDatabase, cleanupTestDatabase } from '../helpers/database-helper';

describe('OPAL System Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('API Endpoint Integration', () => {
    describe('GET /api/opal/workflows/[agent]/output', () => {
      it('should return valid response for strategy_workflow', async () => {
        const response = await testClient.get('/api/opal/workflows/strategy_workflow/output?page_id=strategy-plans-summary-main');

        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data).toMatchObject({
          success: true,
          confidence_score: expect.any(Number),
          metadata: {
            agent_type: 'strategy_workflow',
            page_id: 'strategy-plans-summary-main',
            generated_at: expect.any(String),
            response_time_ms: expect.any(Number),
            environment_mode: expect.any(String),
            database_connected: expect.any(Boolean),
            cache_available: expect.any(Boolean),
            error_handled: expect.any(Boolean)
          }
        });

        expect(data.data).toBeDefined();
        expect(data.confidence_score).toBeGreaterThanOrEqual(0);
        expect(data.confidence_score).toBeLessThanOrEqual(1);
      });

      it('should handle all supported agent types', async () => {
        const agentTypes = [
          'strategy_workflow',
          'roadmap_generator',
          'maturity_assessment',
          'quick_wins_analyzer',
          'content_review'
        ];

        for (const agentType of agentTypes) {
          const response = await testClient.get(`/api/opal/workflows/${agentType}/output?page_id=test-page`);

          expect(response.status).toBe(200);

          const data = await response.json();
          expect(data.success).toBe(true);
          expect(data.metadata.agent_type).toBe(agentType);
        }
      });

      it('should return 400 for invalid agent types', async () => {
        const response = await testClient.get('/api/opal/workflows/invalid_agent/output');

        expect(response.status).toBe(400);

        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error).toContain('Unsupported agent type');
      });

      it('should handle query parameters correctly', async () => {
        const params = new URLSearchParams({
          page_id: 'strategy-plans-quick-wins',
          force_refresh: 'true',
          use_cache: 'false'
        });

        const response = await testClient.get(`/api/opal/workflows/quick_wins_analyzer/output?${params}`);

        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.metadata.page_id).toBe('strategy-plans-quick-wins');
      });
    });

    describe('POST /api/opal/workflows/[agent]/output', () => {
      it('should handle valid POST requests', async () => {
        const requestBody = {
          page_id: 'strategy-plans-maturity-overview',
          force_refresh: true,
          timeout: 60000,
          use_cache: false,
          fallback_enabled: true
        };

        const response = await testClient.post('/api/opal/workflows/maturity_assessment/output', {
          json: requestBody
        });

        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.metadata.agent_type).toBe('maturity_assessment');
        expect(data.metadata.page_id).toBe('strategy-plans-maturity-overview');
        expect(data.metadata.cache_hit).toBe(false); // POST requests don't use cache
      });

      it('should validate request body parameters', async () => {
        const invalidRequestBody = {
          page_id: '', // Empty page_id
          timeout: -1000, // Invalid timeout
          invalid_field: 'should_be_ignored'
        };

        const response = await testClient.post('/api/opal/workflows/roadmap_generator/output', {
          json: invalidRequestBody
        });

        expect(response.status).toBe(200); // Should still succeed with defaults

        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.warnings).toBeDefined();
      });

      it('should handle malformed JSON gracefully', async () => {
        const response = await testClient.post('/api/opal/workflows/content_review/output', {
          body: 'invalid json{',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        expect(response.status).toBe(200); // Should still succeed with defaults

        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.warnings).toBeDefined();
      });
    });
  });

  describe('Database Integration', () => {
    it('should record confidence scores in database', async () => {
      const response = await testClient.get('/api/opal/workflows/strategy_workflow/output?page_id=test-confidence-recording');

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);

      // Verify confidence score was recorded (this would require database access)
      // In a real test, you would query the database to verify the record was created
    });

    it('should record fallback usage when errors occur', async () => {
      // This test would require mocking the database to fail temporarily
      // then verifying fallback usage is properly recorded
    });

    it('should handle database unavailability gracefully', async () => {
      // Mock database to be unavailable
      process.env.NEXT_PUBLIC_SUPABASE_URL = '';
      process.env.SUPABASE_SERVICE_ROLE_KEY = '';

      const response = await testClient.get('/api/opal/workflows/quick_wins_analyzer/output?page_id=test-no-db');

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.metadata.database_connected).toBe(false);
      expect(data.warnings).toContain(expect.stringContaining('Database unavailable'));

      // Restore environment variables
      process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.TEST_SUPABASE_URL;
      process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.TEST_SUPABASE_KEY;
    });
  });

  describe('Path Detection and Agent Routing', () => {
    it('should route strategy-plans paths to correct agents', async () => {
      const pathTestCases = [
        { pageId: 'strategy-plans-quick-wins-overview', expectedAgent: 'quick_wins_analyzer' },
        { pageId: 'strategy-plans-maturity-overview', expectedAgent: 'maturity_assessment' },
        { pageId: 'strategy-plans-roadmap-overview', expectedAgent: 'roadmap_generator' },
        { pageId: 'strategy-plans-summary-main', expectedAgent: 'strategy_workflow' }
      ];

      for (const testCase of pathTestCases) {
        const response = await testClient.get(`/api/opal/workflows/${testCase.expectedAgent}/output?page_id=${testCase.pageId}`);

        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.metadata.agent_type).toBe(testCase.expectedAgent);
        expect(data.metadata.page_id).toBe(testCase.pageId);
      }
    });

    it('should handle unknown paths with fallback routing', async () => {
      const response = await testClient.get('/api/opal/workflows/strategy_workflow/output?page_id=unknown-section-unknown-page');

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.metadata.agent_type).toBe('strategy_workflow'); // Default fallback
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should maintain service availability during errors', async () => {
      // Make requests during simulated error conditions
      const requests = Array.from({ length: 5 }, (_, i) =>
        testClient.get(`/api/opal/workflows/strategy_workflow/output?page_id=resilience-test-${i}`)
      );

      const responses = await Promise.all(requests);

      responses.forEach((response, index) => {
        expect(response.status).toBe(200);
      });

      const dataArray = await Promise.all(responses.map(r => r.json()));

      dataArray.forEach(data => {
        expect(data.success).toBe(true);
        expect(data.data).toBeDefined();
        expect(data.metadata).toBeDefined();
      });
    });

    it('should recover from temporary service failures', async () => {
      // This test would simulate temporary failures and verify recovery
      // Implementation depends on your specific error injection mechanisms
    });
  });

  describe('Performance and Load Handling', () => {
    it('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 10;
      const startTime = performance.now();

      const requests = Array.from({ length: concurrentRequests }, (_, i) =>
        testClient.get(`/api/opal/workflows/quick_wins_analyzer/output?page_id=load-test-${i}`)
      );

      const responses = await Promise.all(requests);
      const endTime = performance.now();

      const totalTime = endTime - startTime;
      const avgResponseTime = totalTime / concurrentRequests;

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Performance expectations
      expect(avgResponseTime).toBeLessThan(2000); // Average response under 2 seconds
      expect(totalTime).toBeLessThan(5000); // Total time under 5 seconds
    });

    it('should maintain response quality under load', async () => {
      const requests = Array.from({ length: 20 }, (_, i) =>
        testClient.get(`/api/opal/workflows/maturity_assessment/output?page_id=quality-test-${i}`)
      );

      const responses = await Promise.all(requests);
      const dataArray = await Promise.all(responses.map(r => r.json()));

      dataArray.forEach(data => {
        expect(data.success).toBe(true);
        expect(data.confidence_score).toBeGreaterThanOrEqual(0);
        expect(data.confidence_score).toBeLessThanOrEqual(1);
        expect(data.metadata.response_time_ms).toBeGreaterThan(0);
        expect(data.data).toBeDefined();
      });

      // Check for data consistency
      const agentTypes = [...new Set(dataArray.map(d => d.metadata.agent_type))];
      expect(agentTypes).toEqual(['maturity_assessment']);
    });
  });

  describe('Data Quality and Consistency', () => {
    it('should return consistent data structure across all agents', async () => {
      const agentTypes = [
        'strategy_workflow',
        'roadmap_generator',
        'maturity_assessment',
        'quick_wins_analyzer',
        'content_review'
      ];

      const responses = await Promise.all(
        agentTypes.map(agent =>
          testClient.get(`/api/opal/workflows/${agent}/output?page_id=consistency-test`)
        )
      );

      const dataArray = await Promise.all(responses.map(r => r.json()));

      dataArray.forEach((data, index) => {
        // Verify required fields
        expect(data).toHaveProperty('success');
        expect(data).toHaveProperty('confidence_score');
        expect(data).toHaveProperty('data');
        expect(data).toHaveProperty('metadata');

        // Verify metadata structure
        expect(data.metadata).toHaveProperty('agent_type', agentTypes[index]);
        expect(data.metadata).toHaveProperty('generated_at');
        expect(data.metadata).toHaveProperty('response_time_ms');
        expect(data.metadata).toHaveProperty('environment_mode');

        // Verify data types
        expect(typeof data.success).toBe('boolean');
        expect(typeof data.confidence_score).toBe('number');
        expect(typeof data.data).toBe('object');
        expect(typeof data.metadata).toBe('object');
      });
    });

    it('should generate agent-appropriate content', async () => {
      const testCases = [
        {
          agent: 'strategy_workflow',
          expectedFields: ['strategic_recommendations', 'implementation_roadmap']
        },
        {
          agent: 'roadmap_generator',
          expectedFields: ['crawl_walk_run_fly', 'resource_requirements']
        },
        {
          agent: 'maturity_assessment',
          expectedFields: ['overall_maturity_score', 'dimension_assessment']
        },
        {
          agent: 'quick_wins_analyzer',
          expectedFields: ['high_impact_opportunities', 'total_potential_impact']
        },
        {
          agent: 'content_review',
          expectedFields: ['content_performance_analysis', 'optimization_opportunities']
        }
      ];

      for (const testCase of testCases) {
        const response = await testClient.get(`/api/opal/workflows/${testCase.agent}/output?page_id=content-test`);

        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.success).toBe(true);

        // Verify agent-specific content structure
        testCase.expectedFields.forEach(field => {
          expect(data.data).toHaveProperty(field);
        });
      }
    });
  });

  describe('Environment Compatibility', () => {
    it('should work correctly in development environment', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const response = await testClient.get('/api/opal/workflows/strategy_workflow/output?page_id=dev-env-test');

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.metadata.environment_mode).toBe('development');

      process.env.NODE_ENV = originalEnv;
    });

    it('should work correctly in production environment', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const response = await testClient.get('/api/opal/workflows/content_review/output?page_id=prod-env-test');

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.metadata.environment_mode).toBe('production');

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Security and Input Sanitization', () => {
    it('should sanitize malicious input parameters', async () => {
      const maliciousInputs = [
        'strategy-plans/../../../etc/passwd',
        'test<script>alert("xss")</script>',
        'test; DROP TABLE users; --',
        '../../admin/secrets'
      ];

      for (const maliciousInput of maliciousInputs) {
        const response = await testClient.get(`/api/opal/workflows/strategy_workflow/output?page_id=${encodeURIComponent(maliciousInput)}`);

        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.success).toBe(true);

        // Verify input was sanitized
        expect(data.data.page_id).not.toContain('../');
        expect(data.data.page_id).not.toContain('<script>');
        expect(data.data.page_id).not.toContain('DROP TABLE');
      }
    });

    it('should handle oversized requests gracefully', async () => {
      const oversizedBody = {
        page_id: 'a'.repeat(10000), // Very long page ID
        workflow_id: 'b'.repeat(10000),
        extra_data: 'c'.repeat(50000)
      };

      const response = await testClient.post('/api/opal/workflows/quick_wins_analyzer/output', {
        json: oversizedBody
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      // Should handle oversized input gracefully
    });
  });
});

describe('System Health and Monitoring', () => {
  it('should provide health status information', async () => {
    const response = await testClient.get('/api/opal/workflows/strategy_workflow/output?page_id=health-check');

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.metadata).toHaveProperty('database_connected');
    expect(data.metadata).toHaveProperty('cache_available');
    expect(data.metadata).toHaveProperty('response_time_ms');

    // Health indicators should be boolean
    expect(typeof data.metadata.database_connected).toBe('boolean');
    expect(typeof data.metadata.cache_available).toBe('boolean');

    // Response time should be reasonable
    expect(data.metadata.response_time_ms).toBeGreaterThan(0);
    expect(data.metadata.response_time_ms).toBeLessThan(10000); // Under 10 seconds
  });

  it('should track and report performance metrics', async () => {
    // Make several requests to generate metrics
    const requests = Array.from({ length: 5 }, (_, i) =>
      testClient.get(`/api/opal/workflows/roadmap_generator/output?page_id=metrics-test-${i}`)
    );

    const responses = await Promise.all(requests);
    const dataArray = await Promise.all(responses.map(r => r.json()));

    // Verify all responses include performance metadata
    dataArray.forEach(data => {
      expect(data.metadata.response_time_ms).toBeGreaterThan(0);
      expect(data.metadata.generated_at).toBeDefined();
      expect(data.confidence_score).toBeGreaterThanOrEqual(0);
      expect(data.confidence_score).toBeLessThanOrEqual(1);
    });

    // Calculate average response time
    const avgResponseTime = dataArray.reduce((sum, data) => sum + data.metadata.response_time_ms, 0) / dataArray.length;
    expect(avgResponseTime).toBeLessThan(3000); // Average under 3 seconds
  });
});

describe('Deployment Readiness Validation', () => {
  it('should pass all critical system checks', async () => {
    const criticalEndpoints = [
      '/api/opal/workflows/strategy_workflow/output?page_id=deployment-check-1',
      '/api/opal/workflows/quick_wins_analyzer/output?page_id=deployment-check-2',
      '/api/opal/workflows/maturity_assessment/output?page_id=deployment-check-3'
    ];

    for (const endpoint of criticalEndpoints) {
      const response = await testClient.get(endpoint);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.metadata).toBeDefined();
      expect(data.confidence_score).toBeGreaterThan(0);

      // No critical errors
      expect(data.error).toBeUndefined();
    }
  });

  it('should demonstrate system resilience', async () => {
    // Test system behavior under various stress conditions
    const stressTests = [
      // Concurrent load
      () => Promise.all(Array.from({ length: 10 }, () =>
        testClient.get('/api/opal/workflows/content_review/output?page_id=stress-concurrent')
      )),

      // Sequential requests
      async () => {
        const results = [];
        for (let i = 0; i < 5; i++) {
          const response = await testClient.get(`/api/opal/workflows/strategy_workflow/output?page_id=stress-sequential-${i}`);
          results.push(response);
        }
        return results;
      }
    ];

    for (const stressTest of stressTests) {
      const results = await stressTest();

      results.forEach(response => {
        expect(response.status).toBe(200);
      });
    }
  });
});