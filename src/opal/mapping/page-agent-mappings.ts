/**
 * OPAL Agent to Results Page Mappings
 *
 * Defines the read-only mapping between Results pages and their associated
 * OPAL agents and DXP tools. Used by results-content-optimizer to determine
 * which data sources to fetch for each page.
 *
 * DO NOT MODIFY: This file is used as input by results-content-optimizer
 * and should not be changed by the agent.
 */

import { OpalAgentId, DXPToolId, OPAL_AGENTS, DXP_TOOLS } from '../clients/OpalClient';

// =============================================================================
// Page Mapping Types
// =============================================================================

export interface PageAgentMapping {
  pageId: string;
  tier: 1 | 2 | 3;
  section: 'strategy-plans' | 'optimizely-dxp-tools' | 'analytics-insights' | 'experience-optimization';
  subsection: string;
  primaryAgents: OpalAgentId[];
  secondaryAgents: OpalAgentId[];
  requiredTools: DXPToolId[];
  optionalTools: DXPToolId[];
  priority: number; // 1 = highest priority for content generation
}

// =============================================================================
// Strategy Plans Mappings
// =============================================================================

const STRATEGY_PLANS_MAPPINGS: PageAgentMapping[] = [
  // OSA Overview Section
  {
    pageId: 'strategy-plans/osa/overview-dashboard',
    tier: 1,
    section: 'strategy-plans',
    subsection: 'osa',
    primaryAgents: [OPAL_AGENTS.STRATEGY_WORKFLOW],
    secondaryAgents: [OPAL_AGENTS.MATURITY_ASSESSMENT],
    requiredTools: [DXP_TOOLS.CMP],
    optionalTools: [DXP_TOOLS.ODP, DXP_TOOLS.WEBX],
    priority: 1
  },
  {
    pageId: 'strategy-plans/osa/current-state',
    tier: 2,
    section: 'strategy-plans',
    subsection: 'osa',
    primaryAgents: [OPAL_AGENTS.STRATEGY_WORKFLOW, OPAL_AGENTS.MATURITY_ASSESSMENT],
    secondaryAgents: [OPAL_AGENTS.INTEGRATION_HEALTH],
    requiredTools: [DXP_TOOLS.CMP],
    optionalTools: [DXP_TOOLS.ODP, DXP_TOOLS.CMS, DXP_TOOLS.CONTENT_RECS],
    priority: 2
  },
  {
    pageId: 'strategy-plans/osa/recommended-next-steps',
    tier: 2,
    section: 'strategy-plans',
    subsection: 'osa',
    primaryAgents: [OPAL_AGENTS.STRATEGY_WORKFLOW],
    secondaryAgents: [OPAL_AGENTS.QUICK_WINS_ANALYZER, OPAL_AGENTS.ROADMAP_GENERATOR],
    requiredTools: [DXP_TOOLS.CMP],
    optionalTools: [DXP_TOOLS.WEBX, DXP_TOOLS.ODP],
    priority: 1
  },

  // Quick Wins Section
  {
    pageId: 'strategy-plans/quick-wins/overview',
    tier: 1,
    section: 'strategy-plans',
    subsection: 'quick-wins',
    primaryAgents: [OPAL_AGENTS.QUICK_WINS_ANALYZER],
    secondaryAgents: [OPAL_AGENTS.STRATEGY_WORKFLOW],
    requiredTools: [DXP_TOOLS.CMP],
    optionalTools: [DXP_TOOLS.CONTENT_RECS, DXP_TOOLS.WEBX],
    priority: 1
  },
  {
    pageId: 'strategy-plans/quick-wins/content-optimization',
    tier: 2,
    section: 'strategy-plans',
    subsection: 'quick-wins',
    primaryAgents: [OPAL_AGENTS.QUICK_WINS_ANALYZER, OPAL_AGENTS.CONTENT_REVIEW],
    secondaryAgents: [OPAL_AGENTS.CONTENT_NEXT_BEST_TOPICS],
    requiredTools: [DXP_TOOLS.CONTENT_RECS, DXP_TOOLS.CMS],
    optionalTools: [DXP_TOOLS.ODP],
    priority: 2
  },
  {
    pageId: 'strategy-plans/quick-wins/audience-expansion',
    tier: 2,
    section: 'strategy-plans',
    subsection: 'quick-wins',
    primaryAgents: [OPAL_AGENTS.QUICK_WINS_ANALYZER, OPAL_AGENTS.AUDIENCE_SUGGESTER],
    secondaryAgents: [OPAL_AGENTS.PERSONALIZATION_IDEA_GENERATOR],
    requiredTools: [DXP_TOOLS.ODP, DXP_TOOLS.CMP],
    optionalTools: [DXP_TOOLS.WEBX],
    priority: 2
  },

  // Maturity Assessment Section
  {
    pageId: 'strategy-plans/maturity/overview',
    tier: 1,
    section: 'strategy-plans',
    subsection: 'maturity',
    primaryAgents: [OPAL_AGENTS.MATURITY_ASSESSMENT],
    secondaryAgents: [OPAL_AGENTS.STRATEGY_WORKFLOW],
    requiredTools: [DXP_TOOLS.CMP],
    optionalTools: [DXP_TOOLS.ODP, DXP_TOOLS.WEBX, DXP_TOOLS.CMS],
    priority: 1
  },
  {
    pageId: 'strategy-plans/maturity/current-capabilities',
    tier: 2,
    section: 'strategy-plans',
    subsection: 'maturity',
    primaryAgents: [OPAL_AGENTS.MATURITY_ASSESSMENT, OPAL_AGENTS.INTEGRATION_HEALTH],
    secondaryAgents: [OPAL_AGENTS.STRATEGY_WORKFLOW],
    requiredTools: [DXP_TOOLS.CMP],
    optionalTools: [DXP_TOOLS.ODP, DXP_TOOLS.WEBX, DXP_TOOLS.CMS, DXP_TOOLS.CONTENT_RECS],
    priority: 2
  },

  // Phases Section
  {
    pageId: 'strategy-plans/phases/phase-1',
    tier: 2,
    section: 'strategy-plans',
    subsection: 'phases',
    primaryAgents: [OPAL_AGENTS.STRATEGY_WORKFLOW, OPAL_AGENTS.ROADMAP_GENERATOR],
    secondaryAgents: [OPAL_AGENTS.MATURITY_ASSESSMENT],
    requiredTools: [DXP_TOOLS.CMP],
    optionalTools: [DXP_TOOLS.ODP, DXP_TOOLS.CMS],
    priority: 2
  },
  {
    pageId: 'strategy-plans/phases/phase-2',
    tier: 2,
    section: 'strategy-plans',
    subsection: 'phases',
    primaryAgents: [OPAL_AGENTS.STRATEGY_WORKFLOW, OPAL_AGENTS.ROADMAP_GENERATOR],
    secondaryAgents: [OPAL_AGENTS.EXPERIMENT_BLUEPRINTER],
    requiredTools: [DXP_TOOLS.CMP, DXP_TOOLS.WEBX],
    optionalTools: [DXP_TOOLS.ODP, DXP_TOOLS.CONTENT_RECS],
    priority: 2
  },

  // Roadmap Section
  {
    pageId: 'strategy-plans/roadmap/overview',
    tier: 1,
    section: 'strategy-plans',
    subsection: 'roadmap',
    primaryAgents: [OPAL_AGENTS.ROADMAP_GENERATOR],
    secondaryAgents: [OPAL_AGENTS.STRATEGY_WORKFLOW, OPAL_AGENTS.MATURITY_ASSESSMENT],
    requiredTools: [DXP_TOOLS.CMP],
    optionalTools: [DXP_TOOLS.ODP, DXP_TOOLS.WEBX],
    priority: 1
  }
];

