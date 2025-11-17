/**
 * Content Loader Helper
 *
 * Centralizes the loading of generated ResultPageContent for Results pages.
 * This helper ensures consistent access to AI-generated content across all
 * Results components.
 */

import { ResultPageContent, createEmptyResultPageContent } from '../schemas/ResultPage';

// =============================================================================
// Content Loading Functions
// =============================================================================

/**
 * Load generated content for a specific Results page
 * Falls back to empty content if the generated file doesn't exist
 */
export async function getResultPageContent(pageId: string): Promise<ResultPageContent> {
  try {
    // Convert pageId to file path
    const filePath = pageIdToFilePath(pageId);

    // Dynamically import the generated content
    const contentModule = await import(`../generated/${filePath}`);

    // Validate the imported content
    if (contentModule.default && isValidResultPageContent(contentModule.default)) {
      return contentModule.default;
    }

    console.warn(`[ContentLoader] Invalid content structure for ${pageId}`);
    return createFallbackContent(pageId);

  } catch (error) {
    console.warn(`[ContentLoader] Failed to load content for ${pageId}:`, error);
    return createFallbackContent(pageId);
  }
}

/**
 * Load multiple Results page contents in parallel
 */
export async function getMultipleResultPageContents(
  pageIds: string[]
): Promise<Record<string, ResultPageContent>> {
  const results = await Promise.allSettled(
    pageIds.map(async (pageId) => ({
      pageId,
      content: await getResultPageContent(pageId)
    }))
  );

  const contentMap: Record<string, ResultPageContent> = {};

  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      contentMap[result.value.pageId] = result.value.content;
    }
  });

  return contentMap;
}

/**
 * Check if generated content exists for a page
 */
export async function hasGeneratedContent(pageId: string): Promise<boolean> {
  try {
    const filePath = pageIdToFilePath(pageId);
    await import(`../generated/${filePath}`);
    return true;
  } catch {
    return false;
  }
}

// =============================================================================
// Path Conversion Functions
// =============================================================================

/**
 * Convert pageId to relative file path for generated content
 * Example: "strategy-plans/osa/overview-dashboard" -> "strategy-plans/osa/overview-dashboard.ts"
 */
function pageIdToFilePath(pageId: string): string {
  // Ensure the pageId has proper structure
  const normalizedPageId = pageId.replace(/^\/+|\/+$/g, ''); // Remove leading/trailing slashes
  return `${normalizedPageId}.ts`;
}

/**
 * Convert file path back to pageId
 */
export function filePathToPageId(filePath: string): string {
  return filePath.replace(/\.ts$/, '');
}

// =============================================================================
// Content Validation
// =============================================================================

function isValidResultPageContent(content: any): content is ResultPageContent {
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
      ['Overview', 'Insights', 'Opportunities', 'Next Steps'].includes(section.label) &&
      typeof section.bodyMarkdown === 'string'
    ) &&
    content.dataLineage &&
    Array.isArray(content.dataLineage.sourceAgents) &&
    Array.isArray(content.dataLineage.sourceTools) &&
    typeof content.dataLineage.confidenceScore === 'number'
  );
}

// =============================================================================
// Fallback Content Generation
// =============================================================================

/**
 * Create fallback content when generated content is not available
 */
