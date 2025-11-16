/**
 * Language Rules Enforcement Hook
 *
 * React hook for enforcing language rules across all UI copy in Results pages
 */

'use client';

import { useMemo, useCallback } from 'react';
import {
  validateContent,
  sanitizeContent,
  hasForbiddenContent,
  assessContentQuality,
  debugContentValidation,
  LanguageViolation,
  LanguageValidationResult,
  ContentQualityResult
} from '@/utils/language-rules';
import { ResultsPageContent } from '@/types/results-content';

export interface UseLanguageRulesOptions {
  enableAutoSanitization?: boolean;
  strictMode?: boolean; // Block rendering if forbidden content found
  debugMode?: boolean;  // Show console warnings in development
}

export interface LanguageRulesHookResult {
  // Validation functions
  validateText: (text: string) => LanguageValidationResult;
  validateContent: (content: Partial<ResultsPageContent>) => Record<string, LanguageValidationResult>;

  // Content processing
  sanitizeText: (text: string) => string;
  checkForbiddenContent: (text: string) => boolean;

  // Quality assessment
  assessQuality: (content: Partial<ResultsPageContent>) => ContentQualityResult;

  // UI helpers
  getViolationSeverity: (violation: LanguageViolation) => 'error' | 'warning' | 'info';
  formatViolationMessage: (violation: LanguageViolation) => string;
  shouldBlockRender: (content: any) => boolean;
}

/**
 * Hook for enforcing language rules in Results components
 */
export function useLanguageRules(
  componentName?: string,
  options: UseLanguageRulesOptions = {}
): LanguageRulesHookResult {

  const {
    enableAutoSanitization = false,
    strictMode = false,
    debugMode = process.env.NODE_ENV === 'development'
  } = options;

  // Memoized validation function
  const validateText = useCallback((text: string): LanguageValidationResult => {
    const result = validateContent(text);

    if (debugMode && componentName) {
      debugContentValidation({ text }, componentName);
    }

    return result;
  }, [debugMode, componentName]);

  // Validate entire Results content structure
  const validateResultsContent = useCallback((content: Partial<ResultsPageContent>) => {
    const sections: Record<string, LanguageValidationResult> = {};

    // Validate hero section
    if (content.hero) {
      const heroText = [
        content.hero.title || '',
        content.hero.promise || '',
        ...(content.hero.metrics?.map(m => `${m.label} ${m.value} ${m.hint || ''}`) || [])
      ].join(' ');
      sections.hero = validateText(heroText);
    }

    // Validate overview
    if (content.overview) {
      const overviewText = [
        content.overview.summary || '',
        ...(content.overview.keyPoints || [])
      ].join(' ');
      sections.overview = validateText(overviewText);
    }

    // Validate insights
    if (content.insights) {
      const insightsText = content.insights.flatMap(insight => [
        insight.title,
        insight.description,
        ...insight.bullets
      ]).join(' ');
      sections.insights = validateText(insightsText);
    }

    // Validate opportunities
    if (content.opportunities) {
      const opportunitiesText = content.opportunities.map(opp => opp.label).join(' ');
      sections.opportunities = validateText(opportunitiesText);
    }

    // Validate next steps
    if (content.nextSteps) {
      const nextStepsText = content.nextSteps.map(step =>
        `${step.label} ${step.ownerHint || ''} ${step.timeframeHint || ''}`
      ).join(' ');
      sections.nextSteps = validateText(nextStepsText);
    }

    return sections;
  }, [validateText]);

  // Sanitization function
  const sanitizeText = useCallback((text: string): string => {
    return enableAutoSanitization ? sanitizeContent(text) : text;
  }, [enableAutoSanitization]);

  // Check for forbidden content
  const checkForbiddenContent = useCallback((text: string): boolean => {
    return hasForbiddenContent(text);
  }, []);

  // Quality assessment
  const assessQuality = useCallback((content: Partial<ResultsPageContent>): ContentQualityResult => {
    const qualityContent = {
      title: content.hero?.title || '',
      promise: content.hero?.promise || '',
      overview: content.overview?.keyPoints || [],
      insights: content.insights?.flatMap(i => [i.title, i.description, ...i.bullets]) || [],
      opportunities: content.opportunities?.map(o => o.label) || [],
      nextSteps: content.nextSteps?.map(s => s.label) || []
    };

    return assessContentQuality(qualityContent);
  }, []);

  // Get violation severity for UI styling
  const getViolationSeverity = useCallback((violation: LanguageViolation): 'error' | 'warning' | 'info' => {
    switch (violation.type) {
      case 'forbidden': return 'error';
      case 'discouraged': return 'warning';
      case 'suggestion': return 'info';
      default: return 'info';
    }
  }, []);

  // Format violation messages for display
  const formatViolationMessage = useCallback((violation: LanguageViolation): string => {
    const icons = {
      forbidden: '❌',
      discouraged: '⚠️',
      suggestion: '💡'
    };

    const icon = icons[violation.type] || 'ℹ️';
    return `${icon} ${violation.message}`;
  }, []);

  // Determine if content should be blocked from rendering
  const shouldBlockRender = useCallback((content: any): boolean => {
    if (!strictMode) return false;

    const contentString = typeof content === 'string' ? content : JSON.stringify(content);
    return checkForbiddenContent(contentString);
  }, [strictMode, checkForbiddenContent]);

  return {
    validateText,
    validateContent: validateResultsContent,
    sanitizeText,
    checkForbiddenContent,
    assessQuality,
    getViolationSeverity,
    formatViolationMessage,
    shouldBlockRender
  };
}

