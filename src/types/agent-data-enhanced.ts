/**
 * Enhanced Agent Data Interfaces for OSA OPAL Integration
 *
 * This file provides comprehensive, agent-specific data structures that enhance
 * the existing generic agent data system with detailed business intelligence.
 *
 * Integration with existing system:
 * - Maintains compatibility with current AgentDataPayload
 * - Adds agent-specific business metrics and insights
 * - Provides type safety for all 9 OPAL agents
 * - Supports validation system requirements
 */

// ============================================================================
// ROADMAP PHASE INTERFACE (from existing system)
// ============================================================================

export interface RoadmapPhase {
  phase: string;
  status: string;
  duration_weeks?: number;
  deliverables?: string[];
  resources_required?: string[];
}

// ============================================================================
// COMMON METADATA FOR ALL AGENTS
// ============================================================================

interface BaseAgentData {
  agent_id: string; // e.g. 'content_review'
  agent_type:
    | 'content_review'
    | 'audience_suggester'
    | 'experiment_blueprinter'
    | 'personalization_generator'
    | 'roadmap_generator'
    | 'customer_journey'
    | 'geo_audit'
    | 'integration_health'
    | 'cmp_organizer';
  execution_timestamp: string; // ISO 8601
  confidence_score: number;    // 0–1
  data_quality_metrics?: {
    completeness: number;  // 0–1
    freshness: number;     // 0–1
    consistency: number;   // 0–1
  };
}

// ============================================================================
// AGENT-SPECIFIC DATA STRUCTURES
// ============================================================================

// Content review agent
export interface ContentReviewAgentData extends BaseAgentData {
  agent_type: 'content_review';
  content_quality_score: number; // 0-100
  seo_optimization_score: number; // 0-100
  readability_score: number; // 0-100;
  engagement_metrics: {
    avg_time_on_page: number;
    bounce_rate: number;
    conversion_rate: number;
  };
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    category: string;
    description: string;
    impact_estimate: string;
  }[];
}

// Audience suggester agent
export interface AudienceSuggesterAgentData extends BaseAgentData {
  agent_type: 'audience_suggester';
  suggested_segments: {
    segment_name: string;
    criteria: Record<string, any>;
    estimated_size: number;
    confidence_score: number;
    potential_uplift: number;
  }[];
  personalization_opportunities: {
    segment_id: string;
    content_type: string;
    strategy: string;
    expected_impact: number;
  }[];
}

// Experiment blueprinter agent
export interface ExperimentBlueprintAgentData extends BaseAgentData {
  agent_type: 'experiment_blueprinter';
  experiments: {
    id: string;
    name: string;
    hypothesis: string;
    metric: string;
    estimated_uplift?: number;
    variations?: {
      name: string;
      description: string;
      allocation_percentage: number;
    }[];
    success_metrics?: string[];
    testing_duration_days?: number;
  }[];
  testing_roadmap?: {
    phase: string;
    experiments: string[];
    timeline: string;
  }[];
}

// Personalization generator agent
export interface PersonalizationAgentData extends BaseAgentData {
  agent_type: 'personalization_generator';
  experiences: {
    id: string;
    segment: string;
    placement: string;
    message: string;
    personalization_type?: 'content' | 'layout' | 'cta' | 'product_rec';
    expected_lift?: number;
  }[];
  personalization_strategies?: {
    strategy_name: string;
    target_segments: string[];
    implementation_complexity: 'low' | 'medium' | 'high';
  }[];
  content_variations?: {
    variation_id: string;
    original_content: string;
    personalized_content: string;
    target_criteria: Record<string, any>;
  }[];
}

// Roadmap generator agent
export interface RoadmapGeneratorAgentData extends BaseAgentData {
  agent_type: 'roadmap_generator';
  phases: RoadmapPhase[];
  implementation_phases?: {
    phase_name: string;
    duration_weeks: number;
    deliverables: string[];
    resources_required: string[];
    dependencies?: string[];
    success_criteria?: string[];
  }[];
  timeline_milestones?: {
    milestone_name: string;
    target_date: string;
    completion_criteria: string[];
  }[];
}

// Customer journey agent
export interface CustomerJourneyAgentData extends BaseAgentData {
  agent_type: 'customer_journey';
  stages: {
    stage: string;
    issues: string[];
    opportunities: string[];
  }[];
  journey_stages?: {
    stage_name: string;
    touchpoints: string[];
    conversion_rate: number;
    drop_off_rate: number;
    optimization_opportunities: string[];
  }[];
  cross_channel_insights?: {
    channel_combination: string[];
    effectiveness_score: number;
    recommendations: string[];
  }[];
}

// Geo audit agent
export interface GeoAuditAgentData extends BaseAgentData {
  agent_type: 'geo_audit';
  regions: {
    geo: string;
    performance_index: number;
    issues: string[];
  }[];
  geographic_performance?: {
    region: string;
    performance_score: number;
    conversion_rate: number;
    traffic_volume: number;
    optimization_opportunities: string[];
  }[];
  underperforming_regions?: string[];
}

// Integration health agent
export interface IntegrationHealthAgentData extends BaseAgentData {
  agent_type: 'integration_health';
  checks: {
    system: string;
    status: 'passing' | 'warning' | 'failing';
    details?: string;
  }[];
  integration_status?: {
    service_name: string;
    status: 'healthy' | 'degraded' | 'failing';
    response_time_ms: number;
    uptime_percentage: number;
    last_check: string;
  }[];
  performance_metrics?: {
    avg_response_time: number;
    error_rate: number;
    throughput_per_minute: number;
  };
}

