/**
 * API Error Handling Tests
 *
 * These tests ensure that API calls properly handle various error scenarios,
 * particularly the "Unexpected token '<', "<!DOCTYPE"... is not valid JSON" errors
 * that occur when 500 responses return HTML instead of JSON.
 */

import { jest } from '@jest/globals';

// Mock fetch globally for testing
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

// Implementation of safeJsonFetch function for testing
const safeJsonFetch = async (url: string, options?: RequestInit): Promise<any> => {
  try {
    const response = await fetch(url, options);

    // Check if response is ok (status 200-299)
    if (!response.ok) {
      // For non-ok responses, try to get error details
      const contentType = response.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        // If it's JSON, parse it for error details
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        } catch (jsonError) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } else {
        // If it's not JSON (likely HTML error page), don't try to parse
        throw new Error(`HTTP ${response.status}: ${response.statusText} - Server returned non-JSON response`);
      }
    }

    // Check content type for successful responses
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw new Error('Server returned non-JSON response');
    }

    // Safe to parse JSON
    return await response.json();
  } catch (error) {
    // Re-throw with more context
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Network error occurred');
  }
};

describe('API Error Handling', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('safeJsonFetch - Successful Responses', () => {
    it('should successfully parse valid JSON responses', async () => {
      const mockData = { success: true, data: 'test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValueOnce(mockData)
      } as any);

      const result = await safeJsonFetch('/api/test');
      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith('/api/test', undefined);
    });

    it('should handle JSON responses with charset specification', async () => {
      const mockData = { success: true };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json; charset=utf-8' }),
        json: jest.fn().mockResolvedValueOnce(mockData)
      } as any);

      const result = await safeJsonFetch('/api/test');
      expect(result).toEqual(mockData);
    });
  });

  describe('safeJsonFetch - HTTP Error Responses', () => {
    it('should handle 500 errors with HTML content (main bug fix)', async () => {
      const htmlErrorPage = '<!DOCTYPE html><html><body><h1>Internal Server Error</h1></body></html>';

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers({ 'content-type': 'text/html' }),
        text: jest.fn().mockResolvedValueOnce(htmlErrorPage)
      } as any);

      await expect(safeJsonFetch('/api/test')).rejects.toThrow(
        'HTTP 500: Internal Server Error - Server returned non-JSON response'
      );

      // Verify that we didn't attempt to parse as JSON
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle 404 errors with HTML content', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers({ 'content-type': 'text/html' }),
      } as any);

      await expect(safeJsonFetch('/api/nonexistent')).rejects.toThrow(
        'HTTP 404: Not Found - Server returned non-JSON response'
      );
    });

    it('should handle error responses with valid JSON error details', async () => {
      const errorData = { error: 'Validation failed', details: 'Invalid input' };

      const mockResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: {
          get: jest.fn().mockImplementation((name: string) => {
            if (name === 'content-type') return 'application/json';
            return null;
          })
        },
        json: jest.fn().mockResolvedValueOnce(errorData)
      };

      mockFetch.mockResolvedValueOnce(mockResponse as any);

      await expect(safeJsonFetch('/api/test')).rejects.toThrow('HTTP 400: Bad Request');
    });

    it('should handle error responses with malformed JSON error details', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockRejectedValueOnce(new Error('Unexpected token'))
      } as any);

      await expect(safeJsonFetch('/api/test')).rejects.toThrow('HTTP 422: Unprocessable Entity');
    });
  });

  describe('safeJsonFetch - Content-Type Validation', () => {
    it('should reject successful responses with non-JSON content-type', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'text/html' }),
      } as any);

      await expect(safeJsonFetch('/api/test')).rejects.toThrow('Server returned non-JSON response');
    });

    it('should reject responses with missing content-type header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({}),
      } as any);

      await expect(safeJsonFetch('/api/test')).rejects.toThrow('Server returned non-JSON response');
    });
  });

  describe('safeJsonFetch - Network Errors', () => {
    it('should handle network connection errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(safeJsonFetch('/api/test')).rejects.toThrow('Network error');
    });

    it('should handle timeout errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Request timeout'));

      await expect(safeJsonFetch('/api/test')).rejects.toThrow('Request timeout');
    });

    it('should handle unknown errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce('Unknown error');

      await expect(safeJsonFetch('/api/test')).rejects.toThrow('Network error occurred');
    });
  });

  describe('Real-world API Endpoint Scenarios', () => {
    const mockApiEndpoints = [
      '/api/webhook-events/stats',
      '/api/monitoring/agent-logs',
      '/api/diagnostics/last-webhook',
      '/api/opal/health-with-fallback',
      '/api/opal/test-payload',
      '/api/opal/enhanced-tools'
    ];

    it('should handle typical successful API responses', async () => {
      const mockResponses = mockApiEndpoints.map(endpoint => ({
        endpoint,
        data: {
          success: true,
          data: `Mock data for ${endpoint}`,
          timestamp: new Date().toISOString()
        }
      }));

      for (const { endpoint, data } of mockResponses) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers({ 'content-type': 'application/json' }),
          json: jest.fn().mockResolvedValueOnce(data)
        } as any);

        const result = await safeJsonFetch(endpoint);
        expect(result).toEqual(data);
      }
    });

    it('should handle common server error scenarios for API endpoints', async () => {
      const errorScenarios = [
        {
          status: 500,
          statusText: 'Internal Server Error',
          contentType: 'text/html',
          expectError: 'HTTP 500: Internal Server Error - Server returned non-JSON response'
        },
        {
          status: 502,
          statusText: 'Bad Gateway',
          contentType: 'text/html',
          expectError: 'HTTP 502: Bad Gateway - Server returned non-JSON response'
        },
        {
          status: 503,
          statusText: 'Service Unavailable',
          contentType: 'text/plain',
          expectError: 'HTTP 503: Service Unavailable - Server returned non-JSON response'
        }
      ];

      for (const scenario of errorScenarios) {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: scenario.status,
          statusText: scenario.statusText,
          headers: new Headers({ 'content-type': scenario.contentType }),
        } as any);

        await expect(safeJsonFetch('/api/test')).rejects.toThrow(scenario.expectError);
      }
    });
  });

  describe('Integration with RecentDataComponent API calls', () => {
    const recentDataApiCalls = [
      {
        name: 'fetchDashboardData - webhook stats',
        url: '/api/webhook-events/stats?hours=24',
        expectedData: {
          success: true,
          lastTriggerTime: '2024-01-01T12:00:00Z',
          workflowStatus: 'success',
          agentStatuses: {}
        }
      },
      {
        name: 'fetchDashboardData - agent logs',
        url: '/api/monitoring/agent-logs?level=error&hours=24&limit=100',
        expectedData: {
          success: true,
          agent_error_patterns: []
        }
      },
      {
        name: 'fetchWebhookEvents',
        url: '/api/diagnostics/last-webhook?limit=10&status=all&hours=24',
        expectedData: {
          success: true,
          events: []
        }
      },
      {
        name: 'fetchHealthData',
        url: '/api/opal/health-with-fallback',
        expectedData: {
          overall_status: 'green',
          signature_valid_rate: 95,
          error_rate_24h: 2,
          last_webhook_minutes_ago: 5
        }
      }
    ];

    recentDataApiCalls.forEach(({ name, url, expectedData }) => {
      it(`should handle ${name} API call successfully`, async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers({ 'content-type': 'application/json' }),
          json: jest.fn().mockResolvedValueOnce(expectedData)
        } as any);

        const result = await safeJsonFetch(url);
        expect(result).toEqual(expectedData);
      });

      it(`should handle ${name} API call with server error`, async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          headers: new Headers({ 'content-type': 'text/html' }),
        } as any);

        await expect(safeJsonFetch(url)).rejects.toThrow(
          'HTTP 500: Internal Server Error - Server returned non-JSON response'
        );
      });
    });
  });

  describe('Request Options and Headers', () => {
    it('should pass through request options correctly', async () => {
      const mockData = { success: true };
      const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'data' })
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValueOnce(mockData)
      } as any);

      const result = await safeJsonFetch('/api/test', requestOptions);

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith('/api/test', requestOptions);
    });

    it('should handle POST requests with JSON payload', async () => {
      const requestData = { agent_id: 'test', execution_status: 'success' };
      const responseData = { success: true, message: 'Test completed' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValueOnce(responseData)
      } as any);

      const result = await safeJsonFetch('/api/opal/enhanced-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      expect(result).toEqual(responseData);
    });
  });
});

