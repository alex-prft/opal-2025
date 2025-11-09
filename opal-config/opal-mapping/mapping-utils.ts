/**
 * OPAL Mapping Utilities
 *
 * Utility functions to work with OPAL mapping data and enhance
 * the accuracy and personalization of OSA results.
 */

import { CompleteOPALMapping, OPALMapping, ResultEnhancement } from './types';
import opalMappingData from './opal_mapping.json';

/**
 * Get OPAL mapping for a specific area and sub-section
 */
export function getOPALMapping(area: string, subSection: string): OPALMapping | null {
  const mapping = opalMappingData as CompleteOPALMapping;
  return mapping[area]?.[subSection] || null;
}

/**
 * Get all areas and their sub-sections
 */
export function getAllAreasAndSections(): { [area: string]: string[] } {
  const mapping = opalMappingData as CompleteOPALMapping;
  const result: { [area: string]: string[] } = {};

  for (const [area, sections] of Object.entries(mapping)) {
    result[area] = Object.keys(sections);
  }

  return result;
}

/**
 * Get unique OPAL agents across all mappings
 */
export function getAllOPALAgents(): string[] {
  const mapping = opalMappingData as CompleteOPALMapping;
  const agents = new Set<string>();

  for (const area of Object.values(mapping)) {
    for (const section of Object.values(area)) {
      section.opal_agents.forEach(agent => agents.add(agent));
    }
  }

  return Array.from(agents).sort();
}

/**
 * Get unique OPAL instructions across all mappings
 */
export function getAllOPALInstructions(): string[] {
  const mapping = opalMappingData as CompleteOPALMapping;
  const instructions = new Set<string>();

  for (const area of Object.values(mapping)) {
    for (const section of Object.values(area)) {
      section.opal_instructions.forEach(instruction => instructions.add(instruction));
    }
  }

  return Array.from(instructions).sort();
}

/**
 * Get unique OPAL tools across all mappings
 */
export function getAllOPALTools(): string[] {
  const mapping = opalMappingData as CompleteOPALMapping;
  const tools = new Set<string>();

  for (const area of Object.values(mapping)) {
    for (const section of Object.values(area)) {
      section.opal_tools.forEach(tool => tools.add(tool));
    }
  }

  return Array.from(tools).sort();
}

/**
 * Get unique Optimizely DXP tools across all mappings
 */
export function getAllDXPTools(): string[] {
  const mapping = opalMappingData as CompleteOPALMapping;
  const dxpTools = new Set<string>();

  for (const area of Object.values(mapping)) {
    for (const section of Object.values(area)) {
      section.optimizely_dxp_tools.forEach(tool => dxpTools.add(tool));
    }
  }

  return Array.from(dxpTools).sort();
}

/**
 * Analyze data quality and integration gaps for a specific area/section
 */
export function analyzeDataQuality(area: string, subSection: string): ResultEnhancement {
  const mapping = getOPALMapping(area, subSection);

  if (!mapping) {
    return {
      area,
      sub_section: subSection,
      current_data_quality: 0,
      missing_integrations: ['All integrations missing'],
      recommended_improvements: ['Configure OPAL mapping for this area'],
      personalization_opportunities: [],
      estimated_accuracy_improvement: 0
    };
  }

  // Simulate data quality analysis based on DXP tool integrations
  const totalDXPTools = mapping.optimizely_dxp_tools.length;
  const connectedTools = 0; // Currently all simulated
  const dataQuality = connectedTools / totalDXPTools * 100;

  // Generate improvement recommendations
  const improvements: string[] = [];
  const missingIntegrations: string[] = [];

  mapping.optimizely_dxp_tools.forEach(tool => {
    missingIntegrations.push(`${tool} API integration`);
    improvements.push(`Connect live ${tool} data for real-time insights`);
  });

  // Personalization opportunities based on available tools
  const personalizationOpportunities: string[] = [];
  if (mapping.optimizely_dxp_tools.includes('Content Recs')) {
    personalizationOpportunities.push('Visitor behavior-based content recommendations');
  }
  if (mapping.optimizely_dxp_tools.includes('ODP')) {
    personalizationOpportunities.push('Unified customer profile personalization');
  }
  if (mapping.optimizely_dxp_tools.includes('WEBX')) {
    personalizationOpportunities.push('Experiment-driven personalization rules');
  }

  return {
    area,
    sub_section: subSection,
    current_data_quality: dataQuality,
    missing_integrations: missingIntegrations,
    recommended_improvements: improvements,
    personalization_opportunities: personalizationOpportunities,
    estimated_accuracy_improvement: Math.min(95 - dataQuality, 75) // Max 75% improvement possible
  };
}

