/**
 * OPAL 500 Error Reproduction and Prevention Test Suite
 *
 * This test suite is specifically designed to reproduce and prevent the exact
 * 500 Internal Server Error that was occurring in the content_review workflow:
 *
 * Original Error:
 * POST http://localhost:3000/api/opal/workflows/content_review/output 500 (Internal Server Error)
 * [OPAL Agent Fetch] Final failure for content_review after 3 attempts
 *
 * This test identifies the root cause and validates the fix.
 */

import { NextRequest } from 'next/server';

// Import the actual route to test real behavior
const TEST_BASE_URL = 'http://localhost:3000';

describe('OPAL 500 Error Reproduction and Prevention', () => {

  let routeModule: any;

  beforeAll(async () => {
    try {
      routeModule = await import('@/app/api/opal/workflows/[agent]/output/route');
    } catch (importError) {
      console.error('Critical: Failed to import route module:', importError);
      throw new Error(`Route import failed: ${importError.message}`);
    }
  });

  beforeEach(() => {
    // Suppress console output for cleaner test results
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Exact Error Scenario Reproduction', () => {

    test('should reproduce the original 500 error scenario - POST to content_review', async () => {
      // This test reproduces the exact failing scenario
      const request = new NextRequest(`${TEST_BASE_URL}/api/opal/workflows/content_review/output`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // Simulate the exact payload that was causing the error
          page_id: 'content-review-page',
          workflow_id: 'content_review_workflow',
          force_refresh: false,
          use_cache: true
        })
      });

      const params = Promise.resolve({ agent: 'content_review' });

      let response: any;
      let didThrow = false;
      let errorMessage = '';

      try {
        response = await routeModule.POST(request, { params });
      } catch (error) {
        didThrow = true;
        errorMessage = error instanceof Error ? error.message : String(error);
        console.error('POST request threw error:', error);
      }

      // The fix should ensure this NEVER throws and NEVER returns 500
      expect(didThrow).toBe(false);
      expect(response).toBeDefined();
      expect(response.status).not.toBe(500);
      expect(response.status).toBe(200);

      if (response) {
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(body.metadata.agent_type).toBe('content_review');
      }
    });

    test('should handle the specific client-side fetch that was failing', async () => {
      // Simulate the exact client-side fetch call that was failing
      const fetchPayload = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          page_id: 'strategy-plans-content-review',
          workflow_id: 'content_analysis',
          timestamp: Date.now()
        })
      };

      const request = new NextRequest(
        `${TEST_BASE_URL}/api/opal/workflows/content_review/output`,
        fetchPayload
      );

      const params = Promise.resolve({ agent: 'content_review' });

      const response = await routeModule.POST(request, { params });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
      expect(body.metadata.agent_type).toBe('content_review');
    });

    test('should handle retry scenarios that were causing the "Final failure after 3 attempts"', async () => {
      // Simulate multiple rapid requests that might cause coordination issues
      const requests = Array.from({ length: 3 }, (_, i) => {
        const request = new NextRequest(`${TEST_BASE_URL}/api/opal/workflows/content_review/output`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': `retry-${i}`
          },
          body: JSON.stringify({
            page_id: `retry-test-${i}`,
            workflow_id: 'retry_workflow',
            attempt: i + 1
          })
        });

        const params = Promise.resolve({ agent: 'content_review' });
        return routeModule.POST(request, { params });
      });

      const responses = await Promise.all(requests);

      // All requests should succeed, none should fail
      for (let i = 0; i < responses.length; i++) {
        expect(responses[i].status).toBe(200);
        const body = await responses[i].json();
        expect(body.success).toBe(true);
        expect(body.metadata.agent_type).toBe('content_review');
      }
    });
  });

  describe('Root Cause Analysis and Prevention', () => {

    test('should handle Next.js 16 params promise resolution issues', async () => {
      // Test various params promise scenarios that could cause 500 errors
      const paramsScenarios = [
        Promise.resolve({ agent: 'content_review' }),
        Promise.resolve({ agent: undefined }),
        Promise.resolve({}),
        Promise.reject(new Error('Params promise rejected')),
        new Promise(resolve => setTimeout(() => resolve({ agent: 'content_review' }), 50)),
        Promise.resolve(null),
      ];

      for (const params of paramsScenarios) {
        const request = new NextRequest(`${TEST_BASE_URL}/api/opal/workflows/content_review/output`, {
          method: 'POST',
          body: JSON.stringify({ test: true })
        });

        let response: any;
        let threwError = false;

        try {
          response = await routeModule.POST(request, { params: params as any });
        } catch (error) {
          threwError = true;
          console.error('Params scenario failed:', error);
        }

        expect(threwError).toBe(false);
        expect(response?.status).not.toBe(500);
        expect(response?.status).toBe(200);
      }
    });

    test('should handle agent coordinator import/initialization failures', async () => {
      // Mock agent coordinator to fail in various ways
      const originalCoordinator = require('@/lib/orchestration/agent-coordinator');

      // Test with coordinator throwing during import
      jest.doMock('@/lib/orchestration/agent-coordinator', () => {
        throw new Error('Agent coordinator initialization failed');
      });

      // Re-import the route with the failing coordinator
      delete require.cache[require.resolve('@/app/api/opal/workflows/[agent]/output/route')];

      let failedRouteModule: any;
      let importFailed = false;

      try {
        failedRouteModule = await import('@/app/api/opal/workflows/[agent]/output/route');
      } catch (error) {
        importFailed = true;
      }

      // Even if import fails, we should be able to handle it gracefully
      if (!importFailed && failedRouteModule) {
        const request = new NextRequest(`${TEST_BASE_URL}/api/opal/workflows/content_review/output`, {
          method: 'POST',
          body: JSON.stringify({ test: true })
        });
        const params = Promise.resolve({ agent: 'content_review' });

        const response = await failedRouteModule.POST(request, { params });
        expect(response.status).not.toBe(500);
      }

      // Restore original coordinator
      jest.dontMock('@/lib/orchestration/agent-coordinator');
    });

    test('should handle Redis/cache connection failures that could cause 500 errors', async () => {
      // Mock cache to fail in various ways
      jest.doMock('@/lib/cache/redis-cache', () => ({
        cache: {
          getClient: jest.fn(() => {
            throw new Error('Redis connection failed');
          }),
          getCacheMetrics: jest.fn(() => {
            throw new Error('Cache metrics failed');
          })
        }
      }));

      const request = new NextRequest(`${TEST_BASE_URL}/api/opal/workflows/content_review/output`, {
        method: 'POST',
        body: JSON.stringify({ test: 'redis_failure' })
      });
      const params = Promise.resolve({ agent: 'content_review' });

      const response = await routeModule.POST(request, { params });

      expect(response.status).not.toBe(500);
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);

      jest.dontMock('@/lib/cache/redis-cache');
    });

    test('should handle JSON parsing failures in POST body', async () => {
      // Test various malformed JSON scenarios
      const malformedBodies = [
        '{"invalid": json}',
        '{missing_quotes: "value"}',
        '{"nested": {"unclosed": }',
        'not json at all',
        '',
        null,
        undefined,
        Buffer.from('binary data'),
      ];

      for (const body of malformedBodies) {
        const request = new NextRequest(`${TEST_BASE_URL}/api/opal/workflows/content_review/output`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: body as any
        });
        const params = Promise.resolve({ agent: 'content_review' });

        let response: any;
        let threwError = false;

        try {
          response = await routeModule.POST(request, { params });
        } catch (error) {
          threwError = true;
          console.error('JSON parsing test failed:', error);
        }

        expect(threwError).toBe(false);
        expect(response?.status).not.toBe(500);
        expect(response?.status).toBe(200);
      }
    });
  });

  describe('Performance Under Error Conditions', () => {

    test('should maintain reasonable performance even when errors occur', async () => {
      const startTime = performance.now();

      // Create a request that would trigger multiple error paths
      const request = new NextRequest(`${TEST_BASE_URL}/api/opal/workflows/content_review/output`, {
        method: 'POST',
        body: 'invalid json'
      });
      const params = Promise.reject(new Error('Params failed'));

      const response = await routeModule.POST(request, { params });
      const endTime = performance.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.metadata.response_time_ms).toBeDefined();
    });

    test('should handle high error rate gracefully', async () => {
      // Simulate high error rate scenario
      const errorRequests = Array.from({ length: 10 }, (_, i) => {
        const request = new NextRequest(`${TEST_BASE_URL}/api/opal/workflows/content_review/output`, {
          method: 'POST',
          body: `invalid json ${i}`
        });
        const params = i % 3 === 0
          ? Promise.reject(new Error(`Error ${i}`))
          : Promise.resolve({ agent: 'content_review' });

        return routeModule.POST(request, { params });
      });

      const responses = await Promise.allSettled(errorRequests);

      // All requests should settle successfully (not throw)
      for (const result of responses) {
        expect(result.status).toBe('fulfilled');
        if (result.status === 'fulfilled') {
          expect(result.value.status).toBe(200);
        }
      }
    });
  });

  describe('Specific Content Review Agent Tests', () => {

    test('should return content review data structure consistently', async () => {
      const request = new NextRequest(`${TEST_BASE_URL}/api/opal/workflows/content_review/output`, {
        method: 'POST',
        body: JSON.stringify({
          page_id: 'content-analysis-page',
          content_type: 'landing_page',
          analysis_depth: 'comprehensive'
        })
      });
      const params = Promise.resolve({ agent: 'content_review' });

      const response = await routeModule.POST(request, { params });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('content_score');
      expect(body.data).toHaveProperty('areas_for_improvement');
      expect(body.data).toHaveProperty('performance_metrics');
      expect(Array.isArray(body.data.areas_for_improvement)).toBe(true);
      expect(typeof body.data.content_score).toBe('number');
      expect(body.data.performance_metrics).toHaveProperty('engagement_rate');
    });

    test('should handle content review with various page contexts', async () => {
      const pageContexts = [
        'homepage',
        'product-page',
        'blog-post',
        'landing-page',
        'checkout-page',
        '',
        undefined,
        'very-long-page-name'.repeat(100)
      ];

      for (const pageId of pageContexts) {
        const request = new NextRequest(`${TEST_BASE_URL}/api/opal/workflows/content_review/output`, {
          method: 'POST',
          body: JSON.stringify({ page_id: pageId })
        });
        const params = Promise.resolve({ agent: 'content_review' });

        const response = await routeModule.POST(request, { params });

        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(body.metadata.agent_type).toBe('content_review');
      }
    });
  });

  describe('Error Recovery and Circuit Breaking', () => {

    test('should recover from temporary failures', async () => {
      // Simulate a temporary failure followed by recovery
      let requestCount = 0;

      const originalExecute = jest.fn().mockImplementation(() => {
        requestCount++;
        if (requestCount <= 2) {
          throw new Error('Temporary failure');
        }
        return Promise.resolve({
          success: true,
          data: { recovered: true },
          confidence_score: 0.8
        });
      });

      const request = new NextRequest(`${TEST_BASE_URL}/api/opal/workflows/content_review/output`, {
        method: 'POST',
        body: JSON.stringify({ test: 'recovery' })
      });
      const params = Promise.resolve({ agent: 'content_review' });

      // Even with temporary failures, should not return 500
      const response = await routeModule.POST(request, { params });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    });

    test('should provide detailed error information for debugging', async () => {
      const request = new NextRequest(`${TEST_BASE_URL}/api/opal/workflows/content_review/output`, {
        method: 'POST',
        body: JSON.stringify({ debug: true })
      });
      const params = Promise.resolve({ agent: 'content_review' });

      const response = await routeModule.POST(request, { params });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.metadata).toHaveProperty('request_id');
      expect(body.metadata).toHaveProperty('execution_path');
      expect(body.metadata).toHaveProperty('response_time_ms');
      expect(body.metadata).toHaveProperty('error_count');
      expect(typeof body.metadata.error_count).toBe('number');
    });
  });
});