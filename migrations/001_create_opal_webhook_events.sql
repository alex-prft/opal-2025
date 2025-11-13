-- OPAL Webhook Events Schema
-- Production-grade database schema for OPAL webhook event storage and processing

-- ============================================================================
-- Main webhook events table
-- ============================================================================

CREATE TABLE IF NOT EXISTS opal_webhook_events (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Event identification
    workflow_id TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    offset BIGINT,

    -- Event data
    payload_json JSONB NOT NULL,

    -- Security and integrity
    signature_valid BOOLEAN NOT NULL DEFAULT false,
    dedup_hash TEXT UNIQUE NOT NULL,

    -- Processing metadata
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    processing_status TEXT CHECK (processing_status IN ('queued', 'processing', 'completed', 'failed')) DEFAULT 'queued',

    -- HTTP response tracking
    http_status INTEGER NOT NULL,
    error_text TEXT,

    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Indexes for performance
-- ============================================================================

-- Primary lookup indexes
CREATE INDEX IF NOT EXISTS idx_opal_webhook_events_workflow_agent_offset
    ON opal_webhook_events (workflow_id, agent_id, offset);

CREATE INDEX IF NOT EXISTS idx_opal_webhook_events_received_at
    ON opal_webhook_events (received_at DESC);

CREATE INDEX IF NOT EXISTS idx_opal_webhook_events_dedup_hash
    ON opal_webhook_events (dedup_hash);

-- Status and filtering indexes
CREATE INDEX IF NOT EXISTS idx_opal_webhook_events_signature_valid
    ON opal_webhook_events (signature_valid, received_at DESC);

CREATE INDEX IF NOT EXISTS idx_opal_webhook_events_processing_status
    ON opal_webhook_events (processing_status, received_at DESC);

CREATE INDEX IF NOT EXISTS idx_opal_webhook_events_http_status
    ON opal_webhook_events (http_status, received_at DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_opal_webhook_events_workflow_received
    ON opal_webhook_events (workflow_id, received_at DESC);

CREATE INDEX IF NOT EXISTS idx_opal_webhook_events_agent_received
    ON opal_webhook_events (agent_id, received_at DESC);

-- JSONB indexes for payload queries
CREATE INDEX IF NOT EXISTS idx_opal_webhook_events_payload_gin
    ON opal_webhook_events USING GIN (payload_json);

-- ============================================================================
-- OPAL Configuration table (optional)
-- ============================================================================

CREATE TABLE IF NOT EXISTS opal_config (
    id SERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,

    -- Environment-specific configuration
    environment TEXT NOT NULL DEFAULT 'production',

    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT,

    -- Validation
    CONSTRAINT opal_config_key_env_unique UNIQUE (key, environment)
);

-- Index for configuration lookups
CREATE INDEX IF NOT EXISTS idx_opal_config_key_env
    ON opal_config (key, environment);

-- ============================================================================
-- Dead Letter Queue table
-- ============================================================================

CREATE TABLE IF NOT EXISTS opal_webhook_dlq (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Original event reference
    original_event_id UUID REFERENCES opal_webhook_events(id) ON DELETE SET NULL,

    -- Failed event data
    workflow_id TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    offset BIGINT,
    payload_json JSONB NOT NULL,

    -- Failure information
    failure_reason TEXT NOT NULL,
    failure_count INTEGER NOT NULL DEFAULT 1,
    last_failure_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    first_failure_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Processing attempts
    retry_after TIMESTAMPTZ,
    max_retries INTEGER NOT NULL DEFAULT 5,

    -- Resolution
    resolved BOOLEAN NOT NULL DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolved_by TEXT,
    resolution_method TEXT CHECK (resolution_method IN ('manual', 'retry', 'discard')),

    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- DLQ indexes
CREATE INDEX IF NOT EXISTS idx_opal_webhook_dlq_workflow_agent
    ON opal_webhook_dlq (workflow_id, agent_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_opal_webhook_dlq_retry_after
    ON opal_webhook_dlq (retry_after) WHERE NOT resolved;

CREATE INDEX IF NOT EXISTS idx_opal_webhook_dlq_resolved
    ON opal_webhook_dlq (resolved, created_at DESC);

-- ============================================================================
-- Processing Statistics table (for health monitoring)
-- ============================================================================

CREATE TABLE IF NOT EXISTS opal_processing_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Time window
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,

    -- Event counts
    total_events INTEGER NOT NULL DEFAULT 0,
    successful_events INTEGER NOT NULL DEFAULT 0,
    failed_events INTEGER NOT NULL DEFAULT 0,
    signature_valid_events INTEGER NOT NULL DEFAULT 0,
    signature_invalid_events INTEGER NOT NULL DEFAULT 0,

    -- Processing metrics
    avg_processing_time_ms NUMERIC,
    max_processing_time_ms NUMERIC,
    min_processing_time_ms NUMERIC,

    -- Unique identifiers processed
    unique_workflows INTEGER NOT NULL DEFAULT 0,
    unique_agents INTEGER NOT NULL DEFAULT 0,

    -- Created timestamp
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure no overlapping periods
    CONSTRAINT opal_processing_stats_period_unique UNIQUE (period_start, period_end)
);

-- Stats indexes
CREATE INDEX IF NOT EXISTS idx_opal_processing_stats_period
    ON opal_processing_stats (period_start DESC, period_end DESC);

-- ============================================================================
-- Functions and Triggers
-- ============================================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update trigger to relevant tables
CREATE TRIGGER trigger_opal_webhook_events_updated_at
    BEFORE UPDATE ON opal_webhook_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_opal_config_updated_at
    BEFORE UPDATE ON opal_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_opal_webhook_dlq_updated_at
    BEFORE UPDATE ON opal_webhook_dlq
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Default configuration entries
-- ============================================================================

INSERT INTO opal_config (key, value, description, environment) VALUES
    ('webhook_retention_days', '30', 'Number of days to retain webhook events', 'production'),
    ('max_retry_attempts', '5', 'Maximum retry attempts for failed processing', 'production'),
    ('processing_timeout_seconds', '300', 'Timeout for webhook processing in seconds', 'production'),
    ('dlq_retry_delay_minutes', '60', 'Delay before retrying DLQ items in minutes', 'production'),
    ('signature_validation_enabled', 'true', 'Enable HMAC signature validation', 'production'),
    ('idempotency_enabled', 'true', 'Enable event deduplication', 'production')
ON CONFLICT (key, environment) DO NOTHING;

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON TABLE opal_webhook_events IS 'Stores OPAL agent webhook events with HMAC verification and deduplication';
COMMENT ON COLUMN opal_webhook_events.dedup_hash IS 'SHA256 hash of workflow_id|agent_id|offset|payload for idempotency';
COMMENT ON COLUMN opal_webhook_events.signature_valid IS 'Result of HMAC-SHA256 signature verification';
COMMENT ON COLUMN opal_webhook_events.payload_json IS 'Full webhook payload as received from OPAL agent';

COMMENT ON TABLE opal_config IS 'Configuration overrides for OPAL integration settings';
COMMENT ON TABLE opal_webhook_dlq IS 'Dead letter queue for failed webhook processing attempts';
COMMENT ON TABLE opal_processing_stats IS 'Aggregated statistics for health monitoring and reporting';