// =============================================================================
// Optimizely DXP Tools Mappings
// =============================================================================

const DXP_TOOLS_MAPPINGS: PageAgentMapping[] = [
  // Content Recommendations
  {
    pageId: 'optimizely-dxp-tools/content-recs/overview',
    tier: 1,
    section: 'optimizely-dxp-tools',
    subsection: 'content-recs',
    primaryAgents: [OPAL_AGENTS.CONTENT_RECS_TOPIC_PERFORMANCE],
    secondaryAgents: [OPAL_AGENTS.CONTENT_REVIEW, OPAL_AGENTS.INTEGRATION_HEALTH],
    requiredTools: [DXP_TOOLS.CONTENT_RECS],
    optionalTools: [DXP_TOOLS.CMS, DXP_TOOLS.ODP],
    priority: 1
  },
  {
    pageId: 'optimizely-dxp-tools/content-recs/topic-performance',
    tier: 2,
    section: 'optimizely-dxp-tools',
    subsection: 'content-recs',
    primaryAgents: [OPAL_AGENTS.CONTENT_RECS_TOPIC_PERFORMANCE],
    secondaryAgents: [OPAL_AGENTS.CONTENT_REVIEW],
    requiredTools: [DXP_TOOLS.CONTENT_RECS],
    optionalTools: [DXP_TOOLS.CMS],
    priority: 1
  },

  // CMS Integration
  {
    pageId: 'optimizely-dxp-tools/cms/overview',
    tier: 1,
    section: 'optimizely-dxp-tools',
    subsection: 'cms',
    primaryAgents: [OPAL_AGENTS.INTEGRATION_HEALTH],
    secondaryAgents: [OPAL_AGENTS.CONTENT_REVIEW],
    requiredTools: [DXP_TOOLS.CMS],
    optionalTools: [DXP_TOOLS.CONTENT_RECS],
    priority: 2
  },

  // ODP Integration
  {
    pageId: 'optimizely-dxp-tools/odp/overview',
    tier: 1,
    section: 'optimizely-dxp-tools',
    subsection: 'odp',
    primaryAgents: [OPAL_AGENTS.INTEGRATION_HEALTH, OPAL_AGENTS.AUDIENCE_SUGGESTER],
    secondaryAgents: [OPAL_AGENTS.CUSTOMER_JOURNEY],
    requiredTools: [DXP_TOOLS.ODP],
    optionalTools: [DXP_TOOLS.CMP],
    priority: 1
  },

  // WebX Integration
  {
    pageId: 'optimizely-dxp-tools/webx/overview',
    tier: 1,
    section: 'optimizely-dxp-tools',
    subsection: 'webx',
    primaryAgents: [OPAL_AGENTS.INTEGRATION_HEALTH, OPAL_AGENTS.EXPERIMENT_BLUEPRINTER],
    secondaryAgents: [OPAL_AGENTS.GEO_AUDIT],
    requiredTools: [DXP_TOOLS.WEBX],
    optionalTools: [DXP_TOOLS.ODP],
    priority: 1
  },

  // CMP Integration
  {
    pageId: 'optimizely-dxp-tools/cmp/overview',
    tier: 1,
    section: 'optimizely-dxp-tools',
    subsection: 'cmp',
    primaryAgents: [OPAL_AGENTS.CMP_ORGANIZER, OPAL_AGENTS.INTEGRATION_HEALTH],
    secondaryAgents: [OPAL_AGENTS.STRATEGY_WORKFLOW],
    requiredTools: [DXP_TOOLS.CMP],
    optionalTools: [DXP_TOOLS.ODP, DXP_TOOLS.WEBX],
    priority: 1
  }
];

