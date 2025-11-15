// Phase 2 Database Types - Enhanced Storage with Claude Retry Limits
// Extended types for comprehensive audit trail and Claude integration

import { Phase1Database } from './phase1-database';

// Enhanced Agent Outputs with Full Audit Trail
export interface AgentOutputAudit {
  id: string;
  workflow_id: string;
  agent_id: string;
  page_id: string;
  widget_id: string;

  // Enhanced Content Storage
  opal_data: any;
  claude_enhancements?: any;
  merged_content?: any;
  content_hash: string;
  cross_tier_hash?: string;

  // Complete Audit Trail
  audit_trail: AuditEvent[];
  version_number: number;
  parent_version_id?: string;
  rollback_data?: any;

  // Quality & Performance Metrics
  confidence_score: number;
  validation_status: 'passed' | 'failed' | 'warning' | 'pending';
  performance_metrics?: any;

  // Claude Enhancement Tracking
  claude_attempts: number;
  claude_success: boolean;
  claude_failure_reason?: string;
  claude_processing_time_ms?: number;

  // Cross-Page References and Dependencies
  cross_page_refs?: any;
  dependency_mapping?: any;
  dependent_content?: any;

  // Cache Management
  cache_tier: 1 | 2 | 3;
  cache_key?: string;
  cached_until?: string;
  cache_invalidated_at?: string;

  // Timestamps
  created_at: string;
  updated_at: string;
}

// Audit Event for complete traceability
export interface AuditEvent {
  event_id: string;
  event_type: 'created' | 'updated' | 'validated' | 'cached' | 'invalidated' | 'enhanced' | 'rolled_back';
  timestamp: string;
  user_id?: string;
  details: any;
  correlation_id?: string;
}

// Claude Enhancement Lifecycle with Full Tracking
export interface ClaudeEnhancementLifecycle {
  id: string;
  agent_output_id: string;

  // Enhancement Request Details
  enhancement_request_id: string;
  original_opal_data: any;
  enhancement_prompt: string;
  enhancement_type?: 'summarization' | 'enrichment' | 'formatting' | 'analysis';

  // Retry Management (HARD LIMITS)
  attempt_number: number;
  max_attempts: number; // Default 2 - HARD LIMIT
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'max_retries_reached';

  // Claude API Integration
  claude_model_version?: string;
  claude_request_payload?: any;
  claude_response_payload?: any;
  claude_api_response_time_ms?: number;
  claude_tokens_used?: number;

  // Pre-merge Validation (CRITICAL)
  pre_merge_validation?: any;
  validation_passed: boolean;
  validation_failure_reason?: string;

  // Guardrail Enforcement
  guardrails_applied?: any;
  opal_override_detected: boolean;
  opal_override_prevented: boolean;

  // Performance & Error Tracking
  processing_time_ms?: number;
  memory_usage_mb?: number;
  error_message?: string;
  error_code?: string;
  stack_trace?: string;

  // Fallback Management
  fallback_triggered: boolean;
  fallback_reason?: string;
  fallback_to_opal_only: boolean;

  // Timestamps
  started_at: string;
  completed_at?: string;
  failed_at?: string;
  created_at: string;
  updated_at: string;
}

// Cache Management with Background Validation
export interface CacheManagement {
  id: string;
  cache_key: string;
  page_id: string;
  widget_id: string;

  // Cache Configuration
  tier: 1 | 2 | 3; // 1=5min, 2=10min, 3=15min
  ttl_seconds: number;

  // Cache Data
  cached_content: any;
  content_hash: string;
  cache_source: 'real_opal_claude' | 'cached_opal_claude' | 'opal_only' | 'static_template';

  // Validation Status
  last_validated_at: string;
  validation_status: 'valid' | 'stale' | 'invalid' | 'validating';
  validation_frequency_minutes: number;
  next_validation_at?: string;

  // Cross-Page Dependencies
  dependent_cache_keys: string[];
  dependency_cache_keys: string[];
  cross_page_invalidation_rules?: any;

  // Performance Metrics
  hit_count: number;
  miss_count: number;
  last_hit_at?: string;
  average_retrieval_time_ms?: number;

