-- Phase 2: Enhanced Database Schema with Complete Audit Trail
-- Builds upon Phase 1 foundation with comprehensive storage and rollback capabilities

-- Enhanced Agent Outputs with Full Audit Trail
CREATE TABLE IF NOT EXISTS agent_outputs_audit (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workflow_id VARCHAR(255) NOT NULL,
    agent_id VARCHAR(100) NOT NULL,
    page_id VARCHAR(100) NOT NULL,
    widget_id VARCHAR(100) NOT NULL,

    -- Enhanced Content Storage
    opal_data JSONB NOT NULL,
    claude_enhancements JSONB,
    merged_content JSONB, -- Final content after validation and merging
    content_hash VARCHAR(64) NOT NULL, -- SHA-256 hash for deduplication
    cross_tier_hash VARCHAR(64), -- Cross-tier deduplication hash

    -- Complete Audit Trail
    audit_trail JSONB NOT NULL DEFAULT '[]', -- Array of audit events
    version_number INTEGER DEFAULT 1,
    parent_version_id UUID, -- For version tracking
    rollback_data JSONB, -- Data needed for rollback

    -- Quality & Performance Metrics
    confidence_score DECIMAL(5,2) DEFAULT 0.00,
    validation_status VARCHAR(20) DEFAULT 'pending',
    performance_metrics JSONB,

    -- Claude Enhancement Tracking
    claude_attempts INTEGER DEFAULT 0,
    claude_success BOOLEAN DEFAULT FALSE,
    claude_failure_reason TEXT,
    claude_processing_time_ms INTEGER,

    -- Cross-Page References and Dependencies
    cross_page_refs JSONB, -- References to related content on other pages
    dependency_mapping JSONB, -- What this content depends on
    dependent_content JSONB, -- What content depends on this

    -- Cache Management
    cache_tier INTEGER DEFAULT 3, -- 1=5min, 2=10min, 3=15min TTL
    cache_key VARCHAR(255),
    cached_until TIMESTAMP WITH TIME ZONE,
    cache_invalidated_at TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    FOREIGN KEY (parent_version_id) REFERENCES agent_outputs_audit(id)
);

