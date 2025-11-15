/**
 * Comprehensive Unit Tests for OPAL Content Review Error Prevention
 *
 * This test suite is designed to prevent recurrence of the 500 Internal Server Error
 * in the content_review workflow and ensure bulletproof operation.
 *
 * Covers:
 * 1. Route parameter handling edge cases
 * 2. Redis connection failures
 * 3. Agent coordinator failures
 * 4. URL parsing issues
 * 5. Agent execution timeouts
 * 6. Fallback mechanisms
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/opal/workflows/[agent]/output/route';

// Mock the agent coordinator and Redis cache
jest.mock('@/lib/orchestration/agent-coordinator', () => ({
  agentCoordinator: {
    executeWithCoordination: jest.fn(),
    getCachedResult: jest.fn(),
    forceRefresh: jest.fn(),
    checkRedisConnection: jest.fn(),
  }
}));

jest.mock('@/lib/cache/redis-cache', () => ({
  cache: {
    getClient: jest.fn(),
    getCacheMetrics: jest.fn().mockReturnValue({ hitRate: 0 })
  }
}));

describe('OPAL Content Review Error Prevention', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset console methods to avoid pollution
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Route Parameter Handling', () => {

    test('should handle valid content_review agent parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/opal/workflows/content_review/output');
      const params = Promise.resolve({ agent: 'content_review' });

      const response = await GET(request, { params });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.metadata.agent_type).toBe('content_review');
    });

    test('should handle undefined agent parameter gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/opal/workflows/content_review/output');
      const params = Promise.resolve({ agent: undefined as any });

      const response = await GET(request, { params });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.metadata.fallback_used).toBe(true);
    });

    test('should extract agent from URL when params fail', async () => {
      const request = new NextRequest('http://localhost:3000/api/opal/workflows/content_review/output');
      const params = Promise.resolve({ agent: 'undefined' });

      const response = await GET(request, { params });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      // Should extract 'content_review' from URL
      expect(body.metadata.agent_type).toBe('content_review');
    });

    test('should handle malformed URLs gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/opal/workflows//output');
      const params = Promise.resolve({ agent: '' });

      const response = await GET(request, { params });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.metadata.fallback_used).toBe(true);
    });

    test('should handle params promise rejection', async () => {
      const request = new NextRequest('http://localhost:3000/api/opal/workflows/content_review/output');
      const params = Promise.reject(new Error('Params parsing failed'));

      const response = await GET(request, { params });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.metadata.fallback_used).toBe(true);
      expect(body.metadata.fallback_reason).toContain('emergency');
    });
  });

  describe('Agent Validation', () => {

    test('should accept supported content_review agent', async () => {
      const request = new NextRequest('http://localhost:3000/api/opal/workflows/content_review/output');
      const params = Promise.resolve({ agent: 'content_review' });

      const response = await GET(request, { params });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.metadata.agent_type).toBe('content_review');
    });

    test('should handle unsupported agent types with fallback', async () => {
      const request = new NextRequest('http://localhost:3000/api/opal/workflows/invalid_agent/output');
      const params = Promise.resolve({ agent: 'invalid_agent' });

      const response = await GET(request, { params });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.metadata.fallback_used).toBe(true);
      expect(body.metadata.fallback_reason).toContain('unsupported_agent');
    });

    test('should handle null/empty agent gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/opal/workflows//output');
      const params = Promise.resolve({ agent: null as any });

      const response = await GET(request, { params });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.metadata.fallback_used).toBe(true);
    });
  });

  describe('Redis Connection Failures', () => {

    test('should handle Redis unavailable during agent execution', async () => {
      const { agentCoordinator } = require('@/lib/orchestration/agent-coordinator');
      agentCoordinator.executeWithCoordination.mockRejectedValue(new Error('Redis connection failed'));

      const request = new NextRequest('http://localhost:3000/api/opal/workflows/content_review/output');
      const params = Promise.resolve({ agent: 'content_review' });

      const response = await GET(request, { params });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.metadata.fallback_used).toBe(true);
    });

    test('should handle cache retrieval failures gracefully', async () => {
      const { agentCoordinator } = require('@/lib/orchestration/agent-coordinator');
      agentCoordinator.getCachedResult.mockRejectedValue(new Error('Cache connection failed'));

      const request = new NextRequest('http://localhost:3000/api/opal/workflows/content_review/output?use_cache=true');
      const params = Promise.resolve({ agent: 'content_review' });

      const response = await GET(request, { params });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.warnings).toContain(expect.stringContaining('Cache retrieval failed'));
    });

    test('should handle force refresh failures without breaking', async () => {
      const { agentCoordinator } = require('@/lib/orchestration/agent-coordinator');
      agentCoordinator.forceRefresh.mockRejectedValue(new Error('Force refresh failed'));

      const request = new NextRequest('http://localhost:3000/api/opal/workflows/content_review/output?force_refresh=true');
      const params = Promise.resolve({ agent: 'content_review' });

      const response = await GET(request, { params });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.warnings).toContain(expect.stringContaining('Force refresh failed'));
    });
  });

  describe('Agent Execution Failures', () => {

    test('should retry agent execution on failure', async () => {
      const { agentCoordinator } = require('@/lib/orchestration/agent-coordinator');

      // Fail first two attempts, succeed on third
      agentCoordinator.executeWithCoordination
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockRejectedValueOnce(new Error('Second attempt failed'))
        .mockResolvedValueOnce({
          success: true,
          data: { test: 'success' },
          confidence_score: 0.8
        });

      const request = new NextRequest('http://localhost:3000/api/opal/workflows/content_review/output');
      const params = Promise.resolve({ agent: 'content_review' });

      const response = await GET(request, { params });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.test).toBe('success');
    });

    test('should use fallback after all retries fail', async () => {
      const { agentCoordinator } = require('@/lib/orchestration/agent-coordinator');
      agentCoordinator.executeWithCoordination.mockRejectedValue(new Error('All attempts failed'));

      const request = new NextRequest('http://localhost:3000/api/opal/workflows/content_review/output');
      const params = Promise.resolve({ agent: 'content_review' });

      const response = await GET(request, { params });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.metadata.fallback_used).toBe(true);
      expect(body.data.fallback_mode).toBe(true);
    });

    test('should handle agent execution timeout', async () => {
      const { agentCoordinator } = require('@/lib/orchestration/agent-coordinator');

      // Simulate timeout
      agentCoordinator.executeWithCoordination.mockImplementation(() =>
        new Promise((resolve) => {
          setTimeout(() => resolve({
            success: false,
            error: 'Agent execution timeout'
          }), 100);
        })
      );

      const request = new NextRequest('http://localhost:3000/api/opal/workflows/content_review/output');
      const params = Promise.resolve({ agent: 'content_review' });

      const response = await GET(request, { params });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.metadata.fallback_used).toBe(true);
    });
  });

  describe('Query Parameter Handling', () => {

    test('should handle malformed query parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/opal/workflows/content_review/output?invalid=param&%malformed');
      const params = Promise.resolve({ agent: 'content_review' });

      const response = await GET(request, { params });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    });

    test('should handle missing page_id gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/opal/workflows/content_review/output');
      const params = Promise.resolve({ agent: 'content_review' });

      const response = await GET(request, { params });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.metadata.page_id).toBe('default'); // Should use default
    });

    test('should handle force_refresh and use_cache parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/opal/workflows/content_review/output?force_refresh=true&use_cache=false');
      const params = Promise.resolve({ agent: 'content_review' });

      const response = await GET(request, { params });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    });
  });

  describe('POST Method Error Prevention', () => {

    test('should handle valid POST request', async () => {
      const request = new NextRequest('http://localhost:3000/api/opal/workflows/content_review/output', {
        method: 'POST',
        body: JSON.stringify({
          page_id: 'test-page',
          workflow_id: 'test-workflow'
        })
      });
      const params = Promise.resolve({ agent: 'content_review' });

      const response = await POST(request, { params });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.metadata.agent_type).toBe('content_review');
    });

    test('should handle malformed POST body gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/opal/workflows/content_review/output', {
        method: 'POST',
        body: 'invalid json'
      });
      const params = Promise.resolve({ agent: 'content_review' });

      const response = await POST(request, { params });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.metadata.fallback_used).toBe(true);
    });

    test('should handle empty POST body', async () => {
      const request = new NextRequest('http://localhost:3000/api/opal/workflows/content_review/output', {
        method: 'POST'
      });
      const params = Promise.resolve({ agent: 'content_review' });

      const response = await POST(request, { params });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    });

    test('should handle POST request parsing failure', async () => {
      const request = new NextRequest('http://localhost:3000/api/opal/workflows/content_review/output', {
        method: 'POST'
      });

      // Mock json() to throw
      jest.spyOn(request, 'json').mockRejectedValue(new Error('JSON parsing failed'));

      const params = Promise.resolve({ agent: 'content_review' });

      const response = await POST(request, { params });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.metadata.fallback_used).toBe(true);
    });
  });

  describe('Content Review Specific Tests', () => {

    test('should return content review fallback data structure', async () => {
      const request = new NextRequest('http://localhost:3000/api/opal/workflows/content_review/output');
      const params = Promise.resolve({ agent: 'content_review' });

      const response = await GET(request, { params });
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('content_score');
      expect(body.data).toHaveProperty('areas_for_improvement');
      expect(body.data).toHaveProperty('performance_metrics');
      expect(body.data.areas_for_improvement).toBeInstanceOf(Array);
      expect(body.data.performance_metrics).toHaveProperty('engagement_rate');
    });

    test('should handle content review with specific page context', async () => {
      const request = new NextRequest('http://localhost:3000/api/opal/workflows/content_review/output?page_id=homepage');
      const params = Promise.resolve({ agent: 'content_review' });

      const response = await GET(request, { params });
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.metadata.page_id).toBe('homepage');
      expect(body.data.page_id).toBe('homepage');
    });

    test('should maintain consistent response format under all failure scenarios', async () => {
      const scenarios = [
        'http://localhost:3000/api/opal/workflows/content_review/output',
        'http://localhost:3000/api/opal/workflows/content_review/output?force_refresh=true',
        'http://localhost:3000/api/opal/workflows/content_review/output?use_cache=false'
      ];

      for (const url of scenarios) {
        const request = new NextRequest(url);
        const params = Promise.resolve({ agent: 'content_review' });

        const response = await GET(request, { params });
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toHaveProperty('success');
        expect(body).toHaveProperty('data');
        expect(body).toHaveProperty('confidence_score');
        expect(body).toHaveProperty('metadata');
        expect(body.metadata).toHaveProperty('agent_type');
        expect(body.metadata).toHaveProperty('generated_at');
        expect(body.metadata).toHaveProperty('response_time_ms');
      }
    });
  });

  describe('Performance and Response Time', () => {

    test('should complete requests within reasonable time limits', async () => {
      const startTime = performance.now();

      const request = new NextRequest('http://localhost:3000/api/opal/workflows/content_review/output');
      const params = Promise.resolve({ agent: 'content_review' });

      const response = await GET(request, { params });
      const endTime = performance.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds

      const body = await response.json();
      expect(body.metadata.response_time_ms).toBeGreaterThan(0);
    });

    test('should include performance metrics in response', async () => {
      const request = new NextRequest('http://localhost:3000/api/opal/workflows/content_review/output');
      const params = Promise.resolve({ agent: 'content_review' });

      const response = await GET(request, { params });
      const body = await response.json();

      expect(body.metadata).toHaveProperty('response_time_ms');
      expect(body.metadata).toHaveProperty('execution_path');
      expect(body.metadata).toHaveProperty('error_count');
      expect(typeof body.metadata.response_time_ms).toBe('number');
    });
  });

  describe('Error Recovery and Resilience', () => {

    test('should never throw unhandled exceptions', async () => {
      // Force various error conditions
      const { agentCoordinator } = require('@/lib/orchestration/agent-coordinator');
      agentCoordinator.executeWithCoordination.mockImplementation(() => {
        throw new Error('Unhandled exception');
      });

      const request = new NextRequest('http://localhost:3000/api/opal/workflows/content_review/output');
      const params = Promise.resolve({ agent: 'content_review' });

      // Should not throw
      const response = await GET(request, { params });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.metadata.fallback_used).toBe(true);
    });

    test('should recover from response creation failures', async () => {
      // Mock NextResponse.json to fail once
      const originalJson = require('next/server').NextResponse.json;
      let failureCount = 0;

      require('next/server').NextResponse.json = jest.fn().mockImplementation((...args) => {
        if (failureCount === 0) {
          failureCount++;
          throw new Error('Response creation failed');
        }
        return originalJson(...args);
      });

      const request = new NextRequest('http://localhost:3000/api/opal/workflows/content_review/output');
      const params = Promise.resolve({ agent: 'content_review' });

      const response = await GET(request, { params });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    });
  });
});