/**
 * Conditional Rendering Logic for Tier-Level Content
 *
 * This module provides comprehensive URL path detection and conditional rendering
 * logic for tier-2 widget containers and tier-3 specific content areas.
 */

import { usePathname } from 'next/navigation';
import React, { useEffect, useState, useMemo } from 'react';
import {
  findTierMappingByUrl,
  extractTiersFromUrl,
  getWidgetsForTiers,
  getDataPropsForTiers,
  getContentFocusForTiers,
  normalizeUrlSegment,
  type TierMapping
} from '@/data/enhanced-opal-mapping';

export interface TierDetectionResult {
  tier1: string;
  tier2: string;
  tier3: string;
  tier1Display: string;
  tier2Display: string;
  tier3Display: string;
  fullPath: string;
  isValidTier: boolean;
  tierMapping?: TierMapping;
}

export interface ConditionalRenderingContext {
  detection: TierDetectionResult;
  widgets: {
    tier2Container: string;
    tier3Components: string[];
    layout: 'tabs' | 'grid' | 'accordion' | 'cards';
  };
  dataProps: Record<string, string>;
  contentFocus?: TierMapping['content_focus'];
  shouldRenderTier2: boolean;
  shouldRenderTier3: boolean;
}

/**
 * Enhanced URL Path Detection Hook
 */
export function useUrlPathDetection(externalPathname?: string): TierDetectionResult {
  // CRITICAL: React hook safety during Next.js static generation
  // During static generation, React can be null, so check before using hooks
  if (typeof window === 'undefined' && (!React || !(React as any).useState)) {
    // Return a safe fallback detection result during static generation to prevent build failures
    return {
      tier1: '',
      tier2: '',
      tier3: '',
      tier1Display: '',
      tier2Display: '',
      tier3Display: '',
      fullPath: externalPathname || '',
      isValidTier: false
    };
  }

  const internalPathname = usePathname();
  const pathname = externalPathname || internalPathname;
  const [detection, setDetection] = useState<TierDetectionResult>({
    tier1: '',
    tier2: '',
    tier3: '',
    tier1Display: '',
    tier2Display: '',
    tier3Display: '',
    fullPath: '',
    isValidTier: false
  });

  useEffect(() => {
    console.log('[useUrlPathDetection] Hook called with pathname:', pathname);
    if (!pathname) return;

    // Extract tier information from URL
    const tierInfo = extractTiersFromUrl(pathname);

    if (!tierInfo) {
      setDetection(prev => ({ ...prev, fullPath: pathname, isValidTier: false }));
      return;
    }

    // Find tier mapping for complete validation
    const tierMapping = findTierMappingByUrl(pathname);

    // Debug logging to identify the hook vs debug function difference
    if (pathname && pathname.includes('experience-optimization/content')) {
      console.log('[useUrlPathDetection] ====== HOOK DEBUG ======');
      console.log('[useUrlPathDetection] Pathname:', pathname);
      console.log('[useUrlPathDetection] tierInfo:', tierInfo);
      console.log('[useUrlPathDetection] Tier mapping found:', !!tierMapping);
      console.log('[useUrlPathDetection] Tier mapping object:', tierMapping?.widgets?.primary);
      console.log('[useUrlPathDetection] ================================');
    }

    // Convert URL segments to display names
    const tier1Display = convertUrlToDisplayName(tierInfo.tier1, 'tier1');
    const tier2Display = convertUrlToDisplayName(tierInfo.tier2, 'tier2');
    const tier3Display = convertUrlToDisplayName(tierInfo.tier3, 'tier3');

    setDetection({
      tier1: tierInfo.tier1,
      tier2: tierInfo.tier2,
      tier3: tierInfo.tier3,
      tier1Display,
      tier2Display,
      tier3Display,
      fullPath: pathname,
      isValidTier: !!tierMapping,
      tierMapping: tierMapping || undefined
    });
  }, [pathname]);

  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(() => detection, [
    detection.fullPath,
    detection.isValidTier,
    detection.tier1,
    detection.tier2,
    detection.tier3
  ]);
}

