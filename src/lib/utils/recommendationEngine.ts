/**
 * Enhanced Recommendation Scoring System
 * Multi-factor decision engine for intelligent OSA recommendations
 */

// Core recommendation types and their base characteristics
export interface RecommendationBase {
  id: string;
  title: string;
  description: string;
  category: 'content' | 'personalization' | 'experimentation' | 'ux' | 'technology';
  type: 'quick_win' | 'strategic' | 'infrastructure' | 'optimization' | 'innovation';

  // Base scoring factors
  impactScore: number; // 1-10 scale
  effortScore: number; // 1-10 scale (lower = less effort)
  riskLevel: 'low' | 'medium' | 'high';
  complexity: 'simple' | 'moderate' | 'complex' | 'expert';

  // Historical data
  historicalSuccessRate: number; // 0-100%
  averageImplementationTime: number; // in weeks
  resourceRequirements: string[];

  // Expected outcomes
  expectedOutcomes: {
    primary: string;
    secondary?: string[];
    metrics: {
      name: string;
      expectedChange: string;
      confidence: number; // 0-100%
      timeline: string;
    }[];
  };

  // Context and dependencies
  prerequisites?: string[];
  blockers?: string[];
  synergies?: string[]; // Other recommendations that work well together
}

// Role-based weights for scoring
export const roleWeights = {
  'Executive': {
    impact: 0.4,
    roi: 0.3,
    risk: 0.2,
    timeline: 0.1
  },
  'Marketing Manager': {
    impact: 0.3,
    effort: 0.2,
    timeline: 0.3,
    feasibility: 0.2
  },
  'UX Designer': {
    userExperience: 0.4,
    feasibility: 0.3,
    effort: 0.2,
    innovation: 0.1
  },
  'Technical Lead': {
    feasibility: 0.4,
    effort: 0.3,
    risk: 0.2,
    maintainability: 0.1
  },
  'Data Analyst': {
    measurability: 0.4,
    impact: 0.3,
    dataQuality: 0.2,
    accuracy: 0.1
  }
};

// User context for personalization
export interface UserContext {
  role: string;
  experienceLevel: 'beginner' | 'intermediate' | 'expert';
  currentFocus: string[];
  pastActions: {
    acceptedRecommendations: string[];
    dismissedRecommendations: string[];
    implementedSolutions: string[];
  };
  constraints: {
    budget: 'low' | 'medium' | 'high';
    timeline: 'urgent' | 'normal' | 'flexible';
    teamSize: 'small' | 'medium' | 'large';
  };
  preferences: {
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
    preferredApproach: 'incremental' | 'transformational';
    focusArea: string;
  };
}

export class RecommendationEngine {
  private recommendations: RecommendationBase[] = [];
  private userInteractions: Map<string, number> = new Map();

  constructor(recommendations: RecommendationBase[] = []) {
    this.recommendations = [...recommendations, ...this.getBuiltinRecommendations()];
  }

