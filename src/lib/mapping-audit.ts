import fs from 'fs';
import path from 'path';
import { OpalMappingStructure, readOpalMapping } from './mapping-utils';

export interface AuditSummary {
  total_sections_checked: number;
  missing_tier3_fixed: number;
  agent_gaps_fixed: number;
  endpoint_gaps_fixed: number;
}

// Tier3 Auto-Fix Rules
const TIER3_DEFAULT_MAPPINGS: Record<string, string[]> = {
  'Strategy Plans': [
    'Overview Dashboard',
    'Strategic Recommendations',
    'Performance Metrics',
    'Data Quality Score',
    'Workflow Timeline'
  ],
  'Optimizely DXP Tools': [
    'Integration Health',
    'Performance Metrics',
    'Data Freshness'
  ],
  'Analytics Insights': [
    'Engagement',
    'Topics',
    'Popular',
    'AI Visibility',
    'Semantic',
    'Geographic',
    'Freshness'
  ],
  'Experience Optimization': [
    'Content Optimization',
    'Experimentation',
    'Personalization',
    'UX Metrics',
    'Technology Health'
  ]
};

// Agent Assignment Validation Rules
const AGENT_VALIDATION_RULES: Record<string, string[]> = {
  'Strategy Plans': ['roadmap_generator', 'integration_health'],
  'Optimizely DXP Tools': ['integration_health', 'cmp_organizer'],
  'Analytics Insights': ['content_review', 'geo_audit', 'audience_suggester'],
  'Experience Optimization': ['personalization_idea_generator', 'customer_journey', 'experiment_blueprinter']
};

/**
 * Check if tier3 mappings are missing and need auto-generation
 */
function needsTier3Fix(tier1: string, tier2Data: any): boolean {
  const tier3 = tier2Data.navigation_structure?.tier3 || [];
  return tier3.length === 0 && TIER3_DEFAULT_MAPPINGS[tier1];
}

/**
 * Check if agent assignments need correction
 */
function needsAgentFix(tier1: string, tier2Data: any): boolean {
  const currentAgents = tier2Data.opal_agents || [];
  const requiredAgents = AGENT_VALIDATION_RULES[tier1] || [];

  // Check if any required agents are missing
  return requiredAgents.some(agent => !currentAgents.includes(agent));
}

/**
 * Apply tier3 auto-fix rules to missing mappings
 */
function applyTier3Fix(tier1: string, tier2: string, tier2Data: any): any {
  if (!needsTier3Fix(tier1, tier2Data)) {
    return tier2Data;
  }

  const defaultTier3 = TIER3_DEFAULT_MAPPINGS[tier1] || [];

  // Create or update navigation_structure
  const updatedData = { ...tier2Data };
  if (!updatedData.navigation_structure) {
    updatedData.navigation_structure = {
      tier1,
      tier2,
      tier3: defaultTier3
    };
  } else {
    updatedData.navigation_structure = {
      ...updatedData.navigation_structure,
      tier3: defaultTier3
    };
  }

  return updatedData;
}

/**
 * Apply agent assignment fixes
 */
function applyAgentFix(tier1: string, tier2Data: any): any {
  if (!needsAgentFix(tier1, tier2Data)) {
    return tier2Data;
  }

  const requiredAgents = AGENT_VALIDATION_RULES[tier1] || [];
  const currentAgents = tier2Data.opal_agents || [];

  // Merge current agents with required agents (avoiding duplicates)
  const mergedAgents = [...new Set([...currentAgents, ...requiredAgents])];

  return {
    ...tier2Data,
    opal_agents: mergedAgents
  };
}

/**
 * Audit the mapping for missing tier3 arrays and agent gaps
 */
export async function auditMapping(): Promise<{
  mapping: OpalMappingStructure;
  issues: {
    missingTier3: Array<{ tier1: string; tier2: string }>;
    agentGaps: Array<{ tier1: string; tier2: string; missing: string[] }>;
  };
}> {
  const mapping = await readOpalMapping();
  const issues = {
    missingTier3: [] as Array<{ tier1: string; tier2: string }>,
    agentGaps: [] as Array<{ tier1: string; tier2: string; missing: string[] }>
  };

  Object.entries(mapping).forEach(([tier1, tier1Data]) => {
    Object.entries(tier1Data).forEach(([tier2, tier2Data]) => {
      // Check for missing tier3
      if (needsTier3Fix(tier1, tier2Data)) {
        issues.missingTier3.push({ tier1, tier2 });
      }

      // Check for agent gaps
      if (needsAgentFix(tier1, tier2Data)) {
        const currentAgents = tier2Data.opal_agents || [];
        const requiredAgents = AGENT_VALIDATION_RULES[tier1] || [];
        const missing = requiredAgents.filter(agent => !currentAgents.includes(agent));
        issues.agentGaps.push({ tier1, tier2, missing });
      }
    });
  });

  return { mapping, issues };
}

