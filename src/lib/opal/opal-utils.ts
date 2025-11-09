/**
 * OPAL Configuration Utilities
 * Helper functions for working with enhanced OPAL data structures
 */

import { EnhancedOSAWorkflowOutput, opalConfig, analyticsConfig, recommendationConfig } from './opal-config';
import { sampleOSAWorkflowOutput } from './sample-data';

export class OpalConfigManager {
  private static instance: OpalConfigManager;
  private config = opalConfig;
  private analyticsSettings = analyticsConfig;
  private recommendationSettings = recommendationConfig;

  static getInstance(): OpalConfigManager {
    if (!OpalConfigManager.instance) {
      OpalConfigManager.instance = new OpalConfigManager();
    }
    return OpalConfigManager.instance;
  }

  // Configuration getters
  getConfig() {
    return this.config;
  }

  getAnalyticsConfig() {
    return this.analyticsSettings;
  }

  getRecommendationConfig() {
    return this.recommendationSettings;
  }

  // Feature flags
  isFeatureEnabled(feature: keyof typeof opalConfig.features): boolean {
    return this.config.features[feature];
  }

  // Data validation utilities
  validateWorkflowOutput(output: Partial<EnhancedOSAWorkflowOutput>): boolean {
    const requiredFields = ['workflow_id', 'session_id', 'client_name', 'generated_at'];
    return requiredFields.every(field => field in output);
  }

  // Data transformation utilities
  transformLegacyData(legacyOutput: any): EnhancedOSAWorkflowOutput {
    // Transform legacy OSA output to enhanced format
    return {
      ...sampleOSAWorkflowOutput, // Use as template
      workflow_id: legacyOutput.workflow_id || 'unknown',
      session_id: legacyOutput.session_id || 'unknown',
      client_name: legacyOutput.client_name || 'Unknown Client',
      industry: legacyOutput.industry || 'Unknown',
      company_size: legacyOutput.company_size || 'Unknown',
      generated_at: legacyOutput.generated_at || new Date().toISOString(),
      // Map legacy fields to enhanced structure as needed
    };
  }

  // Analytics utilities
  getEventWeight(eventType: string): number {
    return this.analyticsSettings.events[eventType as keyof typeof this.analyticsSettings.events]?.weight || 1;
  }

  getEventRetention(eventType: string): number {
    return this.analyticsSettings.events[eventType as keyof typeof this.analyticsSettings.events]?.retention_days || 30;
  }

  // Recommendation utilities
  getRecommendationScoreWeights() {
    return this.recommendationSettings.scoring.weights;
  }

  getRiskMultiplier(riskLevel: string, tolerance: string): number {
    const multipliers = this.recommendationSettings.scoring.risk_tolerance_multipliers;
    return multipliers[tolerance as keyof typeof multipliers]?.[riskLevel as keyof typeof multipliers['conservative']] || 1.0;
  }

  // Dashboard layout utilities
  getDashboardLayoutForRole(role: string) {
    const layouts = {
      'Executive': 'executive',
      'Marketing Manager': 'marketing_manager',
      'Technical Lead': 'technical_lead',
      'UX Designer': 'ux_designer'
    };
    return layouts[role as keyof typeof layouts] || 'marketing_manager';
  }
}

// Data processing utilities
export class OpalDataProcessor {
  // Calculate aggregated metrics
  static calculateEngagementScore(analytics: EnhancedOSAWorkflowOutput['analytics']): number {
    const { userBehavior, contentEngagement, recommendationPerformance } = analytics;

    const behaviorScore = Math.min(100, userBehavior.engagementScore);
    const contentScore = Math.min(100, (1 - contentEngagement.bounceRate) * 100);
    const recommendationScore = Math.min(100, recommendationPerformance.engagementRate);

    return Math.round((behaviorScore * 0.4 + contentScore * 0.3 + recommendationScore * 0.3));
  }

