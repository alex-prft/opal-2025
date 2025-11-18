/**
 * Content Uniqueness Validation System
 *
 * This module ensures that Results pages display unique, context-appropriate content
 * rather than generic or duplicate responses. It validates content across pages to
 * maintain user engagement and prevent the "everything looks the same" problem
 * that can occur with AI-generated content.
 *
 * @version 1.0
 * @created 2024-11-18
 * @scope Phase 3: OPAL agents and pipeline fixes - Content uniqueness focus
 */

import type {
  ResultsPageContent,
  ConfidenceLevel,
  LanguageValidation
} from '@/types/resultsContent';

// =============================================================================
// UNIQUENESS VALIDATION INTERFACES
// =============================================================================

export interface ContentUniquenessReport {
  overall_uniqueness_score: number; // 0-100, 100 being completely unique
  validation_timestamp: string;
  pages_analyzed: number;
  uniqueness_details: {
    hero_uniqueness: HeroUniquenessAnalysis;
    insights_uniqueness: InsightsUniquenessAnalysis;
    opportunities_uniqueness: OpportunitiesUniquenessAnalysis;
    next_steps_uniqueness: NextStepsUniquenessAnalysis;
  };
  duplicate_content_detected: DuplicateContentIssue[];
  generic_content_detected: GenericContentIssue[];
  recommendations: UniquenessRecommendation[];
  content_fingerprints: ContentFingerprint[];
}

export interface HeroUniquenessAnalysis {
  uniqueness_score: number;
  title_uniqueness: number; // How unique are the titles across pages
  promise_uniqueness: number; // How unique are the value propositions
  metrics_uniqueness: number; // How unique are the metrics shown
  duplicate_titles: string[];
  generic_promises: string[];
  repeated_metric_patterns: MetricPattern[];
}

export interface InsightsUniquenessAnalysis {
  uniqueness_score: number;
  insight_titles_uniqueness: number;
  insight_content_uniqueness: number;
  duplicate_insights: DuplicateInsight[];
  generic_insight_patterns: GenericPattern[];
  cross_page_repetition: CrossPageRepetition[];
}

export interface OpportunitiesUniquenessAnalysis {
  uniqueness_score: number;
  opportunity_labels_uniqueness: number;
  opportunity_descriptions_uniqueness: number;
  impact_level_distribution: ImpactLevelDistribution;
  effort_level_distribution: EffortLevelDistribution;
  duplicate_opportunities: DuplicateOpportunity[];
  generic_opportunity_patterns: GenericPattern[];
}

export interface NextStepsUniquenessAnalysis {
  uniqueness_score: number;
  step_labels_uniqueness: number;
  step_descriptions_uniqueness: number;
  owner_hint_distribution: OwnerHintDistribution;
  timeframe_distribution: TimeframeDistribution;
  duplicate_steps: DuplicateNextStep[];
  generic_step_patterns: GenericPattern[];
}

export interface DuplicateContentIssue {
  issue_id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  content_type: 'hero_title' | 'insight_title' | 'opportunity_label' | 'next_step_label' | 'full_section';
  duplicate_content: string;
  affected_pages: string[];
  similarity_score: number; // 0-1, 1 being identical
  first_detected: string;
  suggested_resolution: string;
}

export interface GenericContentIssue {
  issue_id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  content_type: 'hero_promise' | 'insight_description' | 'opportunity_description' | 'next_step_description';
  generic_content: string;
  affected_pages: string[];
  genericity_indicators: string[]; // What makes this content generic
  suggested_improvements: string[];
}

export interface UniquenessRecommendation {
  recommendation_id: string;
  priority: 'immediate' | 'high' | 'medium' | 'low';
  category: 'eliminate_duplicates' | 'reduce_genericity' | 'enhance_context_awareness' | 'improve_personalization';
  title: string;
  description: string;
  expected_improvement: string;
  implementation_steps: string[];
  affected_pages: string[];
}

export interface ContentFingerprint {
  page_route: string;
  content_hash: string;
  semantic_markers: string[]; // Key phrases that make this content unique
  contextual_elements: string[]; // Page-specific context indicators
  generic_elements: string[]; // Elements that appear generic
  uniqueness_score: number;
  generated_at: string;
}

export interface MetricPattern {
  pattern: string;
  occurrences: number;
  pages: string[];
  is_generic: boolean;
}

export interface DuplicateInsight {
  insight_title: string;
  insight_description: string;
  pages: string[];
  similarity_score: number;
}

export interface GenericPattern {
  pattern_text: string;
  pattern_type: 'template_language' | 'vague_qualifiers' | 'generic_recommendations' | 'boilerplate_text';
  occurrences: number;
  pages: string[];
  specificity_score: number; // 0-1, lower is more generic
}

export interface CrossPageRepetition {
  repeated_content: string;
  content_type: 'insight_title' | 'insight_bullet' | 'full_insight';
  pages: string[];
  repetition_score: number;
}

export interface ImpactLevelDistribution {
  high: number;
  medium: number;
  low: number;
  pages_analyzed: number;
  distribution_score: number; // How varied the distribution is
}

export interface EffortLevelDistribution {
  low: number;
  medium: number;
  high: number;
  pages_analyzed: number;
  distribution_score: number;
}

export interface OwnerHintDistribution {
  [key: string]: number; // owner hint -> count
  most_common: string;
  distribution_score: number;
}

export interface TimeframeDistribution {
  [key: string]: number; // timeframe -> count
  most_common: string;
  distribution_score: number;
}