  // Cache Lifecycle
  created_at: string;
  expires_at: string;
  invalidated_at?: string;
  invalidation_reason?: string;
}

// Background Job Management
export interface BackgroundJob {
  id: string;
  job_type: 'cache_validation' | 'cache_warming' | 'cross_page_sync';
  job_name: string;

  // Job Configuration
  schedule_cron?: string;
  enabled: boolean;
  priority: number; // 1=highest, 10=lowest

  // Job Data
  job_payload?: any;
  target_pages: string[];
  target_widgets?: string[];

  // Execution Tracking
  last_run_at?: string;
  next_run_at?: string;
  run_count: number;
  success_count: number;
  failure_count: number;

  // Performance
  average_duration_ms?: number;
  last_duration_ms?: number;

  // Status
  status: 'scheduled' | 'running' | 'completed' | 'failed' | 'disabled';
  last_error_message?: string;
  last_error_at?: string;

  // Timestamps
  created_at: string;
  updated_at: string;
}

// Performance Monitoring
export interface PerformanceMonitoring {
  id: string;

  // Request Identification
  correlation_id: string;
  request_type?: 'validation' | 'cache_hit' | 'cache_miss' | 'claude_enhancement';
  page_id?: string;
  widget_id?: string;

  // Performance Metrics
  total_duration_ms: number;
  cache_lookup_ms?: number;
  validation_duration_ms?: number;
  claude_processing_ms?: number;
  database_query_ms?: number;

  // Quality Metrics
  confidence_score?: number;
  cache_hit?: boolean;
  fallback_triggered?: boolean;
  validation_passed?: boolean;

  // System Resources
  memory_usage_mb?: number;
  cpu_usage_percent?: number;
  concurrent_requests?: number;

  // Timestamps
  timestamp: string;
  date_bucket: string; // For efficient date-based queries
}

// Claude API Configuration
export interface ClaudeConfig {
  api_key: string;
  api_base_url: string;
  model_version: string;
  max_tokens: number;
  temperature: number;
  timeout_ms: number;
  retry_config: {
    max_retries: 2; // HARD LIMIT as per plan
    retry_delay_ms: number;
    exponential_backoff: boolean;
  };
}

// Cache Configuration by Tier
export interface CacheConfig {
  tier1: {
    ttl_seconds: 300; // 5 minutes
    pages: string[];
    validation_frequency_minutes: 15;
  };
  tier2: {
    ttl_seconds: 600; // 10 minutes
    pages: string[];
    validation_frequency_minutes: 30;
  };
  tier3: {
    ttl_seconds: 900; // 15 minutes
    pages: string[];
    validation_frequency_minutes: 45;
  };
}

// Background Job Configuration
export interface BackgroundJobConfig {
  cache_validation: {
    schedule: string; // '*/30 * * * *'
    enabled: boolean;
    target_tiers: number[];
  };
  cache_warming: {
    on_startup: boolean;
    tier1_pages: string[];
    warm_immediately: boolean;
  };
  cross_page_sync: {
    schedule: string; // '*/15 * * * *'
    enabled: boolean;
    check_dependencies: boolean;
  };
}

// Enhanced Validation Result with Claude Integration
export interface EnhancedValidationResult {
  validation_id: string;
  page_id: string;
  widget_id: string;

  // Validation Results
  opal_mapping: {
    passed: boolean;
    confidence_score: number;
    details: any;
  };
  claude_schema: {
    passed: boolean;
    confidence_score: number;
    details: any;
  };
  deduplication: {
    passed: boolean;
    confidence_score: number;
    details: any;
  };
  cross_page_consistency: {
    passed: boolean;
    confidence_score: number;
    details: any;
  };

  // Claude Enhancement Results
  claude_enhancement?: {
    attempted: boolean;
    success: boolean;
    attempts: number;
    fallback_triggered: boolean;
    enhancement_id?: string;
  };

  // Overall Results
  overall_passed: boolean;
  final_confidence_score: number;
  processing_time_ms: number;
  cache_status: 'hit' | 'miss' | 'warming' | 'invalidated';
}

