import { jest } from '@jest/globals';
import { GET } from '../../src/app/api/admin/mapping-status/route';
import { NextRequest } from 'next/server';

// Mock the utility functions
jest.mock('../../src/lib/mapping-utils');
jest.mock('../../src/lib/mapping-audit');
jest.mock('fs');
jest.mock('path');

import * as mappingUtils from '../../src/lib/mapping-utils';
import * as mappingAudit from '../../src/lib/mapping-audit';

const mockMappingUtils = mappingUtils as jest.Mocked<typeof mappingUtils>;
const mockMappingAudit = mappingAudit as jest.Mocked<typeof mappingAudit>;

describe('/api/admin/mapping-status', () => {
  const mockMappingData = {
    mapping_table: [
      {
        tier1: 'Strategy Plans',
        tier2: 'OSA',
        tier3: ['Overview Dashboard', 'Strategic Recommendations'],
        opal_agents: ['strategy_workflow'],
        opal_tools: ['workflow_data_sharing'],
        dxp_tools: ['Content Recs', 'CMS'],
        result_endpoints: ['/engine/results/strategy-plans', '/engine/results/strategy-plans/osa'],
        status: 'complete'
      }
    ],
    validation_summary: {
      missing_tier3: 0,
      agent_gaps: 0,
      endpoint_gaps: 0,
      total_sections: 1,
      complete_mappings: 1,
      partial_mappings: 0,
      missing_mappings: 0
    },
    raw_mapping: {}
  };

  const mockAuditReport = {
    total_sections: 1,
    issues: {
      missingTier3: [],
      agentGaps: []
    },
    recommendations: ['✅ All mappings are complete - no fixes needed']
  };

  const mockContentBlueprint = {
    'Strategy Plans': {
      widgets: [{
        name: 'StrategyPlansWidget',
        components: ['ConfidenceGauge', 'RoadmapTimeline'],
        data_sources: ['OPAL API', 'Optimizely CMS'],
        visualizations: ['LineChart', 'MilestoneHeatmap']
      }]
    }
  };

  const mockResultsRoadmap = [
    { phase: 'Tier-specific renderer', status: '✅ Complete' },
    { phase: 'Real data integration', status: '⚠️ In Progress' }
  ];

  const mockIntegrationStatus = {
    sdk_status: 'connected',
    api_key: 'valid',
    webhook: 'healthy',
    sse: 'active'
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockMappingUtils.getMappingData.mockResolvedValue(mockMappingData);
    mockMappingAudit.getAuditReport.mockResolvedValue(mockAuditReport);

    // Mock fs operations for config files
    const fs = require('fs');
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync
      .mockReturnValueOnce(JSON.stringify(mockContentBlueprint))
      .mockReturnValueOnce(JSON.stringify(mockResultsRoadmap));

    // Mock fetch for integration status
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        overall_status: 'green',
        config_checks: { osa_webhook_secret_configured: true },
        metrics: { uptime_indicators: { webhook_receiver_responding: true } }
      })
    });
  });

  describe('GET request', () => {
    it('should return complete mapping status data', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/mapping-status');
      const response = await GET(request);

      expect(response.status).toBe(200);

      const data = await response.json();

      expect(data).toHaveProperty('mapping_table');
      expect(data).toHaveProperty('content_blueprint');
      expect(data).toHaveProperty('integration_status');
      expect(data).toHaveProperty('results_roadmap');
      expect(data).toHaveProperty('mapping_validation_summary');

      expect(data.mapping_table).toEqual(mockMappingData.mapping_table);
      expect(data.content_blueprint).toEqual(mockContentBlueprint);
      expect(data.integration_status.sdk_status).toBe('connected');
      expect(data.results_roadmap).toEqual(mockResultsRoadmap);
    });

    it('should include audit details in response', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/mapping-status');
      const response = await GET(request);
      const data = await response.json();

      expect(data.audit_details).toBeDefined();
      expect(data.audit_details.issues_found).toEqual(mockAuditReport.issues);
      expect(data.audit_details.recommendations).toEqual(mockAuditReport.recommendations);
    });

    it('should include generated timestamp', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/mapping-status');
      const response = await GET(request);
      const data = await response.json();

      expect(data.generated_at).toBeDefined();
      expect(new Date(data.generated_at)).toBeInstanceOf(Date);
    });

    it('should handle mapping data fetch errors', async () => {
      mockMappingUtils.getMappingData.mockRejectedValue(new Error('Mapping file not found'));

      const request = new NextRequest('http://localhost:3000/api/admin/mapping-status');
      const response = await GET(request);

      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.error).toBe('Failed to retrieve mapping status');
      expect(data.message).toBe('Mapping file not found');
    });

    it('should handle audit report errors', async () => {
      mockMappingAudit.getAuditReport.mockRejectedValue(new Error('Audit failed'));

      const request = new NextRequest('http://localhost:3000/api/admin/mapping-status');
      const response = await GET(request);

      expect(response.status).toBe(500);
    });

    it('should handle missing content blueprint gracefully', async () => {
      const fs = require('fs');
      fs.existsSync.mockImplementation((path: string) => !path.includes('content_blueprint.json'));

      const request = new NextRequest('http://localhost:3000/api/admin/mapping-status');
      const response = await GET(request);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.content_blueprint).toBeDefined(); // Should use defaults
    });

    it('should handle missing results roadmap gracefully', async () => {
      const fs = require('fs');
      fs.existsSync.mockImplementation((path: string) => !path.includes('results_roadmap.json'));

      const request = new NextRequest('http://localhost:3000/api/admin/mapping-status');
      const response = await GET(request);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.results_roadmap).toBeDefined(); // Should use defaults
    });

    it('should handle integration health check failures', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const request = new NextRequest('http://localhost:3000/api/admin/mapping-status');
      const response = await GET(request);

      expect(response.status).toBe(200); // Should still return 200 with degraded status

      const data = await response.json();
      expect(data.integration_status.sdk_status).toBe('error');
    });

    it('should set proper cache headers', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/mapping-status');
      const response = await GET(request);

      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
      expect(response.headers.get('Pragma')).toBe('no-cache');
      expect(response.headers.get('Expires')).toBe('0');
    });

    it('should validate mapping validation summary format', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/mapping-status');
      const response = await GET(request);
      const data = await response.json();

      const summary = data.mapping_validation_summary;
      expect(summary).toHaveProperty('missing_tier3');
      expect(summary).toHaveProperty('agent_gaps');
      expect(summary).toHaveProperty('endpoint_gaps');
      expect(summary).toHaveProperty('total_sections');
      expect(summary).toHaveProperty('complete_mappings');
      expect(summary).toHaveProperty('partial_mappings');
      expect(summary).toHaveProperty('missing_mappings');

      expect(typeof summary.missing_tier3).toBe('number');
      expect(typeof summary.agent_gaps).toBe('number');
      expect(typeof summary.total_sections).toBe('number');
    });
  });

  describe('environment variable fallback', () => {
    it('should use environment variables when health check fails', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Connection failed'));

      // Mock environment variables
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        OPAL_API_KEY: 'test-key',
        OPAL_WEBHOOK_URL: 'https://test.webhook.url',
        BASE_URL: 'http://localhost:3000'
      };

      const request = new NextRequest('http://localhost:3000/api/admin/mapping-status');
      const response = await GET(request);
      const data = await response.json();

      expect(data.integration_status.sdk_status).toBe('connected');
      expect(data.integration_status.api_key).toBe('valid');

      // Restore environment
      process.env = originalEnv;
    });

    it('should detect placeholder values in environment variables', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Connection failed'));

      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        OPAL_API_KEY: 'opal_prod_api_key_placeholder',
        OPAL_WEBHOOK_URL: 'placeholder-webhook-url'
      };

      const request = new NextRequest('http://localhost:3000/api/admin/mapping-status');
      const response = await GET(request);
      const data = await response.json();

      expect(data.integration_status.api_key).toBe('missing');
      expect(data.integration_status.webhook).toBe('unhealthy');

      process.env = originalEnv;
    });
  });
});