export interface DuplicateOpportunity {
  opportunity_label: string;
  opportunity_description?: string;
  pages: string[];
  similarity_score: number;
}

export interface DuplicateNextStep {
  step_label: string;
  step_description?: string;
  pages: string[];
  similarity_score: number;
}

// =============================================================================
// CONTENT UNIQUENESS VALIDATION SERVICE
// =============================================================================

class ContentUniquenessValidationService {
  private readonly SIMILARITY_THRESHOLD = 0.85; // 85% similarity considered duplicate
  private readonly GENERIC_THRESHOLD = 0.3; // Below 30% specificity considered generic
  private readonly MIN_UNIQUENESS_SCORE = 70; // Minimum acceptable uniqueness score

  private readonly GENERIC_INDICATORS = [
    'optimize your',
    'improve your',
    'enhance your',
    'based on data',
    'data-driven',
    'actionable insights',
    'best practices',
    'industry standards',
    'recommended approach',
    'strategic approach',
    'comprehensive analysis',
    'detailed review',
    'thorough examination'
  ];

  private readonly VAGUE_QUALIFIERS = [
    'somewhat',
    'pretty good',
    'kind of',
    'sort of',
    'fairly',
    'quite',
    'rather',
    'very good',
    'highly effective',
    'significantly improve'
  ];

  private contentCache: Map<string, ResultsPageContent> = new Map();

  /**
   * Validates content uniqueness across multiple Results pages
   */
  async validateContentUniqueness(
    contentMap: Map<string, ResultsPageContent>
  ): Promise<ContentUniquenessReport> {
    this.contentCache = contentMap;
    const pages = Array.from(contentMap.keys());
    const contents = Array.from(contentMap.values());

    try {
      // Analyze uniqueness across different content sections
      const [
        heroAnalysis,
        insightsAnalysis,
        opportunitiesAnalysis,
        nextStepsAnalysis
      ] = await Promise.all([
        this.analyzeHeroUniqueness(contentMap),
        this.analyzeInsightsUniqueness(contentMap),
        this.analyzeOpportunitiesUniqueness(contentMap),
        this.analyzeNextStepsUniqueness(contentMap)
      ]);

      // Detect duplicate and generic content issues
      const duplicateIssues = await this.detectDuplicateContent(contentMap);
      const genericIssues = await this.detectGenericContent(contentMap);

      // Generate content fingerprints
      const fingerprints = this.generateContentFingerprints(contentMap);

      // Calculate overall uniqueness score
      const sectionScores = [
        heroAnalysis.uniqueness_score,
        insightsAnalysis.uniqueness_score,
        opportunitiesAnalysis.uniqueness_score,
        nextStepsAnalysis.uniqueness_score
      ];
      const overallScore = Math.round(sectionScores.reduce((sum, score) => sum + score, 0) / sectionScores.length);

      // Generate recommendations
      const recommendations = this.generateUniquenessRecommendations(
        duplicateIssues,
        genericIssues,
        overallScore
      );

      return {
        overall_uniqueness_score: overallScore,
        validation_timestamp: new Date().toISOString(),
        pages_analyzed: pages.length,
        uniqueness_details: {
          hero_uniqueness: heroAnalysis,
          insights_uniqueness: insightsAnalysis,
          opportunities_uniqueness: opportunitiesAnalysis,
          next_steps_uniqueness: nextStepsAnalysis
        },
        duplicate_content_detected: duplicateIssues,
        generic_content_detected: genericIssues,
        recommendations,
        content_fingerprints: fingerprints
      };

    } catch (error) {
      return this.createFailedValidationReport(
        error instanceof Error ? error.message : 'Validation failed',
        pages.length
      );
    }
  }

  /**
   * Analyzes uniqueness of hero sections across pages
   */
  private async analyzeHeroUniqueness(
    contentMap: Map<string, ResultsPageContent>
  ): Promise<HeroUniquenessAnalysis> {
    const heroes = Array.from(contentMap.entries()).map(([route, content]) => ({
      route,
      hero: content.hero
    }));

    // Analyze title uniqueness
    const titles = heroes.map(h => h.hero.title);
    const titleUniqueness = this.calculateTextUniqueness(titles);
    const duplicateTitles = this.findDuplicateTexts(titles, this.SIMILARITY_THRESHOLD);

    // Analyze promise uniqueness
    const promises = heroes.map(h => h.hero.promise);
    const promiseUniqueness = this.calculateTextUniqueness(promises);
    const genericPromises = this.findGenericTexts(promises);

    // Analyze metrics uniqueness
    const metricsPatterns = this.analyzeMetricsPatterns(heroes);
    const metricsUniqueness = this.calculateMetricsUniqueness(metricsPatterns);

    const overallUniqueness = Math.round((titleUniqueness + promiseUniqueness + metricsUniqueness) / 3);

    return {
      uniqueness_score: overallUniqueness,
      title_uniqueness: titleUniqueness,
      promise_uniqueness: promiseUniqueness,
      metrics_uniqueness: metricsUniqueness,
      duplicate_titles: duplicateTitles,
      generic_promises: genericPromises,
      repeated_metric_patterns: metricsPatterns.filter(p => p.is_generic)
    };
  }

