/**
 * OPAL Discovery Endpoint Unit Tests
 *
 * Comprehensive test suite to prevent recurrence of discovery endpoint issues:
 * - "Discovery URL does not return valid functions data"
 * - "'str' object has no attribute 'get'"
 * - Invalid JSON structure errors
 *
 * These tests ensure the discovery endpoint always returns the correct
 * format expected by Optimizely OPAL for tool registration.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, OPTIONS, POST } from '@/app/api/opal/discovery/route';

// Mock Next.js request
function createMockRequest(method: string = 'GET', userAgent?: string): NextRequest {
  const url = 'http://localhost:3000/api/opal/discovery';
  const req = new NextRequest(url, { method });

  if (userAgent) {
    req.headers.set('user-agent', userAgent);
  }

  return req;
}

describe('OPAL Discovery Endpoint', () => {
  beforeEach(() => {
    // Clear console mocks
    vi.clearAllMocks();

    // Mock console methods to prevent test output noise
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('GET /api/opal/discovery', () => {
    it('should return valid JSON with correct structure', async () => {
      const request = createMockRequest('GET');
      const response = await GET(request);

      expect(response.status).toBe(200);

      const data = await response.json();

      // Verify top-level structure
      expect(data).toHaveProperty('tools');
      expect(data).toHaveProperty('metadata');

      // Verify tools structure
      expect(data.tools).toHaveProperty('osa_workflow_data');
      expect(typeof data.tools).toBe('object');

      // Verify metadata structure
      expect(data.metadata).toHaveProperty('service_name');
      expect(data.metadata).toHaveProperty('version');
      expect(data.metadata).toHaveProperty('supported_agents');
    });

    it('should return osa_workflow_data tool with correct format', async () => {
      const request = createMockRequest('GET');
      const response = await GET(request);
      const data = await response.json();

      const tool = data.tools.osa_workflow_data;

      // Verify tool basic properties
      expect(tool).toHaveProperty('name', 'osa_workflow_data');
      expect(tool).toHaveProperty('description');
      expect(tool).toHaveProperty('function');
      expect(tool).toHaveProperty('endpoint');

      // Verify function definition
      expect(tool.function).toHaveProperty('name', 'osa_workflow_data');
      expect(tool.function).toHaveProperty('parameters');
      expect(tool.function).toHaveProperty('returns');

      // Verify endpoint configuration
      expect(tool.endpoint).toHaveProperty('url');
      expect(tool.endpoint).toHaveProperty('method', 'POST');
      expect(tool.endpoint).toHaveProperty('headers');
    });

    it('should include required parameters with correct types', async () => {
      const request = createMockRequest('GET');
      const response = await GET(request);
      const data = await response.json();

      const parameters = data.tools.osa_workflow_data.function.parameters;

      // Verify parameter structure
      expect(parameters).toHaveProperty('type', 'object');
      expect(parameters).toHaveProperty('properties');
      expect(parameters).toHaveProperty('required');

      // Verify required parameters
      expect(parameters.required).toContain('workflow_id');
      expect(parameters.required).toContain('agent_data');

      // Verify workflow_id parameter
      expect(parameters.properties.workflow_id).toEqual({
        type: 'string',
        description: 'Unique identifier for the Opal workflow execution'
      });

      // Verify agent_data parameter
      expect(parameters.properties.agent_data).toHaveProperty('type', 'array');
      expect(parameters.properties.agent_data).toHaveProperty('description');
      expect(parameters.properties.agent_data).toHaveProperty('items');
    });

    it('should include all 9 supported agent IDs in enum', async () => {
      const request = createMockRequest('GET');
      const response = await GET(request);
      const data = await response.json();

      const agentIdEnum = data.tools.osa_workflow_data.function.parameters.properties.agent_data.items.properties.agent_id.enum;

      const expectedAgents = [
        'experiment_blueprinter',
        'audience_suggester',
        'content_review',
        'roadmap_generator',
        'integration_health',
        'personalization_idea_generator',
        'cmp_organizer',
        'customer_journey',
        'geo_audit'
      ];

      expect(agentIdEnum).toEqual(expect.arrayContaining(expectedAgents));
      expect(agentIdEnum).toHaveLength(9);
    });

    it('should include proper return type specification', async () => {
      const request = createMockRequest('GET');
      const response = await GET(request);
      const data = await response.json();

      const returns = data.tools.osa_workflow_data.function.returns;

      // Verify return type structure
      expect(returns).toHaveProperty('type', 'object');
      expect(returns).toHaveProperty('properties');

      // Verify return properties
      expect(returns.properties).toHaveProperty('workflow_id');
      expect(returns.properties).toHaveProperty('status');
      expect(returns.properties).toHaveProperty('agents_received');
      expect(returns.properties).toHaveProperty('total_agents');
      expect(returns.properties).toHaveProperty('message');
      expect(returns.properties).toHaveProperty('timestamp');

      // Verify status enum values
      expect(returns.properties.status.enum).toEqual([
        'received', 'processing', 'completed', 'failed'
      ]);
    });

    it('should set correct response headers', async () => {
      const request = createMockRequest('GET');
      const response = await GET(request);

      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, OPTIONS');
      expect(response.headers.get('X-OPAL-Discovery-Version')).toBe('1.0.0');
      expect(response.headers.get('X-Service-Name')).toBe('OSA-Opal-Connector-Agents');
    });

    it('should handle different environments for endpoint URL', async () => {
      const originalNodeEnv = process.env.NODE_ENV;

      try {
        // Test production environment
        process.env.NODE_ENV = 'production';
        const request = createMockRequest('GET');
        const response = await GET(request);
        const data = await response.json();

        expect(data.tools.osa_workflow_data.endpoint.url).toBe('https://ifpa-strategy.vercel.app/api/opal/osa-workflow');

        // Test development environment
        process.env.NODE_ENV = 'development';
        const request2 = createMockRequest('GET');
        const response2 = await GET(request2);
        const data2 = await response2.json();

        expect(data2.tools.osa_workflow_data.endpoint.url).toBe('http://localhost:3000/api/opal/osa-workflow');

      } finally {
        process.env.NODE_ENV = originalNodeEnv;
      }
    });

    it('should log discovery requests for monitoring', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      const request = createMockRequest('GET', 'Optimizely-Opal/1.0.0');

      await GET(request);

      expect(consoleSpy).toHaveBeenCalledWith('🔍 [OpalDiscovery] Request received from:', 'Optimizely-Opal/1.0.0');
      expect(consoleSpy).toHaveBeenCalledWith('📋 [OpalDiscovery] Returning SDK-compliant response:', expect.objectContaining({
        tools_count: 1,
        service_name: 'OSA - Opal Connector Agents',
        endpoint: expect.stringContaining('/api/opal/osa-workflow'),
        supported_agents: 9
      }));
    });

    it('should handle errors gracefully', async () => {
      // Test error handling by mocking the Date constructor to throw
      const originalDate = Date;

      // @ts-ignore - Mock Date constructor to cause error during response generation
      global.Date = class MockDate {
        constructor() {
          throw new Error('Test discovery error');
        }
        static now() {
          return originalDate.now();
        }
      } as any;

      try {
        const request = createMockRequest('GET');
        const response = await GET(request);

        expect(response.status).toBe(500);

        const errorData = await response.json();
        expect(errorData).toHaveProperty('error', 'discovery_endpoint_error');
        expect(errorData).toHaveProperty('message');
        expect(errorData).toHaveProperty('timestamp');
        expect(errorData).toHaveProperty('service', 'OSA - Opal Connector Agents');

      } finally {
        global.Date = originalDate;
      }
    });
  });

  describe('OPTIONS /api/opal/discovery', () => {
    it('should handle CORS preflight requests', async () => {
      const request = createMockRequest('OPTIONS');
      const response = await OPTIONS(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, OPTIONS');
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization');
      expect(response.headers.get('Access-Control-Max-Age')).toBe('86400');
      expect(response.headers.get('X-CORS-Enabled')).toBe('true');
    });

    it('should log CORS requests', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      const request = createMockRequest('OPTIONS');

      await OPTIONS(request);

      expect(consoleSpy).toHaveBeenCalledWith('🔧 [OpalDiscovery] CORS preflight request received');
    });
  });

  describe('POST /api/opal/discovery', () => {
    it('should reject POST requests with method not allowed', async () => {
      const request = createMockRequest('POST');
      const response = await POST(request);

      expect(response.status).toBe(405);
      expect(response.headers.get('Allow')).toBe('GET, OPTIONS');

      const data = await response.json();
      expect(data).toHaveProperty('error', 'method_not_allowed');
      expect(data).toHaveProperty('message', 'Discovery endpoint only supports GET requests');
      expect(data).toHaveProperty('correct_method', 'GET');
    });

    it('should log POST attempts', async () => {
      const consoleSpy = vi.spyOn(console, 'warn');
      const request = createMockRequest('POST');

      await POST(request);

      expect(consoleSpy).toHaveBeenCalledWith('⚠️ [OpalDiscovery] POST request to discovery endpoint - redirecting to GET');
    });
  });

  describe('Anti-Regression Tests', () => {
    it('should never return functions as array (previous error format)', async () => {
      const request = createMockRequest('GET');
      const response = await GET(request);
      const data = await response.json();

      // Ensure we don't return the problematic array format
      expect(Array.isArray(data)).toBe(false);
      expect(data).not.toHaveProperty('functions');  // Should be 'tools' instead
      expect(data).toHaveProperty('tools');
      expect(typeof data.tools).toBe('object');
      expect(!Array.isArray(data.tools)).toBe(true);
    });

    it('should never return string responses (cause of .get() errors)', async () => {
      const request = createMockRequest('GET');
      const response = await GET(request);
      const data = await response.json();

      // Ensure response is always an object, never a string
      expect(typeof data).toBe('object');
      expect(typeof data.tools).toBe('object');
      expect(typeof data.metadata).toBe('object');
    });

    it('should always include tools with .get() compatible structure', async () => {
      const request = createMockRequest('GET');
      const response = await GET(request);
      const data = await response.json();

      // Verify the structure supports Python dict.get() operations
      expect(data.tools).toHaveProperty('osa_workflow_data');
      expect(typeof data.tools.osa_workflow_data).toBe('object');

      // Verify nested structures are also objects
      expect(typeof data.tools.osa_workflow_data.function).toBe('object');
      expect(typeof data.tools.osa_workflow_data.function.parameters).toBe('object');
      expect(typeof data.tools.osa_workflow_data.endpoint).toBe('object');
    });

    it('should maintain consistent JSON structure across requests', async () => {
      const request1 = createMockRequest('GET');
      const response1 = await GET(request1);
      const data1 = await response1.json();

      const request2 = createMockRequest('GET');
      const response2 = await GET(request2);
      const data2 = await response2.json();

      // Structure should be identical (except for timestamp)
      expect(Object.keys(data1)).toEqual(Object.keys(data2));
      expect(Object.keys(data1.tools)).toEqual(Object.keys(data2.tools));
      expect(data1.tools.osa_workflow_data.name).toBe(data2.tools.osa_workflow_data.name);
    });

    it('should handle JSON serialization without throwing', async () => {
      const request = createMockRequest('GET');

      // This should not throw during JSON serialization
      expect(async () => {
        const response = await GET(request);
        await response.json();
      }).not.toThrow();
    });

    it('should validate all required schema properties exist', async () => {
      const request = createMockRequest('GET');
      const response = await GET(request);
      const data = await response.json();

      const tool = data.tools.osa_workflow_data;

      // All these properties must exist to prevent OPAL parsing errors
      const requiredProperties = [
        'name',
        'description',
        'function',
        'endpoint'
      ];

      requiredProperties.forEach(prop => {
        expect(tool).toHaveProperty(prop);
        expect(tool[prop]).toBeDefined();
        expect(tool[prop]).not.toBeNull();
      });

      // Function must have these properties
      const requiredFunctionProperties = [
        'name',
        'parameters',
        'returns'
      ];

      requiredFunctionProperties.forEach(prop => {
        expect(tool.function).toHaveProperty(prop);
        expect(tool.function[prop]).toBeDefined();
        expect(tool.function[prop]).not.toBeNull();
      });
    });
  });
});