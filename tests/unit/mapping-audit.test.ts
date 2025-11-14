import { jest } from '@jest/globals';
import {
  auditOpalMapping,
  applyAutoFixRules,
  previewAutoFixChanges,
  writeFixedMapping,
  generateAuditReport
} from '../../src/lib/mapping-audit';
import { OpalMappingStructure } from '../../src/lib/mapping-utils';
import fs from 'fs';
import path from 'path';

// Mock dependencies
jest.mock('fs');
jest.mock('path');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockPath = path as jest.Mocked<typeof path>;

describe('mapping-audit', () => {
  const mockMappingWithIssues: OpalMappingStructure = {
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
        // Missing agents and tier3
        opal_instructions: ['marketing-strategy'],
        opal_tools: ['workflow_data_sharing'],
        optimizely_dxp_tools: ['Content Recs'],
        navigation_structure: {
          tier1: 'Strategy Plans',
          tier2: 'Quick Wins'
        }
      }
    },
    'Analytics Insights': {
      'Content': {
        // Missing tier3 and some DXP tools
        opal_agents: ['content_review'],
        opal_tools: ['workflow_data_sharing'],
        navigation_structure: {
          tier1: 'Analytics Insights',
          tier2: 'Content'
        }
      },
      'Audiences': {
        // Complete section
        opal_agents: ['audience_suggester'],
        opal_tools: ['workflow_data_sharing'],
        optimizely_dxp_tools: ['ODP', 'CMP'],
        navigation_structure: {
          tier1: 'Analytics Insights',
          tier2: 'Audiences',
          tier3: ['Engagement', 'Topics', 'Popular']
        }
      }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPath.join.mockImplementation((...args) => args.join('/'));
    mockPath.dirname.mockImplementation((filePath) => filePath.split('/').slice(0, -1).join('/'));
  });

  describe('auditOpalMapping', () => {
    it('should detect missing tier3 mappings', () => {
      const result = auditOpalMapping(mockMappingWithIssues);

      expect(result.missingTier3Sections).toHaveLength(2);
      expect(result.missingTier3Sections).toContainEqual({
        tier1: 'Strategy Plans',
        tier2: 'Quick Wins'
      });
      expect(result.missingTier3Sections).toContainEqual({
        tier1: 'Analytics Insights',
        tier2: 'Content'
      });
    });

    it('should detect agent assignment gaps', () => {
      const result = auditOpalMapping(mockMappingWithIssues);

      expect(result.agentGapSections).toHaveLength(2);
      expect(result.agentGapSections).toContainEqual({
        tier1: 'Strategy Plans',
        tier2: 'Quick Wins'
      });
      expect(result.agentGapSections).toContainEqual({
        tier1: 'Analytics Insights',
        tier2: 'Content'
      });
    });

    it('should detect tool gaps', () => {
      const result = auditOpalMapping(mockMappingWithIssues);

      expect(result.toolGapSections).toHaveLength(0); // All sections have tools
    });

    it('should detect DXP tool gaps', () => {
      const result = auditOpalMapping(mockMappingWithIssues);

      expect(result.endpointGapSections).toHaveLength(1);
      expect(result.endpointGapSections).toContainEqual({
        tier1: 'Analytics Insights',
        tier2: 'Content'
      });
    });

    it('should return empty arrays for complete mapping', () => {
      const completeMapping: OpalMappingStructure = {
        'Strategy Plans': {
          'OSA': {
            opal_agents: ['strategy_workflow'],
            opal_tools: ['workflow_data_sharing'],
            optimizely_dxp_tools: ['Content Recs'],
            navigation_structure: {
              tier1: 'Strategy Plans',
              tier2: 'OSA',
              tier3: ['Overview Dashboard']
            }
          }
        }
      };

      const result = auditOpalMapping(completeMapping);

      expect(result.missingTier3Sections).toHaveLength(0);
      expect(result.agentGapSections).toHaveLength(0);
      expect(result.toolGapSections).toHaveLength(0);
      expect(result.endpointGapSections).toHaveLength(0);
    });
  });

  describe('applyAutoFixRules', () => {
    it('should fix missing tier3 mappings', () => {
      const { fixedMapping, fixSummary } = applyAutoFixRules(mockMappingWithIssues);

      // Check that tier3 was added to Quick Wins
      expect(fixedMapping['Strategy Plans']['Quick Wins'].navigation_structure?.tier3).toBeDefined();
      expect(fixedMapping['Strategy Plans']['Quick Wins'].navigation_structure?.tier3).toHaveLength(5);

      // Check that tier3 was added to Analytics Insights -> Content
      expect(fixedMapping['Analytics Insights']['Content'].navigation_structure?.tier3).toBeDefined();
      expect(fixedMapping['Analytics Insights']['Content'].navigation_structure?.tier3).toContain('Engagement');

      expect(fixSummary.missing_tier3_fixed).toBe(2);
    });

    it('should fix agent assignments', () => {
      const { fixedMapping, fixSummary } = applyAutoFixRules(mockMappingWithIssues);

      // Check that agents were added to Quick Wins
      expect(fixedMapping['Strategy Plans']['Quick Wins'].opal_agents).toContain('roadmap_generator');
      expect(fixedMapping['Strategy Plans']['Quick Wins'].opal_agents).toContain('integration_health');

      // Check that agents were added to Analytics Insights -> Content
      expect(fixedMapping['Analytics Insights']['Content'].opal_agents).toContain('content_review');

      expect(fixSummary.agent_gaps_fixed).toBe(2);
    });

    it('should fix DXP tool assignments', () => {
      const { fixedMapping, fixSummary } = applyAutoFixRules(mockMappingWithIssues);

      // Check that DXP tools were added to Analytics Insights -> Content
      expect(fixedMapping['Analytics Insights']['Content'].optimizely_dxp_tools).toBeDefined();
      expect(fixedMapping['Analytics Insights']['Content'].optimizely_dxp_tools).toContain('Content Recs');

      expect(fixSummary.endpoint_gaps_fixed).toBe(1);
    });

    it('should not modify already complete mappings', () => {
      const { fixedMapping } = applyAutoFixRules(mockMappingWithIssues);

      // OSA section should remain unchanged
      expect(fixedMapping['Strategy Plans']['OSA']).toEqual(
        mockMappingWithIssues['Strategy Plans']['OSA']
      );

      // Audiences section should remain unchanged
      expect(fixedMapping['Analytics Insights']['Audiences']).toEqual(
        mockMappingWithIssues['Analytics Insights']['Audiences']
      );
    });

    it('should return correct fix summary', () => {
      const { fixSummary } = applyAutoFixRules(mockMappingWithIssues);

      expect(fixSummary.missing_tier3_fixed).toBe(2);
      expect(fixSummary.agent_gaps_fixed).toBe(2);
      expect(fixSummary.endpoint_gaps_fixed).toBe(1);
      expect(fixSummary.total_fixes_applied).toBe(5);
    });
  });

  describe('previewAutoFixChanges', () => {
    it('should preview changes without applying them', () => {
      const { changesPreview, totalChanges } = previewAutoFixChanges(mockMappingWithIssues);

      expect(totalChanges).toBe(5); // 2 tier3, 2 agents, 1 dxp_tools
      expect(changesPreview).toHaveLength(5);

      // Should include tier3 change for Quick Wins
      const tier3Change = changesPreview.find(
        change => change.tier1 === 'Strategy Plans' &&
                   change.tier2 === 'Quick Wins' &&
                   change.changeType === 'tier3'
      );
      expect(tier3Change).toBeDefined();
      expect(tier3Change?.currentValue).toEqual([]);
      expect(tier3Change?.proposedValue).toHaveLength(5);

      // Should include agent change for Content
      const agentChange = changesPreview.find(
        change => change.tier1 === 'Analytics Insights' &&
                   change.tier2 === 'Content' &&
                   change.changeType === 'agents'
      );
      expect(agentChange).toBeDefined();
      expect(agentChange?.currentValue).toEqual([]);
      expect(agentChange?.proposedValue).toContain('content_review');
    });

    it('should return empty preview for complete mapping', () => {
      const completeMapping: OpalMappingStructure = {
        'Strategy Plans': {
          'OSA': {
            opal_agents: ['strategy_workflow'],
            opal_tools: ['workflow_data_sharing'],
            optimizely_dxp_tools: ['Content Recs'],
            navigation_structure: {
              tier1: 'Strategy Plans',
              tier2: 'OSA',
              tier3: ['Overview Dashboard']
            }
          }
        }
      };

      const { changesPreview, totalChanges } = previewAutoFixChanges(completeMapping);

      expect(totalChanges).toBe(0);
      expect(changesPreview).toHaveLength(0);
    });
  });

  describe('writeFixedMapping', () => {
    it('should write fixed mapping to file', async () => {
      const { fixedMapping } = applyAutoFixRules(mockMappingWithIssues);
      const mockFilePath = '/test/path/opal_mapping_fixed.json';

      mockPath.join.mockReturnValue(mockFilePath);
      mockPath.dirname.mockReturnValue('/test/path');
      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockReturnValue(undefined);
      mockFs.writeFileSync.mockReturnValue(undefined);

      const result = await writeFixedMapping(fixedMapping);

      expect(mockFs.mkdirSync).toHaveBeenCalledWith('/test/path', { recursive: true });
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        mockFilePath,
        JSON.stringify(fixedMapping, null, 2),
        'utf-8'
      );
      expect(result).toBe(mockFilePath);
    });

    it('should handle write errors', async () => {
      const { fixedMapping } = applyAutoFixRules(mockMappingWithIssues);

      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('Write failed');
      });

      await expect(writeFixedMapping(fixedMapping)).rejects.toThrow('Failed to write fixed mapping file');
    });

    it('should create directory if it does not exist', async () => {
      const { fixedMapping } = applyAutoFixRules(mockMappingWithIssues);

      mockFs.existsSync.mockReturnValue(false);

      await writeFixedMapping(fixedMapping);

      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        expect.any(String),
        { recursive: true }
      );
    });
  });

  describe('generateAuditReport', () => {
    it('should generate comprehensive audit report', () => {
      const report = generateAuditReport(mockMappingWithIssues);

      expect(report.auditSummary.missingTier3Sections).toHaveLength(2);
      expect(report.auditSummary.agentGapSections).toHaveLength(2);
      expect(report.previewChanges.totalChanges).toBe(5);
      expect(report.recommendations).toContain('Add Tier3 navigation structure to 2 sections');
      expect(report.recommendations).toContain('Assign OPAL agents to 2 sections');
    });

    it('should generate clean report for complete mapping', () => {
      const completeMapping: OpalMappingStructure = {
        'Strategy Plans': {
          'OSA': {
            opal_agents: ['strategy_workflow'],
            opal_tools: ['workflow_data_sharing'],
            optimizely_dxp_tools: ['Content Recs'],
            navigation_structure: {
              tier1: 'Strategy Plans',
              tier2: 'OSA',
              tier3: ['Overview Dashboard']
            }
          }
        }
      };

      const report = generateAuditReport(completeMapping);

      expect(report.auditSummary.missingTier3Sections).toHaveLength(0);
      expect(report.auditSummary.agentGapSections).toHaveLength(0);
      expect(report.previewChanges.totalChanges).toBe(0);
      expect(report.recommendations).toContain('✅ All mapping sections are properly configured');
    });
  });

  describe('error handling', () => {
    it('should handle empty mapping gracefully', () => {
      const result = auditOpalMapping({});

      expect(result.missingTier3Sections).toHaveLength(0);
      expect(result.agentGapSections).toHaveLength(0);
      expect(result.toolGapSections).toHaveLength(0);
      expect(result.endpointGapSections).toHaveLength(0);
    });

    it('should handle malformed mapping structure', () => {
      const malformedMapping = {
        'BadCategory': {
          'BadSection': null as any
        }
      };

      expect(() => auditOpalMapping(malformedMapping)).not.toThrow();
    });
  });
});