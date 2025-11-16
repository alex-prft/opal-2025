/**
 * Agent Output Standardization System
 *
 * This module provides standardization functions that transform raw agent outputs
 * into the structured, validated format defined in agent-data-enhanced.ts.
 *
 * It serves as a crucial bridge between OPAL agent outputs and OSA's enhanced
 * data processing pipeline.
 */

import {
  AgentDataPayload,
  BaseAgentData,
  ContentReviewAgentData,
  AudienceSuggesterAgentData,
  ExperimentBlueprintAgentData,
  PersonalizationAgentData,
  RoadmapGeneratorAgentData,
  CustomerJourneyAgentData,
  GeoAuditAgentData,
  IntegrationHealthAgentData,
  CmpOrganizerAgentData,
  RoadmapPhase
} from '@/types/agent-data-enhanced';

// ============================================================================
// CORE STANDARDIZATION FUNCTION
// ============================================================================

export function standardizeAgentOutput(
  agentId: BaseAgentData['agent_type'],
  rawData: any
): AgentDataPayload {
  const base: Omit<BaseAgentData, 'agent_type'> = {
    agent_id: agentId,
    execution_timestamp: new Date().toISOString(),
    confidence_score: calculateConfidenceScore(rawData),
    data_quality_metrics: assessDataQuality(rawData)
  };

  switch (agentId) {
    case 'content_review':
      return {
        ...base,
        agent_type: 'content_review',
        ...normalizeContentReviewData(rawData)
      };

    case 'audience_suggester':
      return {
        ...base,
        agent_type: 'audience_suggester',
        ...normalizeAudienceData(rawData)
      };

    case 'experiment_blueprinter':
      return {
        ...base,
        agent_type: 'experiment_blueprinter',
        ...normalizeExperimentData(rawData)
      };

    case 'personalization_generator':
      return {
        ...base,
        agent_type: 'personalization_generator',
        ...normalizePersonalizationData(rawData)
      };

    case 'roadmap_generator':
      return {
        ...base,
        agent_type: 'roadmap_generator',
        ...normalizeRoadmapData(rawData)
      };

    case 'customer_journey':
      return {
        ...base,
        agent_type: 'customer_journey',
        ...normalizeCustomerJourneyData(rawData)
      };

    case 'geo_audit':
      return {
        ...base,
        agent_type: 'geo_audit',
        ...normalizeGeoAuditData(rawData)
      };

    case 'integration_health':
      return {
        ...base,
        agent_type: 'integration_health',
        ...normalizeIntegrationHealthData(rawData)
      };

    case 'cmp_organizer':
      return {
        ...base,
        agent_type: 'cmp_organizer',
        ...normalizeCmpOrganizerData(rawData)
      };

    default:
      throw new Error(`Unknown agent type: ${agentId}`);
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate confidence score based on data completeness and quality indicators
 */
export function calculateConfidenceScore(rawData: any): number {
  if (!rawData || typeof rawData !== 'object') {
    return 0.1; // Very low confidence for invalid data
  }

  let score = 0.5; // Base score

  // Boost confidence based on data completeness
  const fields = Object.keys(rawData);
  if (fields.length > 5) score += 0.2;
  if (fields.length > 10) score += 0.1;

  // Check for quality indicators
  if (rawData.success === true) score += 0.1;
  if (rawData.execution_time_ms && rawData.execution_time_ms < 60000) score += 0.05; // Fast execution
  if (rawData.data_sources && Array.isArray(rawData.data_sources) && rawData.data_sources.length > 0) score += 0.1;

  // Penalty for error indicators
  if (rawData.success === false) score -= 0.2;
  if (rawData.errors && rawData.errors.length > 0) score -= 0.1;
  if (rawData.warnings && rawData.warnings.length > 2) score -= 0.05;

  // Ensure score is within valid range
  return Math.max(0.1, Math.min(1.0, score));
}

/**
 * Assess data quality metrics for an agent output
 */
export function assessDataQuality(rawData: any): {
  completeness: number;
  freshness: number;
  consistency: number;
} {
  if (!rawData || typeof rawData !== 'object') {
    return { completeness: 0.1, freshness: 0.1, consistency: 0.1 };
  }

  // Completeness: How much expected data is present
  const expectedFields = ['success', 'agent_data', 'execution_time_ms'];
  const presentFields = expectedFields.filter(field => rawData[field] !== undefined);
  const completeness = presentFields.length / expectedFields.length;

  // Freshness: How recent is the data
  const now = new Date();
  let freshness = 1.0;

  if (rawData.timestamp || rawData.execution_timestamp) {
    const dataTime = new Date(rawData.timestamp || rawData.execution_timestamp);
    const ageHours = (now.getTime() - dataTime.getTime()) / (1000 * 60 * 60);

    if (ageHours < 1) freshness = 1.0;
    else if (ageHours < 24) freshness = 0.9;
    else if (ageHours < 168) freshness = 0.7; // 1 week
    else freshness = 0.4;
  }

  // Consistency: Data format and type consistency
  let consistency = 0.8; // Base consistency score

  // Check for consistent data types
  if (rawData.agent_data && typeof rawData.agent_data === 'object') consistency += 0.1;
  if (rawData.success !== undefined && typeof rawData.success === 'boolean') consistency += 0.05;
  if (rawData.execution_time_ms && typeof rawData.execution_time_ms === 'number') consistency += 0.05;

  return {
    completeness: Math.max(0.1, Math.min(1.0, completeness)),
    freshness: Math.max(0.1, Math.min(1.0, freshness)),
    consistency: Math.max(0.1, Math.min(1.0, consistency))
  };
}

// ============================================================================
// AGENT-SPECIFIC NORMALIZERS
// ============================================================================

/**
 * Normalize content review agent raw data
 */
function normalizeContentReviewData(rawData: any): Omit<ContentReviewAgentData, keyof BaseAgentData> {
  const agentData = rawData.agent_data || rawData;

  return {
    content_quality_score: extractNumber(agentData.content_quality_score, 75),
    seo_optimization_score: extractNumber(agentData.seo_optimization_score, 70),
    readability_score: extractNumber(agentData.readability_score, 80),
    engagement_metrics: {
      avg_time_on_page: extractNumber(agentData.avg_time_on_page || agentData.engagement_metrics?.avg_time_on_page, 120),
      bounce_rate: extractNumber(agentData.bounce_rate || agentData.engagement_metrics?.bounce_rate, 0.45, 0, 1),
      conversion_rate: extractNumber(agentData.conversion_rate || agentData.engagement_metrics?.conversion_rate, 0.025, 0, 1)
    },
    recommendations: extractRecommendations(agentData.recommendations || agentData.content_recommendations)
  };
}

/**
 * Normalize audience suggester agent raw data
 */
function normalizeAudienceData(rawData: any): Omit<AudienceSuggesterAgentData, keyof BaseAgentData> {
  const agentData = rawData.agent_data || rawData;

  return {
    suggested_segments: extractSegments(agentData.suggested_segments || agentData.audience_segments || agentData.segments),
    personalization_opportunities: extractPersonalizationOpportunities(
      agentData.personalization_opportunities || agentData.opportunities || []
    )
  };
}

/**
 * Normalize experiment blueprinter agent raw data
 */
function normalizeExperimentData(rawData: any): Omit<ExperimentBlueprintAgentData, keyof BaseAgentData> {
  const agentData = rawData.agent_data || rawData;

  return {
    experiments: extractExperiments(agentData.experiments || agentData.experiment_proposals || []),
    testing_roadmap: extractTestingRoadmap(agentData.testing_roadmap || agentData.roadmap || [])
  };
}

/**
 * Normalize personalization generator agent raw data
 */
function normalizePersonalizationData(rawData: any): Omit<PersonalizationAgentData, keyof BaseAgentData> {
  const agentData = rawData.agent_data || rawData;

  return {
    experiences: extractExperiences(agentData.experiences || agentData.personalization_experiences || []),
    personalization_strategies: extractPersonalizationStrategies(
      agentData.personalization_strategies || agentData.strategies || []
    ),
    content_variations: extractContentVariations(
      agentData.content_variations || agentData.variations || []
    )
  };
}

/**
 * Normalize roadmap generator agent raw data
 */
function normalizeRoadmapData(rawData: any): Omit<RoadmapGeneratorAgentData, keyof BaseAgentData> {
  const agentData = rawData.agent_data || rawData;

  return {
    phases: extractRoadmapPhases(agentData.phases || agentData.implementation_phases || []),
    implementation_phases: extractImplementationPhases(agentData.implementation_phases || []),
    timeline_milestones: extractTimelineMilestones(agentData.timeline_milestones || agentData.milestones || [])
  };
}

/**
 * Normalize customer journey agent raw data
 */
function normalizeCustomerJourneyData(rawData: any): Omit<CustomerJourneyAgentData, keyof BaseAgentData> {
  const agentData = rawData.agent_data || rawData;

  return {
    stages: extractJourneyStages(agentData.stages || agentData.journey_stages || []),
    journey_stages: extractDetailedJourneyStages(agentData.journey_stages || agentData.detailed_stages || []),
    cross_channel_insights: extractCrossChannelInsights(agentData.cross_channel_insights || [])
  };
}

/**
 * Normalize geo audit agent raw data
 */
function normalizeGeoAuditData(rawData: any): Omit<GeoAuditAgentData, keyof BaseAgentData> {
  const agentData = rawData.agent_data || rawData;

  return {
    regions: extractRegions(agentData.regions || agentData.geographic_analysis || []),
    geographic_performance: extractGeographicPerformance(agentData.geographic_performance || []),
    underperforming_regions: extractArray(agentData.underperforming_regions || agentData.low_performance_regions || [])
  };
}

/**
 * Normalize integration health agent raw data
 */
function normalizeIntegrationHealthData(rawData: any): Omit<IntegrationHealthAgentData, keyof BaseAgentData> {
  const agentData = rawData.agent_data || rawData;

  return {
    checks: extractHealthChecks(agentData.checks || agentData.integration_status || agentData.health_checks || []),
    integration_status: extractIntegrationStatus(agentData.integration_status || []),
    performance_metrics: extractPerformanceMetrics(agentData.performance_metrics || agentData.metrics)
  };
}

/**
 * Normalize CMP organizer agent raw data
 */
function normalizeCmpOrganizerData(rawData: any): Omit<CmpOrganizerAgentData, keyof BaseAgentData> {
  const agentData = rawData.agent_data || rawData;

  return {
    content_clusters: extractContentClusters(agentData.content_clusters || agentData.clusters || []),
    campaign_workflows: extractCampaignWorkflows(agentData.campaign_workflows || agentData.workflows || []),
    automation_opportunities: extractAutomationOpportunities(
      agentData.automation_opportunities || agentData.opportunities || []
    )
  };
}

// ============================================================================
// EXTRACTION UTILITIES
// ============================================================================

function extractNumber(value: any, fallback: number, min?: number, max?: number): number {
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(num)) return fallback;

  let result = num;
  if (min !== undefined) result = Math.max(min, result);
  if (max !== undefined) result = Math.min(max, result);

  return result;
}

function extractArray<T>(value: any, fallback: T[] = []): T[] {
  return Array.isArray(value) ? value : fallback;
}

function extractRecommendations(recommendations: any): ContentReviewAgentData['recommendations'] {
  if (!Array.isArray(recommendations)) {
    return [{
      priority: 'medium' as const,
      category: 'General',
      description: 'No specific recommendations available from agent output',
      impact_estimate: 'Unknown impact'
    }];
  }

  return recommendations.map((rec: any) => ({
    priority: (['high', 'medium', 'low'].includes(rec.priority) ? rec.priority : 'medium') as 'high' | 'medium' | 'low',
    category: typeof rec.category === 'string' ? rec.category : 'General',
    description: typeof rec.description === 'string' ? rec.description : 'No description available',
    impact_estimate: typeof rec.impact_estimate === 'string' ? rec.impact_estimate : 'Impact not estimated'
  }));
}

function extractSegments(segments: any): AudienceSuggesterAgentData['suggested_segments'] {
  if (!Array.isArray(segments)) {
    return [{
      segment_name: 'Default Segment',
      criteria: { fallback: true },
      estimated_size: 10000,
      confidence_score: 0.5,
      potential_uplift: 10
    }];
  }

  return segments.map((seg: any) => ({
    segment_name: typeof seg.segment_name === 'string' ? seg.segment_name : `Segment ${Math.random().toString(36).substr(2, 5)}`,
    criteria: typeof seg.criteria === 'object' ? seg.criteria : {},
    estimated_size: extractNumber(seg.estimated_size, 5000),
    confidence_score: extractNumber(seg.confidence_score, 0.6, 0, 1),
    potential_uplift: extractNumber(seg.potential_uplift, 15)
  }));
}

function extractPersonalizationOpportunities(opportunities: any): AudienceSuggesterAgentData['personalization_opportunities'] {
  if (!Array.isArray(opportunities)) return [];

  return opportunities.map((opp: any) => ({
    segment_id: typeof opp.segment_id === 'string' ? opp.segment_id : 'unknown_segment',
    content_type: typeof opp.content_type === 'string' ? opp.content_type : 'general',
    strategy: typeof opp.strategy === 'string' ? opp.strategy : 'No strategy defined',
    expected_impact: extractNumber(opp.expected_impact, 10)
  }));
}

function extractExperiments(experiments: any): ExperimentBlueprintAgentData['experiments'] {
  if (!Array.isArray(experiments)) return [];

  return experiments.map((exp: any) => ({
    id: typeof exp.id === 'string' ? exp.id : `exp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name: typeof exp.name === 'string' ? exp.name : 'Unnamed Experiment',
    hypothesis: typeof exp.hypothesis === 'string' ? exp.hypothesis : 'No hypothesis provided',
    metric: typeof exp.metric === 'string' ? exp.metric : 'conversion_rate',
    estimated_uplift: exp.estimated_uplift ? extractNumber(exp.estimated_uplift, 10) : undefined,
    variations: Array.isArray(exp.variations) ? exp.variations : undefined,
    success_metrics: Array.isArray(exp.success_metrics) ? exp.success_metrics : undefined,
    testing_duration_days: exp.testing_duration_days ? extractNumber(exp.testing_duration_days, 14) : undefined
  }));
}

function extractTestingRoadmap(roadmap: any): ExperimentBlueprintAgentData['testing_roadmap'] {
  if (!Array.isArray(roadmap)) return undefined;

  return roadmap.map((phase: any) => ({
    phase: typeof phase.phase === 'string' ? phase.phase : 'Unknown Phase',
    experiments: Array.isArray(phase.experiments) ? phase.experiments : [],
    timeline: typeof phase.timeline === 'string' ? phase.timeline : 'TBD'
  }));
}

function extractExperiences(experiences: any): PersonalizationAgentData['experiences'] {
  if (!Array.isArray(experiences)) return [];

  return experiences.map((exp: any) => ({
    id: typeof exp.id === 'string' ? exp.id : `exp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    segment: typeof exp.segment === 'string' ? exp.segment : 'general',
    placement: typeof exp.placement === 'string' ? exp.placement : 'homepage',
    message: typeof exp.message === 'string' ? exp.message : 'Default message',
    personalization_type: ['content', 'layout', 'cta', 'product_rec'].includes(exp.personalization_type) ?
      exp.personalization_type : 'content',
    expected_lift: exp.expected_lift ? extractNumber(exp.expected_lift, 10) : undefined
  }));
}

function extractPersonalizationStrategies(strategies: any): PersonalizationAgentData['personalization_strategies'] {
  if (!Array.isArray(strategies)) return undefined;

  return strategies.map((strategy: any) => ({
    strategy_name: typeof strategy.strategy_name === 'string' ? strategy.strategy_name : 'Unnamed Strategy',
    target_segments: Array.isArray(strategy.target_segments) ? strategy.target_segments : [],
    implementation_complexity: ['low', 'medium', 'high'].includes(strategy.implementation_complexity) ?
      strategy.implementation_complexity : 'medium'
  }));
}

function extractContentVariations(variations: any): PersonalizationAgentData['content_variations'] {
  if (!Array.isArray(variations)) return undefined;

  return variations.map((variation: any) => ({
    variation_id: typeof variation.variation_id === 'string' ? variation.variation_id : `var_${Date.now()}`,
    original_content: typeof variation.original_content === 'string' ? variation.original_content : '',
    personalized_content: typeof variation.personalized_content === 'string' ? variation.personalized_content : '',
    target_criteria: typeof variation.target_criteria === 'object' ? variation.target_criteria : {}
  }));
}

function extractRoadmapPhases(phases: any): RoadmapPhase[] {
  if (!Array.isArray(phases)) {
    return [{
      phase: 'Phase 1: Planning',
      status: 'pending'
    }];
  }

  return phases.map((phase: any) => ({
    phase: typeof phase.phase === 'string' ? phase.phase : 'Unknown Phase',
    status: typeof phase.status === 'string' ? phase.status : 'pending',
    duration_weeks: phase.duration_weeks ? extractNumber(phase.duration_weeks, 4) : undefined,
    deliverables: Array.isArray(phase.deliverables) ? phase.deliverables : undefined,
    resources_required: Array.isArray(phase.resources_required) ? phase.resources_required : undefined
  }));
}

function extractImplementationPhases(phases: any): RoadmapGeneratorAgentData['implementation_phases'] {
  if (!Array.isArray(phases)) return undefined;

  return phases.map((phase: any) => ({
    phase_name: typeof phase.phase_name === 'string' ? phase.phase_name : 'Unknown Phase',
    duration_weeks: extractNumber(phase.duration_weeks, 4),
    deliverables: Array.isArray(phase.deliverables) ? phase.deliverables : [],
    resources_required: Array.isArray(phase.resources_required) ? phase.resources_required : [],
    dependencies: Array.isArray(phase.dependencies) ? phase.dependencies : undefined,
    success_criteria: Array.isArray(phase.success_criteria) ? phase.success_criteria : undefined
  }));
}

function extractTimelineMilestones(milestones: any): RoadmapGeneratorAgentData['timeline_milestones'] {
  if (!Array.isArray(milestones)) return undefined;

  return milestones.map((milestone: any) => ({
    milestone_name: typeof milestone.milestone_name === 'string' ? milestone.milestone_name : 'Milestone',
    target_date: typeof milestone.target_date === 'string' ? milestone.target_date : new Date().toISOString(),
    completion_criteria: Array.isArray(milestone.completion_criteria) ? milestone.completion_criteria : []
  }));
}

function extractJourneyStages(stages: any): CustomerJourneyAgentData['stages'] {
  if (!Array.isArray(stages)) {
    return [{
      stage: 'Awareness',
      issues: ['Limited brand visibility'],
      opportunities: ['Improve SEO and content marketing']
    }];
  }

  return stages.map((stage: any) => ({
    stage: typeof stage.stage === 'string' ? stage.stage : 'Unknown Stage',
    issues: Array.isArray(stage.issues) ? stage.issues : [],
    opportunities: Array.isArray(stage.opportunities) ? stage.opportunities : []
  }));
}

function extractDetailedJourneyStages(stages: any): CustomerJourneyAgentData['journey_stages'] {
  if (!Array.isArray(stages)) return undefined;

  return stages.map((stage: any) => ({
    stage_name: typeof stage.stage_name === 'string' ? stage.stage_name : 'Unknown Stage',
    touchpoints: Array.isArray(stage.touchpoints) ? stage.touchpoints : [],
    conversion_rate: extractNumber(stage.conversion_rate, 0.1, 0, 1),
    drop_off_rate: extractNumber(stage.drop_off_rate, 0.2, 0, 1),
    optimization_opportunities: Array.isArray(stage.optimization_opportunities) ? stage.optimization_opportunities : []
  }));
}

function extractCrossChannelInsights(insights: any): CustomerJourneyAgentData['cross_channel_insights'] {
  if (!Array.isArray(insights)) return undefined;

  return insights.map((insight: any) => ({
    channel_combination: Array.isArray(insight.channel_combination) ? insight.channel_combination : [],
    effectiveness_score: extractNumber(insight.effectiveness_score, 50),
    recommendations: Array.isArray(insight.recommendations) ? insight.recommendations : []
  }));
}

function extractRegions(regions: any): GeoAuditAgentData['regions'] {
  if (!Array.isArray(regions)) {
    return [{
      geo: 'North America',
      performance_index: 75,
      issues: ['Seasonal traffic variations']
    }];
  }

  return regions.map((region: any) => ({
    geo: typeof region.geo === 'string' ? region.geo : 'Unknown Region',
    performance_index: extractNumber(region.performance_index, 70),
    issues: Array.isArray(region.issues) ? region.issues : []
  }));
}

function extractGeographicPerformance(performance: any): GeoAuditAgentData['geographic_performance'] {
  if (!Array.isArray(performance)) return undefined;

  return performance.map((perf: any) => ({
    region: typeof perf.region === 'string' ? perf.region : 'Unknown Region',
    performance_score: extractNumber(perf.performance_score, 70),
    conversion_rate: extractNumber(perf.conversion_rate, 0.03, 0, 1),
    traffic_volume: extractNumber(perf.traffic_volume, 10000),
    optimization_opportunities: Array.isArray(perf.optimization_opportunities) ? perf.optimization_opportunities : []
  }));
}

function extractHealthChecks(checks: any): IntegrationHealthAgentData['checks'] {
  if (!Array.isArray(checks)) {
    return [{
      system: 'Optimizely DXP',
      status: 'passing' as const,
      details: 'System operational'
    }];
  }

  return checks.map((check: any) => ({
    system: typeof check.system === 'string' ? check.system : 'Unknown System',
    status: (['passing', 'warning', 'failing'].includes(check.status) ? check.status : 'warning') as 'passing' | 'warning' | 'failing',
    details: typeof check.details === 'string' ? check.details : undefined
  }));
}

function extractIntegrationStatus(status: any): IntegrationHealthAgentData['integration_status'] {
  if (!Array.isArray(status)) return undefined;

  return status.map((stat: any) => ({
    service_name: typeof stat.service_name === 'string' ? stat.service_name : 'Unknown Service',
    status: (['healthy', 'degraded', 'failing'].includes(stat.status) ? stat.status : 'degraded') as 'healthy' | 'degraded' | 'failing',
    response_time_ms: extractNumber(stat.response_time_ms, 200),
    uptime_percentage: extractNumber(stat.uptime_percentage, 99.5, 0, 100),
    last_check: typeof stat.last_check === 'string' ? stat.last_check : new Date().toISOString()
  }));
}

function extractPerformanceMetrics(metrics: any): IntegrationHealthAgentData['performance_metrics'] {
  if (!metrics || typeof metrics !== 'object') return undefined;

  return {
    avg_response_time: extractNumber(metrics.avg_response_time, 150),
    error_rate: extractNumber(metrics.error_rate, 0.01, 0, 1),
    throughput_per_minute: extractNumber(metrics.throughput_per_minute, 1000)
  };
}

function extractContentClusters(clusters: any): CmpOrganizerAgentData['content_clusters'] {
  if (!Array.isArray(clusters)) {
    return [{
      cluster_id: 'cluster_1',
      title: 'Default Content Cluster',
      items: ['Content item 1', 'Content item 2']
    }];
  }

  return clusters.map((cluster: any) => ({
    cluster_id: typeof cluster.cluster_id === 'string' ? cluster.cluster_id : `cluster_${Date.now()}`,
    title: typeof cluster.title === 'string' ? cluster.title : 'Untitled Cluster',
    items: Array.isArray(cluster.items) ? cluster.items : []
  }));
}

function extractCampaignWorkflows(workflows: any): CmpOrganizerAgentData['campaign_workflows'] {
  if (!Array.isArray(workflows)) return undefined;

  return workflows.map((workflow: any) => ({
    workflow_name: typeof workflow.workflow_name === 'string' ? workflow.workflow_name : 'Unnamed Workflow',
    automation_level: extractNumber(workflow.automation_level, 50, 0, 100),
    efficiency_score: extractNumber(workflow.efficiency_score, 75, 0, 100),
    steps: Array.isArray(workflow.steps) ? workflow.steps : []
  }));
}

function extractAutomationOpportunities(opportunities: any): CmpOrganizerAgentData['automation_opportunities'] {
  if (!Array.isArray(opportunities)) return undefined;

  return opportunities.map((opp: any) => ({
    opportunity_name: typeof opp.opportunity_name === 'string' ? opp.opportunity_name : 'Unnamed Opportunity',
    current_manual_effort: typeof opp.current_manual_effort === 'string' ? opp.current_manual_effort : 'Unknown effort',
    automation_potential: typeof opp.automation_potential === 'string' ? opp.automation_potential : 'Unknown potential',
    estimated_time_savings: typeof opp.estimated_time_savings === 'string' ? opp.estimated_time_savings : 'Unknown savings'
  }));
}