/**
 * Specialized hook for Strategy content validation
 */
export function useStrategyLanguageRules() {
  const baseRules = useLanguageRules('StrategyWidget');

  const validateStrategyMetrics = useCallback((metrics: any[]) => {
    const strategyText = metrics.map(m => `${m.label} ${m.value}`).join(' ');

    // Strategy-specific validations
    const violations: LanguageViolation[] = [];

    // Ensure no revenue metrics in strategy
    if (strategyText.toLowerCase().includes('revenue')) {
      violations.push({
        type: 'forbidden',
        term: 'revenue',
        message: 'Strategy pages should focus on progress and confidence, not revenue',
        suggestion: 'Use "Progress", "Timeline Confidence", or "Plan Confidence Index"'
      });
    }

    return {
      ...baseRules.validateText(strategyText),
      violations: [...baseRules.validateText(strategyText).violations, ...violations]
    };
  }, [baseRules]);

  return {
    ...baseRules,
    validateStrategyMetrics
  };
}

/**
 * Specialized hook for Insights content validation
 */
export function useInsightsLanguageRules() {
  const baseRules = useLanguageRules('InsightsWidget');

  const validateInsightsSeparation = useCallback((content: {
    descriptive: string[];
    prescriptive: string[];
  }) => {
    const descriptiveText = content.descriptive.join(' ');
    const prescriptiveText = content.prescriptive.join(' ');

    const violations: LanguageViolation[] = [];

    // Check for action words in descriptive sections
    const actionWords = ['should', 'must', 'recommend', 'suggest', 'optimize'];
    actionWords.forEach(word => {
      if (descriptiveText.toLowerCase().includes(word)) {
        violations.push({
          type: 'discouraged',
          term: word,
          message: `Descriptive sections should avoid prescriptive language like "${word}"`,
          suggestion: 'Move recommendations to Opportunities or Next Steps sections'
        });
      }
    });

    // Check for descriptive words in prescriptive sections
    const descriptiveWords = ['shows', 'indicates', 'displays', 'reveals'];
    descriptiveWords.forEach(word => {
      if (prescriptiveText.toLowerCase().includes(word)) {
        violations.push({
          type: 'suggestion',
          term: word,
          message: `Prescriptive sections should focus on actions rather than observations like "${word}"`,
          suggestion: 'Use action-oriented language in Opportunities and Next Steps'
        });
      }
    });

    return {
      descriptive: {
        ...baseRules.validateText(descriptiveText),
        violations: [...baseRules.validateText(descriptiveText).violations, ...violations.filter(v => v.message.includes('Descriptive'))]
      },
      prescriptive: {
        ...baseRules.validateText(prescriptiveText),
        violations: [...baseRules.validateText(prescriptiveText).violations, ...violations.filter(v => v.message.includes('Prescriptive'))]
      }
    };
  }, [baseRules]);

  return {
    ...baseRules,
    validateInsightsSeparation
  };
}

/**
 * Specialized hook for Content ideas validation
 */
export function useContentLanguageRules() {
  const baseRules = useLanguageRules('ContentWidget');

  const validateContentIdeas = useCallback((ideas: any[]) => {
    const violations: LanguageViolation[] = [];

    ideas.forEach((idea, index) => {
      // Validate working titles are descriptive
      if (idea.workingTitle && idea.workingTitle.length < 10) {
        violations.push({
          type: 'suggestion',
          term: idea.workingTitle,
          message: `Content idea ${index + 1}: Working title should be more descriptive`,
          suggestion: 'Include topic and target audience in the title'
        });
      }

      // Validate summaries are substantial
      if (idea.summary && idea.summary.length < 50) {
        violations.push({
          type: 'discouraged',
          term: 'summary',
          message: `Content idea ${index + 1}: Summary should be 2-3 sentences`,
          suggestion: 'Expand summary to explain the content concept and value'
        });
      }
    });

    const allIdeasText = ideas.map(i => `${i.workingTitle} ${i.summary}`).join(' ');
    return {
      ...baseRules.validateText(allIdeasText),
      violations: [...baseRules.validateText(allIdeasText).violations, ...violations]
    };
  }, [baseRules]);

  return {
    ...baseRules,
    validateContentIdeas
  };
}

/**
 * Development helper hook for real-time validation display
 */
export function useLanguageRulesDebug(content: any, componentName: string) {
  const validation = useMemo(() => {
    if (process.env.NODE_ENV !== 'development') return null;

    const contentString = typeof content === 'string' ? content : JSON.stringify(content);
    return validateContent(contentString);
  }, [content]);

  // Log violations to console in development
  useMemo(() => {
    if (validation && validation.violations.length > 0) {
      console.group(`[${componentName}] Language Rule Violations`);
      validation.violations.forEach(violation => {
        const level = violation.type === 'forbidden' ? 'error' :
                     violation.type === 'discouraged' ? 'warn' : 'info';
        console[level](violation.message, violation.suggestion ? `Suggestion: ${violation.suggestion}` : '');
      });
      console.groupEnd();
    }
  }, [validation, componentName]);

  return validation;
}