/**
 * Convert URL segment to display name
 */
function convertUrlToDisplayName(urlSegment: string, tierLevel: 'tier1' | 'tier2' | 'tier3'): string {
  if (!urlSegment) return '';

  // URL segment mappings for display names
  const tier1Mappings: Record<string, string> = {
    'strategy-plans': 'Strategy Plans',
    'strategy': 'Strategy Plans',
    'optimizely-dxp-tools': 'Optimizely DXP Tools',
    'dxptools': 'Optimizely DXP Tools',
    'analytics-insights': 'Analytics Insights',
    'insights': 'Analytics Insights',
    'experience-optimization': 'Experience Optimization',
    'optimization': 'Experience Optimization'
  };

  const tier2Mappings: Record<string, string> = {
    'osa': 'OSA',
    'quick-wins': 'Quick Wins',
    'maturity': 'Maturity',
    'phases': 'Phases',
    'roadmap': 'Roadmap',
    'content-recs': 'Content Recs',
    'cms': 'CMS',
    'odp': 'ODP',
    'webx': 'WEBX',
    'cmp': 'CMP',
    'content': 'Content',
    'audiences': 'Audiences',
    'cx': 'CX',
    'experimentation': 'Experimentation',
    'personalization': 'Personalization',
    'ux': 'UX',
    'technology': 'Technology'
  };

  // Convert common URL patterns to display names
  function formatDisplayName(segment: string): string {
    return segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .replace(/0 3 Months/g, '(0-3 months)')
      .replace(/3 6 Months/g, '(3-6 months)')
      .replace(/6 12 Months/g, '(6-12 months)')
      .replace(/12 Months/g, '(12+ months)')
      .replace(/Phase 1/g, 'Phase 1: Foundation')
      .replace(/Phase 2/g, 'Phase 2: Growth')
      .replace(/Phase 3/g, 'Phase 3: Optimization')
      .replace(/Phase 4/g, 'Phase 4: Innovation');
  }

  switch (tierLevel) {
    case 'tier1':
      return tier1Mappings[urlSegment.toLowerCase()] || formatDisplayName(urlSegment);
    case 'tier2':
      return tier2Mappings[urlSegment.toLowerCase()] || formatDisplayName(urlSegment);
    case 'tier3':
      return formatDisplayName(urlSegment);
    default:
      return formatDisplayName(urlSegment);
  }
}

/**
 * Conditional Rendering Context Hook
 */
export function useConditionalRenderingContext(pathname?: string): ConditionalRenderingContext {
  // CRITICAL: React hook safety during Next.js static generation
  // During static generation, React can be null, so check before using hooks
  if (typeof window === 'undefined' && (!React || !(React as any).useState)) {
    // Return a safe fallback context during static generation to prevent build failures
    return {
      detection: {
        tier1: '',
        tier2: '',
        tier3: '',
        tier1Display: '',
        tier2Display: '',
        tier3Display: '',
        fullPath: pathname || '',
        isValidTier: false
      },
      widgets: {
        tier2Container: '',
        tier3Components: [],
        layout: 'tabs'
      },
      dataProps: {},
      shouldRenderTier2: false,
      shouldRenderTier3: false
    };
  }

  console.log('[useConditionalRenderingContext] Hook called with pathname:', pathname);

  // Use synchronous path detection instead of problematic React hooks
  const rawDetection = pathname ? createSyncPathDetection(pathname) : useUrlPathDetection(pathname);

  // Memoize detection to prevent infinite re-renders
  const detection = useMemo(() => rawDetection, [
    rawDetection.fullPath,
    rawDetection.isValidTier,
    rawDetection.tier1,
    rawDetection.tier2,
    rawDetection.tier3
  ]);

  console.log('[useConditionalRenderingContext] Detection result:', detection);

  const [context, setContext] = useState<ConditionalRenderingContext>({
    detection,
    widgets: {
      tier2Container: '',
      tier3Components: [],
      layout: 'tabs'
    },
    dataProps: {},
    shouldRenderTier2: false,
    shouldRenderTier3: false
  });

  useEffect(() => {
    if (!detection.isValidTier) {
      setContext(prev => ({
        ...prev,
        detection,
        shouldRenderTier2: false,
        shouldRenderTier3: false
      }));
      return;
    }

    // Get widgets for the tier combination
    const widgets = getWidgetsForTiers(
      detection.tier1Display,
      detection.tier2Display,
      detection.tier3Display
    );

    // Get data props for the specific tier combination
    const dataProps = getDataPropsForTiers(
      detection.tier1Display,
      detection.tier2Display,
      detection.tier3Display
    );

    // Get content focus for customization
    const contentFocus = getContentFocusForTiers(
      detection.tier1Display,
      detection.tier2Display,
      detection.tier3Display
    );

    // Determine layout from tier mapping
    const layout = detection.tierMapping?.widgets.layout || 'tabs';

    setContext({
      detection,
      widgets: {
        tier2Container: widgets[0] || '',
        tier3Components: widgets.slice(1) || [],
        layout
      },
      dataProps,
      contentFocus: contentFocus || undefined,
      shouldRenderTier2: !!detection.tier2,
      shouldRenderTier3: !!detection.tier3
    });
  }, [
    detection.isValidTier,
    detection.tier1Display,
    detection.tier2Display,
    detection.tier3Display,
    detection.tierMapping
  ]);

  return context;
}

