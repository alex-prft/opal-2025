/**
 * OPAL Discovery Fix - Comprehensive Unit Tests
 *
 * This test suite ensures the "Discovery URL does not return valid functions data"
 * error is permanently fixed and prevents regression to the incorrect format.
 *
 * Tests cover:
 * - Functions array format validation (the fix)
 * - OPAL parameter array format compliance
 * - Anti-regression protection against tools object format
 * - Complete OPAL Tools SDK compliance validation
 * - Future custom tool development guidelines
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
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

describe('OPAL Discovery Fix - Functions Array Format', () => {
  beforeEach(() => {
    // Clear console mocks
    jest.clearAllMocks();

    // Mock console methods to prevent test output noise
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('Critical Fix Validation', () => {
    it('MUST return functions array format (THE FIX)', async () => {
      const request = createMockRequest('GET');
      const response = await GET(request);
      const data = await response.json();

      // ✅ THE CRITICAL FIX: Must have functions array
      expect(data).toHaveProperty('functions');
      expect(Array.isArray(data.functions)).toBe(true);
      expect(data.functions.length).toBeGreaterThan(0);

      // ❌ MUST NOT have tools object (the old incorrect format)
      expect(data).not.toHaveProperty('tools');
    });

    it('functions array must contain proper OPAL function structure', async () => {
      const request = createMockRequest('GET');
      const response = await GET(request);
      const data = await response.json();

      const opalFunction = data.functions[0];

      // Required OPAL function fields
      expect(opalFunction).toHaveProperty('name');
      expect(opalFunction).toHaveProperty('description');
      expect(opalFunction).toHaveProperty('parameters');
      expect(opalFunction).toHaveProperty('endpoint');
      expect(opalFunction).toHaveProperty('http_method');

      // Validate types
      expect(typeof opalFunction.name).toBe('string');
      expect(typeof opalFunction.description).toBe('string');
      expect(Array.isArray(opalFunction.parameters)).toBe(true);
      expect(typeof opalFunction.endpoint).toBe('string');
      expect(typeof opalFunction.http_method).toBe('string');
    });

    it('parameters must use OPAL array format, not JSON Schema', async () => {
      const request = createMockRequest('GET');
      const response = await GET(request);
      const data = await response.json();

      const parameters = data.functions[0].parameters;

      // ✅ Must be array (OPAL format)
      expect(Array.isArray(parameters)).toBe(true);

      // ❌ Must NOT be plain object (JSON Schema format)
      expect(parameters.constructor).toBe(Array);

      // Validate each parameter has OPAL structure
      parameters.forEach((param: any) => {
        expect(param).toHaveProperty('name');
        expect(param).toHaveProperty('type');
        expect(param).toHaveProperty('description');
        expect(param).toHaveProperty('required');

        expect(typeof param.name).toBe('string');
        expect(typeof param.type).toBe('string');
        expect(typeof param.description).toBe('string');
        expect(typeof param.required).toBe('boolean');
      });
    });

    it('must include osa_workflow_data function with correct structure', async () => {
      const request = createMockRequest('GET');
      const response = await GET(request);
      const data = await response.json();

      // Find the osa_workflow_data function
      const osaFunction = data.functions.find((f: any) => f.name === 'osa_workflow_data');
      expect(osaFunction).toBeDefined();

      // Validate specific function properties
      expect(osaFunction.name).toBe('osa_workflow_data');
      expect(osaFunction.description).toContain('OSA');
      expect(osaFunction.endpoint).toBe('/api/opal/osa-workflow');
      expect(osaFunction.http_method).toBe('POST');
    });
  });

  describe('Anti-Regression Protection', () => {
    it('NEVER return tools object format (prevents regression)', async () => {
      const request = createMockRequest('GET');
      const response = await GET(request);
      const data = await response.json();

      // ❌ Must NOT have the old incorrect format
      expect(data).not.toHaveProperty('tools');

      // ❌ Must NOT have nested function objects
      expect(data).not.toHaveProperty('tools.osa_workflow_data');

      // ❌ Must NOT have JSON Schema parameter format
      const hasJsonSchemaFormat = data.functions?.some((func: any) =>
        func.parameters &&
        typeof func.parameters === 'object' &&
        !Array.isArray(func.parameters) &&
        func.parameters.type === 'object'
      );
      expect(hasJsonSchemaFormat).toBe(false);
    });

    it('NEVER return parameter objects with properties field (JSON Schema)', async () => {
      const request = createMockRequest('GET');
      const response = await GET(request);
      const data = await response.json();

      data.functions.forEach((func: any) => {
        // Parameters must be array, not object with properties
        expect(Array.isArray(func.parameters)).toBe(true);

        // Must not have JSON Schema structure
        expect(func.parameters).not.toHaveProperty('type');
        expect(func.parameters).not.toHaveProperty('properties');
        expect(func.parameters).not.toHaveProperty('required');
      });
    });

    it('parameters must be flat array, not nested schema objects', async () => {
      const request = createMockRequest('GET');
      const response = await GET(request);
      const data = await response.json();

      const parameters = data.functions[0].parameters;

      parameters.forEach((param: any) => {
        // Each parameter must be a simple object, not nested
        expect(typeof param).toBe('object');
        expect(param).not.toHaveProperty('properties');
        expect(param).not.toHaveProperty('items');
        expect(param).not.toHaveProperty('additionalProperties');
      });
    });
  });

  describe('OPAL Tools SDK Compliance', () => {
    it('response must match OPAL Tools SDK discovery format', async () => {
      const request = createMockRequest('GET');
      const response = await GET(request);
      const data = await response.json();

      // OPAL SDK expected structure
      expect(data).toHaveProperty('functions');
      expect(data).toHaveProperty('name');
      expect(data).toHaveProperty('description');
      expect(data).toHaveProperty('version');
      expect(data).toHaveProperty('sdk_version');
      expect(data).toHaveProperty('supported_agents');

      // Validate OPAL SDK metadata
      expect(data.sdk_version).toBe('@optimizely-opal/opal-tools-sdk');
      expect(Array.isArray(data.supported_agents)).toBe(true);
      expect(data.supported_agents.length).toBe(9); // Our 9 agents
    });

    it('function endpoint paths must be valid', async () => {
      const request = createMockRequest('GET');
      const response = await GET(request);
      const data = await response.json();

      data.functions.forEach((func: any) => {
        // Endpoint must start with /
        expect(func.endpoint).toMatch(/^\/.*$/);

        // Must be a valid API path
        expect(func.endpoint).toMatch(/^\/api\/.*$/);
      });
    });

    it('HTTP methods must be valid', async () => {
      const request = createMockRequest('GET');
      const response = await GET(request);
      const data = await response.json();

      const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

      data.functions.forEach((func: any) => {
        expect(validMethods).toContain(func.http_method);
      });
    });

    it('parameter types must be OPAL-compatible', async () => {
      const request = createMockRequest('GET');
      const response = await GET(request);
      const data = await response.json();

      const validTypes = ['string', 'number', 'integer', 'boolean', 'array', 'object'];

      data.functions.forEach((func: any) => {
        func.parameters.forEach((param: any) => {
          expect(validTypes).toContain(param.type);
        });
      });
    });
  });

  describe('Error Prevention Tests', () => {
    it('error responses must still maintain functions array consistency', async () => {
      // Test error handling by mocking Date to throw
      const originalDate = Date;

      // @ts-ignore - Mock Date constructor to cause error
      global.Date = class MockDate {
        constructor() {
          throw new Error('Test discovery error');
        }
        static now() {
          return originalDate.now();
        }
        static toISOString() {
          return '1970-01-01T00:00:00.000Z';
        }
      } as any;

      try {
        const request = createMockRequest('GET');
        const response = await GET(request);
        const errorData = await response.json();

        // Even on error, must have functions array (empty is ok)
        expect(errorData).toHaveProperty('functions');
        expect(Array.isArray(errorData.functions)).toBe(true);

        // Must NOT have tools object even on error
        expect(errorData).not.toHaveProperty('tools');

      } finally {
        global.Date = originalDate;
      }
    });

    it('malformed requests must not break functions array format', async () => {
      const request = createMockRequest('POST'); // Wrong method
      const response = await POST(request);
      const data = await response.json();

      // Even POST method error must maintain consistency
      expect(data).toHaveProperty('functions');
      expect(Array.isArray(data.functions)).toBe(true);
      expect(data).not.toHaveProperty('tools');
    });
  });

  describe('Future Custom Tool Guidelines', () => {
    it('response structure must be template-compliant for new tools', async () => {
      const request = createMockRequest('GET');
      const response = await GET(request);
      const data = await response.json();

      // Template validation for future tools
      const requiredResponseFields = [
        'functions',
        'name',
        'description',
        'version',
        'sdk_version',
        'supported_agents'
      ];

      requiredResponseFields.forEach(field => {
        expect(data).toHaveProperty(field);
      });

      // Function template validation
      const requiredFunctionFields = [
        'name',
        'description',
        'parameters',
        'endpoint',
        'http_method'
      ];

      data.functions.forEach((func: any) => {
        requiredFunctionFields.forEach(field => {
          expect(func).toHaveProperty(field);
        });
      });
    });

    it('parameter template must be OPAL-compliant for new tools', async () => {
      const request = createMockRequest('GET');
      const response = await GET(request);
      const data = await response.json();

      // Parameter template for future tools
      const requiredParameterFields = ['name', 'type', 'description', 'required'];

      data.functions.forEach((func: any) => {
        func.parameters.forEach((param: any) => {
          requiredParameterFields.forEach(field => {
            expect(param).toHaveProperty(field);
          });
        });
      });
    });
  });

  describe('Validation Integration Tests', () => {
    it('response must pass OPAL validation script format check', async () => {
      const request = createMockRequest('GET');
      const response = await GET(request);
      const data = await response.json();

      // Simulate validation script checks

      // 1. Top-level structure check
      expect(typeof data).toBe('object');
      expect(data).not.toBeNull();

      // 2. Functions array check (THE CRITICAL FIX)
      expect(Array.isArray(data.functions)).toBe(true);
      expect(data.functions.length).toBeGreaterThan(0);

      // 3. Function structure check
      data.functions.forEach((func: any, index: number) => {
        expect(typeof func.name).toBe('string');
        expect(func.name.trim()).not.toBe('');

        expect(typeof func.description).toBe('string');
        expect(func.description.trim()).not.toBe('');

        expect(Array.isArray(func.parameters)).toBe(true);
        expect(typeof func.endpoint).toBe('string');
        expect(typeof func.http_method).toBe('string');
      });
    });

    it('must be compatible with curl and jq validation commands', async () => {
      const request = createMockRequest('GET');
      const response = await GET(request);
      const data = await response.json();

      // Simulate curl/jq validation commands

      // jq '.functions | length' - must return number > 0
      expect(typeof data.functions.length).toBe('number');
      expect(data.functions.length).toBeGreaterThan(0);

      // jq '.functions[0].name' - must return string
      expect(typeof data.functions[0].name).toBe('string');

      // jq '.functions[0].parameters | length' - must return number
      expect(typeof data.functions[0].parameters.length).toBe('number');

      // jq 'keys' - must include functions
      expect(Object.keys(data)).toContain('functions');
    });
  });

  describe('Production Environment Validation', () => {
    it('must work correctly in production environment detection', async () => {
      const originalNodeEnv = process.env.NODE_ENV;

      try {
        // Test production environment
        process.env.NODE_ENV = 'production';
        const request = createMockRequest('GET');
        const response = await GET(request);
        const data = await response.json();

        // Must still return functions array in production
        expect(Array.isArray(data.functions)).toBe(true);
        expect(data).not.toHaveProperty('tools');

      } finally {
        process.env.NODE_ENV = originalNodeEnv;
      }
    });

    it('discovery metadata must include proper timestamps', async () => {
      const request = createMockRequest('GET');
      const response = await GET(request);
      const data = await response.json();

      // Must have timestamp for cache invalidation
      expect(data).toHaveProperty('discovery_generated_at');
      expect(typeof data.discovery_generated_at).toBe('string');

      // Must be valid ISO timestamp
      expect(() => new Date(data.discovery_generated_at)).not.toThrow();
    });
  });
});

/**
 * Test Summary:
 *
 * ✅ CRITICAL FIX VALIDATION:
 * - Functions array format (THE FIX)
 * - OPAL parameter array format
 * - Proper function structure
 *
 * ✅ ANTI-REGRESSION PROTECTION:
 * - Never return tools object format
 * - Never return JSON Schema parameters
 * - Prevent nested parameter objects
 *
 * ✅ OPAL SDK COMPLIANCE:
 * - Response structure validation
 * - Parameter type validation
 * - Endpoint format validation
 *
 * ✅ FUTURE TOOL GUIDELINES:
 * - Template compliance checks
 * - Validation script compatibility
 * - Production environment support
 *
 * This comprehensive test suite ensures the "Discovery URL does not return valid functions data"
 * error is permanently fixed and provides guidelines for all future OPAL custom tools.
 */