-- Enhanced Claude Enhancement Tracking with Full Lifecycle
CREATE TABLE IF NOT EXISTS claude_enhancement_lifecycle (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_output_id UUID REFERENCES agent_outputs_audit(id),

    -- Enhancement Request Details
    enhancement_request_id VARCHAR(255) NOT NULL,
    original_opal_data JSONB NOT NULL,
    enhancement_prompt TEXT NOT NULL,
    enhancement_type VARCHAR(50), -- 'summarization', 'enrichment', 'formatting', 'analysis'

    -- Retry Management (HARD LIMITS)
    attempt_number INTEGER DEFAULT 1,
    max_attempts INTEGER DEFAULT 2, -- HARD LIMIT as per plan
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'max_retries_reached'

    -- Claude API Integration
    claude_model_version VARCHAR(50),
    claude_request_payload JSONB,
    claude_response_payload JSONB,
    claude_api_response_time_ms INTEGER,
    claude_tokens_used INTEGER,

    -- Pre-merge Validation (CRITICAL)
    pre_merge_validation JSONB, -- Validation results before merging
    validation_passed BOOLEAN DEFAULT FALSE,
    validation_failure_reason TEXT,

    -- Guardrail Enforcement
    guardrails_applied JSONB, -- Which guardrails were enforced
    opal_override_detected BOOLEAN DEFAULT FALSE,
    opal_override_prevented BOOLEAN DEFAULT FALSE,

    -- Performance & Error Tracking
    processing_time_ms INTEGER,
    memory_usage_mb DECIMAL(10,2),
    error_message TEXT,
    error_code VARCHAR(50),
    stack_trace TEXT,

    -- Fallback Management
    fallback_triggered BOOLEAN DEFAULT FALSE,
    fallback_reason VARCHAR(100),
    fallback_to_opal_only BOOLEAN DEFAULT FALSE,

    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cache Management with Background Validation
CREATE TABLE IF NOT EXISTS cache_management (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cache_key VARCHAR(255) UNIQUE NOT NULL,
    page_id VARCHAR(100) NOT NULL,
    widget_id VARCHAR(100) NOT NULL,

    -- Cache Configuration
    tier INTEGER NOT NULL DEFAULT 3, -- 1=Tier1(5min), 2=Tier2(10min), 3=Tier3(15min)
    ttl_seconds INTEGER NOT NULL,

    -- Cache Data
    cached_content JSONB NOT NULL,
    content_hash VARCHAR(64) NOT NULL,
    cache_source VARCHAR(50), -- 'real_opal_claude', 'cached_opal_claude', 'opal_only', 'static_template'

    -- Validation Status
    last_validated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    validation_status VARCHAR(20) DEFAULT 'valid', -- 'valid', 'stale', 'invalid', 'validating'
    validation_frequency_minutes INTEGER DEFAULT 30,
    next_validation_at TIMESTAMP WITH TIME ZONE,

    -- Cross-Page Dependencies
    dependent_cache_keys TEXT[], -- Other cache keys that depend on this
    dependency_cache_keys TEXT[], -- Cache keys this depends on
    cross_page_invalidation_rules JSONB,

    -- Performance Metrics
    hit_count INTEGER DEFAULT 0,
    miss_count INTEGER DEFAULT 0,
    last_hit_at TIMESTAMP WITH TIME ZONE,
    average_retrieval_time_ms DECIMAL(10,2),

    -- Cache Lifecycle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    invalidated_at TIMESTAMP WITH TIME ZONE,
    invalidation_reason VARCHAR(100),

    -- Indexes for performance
    INDEX idx_cache_key ON cache_management(cache_key),
    INDEX idx_cache_page_widget ON cache_management(page_id, widget_id),
    INDEX idx_cache_expires ON cache_management(expires_at),
    INDEX idx_cache_next_validation ON cache_management(next_validation_at)
);

-- Background Job Management for Scheduled Validation
CREATE TABLE IF NOT EXISTS background_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_type VARCHAR(50) NOT NULL, -- 'cache_validation', 'cache_warming', 'cross_page_sync'
    job_name VARCHAR(100) NOT NULL,

    -- Job Configuration
    schedule_cron VARCHAR(100), -- '*/30 * * * *' for every 30 minutes
    enabled BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 5, -- 1=highest, 10=lowest

    -- Job Data
    job_payload JSONB,
    target_pages TEXT[], -- Pages this job applies to
    target_widgets TEXT[], -- Widgets this job applies to

    -- Execution Tracking
    last_run_at TIMESTAMP WITH TIME ZONE,
    next_run_at TIMESTAMP WITH TIME ZONE,
    run_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,

    -- Performance
    average_duration_ms INTEGER,
    last_duration_ms INTEGER,

    -- Status
    status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'running', 'completed', 'failed', 'disabled'
    last_error_message TEXT,
    last_error_at TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Monitoring for Phase 2
CREATE TABLE IF NOT EXISTS performance_monitoring (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Request Identification
    correlation_id VARCHAR(255) NOT NULL,
    request_type VARCHAR(50), -- 'validation', 'cache_hit', 'cache_miss', 'claude_enhancement'
    page_id VARCHAR(100),
    widget_id VARCHAR(100),

    -- Performance Metrics
    total_duration_ms INTEGER NOT NULL,
    cache_lookup_ms INTEGER,
    validation_duration_ms INTEGER,
    claude_processing_ms INTEGER,
    database_query_ms INTEGER,

    -- Quality Metrics
    confidence_score DECIMAL(5,2),
    cache_hit BOOLEAN,
    fallback_triggered BOOLEAN,
    validation_passed BOOLEAN,

    -- System Resources
    memory_usage_mb DECIMAL(10,2),
    cpu_usage_percent DECIMAL(5,2),
    concurrent_requests INTEGER,

    -- Timestamps
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date_bucket DATE DEFAULT CURRENT_DATE -- For efficient date-based queries
);

-- Enhanced Indexes for Phase 2 Performance
CREATE INDEX IF NOT EXISTS idx_agent_outputs_audit_workflow ON agent_outputs_audit(workflow_id);
CREATE INDEX IF NOT EXISTS idx_agent_outputs_audit_page_widget ON agent_outputs_audit(page_id, widget_id);
CREATE INDEX IF NOT EXISTS idx_agent_outputs_audit_content_hash ON agent_outputs_audit(content_hash);
CREATE INDEX IF NOT EXISTS idx_agent_outputs_audit_cache_key ON agent_outputs_audit(cache_key);
CREATE INDEX IF NOT EXISTS idx_agent_outputs_audit_cached_until ON agent_outputs_audit(cached_until);

CREATE INDEX IF NOT EXISTS idx_claude_lifecycle_output ON claude_enhancement_lifecycle(agent_output_id);
CREATE INDEX IF NOT EXISTS idx_claude_lifecycle_status ON claude_enhancement_lifecycle(status);
CREATE INDEX IF NOT EXISTS idx_claude_lifecycle_request_id ON claude_enhancement_lifecycle(enhancement_request_id);

CREATE INDEX IF NOT EXISTS idx_background_jobs_next_run ON background_jobs(next_run_at) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_background_jobs_type ON background_jobs(job_type);

CREATE INDEX IF NOT EXISTS idx_performance_correlation ON performance_monitoring(correlation_id);
CREATE INDEX IF NOT EXISTS idx_performance_page_widget ON performance_monitoring(page_id, widget_id);
CREATE INDEX IF NOT EXISTS idx_performance_date_bucket ON performance_monitoring(date_bucket);

-- Initialize Background Jobs for Phase 2
INSERT INTO background_jobs (job_type, job_name, schedule_cron, job_payload, target_pages) VALUES
(
    'cache_validation',
    'Scheduled Cache Validation - Every 30 Minutes',
    '*/30 * * * *',
    '{"validation_type": "scheduled", "high_traffic_only": true}',
    ARRAY['strategy-plans', 'optimizely-dxp-tools', 'analytics-insights', 'experience-optimization']
),
(
    'cache_warming',
    'Startup Cache Warming - Tier 1 Pages',
    '@reboot',
    '{"tier": 1, "warm_immediately": true}',
    ARRAY['strategy-plans', 'analytics-insights']
),
(
    'cross_page_sync',
    'Cross-Page Consistency Sync - Every 15 Minutes',
    '*/15 * * * *',
    '{"sync_type": "cross_page_consistency", "check_dependencies": true}',
    ARRAY['strategy-plans', 'optimizely-dxp-tools', 'analytics-insights', 'experience-optimization']
)
ON CONFLICT (job_name) DO NOTHING;

-- Update existing validation_logs with linkage to new audit system
ALTER TABLE validation_logs ADD COLUMN IF NOT EXISTS agent_output_audit_id UUID REFERENCES agent_outputs_audit(id);
ALTER TABLE validation_logs ADD COLUMN IF NOT EXISTS claude_enhancement_id UUID REFERENCES claude_enhancement_lifecycle(id);

-- Create views for easy querying
CREATE OR REPLACE VIEW validation_audit_summary AS
SELECT
    aoa.id,
    aoa.workflow_id,
    aoa.page_id,
    aoa.widget_id,
    aoa.confidence_score,
    aoa.validation_status,
    aoa.claude_attempts,
    aoa.claude_success,
    cel.status as claude_status,
    cel.fallback_triggered,
    vl.validation_type,
    vl.failure_reason,
    aoa.created_at,
    aoa.updated_at
FROM agent_outputs_audit aoa
LEFT JOIN claude_enhancement_lifecycle cel ON cel.agent_output_id = aoa.id
LEFT JOIN validation_logs vl ON vl.agent_output_audit_id = aoa.id
ORDER BY aoa.created_at DESC;

CREATE OR REPLACE VIEW cache_performance_summary AS
SELECT
    cm.page_id,
    cm.widget_id,
    cm.tier,
    cm.hit_count,
    cm.miss_count,
    CASE
        WHEN (cm.hit_count + cm.miss_count) > 0
        THEN ROUND((cm.hit_count::decimal / (cm.hit_count + cm.miss_count)) * 100, 2)
        ELSE 0
    END as hit_rate_percentage,
    cm.average_retrieval_time_ms,
    cm.validation_status,
    cm.last_validated_at,
    cm.next_validation_at,
    cm.expires_at
FROM cache_management cm
ORDER BY cm.hit_count DESC, cm.page_id, cm.widget_id;

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO your_app_user;