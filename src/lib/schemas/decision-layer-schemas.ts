/**
 * Decision Layer TypeScript Schemas
 *
 * Defines types and Zod validation schemas for the /api/recommendations endpoint
 * Integrates with OPAL workflow system and 9 agent types
 */

import { z } from 'zod';

// OPAL Agent Types (9 agents from your system)
export const OpalAgentTypes = [
  'experiment_blueprinter',
  'audience_suggester',
  'content_review',
  'roadmap_generator',
  'integration_health',
  'personalization_idea_generator',
  'cmp_organizer',
  'customer_journey',
  'geo_audit'
] as const;

export type OpalAgentType = typeof OpalAgentTypes[number];

// Risk tolerance levels
export const RiskToleranceLevels = ['low', 'medium', 'high'] as const;
export type RiskTolerance = typeof RiskToleranceLevels[number];

// Business objectives
export const BusinessObjectives = [
  'conversion',
  'retention',
  'engagement',
  'acquisition',
  'revenue',
  'personalization',
  'experience',
  'performance'
] as const;

export type BusinessObjective = typeof BusinessObjectives[number];

// Workflow states
export const WorkflowStates = ['in-progress', 'completed', 'failed', 'pending'] as const;
export type WorkflowState = typeof WorkflowStates[number];

// Priority weights schema
export const PriorityWeightsSchema = z.object({
  impact: z.number().min(0).max(1),
  effort: z.number().min(0).max(1)
}).refine(data => Math.abs(data.impact + data.effort - 1) < 0.01, {
  message: "Priority weights must sum to 1.0"
});

export type PriorityWeights = z.infer<typeof PriorityWeightsSchema>;

// Timeline constraints schema
export const TimelineConstraintsSchema = z.object({
  start_date: z.string().datetime(),
  end_date: z.string().datetime()
}).refine(data => new Date(data.end_date) > new Date(data.start_date), {
  message: "End date must be after start date"
});

export type TimelineConstraints = z.infer<typeof TimelineConstraintsSchema>;

// Decision preferences schema
export const DecisionPreferencesSchema = z.object({
  priority_weights: PriorityWeightsSchema,
  risk_tolerance: z.enum(RiskToleranceLevels),
  business_objectives: z.array(z.enum(BusinessObjectives)).min(1),
  timeline_constraints: TimelineConstraintsSchema
});

export type DecisionPreferences = z.infer<typeof DecisionPreferencesSchema>;

// Decision parameters schema (main input)
export const DecisionParametersSchema = z.object({
  workflow_id: z.string().min(1),
  preferences: DecisionPreferencesSchema
});

export type DecisionParameters = z.infer<typeof DecisionParametersSchema>;

// Evidence item schema
export const EvidenceItemSchema = z.object({
  agent_type: z.enum(OpalAgentTypes),
  data_source: z.string().min(1),
  confidence: z.number().min(0).max(1),
  timestamp: z.string().datetime(),
  summary: z.string().min(1).max(500)
});

export type EvidenceItem = z.infer<typeof EvidenceItemSchema>;

// Confidence breakdown schema
export const ConfidenceBreakdownSchema = z.object({
  data_quality: z.number().min(0).max(1),
  agent_consensus: z.number().min(0).max(1)
});

export type ConfidenceBreakdown = z.infer<typeof ConfidenceBreakdownSchema>;

// Recommendation schema
export const RecommendationSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  impact: z.number().int().min(1).max(10),
  effort: z.number().int().min(1).max(10),
  combined_ratio: z.number().positive(),
  confidence: z.number().min(0).max(1),
  confidence_breakdown: ConfidenceBreakdownSchema,
  category: z.enum(['High', 'Medium', 'Low']).optional(),
  evidence: z.array(EvidenceItemSchema).min(1),
  tags: z.array(z.string()).optional(),
  estimated_timeline: z.string().optional(),
  risk_level: z.enum(RiskToleranceLevels).optional()
});

export type Recommendation = z.infer<typeof RecommendationSchema>;

// Recommendations response schema
export const RecommendationsResponseSchema = z.object({
  workflow_id: z.string(),
  workflow_state: z.enum(WorkflowStates).optional(),
  recommendations: z.array(RecommendationSchema),
  metadata: z.object({
    total_recommendations: z.number().int().min(0),
    generated_at: z.string().datetime(),
    processing_time_ms: z.number().int().min(0),
    agent_data_freshness: z.object({
      oldest_evidence: z.string().datetime(),
      newest_evidence: z.string().datetime()
    }).optional()
  }).optional()
});

export type RecommendationsResponse = z.infer<typeof RecommendationsResponseSchema>;

/**
 * Utility functions for decision layer
 */

