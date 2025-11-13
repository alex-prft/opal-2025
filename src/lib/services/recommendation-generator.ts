/**
 * Recommendation Generator Service
 *
 * Generates intelligent recommendations based on OPAL agent outputs
 * Simulates enterprise decision-making logic with realistic mock data
 */

import {
  DecisionParameters,
  Recommendation,
  EvidenceItem,
  OpalAgentType,
  OpalAgentTypes,
  generateMockEvidence,
  calculateCombinedRatio,
  determineCategory,
  calculateConfidenceBreakdown,
  sortRecommendationsByPriority,
  filterRecommendationsByRisk
} from '@/lib/schemas/decision-layer-schemas';

// Mock recommendation templates based on OPAL agent insights
const RECOMMENDATION_TEMPLATES = [
  {
    title: 'Optimize Call-to-Action Placement',
    description: 'Move primary CTAs above the fold to increase visibility and conversions',
    baseImpact: 8,
    baseEffort: 3,
    primaryAgents: ['content_review', 'customer_journey', 'experiment_blueprinter'],
    businessObjectives: ['conversion', 'engagement'],
    tags: ['CTA', 'conversion optimization', 'UX']
  },
  {
    title: 'Implement Dynamic Personalization',
    description: 'Use behavioral data to personalize content and product recommendations',
    baseImpact: 9,
    baseEffort: 7,
    primaryAgents: ['personalization_idea_generator', 'audience_suggester', 'customer_journey'],
    businessObjectives: ['personalization', 'engagement', 'retention'],
    tags: ['personalization', 'AI', 'customer experience']
  },
  {
    title: 'A/B Test Email Subject Lines',
    description: 'Test different subject line strategies to improve email open rates',
    baseImpact: 6,
    baseEffort: 2,
    primaryAgents: ['experiment_blueprinter', 'cmp_organizer', 'content_review'],
    businessObjectives: ['engagement', 'conversion'],
    tags: ['email marketing', 'A/B testing', 'content']
  },
  {
    title: 'Improve Mobile Page Speed',
    description: 'Optimize mobile performance to reduce bounce rates and improve SEO',
    baseImpact: 7,
    baseEffort: 5,
    primaryAgents: ['integration_health', 'customer_journey', 'geo_audit'],
    businessObjectives: ['performance', 'experience', 'acquisition'],
    tags: ['performance', 'mobile', 'technical SEO']
  },
  {
    title: 'Segment High-Value Customers',
    description: 'Create targeted campaigns for customers with highest lifetime value',
    baseImpact: 8,
    baseEffort: 4,
    primaryAgents: ['audience_suggester', 'cmp_organizer', 'customer_journey'],
    businessObjectives: ['revenue', 'retention', 'personalization'],
    tags: ['segmentation', 'customer value', 'targeting']
  },
  {
    title: 'Implement Exit-Intent Popups',
    description: 'Capture abandoning visitors with targeted offers and content',
    baseImpact: 5,
    baseEffort: 3,
    primaryAgents: ['customer_journey', 'content_review', 'experiment_blueprinter'],
    businessObjectives: ['conversion', 'retention'],
    tags: ['conversion', 'popup', 'abandonment']
  },
  {
    title: 'Optimize Product Recommendation Engine',
    description: 'Enhance recommendation algorithm using collaborative filtering',
    baseImpact: 9,
    baseEffort: 8,
    primaryAgents: ['personalization_idea_generator', 'audience_suggester', 'integration_health'],
    businessObjectives: ['revenue', 'personalization', 'engagement'],
    tags: ['recommendations', 'machine learning', 'personalization']
  },
  {
    title: 'Localize Content for Key Markets',
    description: 'Adapt content and messaging for high-performing geographic regions',
    baseImpact: 7,
    baseEffort: 6,
    primaryAgents: ['geo_audit', 'content_review', 'cmp_organizer'],
    businessObjectives: ['acquisition', 'engagement', 'revenue'],
    tags: ['localization', 'geographic', 'content']
  },
  {
    title: 'Streamline Checkout Process',
    description: 'Reduce checkout steps and form fields to minimize cart abandonment',
    baseImpact: 8,
    baseEffort: 4,
    primaryAgents: ['customer_journey', 'experiment_blueprinter', 'content_review'],
    businessObjectives: ['conversion', 'experience'],
    tags: ['checkout', 'conversion', 'UX optimization']
  },
  {
    title: 'Implement Social Proof Elements',
    description: 'Add customer reviews, testimonials, and usage counters to build trust',
    baseImpact: 6,
    baseEffort: 2,
    primaryAgents: ['content_review', 'customer_journey', 'cmp_organizer'],
    businessObjectives: ['conversion', 'engagement'],
    tags: ['social proof', 'trust', 'conversion']
  },
  {
    title: 'Create Automated Drip Campaigns',
    description: 'Build nurturing email sequences based on customer behavior',
    baseImpact: 7,
    baseEffort: 5,
    primaryAgents: ['cmp_organizer', 'customer_journey', 'audience_suggester'],
    businessObjectives: ['retention', 'engagement', 'conversion'],
    tags: ['email automation', 'nurturing', 'lifecycle marketing']
  },
  {
    title: 'Optimize Search Functionality',
    description: 'Improve site search with autocomplete, filters, and better results',
    baseImpact: 6,
    baseEffort: 6,
    primaryAgents: ['customer_journey', 'integration_health', 'content_review'],
    businessObjectives: ['experience', 'conversion'],
    tags: ['search', 'findability', 'UX']
  }
];