// =============================================================================
// Analytics Insights Mappings
// =============================================================================

const ANALYTICS_INSIGHTS_MAPPINGS: PageAgentMapping[] = [
  // OSA Insights
  {
    pageId: 'analytics-insights/osa/overview',
    tier: 1,
    section: 'analytics-insights',
    subsection: 'osa',
    primaryAgents: [OPAL_AGENTS.CONTENT_REVIEW, OPAL_AGENTS.STRATEGY_WORKFLOW],
    secondaryAgents: [OPAL_AGENTS.AUDIENCE_SUGGESTER],
    requiredTools: [DXP_TOOLS.CMP],
    optionalTools: [DXP_TOOLS.ODP, DXP_TOOLS.CONTENT_RECS, DXP_TOOLS.WEBX],
    priority: 1
  },

  // Content Insights
  {
    pageId: 'analytics-insights/content/overview',
    tier: 1,
    section: 'analytics-insights',
    subsection: 'content',
    primaryAgents: [OPAL_AGENTS.CONTENT_REVIEW],
    secondaryAgents: [OPAL_AGENTS.CONTENT_RECS_TOPIC_PERFORMANCE],
    requiredTools: [DXP_TOOLS.CONTENT_RECS, DXP_TOOLS.CMS],
    optionalTools: [DXP_TOOLS.ODP],
    priority: 1
  },
  {
    pageId: 'analytics-insights/content/performance-trends',
    tier: 2,
    section: 'analytics-insights',
    subsection: 'content',
    primaryAgents: [OPAL_AGENTS.CONTENT_REVIEW, OPAL_AGENTS.CONTENT_RECS_TOPIC_PERFORMANCE],
    secondaryAgents: [OPAL_AGENTS.AUDIENCE_SUGGESTER],
    requiredTools: [DXP_TOOLS.CONTENT_RECS],
    optionalTools: [DXP_TOOLS.CMS, DXP_TOOLS.ODP],
    priority: 2
  },

  // Audience Insights
  {
    pageId: 'analytics-insights/audiences/overview',
    tier: 1,
    section: 'analytics-insights',
    subsection: 'audiences',
    primaryAgents: [OPAL_AGENTS.AUDIENCE_SUGGESTER],
    secondaryAgents: [OPAL_AGENTS.CUSTOMER_JOURNEY, OPAL_AGENTS.PERSONALIZATION_IDEA_GENERATOR],
    requiredTools: [DXP_TOOLS.ODP],
    optionalTools: [DXP_TOOLS.CMP, DXP_TOOLS.WEBX],
    priority: 1
  },

  // Experimentation Insights
  {
    pageId: 'analytics-insights/experimentation/overview',
    tier: 1,
    section: 'analytics-insights',
    subsection: 'experimentation',
    primaryAgents: [OPAL_AGENTS.EXPERIMENT_BLUEPRINTER],
    secondaryAgents: [OPAL_AGENTS.GEO_AUDIT, OPAL_AGENTS.STRATEGY_WORKFLOW],
    requiredTools: [DXP_TOOLS.WEBX],
    optionalTools: [DXP_TOOLS.ODP, DXP_TOOLS.CMP],
    priority: 1
  }
];

