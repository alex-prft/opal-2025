/**
 * Results Page Content Schema
 *
 * Defines the standardized content structure used by the results-content-optimizer
 * agent to generate consistent Results pages across all sections:
 * - Strategy Plans
 * - Optimizely DXP Tools
 * - Analytics Insights
 * - Experience Optimization
 */

// =============================================================================
// Core Results Page Types
// =============================================================================

export interface ResultPageHero {
  title: string;
  subTitle: string;
  keyNumbers: ResultPageKeyNumber[];
}

export interface ResultPageKeyNumber {
  label: string;
  value: string;
  hint?: string;          // Optional tooltip or explanation
  trend?: 'up' | 'down' | 'stable';
  confidenceLevel?: 'low' | 'medium' | 'high';
}

export interface ResultPageSection {
  id: string;
  label: 'Overview' | 'Insights' | 'Opportunities' | 'Next Steps';
  bodyMarkdown: string;
  priority?: number;      // Sort order within page
  confidenceScore?: number; // 0-100 confidence in this section's content
}

export interface ResultPageDataLineage {
  sourceAgents: string[];           // e.g. ["strategy_workflow", "content_review"]
  sourceTools: string[];            // e.g. ["content_recs", "cms", "odp"]
  lastUpdatedBy: 'results-content-optimizer' | 'human';
  lastUpdatedAt: string;           // ISO timestamp
  confidenceScore: number;         // 0-100 overall confidence
  opalInstructionsVersion?: string; // Version of OPAL instructions used
  backupPath?: string;             // Path to backup version if available
}

export interface ResultPageContent {
  pageId: string;                  // e.g. "strategy-plans/osa/overview-dashboard"
  tier: 1 | 2 | 3;                // Tier level for caching and priority
  hero: ResultPageHero;
  sections: ResultPageSection[];
  dataLineage: ResultPageDataLineage;

  // Optional metadata
  meta?: {
    personas?: string[];           // Relevant personas for this page
    maturityPhase?: 'crawl' | 'walk' | 'run' | 'fly';
    lastReviewDate?: string;       // When content was last reviewed
    contentFlags?: string[];       // Any special flags or warnings
  };
}

// =============================================================================
// Results Section-Specific Types
// =============================================================================

export type ResultsSectionType =
  | 'strategy-plans'
  | 'optimizely-dxp-tools'
  | 'analytics-insights'
  | 'experience-optimization';

export interface ResultPageContentWithSection extends ResultPageContent {
  section: ResultsSectionType;
  subsection?: string;             // e.g. "osa", "quick-wins", "content-recs"
}

// =============================================================================
// OPAL Integration Types
// =============================================================================

export interface OpalAgentOutput {
  agentId: string;
  output: any;
  confidence: number;
  timestamp: string;
  version?: string;
}

export interface OpalInstructions {
  personas: OpalPersona[];
  tone: OpalToneGuidelines;
  kpis: OpalKPI[];
  maturityRubric: OpalMaturityRubric;
  version: string;
  lastUpdated: string;
}

export interface OpalPersona {
  id: string;
  name: string;
  description: string;
  isPrimary: boolean;
  characteristics: string[];
}

export interface OpalToneGuidelines {
  preferredTerms: Record<string, string>;  // e.g. "effect" -> "impact"
  avoidedTerms: string[];                  // Terms to avoid
  forbiddenMetrics: string[];              // Revenue, ROI, etc.
  voiceDescription: string;
}

export interface OpalKPI {
  id: string;
  name: string;
  description: string;
  category: string;
  isRevenueBased: boolean;  // Flag to prevent revenue metrics in Results
}

export interface OpalMaturityRubric {
  crawl: OpalMaturityPhase;
  walk: OpalMaturityPhase;
  run: OpalMaturityPhase;
  fly: OpalMaturityPhase;
}

export interface OpalMaturityPhase {
  name: string;
  description: string;
  capabilities: string[];
  timeframe: string;
  kpiFocus: string[];
}

// =============================================================================
// DXP Tool Integration Types
// =============================================================================

export interface DXPToolData {
  toolName: 'content_recs' | 'cms' | 'odp' | 'webx' | 'cmp';
  data: any;
  lastUpdated: string;
  confidence: number;
}