/**
 * Tier-2 Widget Container Renderer Logic
 */
export function getTier2WidgetComponent(path: string): string | null {
  // Strategy Plans tier-2 containers
  if (path.includes('/strategy-plans/phases') || path.includes('/strategy/phases')) {
    return 'PhasesWidget';
  }
  if (path.includes('/strategy-plans/osa') || path.includes('/strategy/osa')) {
    return 'OSAWidget';
  }
  if (path.includes('/strategy-plans/quick-wins') || path.includes('/strategy/quick-wins')) {
    return 'QuickWinsWidget';
  }
  if (path.includes('/strategy-plans/maturity') || path.includes('/strategy/maturity')) {
    return 'MaturityWidget';
  }
  if (path.includes('/strategy-plans/roadmap') || path.includes('/strategy/roadmap')) {
    return 'RoadmapWidget';
  }

  // Optimizely DXP Tools tier-2 containers
  if (path.includes('/optimizely-dxp-tools/content-recs') || path.includes('/dxptools/content-recs')) {
    return 'ContentRecsWidget';
  }
  if (path.includes('/optimizely-dxp-tools/cms') || path.includes('/dxptools/cms')) {
    return 'CMSWidget';
  }
  if (path.includes('/optimizely-dxp-tools/odp') || path.includes('/dxptools/odp')) {
    return 'ODPWidget';
  }
  if (path.includes('/optimizely-dxp-tools/webx') || path.includes('/dxptools/webx')) {
    return 'WEBXWidget';
  }
  if (path.includes('/optimizely-dxp-tools/cmp') || path.includes('/dxptools/cmp')) {
    return 'CMPWidget';
  }

  // Analytics Insights tier-2 containers
  if (path.includes('/analytics-insights/content') || path.includes('/insights/content')) {
    return 'ContentAnalyticsWidget';
  }
  if (path.includes('/analytics-insights/audiences') || path.includes('/insights/audiences')) {
    return 'AudienceAnalyticsWidget';
  }
  if (path.includes('/analytics-insights/cx') || path.includes('/insights/cx')) {
    return 'CXAnalyticsWidget';
  }

  // Experience Optimization tier-2 containers
  if (path.includes('/experience-optimization/experimentation') || path.includes('/optimization/experimentation')) {
    return 'ExperimentationFrameworkWidget';
  }
  if (path.includes('/experience-optimization/personalization') || path.includes('/optimization/personalization')) {
    return 'PersonalizationFrameworkWidget';
  }
  if (path.includes('/experience-optimization/ux') || path.includes('/optimization/ux')) {
    return 'UXOptimizationWidget';
  }

  return null;
}

/**
 * Tier-3 Content Renderer Logic
 */
