// OSA Opal Database Types
// Auto-generated TypeScript interfaces for Opal workflow and insights management
// Based on schema.sql - Keep in sync with database schema

export type WorkflowStatus = 'triggered' | 'running' | 'completed' | 'failed' | 'cancelled';
export type AgentStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
export type TriggerType = 'form_submission' | 'daily_sync' | 'force_sync';
export type DXPPlatform = 'odp' | 'content_recs' | 'cms' | 'cmp' | 'webx';

// =====================================================
// CORE WORKFLOW TYPES
// =====================================================

export interface OpalWorkflowExecution {
  id: string;
  session_id: string;
  status: WorkflowStatus;

  // Form Data (from /engine submission)
  client_name: string;
  industry?: string;
  company_size?: string;
  current_capabilities?: string[];
  business_objectives?: string[];
  additional_marketing_technology?: string[];
  timeline_preference?: string;
  budget_range?: string;
  recipients?: string[];

  // Execution Metadata
  triggered_by: TriggerType;
  trigger_timestamp: Date;
  started_at?: Date;
  completed_at?: Date;
  failed_at?: Date;
  error_message?: string;

  // Progress Tracking
  current_step?: string;
  progress_percentage: number;
  expected_agents?: string[];
  completed_agents: string[];
  failed_agents: string[];

  // Scheduling
  scheduled_for?: Date;
  last_sync_at?: Date;
  force_sync_requested: boolean;

  created_at: Date;
  updated_at: Date;
}

export interface OpalAgentExecution {
  id: string;
  workflow_id: string;

  agent_name: string;
  agent_type?: string;
  execution_order?: number;

  // Execution Status
  status: AgentStatus;
  started_at?: Date;
  completed_at?: Date;
  duration_ms?: number;

  // Input/Output Data
  input_data?: Record<string, any>;
  output_data?: Record<string, any>;
  workflow_context?: Record<string, any>;

  // Error Handling
  error_message?: string;
  retry_count: number;
  max_retries: number;
  timeout_ms: number;

  created_at: Date;
  updated_at: Date;
}

// =====================================================
// DXP INTEGRATION TYPES
// =====================================================

export interface OpalODPInsights {
  id: string;
  workflow_id: string;

  // Audience Segments
  audience_segments?: Record<string, any>;
  member_behavior_analysis?: Record<string, any>;
  journey_data?: Record<string, any>;
  statistical_power_analysis?: Record<string, any>;

  // Raw Data Storage
  raw_segments_data?: Record<string, any>;
  segment_targeting_logic?: Record<string, any>;

  // Metadata
  data_collection_timestamp: Date;
  data_freshness_hours?: number;
  api_response_time_ms?: number;

  created_at: Date;
  updated_at: Date;
}

export interface OpalContentInsights {
  id: string;
  workflow_id: string;

  // Content Analysis Results
  website_content_analysis?: Record<string, any>;
  personalization_opportunities?: Record<string, any>;
  content_recommendations?: Record<string, any>;
  performance_assessment?: Record<string, any>;
  content_matrix?: Record<string, any>;
  seo_optimization_data?: Record<string, any>;

  // Content Quality Metrics
  content_quality_score?: number; // 0-100
  seo_readiness_score?: number; // 0-100
  personalization_potential_score?: number; // 0-100

  // Metadata
  analyzed_url?: string;
  pages_analyzed?: number;
  analysis_depth?: string;

  created_at: Date;
  updated_at: Date;
}

export interface OpalCMSInsights {
  id: string;
  workflow_id: string;

  // CMS Analysis Results
  content_structure_audit?: Record<string, any>;
  content_templates?: Record<string, any>;
  content_variations?: Record<string, any>;
  governance_framework?: Record<string, any>;
  performance_metrics?: Record<string, any>;

  // CMS Platform Details
  cms_platform_type?: string;
  cms_version?: string;
  integration_complexity?: string;

  created_at: Date;
  updated_at: Date;
}

