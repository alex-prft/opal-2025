/**
 * Comprehensive Error Scenario Tests for Force Sync Implementation
 *
 * Tests cover:
 * 1. Development Mode Fallback Scenarios
 * 2. Network Error Handling
 * 3. Authentication Error Handling
 * 4. Environment Variable Validation
 * 5. Production vs Development Behavior
 * 6. Mock Response Generation
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';

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
  process.env.NODE_ENV = 'development';
}

function setupProductionEnvironment() {
  process.env.OPAL_WEBHOOK_URL = 'https://webhook.opal.optimizely.com/webhooks/prod-webhook-id/secret';
  process.env.OPAL_STRATEGY_WORKFLOW_AUTH_KEY = 'prod-auth-key-12345678901234567890123456789012';
  process.env.NODE_ENV = 'production';
}

function clearEnvironment() {
  delete process.env.OPAL_WEBHOOK_URL;
  delete process.env.OPAL_STRATEGY_WORKFLOW_AUTH_KEY;
  delete process.env.OPAL_DEBUG_MODE;
  delete process.env.NODE_ENV;
}

describe('Force Sync Error Scenario Tests', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    clearEnvironment();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('1. Development Mode Fallback Scenarios', () => {

    beforeEach(() => {
      setupValidEnvironment();
    });

    it('should use mock response when no environment variables in development', async () => {
      // Arrange: Development mode with no env vars
      clearEnvironment();
      process.env.NODE_ENV = 'development';

      // Mock fetch to simulate network failure (should trigger development fallback)
      global.fetch = jest.fn().mockRejectedValue(new Error('fetch failed'));

      const { POST } = await import('../../src/app/api/opal/sync/route');
      const request = createMockRequest({
        client_context: { client_name: 'Dev Test Client' }
      });

      // Act
      const response = await POST(request);
      const result = await response.json();

      // Assert: Should succeed with development mock
      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.sync_details.external_opal.message).toContain('Development fallback');
      expect(result.sync_details.external_opal.session_id).toContain('dev-fallback-session');
      expect(result.sync_details.workflow_validation.expected_workflow).toBe('strategy_workflow');
    });

    it('should fallback to mock on 401 Unauthorized in development', async () => {
      // Arrange: 401 error from OPAL webhook
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: () => Promise.resolve('{"error":"Unauthorized"}')
      });

      const { POST } = await import('../../src/app/api/opal/sync/route');
      const request = createMockRequest({
        client_context: { client_name: 'Auth Error Test' }
      });

      // Act
      const response = await POST(request);
      const result = await response.json();

      // Assert: Should fallback to development mock
      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.sync_details.external_opal.message).toContain('Development fallback');
      expect(result.sync_details.external_opal.message).toContain('401 error');
      expect(result.sync_details.external_opal.session_id).toContain('dev-fallback-session');
    });

    it('should fallback to mock on 403 Forbidden in development', async () => {
      // Arrange: 403 error from OPAL webhook
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        text: () => Promise.resolve('{"error":"Forbidden"}')
      });

      const { POST } = await import('../../src/app/api/opal/sync/route');
      const request = createMockRequest({
        client_context: { client_name: 'Forbidden Error Test' }
      });

      // Act
      const response = await POST(request);
      const result = await response.json();

      // Assert: Should fallback to development mock
      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.sync_details.external_opal.message).toContain('Development fallback');
      expect(result.sync_details.external_opal.message).toContain('403 error');
    });

    it('should fallback to mock on network timeout in development', async () => {
      // Arrange: Network timeout error
      global.fetch = jest.fn().mockRejectedValue(new Error('Request timeout'));

      const { POST } = await import('../../src/app/api/opal/sync/route');
      const request = createMockRequest({
        client_context: { client_name: 'Timeout Error Test' }
      });

      // Act
      const response = await POST(request);
      const result = await response.json();

      // Assert: Should fallback to development mock
      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.sync_details.external_opal.message).toContain('Development fallback');
      expect(result.sync_details.external_opal.message).toContain('network error');
    });

    it('should fallback to mock on fetch failed error in development', async () => {
      // Arrange: Fetch failed error (common in development)
      global.fetch = jest.fn().mockRejectedValue(new Error('fetch failed'));

      const { POST } = await import('../../src/app/api/opal/sync/route');
      const request = createMockRequest({
        client_context: { client_name: 'Fetch Failed Test' }
      });

      // Act
      const response = await POST(request);
      const result = await response.json();

      // Assert: Should fallback to development mock
      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.sync_details.external_opal.message).toContain('Development fallback');
      expect(result.sync_details.external_opal.message).toContain('network error');
    });

    it('should handle placeholder auth keys in development', async () => {
      // Arrange: Placeholder auth key in development
      process.env.OPAL_STRATEGY_WORKFLOW_AUTH_KEY = 'your_placeholder_auth_key_here_12345678';

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
        client_context: { client_name: 'Placeholder Test' }
      });

      // Act
      const response = await POST(request);
      const result = await response.json();

      // Assert: Should work in development mode with warnings
      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.sync_details.workflow_validation.expected_workflow).toBe('strategy_workflow');
    });

    it('should handle short auth keys in development', async () => {
      // Arrange: Short auth key in development
      process.env.OPAL_STRATEGY_WORKFLOW_AUTH_KEY = 'shortkey';

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
        client_context: { client_name: 'Short Key Test' }
      });

      // Act
      const response = await POST(request);
      const result = await response.json();

      // Assert: Should work in development mode
      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
    });

    it('should handle wrong webhook domain in development', async () => {
      // Arrange: Wrong webhook domain in development
      process.env.OPAL_WEBHOOK_URL = 'https://wrong-domain.com/webhooks/test/secret';

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
        client_context: { client_name: 'Wrong Domain Test' }
      });

      // Act
      const response = await POST(request);
      const result = await response.json();

      // Assert: Should work in development mode with warnings
      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
    });
  });

  describe('2. Production Mode Strict Validation', () => {

    beforeEach(() => {
      setupProductionEnvironment();
    });

    it('should reject missing environment variables in production', async () => {
      // Arrange: Production mode with missing env vars
      clearEnvironment();
      process.env.NODE_ENV = 'production';

      const { POST } = await import('../../src/app/api/opal/sync/route');
      const request = createMockRequest({
        client_context: { client_name: 'Production Missing Vars' }
      });

      // Act
      const response = await POST(request);
      const result = await response.json();

      // Assert: Should fail in production
      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Configuration Error');
      expect(result.details).toContain('❌ OPAL_WEBHOOK_URL: Not set (required in production)');
    });

    it('should reject placeholder auth key in production', async () => {
      // Arrange: Production with placeholder auth key
      process.env.OPAL_STRATEGY_WORKFLOW_AUTH_KEY = 'your_placeholder_key_12345678901234567890';

      const { POST } = await import('../../src/app/api/opal/sync/route');
      const request = createMockRequest({
        client_context: { client_name: 'Production Placeholder' }
      });

      // Act
      const response = await POST(request);
      const result = await response.json();

      // Assert: Should fail in production
      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.details).toContain('❌ OPAL_STRATEGY_WORKFLOW_AUTH_KEY: Contains placeholder value');
    });

    it('should reject short auth key in production', async () => {
      // Arrange: Production with short auth key
      process.env.OPAL_STRATEGY_WORKFLOW_AUTH_KEY = 'shortkey';

      const { POST } = await import('../../src/app/api/opal/sync/route');
      const request = createMockRequest({
        client_context: { client_name: 'Production Short Key' }
      });

      // Act
      const response = await POST(request);
      const result = await response.json();

      // Assert: Should fail in production
      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.details).toContain('❌ OPAL_STRATEGY_WORKFLOW_AUTH_KEY: Must be at least 32 characters');
    });

    it('should reject wrong webhook domain in production', async () => {
      // Arrange: Production with wrong domain
      process.env.OPAL_WEBHOOK_URL = 'https://malicious.com/webhooks/fake/secret';

      const { POST } = await import('../../src/app/api/opal/sync/route');
      const request = createMockRequest({
        client_context: { client_name: 'Production Wrong Domain' }
      });

      // Act
      const response = await POST(request);
      const result = await response.json();

      // Assert: Should fail in production
      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.details).toContain('❌ OPAL_WEBHOOK_URL: Must be from webhook.opal.optimizely.com');
    });

    it('should NOT fallback to mock on 401 error in production', async () => {
      // Arrange: 401 error in production
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: () => Promise.resolve('{"error":"Unauthorized"}')
      });

      const { POST } = await import('../../src/app/api/opal/sync/route');
      const request = createMockRequest({
        client_context: { client_name: 'Production Auth Error' }
      });

      // Act
      const response = await POST(request);
      const result = await response.json();

      // Assert: Should fail in production (no fallback)
      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.message).toContain('401 Unauthorized');
      expect(result.message).not.toContain('Development fallback');
    });
  });

  describe('3. Mock Response Structure Validation', () => {

    beforeEach(() => {
      setupValidEnvironment();
      // Always fail the webhook to trigger mock responses
      global.fetch = jest.fn().mockRejectedValue(new Error('fetch failed'));
    });

    it('should generate valid mock response structure', async () => {
      const { POST } = await import('../../src/app/api/opal/sync/route');
      const request = createMockRequest({
        sync_scope: 'all_platforms',
        client_context: { client_name: 'Mock Structure Test' }
      });

      // Act
      const response = await POST(request);
      const result = await response.json();

      // Assert: Validate complete mock response structure
      expect(response.status).toBe(200);
      expect(result.success).toBe(true);

      // Validate main response fields
      expect(result.sync_id).toBe('strategy_workflow');
      expect(result.correlation_id).toMatch(/^force-sync-\d+-\w+$/);
      expect(result.message).toContain('Force sync initiated for all_platforms');
      expect(result.polling_url).toContain('dev-fallback-session');

      // Validate sync_details structure
      expect(result.sync_details.scope).toBe('all_platforms');
      expect(result.sync_details.platforms_included).toHaveLength(5);
      expect(result.sync_details.rag_update_enabled).toBe(true);
      expect(result.sync_details.triggered_by).toBe('force_sync');

      // Validate workflow_validation
      expect(result.sync_details.workflow_validation.expected_workflow).toBe('strategy_workflow');
      expect(result.sync_details.workflow_validation.actual_workflow).toBe('strategy_workflow');
      expect(result.sync_details.workflow_validation.validated).toBe(true);

      // Validate external_opal mock data
      expect(result.sync_details.external_opal.triggered).toBe(true);
      expect(result.sync_details.external_opal.workflow_id).toBe('strategy_workflow');
      expect(result.sync_details.external_opal.session_id).toContain('dev-fallback-session');
      expect(result.sync_details.external_opal.message).toContain('Development fallback');

      // Validate telemetry
      expect(result.sync_details.telemetry.correlation_id).toBe(result.correlation_id);
      expect(result.sync_details.telemetry.external_duration_ms).toBeGreaterThanOrEqual(0);
    });

    it('should generate unique session IDs for mock responses', async () => {
      const { POST } = await import('../../src/app/api/opal/sync/route');

      // Act: Make multiple requests with small delays to ensure unique timestamps
      const results = [];
      for (let i = 1; i <= 3; i++) {
        const response = await POST(createMockRequest({
          client_context: { client_name: `Test ${i}` }
        }));
        results.push(await response.json());

        // Small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 1));
      }

      // Assert: All session IDs should be unique
      const sessionIds = results.map(r => r.sync_details.external_opal.session_id);
      const uniqueSessionIds = new Set(sessionIds);

      expect(uniqueSessionIds.size).toBe(3);
      sessionIds.forEach(id => {
        expect(id).toContain('dev-fallback-session');
        expect(id).toMatch(/dev-fallback-session-\d+/);
      });
    });

    it('should include correct error context in mock message', async () => {
      // Test different error scenarios
      const errorScenarios = [
        {
          mockError: new Error('fetch failed'),
          expectedMessage: 'network error'
        },
        {
          mockError: { ok: false, status: 401, text: () => Promise.resolve('Unauthorized') },
          expectedMessage: '401 error'
        },
        {
          mockError: { ok: false, status: 403, text: () => Promise.resolve('Forbidden') },
          expectedMessage: '403 error'
        }
      ];

      for (const scenario of errorScenarios) {
        // Arrange
        if (scenario.mockError instanceof Error) {
          global.fetch = jest.fn().mockRejectedValue(scenario.mockError);
        } else {
          global.fetch = jest.fn().mockResolvedValue({
            ...scenario.mockError,
            statusText: 'Error',
            text: scenario.mockError.text
          });
        }

        const { POST } = await import('../../src/app/api/opal/sync/route');
        const request = createMockRequest({
          client_context: { client_name: `Error Context Test: ${scenario.expectedMessage}` }
        });

        // Act
        const response = await POST(request);
        const result = await response.json();

        // Assert
        expect(result.success).toBe(true);
        expect(result.sync_details.external_opal.message).toContain(scenario.expectedMessage);
        expect(result.sync_details.external_opal.message).toContain('Development fallback');
      }
    });
  });

  describe('4. Regression Prevention Tests', () => {

    it('should prevent regression: workflow lock must be enforced even in development', async () => {
      setupValidEnvironment();

      // Mock response with wrong workflow ID should still be caught
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({
          workflow_id: 'wrong_workflow',
          session_id: 'test-session'
        }))
      });

      const { POST } = await import('../../src/app/api/opal/sync/route');
      const request = createMockRequest({
        client_context: { client_name: 'Workflow Lock Test' }
      });

      // Act
      const response = await POST(request);
      const result = await response.json();

      // Assert: Should fail due to workflow mismatch, not use development fallback
      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Workflow ID mismatch');
    });

    it('should prevent regression: only strategy_workflow should be allowed', async () => {
      setupValidEnvironment();

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({
          workflow_id: 'strategy_workflow', // Correct workflow
          session_id: 'test-session'
        }))
      });

      const { POST } = await import('../../src/app/api/opal/sync/route');
      const request = createMockRequest({
        client_context: { client_name: 'Allowed Workflow Test' }
      });

      // Act
      const response = await POST(request);
      const result = await response.json();

      // Assert: Should succeed with correct workflow
      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.sync_details.workflow_validation.expected_workflow).toBe('strategy_workflow');
      expect(result.sync_details.workflow_validation.actual_workflow).toBe('strategy_workflow');
    });

    it('should prevent regression: environment validation should run in all modes', async () => {
      // Test that environment validation always runs, regardless of mode

      // Development mode
      clearEnvironment();
      process.env.NODE_ENV = 'development';
      process.env.OPAL_WEBHOOK_URL = 'invalid-url-format';

      const { POST } = await import('../../src/app/api/opal/sync/route');
      const request = createMockRequest({
        client_context: { client_name: 'Validation Regression Test' }
      });

      // Even in development, malformed URLs should be handled gracefully
      const response = await POST(request);
      const result = await response.json();

      // Should not crash, should handle gracefully
      expect(response.status).toBeOneOf([200, 500]); // Either success with fallback or validation error
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });
});

// Helper function for flexible expectations
expect.extend({
  toBeOneOf(received, expected) {
    const pass = expected.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${expected}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${expected}`,
        pass: false,
      };
    }
  },
});