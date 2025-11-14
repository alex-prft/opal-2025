/**
 * Enhanced OPAL Mapping with Tier-Level Keys
 *
 * This enhanced mapping integrates tier-level rendering rules with the existing OPAL mapping structure,
 * providing complete URL → Content mapping for precise widget rendering and data props.
 */

// Import the enhanced mapping data
import enhancedMappingData from './enhanced-opal-mapping.json';

// TypeScript interfaces for the enhanced mapping structure
export interface TierMapping {
  url_pattern: string;
  static_url: string;
  tier_level: {
    tier1: string;
    tier2: string;
    tier3: string;
  };
  widgets: {
    primary: string;
    secondary: string[];
    layout: 'tabs' | 'grid' | 'accordion' | 'cards';
  };
  data_props: Record<string, string>;
  content_focus: {
    title: string;
    description: string;
    key_metrics: string[];
    chart_types: string[];
  };
}

export interface Tier2Section {
  opal_instructions: string[];
  opal_agents: string[];
  opal_tools: string[];
  optimizely_dxp_tools: string[];
  navigation_structure: {
    tier1: string;
    tier2: string;
    tier3: string[];
  };
  tier_mapping: Record<string, TierMapping>;
}

export interface Tier1Category {
  [tier2Name: string]: Tier2Section;
}

export interface EnhancedOPALMapping {
  [tier1Name: string]: Tier1Category;
}

// Export the typed mapping data
export const enhancedOPALMapping: EnhancedOPALMapping = enhancedMappingData as EnhancedOPALMapping;

/**
 * URL Normalization Utilities
 */
export function normalizeUrlSegment(segment: string): string {
  return segment
    .toLowerCase()
    .replace(/[()]/g, '')  // Remove parentheses
    .replace(/\s+/g, '-')  // Replace spaces with hyphens
    .replace(/:/g, '')     // Remove colons
    .replace(/\+/g, '')    // Remove plus signs
    .trim();
}

export function normalizeTierName(name: string): string {
  return name
    .replace(/[()]/g, '')  // Remove parentheses
    .replace(/:/g, '')     // Remove colons
    .replace(/\+/g, '')    // Remove plus signs
    .trim();
}

/**
 * Core Lookup Functions
 */

/**
 * Find tier mapping by exact URL pattern
 */
export function findTierMappingByUrl(url: string): TierMapping | null {
  const normalizedUrl = url.toLowerCase().trim();

  for (const tier1Name in enhancedOPALMapping) {
    const tier1Category = enhancedOPALMapping[tier1Name];

    for (const tier2Name in tier1Category) {
      const tier2Section = tier1Category[tier2Name];

      for (const tier3Name in tier2Section.tier_mapping) {
        const tierMapping = tier2Section.tier_mapping[tier3Name];

        // Check exact URL pattern match
        if (normalizedUrl === tierMapping.url_pattern.toLowerCase() ||
            normalizedUrl === tierMapping.static_url.toLowerCase()) {
          return tierMapping;
        }

        // Check partial URL pattern match for dynamic routing
        if (normalizedUrl.includes('results') &&
            tierMapping.url_pattern.toLowerCase().includes(normalizedUrl.split('results')[1]?.toLowerCase() || '')) {
          return tierMapping;
        }
      }
    }
  }

  return null;
}

/**
 * Find tier mapping by tier combination
 */
export function findTierMappingByTiers(tier1: string, tier2: string, tier3: string): TierMapping | null {
  const normalizedTier1 = normalizeTierName(tier1);
  const normalizedTier2 = normalizeTierName(tier2);
  const normalizedTier3 = normalizeTierName(tier3);

  // Direct lookup
  const tier1Category = enhancedOPALMapping[normalizedTier1];
  if (!tier1Category) return null;

  const tier2Section = tier1Category[normalizedTier2];
  if (!tier2Section) return null;

  const tierMapping = tier2Section.tier_mapping[normalizedTier3];
  if (tierMapping) return tierMapping;

  // Fallback: find by partial match
  for (const tier3Key in tier2Section.tier_mapping) {
    const mapping = tier2Section.tier_mapping[tier3Key];
    if (mapping.tier_level.tier3.toLowerCase().includes(normalizedTier3.toLowerCase()) ||
        normalizedTier3.toLowerCase().includes(mapping.tier_level.tier3.toLowerCase())) {
      return mapping;
    }
  }

  return null;
}

/**
 * Extract tier information from URL
 */
export function extractTiersFromUrl(url: string): { tier1: string; tier2: string; tier3: string } | null {
  const segments = url.split('/').filter(Boolean);

  if (!segments.includes('results')) {
    return null;
  }

  const resultsIndex = segments.indexOf('results');

  return {
    tier1: segments[resultsIndex + 1] || '',
    tier2: segments[resultsIndex + 2] || '',
    tier3: segments[resultsIndex + 3] || ''
  };
}

/**
 * Get widgets for a specific tier combination
 */
