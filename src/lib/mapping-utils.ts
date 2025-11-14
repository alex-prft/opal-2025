import fs from 'fs';
import path from 'path';

export interface MappingTableRow {
  tier1: string;
  tier2: string;
  tier3: string[];
  opal_agents: string[];
  opal_tools: string[];
  dxp_tools: string[];
  result_endpoints: string[];
  status: 'complete' | 'partial' | 'missing';
}

export interface OpalMappingStructure {
  [tier1: string]: {
    [tier2: string]: {
      opal_instructions?: string[];
      opal_agents?: string[];
      opal_tools?: string[];
      optimizely_dxp_tools?: string[];
      navigation_structure?: {
        tier1: string;
        tier2: string;
        tier3?: string[];
      };
    };
  };
}

export interface ValidationSummary {
  missing_tier3: number;
  agent_gaps: number;
  endpoint_gaps: number;
  total_sections: number;
}

/**
 * Read and parse opal_mapping.json from filesystem
 */
export async function readOpalMapping(): Promise<OpalMappingStructure> {
  try {
    const mappingPath = path.join(process.cwd(), 'opal-config', 'opal-mapping', 'opal_mapping.json');
    const mappingContent = fs.readFileSync(mappingPath, 'utf-8');
    return JSON.parse(mappingContent);
  } catch (error) {
    console.error('Error reading opal_mapping.json:', error);
    throw new Error('Failed to read OPAL mapping configuration');
  }
}

/**
 * Generate API endpoint URLs based on tier structure
 */
export function generateResultEndpoints(tier1: string, tier2: string): string[] {
  const endpoints: string[] = [];

  // Base API endpoint pattern
  const baseEndpoint = `/api/results/${tier1.toLowerCase().replace(/\s+/g, '-')}`;
  endpoints.push(baseEndpoint);

  // Tier2-specific endpoint
  const tier2Endpoint = `${baseEndpoint}/${tier2.toLowerCase().replace(/\s+/g, '-')}`;
  endpoints.push(tier2Endpoint);

  // Add specific endpoints based on tier1 category
  switch (tier1) {
    case 'Strategy Plans':
      endpoints.push('/api/results/strategy', '/api/results/roadmap');
      break;
    case 'Optimizely DXP Tools':
      endpoints.push('/api/tools/integration-health', '/api/tools/performance');
      break;
    case 'Analytics Insights':
      endpoints.push('/api/analytics/insights', '/api/analytics/engagement');
      break;
    case 'Experience Optimization':
      endpoints.push('/api/optimization/experiments', '/api/optimization/personalization');
      break;
  }

  return [...new Set(endpoints)]; // Remove duplicates
}

/**
 * Validate mapping completeness and determine status
 */
export function validateMappingCompleteness(
  tier3: string[] = [],
  agents: string[] = [],
  tools: string[] = [],
  dxpTools: string[] = [],
  endpoints: string[] = []
): 'complete' | 'partial' | 'missing' {
  const hasTier3 = tier3.length > 0;
  const hasAgents = agents.length > 0;
  const hasTools = tools.length > 0;
  const hasDxpTools = dxpTools.length > 0;
  const hasEndpoints = endpoints.length > 0;

  const completionScore = [hasTier3, hasAgents, hasTools, hasDxpTools, hasEndpoints].filter(Boolean).length;

  if (completionScore === 5) return 'complete';
  if (completionScore >= 3) return 'partial';
  return 'missing';
}

/**
 * Transform OPAL mapping structure into structured mapping table array
 */
export function transformToMappingTable(mapping: OpalMappingStructure): MappingTableRow[] {
  const mappingTable: MappingTableRow[] = [];

  Object.entries(mapping).forEach(([tier1, tier1Data]) => {
    Object.entries(tier1Data).forEach(([tier2, tier2Data]) => {
      // Extract data with fallbacks
      const tier3 = tier2Data.navigation_structure?.tier3 || [];
      const opal_agents = tier2Data.opal_agents || [];
      const opal_tools = tier2Data.opal_tools || [];
      const dxp_tools = tier2Data.optimizely_dxp_tools || [];
      const result_endpoints = generateResultEndpoints(tier1, tier2);

      // Determine status
      const status = validateMappingCompleteness(
        tier3,
        opal_agents,
        opal_tools,
        dxp_tools,
        result_endpoints
      );

      mappingTable.push({
        tier1,
        tier2,
        tier3,
        opal_agents,
        opal_tools,
        dxp_tools,
        result_endpoints,
        status
      });
    });
  });

  return mappingTable;
}

/**
 * Get mapping validation summary statistics
 */
export function getMappingValidationSummary(mappingTable: MappingTableRow[]) {
  const missingTier3 = mappingTable.filter(row => row.tier3.length === 0).length;
  const agentGaps = mappingTable.filter(row => row.opal_agents.length === 0).length;
  const endpointGaps = mappingTable.filter(row => row.result_endpoints.length === 0).length;

  return {
    total_sections_checked: mappingTable.length,
    missing_tier3: missingTier3,
    agent_gaps: agentGaps,
    endpoint_gaps: endpointGaps,
    complete_mappings: mappingTable.filter(row => row.status === 'complete').length,
    partial_mappings: mappingTable.filter(row => row.status === 'partial').length,
    missing_mappings: mappingTable.filter(row => row.status === 'missing').length
  };
}

/**
 * Export mapping table to CSV format
 */
export function exportMappingTableToCSV(tableRows: MappingTableRow[]): string {
  const headers = [
    'Tier 1',
    'Tier 2',
    'Tier 3 Count',
    'OPAL Agents',
    'OPAL Tools',
    'DXP Tools',
    'Result Endpoints',
    'Status'
  ];

  const csvRows = [
    headers.join(','),
    ...tableRows.map(row => [
      `"${row.tier1}"`,
      `"${row.tier2}"`,
      row.tier3.length,
      `"${row.opal_agents.join(', ')}"`,
      `"${row.opal_tools.join(', ')}"`,
      `"${row.dxp_tools.join(', ')}"`,
      row.result_endpoints.length,
      row.status
    ].join(','))
  ];

  return csvRows.join('\n');
}

/**
 * Main function to get complete mapping data for admin dashboard
 */
export async function getMappingData() {
  try {
    const rawMapping = await readOpalMapping();
    const mappingTable = transformToMappingTable(rawMapping);
    const validationSummary = getMappingValidationSummary(mappingTable);

    return {
      mapping_table: mappingTable,
      validation_summary: validationSummary,
      raw_mapping: rawMapping
    };
  } catch (error) {
    console.error('Error getting mapping data:', error);
    throw error;
  }
}