// Extended Database Interface for Phase 2
export interface Phase2Database extends Phase1Database {
  public: {
    Tables: Phase1Database['public']['Tables'] & {
      agent_outputs_audit: {
        Row: AgentOutputAudit;
        Insert: Omit<AgentOutputAudit, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<AgentOutputAudit, 'id' | 'created_at'>> & {
          updated_at?: string;
        };
      };
      claude_enhancement_lifecycle: {
        Row: ClaudeEnhancementLifecycle;
        Insert: Omit<ClaudeEnhancementLifecycle, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<ClaudeEnhancementLifecycle, 'id' | 'created_at'>> & {
          updated_at?: string;
        };
      };
      cache_management: {
        Row: CacheManagement;
        Insert: Omit<CacheManagement, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<CacheManagement, 'id' | 'created_at'>>;
      };
      background_jobs: {
        Row: BackgroundJob;
        Insert: Omit<BackgroundJob, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<BackgroundJob, 'id' | 'created_at'>> & {
          updated_at?: string;
        };
      };
      performance_monitoring: {
        Row: PerformanceMonitoring;
        Insert: Omit<PerformanceMonitoring, 'id' | 'timestamp'> & {
          id?: string;
          timestamp?: string;
        };
        Update: Partial<PerformanceMonitoring>;
      };
    };
    Views: Phase1Database['public']['Views'] & {
      validation_audit_summary: {
        Row: {
          id: string;
          workflow_id: string;
          page_id: string;
          widget_id: string;
          confidence_score: number;
          validation_status: string;
          claude_attempts: number;
          claude_success: boolean;
          claude_status?: string;
          fallback_triggered?: boolean;
          validation_type?: string;
          failure_reason?: string;
          created_at: string;
          updated_at: string;
        };
      };
      cache_performance_summary: {
        Row: {
          page_id: string;
          widget_id: string;
          tier: number;
          hit_count: number;
          miss_count: number;
          hit_rate_percentage: number;
          average_retrieval_time_ms?: number;
          validation_status: string;
          last_validated_at: string;
          next_validation_at?: string;
          expires_at: string;
        };
      };
    };
    Functions: Phase1Database['public']['Functions'];
    Enums: Phase1Database['public']['Enums'];
    CompositeTypes: Phase1Database['public']['CompositeTypes'];
  };
}

// Default Configurations
export const DEFAULT_CLAUDE_CONFIG: ClaudeConfig = {
  api_key: process.env.CLAUDE_API_KEY || '',
  api_base_url: process.env.CLAUDE_API_BASE_URL || 'https://api.anthropic.com',
  model_version: process.env.CLAUDE_MODEL_VERSION || 'claude-3-sonnet-20240229',
  max_tokens: parseInt(process.env.CLAUDE_MAX_TOKENS || '4000'),
  temperature: parseFloat(process.env.CLAUDE_TEMPERATURE || '0.3'),
  timeout_ms: parseInt(process.env.CLAUDE_TIMEOUT_MS || '30000'),
  retry_config: {
    max_retries: 2, // HARD LIMIT
    retry_delay_ms: parseInt(process.env.CLAUDE_RETRY_DELAY_MS || '1000'),
    exponential_backoff: true
  }
};

export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  tier1: {
    ttl_seconds: 300, // 5 minutes
    pages: ['strategy-plans', 'analytics-insights'],
    validation_frequency_minutes: 15
  },
  tier2: {
    ttl_seconds: 600, // 10 minutes
    pages: ['optimizely-dxp-tools', 'experience-optimization'],
    validation_frequency_minutes: 30
  },
  tier3: {
    ttl_seconds: 900, // 15 minutes
    pages: [],
    validation_frequency_minutes: 45
  }
};

export const DEFAULT_BACKGROUND_JOB_CONFIG: BackgroundJobConfig = {
  cache_validation: {
    schedule: '*/30 * * * *', // Every 30 minutes
    enabled: true,
    target_tiers: [1, 2, 3]
  },
  cache_warming: {
    on_startup: true,
    tier1_pages: ['strategy-plans', 'analytics-insights'],
    warm_immediately: true
  },
  cross_page_sync: {
    schedule: '*/15 * * * *', // Every 15 minutes
    enabled: true,
    check_dependencies: true
  }
};