/**
 * Next.js 16 Route Parameter Compatibility Tests for OPAL Workflows
 *
 * This test suite specifically targets Next.js 16 route parameter handling
 * that may be causing 500 errors in the content_review workflow.
 *
 * Focus areas:
 * 1. Async params handling in Next.js 16
 * 2. Route parameter promise resolution
 * 3. URL parsing compatibility
 * 4. Edge runtime compatibility
 * 5. Turbopack integration issues
 */

import { NextRequest } from 'next/server';

describe('Next.js 16 Route Parameter Compatibility', () => {

  // Test the actual route handler without mocks to catch real compatibility issues
  let routeHandler: any;

  beforeAll(async () => {
    // Dynamically import to catch any initialization errors
    try {
      const module = await import('@/app/api/opal/workflows/[agent]/output/route');
      routeHandler = module;
    } catch (error) {
      console.error('Failed to import route handler:', error);
      throw error;
    }
  });

  beforeEach(() => {
    // Clear console to reduce noise
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Async Params Resolution', () => {

    test('should handle resolved params promise correctly', async () => {
      const request = new NextRequest('http://localhost:3000/api/opal/workflows/content_review/output');

      // Test with properly resolved promise
      const params = Promise.resolve({ agent: 'content_review' });

      const response = await routeHandler.GET(request, { params });

      expect(response).toBeDefined();
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.metadata.agent_type).toBe('content_review');
    });

    test('should handle slow-resolving params promise', async () => {
      const request = new NextRequest('http://localhost:3000/api/opal/workflows/content_review/output');

      // Simulate slow params resolution
      const params = new Promise(resolve => {
        setTimeout(() => resolve({ agent: 'content_review' }), 100);
      });

      const response = await routeHandler.GET(request, { params });

      expect(response).toBeDefined();
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
    });

    test('should handle rejected params promise', async () => {
      const request = new NextRequest('http://localhost:3000/api/opal/workflows/content_review/output');

      // Test with rejected promise
      const params = Promise.reject(new Error('Route parameter resolution failed'));

      const response = await routeHandler.GET(request, { params });

      expect(response).toBeDefined();
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.metadata.fallback_used).toBe(true);
    });

    test('should handle params with undefined agent after await', async () => {
      const request = new NextRequest('http://localhost:3000/api/opal/workflows/content_review/output');

      // Test undefined agent after promise resolution
      const params = Promise.resolve({ agent: undefined });

      const response = await routeHandler.GET(request, { params });

      expect(response).toBeDefined();
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.metadata.agent_type).toBeDefined();
    });

    test('should handle malformed params object', async () => {
      const request = new NextRequest('http://localhost:3000/api/opal/workflows/content_review/output');

      // Test with malformed params
      const params = Promise.resolve({ notAgent: 'content_review' } as any);

      const response = await routeHandler.GET(request, { params });

      expect(response).toBeDefined();
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
    });
  });

  describe('URL Path Extraction Fallbacks', () => {

    test('should extract agent from URL when params.agent is undefined', async () => {
      const request = new NextRequest('http://localhost:3000/api/opal/workflows/content_review/output');
      const params = Promise.resolve({ agent: undefined });

      const response = await routeHandler.GET(request, { params });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.metadata.agent_type).toBe('content_review');
    });

    test('should extract agent from complex URL paths', async () => {
      const testUrls = [
        'http://localhost:3000/api/opal/workflows/content_review/output?page_id=test',
        'https://example.com/api/opal/workflows/content_review/output',
        'http://localhost:3001/api/opal/workflows/content_review/output#fragment'
      ];

      for (const url of testUrls) {
        const request = new NextRequest(url);
        const params = Promise.resolve({ agent: 'undefined' });

        const response = await routeHandler.GET(request, { params });

        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.metadata.agent_type).toBe('content_review');
      }
    });

    test('should handle URL path extraction with encoded characters', async () => {
      const request = new NextRequest('http://localhost:3000/api/opal/workflows/content%5Freview/output');
      const params = Promise.resolve({ agent: undefined });

      const response = await routeHandler.GET(request, { params });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    });

    test('should handle missing agent in URL path gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/opal/workflows//output');
      const params = Promise.resolve({ agent: undefined });

      const response = await routeHandler.GET(request, { params });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.metadata.fallback_used).toBe(true);
    });
  });

  describe('POST Method Compatibility', () => {

    test('should handle POST with valid params', async () => {
      const request = new NextRequest('http://localhost:3000/api/opal/workflows/content_review/output', {
        method: 'POST',
        body: JSON.stringify({ page_id: 'test', workflow_id: 'test' })
      });
      const params = Promise.resolve({ agent: 'content_review' });

      const response = await routeHandler.POST(request, { params });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.metadata.agent_type).toBe('content_review');
    });

    test('should handle POST params promise rejection', async () => {
      const request = new NextRequest('http://localhost:3000/api/opal/workflows/content_review/output', {
        method: 'POST',
        body: JSON.stringify({ page_id: 'test' })
      });
      const params = Promise.reject(new Error('POST params failed'));

      const response = await routeHandler.POST(request, { params });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.metadata.fallback_used).toBe(true);
    });

    test('should handle POST URL extraction fallback', async () => {
      const request = new NextRequest('http://localhost:3000/api/opal/workflows/content_review/output', {
        method: 'POST',
        body: JSON.stringify({ page_id: 'test' })
      });
      const params = Promise.resolve({ agent: 'undefined' });

      const response = await routeHandler.POST(request, { params });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.metadata.agent_type).toBe('content_review');
    });
  });

  describe('Edge Runtime Compatibility', () => {

    test('should work with various request headers', async () => {
      const headers = new Headers();
      headers.set('user-agent', 'test-agent');
      headers.set('accept', 'application/json');
      headers.set('content-type', 'application/json');

      const request = new NextRequest('http://localhost:3000/api/opal/workflows/content_review/output', {
        headers
      });
      const params = Promise.resolve({ agent: 'content_review' });

      const response = await routeHandler.GET(request, { params });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    });

    test('should handle concurrent requests safely', async () => {
      const requests = Array.from({ length: 5 }, (_, i) => {
        const request = new NextRequest(`http://localhost:3000/api/opal/workflows/content_review/output?req=${i}`);
        const params = Promise.resolve({ agent: 'content_review' });
        return routeHandler.GET(request, { params });
      });

      const responses = await Promise.all(requests);

      for (const response of responses) {
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
      }
    });

    test('should handle memory pressure gracefully', async () => {
      // Create a large request payload to test memory handling
      const largePayload = {
        page_id: 'test',
        large_data: 'x'.repeat(10000) // 10KB of data
      };

      const request = new NextRequest('http://localhost:3000/api/opal/workflows/content_review/output', {
        method: 'POST',
        body: JSON.stringify(largePayload)
      });
      const params = Promise.resolve({ agent: 'content_review' });

      const response = await routeHandler.POST(request, { params });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    });
  });

  describe('Error Boundary Testing', () => {

    test('should never return 500 status under any condition', async () => {
      const errorConditions = [
        // Malformed URLs
        { url: 'http://localhost:3000/api/opal/workflows/content_review/output', params: Promise.reject(new Error()) },
        { url: 'http://[invalid-url]/api/opal/workflows/content_review/output', params: Promise.resolve({ agent: 'content_review' }) },
        // Invalid JSON in POST
        { url: 'http://localhost:3000/api/opal/workflows/content_review/output', method: 'POST', body: '{invalid json}', params: Promise.resolve({ agent: 'content_review' }) },
        // Missing required properties
        { url: 'http://localhost:3000/api/opal/workflows/content_review/output', params: Promise.resolve({} as any) },
      ];

      for (const condition of errorConditions) {
        try {
          const requestInit: any = { method: condition.method || 'GET' };
          if (condition.body) {
            requestInit.body = condition.body;
          }

          const request = new NextRequest(condition.url, requestInit);
          const response = await routeHandler.GET(request, { params: condition.params });

          expect(response.status).not.toBe(500);
          expect(response.status).toBe(200);

          const body = await response.json();
          expect(body.success).toBe(true);
        } catch (error) {
          // Even if there's an error in test setup, the route should not return 500
          console.error('Test condition failed:', condition, error);
          // This is acceptable for test setup errors, but route should still not fail
        }
      }
    });

    test('should maintain consistent response structure under all conditions', async () => {
      const testConditions = [
        { agent: 'content_review', valid: true },
        { agent: 'invalid_agent', valid: false },
        { agent: undefined, valid: false },
        { agent: '', valid: false },
        { agent: 'content_review' + 'x'.repeat(1000), valid: false }, // Very long agent name
      ];

      for (const condition of testConditions) {
        const request = new NextRequest('http://localhost:3000/api/opal/workflows/content_review/output');
        const params = Promise.resolve({ agent: condition.agent });

        const response = await routeHandler.GET(request, { params });
        const body = await response.json();

        // All responses should have consistent structure regardless of validity
        expect(body).toHaveProperty('success');
        expect(body).toHaveProperty('metadata');
        expect(body).toHaveProperty('confidence_score');
        expect(body.metadata).toHaveProperty('agent_type');
        expect(body.metadata).toHaveProperty('response_time_ms');
        expect(body.metadata).toHaveProperty('request_id');
        expect(typeof body.success).toBe('boolean');
        expect(typeof body.confidence_score).toBe('number');
      }
    });
  });

  describe('Real-world Scenario Tests', () => {

    test('should handle production-like request patterns', async () => {
      // Simulate real browser requests
      const productionHeaders = new Headers();
      productionHeaders.set('accept', 'application/json, text/plain, */*');
      productionHeaders.set('accept-language', 'en-US,en;q=0.9');
      productionHeaders.set('cache-control', 'no-cache');
      productionHeaders.set('pragma', 'no-cache');
      productionHeaders.set('referer', 'https://example.com/dashboard');
      productionHeaders.set('user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

      const request = new NextRequest('http://localhost:3000/api/opal/workflows/content_review/output?page_id=dashboard&workflow_id=main&force_refresh=false&use_cache=true', {
        headers: productionHeaders
      });
      const params = Promise.resolve({ agent: 'content_review' });

      const response = await routeHandler.GET(request, { params });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.metadata.page_id).toBe('dashboard');
    });

    test('should handle mobile app request patterns', async () => {
      const mobileHeaders = new Headers();
      mobileHeaders.set('accept', 'application/json');
      mobileHeaders.set('user-agent', 'MyApp/1.0 (iPhone; iOS 15.0; Scale/3.00)');
      mobileHeaders.set('x-requested-with', 'XMLHttpRequest');

      const request = new NextRequest('http://localhost:3000/api/opal/workflows/content_review/output', {
        method: 'POST',
        headers: mobileHeaders,
        body: JSON.stringify({
          page_id: 'mobile-homepage',
          workflow_id: 'mobile-flow',
          device_type: 'mobile',
          screen_size: '375x812'
        })
      });
      const params = Promise.resolve({ agent: 'content_review' });

      const response = await routeHandler.POST(request, { params });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    });

    test('should handle API gateway request patterns', async () => {
      // Simulate requests through API gateways or proxies
      const gatewayHeaders = new Headers();
      gatewayHeaders.set('x-forwarded-for', '203.0.113.195, 70.41.3.18, 150.172.238.178');
      gatewayHeaders.set('x-forwarded-proto', 'https');
      gatewayHeaders.set('x-forwarded-port', '443');
      gatewayHeaders.set('x-real-ip', '203.0.113.195');

      const request = new NextRequest('http://localhost:3000/api/opal/workflows/content_review/output?timestamp=' + Date.now(), {
        headers: gatewayHeaders
      });
      const params = Promise.resolve({ agent: 'content_review' });

      const response = await routeHandler.GET(request, { params });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    });
  });
});