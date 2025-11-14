/**
 * Health API Test Suite
 * Comprehensive tests for health endpoints with fallback scenarios
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET as healthGET, POST as healthPOST } from '@/app/api/opal/health/route';
import { HealthService } from '@/lib/health/health-service';

// Mock dependencies
jest.mock('@/lib/health/health-service');

const mockHealthService = HealthService as jest.MockedClass<typeof HealthService>;

describe('Health API Endpoints', () => {
  let mockService: jest.Mocked<HealthService>;

  beforeEach(() => {
    mockService = {
      getHealth: jest.fn(),
      forceRefresh: jest.fn(),
      getCached: jest.fn(),
    } as any;

    mockHealthService.getInstance = jest.fn().mockReturnValue(mockService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/opal/health', () => {
    it('should return healthy status with live data', async () => {
      const mockHealthData = {
        status: 'healthy',
        checks: {
          database: {
            status: 'connected',
            latency_ms: 25,
            last_check: new Date().toISOString()
          },
          opal_api: {
            status: 'available',
            response_time_ms: 150,
            last_check: new Date().toISOString()
          },
          webhooks: {
            status: 'active',
            last_received: new Date(Date.now() - 30000).toISOString(), // 30 seconds ago
            last_check: new Date().toISOString()
          },
          workflow_engine: {
            status: 'operational',
            active_workflows: 3,
            last_check: new Date().toISOString()
          }
        },
        timestamp: new Date().toISOString(),
        fallback_used: false,
        cache_ttl_seconds: 60
      };

      mockService.getHealth.mockResolvedValue(mockHealthData);

      const request = new NextRequest('http://localhost:3000/api/opal/health');
      const response = await healthGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.data.status).toBe('healthy');
      expect(data.data.checks.database.status).toBe('connected');
      expect(data.data.checks.database.latency_ms).toBe(25);
      expect(data.data.fallback_used).toBe(false);
      expect(data.cached).toBe(false);
      expect(response.headers.get('X-Health-Status')).toBe('healthy');
      expect(response.headers.get('X-Fallback-Used')).toBe('false');
    });

    it('should return degraded status with partial failures', async () => {
      const mockHealthData = {
        status: 'degraded',
        checks: {
          database: {
            status: 'connected',
            latency_ms: 100,
            last_check: new Date().toISOString()
          },
          opal_api: {
            status: 'degraded',
            response_time_ms: 5000,
            last_error: 'Timeout after 3000ms',
            last_check: new Date().toISOString()
          },
          webhooks: {
            status: 'active',
            last_received: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
            last_check: new Date().toISOString()
          },
          workflow_engine: {
            status: 'operational',
            active_workflows: 1,
            last_check: new Date().toISOString()
          }
        },
        timestamp: new Date().toISOString(),
        fallback_used: false,
        cache_ttl_seconds: 30, // Reduced TTL for degraded state
        warnings: ['OPAL API experiencing high latency', 'No recent webhook activity']
      };

      mockService.getHealth.mockResolvedValue(mockHealthData);

      const request = new NextRequest('http://localhost:3000/api/opal/health');
      const response = await healthGET(request);
      const data = await response.json();

      expect(response.status).toBe(200); // Always 200 for monitoring compatibility
      expect(data.status).toBe('degraded');
      expect(data.data.checks.opal_api.status).toBe('degraded');
      expect(data.data.warnings).toHaveLength(2);
      expect(response.headers.get('X-Health-Status')).toBe('degraded');
    });

    it('should return unhealthy status with multiple failures', async () => {
      const mockHealthData = {
        status: 'unhealthy',
        checks: {
          database: {
            status: 'disconnected',
            last_error: 'Connection refused',
            last_check: new Date().toISOString()
          },
          opal_api: {
            status: 'unavailable',
            last_error: 'Network timeout',
            last_check: new Date().toISOString()
          },
          webhooks: {
            status: 'inactive',
            last_received: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
            last_check: new Date().toISOString()
          },
          workflow_engine: {
            status: 'down',
            last_error: 'Service unavailable',
            active_workflows: 0,
            last_check: new Date().toISOString()
          }
        },
        timestamp: new Date().toISOString(),
        fallback_used: false,
        errors: ['Database connection failed', 'OPAL API unreachable', 'Workflow engine down']
      };

      mockService.getHealth.mockResolvedValue(mockHealthData);

      const request = new NextRequest('http://localhost:3000/api/opal/health');
      const response = await healthGET(request);
      const data = await response.json();

      expect(response.status).toBe(200); // Still 200 for monitoring
      expect(data.status).toBe('unhealthy');
      expect(data.data.errors).toHaveLength(3);
      expect(response.headers.get('X-Health-Status')).toBe('unhealthy');
    });

    it('should use cached data when live check fails', async () => {
      const mockCachedData = {
        status: 'degraded',
        checks: {
          database: { status: 'connected', latency_ms: 50 },
          opal_api: { status: 'available', response_time_ms: 200 },
          webhooks: { status: 'active' },
          workflow_engine: { status: 'operational', active_workflows: 2 }
        },
        timestamp: new Date(Date.now() - 120000).toISOString(), // 2 minutes ago
        fallback_used: true,
        cache_age_ms: 120000
      };

      mockService.getHealth.mockRejectedValue(new Error('Health check service unavailable'));
      mockService.getCached.mockReturnValue(mockCachedData);

      const request = new NextRequest('http://localhost:3000/api/opal/health');
      const response = await healthGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('degraded');
      expect(data.data.fallback_used).toBe(true);
      expect(data.cached).toBe(true);
      expect(data.error).toBe('Health check failed, using cached data');
      expect(response.headers.get('X-Health-Status')).toBe('degraded');
      expect(response.headers.get('X-Fallback-Used')).toBe('true');
    });

    it('should return minimal response when no cached data available', async () => {
      mockService.getHealth.mockRejectedValue(new Error('Complete system failure'));
      mockService.getCached.mockReturnValue(null);

      const request = new NextRequest('http://localhost:3000/api/opal/health');
      const response = await healthGET(request);
      const data = await response.json();

      expect(response.status).toBe(200); // Still 200 for monitoring compatibility
      expect(data.status).toBe('unhealthy');
      expect(data.data).toBe(null);
      expect(data.cached).toBe(false);
      expect(data.error).toBe('Health check completely failed, no cached data available');
      expect(response.headers.get('X-Health-Status')).toBe('unhealthy');
      expect(response.headers.get('X-Fallback-Used')).toBe('false');
    });

    it('should handle health service with intelligent caching', async () => {
      const mockHealthData = {
        status: 'healthy',
        checks: {
          database: { status: 'connected', latency_ms: 15 },
          opal_api: { status: 'available', response_time_ms: 120 },
          webhooks: { status: 'active', last_received: new Date().toISOString() },
          workflow_engine: { status: 'operational', active_workflows: 5 }
        },
        timestamp: new Date().toISOString(),
        fallback_used: false,
        cache_ttl_seconds: 60,
        next_check_in_seconds: 55 // Smart cache timing
      };

      mockService.getHealth.mockResolvedValue(mockHealthData);

      const request = new NextRequest('http://localhost:3000/api/opal/health', {
        headers: { 'X-Requested-With': 'EnhancedRecentDataComponent' }
      });
      const response = await healthGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.data.next_check_in_seconds).toBe(55);
      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
    });
  });

  describe('POST /api/opal/health', () => {
    it('should force refresh health data', async () => {
      const mockFreshData = {
        status: 'healthy',
        checks: {
          database: { status: 'connected', latency_ms: 18 },
          opal_api: { status: 'available', response_time_ms: 95 },
          webhooks: { status: 'active', last_received: new Date().toISOString() },
          workflow_engine: { status: 'operational', active_workflows: 4 }
        },
        timestamp: new Date().toISOString(),
        fallback_used: false,
        cache_ttl_seconds: 60,
        force_refreshed: true
      };

      mockService.forceRefresh.mockResolvedValue(mockFreshData);

      const request = new NextRequest('http://localhost:3000/api/opal/health', {
        method: 'POST'
      });
      const response = await healthPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.data.force_refreshed).toBe(true);
      expect(data.cached).toBe(false);
      expect(data.message).toBe('Health data refreshed');
      expect(response.headers.get('X-Health-Status')).toBe('healthy');
      expect(response.headers.get('X-Fallback-Used')).toBe('false');
    });

    it('should handle force refresh failure', async () => {
      mockService.forceRefresh.mockRejectedValue(new Error('Force refresh timeout'));

      const request = new NextRequest('http://localhost:3000/api/opal/health', {
        method: 'POST'
      });
      const response = await healthPOST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.status).toBe('error');
      expect(data.data).toBe(null);
      expect(data.error).toBe('Failed to refresh health data');
    });
  });

  describe('Health API Edge Cases', () => {
    it('should handle malformed health service response', async () => {
      mockService.getHealth.mockResolvedValue({
        // Missing required fields
        timestamp: new Date().toISOString()
      } as any);

      const request = new NextRequest('http://localhost:3000/api/opal/health');
      const response = await healthGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Should still return a response even with malformed data
      expect(data.data).toBeDefined();
    });

    it('should handle concurrent health check requests', async () => {
      let callCount = 0;
      mockService.getHealth.mockImplementation(async () => {
        callCount++;
        // Simulate delayed response for first few calls
        if (callCount <= 2) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        return {
          status: 'healthy',
          checks: {
            database: { status: 'connected' },
            opal_api: { status: 'available' },
            webhooks: { status: 'active' },
            workflow_engine: { status: 'operational' }
          },
          timestamp: new Date().toISOString(),
          fallback_used: false,
          concurrent_request_number: callCount
        };
      });

      // Make concurrent requests
      const requests = Array.from({ length: 3 }, () =>
        healthGET(new NextRequest('http://localhost:3000/api/opal/health'))
      );

      const responses = await Promise.all(requests);
      const dataArray = await Promise.all(responses.map(r => r.json()));

      // All should succeed
      expect(responses.every(r => r.status === 200)).toBe(true);
      expect(dataArray.every(d => d.status === 'healthy')).toBe(true);
      expect(callCount).toBe(3); // Service should be called for each request
    });

    it('should validate cache headers for different health states', async () => {
      const testCases = [
        { status: 'healthy', expectedCacheControl: 'no-cache, no-store, must-revalidate' },
        { status: 'degraded', expectedCacheControl: 'no-cache, no-store, must-revalidate' },
        { status: 'unhealthy', expectedCacheControl: 'no-cache, no-store, must-revalidate' }
      ];

      for (const testCase of testCases) {
        mockService.getHealth.mockResolvedValueOnce({
          status: testCase.status,
          checks: {},
          timestamp: new Date().toISOString(),
          fallback_used: false
        } as any);

        const request = new NextRequest('http://localhost:3000/api/opal/health');
        const response = await healthGET(request);

        expect(response.headers.get('Cache-Control')).toBe(testCase.expectedCacheControl);
        expect(response.headers.get('X-Health-Status')).toBe(testCase.status);
      }
    });
  });
});

describe('Health Service Integration Tests', () => {
  it('should handle health degradation scenarios', async () => {
    const mockService = {
      getHealth: jest.fn(),
      getCached: jest.fn(),
    } as any;

    mockHealthService.getInstance = jest.fn().mockReturnValue(mockService);

    // Scenario 1: Healthy -> Degraded -> Unhealthy -> Recovery
    const healthStates = [
      {
        status: 'healthy',
        checks: {
          database: { status: 'connected', latency_ms: 25 },
          opal_api: { status: 'available', response_time_ms: 150 },
          webhooks: { status: 'active' },
          workflow_engine: { status: 'operational' }
        }
      },
      {
        status: 'degraded',
        checks: {
          database: { status: 'connected', latency_ms: 200 }, // High latency
          opal_api: { status: 'degraded', response_time_ms: 4000 }, // Very slow
          webhooks: { status: 'active' },
          workflow_engine: { status: 'operational' }
        },
        warnings: ['Database experiencing high latency', 'OPAL API slow response times']
      },
      {
        status: 'unhealthy',
        checks: {
          database: { status: 'disconnected', last_error: 'Connection timeout' },
          opal_api: { status: 'unavailable', last_error: 'Service unreachable' },
          webhooks: { status: 'inactive' },
          workflow_engine: { status: 'down' }
        },
        errors: ['Multiple critical services unavailable']
      },
      {
        status: 'healthy',
        checks: {
          database: { status: 'connected', latency_ms: 20 }, // Back to normal
          opal_api: { status: 'available', response_time_ms: 120 },
          webhooks: { status: 'active' },
          workflow_engine: { status: 'operational' }
        }
      }
    ];

    for (const [index, healthState] of healthStates.entries()) {
      mockService.getHealth.mockResolvedValueOnce({
        ...healthState,
        timestamp: new Date().toISOString(),
        fallback_used: false
      });

      const request = new NextRequest('http://localhost:3000/api/opal/health');
      const response = await healthGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe(healthState.status);

      if (healthState.warnings) {
        expect(data.data.warnings).toHaveLength(healthState.warnings.length);
      }

      if (healthState.errors) {
        expect(data.data.errors).toHaveLength(healthState.errors.length);
      }
    }
  });
});