/**
 * Apply auto-fix rules and generate corrected mapping
 */
export async function fixMapping(): Promise<{
  correctedMapping: OpalMappingStructure;
  summary: AuditSummary;
}> {
  const { mapping, issues } = await auditMapping();
  const correctedMapping: OpalMappingStructure = {};

  let tier3Fixed = 0;
  let agentGapsFixed = 0;

  // Apply fixes
  Object.entries(mapping).forEach(([tier1, tier1Data]) => {
    correctedMapping[tier1] = {};

    Object.entries(tier1Data).forEach(([tier2, tier2Data]) => {
      let updatedData = { ...tier2Data };

      // Apply tier3 fixes
      if (needsTier3Fix(tier1, tier2Data)) {
        updatedData = applyTier3Fix(tier1, tier2, updatedData);
        tier3Fixed++;
      }

      // Apply agent fixes
      if (needsAgentFix(tier1, tier2Data)) {
        updatedData = applyAgentFix(tier1, updatedData);
        agentGapsFixed++;
      }

      correctedMapping[tier1][tier2] = updatedData;
    });
  });

  const summary: AuditSummary = {
    total_sections_checked: Object.values(mapping).reduce((acc, tier1) => acc + Object.keys(tier1).length, 0),
    missing_tier3_fixed: tier3Fixed,
    agent_gaps_fixed: agentGapsFixed,
    endpoint_gaps_fixed: 0 // Endpoints are auto-generated, not fixed
  };

  return { correctedMapping, summary };
}

/**
 * Write corrected mapping to opal_mapping_fixed.json
 */
export async function writeFixedMapping(correctedMapping: OpalMappingStructure): Promise<string> {
  try {
    const fixedMappingPath = path.join(
      process.cwd(),
      'opal-config',
      'opal-mapping',
      'opal_mapping_fixed.json'
    );

    // In production environments (like Vercel), the file system is read-only
    // Skip file writing and return the path for logging purposes
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
      console.log('📝 Production environment detected: Skipping file write for mapping fixes');
      console.log('📊 Fixed mapping would be written to:', fixedMappingPath);
      return fixedMappingPath;
    }

    fs.writeFileSync(fixedMappingPath, JSON.stringify(correctedMapping, null, 2));
    return fixedMappingPath;
  } catch (error) {
    // In production, treat file write errors as non-fatal
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
      console.warn('⚠️ File system write skipped in production environment:', error.message);
      return path.join(process.cwd(), 'opal-config', 'opal-mapping', 'opal_mapping_fixed.json');
    }

    console.error('Error writing fixed mapping:', error);
    throw new Error('Failed to write corrected mapping file');
  }
}

/**
 * Main function to audit and fix mapping issues
 */
export async function auditAndFixMapping(): Promise<{
  success: boolean;
  fixed_file_path: string;
  summary: AuditSummary;
  issues_found: {
    missingTier3: Array<{ tier1: string; tier2: string }>;
    agentGaps: Array<{ tier1: string; tier2: string; missing: string[] }>;
  };
}> {
  try {
    const { issues } = await auditMapping();
    const { correctedMapping, summary } = await fixMapping();
    const fixedFilePath = await writeFixedMapping(correctedMapping);

    return {
      success: true,
      fixed_file_path: fixedFilePath,
      summary,
      issues_found: issues
    };
  } catch (error) {
    console.error('Error in audit and fix process:', error);
    throw error;
  }
}

/**
 * Get detailed audit report without applying fixes
 */
export async function getAuditReport(): Promise<{
  total_sections: number;
  issues: {
    missingTier3: Array<{ tier1: string; tier2: string }>;
    agentGaps: Array<{ tier1: string; tier2: string; missing: string[] }>;
  };
  recommendations: string[];
}> {
  const { mapping, issues } = await auditMapping();
  const totalSections = Object.values(mapping).reduce((acc, tier1) => acc + Object.keys(tier1).length, 0);

  const recommendations = [];
  if (issues.missingTier3.length > 0) {
    recommendations.push(`${issues.missingTier3.length} sections need Tier3 navigation structure`);
  }
  if (issues.agentGaps.length > 0) {
    recommendations.push(`${issues.agentGaps.length} sections have agent assignment gaps`);
  }
  if (issues.missingTier3.length === 0 && issues.agentGaps.length === 0) {
    recommendations.push('All mappings are complete - no fixes needed');
  }

  return {
    total_sections: totalSections,
    issues,
    recommendations
  };
}