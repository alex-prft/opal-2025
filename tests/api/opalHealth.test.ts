/**
 * Comprehensive OPAL Health API Tests
 * Tests health endpoint resilience, fallback mechanisms, and error handling
 */

import { GET } from '@/app/api/opal/health/route';
import { NextRequest } from 'next/server';
import { HealthService } from '@/lib/health/health-service';

// Mock the HealthService
jest.mock('@/lib/health/health-service');
const mockHealthService = jest.mocked(HealthService);

// Mock console methods to reduce test noise
const mockConsole = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};

global.console = mockConsole as any;

describe('OPAL Health API Tests', () => {
  let mockHealthServiceInstance: jest.Mocked<HealthService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockHealthServiceInstance = {
      getHealth: jest.fn(),
      forceRefresh: jest.fn(),
      getStatus: jest.fn()
    } as any;

    mockHealthService.getInstance.mockReturnValue(mockHealthServiceInstance);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('returns healthy status when OPAL responds', async () => {
    const mockHealthData = {
      status: 'healthy' as const,
      checks: {
        database: { status: 'connected', latency_ms: 25 },
        opal_api: { status: 'available', response_time_ms: 150 },
        webhooks: { status: 'active', last_received: new Date().toISOString() },
        workflow_engine: { status: 'operational', active_workflows: 3 }
      },
      fallback_used: false,
      cache_age_ms: 0,
      warnings: []
    };

    mockHealthServiceInstance.getHealth.mockResolvedValue(mockHealthData);

    const request = new NextRequest('http://localhost:3000/api/opal/health');
    const response = await GET(request);

    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.status).toBe('healthy');
    expect(json.data.status).toBe('healthy');
    expect(json.data.fallback_used).toBe(false);

    // Verify headers
    const headers = Object.fromEntries(response.headers.entries());
    expect(headers['x-health-status']).toBe('healthy');
    expect(headers['x-fallback-used']).toBe('false');
  });

  test('returns degraded status when OPAL fails', async () => {
    const mockHealthData = {
      status: 'degraded' as const,
      checks: {
        database: { status: 'connected', latency_ms: 250 },
        opal_api: { status: 'degraded', response_time_ms: 5000, last_error: 'Timeout' },
        webhooks: { status: 'stale', last_received: new Date(Date.now() - 600000).toISOString() },
        workflow_engine: { status: 'operational', active_workflows: 1 }
      },
      fallback_used: true,
      cache_age_ms: 180000,
      warnings: ['OPAL API experiencing high latency', 'No recent webhook activity']
    };

    mockHealthServiceInstance.getHealth.mockResolvedValue(mockHealthData);

    const request = new NextRequest('http://localhost:3000/api/opal/health');
    const response = await GET(request);

    expect(response.status).toBe(200); // Always returns 200 for monitoring compatibility

    const json = await response.json();
    expect(json.status).toBe('degraded');
    expect(json.data.fallback_used).toBe(true);
    expect(json.cached).toBe(true);
    expect(json.data.warnings).toHaveLength(2);
  });

  test('returns unhealthy status with multiple failures', async () => {
    const mockHealthData = {
      status: 'unhealthy' as const,
      checks: {
        database: { status: 'error', error: 'Connection refused' },
        opal_api: { status: 'unavailable', last_error: 'Service down' },
        webhooks: { status: 'failed', last_received: null },
        workflow_engine: { status: 'error', active_workflows: 0 }
      },
      fallback_used: true,
      cache_age_ms: 300000,
      warnings: ['Database connection failed', 'OPAL API unavailable', 'Webhook processing stopped']
    };

    mockHealthServiceInstance.getHealth.mockResolvedValue(mockHealthData);

    const request = new NextRequest('http://localhost:3000/api/opal/health');
    const response = await GET(request);

    const json = await response.json();
    expect(json.status).toBe('unhealthy');
    expect(json.data.warnings).toHaveLength(3);
    expect(json.cached).toBe(true);
  });

  test('handles health service exceptions gracefully', async () => {
    mockHealthServiceInstance.getHealth.mockRejectedValue(new Error('Service initialization failed'));

    const request = new NextRequest('http://localhost:3000/api/opal/health');
    const response = await GET(request);

    expect(response.status).toBe(200); // Still returns 200 for monitoring

    const json = await response.json();
    expect(json.status).toBe('degraded');
    expect(json.error).toBe('Health service unavailable');
    expect(json.data).toBeNull();
  });

  test('uses cached data when live check fails', async () => {
    const mockCachedData = {
      status: 'healthy' as const,
      checks: {
        database: { status: 'connected' },
        opal_api: { status: 'available' },
        webhooks: { status: 'active' },
        workflow_engine: { status: 'operational' }
      },
      fallback_used: true,
      cache_age_ms: 120000 // 2 minutes old
    };

    mockHealthServiceInstance.getHealth.mockResolvedValue(mockCachedData);

    const request = new NextRequest('http://localhost:3000/api/opal/health');
    const response = await GET(request);

    const json = await response.json();
    expect(json.data.fallback_used).toBe(true);
    expect(json.cached).toBe(true);
    expect(json.data.cache_age_ms).toBe(120000);
  });

  test('handles force refresh parameter', async () => {
    const mockHealthData = {
      status: 'healthy' as const,
      checks: {
        database: { status: 'connected' },
        opal_api: { status: 'available' },
        webhooks: { status: 'active' },
        workflow_engine: { status: 'operational' }
      },
      fallback_used: false,
      cache_age_ms: 0
    };

    mockHealthServiceInstance.forceRefresh.mockResolvedValue(mockHealthData);

    const request = new NextRequest('http://localhost:3000/api/opal/health?force_refresh=true');
    const response = await GET(request);

    expect(mockHealthServiceInstance.forceRefresh).toHaveBeenCalled();

    const json = await response.json();
    expect(json.data.cache_age_ms).toBe(0);
  });

  test('validates cache headers for different health states', async () => {
    const scenarios = [
      { status: 'healthy', cacheControl: 'public, max-age=60' },
      { status: 'degraded', cacheControl: 'public, max-age=30' },
      { status: 'unhealthy', cacheControl: 'no-cache, must-revalidate' }
    ] as const;

    for (const scenario of scenarios) {
      mockHealthServiceInstance.getHealth.mockResolvedValue({
        status: scenario.status,
        checks: {},
        fallback_used: false,
        cache_age_ms: 0
      } as any);

      const request = new NextRequest('http://localhost:3000/api/opal/health');
      const response = await GET(request);

      const headers = Object.fromEntries(response.headers.entries());
      expect(headers['cache-control']).toBe(scenario.cacheControl);
    }
  });

  test('handles concurrent health check requests', async () => {
    const mockHealthData = {
      status: 'healthy' as const,
      checks: {},
      fallback_used: false,
      cache_age_ms: 0
    };

    mockHealthServiceInstance.getHealth.mockResolvedValue(mockHealthData);

    // Simulate multiple concurrent requests
    const requests = Array.from({ length: 5 }, () =>
      GET(new NextRequest('http://localhost:3000/api/opal/health'))
    );

    const responses = await Promise.all(requests);

    // All requests should succeed
    responses.forEach(response => {
      expect(response.status).toBe(200);
    });

    // Health service should use internal deduplication
    expect(mockHealthServiceInstance.getHealth).toHaveBeenCalled();
  });

  test('returns minimal response when no cached data available', async () => {
    mockHealthServiceInstance.getHealth.mockRejectedValue(new Error('No cached data available'));

    const request = new NextRequest('http://localhost:3000/api/opal/health');
    const response = await GET(request);

    const json = await response.json();
    expect(json.status).toBe('degraded');
    expect(json.data).toBeNull();
    expect(json.error).toBe('Health service unavailable');

    // Should still have proper structure
    expect(json).toHaveProperty('timestamp');
    expect(json).toHaveProperty('cached');
  });
});