// Test utility function for validating API responses
export const validateApiResponse = (response: any): {
  isValid: boolean;
  issues: string[];
} => {
  const issues: string[] = [];

  if (typeof response !== 'object' || response === null) {
    issues.push('Response is not a valid object');
    return { isValid: false, issues };
  }

  // Check for common success/error patterns
  if (!('success' in response) && !('error' in response) && !('data' in response)) {
    issues.push('Response missing standard success/error/data fields');
  }

  return {
    isValid: issues.length === 0,
    issues
  };
};

describe('API Response Validation Utility', () => {
  it('should validate successful API responses', () => {
    const validResponse = { success: true, data: 'test' };
    const result = validateApiResponse(validResponse);

    expect(result.isValid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('should identify invalid response structures', () => {
    const invalidResponse = { randomField: 'value' };
    const result = validateApiResponse(invalidResponse);

    expect(result.isValid).toBe(false);
    expect(result.issues).toContain('Response missing standard success/error/data fields');
  });

  it('should reject null or non-object responses', () => {
    const result1 = validateApiResponse(null);
    const result2 = validateApiResponse('string response');

    expect(result1.isValid).toBe(false);
    expect(result2.isValid).toBe(false);
    expect(result1.issues).toContain('Response is not a valid object');
    expect(result2.issues).toContain('Response is not a valid object');
  });
});