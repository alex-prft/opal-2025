import { jest } from '@jest/globals';
import {
  transformToMappingTable,
  generateResultEndpoints,
  validateMappingCompleteness,
  exportMappingTableToCSV,
  OpalMappingStructure,
  MappingTableRow
} from '../../src/lib/mapping-utils';

// Mock fs
jest.mock('fs');
jest.mock('path');

describe('mapping-utils', () => {
  const mockMapping: OpalMappingStructure = {
    'Strategy Plans': {
      'OSA': {
        opal_instructions: ['company-overview'],
        opal_agents: ['strategy_workflow'],
        opal_tools: ['workflow_data_sharing'],
        optimizely_dxp_tools: ['Content Recs', 'CMS'],
        navigation_structure: {
          tier1: 'Strategy Plans',
          tier2: 'OSA',
          tier3: ['Overview Dashboard', 'Strategic Recommendations']
        }
      },
      'Quick Wins': {
        opal_instructions: ['marketing-strategy'],
        opal_agents: [],
        opal_tools: [],
        optimizely_dxp_tools: [],
        navigation_structure: {
          tier1: 'Strategy Plans',
          tier2: 'Quick Wins',
          tier3: []
        }
      }
    },
    'Analytics Insights': {
      'Content': {
        opal_agents: ['content_review'],
        opal_tools: ['workflow_data_sharing'],
        optimizely_dxp_tools: ['Content Recs'],
        navigation_structure: {
          tier1: 'Analytics Insights',
          tier2: 'Content',
          tier3: ['Engagement', 'Topics', 'Popular']
        }
      }
    }
  };

  describe('transformToMappingTable', () => {
    it('should transform OPAL mapping to table format', () => {
      const result = transformToMappingTable(mockMapping);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        tier1: 'Strategy Plans',
        tier2: 'OSA',
        tier3: ['Overview Dashboard', 'Strategic Recommendations'],
        opal_agents: ['strategy_workflow'],
        opal_tools: ['workflow_data_sharing'],
        dxp_tools: ['Content Recs', 'CMS'],
        result_endpoints: expect.any(Array),
        status: 'complete'
      });
    });

    it('should handle missing data gracefully', () => {
      const incompleteMapping = {
        'Test Category': {
          'Test Section': {}
        }
      };

      const result = transformToMappingTable(incompleteMapping);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        tier1: 'Test Category',
        tier2: 'Test Section',
        tier3: [],
        opal_agents: [],
        opal_tools: [],
        dxp_tools: [],
        result_endpoints: expect.any(Array),
        status: 'missing'
      });
    });

    it('should determine status correctly', () => {
      const result = transformToMappingTable(mockMapping);

      // Complete mapping (Strategy Plans -> OSA)
      expect(result[0].status).toBe('complete');

      // Missing mapping (Strategy Plans -> Quick Wins)
      expect(result[1].status).toBe('missing');

      // Partial mapping (Analytics Insights -> Content)
      expect(result[2].status).toBe('partial');
    });
  });

  describe('generateResultEndpoints', () => {
    it('should generate correct endpoint URLs', () => {
      const endpoints = generateResultEndpoints('Strategy Plans', 'OSA', ['Overview Dashboard']);

      expect(endpoints).toContain('/engine/results/strategy-plans');
      expect(endpoints).toContain('/engine/results/strategy-plans/osa');
      expect(endpoints).toContain('/engine/results/strategy-plans/osa/overview-dashboard');
    });

    it('should handle special characters in names', () => {
      const endpoints = generateResultEndpoints('Analytics Insights', 'Customer Experience', ['User Journey Map']);

      expect(endpoints).toContain('/engine/results/analytics-insights');
      expect(endpoints).toContain('/engine/results/analytics-insights/customer-experience');
      expect(endpoints).toContain('/engine/results/analytics-insights/customer-experience/user-journey-map');
    });

    it('should handle empty tier3 array', () => {
      const endpoints = generateResultEndpoints('Test Category', 'Test Section', []);

      expect(endpoints).toHaveLength(2);
      expect(endpoints).toContain('/engine/results/test-category');
      expect(endpoints).toContain('/engine/results/test-category/test-section');
    });
  });

  describe('validateMappingCompleteness', () => {
    it('should return complete for fully configured mapping', () => {
      const status = validateMappingCompleteness(
        ['tier3-1', 'tier3-2'],
        ['agent1', 'agent2'],
        ['tool1'],
        ['dxp-tool1'],
        ['/endpoint1', '/endpoint2']
      );

      expect(status).toBe('complete');
    });

    it('should return partial for partially configured mapping', () => {
      const status = validateMappingCompleteness(
        ['tier3-1'],
        ['agent1'],
        [],
        ['dxp-tool1'],
        ['/endpoint1']
      );

      expect(status).toBe('partial');
    });

    it('should return missing for poorly configured mapping', () => {
      const status = validateMappingCompleteness(
        [],
        [],
        [],
        [],
        []
      );

      expect(status).toBe('missing');
    });
  });

  describe('exportMappingTableToCSV', () => {
    const mockTableData: MappingTableRow[] = [
      {
        tier1: 'Strategy Plans',
        tier2: 'OSA',
        tier3: ['Dashboard', 'Recommendations'],
        opal_agents: ['agent1', 'agent2'],
        opal_tools: ['tool1'],
        dxp_tools: ['Content Recs'],
        result_endpoints: ['/endpoint1', '/endpoint2'],
        status: 'complete'
      },
      {
        tier1: 'Analytics Insights',
        tier2: 'Content',
        tier3: ['Engagement'],
        opal_agents: ['content_agent'],
        opal_tools: ['content_tool'],
        dxp_tools: ['CMS'],
        result_endpoints: ['/analytics/content'],
        status: 'partial'
      }
    ];

    it('should export mapping table to CSV format', () => {
      const csv = exportMappingTableToCSV(mockTableData);
      const lines = csv.split('\n');

      // Check header
      expect(lines[0]).toBe('Tier 1,Tier 2,Tier 3 Count,OPAL Agents,OPAL Tools,DXP Tools,Result Endpoints,Status');

      // Check first row
      expect(lines[1]).toBe('"Strategy Plans","OSA",2,"agent1, agent2","tool1","Content Recs",2,complete');

      // Check second row
      expect(lines[2]).toBe('"Analytics Insights","Content",1,"content_agent","content_tool","CMS",1,partial');
    });

    it('should handle empty data', () => {
      const csv = exportMappingTableToCSV([]);
      const lines = csv.split('\n');

      expect(lines).toHaveLength(1);
      expect(lines[0]).toBe('Tier 1,Tier 2,Tier 3 Count,OPAL Agents,OPAL Tools,DXP Tools,Result Endpoints,Status');
    });

    it('should escape commas in cell content', () => {
      const dataWithCommas: MappingTableRow[] = [
        {
          tier1: 'Test, Category',
          tier2: 'Test, Section',
          tier3: [],
          opal_agents: ['agent, with, commas'],
          opal_tools: [],
          dxp_tools: [],
          result_endpoints: [],
          status: 'missing'
        }
      ];

      const csv = exportMappingTableToCSV(dataWithCommas);
      const lines = csv.split('\n');

      expect(lines[1]).toBe('"Test, Category","Test, Section",0,"agent, with, commas","","",0,missing');
    });
  });

  describe('error handling', () => {
    it('should handle invalid mapping structure', () => {
      expect(() => transformToMappingTable({} as any)).not.toThrow();
      expect(transformToMappingTable({} as any)).toEqual([]);
    });

    it('should handle null/undefined values', () => {
      const result = transformToMappingTable({
        'Test': {
          'Section': {
            navigation_structure: null as any
          }
        }
      });

      expect(result[0].tier3).toEqual([]);
      expect(result[0].status).toBe('missing');
    });
  });
});