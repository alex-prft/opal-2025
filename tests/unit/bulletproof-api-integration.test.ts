/**
 * Integration Tests for Bulletproof OPAL API
 *
 * These tests validate that the OPAL API endpoint NEVER returns 500 errors
 * under any circumstances and always provides valid data.
 *
 * The key requirement: NO 500 ERRORS, EVER.
 */

import { describe, it, expect, beforeEach, afterEach, vi, MockedFunction } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/orchestration/agent-coordinator', () => ({
  agentCoordinator: {
    executeWithCoordination: vi.fn(),
    getCachedResult: vi.fn(),
    forceRefresh: vi.fn()
  }
}));

import { GET, POST } from '@/app/api/opal/workflows/[agent]/output/route';
import { agentCoordinator } from '@/lib/orchestration/agent-coordinator';

describe('Bulletproof OPAL API - Never Returns 500', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Silence console output for cleaner test runs
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Critical Requirement: Never Return 500', () => {
    it('should never return 500 even when all coordinator methods throw', async () => {
      // Make EVERYTHING fail
      (agentCoordinator.forceRefresh as MockedFunction<any>).mockRejectedValue(new Error('Force refresh failed'));
      (agentCoordinator.getCachedResult as MockedFunction<any>).mockRejectedValue(new Error('Cache failed'));
      (agentCoordinator.executeWithCoordination as MockedFunction<any>).mockRejectedValue(new Error('Execution failed'));

      const mockRequest = new NextRequest('http://localhost:3000/api/opal/workflows/strategy_workflow/output?page_id=test&force_refresh=true');

      const response = await GET(mockRequest, { params: { agent: 'strategy_workflow' } });
      const data = await response.json();

      // CRITICAL: Never 500, always 200
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.confidence_score).toBeGreaterThan(0);
      expect(data.metadata).toBeDefined();
    });

    it('should never return 500 for unsupported agents', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/opal/workflows/invalid_agent/output');

      const response = await GET(mockRequest, { params: { agent: 'invalid_agent' } });
      const data = await response.json();

      // CRITICAL: Never 500, always 200 with meaningful fallback
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.metadata.fallback_used).toBe(true);
      expect(data.metadata.fallback_reason).toBe('unsupported_agent');
    });

    it('should never return 500 for malformed requests', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/opal/workflows/strategy_workflow/output?invalid=params&malformed=data');

      const response = await GET(mockRequest, { params: { agent: 'strategy_workflow' } });

      // CRITICAL: Never 500, always handle gracefully
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
    });

    it('should never return 500 when POST body parsing fails', async () => {
      const mockPOSTRequest = {
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON body')),
        url: 'http://localhost:3000/api/opal/workflows/strategy_workflow/output'
      } as any;

      const response = await POST(mockPOSTRequest, { params: { agent: 'strategy_workflow' } });

      // CRITICAL: Never 500, always handle gracefully
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
    });
  });

  describe('Response Quality Under Failure', () => {
    it('should provide meaningful data even when everything fails', async () => {
      // Simulate complete system failure
      (agentCoordinator.executeWithCoordination as MockedFunction<any>).mockRejectedValue(
        new Error('System completely down')
      );

      const mockRequest = new NextRequest('http://localhost:3000/api/opal/workflows/strategy_workflow/output?page_id=test-page');

      const response = await GET(mockRequest, { params: { agent: 'strategy_workflow' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify fallback data is meaningful
      expect(data.data).toBeDefined();
      expect(data.data.summary).toBeDefined();
      expect(data.data.agent_type).toBe('strategy_workflow');
      expect(data.confidence_score).toBeGreaterThan(0);

      // Verify metadata completeness
      expect(data.metadata.agent_type).toBe('strategy_workflow');
      expect(data.metadata.generated_at).toBeDefined();
      expect(data.metadata.response_time_ms).toBeGreaterThan(0);
      expect(data.metadata.request_id).toBeDefined();
    });

    it('should provide agent-specific fallback data', async () => {
      const agents = ['strategy_workflow', 'roadmap_generator', 'maturity_assessment', 'quick_wins_analyzer', 'content_review'];

      for (const agent of agents) {
        // Force failures to trigger fallback
        (agentCoordinator.executeWithCoordination as MockedFunction<any>).mockRejectedValue(
          new Error(`${agent} failed`)
        );

        const mockRequest = new NextRequest(`http://localhost:3000/api/opal/workflows/${agent}/output?page_id=test`);

        const response = await GET(mockRequest, { params: { agent } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.agent_type).toBe(agent);

        // Verify agent-specific data structure
        switch (agent) {
          case 'strategy_workflow':
            expect(data.data.strategic_priorities).toBeDefined();
            break;
          case 'roadmap_generator':
            expect(data.data.phases).toBeDefined();
            break;
          case 'maturity_assessment':
            expect(data.data.overall_score).toBeDefined();
            break;
          case 'quick_wins_analyzer':
            expect(data.data.quick_wins).toBeDefined();
            break;
          case 'content_review':
            expect(data.data.performance_metrics).toBeDefined();
            break;
        }
      }
    });
  });

  describe('Performance Under Stress', () => {
    it('should handle rapid sequential requests without 500 errors', async () => {
      // Simulate various failure scenarios
      (agentCoordinator.executeWithCoordination as MockedFunction<any>)
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockRejectedValueOnce(new Error('Third failure'));

      const requests = [
        new NextRequest('http://localhost:3000/api/opal/workflows/strategy_workflow/output?page_id=test1'),
        new NextRequest('http://localhost:3000/api/opal/workflows/roadmap_generator/output?page_id=test2'),
        new NextRequest('http://localhost:3000/api/opal/workflows/maturity_assessment/output?page_id=test3')
      ];

      const agents = ['strategy_workflow', 'roadmap_generator', 'maturity_assessment'];

      const responses = await Promise.all(
        requests.map((req, i) => GET(req, { params: { agent: agents[i] } }))
      );

      // ALL responses must be 200
      for (const response of responses) {
        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data).toBeDefined();
      }
    });

    it('should complete responses within reasonable time even during failures', async () => {
      (agentCoordinator.executeWithCoordination as MockedFunction<any>).mockRejectedValue(
        new Error('Simulated slow failure')
      );

      const startTime = Date.now();

      const mockRequest = new NextRequest('http://localhost:3000/api/opal/workflows/strategy_workflow/output?page_id=perf-test');
      const response = await GET(mockRequest, { params: { agent: 'strategy_workflow' } });

      const duration = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Response Structure Consistency', () => {
    it('should always return consistent response structure', async () => {
      const testScenarios = [
        // Successful execution
        () => {
          (agentCoordinator.executeWithCoordination as MockedFunction<any>).mockResolvedValue({
            success: true,
            data: { test: 'success' },
            confidence_score: 0.9
          });
        },
        // Complete failure
        () => {
          (agentCoordinator.executeWithCoordination as MockedFunction<any>).mockRejectedValue(
            new Error('Complete failure')
          );
        },
        // Cache failure only
        () => {
          (agentCoordinator.getCachedResult as MockedFunction<any>).mockRejectedValue(
            new Error('Cache failure')
          );
          (agentCoordinator.executeWithCoordination as MockedFunction<any>).mockResolvedValue({
            success: true,
            data: { test: 'success after cache failure' },
            confidence_score: 0.8
          });
        }
      ];

      for (let i = 0; i < testScenarios.length; i++) {
        const scenario = testScenarios[i];
        scenario();

        const mockRequest = new NextRequest(`http://localhost:3000/api/opal/workflows/strategy_workflow/output?page_id=test-${i}`);
        const response = await GET(mockRequest, { params: { agent: 'strategy_workflow' } });
        const data = await response.json();

        // Verify consistent structure
        expect(response.status).toBe(200);
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

        vi.clearAllMocks();
      }
    });
  });

  describe('Zero 500 Error Guarantee', () => {
    it('should NEVER return 500 status under any conceivable failure', async () => {
      const extremeFailureScenarios = [
        // Coordinator throws non-Error objects
        () => (agentCoordinator.executeWithCoordination as MockedFunction<any>).mockRejectedValue('string error'),
        () => (agentCoordinator.executeWithCoordination as MockedFunction<any>).mockRejectedValue(null),
        () => (agentCoordinator.executeWithCoordination as MockedFunction<any>).mockRejectedValue(undefined),
        () => (agentCoordinator.executeWithCoordination as MockedFunction<any>).mockRejectedValue(42),
        () => (agentCoordinator.executeWithCoordination as MockedFunction<any>).mockRejectedValue({ weird: 'object' }),

        // Multiple cascading failures
        () => {
          (agentCoordinator.forceRefresh as MockedFunction<any>).mockRejectedValue(new Error('Refresh failed'));
          (agentCoordinator.getCachedResult as MockedFunction<any>).mockRejectedValue(new Error('Cache failed'));
          (agentCoordinator.executeWithCoordination as MockedFunction<any>).mockRejectedValue(new Error('Execution failed'));
        }
      ];

      for (let i = 0; i < extremeFailureScenarios.length; i++) {
        const scenario = extremeFailureScenarios[i];
        scenario();

        const mockRequest = new NextRequest(`http://localhost:3000/api/opal/workflows/strategy_workflow/output?page_id=extreme-test-${i}`);

        try {
          const response = await GET(mockRequest, { params: { agent: 'strategy_workflow' } });

          // ABSOLUTE REQUIREMENT: Never 500
          expect(response.status).toBe(200);

          const data = await response.json();
          expect(data.success).toBe(true);

        } catch (unhandledException) {
          // If our bulletproof implementation throws, the test should fail
          throw new Error(`Bulletproof API threw unhandled exception in scenario ${i}: ${unhandledException}`);
        }

        vi.clearAllMocks();
      }
    });
  });
});