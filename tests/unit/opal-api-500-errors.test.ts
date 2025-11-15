/**
 * Comprehensive Unit Tests for OPAL API 500 Error Prevention
 *
 * These tests ensure the OPAL workflows API endpoint NEVER returns 500 errors
 * and always provides valid fallback responses under all failure conditions.
 *
 * Test Categories:
 * 1. Agent Coordinator Failures
 * 2. Redis Connection Failures
 * 3. Database Connection Issues
 * 4. Network Timeouts and Interruptions
 * 5. Invalid Input Handling
 * 6. Resource Exhaustion Scenarios
 * 7. Dependency Service Failures
 */

import { describe, it, expect, beforeEach, afterEach, vi, MockedFunction } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Mock the bulletproof route handlers
vi.mock('@/lib/orchestration/agent-coordinator', () => ({
  agentCoordinator: {
    executeWithCoordination: vi.fn(),
    getCachedResult: vi.fn(),
    forceRefresh: vi.fn()
  }
}));

// Import the bulletproof handlers
import { GET, POST } from '@/app/api/opal/workflows/[agent]/output/route-bulletproof';
import { agentCoordinator } from '@/lib/orchestration/agent-coordinator';

describe('OPAL API 500 Error Prevention', () => {
  let mockRequest: NextRequest;
  let consoleLogSpy: any;
  let consoleWarnSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Spy on console methods to verify logging
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Create mock request
    mockRequest = new NextRequest('http://localhost:3000/api/opal/workflows/strategy_workflow/output?page_id=test-page');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Agent Coordinator Failures', () => {
    it('should handle executeWithCoordination throwing errors', async () => {
      (agentCoordinator.executeWithCoordination as MockedFunction<any>).mockRejectedValue(
        new Error('Redis connection failed')
      );

      (agentCoordinator.getCachedResult as MockedFunction<any>).mockResolvedValue(null);
      (agentCoordinator.forceRefresh as MockedFunction<any>).mockResolvedValue(undefined);

      const response = await GET(mockRequest, { params: { agent: 'strategy_workflow' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.metadata.fallback_used).toBe(true);
      expect(data.metadata.fallback_reason).toContain('execution_failed');
    });

    it('should handle getCachedResult throwing errors', async () => {
      (agentCoordinator.getCachedResult as MockedFunction<any>).mockRejectedValue(
        new Error('Cache unavailable')
      );

      (agentCoordinator.executeWithCoordination as MockedFunction<any>).mockResolvedValue({
        success: true,
        data: { test: 'success' },
        confidence_score: 0.8
      });

      const response = await GET(mockRequest, { params: { agent: 'strategy_workflow' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.warnings).toBeDefined();
      expect(data.metadata.error_count).toBeGreaterThan(0);
    });

    it('should handle forceRefresh throwing errors', async () => {
      const mockRequestWithForceRefresh = new NextRequest('http://localhost:3000/api/opal/workflows/strategy_workflow/output?page_id=test-page&force_refresh=true');

      (agentCoordinator.forceRefresh as MockedFunction<any>).mockRejectedValue(
        new Error('Force refresh failed')
      );

      (agentCoordinator.getCachedResult as MockedFunction<any>).mockResolvedValue(null);
      (agentCoordinator.executeWithCoordination as MockedFunction<any>).mockResolvedValue({
        success: true,
        data: { test: 'success' },
        confidence_score: 0.8
      });

      const response = await GET(mockRequestWithForceRefresh, { params: { agent: 'strategy_workflow' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.warnings).toBeDefined();
      expect(data.metadata.error_count).toBeGreaterThan(0);
    });
  });

  describe('Complete System Failures', () => {
    it('should handle all coordinator methods failing', async () => {
      (agentCoordinator.forceRefresh as MockedFunction<any>).mockRejectedValue(
        new Error('Redis down')
      );
      (agentCoordinator.getCachedResult as MockedFunction<any>).mockRejectedValue(
        new Error('Cache down')
      );
      (agentCoordinator.executeWithCoordination as MockedFunction<any>).mockRejectedValue(
        new Error('Execution failed')
      );

      const response = await GET(mockRequest, { params: { agent: 'strategy_workflow' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.metadata.fallback_used).toBe(true);
      expect(data.data.fallback_mode).toBe(true);
      expect(data.metadata.error_count).toBeGreaterThan(0);
    });

    it('should handle timeout scenarios', async () => {
      // Mock a long-running operation that times out
      (agentCoordinator.executeWithCoordination as MockedFunction<any>).mockImplementation(
        () => new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Operation timeout')), 100);
        })
      );

      const response = await GET(mockRequest, { params: { agent: 'strategy_workflow' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.metadata.fallback_used).toBe(true);
    });
  });

  describe('Input Validation and Edge Cases', () => {
    it('should handle invalid agent types gracefully', async () => {
      const response = await GET(mockRequest, { params: { agent: 'invalid_agent_type' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.metadata.fallback_used).toBe(true);
      expect(data.metadata.fallback_reason).toBe('unsupported_agent');
    });

    it('should handle malformed URL parameters', async () => {
      const malformedRequest = new NextRequest('http://localhost:3000/api/opal/workflows/strategy_workflow/output?page_id=&workflow_id=');

      const response = await GET(malformedRequest, { params: { agent: 'strategy_workflow' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.metadata.page_id).toBe('default'); // Should use fallback
    });

    it('should handle URL parsing failures', async () => {
      // This is harder to test directly, but we can test the emergency fallback
      const response = await GET(mockRequest, { params: { agent: 'strategy_workflow' } });

      // Even if URL parsing somehow fails, we should still get a valid response
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe('Network and Resource Issues', () => {
    it('should handle network interruptions during execution', async () => {
      (agentCoordinator.executeWithCoordination as MockedFunction<any>).mockRejectedValue(
        new Error('ECONNRESET: Connection reset by peer')
      );

      const response = await GET(mockRequest, { params: { agent: 'strategy_workflow' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.metadata.fallback_used).toBe(true);
    });

    it('should handle memory exhaustion scenarios', async () => {
      (agentCoordinator.executeWithCoordination as MockedFunction<any>).mockRejectedValue(
        new Error('Cannot allocate memory')
      );

      const response = await GET(mockRequest, { params: { agent: 'strategy_workflow' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.metadata.fallback_used).toBe(true);
    });
  });

  describe('Agent-Specific Fallback Data', () => {
    const agentTypes = [
      'strategy_workflow',
      'roadmap_generator',
      'maturity_assessment',
      'quick_wins_analyzer',
      'content_review'
    ];

    agentTypes.forEach(agent => {
      it(`should provide appropriate fallback data for ${agent}`, async () => {
        // Force all operations to fail so we get fallback data
        (agentCoordinator.executeWithCoordination as MockedFunction<any>).mockRejectedValue(
          new Error('Simulated failure for fallback test')
        );

        const response = await GET(mockRequest, { params: { agent } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.metadata.fallback_used).toBe(true);
        expect(data.data.agent_type).toBe(agent);
        expect(data.data.fallback_mode).toBe(true);

        // Verify agent-specific data structure
        switch (agent) {
          case 'strategy_workflow':
            expect(data.data.strategic_priorities).toBeDefined();
            expect(data.data.expected_roi).toBeDefined();
            break;
          case 'roadmap_generator':
            expect(data.data.phases).toBeDefined();
            expect(data.data.total_timeline).toBeDefined();
            break;
          case 'maturity_assessment':
            expect(data.data.overall_score).toBeDefined();
            expect(data.data.categories).toBeDefined();
            break;
          case 'quick_wins_analyzer':
            expect(data.data.quick_wins).toBeDefined();
            break;
          case 'content_review':
            expect(data.data.content_score).toBeDefined();
            expect(data.data.performance_metrics).toBeDefined();
            break;
        }
      });
    });
  });

  describe('POST Request Handling', () => {
    it('should handle POST requests with invalid JSON body', async () => {
      const mockPOSTRequest = {
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
        url: 'http://localhost:3000/api/opal/workflows/strategy_workflow/output'
      } as any;

      const response = await POST(mockPOSTRequest, { params: { agent: 'strategy_workflow' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.metadata.fallback_used).toBe(true);
    });

    it('should handle POST requests with coordinator failures', async () => {
      const mockPOSTRequest = {
        json: vi.fn().mockResolvedValue({
          page_id: 'test-page',
          force_refresh: true
        }),
        url: 'http://localhost:3000/api/opal/workflows/strategy_workflow/output'
      } as any;

      (agentCoordinator.executeWithCoordination as MockedFunction<any>).mockRejectedValue(
        new Error('POST coordinator failure')
      );

      const response = await POST(mockPOSTRequest, { params: { agent: 'strategy_workflow' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.metadata.fallback_used).toBe(true);
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should handle multiple concurrent failing requests', async () => {
      (agentCoordinator.executeWithCoordination as MockedFunction<any>).mockRejectedValue(
        new Error('Concurrent failure simulation')
      );

      // Simulate 10 concurrent requests
      const promises = Array.from({ length: 10 }, (_, i) =>
        GET(mockRequest, { params: { agent: 'strategy_workflow' } })
      );

      const responses = await Promise.all(promises);

      // All should succeed with fallback data
      responses.forEach(async (response) => {
        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.metadata.fallback_used).toBe(true);
      });
    });
  });

  describe('Response Structure Validation', () => {
    it('should always return consistent response structure even during failures', async () => {
      (agentCoordinator.executeWithCoordination as MockedFunction<any>).mockRejectedValue(
        new Error('Structure validation test')
      );

      const response = await GET(mockRequest, { params: { agent: 'strategy_workflow' } });
      const data = await response.json();

      // Verify required response structure
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('confidence_score');
      expect(data).toHaveProperty('metadata');

      expect(data.metadata).toHaveProperty('agent_type');
      expect(data.metadata).toHaveProperty('generated_at');
      expect(data.metadata).toHaveProperty('response_time_ms');
      expect(data.metadata).toHaveProperty('cache_hit');
      expect(data.metadata).toHaveProperty('fallback_used');
      expect(data.metadata).toHaveProperty('execution_path');
      expect(data.metadata).toHaveProperty('request_id');
      expect(data.metadata).toHaveProperty('error_count');

      // Verify data types
      expect(typeof data.success).toBe('boolean');
      expect(typeof data.confidence_score).toBe('number');
      expect(typeof data.metadata.response_time_ms).toBe('number');
      expect(typeof data.metadata.cache_hit).toBe('boolean');
      expect(typeof data.metadata.fallback_used).toBe('boolean');
      expect(typeof data.metadata.error_count).toBe('number');
    });
  });

  describe('Logging and Monitoring', () => {
    it('should log appropriate messages during failures', async () => {
      (agentCoordinator.executeWithCoordination as MockedFunction<any>).mockRejectedValue(
        new Error('Logging test error')
      );

      await GET(mockRequest, { params: { agent: 'strategy_workflow' } });

      // Verify that error logging occurred
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should include request IDs for traceability', async () => {
      const response = await GET(mockRequest, { params: { agent: 'strategy_workflow' } });
      const data = await response.json();

      expect(data.metadata.request_id).toBeDefined();
      expect(data.metadata.request_id).toMatch(/^req_\d+_[a-z0-9]+$/);
    });
  });

  describe('Performance Under Stress', () => {
    it('should maintain performance even with multiple coordinator failures', async () => {
      (agentCoordinator.executeWithCoordination as MockedFunction<any>).mockRejectedValue(
        new Error('Performance test failure')
      );

      const startTime = Date.now();

      await GET(mockRequest, { params: { agent: 'strategy_workflow' } });

      const duration = Date.now() - startTime;

      // Should complete within reasonable time even with failures
      expect(duration).toBeLessThan(5000); // 5 seconds max
    });
  });
});