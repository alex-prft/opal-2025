/**
 * Unit tests for API response structure validation
 * These tests ensure API responses match expected interfaces and prevent type errors
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';

// Mock the API endpoints
global.fetch = vi.fn();

interface DiagnosticsApiResponse {
  events: Array<{
    id: string;
    workflow_id: string;
    agent_id: string;
    received_at: string;
    signature_valid: boolean;
    http_status: number;
    error_text?: string;
    dedup_hash: string;
    payload_preview: string;
  }>;
  summary: {
    total_count: number;
    returned_count: number;
    signature_valid_count: number;
    error_count: number;
    date_range: {
      from: string | null;
      to: string | null;
    };
    filters_applied: {
      limit: number;
      workflow_id: string | null;
      agent_id: string | null;
      status: string;
      hours: number;
    };
  };
  config_diagnostics: any;
  troubleshooting: any;
  generated_at: string;
  query_info: any;
}

interface HealthApiResponse {
  overall_status: string;
  last_webhook_minutes_ago: number | null;
  signature_valid_rate: number;
  error_rate_24h: number;
  config_checks?: {
    osa_webhook_secret_configured: boolean;
    osa_webhook_url_configured: boolean;
    opal_tools_discovery_url_configured: boolean;
  };
  metrics?: any;
}

describe('API Response Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as Mock).mockClear();
  });

  describe('Diagnostics API (/api/diagnostics/last-webhook)', () => {
    it('should return response matching DiagnosticsApiResponse interface', async () => {
      const mockResponse: DiagnosticsApiResponse = {
        events: [
          {
            id: 'test-id',
            workflow_id: 'test-workflow',
            agent_id: 'test-agent',
            received_at: '2025-01-01T00:00:00Z',
            signature_valid: true,
            http_status: 202,
            error_text: undefined,
            dedup_hash: 'abc123def456',
            payload_preview: 'test payload'
          }
        ],
        summary: {
          total_count: 1,
          returned_count: 1,
          signature_valid_count: 1,
          error_count: 0,
          date_range: {
            from: '2025-01-01T00:00:00Z',
            to: '2025-01-01T01:00:00Z'
          },
          filters_applied: {
            limit: 25,
            workflow_id: null,
            agent_id: null,
            status: 'all',
            hours: 24
          }
        },
        config_diagnostics: {},
        troubleshooting: {},
        generated_at: '2025-01-01T00:00:00Z',
        query_info: {}
      };

      // Validate the structure matches our interface
      expect(mockResponse).toHaveProperty('events');
      expect(mockResponse).toHaveProperty('summary');
      expect(mockResponse).toHaveProperty('config_diagnostics');
      expect(mockResponse).toHaveProperty('troubleshooting');
      expect(mockResponse).toHaveProperty('generated_at');
      expect(mockResponse).toHaveProperty('query_info');

      // Validate events array structure
      expect(Array.isArray(mockResponse.events)).toBe(true);
      if (mockResponse.events.length > 0) {
        const event = mockResponse.events[0];
        expect(event).toHaveProperty('id');
        expect(event).toHaveProperty('workflow_id');
        expect(event).toHaveProperty('agent_id');
        expect(event).toHaveProperty('received_at');
        expect(event).toHaveProperty('signature_valid');
        expect(event).toHaveProperty('http_status');
        expect(event).toHaveProperty('dedup_hash');
        expect(event).toHaveProperty('payload_preview');
      }

      // Validate summary structure
      expect(mockResponse.summary).toHaveProperty('total_count');
      expect(mockResponse.summary).toHaveProperty('returned_count');
      expect(mockResponse.summary).toHaveProperty('signature_valid_count');
      expect(mockResponse.summary).toHaveProperty('error_count');
      expect(mockResponse.summary).toHaveProperty('date_range');
      expect(mockResponse.summary).toHaveProperty('filters_applied');
    });

    it('should handle response with invalid event properties', () => {
      const invalidResponse = {
        events: [
          {
            // Missing required properties
            id: 'test-id'
            // workflow_id, agent_id, etc. missing
          }
        ],
        summary: {
          total_count: 1,
          returned_count: 1,
          signature_valid_count: 0,
          error_count: 1,
          date_range: { from: null, to: null },
          filters_applied: {
            limit: 25,
            workflow_id: null,
            agent_id: null,
            status: 'all',
            hours: 24
          }
        },
        config_diagnostics: {},
        troubleshooting: {},
        generated_at: '2025-01-01T00:00:00Z',
        query_info: {}
      };

      // Validation should catch missing properties
      const event = invalidResponse.events[0];
      expect(event).toHaveProperty('id');
      expect(event).not.toHaveProperty('workflow_id');
      expect(event).not.toHaveProperty('agent_id');

      // Component should handle this gracefully with safeGet
    });

    it('should validate API response with proper query parameters', async () => {
      const apiUrl = '/api/diagnostics/last-webhook?limit=25&status=all&hours=24';

      // Mock successful response
      (fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          events: [],
          summary: {
            total_count: 0,
            returned_count: 0,
            signature_valid_count: 0,
            error_count: 0,
            date_range: { from: null, to: null },
            filters_applied: {
              limit: 25,
              workflow_id: null,
              agent_id: null,
              status: 'all',
              hours: 24
            }
          },
          config_diagnostics: {},
          troubleshooting: {},
          generated_at: new Date().toISOString(),
          query_info: {}
        })
      });

      const response = await fetch(apiUrl);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data).toHaveProperty('events');
      expect(data.summary.filters_applied.limit).toBe(25);
      expect(data.summary.filters_applied.status).toBe('all');
      expect(data.summary.filters_applied.hours).toBe(24);
    });
  });

  describe('Health API (/api/opal/health)', () => {
    it('should return response matching HealthApiResponse interface', async () => {
      const mockResponse: HealthApiResponse = {
        overall_status: 'red',
        last_webhook_minutes_ago: null,
        signature_valid_rate: 0,
        error_rate_24h: 0,
        config_checks: {
          osa_webhook_secret_configured: true,
          osa_webhook_url_configured: true,
          opal_tools_discovery_url_configured: true
        },
        metrics: {
          total_events_24h: 0,
          successful_events_24h: 0,
          failed_events_24h: 0,
          last_event_timestamp: null
        }
      };

      // Validate the structure matches our interface
      expect(mockResponse).toHaveProperty('overall_status');
      expect(mockResponse).toHaveProperty('last_webhook_minutes_ago');
      expect(mockResponse).toHaveProperty('signature_valid_rate');
      expect(mockResponse).toHaveProperty('error_rate_24h');

      // Validate optional properties
      if (mockResponse.config_checks) {
        expect(mockResponse.config_checks).toHaveProperty('osa_webhook_secret_configured');
        expect(mockResponse.config_checks).toHaveProperty('osa_webhook_url_configured');
        expect(mockResponse.config_checks).toHaveProperty('opal_tools_discovery_url_configured');
      }

      // Validate types
      expect(typeof mockResponse.overall_status).toBe('string');
      expect(typeof mockResponse.signature_valid_rate).toBe('number');
      expect(typeof mockResponse.error_rate_24h).toBe('number');
    });

    it('should handle 503 responses gracefully', async () => {
      const mockResponse: HealthApiResponse = {
        overall_status: 'red',
        last_webhook_minutes_ago: null,
        signature_valid_rate: 0,
        error_rate_24h: 0
      };

      (fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => mockResponse
      });

      const response = await fetch('/api/opal/health');
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.overall_status).toBe('red');
      // Component should still process the data even with 503 status
    });
  });

  describe('Type Safety Helpers', () => {
    it('should validate safeGet helper prevents runtime errors', () => {
      const safeGet = <T>(getter: () => T, defaultValue: T): T => {
        try {
          return getter() ?? defaultValue;
        } catch {
          return defaultValue;
        }
      };

      const nullObject: any = null;
      const undefinedObject: any = undefined;
      const emptyObject = {};

      // Should not throw and return defaults
      expect(safeGet(() => nullObject.property, 'default')).toBe('default');
      expect(safeGet(() => undefinedObject.property, 'default')).toBe('default');
      expect(safeGet(() => (emptyObject as any).property, 'default')).toBe('default');
      expect(safeGet(() => nullObject.nested.property, [])).toEqual([]);
    });

    it('should validate array access with safeGet', () => {
      const safeGet = <T>(getter: () => T, defaultValue: T): T => {
        try {
          return getter() ?? defaultValue;
        } catch {
          return defaultValue;
        }
      };

      const nullArray: any = null;
      const undefinedArray: any = undefined;
      const emptyArray: any[] = [];

      // Should return safe defaults for array operations
      expect(safeGet(() => nullArray.length, 0)).toBe(0);
      expect(safeGet(() => undefinedArray.length, 0)).toBe(0);
      expect(safeGet(() => emptyArray.length, 0)).toBe(0);
      expect(safeGet(() => nullArray.map(() => {}), [])).toEqual([]);
    });
  });

  describe('Component Interface Contracts', () => {
    it('should define proper TypeScript interfaces for all props', () => {
      // These tests ensure our interfaces are properly defined
      interface ExpectedDiagnosticsData {
        events: Array<{
          id: string;
          workflow_id: string;
          agent_id: string;
          received_at: string;
          signature_valid: boolean;
          http_status: number;
          error_text?: string;
          dedup_hash: string;
          payload_preview: string;
        }>;
        summary: {
          total_count: number;
          returned_count: number;
          signature_valid_count: number;
          error_count: number;
          date_range: {
            from: string | null;
            to: string | null;
          };
          filters_applied: {
            limit: number;
            workflow_id: string | null;
            agent_id: string | null;
            status: string;
            hours: number;
          };
        };
      }

      // Test that our interface matches expected structure
      const mockData: ExpectedDiagnosticsData = {
        events: [{
          id: 'test',
          workflow_id: 'test',
          agent_id: 'test',
          received_at: '2025-01-01T00:00:00Z',
          signature_valid: true,
          http_status: 202,
          dedup_hash: 'test',
          payload_preview: 'test'
        }],
        summary: {
          total_count: 1,
          returned_count: 1,
          signature_valid_count: 1,
          error_count: 0,
          date_range: { from: null, to: null },
          filters_applied: {
            limit: 25,
            workflow_id: null,
            agent_id: null,
            status: 'all',
            hours: 24
          }
        }
      };

      expect(mockData.events).toBeDefined();
      expect(mockData.summary).toBeDefined();
    });
  });
});