  // Process maturity assessment data
  static processMaturityData(maturity: EnhancedOSAWorkflowOutput['strategy_plans']['maturity']) {
    const dimensionScores = maturity.dimensions.map(d => d.score);
    const avgScore = dimensionScores.reduce((sum, score) => sum + score, 0) / dimensionScores.length;

    const assessmentCounts = maturity.dimensions.reduce((counts, d) => {
      counts[d.assessment] = (counts[d.assessment] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    return {
      averageScore: Math.round(avgScore),
      strongestDimension: maturity.dimensions.reduce((strongest, current) =>
        current.score > strongest.score ? current : strongest
      ),
      assessmentDistribution: assessmentCounts,
      improvementOpportunities: maturity.dimensions
        .filter(d => d.score < avgScore * 0.85)
        .map(d => ({ name: d.name, score: d.score, gaps: d.gaps }))
    };
  }

  // Process recommendation data
  static processRecommendationData(recommendations: EnhancedOSAWorkflowOutput['recommendations']) {
    const byCategory = recommendations.personalized_recommendations.reduce((groups, rec) => {
      groups[rec.category] = groups[rec.category] || [];
      groups[rec.category].push(rec);
      return groups;
    }, {} as Record<string, typeof recommendations.personalized_recommendations>);

    const byPriority = recommendations.personalized_recommendations.reduce((groups, rec) => {
      const priority = rec.priority_score > 80 ? 'high' : rec.priority_score > 60 ? 'medium' : 'low';
      groups[priority] = groups[priority] || [];
      groups[priority].push(rec);
      return groups;
    }, {} as Record<string, typeof recommendations.personalized_recommendations>);

    return {
      totalRecommendations: recommendations.personalized_recommendations.length,
      byCategory,
      byPriority,
      averageConfidence: recommendations.personalized_recommendations.reduce((sum, rec) => sum + rec.confidence, 0) / recommendations.personalized_recommendations.length,
      highPriorityCount: byPriority.high?.length || 0,
      quickWinsCount: recommendations.personalized_recommendations.filter(rec => rec.type === 'quick_win').length
    };
  }

  // Generate summary metrics
  static generateSummaryMetrics(output: EnhancedOSAWorkflowOutput) {
    return {
      overall_score: Math.round((
        output.strategy_plans.maturity.overall_score * 0.3 +
        this.calculateEngagementScore(output.analytics) * 0.3 +
        (output.recommendations.recommendation_performance.success_rate || 0) * 0.4
      )),
      key_strengths: [
        // Extract top strengths from maturity dimensions
        ...output.strategy_plans.maturity.dimensions
          .filter(d => d.score > 80)
          .map(d => `Strong ${d.name.toLowerCase()}`)
          .slice(0, 3),
        // Add high-performing areas
        output.analytics.userBehavior.engagementScore > 80 ? 'High user engagement' : '',
        output.recommendations.recommendation_performance.acceptance_rate > 70 ? 'Effective recommendations' : ''
      ].filter(Boolean),
      improvement_areas: [
        // Extract improvement areas from maturity gaps
        ...output.strategy_plans.maturity.dimensions
          .filter(d => d.score < 70)
          .flatMap(d => d.improvement_priorities)
          .slice(0, 3),
        // Add performance-based improvements
        output.analytics.contentEngagement.bounceRate > 0.3 ? 'Content engagement optimization' : '',
        output.analytics.recommendationPerformance.engagementRate < 60 ? 'Recommendation relevance improvement' : ''
      ].filter(Boolean),
      quick_wins_available: output.strategy_plans.quick_wins.top_opportunities.length,
      implementation_readiness: Math.round(
        output.strategy_plans.phases.phase_overview
          .filter(phase => phase.status === 'completed')
          .reduce((sum, phase) => sum + phase.completion_percentage, 0) /
        output.strategy_plans.phases.phase_overview.length
      )
    };
  }
}

// Validation utilities
export class OpalValidator {
  // Validate analytics data structure
  static validateAnalytics(analytics: EnhancedOSAWorkflowOutput['analytics']): string[] {
    const errors: string[] = [];

    if (!analytics.userBehavior || typeof analytics.userBehavior.engagementScore !== 'number') {
      errors.push('Invalid user behavior data');
    }

    if (!analytics.contentEngagement || !Array.isArray(analytics.contentEngagement.topViewedSections)) {
      errors.push('Invalid content engagement data');
    }

    if (!analytics.recommendationPerformance || typeof analytics.recommendationPerformance.engagementRate !== 'number') {
      errors.push('Invalid recommendation performance data');
    }

    return errors;
  }

  // Validate maturity assessment data
  static validateMaturity(maturity: EnhancedOSAWorkflowOutput['strategy_plans']['maturity']): string[] {
    const errors: string[] = [];

    if (typeof maturity.overall_score !== 'number' || maturity.overall_score < 0 || maturity.overall_score > 100) {
      errors.push('Invalid overall maturity score');
    }

    if (!Array.isArray(maturity.dimensions) || maturity.dimensions.length === 0) {
      errors.push('Missing maturity dimensions');
    }

    maturity.dimensions.forEach((dimension, index) => {
      if (!dimension.name || typeof dimension.score !== 'number') {
        errors.push(`Invalid dimension data at index ${index}`);
      }
    });

    return errors;
  }

  // Validate recommendation data
  static validateRecommendations(recommendations: EnhancedOSAWorkflowOutput['recommendations']): string[] {
    const errors: string[] = [];

    if (!Array.isArray(recommendations.personalized_recommendations)) {
      errors.push('Invalid recommendations array');
    }

    recommendations.personalized_recommendations.forEach((rec, index) => {
      if (!rec.id || !rec.title || typeof rec.priority_score !== 'number') {
        errors.push(`Invalid recommendation data at index ${index}`);
      }
    });

    if (!recommendations.recommendation_performance || typeof recommendations.recommendation_performance.acceptance_rate !== 'number') {
      errors.push('Invalid recommendation performance data');
    }

    return errors;
  }

  // Comprehensive validation
  static validateWorkflowOutput(output: EnhancedOSAWorkflowOutput): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic structure validation
    if (!output.workflow_id || !output.session_id) {
      errors.push('Missing required workflow identifiers');
    }

    // Validate each major section
    errors.push(...this.validateAnalytics(output.analytics));
    errors.push(...this.validateMaturity(output.strategy_plans.maturity));
    errors.push(...this.validateRecommendations(output.recommendations));

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Export utilities
export const opalUtils = {
  configManager: OpalConfigManager.getInstance(),
  dataProcessor: OpalDataProcessor,
  validator: OpalValidator
};

export default opalUtils;