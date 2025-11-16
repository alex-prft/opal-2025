/**
 * Language Rules Validation Utility
 *
 * Enforces consistent language patterns across all Results pages
 * and provides validation for content compliance
 */

import { LANGUAGE_RULES } from '@/types/results-content';

export interface LanguageViolation {
  type: 'forbidden' | 'discouraged' | 'suggestion';
  term: string;
  message: string;
  suggestion?: string;
}

export interface LanguageValidationResult {
  violations: LanguageViolation[];
  isValid: boolean;
  score: number; // 0-100, where 100 is perfect compliance
}

/**
 * Validates text content against established language rules
 */
export function validateContent(text: string): LanguageValidationResult {
  const violations: LanguageViolation[] = [];
  const lowerText = text.toLowerCase();

  // Check for forbidden terms (currency, revenue metrics)
  LANGUAGE_RULES.forbiddenMetrics.forEach(term => {
    if (lowerText.includes(term)) {
      violations.push({
        type: 'forbidden',
        term,
        message: `Contains forbidden metric term: "${term}"`,
        suggestion: 'Remove revenue/financial metrics from Results pages'
      });
    }
  });

  // Check for discouraged terms
  LANGUAGE_RULES.avoidedTerms.forEach(term => {
    if (lowerText.includes(term)) {
      violations.push({
        type: 'discouraged',
        term,
        message: `Contains discouraged term: "${term}"`,
        suggestion: 'Use more specific, measurable language'
      });
    }
  });

  // Check for preferred term opportunities
  Object.entries(LANGUAGE_RULES.preferredTerms).forEach(([avoid, prefer]) => {
    if (lowerText.includes(avoid)) {
      violations.push({
        type: 'suggestion',
        term: avoid,
        message: `Consider using "${prefer}" instead of "${avoid}"`,
        suggestion: `Replace "${avoid}" with "${prefer}"`
      });
    }
  });

  // Calculate compliance score
  const totalChecks = LANGUAGE_RULES.forbiddenMetrics.length +
                     LANGUAGE_RULES.avoidedTerms.length +
                     Object.keys(LANGUAGE_RULES.preferredTerms).length;
  const violationWeight = violations.reduce((weight, v) => {
    return weight + (v.type === 'forbidden' ? 3 : v.type === 'discouraged' ? 2 : 1);
  }, 0);
  const maxPossibleWeight = totalChecks * 3; // If everything was forbidden
  const score = Math.max(0, Math.round(((maxPossibleWeight - violationWeight) / maxPossibleWeight) * 100));

  return {
    violations,
    isValid: violations.filter(v => v.type === 'forbidden').length === 0,
    score
  };
}

/**
 * Sanitizes text by automatically replacing discouraged terms with preferred alternatives
 */
export function sanitizeContent(text: string): string {
  let sanitized = text;

  // Replace with preferred terms
  Object.entries(LANGUAGE_RULES.preferredTerms).forEach(([avoid, prefer]) => {
    const regex = new RegExp(`\\b${avoid}\\b`, 'gi');
    sanitized = sanitized.replace(regex, prefer);
  });

  return sanitized;
}

/**
 * Checks if content contains any forbidden terms that would block display
 */
export function hasForbiddenContent(text: string): boolean {
  const lowerText = text.toLowerCase();
  return LANGUAGE_RULES.forbiddenMetrics.some(term => lowerText.includes(term));
}

/**
 * Generates alternative suggestions for problematic content
 */
export function generateAlternatives(text: string): string[] {
  const alternatives: string[] = [];
  const lowerText = text.toLowerCase();

  // Generate alternatives for common problematic phrases
  if (lowerText.includes('revenue')) {
    alternatives.push('Replace revenue metrics with engagement or performance metrics');
    alternatives.push('Focus on user behavior and system performance instead');
  }

  if (lowerText.includes('roi') || lowerText.includes('return on investment')) {
    alternatives.push('Use "performance optimization" or "efficiency gains"');
    alternatives.push('Describe specific improvements rather than financial returns');
  }

  if (lowerText.includes('synergy')) {
    alternatives.push('Use "collaboration" or "integration" instead');
    alternatives.push('Describe specific working relationships');
  }

  if (lowerText.includes('leverage') && lowerText.includes(' leverage ')) {
    alternatives.push('Use "utilize", "apply", or "build on" instead');
    alternatives.push('Be more specific about how something is being used');
  }

  return alternatives;
}

