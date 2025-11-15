/**
 * Comprehensive Unit Tests for OPAL Error Handling
 *
 * These tests ensure the OPAL data service and API routes handle errors gracefully
 * and prevent the recurrence of 500 Internal Server Error issues.
 *
 * Tests critical error scenarios to prevent 500 errors:
 * - Database connection failures
 * - Invalid agent types
 * - Network timeouts
 * - Missing environment variables
 * - Retry logic and exponential backoff
 * - Fallback mechanisms
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock, MockedFunction } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { SimpleOpalDataService, simpleOpalService } from '@/lib/simple-opal-data-service';

// Mock external dependencies
vi.mock('@/lib/orchestration/agent-coordinator', () => ({
  agentCoordinator: {
    executeWithCoordination: vi.fn(),
    getCachedResult: vi.fn(),
    forceRefresh: vi.fn()
  }
}));

vi.mock('@/lib/cache/redis-cache', () => ({
  cache: {
    getClient: vi.fn(() => null),
    getCacheMetrics: vi.fn(() => ({ hitRate: 0 }))
  }
}));

// Mock fetch globally
const mockFetch = vi.fn() as MockedFunction<typeof fetch>;
global.fetch = mockFetch;

describe('OPAL Error Handling - SimpleOpalDataService', () => {
  let service: SimpleOpalDataService;
  let originalEnv: typeof process.env;

  beforeEach(() => {
    // Reset service instance
    service = new SimpleOpalDataService();

    // Save original environment
    originalEnv = { ...process.env };

    // Reset all mocks
    vi.clearAllMocks();

    // Reset fetch mock
    mockFetch.mockReset();

    // Reset console methods to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('API Fetch Error Scenarios', () => {
    it('should handle 500 server errors with retry and fallback', async () => {
      // Mock 500 error responses for first 2 attempts, then success
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: () => Promise.resolve('Redis connection failed')
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: () => Promise.resolve('Database connection timeout')
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: { test: 'success on retry' },
            confidence_score: 0.85
          })
        } as Response);

      const result = await service.fetchTierData('strategy-plans', 'osa');

      expect(result).toBeDefined();
      expect(result.data).toEqual({ test: 'success on retry' });
      expect(result.metadata.source).toBe('opal_agent');
      expect(result.metadata.agent_source).toBe('strategy_workflow');
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should use fallback data when all retries fail', async () => {
      // Mock all attempts failing with 500 errors
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve('Persistent server error')
      } as Response);

      const result = await service.fetchTierData('strategy-plans', 'roadmap');

      expect(result).toBeDefined();
      expect(result.metadata.source).toBe('fallback');
      expect(result.data.development_mode).toBe(true);
      expect(result.data.summary).toContain('Development data for strategy-plans-roadmap-overview');
      expect(mockFetch).toHaveBeenCalledTimes(3); // Max retries
    });

    it('should handle network timeout errors', async () => {
      // Mock network timeout
      mockFetch.mockRejectedValue(new Error('Network timeout'));

      const result = await service.fetchTierData('insights', 'analytics');

      expect(result).toBeDefined();
      expect(result.metadata.source).toBe('fallback');
      expect(result.metadata.agent_source).toBe('content_review');
    });

    it('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      } as Response);

      const result = await service.fetchTierData('dxptools', 'overview');

      expect(result).toBeDefined();
      expect(result.metadata.source).toBe('fallback');
    });

    it('should handle AbortController timeout', async () => {
      // Mock a request that gets aborted by timeout
      mockFetch.mockImplementation(() =>
        new Promise((_, reject) => {
          setTimeout(() => reject(new DOMException('Operation was aborted', 'AbortError')), 100);
        })
      );

      const result = await service.fetchTierData('strategy-plans', 'phases');

      expect(result).toBeDefined();
      expect(result.metadata.source).toBe('fallback');
    }, 10000); // 10 second timeout for this test
  });

  describe('Error Classification and Retry Logic', () => {
    it('should correctly identify retryable errors', async () => {
      // Test various retryable error scenarios
      const retryableErrors = [
        'timeout',
        'connection refused',
        'service unavailable',
        'redis connection failed',
        'database connection timeout'
      ];

      for (const errorMsg of retryableErrors) {
        mockFetch.mockReset();

        // First 2 calls fail, third succeeds
        mockFetch
          .mockResolvedValueOnce({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            text: () => Promise.resolve(errorMsg)
          } as Response)
          .mockResolvedValueOnce({
            ok: false,
            status: 503,
            statusText: 'Service Unavailable',
            text: () => Promise.resolve(errorMsg)
          } as Response)
          .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: { recovered: true },
              confidence_score: 0.8
            })
          } as Response);

        const result = await service.fetchTierData('strategy-plans', 'test');
        expect(result.data.recovered).toBe(true);
      }
    });

    it('should not retry non-retryable errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: () => Promise.resolve('Invalid page_id parameter')
      } as Response);

      const result = await service.fetchTierData('invalid-page');

      expect(result).toBeDefined();
      expect(result.metadata.source).toBe('fallback');
      expect(mockFetch).toHaveBeenCalledTimes(1); // No retries for 400 error
    });

    it('should implement exponential backoff for retries', async () => {
      const startTime = Date.now();

      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        text: () => Promise.resolve('Service temporarily unavailable')
      } as Response);

      await service.fetchTierData('strategy-plans', 'test');

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should take at least 3 seconds (1s + 2s + 3s delays, but overlapping with fetch attempts)
      expect(duration).toBeGreaterThan(3000);
    }, 10000); // 10 second timeout for this test
  });

  describe('Agent Source Mapping', () => {
    it('should correctly map page IDs to agent sources', async () => {
      const mappingTests = [
        // For strategy-plans sections
        { tiers: ['strategy-plans', 'osa'], expectedAgent: 'strategy_workflow' },
        { tiers: ['strategy-plans', 'roadmap'], expectedAgent: 'roadmap_generator' },
        { tiers: ['strategy-plans', 'maturity'], expectedAgent: 'maturity_assessment' },
        { tiers: ['strategy-plans', 'quick-wins'], expectedAgent: 'quick_wins_analyzer' },
        // For other sections
        { tiers: ['insights', 'analytics'], expectedAgent: 'content_review' },
        { tiers: ['dxptools'], expectedAgent: 'strategy_workflow' },
        { tiers: ['unknown-section'], expectedAgent: 'strategy_workflow' } // Default fallback
      ];

      for (const { tiers, expectedAgent } of mappingTests) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: { test: true },
            confidence_score: 0.8
          })
        } as Response);

        const result = await service.fetchTierData(...tiers);

        expect(result.metadata.agent_source).toBe(expectedAgent);
      }
    });
  });

  describe('Cache Integration Error Handling', () => {
    it('should use stale cache when agent fails', async () => {
      // Setup: Put something in cache first
      const cacheData = {
        data: { cached: true, timestamp: new Date(Date.now() - 3600000).toISOString() },
        agent_source: 'strategy_workflow',
        confidence_score: 0.7,
        timestamp: Date.now() - 3600000, // 1 hour old
        ttl: 600000
      };

      // Mock the private cache to return stale data
      const serviceWithCache = service as any;
      serviceWithCache.cache.set('tier2:strategy-plans-osa-overview', cacheData);

      // Mock fetch to always fail
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve('All systems down')
      } as Response);

      const result = await service.fetchTierData('strategy-plans', 'osa');

      expect(result).toBeDefined();
      // Should use the stale cached data when fresh fetch fails
      expect(result.metadata.source).toBe('cache');
    });
  });

  describe('Response Validation', () => {
    it('should validate API response structure', async () => {
      // Test various malformed responses
      const malformedResponses = [
        null,
        undefined,
        'not an object',
        { success: true }, // Missing data
        { success: true, data: null }, // Null data
        { data: 'test' }, // Missing success field
      ];

      for (const response of malformedResponses) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(response)
        } as Response);

        const result = await service.fetchTierData('test-page');
        expect(result.metadata.source).toBe('fallback');
      }
    });

    it('should handle confidence score validation', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { test: true },
          confidence_score: 'invalid' // Invalid confidence score
        })
      } as Response);

      const result = await service.fetchTierData('strategy-plans', 'test');

      expect(result).toBeDefined();
      expect(typeof result.metadata.confidence_score).toBe('number');
      expect(result.metadata.confidence_score).toBe(75); // Default fallback in our implementation
    });
  });

  describe('Force Refresh Functionality', () => {
    it('should handle force refresh errors gracefully', async () => {
      // Mock force refresh to not throw errors
      await service.forceRefresh('test-page');

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { force_refreshed: true },
          confidence_score: 0.85
        })
      } as Response);

      const result = await service.fetchTierData('strategy-plans', 'test');

      expect(result).toBeDefined();
      expect(result.data.force_refreshed).toBe(true);
    });
  });
});

describe('OPAL Error Handling - Integration Scenarios', () => {
  let integrationService: SimpleOpalDataService;

  beforeEach(() => {
    integrationService = new SimpleOpalDataService();
  });

  it('should handle complete system failure gracefully', async () => {
    // Simulate complete system failure - API down, everything fails
    mockFetch.mockRejectedValue(new Error('Complete system failure'));

    const result = await integrationService.fetchTierData('critical-page', 'urgent-data');

    expect(result).toBeDefined();
    expect(result.metadata.source).toBe('fallback');
    expect(result.data.development_mode).toBe(true);
    expect(result.metadata.confidence_score).toBeGreaterThan(0);
  });

  it('should maintain service availability during partial failures', async () => {
    // Simulate intermittent failures
    mockFetch
      .mockRejectedValueOnce(new Error('Temporary failure'))
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { recovered: true },
          confidence_score: 0.8
        })
      } as Response);

    const result1 = await integrationService.fetchTierData('test1');
    const result2 = await integrationService.fetchTierData('test2');

    expect(result1.metadata.source).toBe('fallback');
    expect(result2.metadata.source).toBe('opal_agent');
    expect(result2.data.recovered).toBe(true);
  });

  it('should never return undefined or null data', async () => {
    // Mock service to return null/undefined
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(null)
    } as Response);

    const result = await integrationService.fetchTierData('strategy-plans');

    expect(result.data).toBeDefined();
    expect(result.data).not.toBeNull();
    expect(typeof result.data).toBe('object');
  });

  it('should maintain consistent response structure under all conditions', async () => {
    // Test with various error conditions
    const errorConditions = [
      () => { throw new Error('Network error'); },
      () => Promise.resolve({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve('Server error')
      } as Response),
      () => Promise.resolve({
        ok: true,
        json: () => Promise.reject(new Error('JSON error'))
      } as Response)
    ];

    for (const condition of errorConditions) {
      mockFetch.mockImplementationOnce(condition);

      const result = await integrationService.fetchTierData('test');

      // Verify consistent structure
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('metadata');
      expect(result.metadata).toHaveProperty('tier');
      expect(result.metadata).toHaveProperty('source');
      expect(result.metadata).toHaveProperty('timestamp');
      expect(result.metadata).toHaveProperty('agent_source');
      expect(result.metadata).toHaveProperty('confidence_score');
    }
  });

  it('should handle concurrent error scenarios', async () => {
    // Mock failing service
    mockFetch.mockImplementation(() => {
      throw new Error('Service failure');
    });

    // Make multiple concurrent requests
    const promises = Array.from({ length: 5 }, (_, i) =>
      integrationService.fetchTierData('strategy-plans', `test-${i}`)
    );

    const results = await Promise.all(promises);

    // All should succeed with fallback
    results.forEach(result => {
      expect(result).toBeDefined();
      expect(result.metadata.source).toBe('fallback');
    });
  });

  it('should maintain performance under error conditions', async () => {
    const startTime = performance.now();

    // Mock slow failing service
    mockFetch.mockImplementation(() => {
      return new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Slow failure')), 50); // Reduced timeout for test speed
      });
    });

    const result = await integrationService.fetchTierData('strategy-plans', 'quick-wins');

    const duration = performance.now() - startTime;

    expect(result).toBeDefined();
    expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
  });
});