/**
 * Get enhanced engine summary using OPAL mapping
 */
export function getEnhancedEngineSummary(area: string, subSection: string) {
  const mapping = getOPALMapping(area, subSection);
  const dataAnalysis = analyzeDataQuality(area, subSection);

  if (!mapping) {
    return {
      title: `${area} → ${subSection} Analysis`,
      opalAgents: ['No mapping configured'],
      opalInstructions: ['No mapping configured'],
      opalTools: ['No mapping configured'],
      optimizelyDXPTools: ['No mapping configured'],
      ragActions: ['Unable to generate insights without proper mapping'],
      dataIssues: ['No OPAL mapping configured for this area/section'],
      improvements: ['Configure OPAL mapping to enable insights generation'],
      dataQuality: 0,
      personalizationOpportunities: []
    };
  }

  // Generate RAG actions based on the mapping
  const ragActions = [
    `Processes ${mapping.opal_instructions.join(', ')} through RAG decision layer`,
    `Applies ${mapping.opal_agents.join(', ')} agent logic for analysis`,
    `Generates insights using ${mapping.opal_tools.join(', ')} data processing`
  ];

  // Generate data issues based on missing DXP integrations
  const dataIssues = [
    `Missing live data from ${mapping.optimizely_dxp_tools.join(', ')}`,
    'All DXP tool data currently simulated rather than real-time',
    `Analysis based on OPAL framework rather than actual ${mapping.optimizely_dxp_tools.join(', ')} performance`
  ];

  return {
    title: `${area} → ${subSection} Analysis`,
    opalAgents: mapping.opal_agents,
    opalInstructions: mapping.opal_instructions.map(inst => `${inst}.md`),
    opalTools: mapping.opal_tools,
    optimizelyDXPTools: mapping.optimizely_dxp_tools,
    ragActions,
    dataIssues,
    improvements: dataAnalysis.recommended_improvements,
    dataQuality: dataAnalysis.current_data_quality,
    personalizationOpportunities: dataAnalysis.personalization_opportunities
  };
}

/**
 * Convert area and tab IDs to match mapping keys
 */
export function convertToMappingKey(areaId: string, tabId: string): { area: string; subSection: string } {
  // Convert kebab-case IDs to proper names
  const areaMapping: { [key: string]: string } = {
    'strategy-plans': 'Strategy Plans',
    'dxp-tools': 'Optimizely DXP Tools',
    'analytics-insights': 'Analytics Insights',
    'experience-optimization': 'Experience Optimization'
  };

  const sectionMapping: { [key: string]: string } = {
    'osa': 'OSA',
    'overview': 'Quick Wins',
    'personalization-maturity': 'Maturity',
    'phased-recommendations': 'Phases',
    'example-roadmap': 'Roadmap',
    'content-recommendations': 'Content Recs',
    'cms': 'CMS',
    'odp': 'ODP',
    'webx': 'WEBX',
    'cmp': 'CMP',
    'content': 'Content',
    'audiences': 'Audiences',
    'customer-experience': 'Customer Experience',
    'other': 'Other',
    'content-opt': 'Content',
    'experimentation': 'Experimentation',
    'personalization': 'Personalization',
    'user-experience': 'User Experience',
    'technology': 'Technology'
  };

  return {
    area: areaMapping[areaId] || areaId,
    subSection: sectionMapping[tabId] || tabId
  };
}