export interface OpalCMPInsights {
  id: string;
  workflow_id: string;

  // Strategy Compilation Results
  strategy_brief?: Record<string, any>;
  executive_summary?: Record<string, any>;
  campaign_specifications?: Record<string, any>;
  implementation_timeline?: Record<string, any>;

  // CMP Integration
  cmp_deliverables?: Record<string, any>;
  campaign_export_data?: Record<string, any>;
  deployment_status?: string;

  created_at: Date;
  updated_at: Date;
}

export interface OpalWebXInsights {
  id: string;
  workflow_id: string;

  // Technical Analysis Results
  geo_audit_results?: Record<string, any>;
  core_web_vitals?: Record<string, any>;
  technical_constraints?: Record<string, any>;
  schema_markup_analysis?: Record<string, any>;
  mobile_optimization_audit?: Record<string, any>;
  performance_baseline?: Record<string, any>;

  // Technical Scores
  geo_score?: number; // 0-100
  performance_score?: number; // 0-100
  mobile_score?: number; // 0-100

  created_at: Date;
  updated_at: Date;
}

// =====================================================
// RAG AND KNOWLEDGE MANAGEMENT TYPES
// =====================================================

export interface OpalRAGKnowledge {
  id: string;

  // Source Information
  source_type: string;
  source_id?: string;
  workflow_id?: string;

  // Knowledge Content
  knowledge_title?: string;
  knowledge_summary?: string;
  knowledge_content?: Record<string, any>;
  raw_content?: string;

  // RAG Metadata
  embedding_vector?: number[]; // Vector embedding
  knowledge_type?: string;
  confidence_score?: number;
  relevance_tags?: string[];

  // Lifecycle Management
  is_active: boolean;
  expires_at?: Date;
  usage_count: number;
  last_used_at?: Date;

  created_at: Date;
  updated_at: Date;
}

export interface OpalRAGConfig {
  id: string;

  config_name: string;
  model_version?: string;
  embedding_model?: string;

  // Model Parameters
  max_tokens: number;
  temperature: number;
  top_k: number;
  similarity_threshold: number;

  // Performance Metrics
  avg_response_time_ms?: number;
  accuracy_score?: number;
  last_evaluation_date?: Date;

  is_active: boolean;
  created_by?: string;

  created_at: Date;
  updated_at: Date;
}

// =====================================================
// PERFORMANCE AND MONITORING TYPES
// =====================================================

export interface OpalAPIPerformance {
  id: string;

  // Request Information
  endpoint: string;
  method: string;
  workflow_id?: string;
  agent_execution_id?: string;

  // Performance Metrics
  response_time_ms: number;
  status_code?: number;
  payload_size_bytes?: number;

  // DXP Integration Specifics
  dxp_platform?: DXPPlatform;
  api_call_type?: string;

  // Error Information
  error_message?: string;
  retry_attempt: number;

  timestamp: Date;
}

export interface OpalSystemHealth {
  id: string;

  // Health Metrics
  component: string;
  status: 'healthy' | 'degraded' | 'unhealthy';

  // Performance Data
  response_time_avg_ms?: number;
  error_rate_percentage?: number;
  throughput_requests_per_minute?: number;

  // Specific Metrics
  active_workflows?: number;
  pending_workflows?: number;
  failed_workflows_24h?: number;

  check_timestamp: Date;
}

// =====================================================
// WORKFLOW ORCHESTRATION TYPES
// =====================================================

export interface WorkflowProgress {
  workflow_id: string;
  session_id: string;
  current_step: string;
  progress_percentage: number;
  expected_agents: string[];
  completed_agents: string[];
  failed_agents: string[];
  estimated_completion?: Date;
}

export interface DXPSyncStatus {
  platform: DXPPlatform;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  last_sync?: Date;
  next_sync?: Date;
  error_message?: string;
  performance_ms?: number;
}

