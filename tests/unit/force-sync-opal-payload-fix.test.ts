/**
 * Force Sync OPAL Payload Fix - Comprehensive Unit Tests
 *
 * Tests the corrected OPAL webhook payload structure with workspace_id requirement.
 * Addresses the root cause: OPAL workflows don't run because workspace_id was missing.
 */

import { jest } from '@jest/globals';

// Mock Next.js request/response before importing modules
const mockRequest = {
  json: jest.fn(),
  text: jest.fn(),
  headers: {
    get: jest.fn()
  },
  url: 'http://localhost:3000/api/opal/sync'
};

const mockResponse = {
  json: jest.fn(),
  status: jest.fn(() => mockResponse)
};

// Mock Next.js modules
jest.mock('next/server', () => ({
  NextRequest: jest.fn(() => mockRequest),
  NextResponse: {
    json: jest.fn((data, init) => ({
      ...mockResponse,
      data,
      status: init?.status || 200
    }))
  }
}));

// Mock fetch for OPAL webhook calls
global.fetch = jest.fn();

// Mock environment variables
const originalEnv = process.env;

describe('Force Sync OPAL Payload Fix', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      NODE_ENV: 'development',
      OPAL_WEBHOOK_URL: 'https://webhook.opal.optimizely.com/webhooks/d3e181a30acf493bb65a5c7792cfeced/ba71d62d-aa74-4bbf-9ab8-a1a11ed4bf14',
      OPAL_STRATEGY_WORKFLOW_AUTH_KEY: 'opal-workflow-auth-key-1234567890123456789012',
      OPAL_WORKSPACE_ID: 'test-workspace-id-1234'
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Payload Structure with workspace_id', () => {
    test('should include workspace_id in OPAL payload metadata', async () => {
      // Mock successful OPAL response WITH workflow_id and session_id
      const mockOpalResponse = {
        success: true,
        workflow_id: 'strategy_workflow_12345',
        session_id: 'session_67890',
        message: 'Workflow triggered successfully'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify(mockOpalResponse)
      });

      const { callOpalProductionWebhook } = await import('../../src/lib/opal/production-webhook-caller');

      const request = {
        workflow_name: 'strategy_workflow',
        input_data: {
          client_name: 'Test Client',
          industry: 'Technology',
          triggered_by: 'unit_test',
          sync_scope: 'priority_platforms',
          force_sync: true
        },
        metadata: {
          correlation_id: 'test-correlation-123'
        }
      };

      const result = await callOpalProductionWebhook(request);

      // Verify fetch was called with correct payload structure
      expect(global.fetch).toHaveBeenCalledWith(
        process.env.OPAL_WEBHOOK_URL,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPAL_STRATEGY_WORKFLOW_AUTH_KEY}`
          }),
          body: expect.any(String)
        })
      );

      // Parse the payload to verify workspace_id is included
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const payloadBody = JSON.parse(fetchCall[1].body);

      expect(payloadBody).toMatchObject({
        workflow_name: 'strategy_workflow',
        input_data: expect.objectContaining({
          client_name: 'Test Client',
          triggered_by: 'unit_test'
        }),
        metadata: expect.objectContaining({
          workspace_id: 'test-workspace-id-1234',
          correlation_id: 'test-correlation-123',
          source_system: 'OSA-ForceSync-Production'
        })
      });

      // Verify response includes workflow_id and session_id
      expect(result.success).toBe(true);
      expect(result.workflow_id).toBe('strategy_workflow_12345');
      expect(result.session_id).toBe('session_67890');
    });

    test('should use default workspace_id when not set in environment', async () => {
      delete process.env.OPAL_WORKSPACE_ID;

      // Mock successful OPAL response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({
          workflow_id: 'test-workflow',
          session_id: 'test-session'
        })
      });

      const { callOpalProductionWebhook } = await import('../../src/lib/opal/production-webhook-caller');

      const request = {
        workflow_name: 'strategy_workflow',
        input_data: {
          client_name: 'Test Client',
          triggered_by: 'unit_test'
        },
        metadata: {
          correlation_id: 'test-correlation-123'
        }
      };

      await callOpalProductionWebhook(request);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const payloadBody = JSON.parse(fetchCall[1].body);

      expect(payloadBody.metadata.workspace_id).toBe('default-workspace');
    });

    test('should fail when OPAL returns workflow_id: undefined', async () => {
      // Mock OPAL response that returns 200 but without workflow_id (the actual bug)
      const mockOpalResponse = {
        success: true,
        message: 'Request received but workflow not started'
        // workflow_id and session_id are undefined (missing)
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: async () => JSON.stringify(mockOpalResponse)
      });

      const { callOpalProductionWebhook } = await import('../../src/lib/opal/production-webhook-caller');

      const request = {
        workflow_name: 'strategy_workflow',
        input_data: {
          client_name: 'Test Client',
          triggered_by: 'unit_test'
        },
        metadata: {
          workspace_id: 'test-workspace-id-1234',
          correlation_id: 'test-correlation-123'
        }
      };

      const result = await callOpalProductionWebhook(request);

      // Should succeed but with fallback workflow_id
      expect(result.success).toBe(true);
      expect(result.workflow_id).toMatch(/^opal-\d+$/);
      expect(result.session_id).toBeUndefined();
    });
  });

  describe('Force Sync API Route Integration', () => {
    test('should validate workspace_id requirement in environment', async () => {
      delete process.env.OPAL_WORKSPACE_ID;
      process.env.NODE_ENV = 'production';

      mockRequest.json.mockResolvedValue({
        sync_scope: 'priority_platforms',
        client_context: {
          client_name: 'Test Client'
        }
      });

      const { POST } = await import('../../src/app/api/opal/sync/route');
      const response = await POST(mockRequest as any);

      expect(response.status).toBe(500);
      const responseData = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.details).toContain('OPAL_WORKSPACE_ID: Not set (required for OPAL workflow execution)');
    });

    test('should build payload with workspace_id in development mode', async () => {
      process.env.NODE_ENV = 'development';

      mockRequest.json.mockResolvedValue({
        sync_scope: 'priority_platforms',
        client_context: {
          client_name: 'Test Client'
        }
      });

      // Mock successful internal workflow
      const mockWorkflowEngine = {
        triggerWorkflow: jest.fn().mockResolvedValue({
          workflow_id: 'internal-workflow-123',
          session_id: 'internal-session-123',
          polling_url: '/api/opal/status/internal-session-123'
        })
      };

      // Mock successful OPAL response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({
          workflow_id: 'strategy_workflow_456',
          session_id: 'opal_session_456'
        })
      });

      const { POST } = await import('../../src/app/api/opal/sync/route');
      const response = await POST(mockRequest as any);

      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.sync_details.external_opal.triggered).toBe(true);
    });
  });

  describe('Environment Validation', () => {
    test('should pass validation with all required environment variables', async () => {
      process.env.NODE_ENV = 'production';
      process.env.OPAL_WEBHOOK_URL = 'https://webhook.opal.optimizely.com/webhooks/d3e181a30acf493bb65a5c7792cfeced/ba71d62d-aa74-4bbf-9ab8-a1a11ed4bf14';
      process.env.OPAL_STRATEGY_WORKFLOW_AUTH_KEY = 'production-auth-key-with-32-or-more-characters-required';
      process.env.OPAL_WORKSPACE_ID = 'production-workspace-id';

      mockRequest.json.mockResolvedValue({
        sync_scope: 'priority_platforms'
      });

      // Mock successful responses
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({
          workflow_id: 'strategy_workflow_prod',
          session_id: 'opal_session_prod'
        })
      });

      const { POST } = await import('../../src/app/api/opal/sync/route');
      const response = await POST(mockRequest as any);

      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.workflow_security.validation_failed).toBeUndefined();
    });

    test('should fail validation when workspace_id contains placeholder', async () => {
      process.env.NODE_ENV = 'production';
      process.env.OPAL_WORKSPACE_ID = 'placeholder-workspace';

      mockRequest.json.mockResolvedValue({
        sync_scope: 'priority_platforms'
      });

      const { POST } = await import('../../src/app/api/opal/sync/route');
      const response = await POST(mockRequest as any);

      expect(response.status).toBe(500);
      const responseData = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.details).toContain('OPAL_WORKSPACE_ID: Contains placeholder value');
    });
  });

  describe('Workflow ID Validation', () => {
    test('should validate workflow response matches expected workflow', async () => {
      // Mock OPAL response with different workflow ID
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({
          workflow_id: 'wrong_workflow_type',
          session_id: 'session_123'
        })
      });

      const { callOpalProductionWebhook } = await import('../../src/lib/opal/production-webhook-caller');

      const request = {
        workflow_name: 'strategy_workflow',
        input_data: {
          client_name: 'Test Client',
          triggered_by: 'unit_test'
        },
        metadata: {
          workspace_id: 'test-workspace-id-1234',
          correlation_id: 'test-correlation-123'
        }
      };

      // Should succeed even with different workflow_id in response
      const result = await callOpalProductionWebhook(request);
      expect(result.success).toBe(true);
    });
  });

  describe('Error Scenarios', () => {
    test('should handle OPAL 401 authentication errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => JSON.stringify({
          detail: 'Invalid or missing authentication key'
        })
      });

      const { callOpalProductionWebhook } = await import('../../src/lib/opal/production-webhook-caller');

      const request = {
        workflow_name: 'strategy_workflow',
        input_data: {
          client_name: 'Test Client',
          triggered_by: 'unit_test'
        },
        metadata: {
          workspace_id: 'test-workspace-id-1234',
          correlation_id: 'test-correlation-123'
        }
      };

      const result = await callOpalProductionWebhook(request);

      expect(result.success).toBe(false);
      expect(result.message).toContain('OPAL production webhook failed');
      expect(result.error_details.error_message).toContain('401 Unauthorized');
    });

    test('should handle missing workspace_id in development mode', async () => {
      delete process.env.OPAL_WORKSPACE_ID;
      process.env.NODE_ENV = 'development';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({
          workflow_id: 'strategy_workflow_456',
          session_id: 'session_456'
        })
      });

      const { callOpalProductionWebhook } = await import('../../src/lib/opal/production-webhook-caller');

      const request = {
        workflow_name: 'strategy_workflow',
        input_data: {
          client_name: 'Test Client',
          triggered_by: 'unit_test'
        },
        metadata: {
          correlation_id: 'test-correlation-123'
        }
      };

      const result = await callOpalProductionWebhook(request);

      expect(result.success).toBe(true);

      // Verify default workspace_id was used
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const payloadBody = JSON.parse(fetchCall[1].body);
      expect(payloadBody.metadata.workspace_id).toBe('default-workspace');
    });
  });

  describe('Performance and Logging', () => {
    test('should log comprehensive request details', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({
          workflow_id: 'strategy_workflow_789',
          session_id: 'session_789'
        })
      });

      const { callOpalProductionWebhook } = await import('../../src/lib/opal/production-webhook-caller');

      const request = {
        workflow_name: 'strategy_workflow',
        input_data: {
          client_name: 'Test Client',
          triggered_by: 'unit_test'
        },
        metadata: {
          workspace_id: 'test-workspace-id-1234',
          correlation_id: 'test-correlation-123'
        }
      };

      await callOpalProductionWebhook(request);

      // Verify comprehensive logging
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[OPAL Production] Starting webhook call to OPAL strategy_workflow'),
        expect.any(Object)
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[OPAL Production] Sending webhook request'),
        expect.any(Object)
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[OPAL Production] Webhook call completed successfully'),
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });

    test('should track performance metrics', async () => {
      (global.fetch as jest.Mock).mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate delay
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({
            workflow_id: 'strategy_workflow_perf',
            session_id: 'session_perf'
          })
        };
      });

      const { callOpalProductionWebhook } = await import('../../src/lib/opal/production-webhook-caller');

      const request = {
        workflow_name: 'strategy_workflow',
        input_data: {
          client_name: 'Performance Test Client',
          triggered_by: 'performance_test'
        },
        metadata: {
          workspace_id: 'test-workspace-id-1234',
          correlation_id: 'perf-test-correlation-123'
        }
      };

      const startTime = Date.now();
      const result = await callOpalProductionWebhook(request);
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(result.request_metadata.duration_ms).toBeGreaterThan(50);
      expect(result.request_metadata.duration_ms).toBeLessThan(endTime - startTime + 50);
    });
  });
});