export function getTier3ContentData(path: string): {
  contentId: string;
  title: string;
  dataKey: string;
} | null {
  // Strategy Plans → Phases tier-3 content
  if (path.includes('phase-1-foundation') || path.includes('/phase-1')) {
    return {
      contentId: 'phase-1-foundation-content',
      title: 'Phase 1: Foundation (0-3 months)',
      dataKey: 'phase1Data'
    };
  }
  if (path.includes('phase-2-growth') || path.includes('/phase-2')) {
    return {
      contentId: 'phase-2-growth-content',
      title: 'Phase 2: Growth (3-6 months)',
      dataKey: 'phase2Data'
    };
  }
  if (path.includes('phase-3-optimization') || path.includes('/phase-3')) {
    return {
      contentId: 'phase-3-optimization-content',
      title: 'Phase 3: Optimization (6-12 months)',
      dataKey: 'phase3Data'
    };
  }
  if (path.includes('phase-4-innovation') || path.includes('/phase-4')) {
    return {
      contentId: 'phase-4-innovation-content',
      title: 'Phase 4: Innovation (12+ months)',
      dataKey: 'phase4Data'
    };
  }
  if (path.includes('cross-phase-dependencies') || path.includes('/cross-phase')) {
    return {
      contentId: 'cross-phase-dependencies-content',
      title: 'Cross-Phase Dependencies',
      dataKey: 'crossPhaseDependencies'
    };
  }

  // Strategy Plans → OSA tier-3 content
  if (path.includes('overview-dashboard')) {
    return {
      contentId: 'osa-overview-dashboard-content',
      title: 'Overview Dashboard',
      dataKey: 'overviewMetrics'
    };
  }
  if (path.includes('strategic-recommendations')) {
    return {
      contentId: 'osa-strategic-recommendations-content',
      title: 'Strategic Recommendations',
      dataKey: 'strategicRecommendations'
    };
  }

  // DXP Tools → WEBX tier-3 content
  if (path.includes('active-experiments')) {
    return {
      contentId: 'webx-active-experiments-content',
      title: 'Active Experiments',
      dataKey: 'activeExperimentData'
    };
  }
  if (path.includes('statistical-significance')) {
    return {
      contentId: 'webx-statistical-significance-content',
      title: 'Statistical Significance',
      dataKey: 'statisticalSignificance'
    };
  }

  // Analytics Insights → Content tier-3 content
  if (path.includes('engagement')) {
    return {
      contentId: 'content-engagement-analysis-content',
      title: 'Engagement Analysis',
      dataKey: 'contentEngagementData'
    };
  }
  if (path.includes('topics')) {
    return {
      contentId: 'content-topics-analysis-content',
      title: 'Topics Analysis',
      dataKey: 'contentTopics'
    };
  }

  return null;
}

/**
 * Enhanced Conditional Renderer Component Logic
 */
export interface ConditionalRendererProps {
  children?: React.ReactNode;
  fallback?: React.ReactNode;
}

export function useConditionalRenderer(): {
  shouldRender: (condition: string | boolean) => boolean;
  getTier2Container: () => string | null;
  getTier3Content: () => { contentId: string; title: string; dataKey: string } | null;
  getActiveLayout: () => 'tabs' | 'grid' | 'accordion' | 'cards';
} {
  // CRITICAL: React hook safety during Next.js static generation
  // During static generation, React can be null, so check before using hooks
  if (typeof window === 'undefined') {
    // Return a safe fallback renderer during static generation to prevent build failures
    return {
      shouldRender: () => false,
      getTier2Container: () => null,
      getTier3Content: () => null,
      getActiveLayout: () => 'tabs'
    };
  }

  const context = useConditionalRenderingContext();

  return {
    shouldRender: (condition: string | boolean) => {
      if (typeof condition === 'boolean') return condition;
      return context.detection.fullPath.includes(condition);
    },

    getTier2Container: () => {
      return getTier2WidgetComponent(context.detection.fullPath);
    },

    getTier3Content: () => {
      return getTier3ContentData(context.detection.fullPath);
    },

    getActiveLayout: () => {
      return context.widgets.layout;
    }
  };
}

/**
 * Path Matching Utilities
 */