export interface OpalTriggerRequest {
  // Form data from /engine
  client_name: string;
  industry?: string;
  company_size?: string;
  current_capabilities?: string[];
  business_objectives?: string[];
  additional_marketing_technology?: string[];
  timeline_preference?: string;
  budget_range?: string;
  recipients?: string[];

  // Trigger metadata
  triggered_by: TriggerType;
  force_sync?: boolean;
  scheduled_for?: Date;
}

export interface OpalWorkflowResult {
  workflow_id: string;
  session_id: string;
  status: WorkflowStatus;

  // Execution Results
  insights: {
    odp?: OpalODPInsights;
    content?: OpalContentInsights;
    cms?: OpalCMSInsights;
    cmp?: OpalCMPInsights;
    webx?: OpalWebXInsights;
  };

  // Performance Data
  total_duration_ms?: number;
  agent_performance: Array<{
    agent_name: string;
    duration_ms: number;
    status: AgentStatus;
  }>;

  // RAG Updates
  rag_knowledge_created: number;
  rag_knowledge_updated: number;

  // Deliverables
  strategy_brief?: Record<string, any>;
  executive_summary?: Record<string, any>;
  recommendations?: Array<{
    category: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    implementation_effort: string;
  }>;
}

// =====================================================
// API REQUEST/RESPONSE TYPES
// =====================================================

export interface TriggerWorkflowRequest {
  formData: OpalTriggerRequest;
}

export interface TriggerWorkflowResponse {
  success: boolean;
  workflow_id: string;
  session_id: string;
  message: string;
  polling_url?: string;
}

export interface WorkflowStatusResponse {
  workflow_id: string;
  session_id: string;
  status: WorkflowStatus;
  progress: WorkflowProgress;
  current_step?: string;
  estimated_completion?: Date;
  results?: OpalWorkflowResult;
}

export interface RAGAdminData {
  knowledge_count: number;
  active_knowledge_count: number;
  recent_updates: Array<{
    id: string;
    knowledge_type: string;
    source_type: string;
    created_at: Date;
  }>;
  model_config: OpalRAGConfig;
  performance_metrics: {
    avg_response_time: number;
    accuracy_score: number;
    usage_count_24h: number;
  };
}

// =====================================================
// UTILITY TYPES
// =====================================================

export type CreateOpalWorkflow = Omit<OpalWorkflowExecution, 'id' | 'created_at' | 'updated_at'>;
export type UpdateOpalWorkflow = Partial<Pick<OpalWorkflowExecution, 'status' | 'current_step' | 'progress_percentage' | 'completed_agents' | 'failed_agents' | 'error_message'>>;

export type CreateAgentExecution = Omit<OpalAgentExecution, 'id' | 'created_at' | 'updated_at'>;
export type UpdateAgentExecution = Partial<Pick<OpalAgentExecution, 'status' | 'output_data' | 'error_message' | 'completed_at' | 'duration_ms'>>;

// Agent-specific input/output types
export interface ContentReviewOutput {
  content_quality_score: number;
  seo_readiness: number;
  personalization_potential: string[];
  optimization_opportunities: Array<{
    category: string;
    priority: 'high' | 'medium' | 'low';
    description: string;
    impact_estimate: string;
  }>;
  content_gaps: string[];
  recommendations: Array<{
    action: string;
    rationale: string;
    resources_required: string;
    timeline: string;
  }>;
}

export interface GeoAuditOutput {
  overall_geo_score: number;
  ai_citation_readiness: 'HIGH' | 'MEDIUM' | 'LOW';
  schema_markup_status: Record<string, any>;
  performance_metrics: Record<string, any>;
  quick_wins: Array<Record<string, any>>;
  technical_recommendations: Array<Record<string, any>>;
}

export interface AudienceAnalysisOutput {
  recommended_segments: Array<Record<string, any>>;
  segment_prioritization: Record<string, any>;
  audience_insights: Record<string, any>;
  personalization_opportunities: Array<Record<string, any>>;
  implementation_roadmap: Record<string, any>;
}