/**
 * Generate realistic recommendations based on decision parameters
 */
export class RecommendationGenerator {

  /**
   * Generate recommendations for a workflow
   */
  static async generateRecommendations(params: DecisionParameters): Promise<{
    recommendations: Recommendation[];
    metadata: any;
  }> {
    const startTime = Date.now();

    // Select relevant recommendation templates based on business objectives
    const relevantTemplates = RECOMMENDATION_TEMPLATES.filter(template =>
      template.businessObjectives.some(obj =>
        params.preferences.business_objectives.includes(obj as any)
      )
    );

    // If no specific matches, use all templates
    const templatesToUse = relevantTemplates.length > 0 ? relevantTemplates : RECOMMENDATION_TEMPLATES;

    // Generate 3-6 recommendations
    const numRecommendations = Math.min(
      3 + Math.floor(Math.random() * 4),
      templatesToUse.length
    );

    const selectedTemplates = this.shuffleArray([...templatesToUse]).slice(0, numRecommendations);

    // Generate recommendations from templates
    const recommendations: Recommendation[] = [];

    for (const template of selectedTemplates) {
      const recommendation = await this.generateRecommendationFromTemplate(template, params);
      recommendations.push(recommendation);
    }

    // Apply preference-based sorting and filtering
    let filteredRecommendations = filterRecommendationsByRisk(
      recommendations,
      params.preferences.risk_tolerance
    );

    const sortedRecommendations = sortRecommendationsByPriority(
      filteredRecommendations,
      params.preferences.priority_weights
    );

    // Calculate metadata
    const allEvidence = sortedRecommendations.flatMap(r => r.evidence);
    const timestamps = allEvidence.map(e => new Date(e.timestamp).getTime());

    const metadata = {
      total_recommendations: sortedRecommendations.length,
      generated_at: new Date().toISOString(),
      processing_time_ms: Date.now() - startTime,
      agent_data_freshness: allEvidence.length > 0 ? {
        oldest_evidence: new Date(Math.min(...timestamps)).toISOString(),
        newest_evidence: new Date(Math.max(...timestamps)).toISOString()
      } : undefined
    };

    return {
      recommendations: sortedRecommendations,
      metadata
    };
  }

