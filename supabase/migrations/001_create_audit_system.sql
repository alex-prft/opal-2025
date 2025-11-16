-- OSA Supabase Guardrails - Audit System Schema
-- This migration creates the audit logging and governance infrastructure

-- Audit log table for all system events
CREATE TABLE IF NOT EXISTS supabase_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    table_name TEXT,
    operation TEXT,
    user_context JSONB,
    data_classification TEXT,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    severity TEXT NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failure', 'warning')),
    duration_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_log_event_type ON supabase_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON supabase_audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON supabase_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_severity ON supabase_audit_log(severity);
CREATE INDEX IF NOT EXISTS idx_audit_log_status ON supabase_audit_log(status);

-- Compliance reports table
CREATE TABLE IF NOT EXISTS compliance_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id TEXT UNIQUE NOT NULL,
    report_data JSONB NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_compliance_reports_generated_at ON compliance_reports(generated_at);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_period ON compliance_reports(period_start, period_end);

-- Data retention backups table
CREATE TABLE IF NOT EXISTS data_retention_backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_table TEXT NOT NULL,
    backup_table TEXT NOT NULL,
    backup_timestamp TEXT NOT NULL,
    record_count INTEGER NOT NULL,
    backup_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_retention_backups_table ON data_retention_backups(original_table);
CREATE INDEX IF NOT EXISTS idx_retention_backups_created_at ON data_retention_backups(created_at);

-- Session states table with automatic expiration
CREATE TABLE IF NOT EXISTS session_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT UNIQUE NOT NULL,
    token TEXT NOT NULL, -- Will be encrypted by application
    user_data JSONB,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_states_session_id ON session_states(session_id);
CREATE INDEX IF NOT EXISTS idx_session_states_expires_at ON session_states(expires_at);

-- Temporary workflow data table
CREATE TABLE IF NOT EXISTS temporary_workflow_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id TEXT NOT NULL,
    data_type TEXT NOT NULL,
    temporary_data JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_temp_workflow_data_workflow_id ON temporary_workflow_data(workflow_id);
CREATE INDEX IF NOT EXISTS idx_temp_workflow_data_expires_at ON temporary_workflow_data(expires_at);

-- Anonymous usage metrics table
CREATE TABLE IF NOT EXISTS anonymous_usage_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_type TEXT NOT NULL,
    aggregation_level TEXT NOT NULL,
    dimensions JSONB,
    value NUMERIC NOT NULL,
    count INTEGER DEFAULT 1,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_metrics_type ON anonymous_usage_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_timestamp ON anonymous_usage_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_aggregation ON anonymous_usage_metrics(aggregation_level);

-- Performance analytics table
CREATE TABLE IF NOT EXISTS performance_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint TEXT,
    method TEXT,
    response_time_ms INTEGER,
    status_code INTEGER,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_performance_endpoint ON performance_analytics(endpoint);
CREATE INDEX IF NOT EXISTS idx_performance_created_at ON performance_analytics(created_at);

-- Cache invalidation queue
CREATE TABLE IF NOT EXISTS cache_invalidation_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key TEXT NOT NULL,
    invalidation_type TEXT NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cache_queue_processed ON cache_invalidation_queue(processed);
CREATE INDEX IF NOT EXISTS idx_cache_queue_created_at ON cache_invalidation_queue(created_at);