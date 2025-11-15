// Phase 1 Database Types - Validation Foundation
// Extended database types for comprehensive validation system

export interface ValidationLog {
  id: string;
  validation_id: string;
  page_id: string;
  widget_id: string;
  validation_type: 'opal_mapping' | 'claude_schema' | 'deduplication' | 'cross_page_consistency';

  // Validation Results
  opal_mapping_result?: any;
  claude_schema_result?: any;
  deduplication_result?: any;
  cross_page_consistency?: any;

  // Scoring and Status
  confidence_score: number;
  validation_status: 'passed' | 'failed' | 'warning' | 'pending';

  // Error Tracking
  failure_reason?: string;
  action_taken?: string;
  retry_count: number;
  admin_notified: boolean;

  // Timestamps
  timestamp: string;
  created_at: string;
  updated_at: string;
}

export interface AgentOutputEnhanced {
  id: string;
  workflow_id: string;
  agent_id: string;
  page_id: string;
  widget_id: string;

  // Content Data
  opal_data?: any;
  claude_enhancements?: any;
  content_hash: string;
  cross_tier_hash?: string;

  // Quality & Performance
  confidence_score: number;
  validation_status: 'passed' | 'failed' | 'warning' | 'pending';
  retry_count: number;

  // Cross-Page References
  cross_page_refs?: any;

  // Performance Metrics
  performance_metrics?: any;

  // Audit Trail
  audit_trail?: any;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface PageValidationStatus {
  id: string;
  page_id: string;
  page_name: string;

  // Validation Gates Status
  opal_mapping_status: 'passed' | 'failed' | 'warning' | 'pending';
  claude_schema_status: 'passed' | 'failed' | 'warning' | 'pending';
  deduplication_status: 'passed' | 'failed' | 'warning' | 'pending';
  cross_page_consistency_status: 'passed' | 'failed' | 'warning' | 'pending';

  // Overall Status
  overall_status: 'green' | 'yellow' | 'red' | 'pending';

  // Metrics
  total_widgets: number;
  validated_widgets: number;
  failed_widgets: number;

  // Performance
  last_validation_time?: string;
  average_confidence_score: number;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface ContentDeduplication {
  id: string;
  content_hash: string;
  page_id: string;
  widget_id: string;

  // Deduplication Data
  first_occurrence_id: string;
  duplicate_count: number;
  cross_page_duplicates?: any;
  cross_tier_duplicates?: any;

  // Resolution
  resolution_status: 'resolved' | 'pending' | 'escalated';
  resolution_action?: string;

  // Timestamps
  first_seen_at: string;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
}

export interface ClaudeEnhancement {
  id: string;
  agent_output_id: string;

  // Enhancement Details
  original_opal_data: any;
  enhanced_content?: any;
  enhancement_type?: 'summarization' | 'enrichment' | 'formatting';

  // Retry Management
  attempt_number: number;
  max_attempts: number;
  status: 'completed' | 'failed' | 'max_retries_reached' | 'pending';

  // Validation Against OPAL Source
  pre_merge_validation?: any;
  validation_passed: boolean;

  // Performance
  processing_time_ms?: number;

  // Error Tracking
  error_message?: string;
  fallback_to_opal_only: boolean;

  // Timestamps
  started_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

// Extended Database interface that includes Phase 1 tables
export interface Phase1Database {
  public: {
    Tables: {
      validation_logs: {
        Row: ValidationLog;
        Insert: Omit<ValidationLog, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<ValidationLog, 'id' | 'created_at'>> & {
          updated_at?: string;
        };
      };
      agent_outputs_enhanced: {
        Row: AgentOutputEnhanced;
        Insert: Omit<AgentOutputEnhanced, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<AgentOutputEnhanced, 'id' | 'created_at'>> & {
          updated_at?: string;
        };
      };
      page_validation_status: {
        Row: PageValidationStatus;
        Insert: Omit<PageValidationStatus, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<PageValidationStatus, 'id' | 'created_at'>> & {
          updated_at?: string;
        };
      };
      content_deduplication: {
        Row: ContentDeduplication;
        Insert: Omit<ContentDeduplication, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<ContentDeduplication, 'id' | 'created_at'>> & {
          updated_at?: string;
        };
      };
      claude_enhancements: {
        Row: ClaudeEnhancement;
        Insert: Omit<ClaudeEnhancement, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<ClaudeEnhancement, 'id' | 'created_at'>> & {
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Confidence Scoring System
export interface ConfidenceScore {
  source_type: 'real_opal_claude' | 'cached_opal_claude' | 'opal_only' | 'static_template';
  score: 99 | 95 | 100 | 70; // As per plan requirements
  validation_checks_passed: number;
  total_validation_checks: number;
  cross_page_consistency: boolean;
  deduplication_passed: boolean;
}

// Page Configuration for the 4 Critical Pages
export interface PageConfig {
  pageId: 'strategy-plans' | 'optimizely-dxp-tools' | 'analytics-insights' | 'experience-optimization';
  displayName: string;
  tier: 1 | 2 | 3;
  target_widgets: string[];
  related_pages: string[];
  cross_page_consistency_requirements: any;
  validation_rules: any;
}

// Validation Pipeline Configuration
export interface ValidationPipelineConfig {
  enable_opal_mapping_validation: boolean;
  enable_claude_schema_validation: boolean;
  enable_cross_page_deduplication: boolean;
  enable_cross_tier_deduplication: boolean;

  // Retry Configuration
  max_claude_retries: 2; // Hard limit as per plan
  claude_retry_delay_ms: number;

  // Performance Thresholds
  max_render_time_ms: 2000;
  max_interaction_time_ms: 500;
  max_claude_enhancement_time_ms: 1000;

  // Quality Gates
  minimum_confidence_score: number;
  cross_page_consistency_threshold: number;
}

// Alert System Configuration
export interface AlertConfig {
  page_validation_failure: boolean;
  claude_retry_limit_exceeded: boolean;
  cross_page_consistency_violation: boolean;
  deduplication_conflict: boolean;
  performance_threshold_exceeded: boolean;
  confidence_score_degradation: boolean;

  notification_channels: {
    slack?: {
      webhook_url: string;
      channel: string;
    };
    email?: {
      recipients: string[];
      smtp_config: any;
    };
  };
}

export const CRITICAL_PAGES: PageConfig[] = [
  {
    pageId: 'strategy-plans',
    displayName: 'Strategy Plans & Roadmap Overview',
    tier: 1,
    target_widgets: ['kpi-dashboard', 'roadmap-timeline'],
    related_pages: ['analytics-insights', 'experience-optimization'],
    cross_page_consistency_requirements: {},
    validation_rules: {}
  },
  {
    pageId: 'optimizely-dxp-tools',
    displayName: 'Optimizely DXP Tools & Integration',
    tier: 2,
    target_widgets: ['tool-matrix', 'integration-status'],
    related_pages: ['analytics-insights', 'strategy-plans'],
    cross_page_consistency_requirements: {},
    validation_rules: {}
  },
  {
    pageId: 'analytics-insights',
    displayName: 'Analytics Insights & Data Analysis',
    tier: 1,
    target_widgets: ['analytics-dashboard', 'insights-summary'],
    related_pages: ['strategy-plans', 'experience-optimization'],
    cross_page_consistency_requirements: {},
    validation_rules: {}
  },
  {
    pageId: 'experience-optimization',
    displayName: 'Experience Optimization & Testing',
    tier: 2,
    target_widgets: ['optimization-results', 'test-recommendations'],
    related_pages: ['analytics-insights', 'strategy-plans'],
    cross_page_consistency_requirements: {},
    validation_rules: {}
  }
];