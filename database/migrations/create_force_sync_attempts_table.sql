-- Force Sync Attempts Table
-- Comprehensive telemetry and audit logging for Force Sync operations
-- Supports the ForceSyncTelemetryManager class requirements

CREATE TABLE IF NOT EXISTS force_sync_attempts (
    -- Primary identifiers
    id BIGSERIAL PRIMARY KEY,
    span_id VARCHAR(255) UNIQUE NOT NULL,
    correlation_id VARCHAR(255) NOT NULL,

    -- Timestamps
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Force Sync Request Details
    sync_scope VARCHAR(50) NOT NULL CHECK (sync_scope IN ('all_platforms', 'priority_platforms', 'specific_platform')),
    triggered_by VARCHAR(50) NOT NULL CHECK (triggered_by IN ('manual_user_request', 'api_call', 'scheduled_sync')),
    include_rag_update BOOLEAN NOT NULL DEFAULT false,

    -- Client Context
    client_name VARCHAR(255) NULL,
    industry VARCHAR(100) NULL,
    recipients_count INTEGER NULL DEFAULT 0,

    -- Request/Response Data (Sanitized)
    request_data JSONB NOT NULL,
    response_data JSONB NULL,

    -- Status and Results
    status VARCHAR(20) NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
    success BOOLEAN NULL,
    error_message TEXT NULL,

    -- Performance Metrics
    duration_ms INTEGER NULL,
    request_size_bytes INTEGER NOT NULL DEFAULT 0,
    response_size_bytes INTEGER NULL,
    internal_workflow_time_ms INTEGER NULL,
    external_webhook_time_ms INTEGER NULL,

    -- OPAL Integration Details
    external_opal_triggered BOOLEAN NULL,
    external_opal_workflow_id VARCHAR(255) NULL,
    external_opal_session_id VARCHAR(255) NULL,
    platforms_synced INTEGER NULL,

    -- Metadata
    user_id VARCHAR(255) NULL,
    session_id VARCHAR(255) NULL,
    ip_address INET NULL,
    user_agent TEXT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_force_sync_attempts_correlation_id ON force_sync_attempts(correlation_id);
CREATE INDEX IF NOT EXISTS idx_force_sync_attempts_started_at ON force_sync_attempts(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_force_sync_attempts_status ON force_sync_attempts(status);
CREATE INDEX IF NOT EXISTS idx_force_sync_attempts_client_name ON force_sync_attempts(client_name);
CREATE INDEX IF NOT EXISTS idx_force_sync_attempts_sync_scope ON force_sync_attempts(sync_scope);
CREATE INDEX IF NOT EXISTS idx_force_sync_attempts_triggered_by ON force_sync_attempts(triggered_by);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_force_sync_attempts_status_started ON force_sync_attempts(status, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_force_sync_attempts_client_status ON force_sync_attempts(client_name, status, started_at DESC);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_force_sync_attempts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER force_sync_attempts_updated_at
    BEFORE UPDATE ON force_sync_attempts
    FOR EACH ROW
    EXECUTE FUNCTION update_force_sync_attempts_updated_at();

-- Performance monitoring view
CREATE OR REPLACE VIEW force_sync_performance_summary AS
SELECT
    DATE_TRUNC('day', started_at) as date,
    sync_scope,
    triggered_by,
    COUNT(*) as total_attempts,
    COUNT(CASE WHEN success = true THEN 1 END) as successful_attempts,
    COUNT(CASE WHEN success = false THEN 1 END) as failed_attempts,
    ROUND(AVG(duration_ms)) as avg_duration_ms,
    ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration_ms)) as median_duration_ms,
    ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms)) as p95_duration_ms,
    ROUND(AVG(request_size_bytes)) as avg_request_size_bytes,
    ROUND(AVG(response_size_bytes)) as avg_response_size_bytes,
    COUNT(CASE WHEN external_opal_triggered = true THEN 1 END) as external_opal_triggered_count,
    ROUND(AVG(platforms_synced)) as avg_platforms_synced
FROM force_sync_attempts
WHERE completed_at IS NOT NULL
GROUP BY DATE_TRUNC('day', started_at), sync_scope, triggered_by
ORDER BY date DESC, sync_scope, triggered_by;

-- Active force sync attempts view
CREATE OR REPLACE VIEW active_force_sync_attempts AS
SELECT
    span_id,
    correlation_id,
    started_at,
    sync_scope,
    triggered_by,
    client_name,
    status,
    EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER * 1000 as elapsed_ms,
    CASE
        WHEN sync_scope = 'all_platforms' THEN 600000 -- 10 minutes
        WHEN sync_scope = 'priority_platforms' THEN 360000 -- 6 minutes
        WHEN sync_scope = 'specific_platform' THEN 180000 -- 3 minutes
        ELSE 360000
    END as estimated_duration_ms
FROM force_sync_attempts
WHERE status = 'running'
ORDER BY started_at DESC;

-- Recent failures view for monitoring
CREATE OR REPLACE VIEW recent_force_sync_failures AS
SELECT
    span_id,
    correlation_id,
    started_at,
    completed_at,
    sync_scope,
    triggered_by,
    client_name,
    error_message,
    duration_ms,
    external_opal_triggered
FROM force_sync_attempts
WHERE success = false
    AND started_at > NOW() - INTERVAL '7 days'
ORDER BY started_at DESC;

-- Comments for documentation
COMMENT ON TABLE force_sync_attempts IS 'Comprehensive audit log and telemetry data for Force Sync operations';
COMMENT ON COLUMN force_sync_attempts.span_id IS 'Unique identifier for the telemetry span';
COMMENT ON COLUMN force_sync_attempts.correlation_id IS 'Correlation ID for tracing across systems';
COMMENT ON COLUMN force_sync_attempts.request_data IS 'Sanitized request payload (no sensitive data)';
COMMENT ON COLUMN force_sync_attempts.response_data IS 'Sanitized response payload (no sensitive data)';
COMMENT ON COLUMN force_sync_attempts.internal_workflow_time_ms IS 'Time spent in internal workflow execution';
COMMENT ON COLUMN force_sync_attempts.external_webhook_time_ms IS 'Time spent calling external OPAL webhook';
COMMENT ON COLUMN force_sync_attempts.platforms_synced IS 'Number of platforms included in the sync operation';