-- Phase 3: Cross-Page Validated Webhook Pipeline Database Schema
-- Enhanced webhook security, cross-page dependencies, and real-time processing

-- Webhook Security Events Table
-- Tracks all security-related events for monitoring and analysis
CREATE TABLE IF NOT EXISTS webhook_security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT UNIQUE NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source_ip INET NOT NULL,
    user_agent TEXT,
    event_type TEXT NOT NULL CHECK (event_type IN ('validation_success', 'validation_failure', 'rate_limit_exceeded', 'security_violation')),
    event_details JSONB NOT NULL DEFAULT '{}',
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),

    -- Indexing for performance
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for webhook security events
CREATE INDEX IF NOT EXISTS idx_webhook_security_events_timestamp ON webhook_security_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_webhook_security_events_source_ip ON webhook_security_events(source_ip);
CREATE INDEX IF NOT EXISTS idx_webhook_security_events_event_type ON webhook_security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_security_events_severity ON webhook_security_events(severity);
CREATE INDEX IF NOT EXISTS idx_webhook_security_events_event_id ON webhook_security_events(event_id);

-- Cross-Page Dependencies Table
-- Tracks dependencies between pages for intelligent invalidation
CREATE TABLE IF NOT EXISTS cross_page_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_page_id TEXT NOT NULL,
    source_widget_id TEXT,
    target_page_id TEXT NOT NULL,
    target_widget_id TEXT,
    dependency_type TEXT NOT NULL CHECK (dependency_type IN ('data_dependency', 'cache_dependency', 'validation_dependency', 'workflow_dependency')),
    dependency_strength INTEGER NOT NULL DEFAULT 5 CHECK (dependency_strength BETWEEN 1 AND 10), -- 1=weak, 10=critical

    -- Dependency metadata
    dependency_rules JSONB NOT NULL DEFAULT '{}',
    auto_invalidate BOOLEAN NOT NULL DEFAULT true,
    invalidation_delay_ms INTEGER DEFAULT 0,

    -- Tracking
    created_by TEXT DEFAULT 'system',
    last_triggered_at TIMESTAMPTZ,
    trigger_count INTEGER NOT NULL DEFAULT 0,

    -- Constraints
    UNIQUE(source_page_id, source_widget_id, target_page_id, target_widget_id, dependency_type),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for cross-page dependencies
CREATE INDEX IF NOT EXISTS idx_cross_page_deps_source ON cross_page_dependencies(source_page_id, source_widget_id);
CREATE INDEX IF NOT EXISTS idx_cross_page_deps_target ON cross_page_dependencies(target_page_id, target_widget_id);
CREATE INDEX IF NOT EXISTS idx_cross_page_deps_type ON cross_page_dependencies(dependency_type);
CREATE INDEX IF NOT EXISTS idx_cross_page_deps_strength ON cross_page_dependencies(dependency_strength);
CREATE INDEX IF NOT EXISTS idx_cross_page_deps_auto_invalidate ON cross_page_dependencies(auto_invalidate) WHERE auto_invalidate = true;

-- Enhanced Webhook Processing Logs
-- Comprehensive logging for all webhook processing with Phase 2 integration
CREATE TABLE IF NOT EXISTS webhook_processing_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Request identification
    correlation_id TEXT UNIQUE NOT NULL,
    webhook_event_id TEXT,
    workflow_id TEXT,
    agent_id TEXT,

    -- Source information
    source_ip INET NOT NULL,
    user_agent TEXT,
    webhook_source TEXT, -- 'opal', 'osa', 'external', etc.

    -- Processing details
    processing_stage TEXT NOT NULL CHECK (processing_stage IN ('received', 'security_validation', 'payload_parsing', 'phase2_validation', 'cross_page_processing', 'cache_invalidation', 'completed', 'failed')),
    processing_status TEXT NOT NULL CHECK (processing_status IN ('pending', 'in_progress', 'completed', 'failed', 'timeout')),

    -- Content and validation
    page_id TEXT,
    widget_id TEXT,
    original_payload JSONB,
    processed_content JSONB,
    validation_results JSONB,

    -- Phase 2 integration
    phase2_validation_id TEXT,
    cache_operations JSONB DEFAULT '[]',
    claude_enhancement_attempted BOOLEAN DEFAULT false,
    claude_enhancement_success BOOLEAN DEFAULT false,

    -- Cross-page processing
    cross_page_dependencies_triggered INTEGER DEFAULT 0,
    cross_page_invalidations INTEGER DEFAULT 0,
    cross_page_processing_time_ms INTEGER DEFAULT 0,

    -- Performance metrics
    security_validation_ms INTEGER DEFAULT 0,
    payload_parsing_ms INTEGER DEFAULT 0,
    phase2_processing_ms INTEGER DEFAULT 0,
    total_processing_ms INTEGER DEFAULT 0,

    -- Error handling
    error_message TEXT,
    error_code TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,

    -- Timestamps
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for webhook processing logs
CREATE INDEX IF NOT EXISTS idx_webhook_processing_logs_correlation_id ON webhook_processing_logs(correlation_id);
CREATE INDEX IF NOT EXISTS idx_webhook_processing_logs_workflow_id ON webhook_processing_logs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_webhook_processing_logs_page_widget ON webhook_processing_logs(page_id, widget_id);
CREATE INDEX IF NOT EXISTS idx_webhook_processing_logs_status ON webhook_processing_logs(processing_status);
CREATE INDEX IF NOT EXISTS idx_webhook_processing_logs_stage ON webhook_processing_logs(processing_stage);
CREATE INDEX IF NOT EXISTS idx_webhook_processing_logs_received_at ON webhook_processing_logs(received_at);
CREATE INDEX IF NOT EXISTS idx_webhook_processing_logs_source_ip ON webhook_processing_logs(source_ip);
CREATE INDEX IF NOT EXISTS idx_webhook_processing_logs_webhook_source ON webhook_processing_logs(webhook_source);