  /**
   * Generate a single recommendation from a template
   */
  private static async generateRecommendationFromTemplate(
    template: any,
    params: DecisionParameters
  ): Promise<Recommendation> {
    // Generate evidence from multiple agents
    const evidence: EvidenceItem[] = [];

    // Add evidence from primary agents for this recommendation
    for (const agentType of template.primaryAgents) {
      const confidenceLevel = this.getConfidenceLevelForRisk(params.preferences.risk_tolerance);
      const evidenceItem = generateMockEvidence(agentType as OpalAgentType, confidenceLevel);
      evidence.push(evidenceItem);
    }

    // Add 1-2 additional evidence items from other agents
    const otherAgents = OpalAgentTypes.filter(agent => !template.primaryAgents.includes(agent));
    const numAdditional = 1 + Math.floor(Math.random() * 2);

    for (let i = 0; i < numAdditional && i < otherAgents.length; i++) {
      const randomAgent = otherAgents[Math.floor(Math.random() * otherAgents.length)];
      const confidenceLevel = this.getConfidenceLevelForRisk(params.preferences.risk_tolerance);
      const evidenceItem = generateMockEvidence(randomAgent, confidenceLevel);
      evidence.push(evidenceItem);
    }

    // Calculate impact and effort with some randomness
    const impactVariation = -1 + Math.random() * 2; // -1 to +1
    const effortVariation = -1 + Math.random() * 2;

    const impact = Math.max(1, Math.min(10, Math.round(template.baseImpact + impactVariation)));
    const effort = Math.max(1, Math.min(10, Math.round(template.baseEffort + effortVariation)));

    const combinedRatio = calculateCombinedRatio(impact, effort);
    const category = determineCategory(combinedRatio);

    // Calculate confidence from evidence
    const confidenceBreakdown = calculateConfidenceBreakdown(evidence);
    const overallConfidence = (confidenceBreakdown.data_quality + confidenceBreakdown.agent_consensus) / 2;

    // Generate estimated timeline based on effort
    const estimatedTimeline = this.generateEstimatedTimeline(effort, params.preferences.timeline_constraints);

    return {
      id: `rec-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      title: template.title,
      description: template.description,
      impact,
      effort,
      combined_ratio: combinedRatio,
      confidence: Math.round(overallConfidence * 100) / 100,
      confidence_breakdown: confidenceBreakdown,
      category,
      evidence,
      tags: template.tags,
      estimated_timeline: estimatedTimeline,
      risk_level: this.assessRiskLevel(impact, effort, overallConfidence)
    };
  }

  /**
   * Get confidence level based on risk tolerance
   */
  private static getConfidenceLevelForRisk(riskTolerance: string): 'high' | 'medium' | 'low' {
    const random = Math.random();

    switch (riskTolerance) {
      case 'low':
        return random < 0.7 ? 'high' : 'medium'; // Prefer high confidence
      case 'medium':
        return random < 0.4 ? 'high' : (random < 0.8 ? 'medium' : 'low'); // Balanced
      case 'high':
        return random < 0.3 ? 'high' : (random < 0.6 ? 'medium' : 'low'); // Accept lower confidence
      default:
        return 'medium';
    }
  }

  /**
   * Generate estimated timeline based on effort and constraints
   */
  private static generateEstimatedTimeline(effort: number, constraints: any): string {
    const baseWeeks = Math.ceil(effort / 2); // Rough estimate: effort/2 weeks
    const startDate = new Date(constraints.start_date);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + (baseWeeks * 7));

    // Check if it fits within constraints
    const maxEndDate = new Date(constraints.end_date);
    if (endDate > maxEndDate) {
      return `${baseWeeks} weeks (may exceed timeline constraints)`;
    }

    return `${baseWeeks} weeks (${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]})`;
  }

  /**
   * Assess risk level for a recommendation
   */
  private static assessRiskLevel(impact: number, effort: number, confidence: number): 'low' | 'medium' | 'high' {
    // High impact, low effort, high confidence = low risk
    // Low impact, high effort, low confidence = high risk
    const riskScore = (effort / impact) + (1 - confidence);

    if (riskScore < 0.5) return 'low';
    if (riskScore < 1.0) return 'medium';
    return 'high';
  }

  /**
   * Shuffle array utility
   */
  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

/**
 * Workflow state simulation
 */
export class WorkflowStateManager {

  /**
   * Get workflow state based on workflow ID
   */
  static getWorkflowState(workflowId: string): 'in-progress' | 'completed' | 'failed' | 'pending' {
    // Simulate different workflow states based on ID patterns
    if (workflowId.includes('pending')) return 'pending';
    if (workflowId.includes('failed')) return 'failed';
    if (workflowId.includes('complete')) return 'completed';

    // Default to in-progress for most workflows
    return Math.random() < 0.8 ? 'in-progress' : 'completed';
  }

  /**
   * Validate if workflow exists (mock validation)
   */
  static async validateWorkflow(workflowId: string): Promise<{ exists: boolean; state?: string }> {
    // Simulate async workflow lookup
    await new Promise(resolve => setTimeout(resolve, 50));

    // Mock validation logic
    if (workflowId.length < 3) {
      return { exists: false };
    }

    return {
      exists: true,
      state: this.getWorkflowState(workflowId)
    };
  }
}