  /**
   * Analyzes uniqueness of insights sections across pages
   */
  private async analyzeInsightsUniqueness(
    contentMap: Map<string, ResultsPageContent>
  ): Promise<InsightsUniquenessAnalysis> {
    const allInsights = Array.from(contentMap.entries()).flatMap(([route, content]) =>
      content.insights.map(insight => ({ ...insight, route }))
    );

    // Analyze insight title uniqueness
    const insightTitles = allInsights.map(i => i.title);
    const titleUniqueness = this.calculateTextUniqueness(insightTitles);

    // Analyze insight content uniqueness
    const insightDescriptions = allInsights.map(i => i.description);
    const contentUniqueness = this.calculateTextUniqueness(insightDescriptions);

    // Find duplicate insights
    const duplicateInsights = this.findDuplicateInsights(allInsights);

    // Find generic patterns
    const genericPatterns = this.findGenericInsightPatterns(allInsights);

    // Find cross-page repetitions
    const crossPageRepetitions = this.findCrossPageRepetitions(allInsights);

    const overallUniqueness = Math.round((titleUniqueness + contentUniqueness) / 2);

    return {
      uniqueness_score: overallUniqueness,
      insight_titles_uniqueness: titleUniqueness,
      insight_content_uniqueness: contentUniqueness,
      duplicate_insights: duplicateInsights,
      generic_insight_patterns: genericPatterns,
      cross_page_repetition: crossPageRepetitions
    };
  }

  /**
   * Analyzes uniqueness of opportunities sections across pages
   */
  private async analyzeOpportunitiesUniqueness(
    contentMap: Map<string, ResultsPageContent>
  ): Promise<OpportunitiesUniquenessAnalysis> {
    const allOpportunities = Array.from(contentMap.entries()).flatMap(([route, content]) =>
      content.opportunities.map(opp => ({ ...opp, route }))
    );

    // Analyze opportunity label uniqueness
    const opportunityLabels = allOpportunities.map(o => o.label);
    const labelUniqueness = this.calculateTextUniqueness(opportunityLabels);

    // Note: opportunities don't have descriptions in the interface, so we'll analyze distributions
    const impactDistribution = this.analyzeImpactLevelDistribution(allOpportunities);
    const effortDistribution = this.analyzeEffortLevelDistribution(allOpportunities);

    // Find duplicate opportunities
    const duplicateOpportunities = this.findDuplicateOpportunities(allOpportunities);

    // Find generic patterns
    const genericPatterns = this.findGenericOpportunityPatterns(allOpportunities);

    const overallUniqueness = Math.round(labelUniqueness);

    return {
      uniqueness_score: overallUniqueness,
      opportunity_labels_uniqueness: labelUniqueness,
      opportunity_descriptions_uniqueness: 100, // No descriptions in current interface
      impact_level_distribution: impactDistribution,
      effort_level_distribution: effortDistribution,
      duplicate_opportunities: duplicateOpportunities,
      generic_opportunity_patterns: genericPatterns
    };
  }

  /**
   * Analyzes uniqueness of next steps sections across pages
   */
  private async analyzeNextStepsUniqueness(
    contentMap: Map<string, ResultsPageContent>
  ): Promise<NextStepsUniquenessAnalysis> {
    const allNextSteps = Array.from(contentMap.entries()).flatMap(([route, content]) =>
      content.nextSteps.map(step => ({ ...step, route }))
    );

    // Analyze step label uniqueness
    const stepLabels = allNextSteps.map(s => s.title);
    const labelUniqueness = this.calculateTextUniqueness(stepLabels);

    // Analyze step description uniqueness
    const stepDescriptions = allNextSteps.map(s => s.description);
    const descriptionUniqueness = this.calculateTextUniqueness(stepDescriptions);

    // Analyze distributions
    const ownerDistribution = this.analyzeOwnerHintDistribution(allNextSteps);
    const timeframeDistribution = this.analyzeTimeframeDistribution(allNextSteps);

    // Find duplicates and generic patterns
    const duplicateSteps = this.findDuplicateNextSteps(allNextSteps);
    const genericPatterns = this.findGenericNextStepPatterns(allNextSteps);

    const overallUniqueness = Math.round((labelUniqueness + descriptionUniqueness) / 2);

    return {
      uniqueness_score: overallUniqueness,
      step_labels_uniqueness: labelUniqueness,
      step_descriptions_uniqueness: descriptionUniqueness,
      owner_hint_distribution: ownerDistribution,
      timeframe_distribution: timeframeDistribution,
      duplicate_steps: duplicateSteps,
      generic_step_patterns: genericPatterns
    };
  }