// CMP organizer agent
export interface CmpOrganizerAgentData extends BaseAgentData {
  agent_type: 'cmp_organizer';
  content_clusters: {
    cluster_id: string;
    title: string;
    items: string[];
  }[];
  campaign_workflows?: {
    workflow_name: string;
    automation_level: number; // 0-100
    efficiency_score: number; // 0-100
    steps: string[];
  }[];
  automation_opportunities?: {
    opportunity_name: string;
    current_manual_effort: string;
    automation_potential: string;
    estimated_time_savings: string;
  }[];
}

// ============================================================================
// ENHANCED UNION TYPE
// ============================================================================

export type AgentDataPayload =
  | ContentReviewAgentData
  | AudienceSuggesterAgentData
  | ExperimentBlueprintAgentData
  | PersonalizationAgentData
  | RoadmapGeneratorAgentData
  | CustomerJourneyAgentData
  | GeoAuditAgentData
  | IntegrationHealthAgentData
  | CmpOrganizerAgentData;

// ============================================================================
// COMPATIBILITY LAYER WITH EXISTING SYSTEM
// ============================================================================

/**
 * Compatibility interface that bridges enhanced agent data with existing OSA system
 */
export interface OSACompatibleAgentPayload {
  // Enhanced agent-specific data
  enhanced_data: AgentDataPayload;

  // Existing OSA fields (maintained for backward compatibility)
  success: boolean;
  agent_id: string;
  dataSentToOSA: Record<string, any>;
  optimizelyDxpTools: string[];
  strategyAssistance: {
    recommendations: string[];
  };
  opalCustomTools: {
    toolName: string;
    description: string;
  }[];
  osaSuggestions: {
    recommendationService: string[];
    knowledgeRetrievalService: string[];
    preferencesPolicyService: string[];
  };
  useCaseScenarios?: string[];
  nextBestActions?: string[];
  lastDataSent?: string;
  timestamp: string;
}

// ============================================================================
// AGENT TYPE GUARDS
// ============================================================================

export function isContentReviewAgent(agent: AgentDataPayload): agent is ContentReviewAgentData {
  return agent.agent_type === 'content_review';
}

export function isAudienceSuggesterAgent(agent: AgentDataPayload): agent is AudienceSuggesterAgentData {
  return agent.agent_type === 'audience_suggester';
}

export function isExperimentBlueprintAgent(agent: AgentDataPayload): agent is ExperimentBlueprintAgentData {
  return agent.agent_type === 'experiment_blueprinter';
}

export function isPersonalizationAgent(agent: AgentDataPayload): agent is PersonalizationAgentData {
  return agent.agent_type === 'personalization_generator';
}

export function isRoadmapGeneratorAgent(agent: AgentDataPayload): agent is RoadmapGeneratorAgentData {
  return agent.agent_type === 'roadmap_generator';
}

export function isCustomerJourneyAgent(agent: AgentDataPayload): agent is CustomerJourneyAgentData {
  return agent.agent_type === 'customer_journey';
}

export function isGeoAuditAgent(agent: AgentDataPayload): agent is GeoAuditAgentData {
  return agent.agent_type === 'geo_audit';
}

export function isIntegrationHealthAgent(agent: AgentDataPayload): agent is IntegrationHealthAgentData {
  return agent.agent_type === 'integration_health';
}

export function isCmpOrganizerAgent(agent: AgentDataPayload): agent is CmpOrganizerAgentData {
  return agent.agent_type === 'cmp_organizer';
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validates that an agent data payload has the required base fields
 */
export function validateBaseAgentData(data: any): data is BaseAgentData {
  return (
    typeof data === 'object' &&
    typeof data.agent_id === 'string' &&
    typeof data.agent_type === 'string' &&
    typeof data.execution_timestamp === 'string' &&
    typeof data.confidence_score === 'number' &&
    data.confidence_score >= 0 && data.confidence_score <= 1
  );
}

/**
 * Extracts business metrics from enhanced agent data for dashboard display
 */
export function extractBusinessMetrics(agent: AgentDataPayload): Record<string, any> {
  switch (agent.agent_type) {
    case 'content_review':
      return {
        content_quality: agent.content_quality_score,
        seo_score: agent.seo_optimization_score,
        readability: agent.readability_score,
        engagement: agent.engagement_metrics
      };

    case 'audience_suggester':
      return {
        segments_found: agent.suggested_segments.length,
        avg_segment_size: agent.suggested_segments.reduce((sum, seg) => sum + seg.estimated_size, 0) / agent.suggested_segments.length,
        opportunities: agent.personalization_opportunities.length
      };

    case 'experiment_blueprinter':
      return {
        experiments_proposed: agent.experiments.length,
        avg_estimated_uplift: agent.experiments.reduce((sum, exp) => sum + (exp.estimated_uplift || 0), 0) / agent.experiments.length
      };

    case 'integration_health':
      return {
        systems_checked: agent.checks.length,
        passing_checks: agent.checks.filter(check => check.status === 'passing').length,
        health_score: (agent.checks.filter(check => check.status === 'passing').length / agent.checks.length) * 100
      };

    default:
      return {
        confidence: agent.confidence_score,
        timestamp: agent.execution_timestamp
      };
  }
}

// ============================================================================
// EXPORT COMPATIBILITY
// ============================================================================

// Re-export existing types for backward compatibility
export type { AgentDataPayload as LegacyAgentDataPayload } from './agent-data';
export { AGENT_ROUTES, AGENT_NAMES } from './agent-data';