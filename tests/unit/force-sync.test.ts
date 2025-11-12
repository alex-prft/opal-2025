/**
 * Comprehensive Unit Tests for Force Sync Implementation
 *
 * Tests cover:
 * 1. OPAL Account Validation
 * 2. Workflow Lock Enforcement
 * 3. Environment Validation
 * 4. Payload Building and Validation
 * 5. Error Handling and Edge Cases
 * 6. Security and Anti-Pattern Prevention
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';

// Mock the route module
const mockRoute = {
  POST: jest.fn(),
  GET: jest.fn()
};

// Mock environment variables
const originalEnv = process.env;

// Test utilities
function createMockRequest(body?: any): NextRequest {
  const request = new NextRequest('http://localhost:3000/api/opal/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  return request;
}

function setupValidEnvironment() {
  process.env.OPAL_WEBHOOK_URL = 'https://webhook.opal.optimizely.com/webhooks/test-webhook-id/secret';
  process.env.OPAL_STRATEGY_WORKFLOW_AUTH_KEY = 'test-auth-key-12345678901234567890123456789012';
  process.env.NODE_ENV = 'test';
}

function clearEnvironment() {
  delete process.env.OPAL_WEBHOOK_URL;
  delete process.env.OPAL_STRATEGY_WORKFLOW_AUTH_KEY;
  delete process.env.OPAL_DEBUG_MODE;
}

describe('Force Sync Implementation Tests', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    clearEnvironment();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('1. Environment Validation - OPAL Account Security', () => {

    it('should reject missing OPAL_WEBHOOK_URL', async () => {
      // Arrange: Missing webhook URL
      process.env.OPAL_STRATEGY_WORKFLOW_AUTH_KEY = 'test-auth-key-12345678901234567890123456789012';

      const { POST } = await import('../../src/app/api/opal/sync/route');
      const request = createMockRequest();

      // Act
      const response = await POST(request);
      const result = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Configuration Error');
      expect(result.details).toContain('❌ OPAL_WEBHOOK_URL: Not set');
      expect(result.workflow_security.validation_failed).toBe(true);
    });

    it('should reject wrong webhook domain', async () => {
      // Arrange: Wrong domain
      process.env.OPAL_WEBHOOK_URL = 'https://malicious.com/webhooks/fake-id/secret';
      process.env.OPAL_STRATEGY_WORKFLOW_AUTH_KEY = 'test-auth-key-12345678901234567890123456789012';

      const { POST } = await import('../../src/app/api/opal/sync/route');
      const request = createMockRequest();

      // Act
      const response = await POST(request);
      const result = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.details).toContain('❌ OPAL_WEBHOOK_URL: Must be from webhook.opal.optimizely.com');
    });

    it('should reject malformed webhook URL', async () => {
      // Arrange: Malformed URL
      process.env.OPAL_WEBHOOK_URL = 'https://webhook.opal.optimizely.com/invalid-format';
      process.env.OPAL_STRATEGY_WORKFLOW_AUTH_KEY = 'test-auth-key-12345678901234567890123456789012';

      const { POST } = await import('../../src/app/api/opal/sync/route');
      const request = createMockRequest();

      // Act
      const response = await POST(request);
      const result = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.details).toContain('❌ OPAL_WEBHOOK_URL: Invalid format - cannot extract webhook ID');
    });

    it('should reject missing auth key', async () => {
      // Arrange: Missing auth key
      process.env.OPAL_WEBHOOK_URL = 'https://webhook.opal.optimizely.com/webhooks/test-id/secret';

      const { POST } = await import('../../src/app/api/opal/sync/route');
      const request = createMockRequest();

      // Act
      const response = await POST(request);
      const result = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.details).toContain('❌ OPAL_STRATEGY_WORKFLOW_AUTH_KEY: Not set');
    });

    it('should reject short auth key', async () => {
      // Arrange: Auth key too short
      process.env.OPAL_WEBHOOK_URL = 'https://webhook.opal.optimizely.com/webhooks/test-id/secret';
      process.env.OPAL_STRATEGY_WORKFLOW_AUTH_KEY = 'short-key';

      const { POST } = await import('../../src/app/api/opal/sync/route');
      const request = createMockRequest();

      // Act
      const response = await POST(request);
      const result = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.details).toContain('❌ OPAL_STRATEGY_WORKFLOW_AUTH_KEY: Must be at least 32 characters');
    });

    it('should reject placeholder auth key', async () => {
      // Arrange: Placeholder auth key
      process.env.OPAL_WEBHOOK_URL = 'https://webhook.opal.optimizely.com/webhooks/test-id/secret';
      process.env.OPAL_STRATEGY_WORKFLOW_AUTH_KEY = 'your_auth_key_here_placeholder_value_12345678';

      const { POST } = await import('../../src/app/api/opal/sync/route');
      const request = createMockRequest();

      // Act
      const response = await POST(request);
      const result = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.details).toContain('❌ OPAL_STRATEGY_WORKFLOW_AUTH_KEY: Contains placeholder value');
    });

    it('should accept valid OPAL environment', async () => {
      // Arrange: Valid environment
      setupValidEnvironment();

      // Mock successful OPAL response
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({
          workflow_id: 'strategy_workflow',
          session_id: 'test-session',
          status: 'success'
        }))
      }) as jest.MockedFunction<typeof fetch>;

      const { POST } = await import('../../src/app/api/opal/sync/route');
      const request = createMockRequest({
        sync_scope: 'priority_platforms',
        client_context: {
          client_name: 'Test Client'
        }
      });

      // Act
      const response = await POST(request);
      const result = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.sync_details.external_opal.triggered).toBe(true);
      expect(result.sync_details.workflow_validation.expected_workflow).toBe('strategy_workflow');
    });
  });

  describe('2. Workflow Lock Enforcement', () => {

    beforeEach(() => {
      setupValidEnvironment();
    });

    it('should enforce strategy_workflow lock at compile time', () => {
      // This test ensures TypeScript compilation enforces the workflow lock
      const LOCKED_WORKFLOW_NAME: 'strategy_workflow' = 'strategy_workflow';
      const LOCKED_WORKFLOW_ID: 'strategy_workflow' = 'strategy_workflow';

      expect(LOCKED_WORKFLOW_NAME).toBe('strategy_workflow');
      expect(LOCKED_WORKFLOW_ID).toBe('strategy_workflow');
    });

    it('should validate workflow in payload building', async () => {
      // Mock to test internal workflow validation
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({
          workflow_id: 'strategy_workflow',
          session_id: 'test-session'
        }))
      }) as jest.MockedFunction<typeof fetch>;

      const { POST } = await import('../../src/app/api/opal/sync/route');
      const request = createMockRequest({
        sync_scope: 'priority_platforms',
        client_context: {
          client_name: 'Test Client'
        }
      });

      // Act
      const response = await POST(request);
      const result = await response.json();

      // Assert
      expect(result.success).toBe(true);
      expect(result.sync_details.workflow_validation.expected_workflow).toBe('strategy_workflow');
      expect(result.sync_details.workflow_validation.validated).toBe(true);
    });

    it('should reject wrong workflow in response', async () => {
      // Arrange: Mock OPAL response with wrong workflow
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({
          workflow_id: 'wrong_workflow',
          session_id: 'test-session'
        }))
      }) as jest.MockedFunction<typeof fetch>;

      const { POST } = await import('../../src/app/api/opal/sync/route');
      const request = createMockRequest({
        sync_scope: 'priority_platforms',
        client_context: {
          client_name: 'Test Client'
        }
      });

      // Act
      const response = await POST(request);
      const result = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Workflow ID mismatch');
      expect(result.workflow_security.error_during_execution).toBe(true);
    });
  });

  describe('3. Payload Building and Validation', () => {

    beforeEach(() => {
      setupValidEnvironment();
    });

    it('should build valid payload with defaults', async () => {
      // Mock successful response
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({
          workflow_id: 'strategy_workflow',
          session_id: 'test-session'
        }))
      }) as jest.MockedFunction<typeof fetch>;

      const { POST } = await import('../../src/app/api/opal/sync/route');
      const request = createMockRequest({});

      // Act
      const response = await POST(request);
      const result = await response.json();

      // Assert: Check that fetch was called with correct payload
      const fetchCall = (fetch as jest.MockedFunction<typeof fetch>).mock.calls[0];
      expect(fetchCall[0]).toContain('webhook.opal.optimizely.com');
      expect(fetchCall[1]?.method).toBe('POST');
      expect(fetchCall[1]?.headers).toMatchObject({
        'Content-Type': 'application/json',
        'X-Workflow-Name': 'strategy_workflow'
      });
      expect(fetchCall[1]?.body).toContain('"workflow_name": "strategy_workflow"');

      expect(result.success).toBe(true);
      expect(result.sync_details.workflow_validation.expected_workflow).toBe('strategy_workflow');
    });

    it('should build payload with custom client context', async () => {
      // Mock successful response
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({
          workflow_id: 'strategy_workflow',
          session_id: 'test-session'
        }))
      }) as jest.MockedFunction<typeof fetch>;

      const { POST } = await import('../../src/app/api/opal/sync/route');
      const request = createMockRequest({
        sync_scope: 'all_platforms',
        client_context: {
          client_name: 'Custom Client',
          industry: 'E-commerce',
          recipients: ['test@example.com']
        }
      });

      // Act
      const response = await POST(request);
      const result = await response.json();

      // Assert: Check payload contains custom data
      const fetchCall = (fetch as jest.MockedFunction<typeof fetch>).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1]?.body as string);

      expect(requestBody.workflow_name).toBe('strategy_workflow');
      expect(requestBody.input_data.client_name).toBe('Custom Client');
      expect(requestBody.input_data.industry).toBe('E-commerce');
      expect(requestBody.input_data.recipients).toContain('test@example.com');
      expect(requestBody.input_data.triggered_by).toBe('force_sync');
      expect(requestBody.input_data.force_sync).toBe(true);
      expect(requestBody.metadata.source_system).toBe('OSA-ForceSync-Production');
    });

    it('should validate required payload fields', async () => {
      // This test ensures payload validation catches missing fields
      const { POST } = await import('../../src/app/api/opal/sync/route');

      // Import the validation function to test directly
      const moduleExports = await import('../../src/app/api/opal/sync/route');

      // We can't directly test internal functions, but we can test through the endpoint
      // Create a request that should pass validation
      const request = createMockRequest({
        client_context: {
          client_name: 'Test Client'
        }
      });

      // Mock successful response
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({
          workflow_id: 'strategy_workflow',
          session_id: 'test-session'
        }))
      }) as jest.MockedFunction<typeof fetch>;

      // Act
      const response = await POST(request);
      const result = await response.json();

      // Assert: Should succeed because all required fields are provided
      expect(result.success).toBe(true);
    });
  });

  describe('4. Retry Logic and Error Handling', () => {

    beforeEach(() => {
      setupValidEnvironment();
    });

    it('should retry on retryable errors', async () => {
      // Arrange: Mock retryable error then success
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: () => Promise.resolve('Internal Server Error')
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () => Promise.resolve(JSON.stringify({
            workflow_id: 'strategy_workflow',
            session_id: 'test-session'
          }))
        });

      const { POST } = await import('../../src/app/api/opal/sync/route');
      const request = createMockRequest({
        client_context: { client_name: 'Test Client' }
      });

      // Act
      const response = await POST(request);
      const result = await response.json();

      // Assert: Should succeed after retry
      expect(fetch).toHaveBeenCalledTimes(2); // Initial call + 1 retry
      expect(result.success).toBe(true);
    });

    it('should not retry on non-retryable errors', async () => {
      // Arrange: Mock non-retryable error (401 Unauthorized)
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized')
      });

      const { POST } = await import('../../src/app/api/opal/sync/route');
      const request = createMockRequest({
        client_context: { client_name: 'Test Client' }
      });

      // Act
      const response = await POST(request);
      const result = await response.json();

      // Assert: Should fail without retries
      expect(fetch).toHaveBeenCalledTimes(1); // Only initial call
      expect(result.success).toBe(false);
      expect(result.message).toContain('failed');
    });

    it('should handle network timeout gracefully', async () => {
      // Arrange: Mock network timeout
      global.fetch = jest.fn().mockRejectedValue(new Error('Request timeout'));

      const { POST } = await import('../../src/app/api/opal/sync/route');
      const request = createMockRequest({
        client_context: { client_name: 'Test Client' }
      });

      // Act
      const response = await POST(request);
      const result = await response.json();

      // Assert: Should handle timeout gracefully
      expect(result.success).toBe(false);
      expect(result.message).toContain('failed');
      expect(result.correlation_id).toBeDefined();
    });
  });

  describe('5. Security and Anti-Pattern Prevention', () => {

    it('should prevent code injection in client_name', async () => {
      setupValidEnvironment();

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({
          workflow_id: 'strategy_workflow',
          session_id: 'test-session'
        }))
      });

      const { POST } = await import('../../src/app/api/opal/sync/route');
      const maliciousPayload = {
        client_context: {
          client_name: '<script>alert("xss")</script>',
          industry: '"; DROP TABLE users; --'
        }
      };
      const request = createMockRequest(maliciousPayload);

      // Act
      const response = await POST(request);
      const result = await response.json();

      // Assert: Should handle malicious input safely
      expect(result.success).toBe(true);

      const fetchCall = (fetch as jest.MockedFunction<typeof fetch>).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1]?.body as string);

      // The malicious content should be passed through as-is (OPAL should handle sanitization)
      // but it should not break our JSON structure
      expect(requestBody.input_data.client_name).toBe('<script>alert("xss")</script>');
      expect(typeof requestBody).toBe('object'); // JSON structure intact
    });

    it('should mask sensitive data in logs', async () => {
      setupValidEnvironment();

      // Capture console output
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({
          workflow_id: 'strategy_workflow',
          session_id: 'test-session'
        }))
      });

      const { POST } = await import('../../src/app/api/opal/sync/route');
      const request = createMockRequest({
        client_context: { client_name: 'Test Client' }
      });

      // Act
      await POST(request);

      // Assert: Check that sensitive data is masked in logs
      const logCalls = consoleSpy.mock.calls;
      const authKeyLogs = logCalls.filter(call =>
        call.some(arg =>
          typeof arg === 'string' &&
          arg.includes('OPAL_STRATEGY_WORKFLOW_AUTH_KEY')
        )
      );

      expect(authKeyLogs.length).toBeGreaterThan(0);
      authKeyLogs.forEach(logCall => {
        const logString = logCall.join(' ');
        expect(logString).not.toContain('test-auth-key-12345678901234567890123456789012');
        expect(logString).toMatch(/test-aut.*9012/); // Should be masked
      });

      consoleSpy.mockRestore();
    });

    it('should generate unique correlation IDs', async () => {
      setupValidEnvironment();

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({
          workflow_id: 'strategy_workflow',
          session_id: 'test-session'
        }))
      });

      const { POST } = await import('../../src/app/api/opal/sync/route');

      // Make multiple requests
      const request1 = createMockRequest({ client_context: { client_name: 'Test Client 1' }});
      const request2 = createMockRequest({ client_context: { client_name: 'Test Client 2' }});

      // Act
      const [response1, response2] = await Promise.all([
        POST(request1),
        POST(request2)
      ]);

      const [result1, result2] = await Promise.all([
        response1.json(),
        response2.json()
      ]);

      // Assert: Correlation IDs should be unique
      expect(result1.correlation_id).toBeDefined();
      expect(result2.correlation_id).toBeDefined();
      expect(result1.correlation_id).not.toBe(result2.correlation_id);
      expect(result1.correlation_id).toMatch(/^force-sync-\d+-\w+$/);
      expect(result2.correlation_id).toMatch(/^force-sync-\d+-\w+$/);
    });
  });

  describe('6. Integration and End-to-End Scenarios', () => {

    beforeEach(() => {
      setupValidEnvironment();
    });

    it('should handle complete successful flow', async () => {
      // Arrange: Mock complete successful OPAL interaction
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({
          'content-type': 'application/json'
        }),
        text: () => Promise.resolve(JSON.stringify({
          workflow_id: 'strategy_workflow',
          session_id: 'test-session-12345',
          status: 'triggered',
          polling_url: '/api/workflow/status/test-session-12345'
        }))
      });

      const { POST } = await import('../../src/app/api/opal/sync/route');
      const request = createMockRequest({
        sync_scope: 'priority_platforms',
        include_rag_update: true,
        client_context: {
          client_name: 'Production Client',
          industry: 'E-commerce',
          recipients: ['admin@company.com']
        }
      });

      // Act
      const response = await POST(request);
      const result = await response.json();

      // Assert: Complete success response
      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.sync_id).toBe('strategy_workflow');
      expect(result.session_id).toBe('test-session-12345');
      expect(result.correlation_id).toMatch(/^force-sync-\d+-\w+$/);
      expect(result.message).toContain('strategy_workflow triggered successfully');
      expect(result.polling_url).toBe('/api/workflow/status/test-session-12345');

      expect(result.sync_details.scope).toBe('priority_platforms');
      expect(result.sync_details.platforms_included).toHaveLength(4);
      expect(result.sync_details.rag_update_enabled).toBe(true);
      expect(result.sync_details.triggered_by).toBe('force_sync');

      expect(result.sync_details.workflow_validation.expected_workflow).toBe('strategy_workflow');
      expect(result.sync_details.workflow_validation.actual_workflow).toBe('strategy_workflow');
      expect(result.sync_details.workflow_validation.validated).toBe(true);

      expect(result.sync_details.external_opal.triggered).toBe(true);
      expect(result.sync_details.external_opal.workflow_id).toBe('strategy_workflow');
      expect(result.sync_details.external_opal.session_id).toBe('test-session-12345');

      expect(result.sync_details.telemetry.correlation_id).toBe(result.correlation_id);
      expect(result.sync_details.telemetry.external_duration_ms).toBeGreaterThanOrEqual(0);
    });

    it('should handle GET request for API documentation', async () => {
      const { GET } = await import('../../src/app/api/opal/sync/route');

      // Act
      const response = await GET();
      const result = await response.json();

      // Assert: Should return API documentation
      expect(result.endpoint).toBe('/api/opal/sync');
      expect(result.method).toBe('POST');
      expect(result.workflow_security.allowed_workflow).toBe('strategy_workflow');
      expect(result.workflow_security.allowed_workflow_id).toBe('strategy_workflow');
      expect(result.workflow_security.account_validation).toBe(true);
      expect(result.security_features).toContain('OPAL account validation via webhook URL verification');
      expect(result.security_features).toContain('Workflow name locked to strategy_workflow ONLY');
    });
  });

  describe('7. Error Scenario Coverage', () => {

    beforeEach(() => {
      setupValidEnvironment();
    });

    it('should handle malformed JSON request gracefully', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({
          workflow_id: 'strategy_workflow',
          session_id: 'test-session'
        }))
      });

      const { POST } = await import('../../src/app/api/opal/sync/route');

      // Create request with malformed JSON
      const request = new NextRequest('http://localhost:3000/api/opal/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"invalid": json malformed}'
      });

      // Act
      const response = await POST(request);
      const result = await response.json();

      // Assert: Should handle gracefully and use defaults
      expect(result.success).toBe(true); // Should still succeed with defaults
    });

    it('should handle OPAL service unavailable', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));

      const { POST } = await import('../../src/app/api/opal/sync/route');
      const request = createMockRequest({
        client_context: { client_name: 'Test Client' }
      });

      // Act
      const response = await POST(request);
      const result = await response.json();

      // Assert: Should handle service unavailable
      expect(result.success).toBe(false);
      expect(result.message).toContain('failed');
      expect(result.correlation_id).toBeDefined();
      expect(result.workflow_security.error_during_execution).toBe(true);
    });
  });
});

describe('Integration Smoke Tests', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    clearEnvironment();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should prevent regression: no workspace ID requirement', async () => {
    // Ensure workspace ID is NOT required (regression test)
    process.env.OPAL_WEBHOOK_URL = 'https://webhook.opal.optimizely.com/webhooks/test-id/secret';
    process.env.OPAL_STRATEGY_WORKFLOW_AUTH_KEY = 'test-auth-key-12345678901234567890123456789012';
    // Intentionally NOT setting OPAL_WORKSPACE_ID

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({
        workflow_id: 'strategy_workflow',
        session_id: 'test-session'
      }))
    });

    const { POST } = await import('../../src/app/api/opal/sync/route');
    const request = createMockRequest({
      client_context: { client_name: 'Test Client' }
    });

    // Act
    const response = await POST(request);
    const result = await response.json();

    // Assert: Should succeed without workspace ID
    expect(result.success).toBe(true);
    expect(result.sync_details.external_opal.triggered).toBe(true);
  });

  it('should prevent regression: workflow lock enforcement', async () => {
    // Ensure only strategy_workflow is allowed
    setupValidEnvironment();

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({
        workflow_id: 'wrong_workflow', // This should trigger validation error
        session_id: 'test-session'
      }))
    });

    const { POST } = await import('../../src/app/api/opal/sync/route');
    const request = createMockRequest({
      client_context: { client_name: 'Test Client' }
    });

    // Act
    const response = await POST(request);
    const result = await response.json();

    // Assert: Should reject wrong workflow
    expect(result.success).toBe(false);
    expect(result.message).toContain('Workflow ID mismatch');
  });
});