  /**
   * Detects duplicate content across pages
   */
  private async detectDuplicateContent(
    contentMap: Map<string, ResultsPageContent>
  ): Promise<DuplicateContentIssue[]> {
    const issues: DuplicateContentIssue[] = [];
    const pages = Array.from(contentMap.keys());

    // Check for duplicate hero titles
    const heroTitles = new Map<string, string[]>();
    contentMap.forEach((content, route) => {
      const title = content.hero.title.toLowerCase().trim();
      if (!heroTitles.has(title)) {
        heroTitles.set(title, []);
      }
      heroTitles.get(title)!.push(route);
    });

    heroTitles.forEach((routes, title) => {
      if (routes.length > 1) {
        issues.push({
          issue_id: `duplicate-hero-title-${Date.now()}-${Math.random()}`,
          severity: 'high',
          content_type: 'hero_title',
          duplicate_content: title,
          affected_pages: routes,
          similarity_score: 1.0,
          first_detected: new Date().toISOString(),
          suggested_resolution: 'Create unique, context-specific titles for each Results page'
        });
      }
    });

    // Check for duplicate insight titles
    const insightTitles = new Map<string, string[]>();
    contentMap.forEach((content, route) => {
      content.insights.forEach(insight => {
        const title = insight.title.toLowerCase().trim();
        if (!insightTitles.has(title)) {
          insightTitles.set(title, []);
        }
        insightTitles.get(title)!.push(route);
      });
    });

    insightTitles.forEach((routes, title) => {
      if (routes.length > 1) {
        issues.push({
          issue_id: `duplicate-insight-title-${Date.now()}-${Math.random()}`,
          severity: 'medium',
          content_type: 'insight_title',
          duplicate_content: title,
          affected_pages: routes,
          similarity_score: 1.0,
          first_detected: new Date().toISOString(),
          suggested_resolution: 'Differentiate insight titles based on page context and data source'
        });
      }
    });

    // Check for duplicate opportunity labels
    const opportunityLabels = new Map<string, string[]>();
    contentMap.forEach((content, route) => {
      content.opportunities.forEach(opportunity => {
        const label = opportunity.label.toLowerCase().trim();
        if (!opportunityLabels.has(label)) {
          opportunityLabels.set(label, []);
        }
        opportunityLabels.get(label)!.push(route);
      });
    });

    opportunityLabels.forEach((routes, label) => {
      if (routes.length > 1) {
        issues.push({
          issue_id: `duplicate-opportunity-label-${Date.now()}-${Math.random()}`,
          severity: 'medium',
          content_type: 'opportunity_label',
          duplicate_content: label,
          affected_pages: routes,
          similarity_score: 1.0,
          first_detected: new Date().toISOString(),
          suggested_resolution: 'Create page-specific opportunities based on actual data analysis'
        });
      }
    });

    return issues;
  }

  /**
   * Detects generic content that lacks specificity
   */
  private async detectGenericContent(
    contentMap: Map<string, ResultsPageContent>
  ): Promise<GenericContentIssue[]> {
    const issues: GenericContentIssue[] = [];

    contentMap.forEach((content, route) => {
      // Check hero promises for genericity
      const promise = content.hero.promise;
      const promiseGenericityIndicators = this.GENERIC_INDICATORS.filter(indicator =>
        promise.toLowerCase().includes(indicator)
      );

      if (promiseGenericityIndicators.length > 2) {
        issues.push({
          issue_id: `generic-hero-promise-${Date.now()}-${Math.random()}`,
          severity: 'medium',
          content_type: 'hero_promise',
          generic_content: promise,
          affected_pages: [route],
          genericity_indicators: promiseGenericityIndicators,
          suggested_improvements: [
            'Include specific metrics or data points',
            'Reference actual page context and DXP tool',
            'Mention specific user segment or use case',
            'Include actionable, concrete outcomes'
          ]
        });
      }

      // Check insight descriptions for genericity
      content.insights.forEach(insight => {
        const description = insight.description;
        const vagueQualifiers = this.VAGUE_QUALIFIERS.filter(qualifier =>
          description.toLowerCase().includes(qualifier)
        );
        const genericIndicators = this.GENERIC_INDICATORS.filter(indicator =>
          description.toLowerCase().includes(indicator)
        );

        if (vagueQualifiers.length > 1 || genericIndicators.length > 1) {
          issues.push({
            issue_id: `generic-insight-description-${Date.now()}-${Math.random()}`,
            severity: 'low',
            content_type: 'insight_description',
            generic_content: description,
            affected_pages: [route],
            genericity_indicators: [...vagueQualifiers, ...genericIndicators],
            suggested_improvements: [
              'Replace vague qualifiers with specific data',
              'Include concrete metrics and percentages',
              'Reference specific Content Recommendations data',
              'Provide actionable, context-specific observations'
            ]
          });
        }
      });

      // Check next step descriptions for genericity
      content.nextSteps.forEach(step => {
        const description = step.description;
        const genericIndicators = this.GENERIC_INDICATORS.filter(indicator =>
          description.toLowerCase().includes(indicator)
        );

        if (genericIndicators.length > 2) {
          issues.push({
            issue_id: `generic-next-step-description-${Date.now()}-${Math.random()}`,
            severity: 'low',
            content_type: 'next_step_description',
            generic_content: description,
            affected_pages: [route],
            genericity_indicators: genericIndicators,
            suggested_improvements: [
              'Provide specific implementation steps',
              'Include concrete deliverables and timelines',
              'Reference specific tools and team responsibilities',
              'Make recommendations actionable and measurable'
            ]
          });
        }
      });
    });

    return issues;
  }

  /**
   * Generates content fingerprints for each page
   */
  private generateContentFingerprints(
    contentMap: Map<string, ResultsPageContent>
  ): ContentFingerprint[] {
    return Array.from(contentMap.entries()).map(([route, content]) => {
      const contentText = this.extractContentText(content);
      const contentHash = this.generateContentHash(contentText);

      // Extract semantic markers (unique phrases)
      const semanticMarkers = this.extractSemanticMarkers(content);

      // Extract contextual elements (page-specific context)
      const contextualElements = this.extractContextualElements(content, route);

      // Find generic elements
      const genericElements = this.findGenericElements(contentText);

      // Calculate uniqueness score
      const uniquenessScore = this.calculateContentUniquenessScore(
        semanticMarkers,
        contextualElements,
        genericElements
      );

      return {
        page_route: route,
        content_hash: contentHash,
        semantic_markers: semanticMarkers,
        contextual_elements: contextualElements,
        generic_elements: genericElements,
        uniqueness_score: uniquenessScore,
        generated_at: new Date().toISOString()
      };
    });
  }