/**
 * Validates section content for Results pages
 */
export function validateSectionContent(sections: {
  overview?: string[];
  insights?: string[];
  opportunities?: string[];
  nextSteps?: string[];
}): Record<string, LanguageValidationResult> {
  const results: Record<string, LanguageValidationResult> = {};

  Object.entries(sections).forEach(([sectionName, content]) => {
    if (content && content.length > 0) {
      const combinedText = content.join(' ');
      results[sectionName] = validateContent(combinedText);
    }
  });

  return results;
}

/**
 * Content quality checker for Results pages
 */
export interface ContentQualityResult {
  languageCompliance: LanguageValidationResult;
  structuralIssues: string[];
  recommendations: string[];
  overallScore: number;
}

export function assessContentQuality(content: {
  title: string;
  promise: string;
  overview: string[];
  insights: string[];
  opportunities: string[];
  nextSteps: string[];
}): ContentQualityResult {
  const allText = [
    content.title,
    content.promise,
    ...content.overview,
    ...content.insights,
    ...content.opportunities,
    ...content.nextSteps
  ].join(' ');

  const languageCompliance = validateContent(allText);
  const structuralIssues: string[] = [];
  const recommendations: string[] = [];

  // Check structural requirements
  if (content.overview.length === 0) {
    structuralIssues.push('Missing overview section');
  }

  if (content.insights.length === 0) {
    structuralIssues.push('Missing insights section');
  }

  if (content.opportunities.length === 0) {
    structuralIssues.push('Missing opportunities section');
  }

  if (content.nextSteps.length === 0) {
    structuralIssues.push('Missing next steps section');
  }

  // Generate recommendations
  if (content.overview.length > 6) {
    recommendations.push('Consider condensing overview to 2-4 key points');
  }

  if (content.nextSteps.length > 8) {
    recommendations.push('Limit next steps to 3-5 most important actions');
  }

  if (languageCompliance.violations.length > 0) {
    recommendations.push('Review language for compliance with style guidelines');
  }

  // Calculate overall score
  const structuralScore = Math.max(0, 100 - (structuralIssues.length * 25));
  const overallScore = Math.round((languageCompliance.score + structuralScore) / 2);

  return {
    languageCompliance,
    structuralIssues,
    recommendations,
    overallScore
  };
}

// =============================================================================
// Development Helpers
// =============================================================================

/**
 * Development mode content validator (shows warnings in console)
 */
export function debugContentValidation(content: any, componentName: string): void {
  if (process.env.NODE_ENV !== 'development') return;

  const allText = JSON.stringify(content);
  const validation = validateContent(allText);

  if (validation.violations.length > 0) {
    console.warn(`[${componentName}] Language Rule Violations:`, validation.violations);
  }

  if (validation.score < 80) {
    console.warn(`[${componentName}] Low language compliance score: ${validation.score}%`);
  }
}

/**
 * Formats violation messages for display
 */
export function formatViolationMessage(violation: LanguageViolation): string {
  switch (violation.type) {
    case 'forbidden':
      return `❌ ${violation.message}`;
    case 'discouraged':
      return `⚠️ ${violation.message}`;
    case 'suggestion':
      return `💡 ${violation.message}`;
    default:
      return violation.message;
  }
}

/**
 * Generates compliance report for content auditing
 */
export function generateComplianceReport(content: any[]): {
  totalContent: number;
  compliantContent: number;
  averageScore: number;
  topViolations: { term: string; count: number }[];
} {
  const validations = content.map(c => validateContent(JSON.stringify(c)));
  const compliantCount = validations.filter(v => v.isValid).length;
  const averageScore = validations.reduce((sum, v) => sum + v.score, 0) / validations.length;

  // Count violations by term
  const violationCounts: Record<string, number> = {};
  validations.forEach(v => {
    v.violations.forEach(violation => {
      violationCounts[violation.term] = (violationCounts[violation.term] || 0) + 1;
    });
  });

  const topViolations = Object.entries(violationCounts)
    .map(([term, count]) => ({ term, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalContent: content.length,
    compliantContent: compliantCount,
    averageScore: Math.round(averageScore),
    topViolations
  };
}