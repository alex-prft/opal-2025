/**
 * Ask Assistant Section Mapping
 *
 * Maps URL paths and page contexts to Ask Assistant section keys.
 */

import { ResultsSectionKey } from './config';

/**
 * Maps tier1/tier2/tier3 combinations to Ask Assistant section keys
 */
export function getResultsSectionKey(
  tier1?: string,
  tier2?: string,
  tier3?: string,
  pathname?: string
): ResultsSectionKey | null {
  // Handle direct page routes first
  if (pathname) {
    if (pathname.includes('/results/strategy')) return 'strategy:osa';
    if (pathname.includes('/results/insights')) return 'analytics:content';
    if (pathname.includes('/results/optimization')) return 'experience:content';
    if (pathname.includes('/results/dxptools')) return 'dxp:content-recs';
  }

  // Handle tier-based routing
  if (!tier1) return null;

  const tier1Lower = tier1.toLowerCase();
  const tier2Lower = tier2?.toLowerCase();
  const tier3Lower = tier3?.toLowerCase();

  // Strategy section mappings
  if (tier1Lower === 'strategy' || tier1Lower === 'strategy-plans') {
    if (!tier2) return 'strategy:osa';

    switch (tier2Lower) {
      case 'osa':
      case 'overview':
        return 'strategy:osa';
      case 'maturity':
      case 'maturity-assessment':
        return 'strategy:maturity';
      case 'phases':
      case 'strategic-phases':
        return 'strategy:phases';
      case 'quick-wins':
      case 'quick-wins-analyzer':
        return 'strategy:quick-wins';
      case 'roadmap':
      case 'roadmap-generator':
        return 'strategy:roadmap';
      default:
        return 'strategy:osa';
    }
  }

  // Analytics/Insights section mappings
  if (tier1Lower === 'analytics' || tier1Lower === 'insights' || tier1Lower === 'analytics-insights') {
    if (!tier2) return 'analytics:osa';

    switch (tier2Lower) {
      case 'osa':
      case 'overview':
        return 'analytics:osa';
      case 'content':
        return 'analytics:content';
      case 'audiences':
        return 'analytics:audiences';
      case 'cx':
      case 'customer-experience':
        return 'analytics:cx';
      case 'experimentation':
        return 'analytics:experimentation';
      case 'personalization':
        return 'analytics:personalization';
      default:
        return 'analytics:osa';
    }
  }

  // Experience Optimization section mappings
  if (tier1Lower === 'experience' || tier1Lower === 'optimization' || tier1Lower === 'experience-optimization') {
    if (!tier2) return 'experience:content';

    switch (tier2Lower) {
      case 'content':
        if (!tier3) return 'experience:content';

        switch (tier3Lower) {
          case 'ai-for-seo':
          case 'ai-seo':
            return 'experience:content:ai-for-seo';
          case 'content-suggestions':
          case 'suggestions':
            return 'experience:content:content-suggestions';
          case 'content-optimization':
          case 'optimization':
            return 'experience:content:content-optimization';
          case 'roi':
          case 'content-roi':
            return 'experience:content:roi';
          default:
            return 'experience:content';
        }
      case 'personalization':
        return 'experience:personalization';
      case 'experimentation':
        return 'experience:experimentation';
      case 'ux':
      case 'user-experience':
        return 'experience:ux';
      case 'technology':
        return 'experience:technology';
      default:
        return 'experience:content';
    }
  }

  // DXP Tools section mappings
  if (tier1Lower === 'dxp' || tier1Lower === 'dxptools' || tier1Lower === 'dxp-tools') {
    if (!tier2) return 'dxp:content-recs';

    switch (tier2Lower) {
      case 'content-recs':
      case 'content-recommendations':
        return 'dxp:content-recs';
      case 'cms':
      case 'cmspaas':
        return 'dxp:cms';
      case 'odp':
      case 'data-platform':
        return 'dxp:odp';
      case 'webx':
      case 'experimentation':
        return 'dxp:webx';
      case 'cmp':
      case 'campaign-management':
        return 'dxp:cmp';
      default:
        return 'dxp:content-recs';
    }
  }

  // Fallback based on tier1 only
  switch (tier1Lower) {
    case 'strategy':
      return 'strategy:osa';
    case 'analytics':
    case 'insights':
      return 'analytics:content';
    case 'experience':
    case 'optimization':
      return 'experience:content';
    case 'dxp':
    case 'tools':
      return 'dxp:content-recs';
    default:
      return null;
  }
}

/**
 * Gets source path from current URL parameters
 */
export function getSourcePath(
  tier1?: string,
  tier2?: string,
  tier3?: string,
  pathname?: string
): string {
  if (pathname && pathname.startsWith('/engine/results/')) {
    return pathname;
  }

  let path = '/engine/results';

  if (tier1) {
    path += `/${tier1}`;
    if (tier2) {
      path += `/${tier2}`;
      if (tier3) {
        path += `/${tier3}`;
      }
    }
  }

  return path;
}

/**
 * Determines if Ask Assistant should be available based on current context
 */
export function shouldShowAskAssistant(
  sectionKey: ResultsSectionKey | null,
  pathname?: string
): boolean {
  // Don't show on the Ask Assistant page itself
  if (pathname?.includes('/ask-assistant')) {
    return false;
  }

  // Only show if we have a valid section key
  return sectionKey !== null;
}