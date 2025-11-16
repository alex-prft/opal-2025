-- ===============================
-- Force Sync Attempts Table
-- Creates telemetry table for workflow synchronization tracking
-- Date: 2024-11-15
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

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON force_sync_attempts TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE force_sync_attempts IS 'Telemetry table tracking Force Sync workflow synchronization attempts and performance metrics';