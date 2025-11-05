/**
 * Capability Checker Utility
 * Determines if a business has specific capabilities based on their input data
 */

import { PMGWorkflowInput } from '@/lib/types/maturity';

export interface CapabilityCheck {
  hasExperimentation: boolean;
  hasPersonalization: boolean;
  hasAdvancedAnalytics: boolean;
  hasAutomation: boolean;
  hasDataPlatform: boolean;
}

// Keywords that indicate experimentation capabilities
const EXPERIMENTATION_KEYWORDS = [
  'a/b testing',
  'ab testing',
  'experimentation',
  'experiment',
  'multivariate testing',
  'split testing',
  'conversion testing',
  'optimizely experimentation',
  'optimizely web experimentation',
  'google optimize',
  'adobe target',
  'visual website optimizer',
  'unbounce',
  'leadpages testing',
  'testing platform'
];

// Keywords that indicate personalization capabilities
const PERSONALIZATION_KEYWORDS = [
  'personalization',
  'personalisation',
  'dynamic content',
  'content targeting',
  'audience targeting',
  'behavioral targeting',
  'optimizely personalization',
  'adobe target personalization',
  'dynamic yield',
  'evergage',
  'monetate'
];

// Keywords that indicate advanced analytics capabilities
const ANALYTICS_KEYWORDS = [
  'google analytics',
  'adobe analytics',
  'segment',
  'amplitude',
  'mixpanel',
  'hotjar',
  'fullstory',
  'analytics',
  'data analytics',
  'web analytics',
  'user analytics'
];

// Keywords that indicate automation capabilities
const AUTOMATION_KEYWORDS = [
  'marketing automation',
  'automation',
  'automated',
  'workflow automation',
  'email automation',
  'hubspot',
  'marketo',
  'pardot',
  'mailchimp',
  'constant contact'
];

// Keywords that indicate data platform capabilities
const DATA_PLATFORM_KEYWORDS = [
  'cdp',
  'customer data platform',
  'data platform',
  'optimizely data platform',
  'adobe real-time cdp',
  'segment cdp',
  'salesforce cdp',
  'treasure data',
  'tealium'
];

/**
 * Checks if a business has specific capabilities based on their PMG workflow input
 */
export function checkBusinessCapabilities(input: PMGWorkflowInput): CapabilityCheck {
  // Combine all relevant fields for capability checking
  const allCapabilities = [
    ...input.current_capabilities,
    ...input.additional_marketing_technology
  ].map(cap => cap.toLowerCase());

  const capabilityString = allCapabilities.join(' ');

  return {
    hasExperimentation: hasCapability(capabilityString, EXPERIMENTATION_KEYWORDS),
    hasPersonalization: hasCapability(capabilityString, PERSONALIZATION_KEYWORDS),
    hasAdvancedAnalytics: hasCapability(capabilityString, ANALYTICS_KEYWORDS),
    hasAutomation: hasCapability(capabilityString, AUTOMATION_KEYWORDS),
    hasDataPlatform: hasCapability(capabilityString, DATA_PLATFORM_KEYWORDS)
  };
}

/**
 * Helper function to check if any keywords match the capability string
 */
function hasCapability(capabilityString: string, keywords: string[]): boolean {
  return keywords.some(keyword => capabilityString.includes(keyword));
}

/**
 * Gets capability-aware recommendations based on business capabilities
 */
export function getFilteredRecommendations(
  input: PMGWorkflowInput,
  allRecommendations: any[]
): any[] {
  const capabilities = checkBusinessCapabilities(input);

  return allRecommendations.filter(recommendation => {
    // If recommendation requires experimentation but business doesn't have it, filter out
    if (recommendation.requiresExperimentation && !capabilities.hasExperimentation) {
      return false;
    }

    // If recommendation requires personalization but business doesn't have it, filter out
    if (recommendation.requiresPersonalization && !capabilities.hasPersonalization) {
      return false;
    }

    // If recommendation requires advanced analytics but business doesn't have it, filter out
    if (recommendation.requiresAdvancedAnalytics && !capabilities.hasAdvancedAnalytics) {
      return false;
    }

    return true;
  });
}

/**
 * Creates capability-aware use case experiments
 */
export function getFilteredExperiments(
  input: PMGWorkflowInput,
  allExperiments: any[]
): any[] {
  const capabilities = checkBusinessCapabilities(input);

  if (!capabilities.hasExperimentation) {
    // Return empty experiments array or alternative content-focused strategies
    return [];
  }

  return allExperiments;
}

/**
 * Creates capability-aware personalization strategies
 */
export function getFilteredPersonalizationStrategies(
  input: PMGWorkflowInput,
  allStrategies: any[]
): any[] {
  const capabilities = checkBusinessCapabilities(input);

  if (!capabilities.hasPersonalization) {
    // Filter out advanced personalization strategies, keep basic ones
    return allStrategies.filter(strategy =>
      strategy.complexity === 'basic' || strategy.type === 'content-only'
    );
  }

  return allStrategies;
}

/**
 * Gets capability status summary for display
 */
export function getCapabilitySummary(input: PMGWorkflowInput): {
  capabilities: CapabilityCheck;
  recommendations: string[];
  warnings: string[];
} {
  const capabilities = checkBusinessCapabilities(input);
  const recommendations: string[] = [];
  const warnings: string[] = [];

  if (!capabilities.hasExperimentation) {
    warnings.push('No experimentation platform detected. A/B testing and experiment recommendations will be limited.');
    recommendations.push('Consider implementing an experimentation platform like Optimizely, Google Optimize, or Adobe Target to unlock testing capabilities.');
  }

  if (!capabilities.hasPersonalization) {
    warnings.push('No personalization platform detected. Advanced personalization strategies will be limited.');
    recommendations.push('Consider implementing a personalization platform to enable dynamic content delivery.');
  }

  if (!capabilities.hasAdvancedAnalytics) {
    warnings.push('Limited analytics capabilities detected. Advanced measurement and optimization may be constrained.');
    recommendations.push('Consider upgrading analytics capabilities for better measurement and insights.');
  }

  return {
    capabilities,
    recommendations,
    warnings
  };
}