  /**
   * Generate personalized recommendations based on user context and analytics
   */
  generateRecommendations(
    context: UserContext,
    areaId?: string,
    tabId?: string,
    maxResults: number = 10
  ): EnhancedRecommendation[] {
    // Filter recommendations by context
    let filteredRecs = this.recommendations.filter(rec => {
      if (areaId && !this.isRecommendationRelevantToArea(rec, areaId)) return false;
      if (tabId && !this.isRecommendationRelevantToTab(rec, tabId)) return false;
      return true;
    });

    // Score each recommendation
    const scoredRecommendations = filteredRecs.map(rec => {
      const score = this.calculateRecommendationScore(rec, context);
      return this.enhanceWithMetrics(rec, context, score);
    });

    // Sort by score and return top results
    return scoredRecommendations
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, maxResults);
  }

  /**
   * Calculate multi-factor recommendation score
   */
  private calculateRecommendationScore(rec: RecommendationBase, context: UserContext): number {
    const weights = roleWeights[context.role as keyof typeof roleWeights] || roleWeights['Marketing Manager'];

    // Base impact-effort score (0-100)
    const impactEffortScore = ((rec.impactScore / rec.effortScore) * 10);

    // Risk adjustment
    const riskMultiplier = this.getRiskMultiplier(rec.riskLevel, context.preferences.riskTolerance);

    // Historical success weight
    const historyWeight = rec.historicalSuccessRate / 100;

    // User preference alignment
    const preferenceAlignment = this.calculatePreferenceAlignment(rec, context);

    // Role-specific adjustments
    const roleAdjustment = this.calculateRoleSpecificScore(rec, context, weights);

    // Context constraints
    const constraintsFit = this.calculateConstraintsFit(rec, context);

    // Synergy bonus (if user has shown interest in related areas)
    const synergyBonus = this.calculateSynergyBonus(rec, context);

    // Final weighted score
    let finalScore =
      (impactEffortScore * 0.3) +
      (historyWeight * 20) +
      (preferenceAlignment * 0.25) +
      (roleAdjustment * 0.15) +
      (constraintsFit * 0.1) +
      (synergyBonus * 0.05);

    finalScore *= riskMultiplier;

    return Math.min(100, Math.max(0, finalScore));
  }

  /**
   * Enhance recommendation with actionable metrics and confidence levels
   */
  private enhanceWithMetrics(
    rec: RecommendationBase,
    context: UserContext,
    score: number
  ): EnhancedRecommendation {
    const confidence = this.calculateConfidence(rec, context, score);
    const timeline = this.estimateTimeline(rec, context);
    const successProbability = this.calculateSuccessProbability(rec, context);
    const roiEstimate = this.calculateROIEstimate(rec, context);

    return {
      ...rec,
      finalScore: score,
      confidence,
      timeline,
      successProbability,
      roiEstimate,
      actionableMetrics: {
        expectedImpact: this.formatExpectedImpact(rec, context),
        implementationEffort: this.formatImplementationEffort(rec, context),
        riskAssessment: this.formatRiskAssessment(rec, context),
        successFactors: this.identifySuccessFactors(rec, context)
      },
      personalization: {
        reasonForRecommendation: this.generateReasonForRecommendation(rec, context, score),
        roleSpecificBenefits: this.generateRoleSpecificBenefits(rec, context),
        nextSteps: this.generateNextSteps(rec, context)
      }
    };
  }

  // Helper methods for scoring calculations

  private getRiskMultiplier(riskLevel: string, tolerance: string): number {
    const riskMatrix = {
      'conservative': { 'low': 1.0, 'medium': 0.8, 'high': 0.5 },
      'moderate': { 'low': 1.0, 'medium': 0.9, 'high': 0.7 },
      'aggressive': { 'low': 0.95, 'medium': 1.0, 'high': 1.1 }
    };
    return riskMatrix[tolerance as keyof typeof riskMatrix][riskLevel as keyof typeof riskMatrix['conservative']] || 1.0;
  }

  private calculatePreferenceAlignment(rec: RecommendationBase, context: UserContext): number {
    let alignment = 50; // Base alignment

    // Check if recommendation type matches user's preferred approach
    if (context.preferences.preferredApproach === 'incremental' && rec.type === 'quick_win') {
      alignment += 20;
    } else if (context.preferences.preferredApproach === 'transformational' && rec.type === 'strategic') {
      alignment += 20;
    }

    // Check focus area alignment
    if (context.preferences.focusArea && rec.category.includes(context.preferences.focusArea)) {
      alignment += 15;
    }

    // Check past behavior alignment
    const similarAccepted = context.pastActions.acceptedRecommendations.filter(id =>
      this.recommendations.find(r => r.id === id)?.category === rec.category
    ).length;

    const similarDismissed = context.pastActions.dismissedRecommendations.filter(id =>
      this.recommendations.find(r => r.id === id)?.category === rec.category
    ).length;

    if (similarAccepted > similarDismissed) {
      alignment += Math.min(15, similarAccepted * 3);
    } else if (similarDismissed > similarAccepted) {
      alignment -= Math.min(15, similarDismissed * 2);
    }

    return Math.min(100, Math.max(0, alignment));
  }

  private calculateRoleSpecificScore(rec: RecommendationBase, context: UserContext, weights: any): number {
    const role = context.role;
    let score = 50; // Base score

    switch (role) {
      case 'Executive':
        score += (rec.impactScore * 5) + (rec.historicalSuccessRate * 0.3);
        if (rec.type === 'strategic') score += 10;
        break;

      case 'Marketing Manager':
        score += (rec.impactScore * 3) + ((10 - rec.effortScore) * 2);
        if (rec.category === 'personalization' || rec.category === 'content') score += 10;
        break;

      case 'UX Designer':
        score += (rec.category === 'ux' ? 20 : 0) + ((10 - rec.effortScore) * 2);
        if (rec.complexity === 'simple' || rec.complexity === 'moderate') score += 5;
        break;

      case 'Technical Lead':
        score += ((10 - rec.effortScore) * 3) + (rec.riskLevel === 'low' ? 10 : 0);
        if (rec.category === 'technology') score += 15;
        break;

      case 'Data Analyst':
        score += (rec.expectedOutcomes.metrics.length * 5);
        if (rec.category === 'experimentation') score += 10;
        break;
    }

    return Math.min(100, Math.max(0, score));
  }

  private calculateConstraintsFit(rec: RecommendationBase, context: UserContext): number {
    let fit = 70; // Base fit

    // Budget constraints
    const budgetRequirement = this.estimateBudgetRequirement(rec);
    if (context.constraints.budget === 'low' && budgetRequirement === 'high') {
      fit -= 20;
    } else if (context.constraints.budget === 'high' && budgetRequirement === 'low') {
      fit += 10;
    }

    // Timeline constraints
    if (context.constraints.timeline === 'urgent' && rec.averageImplementationTime > 4) {
      fit -= 15;
    } else if (context.constraints.timeline === 'flexible' && rec.averageImplementationTime > 8) {
      fit -= 5;
    }

    // Team size constraints
    const teamRequirement = this.estimateTeamRequirement(rec);
    if (context.constraints.teamSize === 'small' && teamRequirement === 'large') {
      fit -= 15;
    }

    return Math.min(100, Math.max(0, fit));
  }

  private calculateSynergyBonus(rec: RecommendationBase, context: UserContext): number {
    if (!rec.synergies) return 0;

    const implementedSynergies = rec.synergies.filter(synergyId =>
      context.pastActions.implementedSolutions.includes(synergyId)
    ).length;

    return Math.min(20, implementedSynergies * 5);
  }

  private calculateConfidence(rec: RecommendationBase, context: UserContext, score: number): number {
    let confidence = rec.historicalSuccessRate;

    // Adjust based on user experience
    if (context.experienceLevel === 'expert') confidence += 10;
    if (context.experienceLevel === 'beginner') confidence -= 5;

    // Adjust based on complexity match
    const complexityMatch = this.getComplexityMatch(rec.complexity, context.experienceLevel);
    confidence += complexityMatch;

    // Adjust based on score
    confidence += (score - 50) * 0.2;

    return Math.min(95, Math.max(30, confidence));
  }

  private estimateTimeline(rec: RecommendationBase, context: UserContext): string {
    let weeks = rec.averageImplementationTime;

    // Adjust based on team size
    if (context.constraints.teamSize === 'large') weeks *= 0.8;
    if (context.constraints.teamSize === 'small') weeks *= 1.3;

    // Adjust based on experience
    if (context.experienceLevel === 'expert') weeks *= 0.9;
    if (context.experienceLevel === 'beginner') weeks *= 1.2;

    if (weeks <= 1) return '1 week';
    if (weeks <= 2) return '1-2 weeks';
    if (weeks <= 4) return '2-4 weeks';
    if (weeks <= 8) return '1-2 months';
    return '2+ months';
  }

  private calculateSuccessProbability(rec: RecommendationBase, context: UserContext): number {
    let probability = rec.historicalSuccessRate;

    // Adjust based on constraints fit
    const constraintsFit = this.calculateConstraintsFit(rec, context);
    probability += (constraintsFit - 70) * 0.3;

    // Adjust based on preference alignment
    const preferenceAlignment = this.calculatePreferenceAlignment(rec, context);
    probability += (preferenceAlignment - 50) * 0.2;

    return Math.min(95, Math.max(20, probability));
  }

  private calculateROIEstimate(rec: RecommendationBase, context: UserContext): string {
    const impactValue = rec.impactScore * 10;
    const effortCost = rec.effortScore * 5;
    const roi = ((impactValue - effortCost) / effortCost) * 100;

    if (roi > 200) return 'Very High (200%+)';
    if (roi > 100) return 'High (100-200%)';
    if (roi > 50) return 'Medium (50-100%)';
    if (roi > 0) return 'Low (0-50%)';
    return 'Negative ROI';
  }

  // Utility methods
  private isRecommendationRelevantToArea(rec: RecommendationBase, areaId: string): boolean {
    const areaMapping = {
      'strategy-plans': ['content', 'personalization'],
      'dxp-tools': ['technology', 'personalization'],
      'experience-optimization': ['ux', 'experimentation', 'personalization', 'content']
    };
    return areaMapping[areaId as keyof typeof areaMapping]?.includes(rec.category) || false;
  }

  private isRecommendationRelevantToTab(rec: RecommendationBase, tabId: string): boolean {
    // Map tab IDs to recommendation categories
    return true; // For now, allow all recommendations in all tabs
  }

  // Additional helper methods for formatting and generation
  private formatExpectedImpact(rec: RecommendationBase, context: UserContext): string {
    const primaryOutcome = rec.expectedOutcomes.primary;
    const topMetric = rec.expectedOutcomes.metrics[0];
    return `${primaryOutcome}: ${topMetric?.expectedChange} (${topMetric?.confidence}% confidence)`;
  }

  private formatImplementationEffort(rec: RecommendationBase, context: UserContext): string {
    const timeline = this.estimateTimeline(rec, context);
    const effort = rec.effortScore <= 3 ? 'Low' : rec.effortScore <= 6 ? 'Medium' : 'High';
    return `${effort} effort, ${timeline} timeline`;
  }

  private formatRiskAssessment(rec: RecommendationBase, context: UserContext): string {
    const risk = rec.riskLevel;
    const mitigation = rec.riskLevel === 'high' ? 'Requires careful planning' :
                      rec.riskLevel === 'medium' ? 'Standard precautions' :
                      'Low risk implementation';
    return `${risk.toUpperCase()} risk - ${mitigation}`;
  }

  private identifySuccessFactors(rec: RecommendationBase, context: UserContext): string[] {
    const factors = [];

    if (rec.prerequisites?.length) {
      factors.push(`Ensure prerequisites: ${rec.prerequisites.slice(0, 2).join(', ')}`);
    }

    if (context.constraints.teamSize === 'small' && rec.complexity !== 'simple') {
      factors.push('Consider external support for complex implementation');
    }

    if (rec.synergies?.length) {
      factors.push(`Coordinate with: ${rec.synergies.slice(0, 2).join(', ')}`);
    }

    factors.push('Regular progress monitoring and stakeholder communication');

    return factors.slice(0, 3);
  }

  private generateReasonForRecommendation(rec: RecommendationBase, context: UserContext, score: number): string {
    const reasons = [];

    if (score > 80) {
      reasons.push(`Excellent fit for ${context.role} role`);
    }

    if (rec.historicalSuccessRate > 80) {
      reasons.push(`High success rate (${rec.historicalSuccessRate}%)`);
    }

    if (rec.type === 'quick_win' && context.preferences.preferredApproach === 'incremental') {
      reasons.push('Aligns with incremental improvement approach');
    }

    if (context.currentFocus.includes(rec.category)) {
      reasons.push('Matches current focus area');
    }

    return reasons.slice(0, 2).join('. ') || 'Strong strategic alignment with objectives';
  }

  private generateRoleSpecificBenefits(rec: RecommendationBase, context: UserContext): string[] {
    const role = context.role;
    const benefits = [];

    switch (role) {
      case 'Executive':
        benefits.push(`ROI: ${this.calculateROIEstimate(rec, context)}`);
        benefits.push('Strategic competitive advantage');
        benefits.push('Measurable business impact');
        break;
      case 'Marketing Manager':
        benefits.push('Improved campaign performance');
        benefits.push('Better customer engagement');
        benefits.push('Enhanced conversion rates');
        break;
      case 'UX Designer':
        benefits.push('Enhanced user experience');
        benefits.push('Reduced user friction');
        benefits.push('Improved usability metrics');
        break;
      case 'Technical Lead':
        benefits.push('Scalable technical solution');
        benefits.push('Reduced maintenance overhead');
        benefits.push('Improved system performance');
        break;
      default:
        benefits.push('Improved operational efficiency');
        benefits.push('Better data insights');
        benefits.push('Enhanced user satisfaction');
    }

    return benefits.slice(0, 3);
  }

  private generateNextSteps(rec: RecommendationBase, context: UserContext): string[] {
    const steps = [];

    if (rec.prerequisites?.length) {
      steps.push(`Verify prerequisites: ${rec.prerequisites[0]}`);
    }

    steps.push('Review detailed implementation plan');
    steps.push('Allocate necessary resources');

    if (rec.complexity === 'complex' || rec.complexity === 'expert') {
      steps.push('Consider expert consultation');
    }

    steps.push('Set up success metrics tracking');

    return steps.slice(0, 4);
  }

  // Helper methods for estimates
  private estimateBudgetRequirement(rec: RecommendationBase): 'low' | 'medium' | 'high' {
    if (rec.effortScore <= 3 && rec.complexity === 'simple') return 'low';
    if (rec.effortScore >= 7 || rec.complexity === 'expert') return 'high';
    return 'medium';
  }

  private estimateTeamRequirement(rec: RecommendationBase): 'small' | 'medium' | 'large' {
    if (rec.resourceRequirements.length <= 2) return 'small';
    if (rec.resourceRequirements.length >= 5) return 'large';
    return 'medium';
  }

  private getComplexityMatch(complexity: string, experienceLevel: string): number {
    const matchMatrix = {
      'beginner': { 'simple': 10, 'moderate': 0, 'complex': -10, 'expert': -20 },
      'intermediate': { 'simple': 5, 'moderate': 10, 'complex': 0, 'expert': -10 },
      'expert': { 'simple': 0, 'moderate': 5, 'complex': 10, 'expert': 10 }
    };
    return matchMatrix[experienceLevel as keyof typeof matchMatrix][complexity as keyof typeof matchMatrix['beginner']] || 0;
  }

  /**
   * Get built-in recommendation database
   */
  private getBuiltinRecommendations(): RecommendationBase[] {
    return [
      {
        id: 'content-personalization-basic',
        title: 'Implement Basic Content Personalization',
        description: 'Set up audience-based content recommendations using existing customer data',
        category: 'content',
        type: 'quick_win',
        impactScore: 7,
        effortScore: 4,
        riskLevel: 'low',
        complexity: 'moderate',
        historicalSuccessRate: 85,
        averageImplementationTime: 3,
        resourceRequirements: ['Content Strategist', 'Frontend Developer'],
        expectedOutcomes: {
          primary: 'Increase content engagement by 20-35%',
          secondary: ['Improved time on page', 'Higher conversion rates'],
          metrics: [
            { name: 'Engagement Rate', expectedChange: '+25%', confidence: 87, timeline: '2-4 weeks' },
            { name: 'Conversion Rate', expectedChange: '+12%', confidence: 82, timeline: '4-6 weeks' }
          ]
        },
        synergies: ['audience-segmentation-advanced', 'analytics-dashboard-setup']
      },
      {
        id: 'mobile-optimization-priority',
        title: 'Mobile-First Experience Optimization',
        description: 'Optimize critical user journeys for mobile devices with focus on speed and usability',
        category: 'ux',
        type: 'strategic',
        impactScore: 8,
        effortScore: 6,
        riskLevel: 'medium',
        complexity: 'moderate',
        historicalSuccessRate: 78,
        averageImplementationTime: 5,
        resourceRequirements: ['UX Designer', 'Frontend Developer', 'Mobile Specialist'],
        expectedOutcomes: {
          primary: 'Improve mobile conversion rate by 18-25%',
          secondary: ['Reduced bounce rate', 'Better Core Web Vitals'],
          metrics: [
            { name: 'Mobile Conversion Rate', expectedChange: '+22%', confidence: 83, timeline: '3-5 weeks' },
            { name: 'Page Load Speed', expectedChange: '+40% faster', confidence: 91, timeline: '2-3 weeks' },
            { name: 'Mobile Bounce Rate', expectedChange: '-15%', confidence: 79, timeline: '4-6 weeks' }
          ]
        },
        prerequisites: ['mobile-analytics-setup'],
        synergies: ['performance-monitoring', 'progressive-web-app']
      },
      {
        id: 'ab-testing-framework',
        title: 'Advanced A/B Testing Framework',
        description: 'Implement comprehensive experimentation platform with statistical rigor and automated insights',
        category: 'experimentation',
        type: 'infrastructure',
        impactScore: 9,
        effortScore: 7,
        riskLevel: 'medium',
        complexity: 'complex',
        historicalSuccessRate: 72,
        averageImplementationTime: 8,
        resourceRequirements: ['Data Scientist', 'Backend Developer', 'Frontend Developer', 'Marketing Analyst'],
        expectedOutcomes: {
          primary: 'Enable 3x faster experimentation velocity',
          secondary: ['Statistical significance automation', 'Real-time results monitoring'],
          metrics: [
            { name: 'Test Velocity', expectedChange: '+200%', confidence: 88, timeline: '6-8 weeks' },
            { name: 'Winner Detection Speed', expectedChange: '+150% faster', confidence: 85, timeline: '4-6 weeks' },
            { name: 'False Positive Rate', expectedChange: '-80%', confidence: 94, timeline: '2-3 weeks' }
          ]
        },
        prerequisites: ['analytics-infrastructure', 'statistical-training'],
        blockers: ['limited-traffic-volume'],
        synergies: ['personalization-engine', 'data-warehouse']
      },
      {
        id: 'roi-dashboard-executive',
        title: 'Executive ROI Analytics Dashboard',
        description: 'Create real-time executive dashboard showing business impact of optimization initiatives',
        category: 'technology',
        type: 'strategic',
        impactScore: 8,
        effortScore: 5,
        riskLevel: 'low',
        complexity: 'moderate',
        historicalSuccessRate: 89,
        averageImplementationTime: 4,
        resourceRequirements: ['Data Analyst', 'Dashboard Developer', 'Business Analyst'],
        expectedOutcomes: {
          primary: 'Increase executive visibility and buy-in by 60%',
          secondary: ['Faster decision making', 'Better resource allocation'],
          metrics: [
            { name: 'Decision Speed', expectedChange: '+45% faster', confidence: 82, timeline: '2-3 weeks' },
            { name: 'Budget Approval Rate', expectedChange: '+35%', confidence: 76, timeline: '4-6 weeks' },
            { name: 'Strategic Alignment Score', expectedChange: '+28%', confidence: 88, timeline: '3-4 weeks' }
          ]
        },
        synergies: ['automated-reporting', 'kpi-standardization']
      }
    ];
  }
}

// Enhanced recommendation interface with all scoring and personalization data
export interface EnhancedRecommendation extends RecommendationBase {
  finalScore: number;
  confidence: number;
  timeline: string;
  successProbability: number;
  roiEstimate: string;
  actionableMetrics: {
    expectedImpact: string;
    implementationEffort: string;
    riskAssessment: string;
    successFactors: string[];
  };
  personalization: {
    reasonForRecommendation: string;
    roleSpecificBenefits: string[];
    nextSteps: string[];
  };
}