export interface ContentRecsData extends DXPToolData {
  toolName: 'content_recs';
  data: {
    topics: ContentRecsTopic[];
    recommendations: ContentRecsRecommendation[];
    performance: ContentRecsPerformance;
  };
}

export interface ContentRecsTopic {
  id: string;
  label: string;
  performance: number;
  interactions: number;
  uniques: number;
}

export interface ContentRecsRecommendation {
  id: string;
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
}

export interface ContentRecsPerformance {
  totalInteractions: number;
  totalUniques: number;
  topPerformingTopics: string[];
  trends: Record<string, number>;
}

// =============================================================================
// Content Generation Context
// =============================================================================

export interface ContentGenerationContext {
  pageId: string;
  tier: 1 | 2 | 3;
  section: ResultsSectionType;
  existingContent?: ResultPageContent;
  opalInstructions: OpalInstructions;
  agentOutputs: OpalAgentOutput[];
  dxpData: DXPToolData[];
  generationMode: 'preview' | 'apply';
  confidenceThreshold: number;  // Minimum confidence to apply changes
}

// =============================================================================
// Validation and Safety Types
// =============================================================================

export interface ContentValidationResult {
  isValid: boolean;
  confidence: number;
  warnings: string[];
  errors: string[];
  suggestions: string[];
}

export interface SafetyCheck {
  checkName: string;
  passed: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ContentBackup {
  pageId: string;
  backupPath: string;
  originalContent: ResultPageContent;
  timestamp: string;
  reason: string;
}

// =============================================================================
// Helper Types and Utilities
// =============================================================================

export type ResultPageSectionLabel = ResultPageSection['label'];

export const SECTION_LABELS: ResultPageSection['label'][] = [
  'Overview',
  'Insights',
  'Opportunities',
  'Next Steps'
];

export const RESULTS_SECTIONS: ResultsSectionType[] = [
  'strategy-plans',
  'optimizely-dxp-tools',
  'analytics-insights',
  'experience-optimization'
];

// =============================================================================
// Type Guards and Validation Functions
// =============================================================================

export function isValidResultPageContent(content: any): content is ResultPageContent {
  return (
    content &&
    typeof content.pageId === 'string' &&
    typeof content.tier === 'number' &&
    [1, 2, 3].includes(content.tier) &&
    content.hero &&
    typeof content.hero.title === 'string' &&
    typeof content.hero.subTitle === 'string' &&
    Array.isArray(content.hero.keyNumbers) &&
    Array.isArray(content.sections) &&
    content.sections.every((section: any) =>
      section &&
      typeof section.id === 'string' &&
      SECTION_LABELS.includes(section.label) &&
      typeof section.bodyMarkdown === 'string'
    ) &&
    content.dataLineage &&
    Array.isArray(content.dataLineage.sourceAgents) &&
    Array.isArray(content.dataLineage.sourceTools) &&
    typeof content.dataLineage.confidenceScore === 'number'
  );
}

export function createEmptyResultPageContent(
  pageId: string,
  tier: 1 | 2 | 3
): ResultPageContent {
  return {
    pageId,
    tier,
    hero: {
      title: '',
      subTitle: '',
      keyNumbers: []
    },
    sections: SECTION_LABELS.map((label, index) => ({
      id: `section-${index}`,
      label,
      bodyMarkdown: '',
      priority: index + 1,
      confidenceScore: 0
    })),
    dataLineage: {
      sourceAgents: [],
      sourceTools: [],
      lastUpdatedBy: 'results-content-optimizer',
      lastUpdatedAt: new Date().toISOString(),
      confidenceScore: 0
    }
  };
}

// =============================================================================
// Export All Types
// =============================================================================

export type {
  // Core types
  ResultPageHero,
  ResultPageKeyNumber,
  ResultPageSection,
  ResultPageDataLineage,
  ResultPageContent,
  ResultPageContentWithSection,

  // OPAL types
  OpalAgentOutput,
  OpalInstructions,
  OpalPersona,
  OpalToneGuidelines,
  OpalKPI,
  OpalMaturityRubric,
  OpalMaturityPhase,

  // DXP types
  DXPToolData,
  ContentRecsData,
  ContentRecsTopic,
  ContentRecsRecommendation,
  ContentRecsPerformance,

  // Generation types
  ContentGenerationContext,
  ContentValidationResult,
  SafetyCheck,
  ContentBackup
};