// =============================================================================
// Experience Optimization Mappings
// =============================================================================

const EXPERIENCE_OPTIMIZATION_MAPPINGS: PageAgentMapping[] = [
  // Content Optimization
  {
    pageId: 'experience-optimization/content/overview',
    tier: 1,
    section: 'experience-optimization',
    subsection: 'content',
    primaryAgents: [OPAL_AGENTS.CONTENT_NEXT_BEST_TOPICS],
    secondaryAgents: [OPAL_AGENTS.CONTENT_REVIEW, OPAL_AGENTS.AUDIENCE_SUGGESTER],
    requiredTools: [DXP_TOOLS.CONTENT_RECS, DXP_TOOLS.CMS],
    optionalTools: [DXP_TOOLS.ODP],
    priority: 1
  },
  {
    pageId: 'experience-optimization/content/next-best-ideas',
    tier: 2,
    section: 'experience-optimization',
    subsection: 'content',
    primaryAgents: [OPAL_AGENTS.CONTENT_NEXT_BEST_TOPICS],
    secondaryAgents: [OPAL_AGENTS.PERSONALIZATION_IDEA_GENERATOR],
    requiredTools: [DXP_TOOLS.CONTENT_RECS],
    optionalTools: [DXP_TOOLS.CMS, DXP_TOOLS.ODP],
    priority: 1
  },

  // Personalization Optimization
  {
    pageId: 'experience-optimization/personalization/overview',
    tier: 1,
    section: 'experience-optimization',
    subsection: 'personalization',
    primaryAgents: [OPAL_AGENTS.PERSONALIZATION_IDEA_GENERATOR],
    secondaryAgents: [OPAL_AGENTS.AUDIENCE_SUGGESTER, OPAL_AGENTS.CUSTOMER_JOURNEY],
    requiredTools: [DXP_TOOLS.ODP],
    optionalTools: [DXP_TOOLS.WEBX, DXP_TOOLS.CMP],
    priority: 1
  },

  // Experimentation Optimization
  {
    pageId: 'experience-optimization/experimentation/overview',
    tier: 1,
    section: 'experience-optimization',
    subsection: 'experimentation',
    primaryAgents: [OPAL_AGENTS.EXPERIMENT_BLUEPRINTER],
    secondaryAgents: [OPAL_AGENTS.GEO_AUDIT, OPAL_AGENTS.PERSONALIZATION_IDEA_GENERATOR],
    requiredTools: [DXP_TOOLS.WEBX],
    optionalTools: [DXP_TOOLS.ODP, DXP_TOOLS.CONTENT_RECS],
    priority: 1
  },

  // UX Optimization
  {
    pageId: 'experience-optimization/ux/overview',
    tier: 1,
    section: 'experience-optimization',
    subsection: 'ux',
    primaryAgents: [OPAL_AGENTS.CUSTOMER_JOURNEY, OPAL_AGENTS.GEO_AUDIT],
    secondaryAgents: [OPAL_AGENTS.EXPERIMENT_BLUEPRINTER],
    requiredTools: [DXP_TOOLS.WEBX, DXP_TOOLS.ODP],
    optionalTools: [DXP_TOOLS.CMP],
    priority: 2
  },

  // Technology Optimization
  {
    pageId: 'experience-optimization/technology/overview',
    tier: 1,
    section: 'experience-optimization',
    subsection: 'technology',
    primaryAgents: [OPAL_AGENTS.INTEGRATION_HEALTH],
    secondaryAgents: [OPAL_AGENTS.STRATEGY_WORKFLOW],
    requiredTools: [DXP_TOOLS.CMP],
    optionalTools: [DXP_TOOLS.ODP, DXP_TOOLS.WEBX, DXP_TOOLS.CMS, DXP_TOOLS.CONTENT_RECS],
    priority: 3
  }
];