// Calculate combined ratio with bounds checking
export function calculateCombinedRatio(impact: number, effort: number): number {
  if (effort === 0) return 10; // Max ratio for zero effort
  return Math.round((impact / effort) * 100) / 100; // Round to 2 decimal places
}

// Determine category based on combined ratio
export function determineCategory(combinedRatio: number): 'High' | 'Medium' | 'Low' {
  if (combinedRatio >= 2.0) return 'High';
  if (combinedRatio >= 1.0) return 'Medium';
  return 'Low';
}

// Calculate overall confidence from evidence
export function calculateOverallConfidence(evidence: EvidenceItem[]): number {
  if (evidence.length === 0) return 0;

  const totalConfidence = evidence.reduce((sum, item) => sum + item.confidence, 0);
  return Math.round((totalConfidence / evidence.length) * 100) / 100;
}

// Calculate confidence breakdown
export function calculateConfidenceBreakdown(evidence: EvidenceItem[]): ConfidenceBreakdown {
  if (evidence.length === 0) {
    return { data_quality: 0, agent_consensus: 0 };
  }

  // Data quality: average confidence of all evidence
  const dataQuality = calculateOverallConfidence(evidence);

  // Agent consensus: how much agents agree (higher when evidence confidence is similar)
  const confidences = evidence.map(e => e.confidence);
  const mean = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
  const variance = confidences.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / confidences.length;
  const standardDev = Math.sqrt(variance);

  // Convert standard deviation to consensus score (lower stddev = higher consensus)
  const agentConsensus = Math.max(0, 1 - (standardDev * 2)); // Scale factor of 2

  return {
    data_quality: Math.round(dataQuality * 100) / 100,
    agent_consensus: Math.round(agentConsensus * 100) / 100
  };
}

// Sort recommendations by priority weights
export function sortRecommendationsByPriority(
  recommendations: Recommendation[],
  priorityWeights: PriorityWeights
): Recommendation[] {
  return [...recommendations].sort((a, b) => {
    const scoreA = (a.impact * priorityWeights.impact) + ((11 - a.effort) * priorityWeights.effort);
    const scoreB = (b.impact * priorityWeights.impact) + ((11 - b.effort) * priorityWeights.effort);
    return scoreB - scoreA; // Descending order
  });
}

// Filter recommendations by risk tolerance
export function filterRecommendationsByRisk(
  recommendations: Recommendation[],
  riskTolerance: RiskTolerance
): Recommendation[] {
  const riskThresholds = {
    low: 0.8,    // Only high confidence recommendations
    medium: 0.6, // Medium to high confidence
    high: 0.3    // Accept lower confidence recommendations
  };

  const threshold = riskThresholds[riskTolerance];
  return recommendations.filter(rec => rec.confidence >= threshold);
}

/**
 * Mock data generators for testing
 */

// Generate mock evidence for testing
export function generateMockEvidence(agentType: OpalAgentType, scenario: 'high' | 'medium' | 'low' = 'medium'): EvidenceItem {
  const confidenceLevels = {
    high: 0.85 + Math.random() * 0.15,   // 0.85-1.0
    medium: 0.6 + Math.random() * 0.25,  // 0.6-0.85
    low: 0.3 + Math.random() * 0.3       // 0.3-0.6
  };

  const dataSources = {
    experiment_blueprinter: 'Experimentation Platform',
    audience_suggester: 'Customer Data Platform',
    content_review: 'Content Management System',
    roadmap_generator: 'Strategic Planning Tool',
    integration_health: 'System Health Monitor',
    personalization_idea_generator: 'Personalization Engine',
    cmp_organizer: 'Campaign Management Platform',
    customer_journey: 'Journey Analytics',
    geo_audit: 'Geographic Analytics'
  };

  const summaries = {
    experiment_blueprinter: 'A/B test data shows significant improvement potential',
    audience_suggester: 'Audience segmentation reveals optimization opportunity',
    content_review: 'Content analysis identifies engagement improvement areas',
    roadmap_generator: 'Strategic roadmap indicates high-priority initiative',
    integration_health: 'System integration analysis suggests performance gains',
    personalization_idea_generator: 'Personalization algorithms recommend targeted changes',
    cmp_organizer: 'Campaign data indicates optimization potential',
    customer_journey: 'Journey mapping reveals friction points to address',
    geo_audit: 'Geographic analysis shows regional optimization opportunities'
  };

  const baseTime = new Date();
  baseTime.setMinutes(baseTime.getMinutes() - Math.random() * 1440); // Within last 24 hours

  return {
    agent_type: agentType,
    data_source: dataSources[agentType],
    confidence: Math.round(confidenceLevels[scenario] * 100) / 100,
    timestamp: baseTime.toISOString(),
    summary: summaries[agentType]
  };
}