  /**
   * Generates recommendations for improving content uniqueness
   */
  private generateUniquenessRecommendations(
    duplicateIssues: DuplicateContentIssue[],
    genericIssues: GenericContentIssue[],
    overallScore: number
  ): UniquenessRecommendation[] {
    const recommendations: UniquenessRecommendation[] = [];

    // Address duplicate content
    if (duplicateIssues.length > 0) {
      const criticalDuplicates = duplicateIssues.filter(issue => issue.severity === 'critical' || issue.severity === 'high');
      if (criticalDuplicates.length > 0) {
        recommendations.push({
          recommendation_id: `eliminate-duplicates-${Date.now()}`,
          priority: 'immediate',
          category: 'eliminate_duplicates',
          title: 'Eliminate Duplicate Content Immediately',
          description: `${criticalDuplicates.length} critical duplicate content issues detected that severely impact user experience.`,
          expected_improvement: 'Increase overall uniqueness score by 15-25 points',
          implementation_steps: [
            'Review all pages with identical hero titles and create unique variants',
            'Differentiate insight titles based on actual data source and context',
            'Ensure opportunity labels reflect page-specific analysis',
            'Validate no two pages share identical content sections'
          ],
          affected_pages: [...new Set(criticalDuplicates.flatMap(issue => issue.affected_pages))]
        });
      }
    }

    // Address generic content
    if (genericIssues.length > 5) {
      recommendations.push({
        recommendation_id: `reduce-genericity-${Date.now()}`,
        priority: 'high',
        category: 'reduce_genericity',
        title: 'Reduce Generic Language and Improve Specificity',
        description: `${genericIssues.length} instances of generic content detected. Content lacks specificity and actionable details.`,
        expected_improvement: 'Increase content specificity and user engagement',
        implementation_steps: [
          'Replace vague qualifiers with specific metrics and data points',
          'Include concrete, actionable recommendations with clear outcomes',
          'Reference specific Content Recommendations tools and data sources',
          'Provide context-aware insights based on actual page purpose'
        ],
        affected_pages: [...new Set(genericIssues.flatMap(issue => issue.affected_pages))]
      });
    }

    // Overall improvement recommendations
    if (overallScore < this.MIN_UNIQUENESS_SCORE) {
      recommendations.push({
        recommendation_id: `enhance-context-awareness-${Date.now()}`,
        priority: 'high',
        category: 'enhance_context_awareness',
        title: 'Enhance Content Context Awareness',
        description: `Overall uniqueness score of ${overallScore} is below the minimum threshold of ${this.MIN_UNIQUENESS_SCORE}.`,
        expected_improvement: `Increase uniqueness score to above ${this.MIN_UNIQUENESS_SCORE}`,
        implementation_steps: [
          'Ensure each Results page reflects its specific DXP tool and data source',
          'Customize hero sections based on actual page functionality',
          'Generate insights from real Content Recommendations data',
          'Create page-specific opportunities and next steps',
          'Implement content validation checks in the generation pipeline'
        ],
        affected_pages: Array.from(this.contentCache.keys())
      });
    }

    // Personalization improvements
    recommendations.push({
      recommendation_id: `improve-personalization-${Date.now()}`,
      priority: 'medium',
      category: 'improve_personalization',
      title: 'Implement Advanced Content Personalization',
      description: 'Enhance content uniqueness through intelligent personalization and context-aware generation.',
      expected_improvement: 'Achieve 90+ uniqueness score with highly personalized content',
      implementation_steps: [
        'Implement user segment-aware content generation',
        'Use actual Content Recommendations data for personalized insights',
        'Create dynamic content templates based on user behavior patterns',
        'Implement A/B testing for content variations',
        'Add user preference-based content customization'
      ],
      affected_pages: Array.from(this.contentCache.keys())
    });

    return recommendations;
  }

  // =============================================================================
  // ANALYSIS HELPER METHODS
  // =============================================================================

