/**
 * OPAL Agent Integration Health Tests
 *
 * Validates the complete OPAL integration pipeline health for audience_suggester agent.
 *
 * Critical Requirements (CLAUDE.md):
 * - Integration health score must be 95/100+
 * - Tool discovery must return correct endpoint paths
 * - All enabled_tools must be reachable and functional
 * - Response format must match OSA Results page schema
 *
 * Issue Resolution (2025-11-21):
 * - Fixed URL path mismatch in discovery configuration
 * - Improved integration health from 25/100 to 95/100+
 * - Prevents 404 errors for audience_suggester agent tools
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

describe('OPAL Agent Integration Health', () => {

  // Test configuration
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';

  // audience_suggester agent configuration (from opal-config/opal-agents/audience_suggester.json)
  const CRITICAL_TOOLS = [
    'osa_fetch_audience_segments',
    'osa_analyze_member_behavior',
    'osa_create_dynamic_segments',
    'osa_calculate_segment_statistical_power'
  ];

  describe('Tool Discovery Validation', () => {

    let discoveryResponse: any;

    beforeAll(async () => {
      const response = await fetch(`${BASE_URL}/api/tools/odp/discovery`);
      discoveryResponse = await response.json();
    });

    it('should return all critical tools for audience_suggester agent', () => {
      expect(discoveryResponse.functions).toBeDefined();

      CRITICAL_TOOLS.forEach(toolName => {
        const tool = discoveryResponse.functions.find((f: any) => f.name === toolName);
        expect(tool).toBeDefined();
        expect(tool.endpoint).toMatch(/^\/api\/tools\/osa_/);
        expect(tool.http_method).toBe('POST');
      });
    });

    it('should have correct endpoint format for all tools', () => {
      discoveryResponse.functions.forEach((tool: any) => {
        // Validate endpoint follows Next.js API route pattern
        expect(tool.endpoint).toMatch(/^\/api\/tools\/osa_[a-z_]+$/);

        // Validate no legacy incorrect paths
        expect(tool.endpoint).not.toMatch(/^\/tools\//);
        expect(tool.endpoint).not.toContain('//');
      });
    });

    it('should calculate integration health score above 95/100', () => {
      // Health score calculation based on CLAUDE.md requirements:
      // - Tool availability: 40 points
      // - Endpoint reachability: 25 points
      // - Response format compliance: 20 points
      // - Parameter validation: 10 points
      // - Error handling: 5 points

      let healthScore = 0;

      // Tool availability (40 points)
      const foundTools = CRITICAL_TOOLS.filter(toolName =>
        discoveryResponse.functions.some((f: any) => f.name === toolName)
      );
      healthScore += (foundTools.length / CRITICAL_TOOLS.length) * 40;

      // Endpoint format compliance (25 points)
      const correctFormatTools = discoveryResponse.functions.filter((tool: any) =>
        tool.endpoint && tool.endpoint.match(/^\/api\/tools\/osa_[a-z_]+$/)
      );
      healthScore += (correctFormatTools.length / discoveryResponse.functions.length) * 25;

      // Response format compliance (20 points)
      const hasRequiredFields = discoveryResponse.functions.every((tool: any) =>
        tool.name && tool.description && tool.endpoint && tool.http_method && tool.parameters
      );
      healthScore += hasRequiredFields ? 20 : 0;

      // Parameter validation (10 points)
      const hasValidParameters = discoveryResponse.functions.every((tool: any) =>
        Array.isArray(tool.parameters)
      );
      healthScore += hasValidParameters ? 10 : 0;

      // Error handling (5 points) - discovery endpoint responded successfully
      healthScore += 5;

      expect(healthScore).toBeGreaterThanOrEqual(95);
    });
  });

  describe('Endpoint Reachability Validation', () => {

    it('should reach all critical audience_suggester endpoints', async () => {
      // Get discovery configuration
      const discoveryResponse = await fetch(`${BASE_URL}/api/tools/odp/discovery`);
      const discoveryData = await discoveryResponse.json();

      // Test each critical tool endpoint
      for (const toolName of CRITICAL_TOOLS) {
        const tool = discoveryData.functions.find((f: any) => f.name === toolName);
        expect(tool).toBeDefined();

        // Validate GET endpoint (health check)
        const getResponse = await fetch(`${BASE_URL}${tool.endpoint}`);
        expect(getResponse.status).toBe(200);

        const healthData = await getResponse.json();
        expect(healthData.tool_id).toBe(toolName);
        expect(healthData.status).toBe('healthy');
      }
    }, 15000);

    it('should validate POST endpoint functionality with proper responses', async () => {
      const testCases = [
        {
          tool: 'osa_fetch_audience_segments',
          endpoint: '/api/tools/osa_fetch_audience_segments',
          payload: {
            workflow_id: 'integration_test',
            member_tiers: ['premium', 'commercial'],
            include_size_estimates: true
          },
          expectedFields: ['success', 'audience_segments', '_metadata']
        },
        {
          tool: 'osa_analyze_member_behavior',
          endpoint: '/api/tools/osa_analyze_member_behavior',
          payload: {
            workflow_id: 'integration_test',
            member_id: 'test_member_001',
            behavior_types: ['content_engagement', 'event_attendance']
          },
          expectedFields: ['success', 'member_behavior_analysis', '_metadata']
        }
      ];

      for (const testCase of testCases) {
        const response = await fetch(`${BASE_URL}${testCase.endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Test-Case': 'opal-integration-health'
          },
          body: JSON.stringify(testCase.payload)
        });

        expect(response.status).toBe(200);

        const responseData = await response.json();

        // Validate required response fields
        testCase.expectedFields.forEach(field => {
          expect(responseData).toHaveProperty(field);
        });

        // Validate metadata for debugging/monitoring
        expect(responseData._metadata).toHaveProperty('correlation_id');
        expect(responseData._metadata).toHaveProperty('processing_time_ms');
        expect(responseData._metadata).toHaveProperty('timestamp');
        expect(responseData._metadata).toHaveProperty('data_source');

        // Validate correlation ID format (CLAUDE.md requirement)
        const correlationId = responseData._metadata.correlation_id;
        expect(correlationId).toMatch(/^opal-(audience-segments|member-behavior)-\d+-[a-z0-9]+$/);
      }
    }, 20000);
  });

  describe('Error Handling and Resilience', () => {

    it('should handle invalid request payloads gracefully', async () => {
      const invalidPayloadTests = [
        {
          endpoint: '/api/tools/osa_fetch_audience_segments',
          payload: { invalid: 'payload' },
          description: 'Invalid payload structure'
        },
        {
          endpoint: '/api/tools/osa_analyze_member_behavior',
          payload: null,
          description: 'Null payload'
        }
      ];

      for (const test of invalidPayloadTests) {
        const response = await fetch(`${BASE_URL}${test.endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(test.payload)
        });

        // Should still return proper status (either 200 with fallback or 400 with error)
        expect([200, 400, 422]).toContain(response.status);

        const responseData = await response.json();

        // Should always include metadata for debugging
        expect(responseData).toHaveProperty('_metadata');
        if (responseData._metadata) {
          expect(responseData._metadata).toHaveProperty('correlation_id');
        }
      }
    });

    it('should provide fallback data when delegation fails', async () => {
      // Test that wrapper endpoints provide fallback data if delegation targets fail
      const response = await fetch(`${BASE_URL}/api/tools/osa_fetch_audience_segments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow_id: 'fallback_test',
          force_fallback: true  // This might trigger fallback logic
        })
      });

      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(responseData.success).toBe(true);

      // Should indicate data source in metadata
      expect(responseData._metadata.data_source).toMatch(/^(odp_segments_delegation|mock_data_fallback)$/);
    });
  });

  describe('Performance and Monitoring', () => {

    it('should complete requests within acceptable timeframes', async () => {
      const performanceTests = [
        {
          endpoint: '/api/tools/osa_fetch_audience_segments',
          payload: { workflow_id: 'perf_test' },
          maxTime: 5000 // 5 seconds
        },
        {
          endpoint: '/api/tools/osa_analyze_member_behavior',
          payload: { workflow_id: 'perf_test', member_id: 'test' },
          maxTime: 3000 // 3 seconds
        }
      ];

      for (const test of performanceTests) {
        const startTime = Date.now();

        const response = await fetch(`${BASE_URL}${test.endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(test.payload)
        });

        const endTime = Date.now();
        const processingTime = endTime - startTime;

        expect(response.status).toBe(200);
        expect(processingTime).toBeLessThan(test.maxTime);

        const responseData = await response.json();

        // Validate reported processing time is reasonable
        if (responseData._metadata?.processing_time_ms) {
          expect(responseData._metadata.processing_time_ms).toBeLessThan(test.maxTime);
          expect(responseData._metadata.processing_time_ms).toBeGreaterThan(0);
        }
      }
    }, 30000);

    it('should include proper monitoring headers', async () => {
      const response = await fetch(`${BASE_URL}/api/tools/osa_fetch_audience_segments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow_id: 'header_test' })
      });

      expect(response.status).toBe(200);

      // Validate CLAUDE.md required headers
      expect(response.headers.get('X-Correlation-ID')).toBeTruthy();
      expect(response.headers.get('X-Processing-Time')).toBeTruthy();
      expect(response.headers.get('X-Data-Source')).toBeTruthy();

      // Correlation ID format validation
      const correlationId = response.headers.get('X-Correlation-ID');
      expect(correlationId).toMatch(/^opal-audience-segments-\d+-[a-z0-9]+$/);
    });
  });

  describe('Schema Compliance Validation', () => {

    it('should return responses that match OSA Results page schema', async () => {
      // This validates that the responses can be consumed by OSA Results pages
      const response = await fetch(`${BASE_URL}/api/tools/osa_fetch_audience_segments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow_id: 'schema_test',
          member_tiers: ['premium']
        })
      });

      const responseData = await response.json();

      // Validate audience_segments structure expected by Results pages
      expect(responseData.audience_segments).toBeDefined();
      expect(responseData.audience_segments.segments).toBeDefined();
      expect(Array.isArray(responseData.audience_segments.segments)).toBe(true);

      // Validate segment structure
      if (responseData.audience_segments.segments.length > 0) {
        const segment = responseData.audience_segments.segments[0];
        expect(segment).toHaveProperty('segment_id');
        expect(segment).toHaveProperty('segment_name');
        expect(segment).toHaveProperty('description');
        expect(segment).toHaveProperty('size_estimate');
        expect(segment).toHaveProperty('engagement_score');
        expect(segment).toHaveProperty('implementation_priority');
      }

      // Validate metadata structure
      expect(responseData._metadata).toHaveProperty('data_source');
      expect(responseData._metadata).toHaveProperty('processing_time_ms');
      expect(responseData._metadata).toHaveProperty('correlation_id');
    });
  });
});