/**
 * Page Title Utility Functions
 *
 * Generates hierarchical page titles in the format:
 * Page Title > Tier 1 > Tier 2 > Tier 3 > Opal Strategy Assistant
 */

import { opalMapping, urlToTier1Name, urlToTier2Name, getTier3ItemsForTier2 } from '@/data/opal-mapping';

interface PageTitleParams {
  pageTitle?: string;
  tier1?: string;
  tier2?: string;
  tier3?: string;
  section?: string;
  subsection?: string;
}

/**
 * Base title for all pages
 */
const BASE_TITLE = "Opal Strategy Assistant";

/**
 * Page title mappings for different sections
 */
export const PAGE_TITLE_MAPPINGS = {
  // Root pages
  '/': 'Home',
  '/how-it-works': 'How It Works',
  '/monitoring': 'System Monitoring',
  '/docs': 'Documentation',
  '/test-insights': 'Test Insights',
  '/test-health-component': 'Health Component Test',
  '/test-status-badge': 'Status Badge Test',
  '/test-retry-fetch': 'Retry Fetch Test',

  // Engine pages
  '/engine': 'Strategy Engine',
  '/engine/results': 'Results Overview',
  '/engine/phase2-dashboard': 'Phase 2 Dashboard',
  '/engine/phase3-dashboard': 'Phase 3 Dashboard',

  // Admin pages
  '/engine/admin': 'Administration',
  '/engine/admin/configurations': 'Configurations',
  '/engine/admin/configurations/settings': 'Settings',
  '/engine/admin/configurations/webhooks': 'Webhooks',
  '/engine/admin/configurations/opal-workflows': 'OPAL Workflows',
  '/engine/admin/configurations/data-integrations': 'Data Integrations',
  '/engine/admin/recommendation-engine': 'Recommendation Engine',
  '/engine/admin/recommendation-engine/ml-models': 'ML Models',
  '/engine/admin/recommendation-engine/content-recommendations': 'Content Recommendations',
  '/engine/admin/recommendation-engine/personalization-recommendations': 'Personalization Recommendations',
  '/engine/admin/recommendation-engine/optimization-recommendations': 'Optimization Recommendations',
  '/engine/admin/recommendation-engine/targeting-recommendations': 'Targeting Recommendations',
  '/engine/admin/recommendation-engine/audience-recommendations': 'Audience Recommendations',
  '/engine/admin/strategy-ai': 'Strategy AI',
  '/engine/admin/strategy-ai/influence-factors': 'Influence Factors',
  '/engine/admin/strategy-ai/roadmap-management': 'Roadmap Management',
  '/engine/admin/strategy-ai/maturity-scoring': 'Maturity Scoring',
  '/engine/admin/opal-monitoring': 'OPAL Monitoring',
  '/engine/admin/opal-monitoring/agent-data': 'Agent Data',
  '/engine/admin/opal-monitoring/webhook-events': 'Webhook Events',
  '/engine/admin/opal-monitoring/performance': 'Performance',
  '/engine/admin/opal-monitoring/system-logs': 'System Logs',
  '/engine/admin/opal-monitoring/testing-tools': 'Testing Tools',
  '/engine/admin/widgets': 'Widgets',
  '/engine/admin/data-mapping': 'Data Mapping',
  '/engine/admin/logs': 'System Logs',
  '/admin/opal-monitoring': 'OPAL Monitoring',
  '/admin/sub-agents': 'Sub-Agents',
  '/admin/opal-integration-test': 'OPAL Integration Test',
  '/admin/integration-dashboard': 'Integration Dashboard',

  // Results tier mappings (for static tier pages)
  '/engine/results/strategy': 'Strategy Plans',
  '/engine/results/insights': 'Analytics Insights',
  '/engine/results/optimization': 'Experience Optimization',
  '/engine/results/dxptools': 'DXP Tools',
} as const;

/**
 * Generate hierarchical page title
 */
