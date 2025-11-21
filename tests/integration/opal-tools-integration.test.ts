/**
 * OPAL Tools Integration Test Suite
 *
 * Comprehensive tests for all 11 OPAL tool endpoints to ensure zero 404 errors
 * and proper integration with OSA systems.
 *
 * Test Coverage:
 * - All 11 tool endpoints (5 working + 6 new)
 * - GET health checks
 * - POST functionality with mock data
 * - Error handling and fallback strategies
 * - Response format validation
 * - Correlation ID tracking
 */

import { describe, it, expect, beforeAll } from '@jest/globals';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * All 11 OPAL tool endpoints that must exist and return 200
 */
const OPAL_TOOLS = [
  // Existing working endpoints (5)
  'osa_send_data_to_osa_webhook',
  'osa_analyze_member_behavior',
  'osa_create_dynamic_segments',
  'osa_fetch_audience_segments',
  'osa_store_workflow_data',

  // Newly implemented endpoints (6)
  'osa_retrieve_workflow_context',
  'osa_analyze_data_insights',
  'osa_validate_language_rules',
  'osa_calculate_segment_statistical_power',
  'osa_get_member_journey_data',
  'osa_export_segment_targeting_logic'
];

describe('OPAL Tools Integration - Zero 404 Guarantee', () => {
  describe('Health Check - GET Endpoints', () => {
    OPAL_TOOLS.forEach(toolName => {
      it(`GET /api/tools/${toolName} should return 200 and tool metadata`, async () => {
        const response = await fetch(`${BASE_URL}/api/tools/${toolName}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data).toHaveProperty('tool_id');
        expect(data).toHaveProperty('name');
        expect(data).toHaveProperty('description');
        expect(data).toHaveProperty('version');
        expect(data).toHaveProperty('status');
        expect(data.status).toBe('healthy');
        expect(data.tool_id).toBe(toolName);
      });
    });
  });

  describe('POST Functionality - Basic Integration', () => {
    it('osa_send_data_to_osa_webhook should accept and process webhook data', async () => {
      const response = await fetch(`${BASE_URL}/api/tools/osa_send_data_to_osa_webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_name: 'test_agent',
          execution_results: { test: 'data' },
          workflow_id: 'test_workflow_123',
          metadata: {
            execution_status: 'completed',
            execution_time_ms: 1000,
            timestamp: new Date().toISOString(),
            success: true
          }
        })
      });

      expect(response.status).toBeLessThan(500);
      expect(response.headers.get('X-Correlation-ID')).toBeTruthy();
    });

    it('osa_retrieve_workflow_context should return workflow context', async () => {
      const response = await fetch(`${BASE_URL}/api/tools/osa_retrieve_workflow_context`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow_id: 'test_workflow_123',
          session_id: 'test_session_456'
        })
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('workflow_context');
      expect(data).toHaveProperty('_metadata');
      expect(data._metadata).toHaveProperty('correlation_id');
      expect(data._metadata).toHaveProperty('data_source');
    });

    it('osa_analyze_data_insights should return insights', async () => {
      const response = await fetch(`${BASE_URL}/api/tools/osa_analyze_data_insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date_range: 'Last 3 Months',
          data_sources: ['ga4', 'odp', 'cms'],
          analysis_type: 'comprehensive'
        })
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data_insights');
      expect(data.data_insights).toHaveProperty('key_insights');
      expect(Array.isArray(data.data_insights.key_insights)).toBe(true);
    });

    it('osa_validate_language_rules should validate content', async () => {
      const response = await fetch(`${BASE_URL}/api/tools/osa_validate_language_rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: {
            recommendations: [
              {
                category: 'Content Strategy',
                recommendation: 'Implement targeted content for Strategic Buyer Sarah segment',
                confidence_score: 85,
                implementation_effort: 'medium',
                expected_impact: 'high'
              }
            ]
          },
          content_type: 'agent_output',
          validation_mode: 'strict'
        })
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('validation_result');
      expect(data.validation_result).toHaveProperty('is_valid');
      expect(data.validation_result).toHaveProperty('quality_score');
      expect(response.headers.get('X-Validation-Score')).toBeTruthy();
    });

    it('osa_calculate_segment_statistical_power should return power analysis', async () => {
      const response = await fetch(`${BASE_URL}/api/tools/osa_calculate_segment_statistical_power`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segment_size: 5000,
          effect_size: 0.05,
          alpha: 0.05,
          test_type: 'ab_test'
        })
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('statistical_analysis');
      expect(data.statistical_analysis).toHaveProperty('power_calculation');
      expect(data.statistical_analysis.power_calculation).toHaveProperty('statistical_power');
      expect(response.headers.get('X-Statistical-Power')).toBeTruthy();
    });

    it('osa_get_member_journey_data should return journey data', async () => {
      const response = await fetch(`${BASE_URL}/api/tools/osa_get_member_journey_data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: 'test_member_123',
          time_range: '90_days'
        })
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('member_journey');
      expect(data.member_journey).toHaveProperty('journey_stages');
      expect(Array.isArray(data.member_journey.journey_stages)).toBe(true);
    });

    it('osa_export_segment_targeting_logic should export targeting logic', async () => {
      const response = await fetch(`${BASE_URL}/api/tools/osa_export_segment_targeting_logic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segment_id: 'premium_produce_buyers',
          export_format: 'json'
        })
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('segment_export');
      expect(data.segment_export).toHaveProperty('targeting_logic');
      expect(response.headers.get('X-Export-Format')).toBe('json');
    });
  });

  describe('Correlation ID Tracking', () => {
    it('All endpoints should return X-Correlation-ID header', async () => {
      const testEndpoints = [
        'osa_retrieve_workflow_context',
        'osa_analyze_data_insights',
        'osa_validate_language_rules'
      ];

      for (const endpoint of testEndpoints) {
        const response = await fetch(`${BASE_URL}/api/tools/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ test: 'data' })
        });

        const correlationId = response.headers.get('X-Correlation-ID');
        expect(correlationId).toBeTruthy();
        expect(correlationId).toMatch(/^opal-/);
      }
    });
  });

  describe('Error Handling and Fallback', () => {
    it('Endpoints should handle missing required fields gracefully', async () => {
      const response = await fetch(`${BASE_URL}/api/tools/osa_retrieve_workflow_context`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      expect(response.status).toBeLessThan(500);

      const data = await response.json();
      expect(data).toHaveProperty('_metadata');
      expect(data._metadata).toHaveProperty('data_source');
    });

    it('Endpoints should provide mock data when delegation fails', async () => {
      const response = await fetch(`${BASE_URL}/api/tools/osa_get_member_journey_data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: 'nonexistent_member_999'
        })
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data._metadata.data_source).toMatch(/mock|fallback/i);
    });
  });

  describe('Response Format Validation', () => {
    it('All POST responses should include standard _metadata', async () => {
      const testCases = [
        { endpoint: 'osa_retrieve_workflow_context', body: { workflow_id: 'test' } },
        { endpoint: 'osa_analyze_data_insights', body: { date_range: 'Last 3 Months' } },
        { endpoint: 'osa_validate_language_rules', body: { content: {} } }
      ];

      for (const testCase of testCases) {
        const response = await fetch(`${BASE_URL}/api/tools/${testCase.endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testCase.body)
        });

        const data = await response.json();
        expect(data).toHaveProperty('_metadata');
        expect(data._metadata).toHaveProperty('correlation_id');
        expect(data._metadata).toHaveProperty('processing_time_ms');
        expect(data._metadata).toHaveProperty('timestamp');
        expect(data._metadata).toHaveProperty('data_source');
      }
    });
  });
});

describe('OPAL Tools - Advanced Integration', () => {
  describe('Export Formats', () => {
    const formats = ['json', 'odp_api', 'sql', 'javascript', 'markdown'];

    formats.forEach(format => {
      it(`osa_export_segment_targeting_logic should support ${format} format`, async () => {
        const response = await fetch(`${BASE_URL}/api/tools/osa_export_segment_targeting_logic`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            segment_id: 'test_segment',
            export_format: format
          })
        });

        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.segment_export.export_format).toBe(format);
        expect(data.segment_export.targeting_logic).toBeTruthy();
      });
    });
  });

  describe('Validation Modes', () => {
    it('Language validation should support strict mode', async () => {
      const response = await fetch(`${BASE_URL}/api/tools/osa_validate_language_rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: { recommendations: [] },
          validation_mode: 'strict'
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data._metadata.validation_mode).toBe('strict');
    });

    it('Language validation should support permissive mode', async () => {
      const response = await fetch(`${BASE_URL}/api/tools/osa_validate_language_rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: { recommendations: [] },
          validation_mode: 'permissive'
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.validation_result.can_proceed).toBe(true);
    });
  });
});

describe('OPAL Tools - Zero 404 Verification', () => {
  it('All 11 tool endpoints must exist and return 200 (no 404s)', async () => {
    const results = await Promise.all(
      OPAL_TOOLS.map(async (tool) => {
        const response = await fetch(`${BASE_URL}/api/tools/${tool}`, {
          method: 'GET'
        });
        return {
          tool,
          status: response.status,
          ok: response.ok
        };
      })
    );

    // Verify no 404s
    const notFoundTools = results.filter(r => r.status === 404);
    expect(notFoundTools).toHaveLength(0);

    // Verify all return 200
    const allOk = results.every(r => r.ok);
    expect(allOk).toBe(true);

    // Log results for debugging
    console.log('OPAL Tools Health Check Results:');
    results.forEach(r => {
      console.log(`  ✅ ${r.tool}: ${r.status}`);
    });
  });

  it('Should generate integration health report', async () => {
    const healthReport = {
      total_endpoints: OPAL_TOOLS.length,
      working_endpoints: 0,
      failed_endpoints: 0,
      endpoint_details: [] as any[]
    };

    for (const tool of OPAL_TOOLS) {
      try {
        const response = await fetch(`${BASE_URL}/api/tools/${tool}`, {
          method: 'GET'
        });

        const status = response.ok ? 'working' : 'failed';
        if (status === 'working') {
          healthReport.working_endpoints++;
        } else {
          healthReport.failed_endpoints++;
        }

        healthReport.endpoint_details.push({
          tool_name: tool,
          status: status,
          http_status: response.status
        });
      } catch (error) {
        healthReport.failed_endpoints++;
        healthReport.endpoint_details.push({
          tool_name: tool,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Calculate integration health score
    const healthScore = (healthReport.working_endpoints / healthReport.total_endpoints) * 100;
    healthReport['integration_health_score'] = healthScore;

    console.log('\nOPAL Integration Health Report:');
    console.log(JSON.stringify(healthReport, null, 2));

    // Target: 100/100 health score (all endpoints working)
    expect(healthScore).toBe(100);
    expect(healthReport.failed_endpoints).toBe(0);
  });
});
