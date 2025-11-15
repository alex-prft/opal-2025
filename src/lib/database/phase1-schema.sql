-- Phase 1: Validation Foundation Database Schema
-- Creates comprehensive validation logging and page-level validation tables

-- Validation Logs Table for Complete Audit Trail
CREATE TABLE IF NOT EXISTS validation_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    validation_id VARCHAR(255) NOT NULL,
    page_id VARCHAR(100) NOT NULL,
    widget_id VARCHAR(100) NOT NULL,
    validation_type VARCHAR(50) NOT NULL, -- 'opal_mapping', 'claude_schema', 'deduplication', 'cross_page_consistency'

    -- Validation Results
    opal_mapping_result JSONB,
    claude_schema_result JSONB,
    deduplication_result JSONB,
    cross_page_consistency JSONB,

    -- Scoring and Status
    confidence_score DECIMAL(5,2) DEFAULT 0.00,
    validation_status VARCHAR(20) DEFAULT 'pending', -- 'passed', 'failed', 'warning', 'pending'

    -- Error Tracking
    failure_reason TEXT,
    action_taken VARCHAR(100),
    retry_count INTEGER DEFAULT 0,
    admin_notified BOOLEAN DEFAULT FALSE,

    -- Timestamps
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced Agent Outputs Table with Cross-Page Support
CREATE TABLE IF NOT EXISTS agent_outputs_enhanced (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workflow_id VARCHAR(255) NOT NULL,
    agent_id VARCHAR(100) NOT NULL,
    page_id VARCHAR(100) NOT NULL,
    widget_id VARCHAR(100) NOT NULL,

    -- Content Data
    opal_data JSONB,
    claude_enhancements JSONB,
    content_hash VARCHAR(64) NOT NULL, -- SHA-256 hash
    cross_tier_hash VARCHAR(64), -- For cross-tier deduplication

    -- Quality & Performance
    confidence_score DECIMAL(5,2) DEFAULT 0.00,
    validation_status VARCHAR(20) DEFAULT 'pending',
    retry_count INTEGER DEFAULT 0,

    -- Cross-Page References
    cross_page_refs JSONB, -- References to related content on other pages

    -- Performance Metrics
    performance_metrics JSONB,

    -- Audit Trail
    audit_trail JSONB,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Page Validation Status Table for Real-Time Monitoring
CREATE TABLE IF NOT EXISTS page_validation_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page_id VARCHAR(100) NOT NULL,
    page_name VARCHAR(255) NOT NULL,

    -- Validation Gates Status
    opal_mapping_status VARCHAR(20) DEFAULT 'pending', -- 'passed', 'failed', 'warning'
    claude_schema_status VARCHAR(20) DEFAULT 'pending',
    deduplication_status VARCHAR(20) DEFAULT 'pending',
    cross_page_consistency_status VARCHAR(20) DEFAULT 'pending',

    -- Overall Status
    overall_status VARCHAR(20) DEFAULT 'pending', -- 'green', 'yellow', 'red'

    -- Metrics
    total_widgets INTEGER DEFAULT 0,
    validated_widgets INTEGER DEFAULT 0,
    failed_widgets INTEGER DEFAULT 0,

    -- Performance
    last_validation_time TIMESTAMP WITH TIME ZONE,
    average_confidence_score DECIMAL(5,2) DEFAULT 0.00,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content Deduplication Tracking
CREATE TABLE IF NOT EXISTS content_deduplication (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_hash VARCHAR(64) NOT NULL,
    page_id VARCHAR(100) NOT NULL,
    widget_id VARCHAR(100) NOT NULL,

    -- Deduplication Data
    first_occurrence_id UUID REFERENCES agent_outputs_enhanced(id),
    duplicate_count INTEGER DEFAULT 1,
    cross_page_duplicates JSONB, -- Array of page_ids where duplicates found
    cross_tier_duplicates JSONB, -- Array of tier information

    -- Resolution
    resolution_status VARCHAR(20) DEFAULT 'pending', -- 'resolved', 'pending', 'escalated'
    resolution_action VARCHAR(100),

    -- Timestamps
    first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Claude Enhancement Tracking with Retry Limits
CREATE TABLE IF NOT EXISTS claude_enhancements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_output_id UUID REFERENCES agent_outputs_enhanced(id),

    -- Enhancement Details
    original_opal_data JSONB NOT NULL,
    enhanced_content JSONB,
    enhancement_type VARCHAR(50), -- 'summarization', 'enrichment', 'formatting'

    -- Retry Management
    attempt_number INTEGER DEFAULT 1,
    max_attempts INTEGER DEFAULT 2, -- Hard limit as per plan
    status VARCHAR(20) DEFAULT 'pending', -- 'completed', 'failed', 'max_retries_reached'

    -- Validation Against OPAL Source
    pre_merge_validation JSONB,
    validation_passed BOOLEAN DEFAULT FALSE,

    -- Performance
    processing_time_ms INTEGER,

    -- Error Tracking
    error_message TEXT,
    fallback_to_opal_only BOOLEAN DEFAULT FALSE,

    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_validation_logs_page_widget ON validation_logs(page_id, widget_id);
CREATE INDEX IF NOT EXISTS idx_validation_logs_timestamp ON validation_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_validation_logs_status ON validation_logs(validation_status);

CREATE INDEX IF NOT EXISTS idx_agent_outputs_page_widget ON agent_outputs_enhanced(page_id, widget_id);
CREATE INDEX IF NOT EXISTS idx_agent_outputs_content_hash ON agent_outputs_enhanced(content_hash);
CREATE INDEX IF NOT EXISTS idx_agent_outputs_workflow ON agent_outputs_enhanced(workflow_id);

CREATE INDEX IF NOT EXISTS idx_page_validation_status_page ON page_validation_status(page_id);
CREATE INDEX IF NOT EXISTS idx_page_validation_overall_status ON page_validation_status(overall_status);

CREATE INDEX IF NOT EXISTS idx_content_dedup_hash ON content_deduplication(content_hash);
CREATE INDEX IF NOT EXISTS idx_content_dedup_page ON content_deduplication(page_id);

CREATE INDEX IF NOT EXISTS idx_claude_enhancements_output ON claude_enhancements(agent_output_id);
CREATE INDEX IF NOT EXISTS idx_claude_enhancements_status ON claude_enhancements(status);

-- Initialize Page Validation Status for the 4 Critical Pages
INSERT INTO page_validation_status (page_id, page_name) VALUES
('strategy-plans', 'Strategy Plans & Roadmap Overview'),
('optimizely-dxp-tools', 'Optimizely DXP Tools & Integration'),
('analytics-insights', 'Analytics Insights & Data Analysis'),
('experience-optimization', 'Experience Optimization & Testing')
ON CONFLICT (page_id) DO NOTHING;