export function generatePageTitle(params: PageTitleParams): string {
  const parts: string[] = [];

  // Add page title if provided
  if (params.pageTitle) {
    parts.push(params.pageTitle);
  }

  // Add tier hierarchy if provided
  if (params.tier1) {
    parts.push(params.tier1);
  }

  if (params.tier2) {
    parts.push(params.tier2);
  }

  if (params.tier3) {
    parts.push(params.tier3);
  }

  // Add section and subsection if provided
  if (params.section) {
    parts.push(params.section);
  }

  if (params.subsection) {
    parts.push(params.subsection);
  }

  // Always end with base title
  parts.push(BASE_TITLE);

  return parts.join(' > ');
}

/**
 * Generate title for Results pages with dynamic tiers
 */
export function generateResultsPageTitle(tier1Url?: string, tier2Url?: string, tier3Url?: string): string {
  if (!tier1Url) {
    return generatePageTitle({ pageTitle: 'Results Overview' });
  }

  const tier1Name = urlToTier1Name(tier1Url);

  if (!tier2Url) {
    return generatePageTitle({
      pageTitle: tier1Name,
      section: 'Results'
    });
  }

  const tier2Name = urlToTier2Name(tier1Name, tier2Url);

  if (!tier3Url) {
    return generatePageTitle({
      tier1: tier1Name,
      tier2: tier2Name,
      section: 'Results'
    });
  }

  // For tier3, we need to find the actual tier3 name from the mapping
  const tier3Items = getTier3ItemsForTier2(tier1Name, tier2Name);
  const tier3Name = tier3Items.find(item =>
    item.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').trim() === tier3Url
  ) || tier3Url;

  return generatePageTitle({
    pageTitle: tier3Name,
    tier1: tier1Name,
    tier2: tier2Name,
    section: 'Results'
  });
}

/**
 * Generate title for admin pages with dynamic segments
 */
export function generateAdminPageTitle(section: string, subsection?: string, pageTitle?: string): string {
  const sectionTitle = section.split('-').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');

  const subsectionTitle = subsection?.split('-').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');

  return generatePageTitle({
    pageTitle: pageTitle || subsectionTitle || sectionTitle,
    section: 'Administration',
    subsection: sectionTitle !== (pageTitle || subsectionTitle) ? sectionTitle : undefined
  });
}

/**
 * Generate title from URL path
 */
export function generateTitleFromPath(pathname: string): string {
  // Check for direct mapping first
  const directMapping = PAGE_TITLE_MAPPINGS[pathname as keyof typeof PAGE_TITLE_MAPPINGS];
  if (directMapping) {
    return generatePageTitle({ pageTitle: directMapping });
  }

  // Handle dynamic routes
  const segments = pathname.split('/').filter(Boolean);

  // Handle Results pages
  if (segments[0] === 'engine' && segments[1] === 'results') {
    return generateResultsPageTitle(segments[2], segments[3], segments[4]);
  }

  // Handle admin pages
  if (segments.includes('admin')) {
    const adminIndex = segments.indexOf('admin');
    const section = segments[adminIndex + 1];
    const subsection = segments[adminIndex + 2];
    const pageTitle = segments[segments.length - 1];

    return generateAdminPageTitle(section, subsection, pageTitle);
  }

  // Handle usecase pages
  if (segments[0] === 'engine' && segments[1] === 'usecase') {
    const usecaseId = segments[2];
    return generatePageTitle({
      pageTitle: `Use Case ${usecaseId}`,
      section: 'Strategy Engine'
    });
  }

  // Fallback: generate from path segments
  const pageTitle = segments[segments.length - 1]
    ?.split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') || 'Page';

  const section = segments.length > 1
    ? segments[segments.length - 2]
        ?.split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : undefined;

  return generatePageTitle({ pageTitle, section });
}

/**
 * Hook for client-side dynamic title updates
 */
export function updateDocumentTitle(title: string): void {
  if (typeof document !== 'undefined') {
    document.title = title;
  }
}

/**
 * Generate metadata object for Next.js pages
 */
export function generatePageMetadata(params: PageTitleParams & { description?: string }) {
  const title = generatePageTitle(params);

  return {
    title,
    description: params.description || `${params.pageTitle || 'Page'} - AI-powered strategy assistant for Optimizely DXP customers.`,
  };
}