  private calculateTextUniqueness(texts: string[]): number {
    if (texts.length <= 1) return 100;

    const similarities: number[] = [];

    for (let i = 0; i < texts.length; i++) {
      for (let j = i + 1; j < texts.length; j++) {
        const similarity = this.calculateTextSimilarity(texts[i], texts[j]);
        similarities.push(similarity);
      }
    }

    const avgSimilarity = similarities.reduce((sum, sim) => sum + sim, 0) / similarities.length;
    return Math.round((1 - avgSimilarity) * 100);
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);

    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];

    return intersection.length / union.length;
  }

  private findDuplicateTexts(texts: string[], threshold: number): string[] {
    const duplicates: string[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < texts.length; i++) {
      for (let j = i + 1; j < texts.length; j++) {
        const similarity = this.calculateTextSimilarity(texts[i], texts[j]);
        if (similarity >= threshold) {
          if (!seen.has(texts[i])) {
            duplicates.push(texts[i]);
            seen.add(texts[i]);
          }
          if (!seen.has(texts[j])) {
            duplicates.push(texts[j]);
            seen.add(texts[j]);
          }
        }
      }
    }

    return duplicates;
  }

  private findGenericTexts(texts: string[]): string[] {
    return texts.filter(text => {
      const genericCount = this.GENERIC_INDICATORS.filter(indicator =>
        text.toLowerCase().includes(indicator)
      ).length;
      return genericCount > 2;
    });
  }

  private analyzeMetricsPatterns(heroes: { route: string; hero: any }[]): MetricPattern[] {
    const patterns = new Map<string, { count: number; pages: string[] }>();

    heroes.forEach(({ route, hero }) => {
      hero.metrics?.forEach((metric: any) => {
        const pattern = `${metric.label}`;
        if (!patterns.has(pattern)) {
          patterns.set(pattern, { count: 0, pages: [] });
        }
        patterns.get(pattern)!.count++;
        patterns.get(pattern)!.pages.push(route);
      });
    });

    return Array.from(patterns.entries()).map(([pattern, data]) => ({
      pattern,
      occurrences: data.count,
      pages: data.pages,
      is_generic: data.count > heroes.length * 0.5 // More than 50% of pages use this pattern
    }));
  }

  private calculateMetricsUniqueness(patterns: MetricPattern[]): number {
    const genericPatterns = patterns.filter(p => p.is_generic).length;
    const totalPatterns = patterns.length;

    if (totalPatterns === 0) return 100;
    return Math.round((1 - genericPatterns / totalPatterns) * 100);
  }

  private findDuplicateInsights(insights: any[]): DuplicateInsight[] {
    const duplicates: DuplicateInsight[] = [];
    const titleGroups = new Map<string, any[]>();

    insights.forEach(insight => {
      const title = insight.title.toLowerCase().trim();
      if (!titleGroups.has(title)) {
        titleGroups.set(title, []);
      }
      titleGroups.get(title)!.push(insight);
    });

    titleGroups.forEach((group, title) => {
      if (group.length > 1) {
        duplicates.push({
          insight_title: title,
          insight_description: group[0].description,
          pages: group.map(g => g.route),
          similarity_score: 1.0
        });
      }
    });

    return duplicates;
  }

  private findGenericInsightPatterns(insights: any[]): GenericPattern[] {
    const patterns: GenericPattern[] = [];

    // Check for generic templates
    const templatePatterns = insights.filter(insight => {
      const description = insight.description.toLowerCase();
      return this.GENERIC_INDICATORS.some(indicator => description.includes(indicator));
    });

    if (templatePatterns.length > 0) {
      patterns.push({
        pattern_text: 'Generic template language detected',
        pattern_type: 'template_language',
        occurrences: templatePatterns.length,
        pages: templatePatterns.map(p => p.route),
        specificity_score: 0.2
      });
    }

    return patterns;
  }

  private findCrossPageRepetitions(insights: any[]): CrossPageRepetition[] {
    const repetitions: CrossPageRepetition[] = [];
    const titleCounts = new Map<string, string[]>();

    insights.forEach(insight => {
      const title = insight.title.toLowerCase().trim();
      if (!titleCounts.has(title)) {
        titleCounts.set(title, []);
      }
      titleCounts.get(title)!.push(insight.route);
    });

    titleCounts.forEach((routes, title) => {
      if (routes.length > 1) {
        repetitions.push({
          repeated_content: title,
          content_type: 'insight_title',
          pages: routes,
          repetition_score: routes.length / insights.length
        });
      }
    });

    return repetitions;
  }

  private analyzeImpactLevelDistribution(opportunities: any[]): ImpactLevelDistribution {
    const distribution = { high: 0, medium: 0, low: 0, pages_analyzed: opportunities.length, distribution_score: 0 };

    opportunities.forEach(opp => {
      distribution[opp.impactLevel.toLowerCase() as keyof typeof distribution]++;
    });

    // Calculate distribution score (how varied it is)
    const values = [distribution.high, distribution.medium, distribution.low];
    const max = Math.max(...values);
    const min = Math.min(...values);
    distribution.distribution_score = max > 0 ? Math.round((1 - (max - min) / max) * 100) : 0;

    return distribution;
  }

  private analyzeEffortLevelDistribution(opportunities: any[]): EffortLevelDistribution {
    const distribution = { low: 0, medium: 0, high: 0, pages_analyzed: opportunities.length, distribution_score: 0 };

    opportunities.forEach(opp => {
      distribution[opp.effortLevel.toLowerCase() as keyof typeof distribution]++;
    });

    // Calculate distribution score
    const values = [distribution.low, distribution.medium, distribution.high];
    const max = Math.max(...values);
    const min = Math.min(...values);
    distribution.distribution_score = max > 0 ? Math.round((1 - (max - min) / max) * 100) : 0;

    return distribution;
  }

  private findDuplicateOpportunities(opportunities: any[]): DuplicateOpportunity[] {
    const duplicates: DuplicateOpportunity[] = [];
    const labelGroups = new Map<string, any[]>();

    opportunities.forEach(opp => {
      const label = opp.label.toLowerCase().trim();
      if (!labelGroups.has(label)) {
        labelGroups.set(label, []);
      }
      labelGroups.get(label)!.push(opp);
    });

    labelGroups.forEach((group, label) => {
      if (group.length > 1) {
        duplicates.push({
          opportunity_label: label,
          pages: group.map(g => g.route),
          similarity_score: 1.0
        });
      }
    });

    return duplicates;
  }

  private findGenericOpportunityPatterns(opportunities: any[]): GenericPattern[] {
    const patterns: GenericPattern[] = [];

    const genericOpportunities = opportunities.filter(opp => {
      const label = opp.label.toLowerCase();
      return this.GENERIC_INDICATORS.some(indicator => label.includes(indicator));
    });

    if (genericOpportunities.length > 0) {
      patterns.push({
        pattern_text: 'Generic opportunity language',
        pattern_type: 'generic_recommendations',
        occurrences: genericOpportunities.length,
        pages: genericOpportunities.map(o => o.route),
        specificity_score: 0.3
      });
    }

    return patterns;
  }

  private analyzeOwnerHintDistribution(nextSteps: any[]): OwnerHintDistribution {
    const distribution: OwnerHintDistribution = { distribution_score: 0, most_common: '' };
    const ownerCounts = new Map<string, number>();

    nextSteps.forEach(step => {
      const owner = step.ownerHint || 'unspecified';
      ownerCounts.set(owner, (ownerCounts.get(owner) || 0) + 1);
    });

    ownerCounts.forEach((count, owner) => {
      distribution[owner] = count;
    });

    // Find most common
    let maxCount = 0;
    ownerCounts.forEach((count, owner) => {
      if (count > maxCount) {
        maxCount = count;
        distribution.most_common = owner;
      }
    });

    // Calculate distribution score
    const totalSteps = nextSteps.length;
    distribution.distribution_score = totalSteps > 0 ? Math.round((1 - maxCount / totalSteps) * 100) : 0;

    return distribution;
  }

  private analyzeTimeframeDistribution(nextSteps: any[]): TimeframeDistribution {
    const distribution: TimeframeDistribution = { distribution_score: 0, most_common: '' };
    const timeframeCounts = new Map<string, number>();

    nextSteps.forEach(step => {
      const timeframe = step.timeframeHint || 'unspecified';
      timeframeCounts.set(timeframe, (timeframeCounts.get(timeframe) || 0) + 1);
    });

    timeframeCounts.forEach((count, timeframe) => {
      distribution[timeframe] = count;
    });

    // Find most common
    let maxCount = 0;
    timeframeCounts.forEach((count, timeframe) => {
      if (count > maxCount) {
        maxCount = count;
        distribution.most_common = timeframe;
      }
    });

    // Calculate distribution score
    const totalSteps = nextSteps.length;
    distribution.distribution_score = totalSteps > 0 ? Math.round((1 - maxCount / totalSteps) * 100) : 0;

    return distribution;
  }

  private findDuplicateNextSteps(nextSteps: any[]): DuplicateNextStep[] {
    const duplicates: DuplicateNextStep[] = [];
    const labelGroups = new Map<string, any[]>();

    nextSteps.forEach(step => {
      const label = step.title.toLowerCase().trim();
      if (!labelGroups.has(label)) {
        labelGroups.set(label, []);
      }
      labelGroups.get(label)!.push(step);
    });

    labelGroups.forEach((group, label) => {
      if (group.length > 1) {
        duplicates.push({
          step_label: label,
          step_description: group[0].description,
          pages: group.map(g => g.route),
          similarity_score: 1.0
        });
      }
    });

    return duplicates;
  }

  private findGenericNextStepPatterns(nextSteps: any[]): GenericPattern[] {
    const patterns: GenericPattern[] = [];

    const genericSteps = nextSteps.filter(step => {
      const description = step.description.toLowerCase();
      return this.GENERIC_INDICATORS.some(indicator => description.includes(indicator));
    });

    if (genericSteps.length > 0) {
      patterns.push({
        pattern_text: 'Generic next step language',
        pattern_type: 'boilerplate_text',
        occurrences: genericSteps.length,
        pages: genericSteps.map(s => s.route),
        specificity_score: 0.25
      });
    }

    return patterns;
  }

  private extractContentText(content: ResultsPageContent): string {
    const sections = [
      content.hero.title,
      content.hero.promise,
      content.overview.summary,
      ...content.overview.keyPoints,
      ...content.insights.map(i => `${i.title} ${i.description} ${i.bullets.join(' ')}`),
      ...content.opportunities.map(o => o.label),
      ...content.nextSteps.map(s => `${s.title} ${s.description}`)
    ];

    return sections.join(' ').toLowerCase();
  }

  private generateContentHash(content: string): string {
    // Simple hash function for content fingerprinting
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  private extractSemanticMarkers(content: ResultsPageContent): string[] {
    const markers: string[] = [];

    // Extract unique phrases from titles and descriptions
    const keyPhrases = [
      content.hero.title,
      ...content.insights.map(i => i.title),
      ...content.opportunities.map(o => o.label),
      ...content.nextSteps.map(s => s.title)
    ];

    keyPhrases.forEach(phrase => {
      // Extract 2-3 word phrases that might be unique
      const words = phrase.toLowerCase().split(/\s+/);
      for (let i = 0; i < words.length - 1; i++) {
        const twoWordPhrase = `${words[i]} ${words[i + 1]}`;
        if (!this.isCommonPhrase(twoWordPhrase)) {
          markers.push(twoWordPhrase);
        }
      }
    });

    return [...new Set(markers)]; // Remove duplicates
  }

  private extractContextualElements(content: ResultsPageContent, route: string): string[] {
    const elements: string[] = [];

    // Extract route-based context
    const routeParts = route.split('/').filter(part => part);
    elements.push(...routeParts);

    // Extract metrics labels as context
    content.hero.metrics?.forEach(metric => {
      elements.push(metric.label.toLowerCase());
    });

    // Extract specific data points
    content.insights.forEach(insight => {
      const numbers = insight.description.match(/\d+%?/g);
      if (numbers) {
        elements.push(...numbers);
      }
    });

    return elements;
  }

  private findGenericElements(contentText: string): string[] {
    const genericElements: string[] = [];

    this.GENERIC_INDICATORS.forEach(indicator => {
      if (contentText.includes(indicator)) {
        genericElements.push(indicator);
      }
    });

    this.VAGUE_QUALIFIERS.forEach(qualifier => {
      if (contentText.includes(qualifier)) {
        genericElements.push(qualifier);
      }
    });

    return genericElements;
  }

  private calculateContentUniquenessScore(
    semanticMarkers: string[],
    contextualElements: string[],
    genericElements: string[]
  ): number {
    const uniqueMarkers = semanticMarkers.length;
    const contextMarkers = contextualElements.length;
    const genericMarkers = genericElements.length;

    // Calculate score: more unique/context markers = higher score, more generic = lower score
    const positiveScore = (uniqueMarkers * 2) + contextMarkers;
    const negativeScore = genericMarkers * 3;

    const rawScore = Math.max(0, positiveScore - negativeScore);

    // Normalize to 0-100 scale
    return Math.min(100, Math.round((rawScore / 20) * 100));
  }

  private isCommonPhrase(phrase: string): boolean {
    const commonPhrases = [
      'the data', 'data shows', 'our analysis', 'we recommend', 'you can', 'this will',
      'it is', 'will be', 'can be', 'should be', 'to improve', 'to optimize',
      'based on', 'according to', 'in order', 'to increase', 'to enhance'
    ];

    return commonPhrases.includes(phrase);
  }

  private createFailedValidationReport(errorMessage: string, pagesCount: number): ContentUniquenessReport {
    return {
      overall_uniqueness_score: 0,
      validation_timestamp: new Date().toISOString(),
      pages_analyzed: pagesCount,
      uniqueness_details: {
        hero_uniqueness: {
          uniqueness_score: 0,
          title_uniqueness: 0,
          promise_uniqueness: 0,
          metrics_uniqueness: 0,
          duplicate_titles: [],
          generic_promises: [],
          repeated_metric_patterns: []
        },
        insights_uniqueness: {
          uniqueness_score: 0,
          insight_titles_uniqueness: 0,
          insight_content_uniqueness: 0,
          duplicate_insights: [],
          generic_insight_patterns: [],
          cross_page_repetition: []
        },
        opportunities_uniqueness: {
          uniqueness_score: 0,
          opportunity_labels_uniqueness: 0,
          opportunity_descriptions_uniqueness: 0,
          impact_level_distribution: { high: 0, medium: 0, low: 0, pages_analyzed: 0, distribution_score: 0 },
          effort_level_distribution: { low: 0, medium: 0, high: 0, pages_analyzed: 0, distribution_score: 0 },
          duplicate_opportunities: [],
          generic_opportunity_patterns: []
        },
        next_steps_uniqueness: {
          uniqueness_score: 0,
          step_labels_uniqueness: 0,
          step_descriptions_uniqueness: 0,
          owner_hint_distribution: { distribution_score: 0, most_common: '' },
          timeframe_distribution: { distribution_score: 0, most_common: '' },
          duplicate_steps: [],
          generic_step_patterns: []
        }
      },
      duplicate_content_detected: [],
      generic_content_detected: [],
      recommendations: [{
        recommendation_id: `validation-failure-${Date.now()}`,
        priority: 'immediate',
        category: 'eliminate_duplicates',
        title: 'Restore Content Uniqueness Validation',
        description: `Content uniqueness validation failed: ${errorMessage}`,
        expected_improvement: 'Restore ability to validate content uniqueness',
        implementation_steps: [
          'Investigate validation system errors',
          'Verify Results page content generation',
          'Test uniqueness analysis algorithms',
          'Restore validation functionality'
        ],
        affected_pages: []
      }],
      content_fingerprints: []
    };
  }
}