export function getWidgetsForTiers(tier1: string, tier2: string, tier3?: string): string[] {
  if (tier3) {
    const tierMapping = findTierMappingByTiers(tier1, tier2, tier3);
    if (tierMapping) {
      return [tierMapping.widgets.primary, ...tierMapping.widgets.secondary];
    }
  }

  // Fallback to tier2 level
  const tier1Category = enhancedOPALMapping[tier1];
  if (!tier1Category) return [];

  const tier2Section = tier1Category[tier2];
  if (!tier2Section) return [];

  // Return widgets from first available tier3 mapping
  const firstTier3 = Object.keys(tier2Section.tier_mapping)[0];
  if (firstTier3) {
    const tierMapping = tier2Section.tier_mapping[firstTier3];
    return [tierMapping.widgets.primary, ...tierMapping.widgets.secondary];
  }

  return [];
}

/**
 * Get data props for a specific tier combination
 */
export function getDataPropsForTiers(tier1: string, tier2: string, tier3?: string): Record<string, string> {
  if (tier3) {
    const tierMapping = findTierMappingByTiers(tier1, tier2, tier3);
    if (tierMapping) {
      return tierMapping.data_props;
    }
  }

  // Return empty object if no specific mapping found
  return {};
}

/**
 * Get OPAL configuration for tier combination
 */
export function getOPALConfigForTiers(tier1: string, tier2: string): {
  agents: string[];
  tools: string[];
  instructions: string[];
  dxpTools: string[];
} | null {
  const tier1Category = enhancedOPALMapping[tier1];
  if (!tier1Category) return null;

  const tier2Section = tier1Category[tier2];
  if (!tier2Section) return null;

  return {
    agents: tier2Section.opal_agents,
    tools: tier2Section.opal_tools,
    instructions: tier2Section.opal_instructions,
    dxpTools: tier2Section.optimizely_dxp_tools
  };
}

/**
 * Get content focus for a specific tier combination
 */
export function getContentFocusForTiers(tier1: string, tier2: string, tier3?: string): TierMapping['content_focus'] | null {
  if (tier3) {
    const tierMapping = findTierMappingByTiers(tier1, tier2, tier3);
    if (tierMapping) {
      return tierMapping.content_focus;
    }
  }

  return null;
}

/**
 * Get all available tier3 options for a tier1/tier2 combination
 */
export function getTier3OptionsForTiers(tier1: string, tier2: string): string[] {
  const tier1Category = enhancedOPALMapping[tier1];
  if (!tier1Category) return [];

  const tier2Section = tier1Category[tier2];
  if (!tier2Section) return [];

  return tier2Section.navigation_structure.tier3;
}

/**
 * Validate if a tier combination exists in the enhanced mapping
 */
export function isValidTierCombination(tier1: string, tier2: string, tier3?: string): boolean {
  const tier1Category = enhancedOPALMapping[tier1];
  if (!tier1Category) return false;

  const tier2Section = tier1Category[tier2];
  if (!tier2Section) return false;

  if (tier3) {
    return Object.keys(tier2Section.tier_mapping).includes(tier3) ||
           tier2Section.navigation_structure.tier3.includes(tier3);
  }

  return true;
}

/**
 * Get layout preference for tier combination
 */
export function getLayoutForTiers(tier1: string, tier2: string, tier3?: string): 'tabs' | 'grid' | 'accordion' | 'cards' {
  if (tier3) {
    const tierMapping = findTierMappingByTiers(tier1, tier2, tier3);
    if (tierMapping) {
      return tierMapping.widgets.layout;
    }
  }

  // Default layout
  return 'tabs';
}

/**
 * Generate URL pattern for tier combination
 */
export function generateUrlPatternForTiers(tier1: string, tier2: string, tier3?: string): string {
  const normalizedTier1 = normalizeUrlSegment(tier1);
  const normalizedTier2 = normalizeUrlSegment(tier2);

  if (tier3) {
    const normalizedTier3 = normalizeUrlSegment(tier3);
    return `/engine/results/${normalizedTier1}/${normalizedTier2}/${normalizedTier3}`;
  }

  return `/engine/results/${normalizedTier1}/${normalizedTier2}`;
}

/**
 * Get all tier1 categories
 */
export function getAllTier1Categories(): string[] {
  return Object.keys(enhancedOPALMapping);
}

/**
 * Get all tier2 sections for a tier1 category
 */
export function getTier2SectionsForTier1(tier1: string): string[] {
  const tier1Category = enhancedOPALMapping[tier1];
  if (!tier1Category) return [];

  return Object.keys(tier1Category);
}

/**
 * Search for tier mappings by keyword
 */
export function searchTierMappingsByKeyword(keyword: string): TierMapping[] {
  const results: TierMapping[] = [];
  const normalizedKeyword = keyword.toLowerCase();

  for (const tier1Name in enhancedOPALMapping) {
    const tier1Category = enhancedOPALMapping[tier1Name];

    for (const tier2Name in tier1Category) {
      const tier2Section = tier1Category[tier2Name];

      for (const tier3Name in tier2Section.tier_mapping) {
        const tierMapping = tier2Section.tier_mapping[tier3Name];

        // Search in title, description, and key metrics
        if (tierMapping.content_focus.title.toLowerCase().includes(normalizedKeyword) ||
            tierMapping.content_focus.description.toLowerCase().includes(normalizedKeyword) ||
            tierMapping.content_focus.key_metrics.some(metric =>
              metric.toLowerCase().includes(normalizedKeyword)
            )) {
          results.push(tierMapping);
        }
      }
    }
  }

  return results;
}

// Export for backwards compatibility with existing code
export { enhancedOPALMapping as opalMapping };