export const pathMatchers = {
  // Strategy Plans path matchers
  isStrategyPlans: (path: string) =>
    path.includes('/strategy-plans') || path.includes('/strategy'),

  isPhases: (path: string) =>
    path.includes('/phases'),

  isPhase1Foundation: (path: string) =>
    path.includes('phase-1-foundation') || path.includes('phase-1') || path.includes('foundation'),

  isPhase2Growth: (path: string) =>
    path.includes('phase-2-growth') || path.includes('phase-2') || path.includes('growth'),

  // DXP Tools path matchers
  isDXPTools: (path: string) =>
    path.includes('/optimizely-dxp-tools') || path.includes('/dxptools'),

  isWEBX: (path: string) =>
    path.includes('/webx'),

  isActiveExperiments: (path: string) =>
    path.includes('active-experiments'),

  // Analytics Insights path matchers
  isAnalyticsInsights: (path: string) =>
    path.includes('/analytics-insights') || path.includes('/insights'),

  isContent: (path: string) =>
    path.includes('/content'),

  isEngagement: (path: string) =>
    path.includes('engagement'),

  // Experience Optimization path matchers
  isExperienceOptimization: (path: string) =>
    path.includes('/experience-optimization') || path.includes('/optimization'),

  isExperimentation: (path: string) =>
    path.includes('/experimentation'),

  isPersonalization: (path: string) =>
    path.includes('/personalization'),

  // Content optimization specific paths
  isAIForSEO: (path: string) =>
    path.includes('/ai-for-seo'),

  isContentSuggestions: (path: string) =>
    path.includes('/content-optimization-recommendations'),

  isContentSuggestionsAlternate: (path: string) =>
    path.includes('/content-suggestions'),

  isContentGrowth: (path: string) =>
    path.includes('/content-roi-analysis')
};

/**
 * Synchronous path detection (bypassing React hook issues)
 */
function createSyncPathDetection(pathname: string): TierDetectionResult {
  if (!pathname) {
    return {
      tier1: '',
      tier2: '',
      tier3: '',
      tier1Display: '',
      tier2Display: '',
      tier3Display: '',
      fullPath: pathname,
      isValidTier: false
    };
  }

  // Extract tier information from URL (same as debug function)
  const tierInfo = extractTiersFromUrl(pathname);

  if (!tierInfo) {
    return {
      tier1: '',
      tier2: '',
      tier3: '',
      tier1Display: '',
      tier2Display: '',
      tier3Display: '',
      fullPath: pathname,
      isValidTier: false
    };
  }

  // Find tier mapping for complete validation
  const tierMapping = findTierMappingByUrl(pathname);

  // Convert URL segments to display names
  const tier1Display = convertUrlToDisplayName(tierInfo.tier1, 'tier1');
  const tier2Display = convertUrlToDisplayName(tierInfo.tier2, 'tier2');
  const tier3Display = convertUrlToDisplayName(tierInfo.tier3, 'tier3');

  return {
    tier1: tierInfo.tier1,
    tier2: tierInfo.tier2,
    tier3: tierInfo.tier3,
    tier1Display,
    tier2Display,
    tier3Display,
    fullPath: pathname,
    isValidTier: !!tierMapping,
    tierMapping: tierMapping || undefined
  };
}

/**
 * Debug utilities for development
 */
export function debugPathDetection(path?: string): void {
  const currentPath = path || (typeof window !== 'undefined' ? window.location.pathname : '');

  console.group('🔍 Path Detection Debug');
  console.log('Current Path:', currentPath);

  const tierInfo = extractTiersFromUrl(currentPath);
  console.log('Extracted Tiers:', tierInfo);

  const tierMapping = findTierMappingByUrl(currentPath);
  console.log('Tier Mapping Found:', !!tierMapping);

  if (tierMapping) {
    console.log('Primary Widget:', tierMapping.widgets.primary);
    console.log('Secondary Widgets:', tierMapping.widgets.secondary);
    console.log('Layout:', tierMapping.widgets.layout);
    console.log('Data Props:', tierMapping.data_props);
  }

  console.groupEnd();
}