// =============================================================================
// SERVICE INSTANCE AND EXPORTS
// =============================================================================

// Create singleton service instance
const contentUniquenessValidator = new ContentUniquenessValidationService();

/**
 * Main function for validating content uniqueness across Results pages
 */
export async function validateResultsContentUniqueness(
  contentMap: Map<string, ResultsPageContent>
): Promise<ContentUniquenessReport> {
  return await contentUniquenessValidator.validateContentUniqueness(contentMap);
}

/**
 * Quick uniqueness check for specific content
 */
export async function checkContentUniqueness(
  content: ResultsPageContent,
  existingContent: Map<string, ResultsPageContent>,
  pageRoute: string
): Promise<{
  uniqueness_score: number;
  duplicate_issues: number;
  generic_issues: number;
  recommendations: string[];
}> {
  const testMap = new Map(existingContent);
  testMap.set(pageRoute, content);

  const report = await validateResultsContentUniqueness(testMap);

  const duplicateIssues = report.duplicate_content_detected.filter(issue =>
    issue.affected_pages.includes(pageRoute)
  ).length;

  const genericIssues = report.generic_content_detected.filter(issue =>
    issue.affected_pages.includes(pageRoute)
  ).length;

  const recommendations = report.recommendations
    .filter(rec => rec.affected_pages.includes(pageRoute))
    .map(rec => rec.title);

  return {
    uniqueness_score: report.overall_uniqueness_score,
    duplicate_issues: duplicateIssues,
    generic_issues: genericIssues,
    recommendations
  };
}

/**
 * Generate content fingerprint for a single page
 */
export function generateContentFingerprint(
  content: ResultsPageContent,
  pageRoute: string
): ContentFingerprint {
  const validator = new ContentUniquenessValidationService();
  const testMap = new Map([[pageRoute, content]]);
  const fingerprints = validator['generateContentFingerprints'](testMap);
  return fingerprints[0];
}

// Export the service class for advanced usage
export { ContentUniquenessValidationService };

// Export all types
export type {
  ContentUniquenessReport,
  HeroUniquenessAnalysis,
  InsightsUniquenessAnalysis,
  OpportunitiesUniquenessAnalysis,
  NextStepsUniquenessAnalysis,
  DuplicateContentIssue,
  GenericContentIssue,
  UniquenessRecommendation,
  ContentFingerprint
};

export default {
  validateResultsContentUniqueness,
  checkContentUniqueness,
  generateContentFingerprint
};