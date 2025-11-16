-- ===============================
-- Force Sync Attempts Table
-- Creates telemetry table for workflow synchronization tracking
-- ===============================

-- Force sync attempts table for telemetry
CREATE TABLE IF NOT EXISTS force_sync_attempts (
    span_id VARCHAR(255) PRIMARY KEY,
    correlation_id VARCHAR(255) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    sync_scope VARCHAR(100) NOT NULL,
    triggered_by VARCHAR(100) NOT NULL,
    client_name VARCHAR(255),
    request_data JSONB NOT NULL,
    response_data JSONB,
    status VARCHAR(50) NOT NULL DEFAULT 'started',
    success BOOLEAN,
    request_size_bytes INTEGER NOT NULL DEFAULT 0,
    response_size_bytes INTEGER,
    duration_ms INTEGER,
    internal_workflow_time_ms INTEGER,
    external_webhook_time_ms INTEGER,
    external_opal_triggered BOOLEAN DEFAULT FALSE,
    platforms_synced INTEGER DEFAULT 0,
    include_rag_update BOOLEAN DEFAULT FALSE,
    industry VARCHAR(100),
    recipients_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_force_sync_attempts_correlation_id ON force_sync_attempts(correlation_id);
CREATE INDEX IF NOT EXISTS idx_force_sync_attempts_started_at ON force_sync_attempts(started_at);
CREATE INDEX IF NOT EXISTS idx_force_sync_attempts_status ON force_sync_attempts(status);
CREATE INDEX IF NOT EXISTS idx_force_sync_attempts_triggered_by ON force_sync_attempts(triggered_by);
CREATE INDEX IF NOT EXISTS idx_force_sync_attempts_client_name ON force_sync_attempts(client_name);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_force_sync_attempts_status_started ON force_sync_attempts(status, started_at);
CREATE INDEX IF NOT EXISTS idx_force_sync_attempts_success_started ON force_sync_attempts(success, started_at) WHERE success IS NOT NULL;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_force_sync_attempts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_force_sync_attempts_updated_at
    BEFORE UPDATE ON force_sync_attempts
    FOR EACH ROW
    EXECUTE FUNCTION update_force_sync_attempts_updated_at();

-- ===============================
-- ROW LEVEL SECURITY (RLS)
-- ===============================

-- Enable RLS on table
ALTER TABLE force_sync_attempts ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (services)
CREATE POLICY "Services can manage force sync attempts" ON force_sync_attempts
    FOR ALL USING (true);

-- ===============================
-- FUNCTIONS AND VIEWS
-- ===============================

-- Function to get force sync performance statistics
CREATE OR REPLACE FUNCTION get_force_sync_stats(
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '24 hours',
    end_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE(
    total_attempts BIGINT,
    successful_attempts BIGINT,
    failed_attempts BIGINT,
    avg_duration_ms NUMERIC,
    avg_request_size_bytes NUMERIC,
    avg_response_size_bytes NUMERIC,
    success_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) as total_attempts,
        COUNT(*) FILTER (WHERE success = TRUE) as successful_attempts,
        COUNT(*) FILTER (WHERE success = FALSE) as failed_attempts,
        AVG(duration_ms) as avg_duration_ms,
        AVG(request_size_bytes) as avg_request_size_bytes,
        AVG(response_size_bytes) as avg_response_size_bytes,
        CASE
            WHEN COUNT(*) > 0 THEN
                COUNT(*) FILTER (WHERE success = TRUE)::NUMERIC / COUNT(*)::NUMERIC * 100
            ELSE 0
        END as success_rate
    FROM force_sync_attempts
    WHERE started_at BETWEEN start_time AND end_time;
END;
$$ LANGUAGE 'plpgsql';

-- View for force sync monitoring
CREATE OR REPLACE VIEW force_sync_monitoring AS
SELECT
    DATE_TRUNC('hour', started_at) as hour,
    triggered_by,
    sync_scope,
    COUNT(*) as attempt_count,
    COUNT(*) FILTER (WHERE success = TRUE) as successful_count,
    COUNT(*) FILTER (WHERE success = FALSE) as failed_count,
    AVG(duration_ms) as avg_duration_ms,
    MAX(duration_ms) as max_duration_ms,
    AVG(request_size_bytes) as avg_request_size,
    ROUND(
        (COUNT(*) FILTER (WHERE success = TRUE)::DECIMAL / COUNT(*)) * 100, 2
    ) as success_rate_percent
FROM force_sync_attempts
WHERE started_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', started_at), triggered_by, sync_scope
ORDER BY hour DESC, attempt_count DESC;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON force_sync_attempts TO authenticated;
GRANT SELECT ON force_sync_monitoring TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE force_sync_attempts IS 'Telemetry table tracking Force Sync workflow synchronization attempts and performance metrics';
COMMENT ON VIEW force_sync_monitoring IS 'Provides hourly aggregated Force Sync performance metrics for monitoring';