// =============================================================================
// Complete Mappings Export
// =============================================================================

export const ALL_PAGE_MAPPINGS: PageAgentMapping[] = [
  ...STRATEGY_PLANS_MAPPINGS,
  ...DXP_TOOLS_MAPPINGS,
  ...ANALYTICS_INSIGHTS_MAPPINGS,
  ...EXPERIENCE_OPTIMIZATION_MAPPINGS
];

// =============================================================================
// Helper Functions
// =============================================================================

export function getPageMapping(pageId: string): PageAgentMapping | null {
  return ALL_PAGE_MAPPINGS.find(mapping => mapping.pageId === pageId) || null;
}

export function getMappingsBySection(section: PageAgentMapping['section']): PageAgentMapping[] {
  return ALL_PAGE_MAPPINGS.filter(mapping => mapping.section === section);
}

export function getMappingsByTier(tier: 1 | 2 | 3): PageAgentMapping[] {
  return ALL_PAGE_MAPPINGS.filter(mapping => mapping.tier === tier);
}

export function getMappingsByPriority(priority: number): PageAgentMapping[] {
  return ALL_PAGE_MAPPINGS.filter(mapping => mapping.priority === priority);
}

export function getHighPriorityMappings(): PageAgentMapping[] {
  return ALL_PAGE_MAPPINGS.filter(mapping => mapping.priority === 1);
}

export function getAllPageIds(): string[] {
  return ALL_PAGE_MAPPINGS.map(mapping => mapping.pageId);
}

export function validatePageId(pageId: string): boolean {
  return ALL_PAGE_MAPPINGS.some(mapping => mapping.pageId === pageId);
}

// =============================================================================
// Statistics and Summary Functions
// =============================================================================

export function getMappingStats() {
  const sections = ['strategy-plans', 'optimizely-dxp-tools', 'analytics-insights', 'experience-optimization'] as const;
  const stats = {
    total: ALL_PAGE_MAPPINGS.length,
    bySection: {} as Record<string, number>,
    byTier: { 1: 0, 2: 0, 3: 0 },
    byPriority: {} as Record<number, number>
  };

  sections.forEach(section => {
    stats.bySection[section] = getMappingsBySection(section).length;
  });

  [1, 2, 3].forEach(tier => {
    stats.byTier[tier as 1 | 2 | 3] = getMappingsByTier(tier as 1 | 2 | 3).length;
  });

  ALL_PAGE_MAPPINGS.forEach(mapping => {
    stats.byPriority[mapping.priority] = (stats.byPriority[mapping.priority] || 0) + 1;
  });

  return stats;
}