-- Real-Time Webhook Events Stream
-- For real-time monitoring and SSE streaming
CREATE TABLE IF NOT EXISTS webhook_events_stream (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Stream metadata
    stream_id TEXT UNIQUE NOT NULL,
    event_sequence INTEGER NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('webhook_received', 'validation_completed', 'processing_completed', 'cache_invalidated', 'cross_page_triggered', 'error_occurred')),

    -- Event data
    correlation_id TEXT NOT NULL,
    page_id TEXT,
    widget_id TEXT,
    event_data JSONB NOT NULL DEFAULT '{}',

    -- Stream control
    stream_priority INTEGER NOT NULL DEFAULT 5 CHECK (stream_priority BETWEEN 1 AND 10),
    broadcast_channels TEXT[] DEFAULT ARRAY['default'],
    ttl_seconds INTEGER DEFAULT 300, -- 5 minutes default TTL

    -- Delivery tracking
    delivered_to TEXT[] DEFAULT ARRAY[]::TEXT[],
    delivery_attempts INTEGER DEFAULT 0,
    last_delivery_attempt TIMESTAMPTZ,

    -- Expiration
    expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '5 minutes',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for webhook events stream
CREATE INDEX IF NOT EXISTS idx_webhook_events_stream_correlation_id ON webhook_events_stream(correlation_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_stream_event_type ON webhook_events_stream(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_stream_expires_at ON webhook_events_stream(expires_at);
CREATE INDEX IF NOT EXISTS idx_webhook_events_stream_sequence ON webhook_events_stream(event_sequence);
CREATE INDEX IF NOT EXISTS idx_webhook_events_stream_priority ON webhook_events_stream(stream_priority);
CREATE INDEX IF NOT EXISTS idx_webhook_events_stream_channels ON webhook_events_stream USING gin(broadcast_channels);

-- Cross-Page Validation Results
-- Enhanced validation results with cross-page consistency tracking
CREATE TABLE IF NOT EXISTS cross_page_validation_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Validation identification
    validation_id TEXT UNIQUE NOT NULL,
    correlation_id TEXT NOT NULL,
    validation_type TEXT NOT NULL CHECK (validation_type IN ('single_page', 'cross_page', 'full_site', 'dependency_chain')),

    -- Scope
    primary_page_id TEXT NOT NULL,
    primary_widget_id TEXT,
    affected_pages JSONB NOT NULL DEFAULT '[]', -- Array of {page_id, widget_id, validation_result}
    dependency_chain JSONB NOT NULL DEFAULT '[]', -- Array of dependency IDs processed

    -- Results
    overall_result TEXT NOT NULL CHECK (overall_result IN ('passed', 'failed', 'warning', 'partial')),
    primary_page_result TEXT NOT NULL CHECK (primary_page_result IN ('passed', 'failed', 'warning', 'skipped')),
    cross_page_consistency_score INTEGER CHECK (cross_page_consistency_score BETWEEN 0 AND 100),

    -- Detailed results
    validation_details JSONB NOT NULL DEFAULT '{}',
    inconsistencies_detected JSONB DEFAULT '[]',
    auto_corrections_applied JSONB DEFAULT '[]',
    manual_review_required BOOLEAN DEFAULT false,

    -- Performance
    pages_validated INTEGER NOT NULL DEFAULT 0,
    dependencies_checked INTEGER NOT NULL DEFAULT 0,
    cache_operations_performed INTEGER NOT NULL DEFAULT 0,
    total_validation_time_ms INTEGER NOT NULL DEFAULT 0,

    -- Integration
    phase2_validation_id TEXT,
    phase2_confidence_score INTEGER,
    claude_enhancements_involved BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for cross-page validation results
CREATE INDEX IF NOT EXISTS idx_cross_page_validation_results_validation_id ON cross_page_validation_results(validation_id);
CREATE INDEX IF NOT EXISTS idx_cross_page_validation_results_correlation_id ON cross_page_validation_results(correlation_id);
CREATE INDEX IF NOT EXISTS idx_cross_page_validation_results_primary_page ON cross_page_validation_results(primary_page_id, primary_widget_id);
CREATE INDEX IF NOT EXISTS idx_cross_page_validation_results_overall_result ON cross_page_validation_results(overall_result);
CREATE INDEX IF NOT EXISTS idx_cross_page_validation_results_consistency_score ON cross_page_validation_results(cross_page_consistency_score);
CREATE INDEX IF NOT EXISTS idx_cross_page_validation_results_manual_review ON cross_page_validation_results(manual_review_required) WHERE manual_review_required = true;

-- Performance Views for Phase 3 Monitoring

-- Webhook Security Summary View
CREATE OR REPLACE VIEW webhook_security_summary AS
SELECT
    DATE_TRUNC('hour', timestamp) as hour,
    event_type,
    severity,
    COUNT(*) as event_count,
    COUNT(DISTINCT source_ip) as unique_ips,
    AVG(CASE WHEN event_details->>'validation_time_ms' IS NOT NULL
        THEN (event_details->>'validation_time_ms')::INTEGER
        ELSE NULL END) as avg_validation_time_ms
FROM webhook_security_events
WHERE timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', timestamp), event_type, severity
ORDER BY hour DESC, event_count DESC;

-- Cross-Page Dependencies Summary View
CREATE OR REPLACE VIEW cross_page_dependencies_summary AS
SELECT
    source_page_id,
    COUNT(*) as total_dependencies,
    COUNT(CASE WHEN dependency_strength >= 8 THEN 1 END) as critical_dependencies,
    COUNT(CASE WHEN auto_invalidate = true THEN 1 END) as auto_invalidate_dependencies,
    AVG(dependency_strength) as avg_dependency_strength,
    SUM(trigger_count) as total_triggers,
    MAX(last_triggered_at) as last_triggered
FROM cross_page_dependencies
GROUP BY source_page_id
ORDER BY total_dependencies DESC;

-- Webhook Processing Performance View
CREATE OR REPLACE VIEW webhook_processing_performance AS
SELECT
    DATE_TRUNC('hour', received_at) as hour,
    processing_status,
    webhook_source,
    COUNT(*) as request_count,
    AVG(total_processing_ms) as avg_processing_time_ms,
    AVG(security_validation_ms) as avg_security_validation_ms,
    AVG(phase2_processing_ms) as avg_phase2_processing_ms,
    AVG(cross_page_processing_time_ms) as avg_cross_page_processing_ms,
    AVG(cross_page_dependencies_triggered) as avg_dependencies_triggered,
    COUNT(CASE WHEN processing_status = 'failed' THEN 1 END) as failed_count
FROM webhook_processing_logs
WHERE received_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', received_at), processing_status, webhook_source
ORDER BY hour DESC, request_count DESC;

-- Automatic cleanup functions for old data
-- Note: In production, these should be scheduled as cron jobs or background tasks

-- Clean up old webhook security events (keep 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_webhook_security_events()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM webhook_security_events
    WHERE timestamp < NOW() - INTERVAL '30 days';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    INSERT INTO system_maintenance_logs (operation, details, created_at)
    VALUES ('cleanup_webhook_security_events',
            json_build_object('deleted_count', deleted_count),
            NOW());

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Clean up old webhook events stream (keep 1 day)
CREATE OR REPLACE FUNCTION cleanup_old_webhook_events_stream()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM webhook_events_stream
    WHERE expires_at < NOW() OR created_at < NOW() - INTERVAL '1 day';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    INSERT INTO system_maintenance_logs (operation, details, created_at)
    VALUES ('cleanup_webhook_events_stream',
            json_build_object('deleted_count', deleted_count),
            NOW());

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- System maintenance logs table (if not exists from previous phases)
CREATE TABLE IF NOT EXISTS system_maintenance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers to Phase 3 tables
CREATE TRIGGER trigger_webhook_security_events_updated_at
    BEFORE UPDATE ON webhook_security_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_cross_page_dependencies_updated_at
    BEFORE UPDATE ON cross_page_dependencies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_webhook_processing_logs_updated_at
    BEFORE UPDATE ON webhook_processing_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_cross_page_validation_results_updated_at
    BEFORE UPDATE ON cross_page_validation_results
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Phase 3 Schema Version Tracking
INSERT INTO schema_versions (phase, version, description, applied_at)
VALUES ('phase3', '3.0.0', 'Cross-Page Validated Webhook Pipeline with enhanced security and dependencies', NOW())
ON CONFLICT (phase) DO UPDATE SET
    version = EXCLUDED.version,
    description = EXCLUDED.description,
    applied_at = EXCLUDED.applied_at;