function createFallbackContent(pageId: string): ResultPageContent {
  const tier = inferTierFromPageId(pageId);
  const section = inferSectionFromPageId(pageId);

  const baseContent = createEmptyResultPageContent(pageId, tier);

  // Add section-specific fallback content
  baseContent.hero.title = `${formatPageTitle(pageId)} - Loading`;
  baseContent.hero.subTitle = 'Content is being generated and will be available shortly';
  baseContent.hero.keyNumbers = [
    { label: 'Status', value: 'Generating', hint: 'Content generation in progress' },
    { label: 'Confidence', value: '0%', hint: 'Building confidence as data flows in' },
    { label: 'Last Updated', value: 'Never', hint: 'First-time content generation' }
  ];

  // Add basic section content
  baseContent.sections = [
    {
      id: 'overview',
      label: 'Overview',
      bodyMarkdown: `# ${formatPageTitle(pageId)} Overview\n\nContent generation is in progress. This page will be automatically updated as relevant data becomes available from OPAL agents and DXP tools.\n\n*Please check back in a few minutes for generated insights and recommendations.*`,
      priority: 1,
      confidenceScore: 0
    },
    {
      id: 'insights',
      label: 'Insights',
      bodyMarkdown: '## Data Collection in Progress\n\nInsights will be generated based on:\n\n- OPAL agent analysis\n- DXP tools integration data\n- Performance metrics and trends\n\nThis section will be populated automatically once sufficient data is available.',
      priority: 2,
      confidenceScore: 0
    },
    {
      id: 'opportunities',
      label: 'Opportunities',
      bodyMarkdown: '## Opportunities Being Identified\n\nOptimization opportunities will be identified through:\n\n- Performance pattern analysis\n- Content gap identification\n- Audience engagement optimization\n- Technical integration improvements\n\nRecommendations will appear here as analysis completes.',
      priority: 3,
      confidenceScore: 0
    },
    {
      id: 'next-steps',
      label: 'Next Steps',
      bodyMarkdown: '## Implementation Guidance Coming Soon\n\nActionable next steps will be provided including:\n\n- Priority-ordered recommendations\n- Implementation timelines\n- Resource requirements\n- Success metrics\n\nCheck back for detailed implementation guidance.',
      priority: 4,
      confidenceScore: 0
    }
  ];

  baseContent.dataLineage.lastUpdatedBy = 'results-content-optimizer';
  baseContent.dataLineage.lastUpdatedAt = new Date().toISOString();
  baseContent.dataLineage.confidenceScore = 0;

  return baseContent;
}

// =============================================================================
// Helper Functions
// =============================================================================

function inferTierFromPageId(pageId: string): 1 | 2 | 3 {
  // Tier 1: Main overview pages
  if (pageId.includes('/overview') || pageId.endsWith('dashboard')) {
    return 1;
  }

  // Tier 3: Highly specific pages
  if (pageId.includes('performance') || pageId.includes('advanced') || pageId.includes('detailed')) {
    return 3;
  }

  // Tier 2: Most other pages
  return 2;
}

function inferSectionFromPageId(pageId: string): 'strategy-plans' | 'optimizely-dxp-tools' | 'analytics-insights' | 'experience-optimization' {
  if (pageId.includes('strategy-plans')) return 'strategy-plans';
  if (pageId.includes('optimizely-dxp-tools')) return 'optimizely-dxp-tools';
  if (pageId.includes('analytics-insights')) return 'analytics-insights';
  if (pageId.includes('experience-optimization')) return 'experience-optimization';
  return 'strategy-plans'; // Default fallback
}

function formatPageTitle(pageId: string): string {
  const parts = pageId.split('/');
  const lastPart = parts[parts.length - 1];

  // Convert kebab-case to Title Case
  return lastPart
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// =============================================================================
// Cache Management
// =============================================================================

const contentCache = new Map<string, { content: ResultPageContent; timestamp: number }>();
const CACHE_TTL = 300000; // 5 minutes

/**
 * Get cached content if still fresh
 */
export function getCachedContent(pageId: string): ResultPageContent | null {
  const cached = contentCache.get(pageId);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.content;
  }
  return null;
}

/**
 * Cache content for faster subsequent access
 */
export function setCachedContent(pageId: string, content: ResultPageContent): void {
  contentCache.set(pageId, {
    content,
    timestamp: Date.now()
  });
}

/**
 * Clear cached content (useful when content is regenerated)
 */
export function clearCachedContent(pageId?: string): void {
  if (pageId) {
    contentCache.delete(pageId);
  } else {
    contentCache.clear();
  }
}

// =============================================================================
// Export Main Functions
// =============================================================================

export {
  getResultPageContent,
  getMultipleResultPageContents,
  hasGeneratedContent,
  filePathToPageId
};