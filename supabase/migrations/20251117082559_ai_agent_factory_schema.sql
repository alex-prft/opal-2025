-- AI Agent Factory Database Schema
-- Created: 2025-11-17
-- Purpose: Support 6-phase AI agent creation workflow with enterprise compliance

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================================================
-- Core Agent Factory Tables
-- =============================================================================

-- Agent specifications table - stores complete agent workflow state
CREATE TABLE IF NOT EXISTS agent_factory_specifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id TEXT UNIQUE NOT NULL,
    agent_name TEXT NOT NULL,

    -- Agent requirements (Phase 0 input)
    requirements JSONB NOT NULL,

    -- Current workflow state
    current_phase TEXT NOT NULL CHECK (current_phase IN (
        'clarification',
        'documentation',
        'parallel_development',
        'implementation',
        'validation',
        'delivery',
        'completed'
    )) DEFAULT 'clarification',

    status TEXT NOT NULL CHECK (status IN (
        'not_started',
        'in_progress',
        'awaiting_approval',
        'paused',
        'completed',
        'failed',
        'cancelled'
    )) DEFAULT 'not_started',

    -- Phase results storage
    clarification_results JSONB,
    documentation_results JSONB,
    parallel_development_results JSONB,
    implementation_results JSONB,
    validation_results JSONB,
    delivery_results JSONB,

    -- Workflow metadata
    overall_confidence_score INTEGER CHECK (overall_confidence_score >= 0 AND overall_confidence_score <= 100) DEFAULT 0,
    total_phases_completed INTEGER DEFAULT 0,
    estimated_completion_time TIMESTAMPTZ,
    actual_completion_time TIMESTAMPTZ,

    -- Audit and compliance
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    -- Enterprise metadata
    compliance_level TEXT CHECK (compliance_level IN ('basic', 'enterprise', 'healthcare', 'financial')) DEFAULT 'enterprise',
    pii_scan_status TEXT CHECK (pii_scan_status IN ('pending', 'clean', 'contains_pii', 'error')) DEFAULT 'pending',
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Indexing
    CONSTRAINT agent_factory_specifications_agent_id_key UNIQUE (agent_id)
);

-- Phase execution results table - detailed logging of each phase
CREATE TABLE IF NOT EXISTS agent_factory_phase_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    specification_id UUID NOT NULL REFERENCES agent_factory_specifications(id) ON DELETE CASCADE,

    -- Phase information
    phase TEXT NOT NULL CHECK (phase IN (
        'clarification',
        'documentation',
        'parallel_development',
        'implementation',
        'validation',
        'delivery'
    )),
    subphase TEXT, -- For parallel development: 'prompt_engineer', 'tool_integrator', 'dependency_manager'

    -- Execution details
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    execution_time_ms INTEGER,
    retry_count INTEGER DEFAULT 0,

    -- Results and confidence
    result JSONB NOT NULL,
    confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
    success BOOLEAN NOT NULL DEFAULT FALSE,

    -- Resource usage tracking
    claude_api_calls INTEGER DEFAULT 0,
    supabase_queries INTEGER DEFAULT 0,
    estimated_cost_cents INTEGER DEFAULT 0,

    -- Error handling
    errors JSONB DEFAULT '[]'::jsonb,
    warnings JSONB DEFAULT '[]'::jsonb,

    -- Audit trail
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT,

    -- Unique constraint for phase tracking
    CONSTRAINT unique_phase_per_spec UNIQUE (specification_id, phase, subphase)
);

-- Approval workflow table - interactive approval system
CREATE TABLE IF NOT EXISTS agent_factory_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    specification_id UUID NOT NULL REFERENCES agent_factory_specifications(id) ON DELETE CASCADE,

    -- Approval request details
    phase TEXT NOT NULL,
    requested_action TEXT NOT NULL CHECK (requested_action IN ('approve', 'reject', 'request_revision')),
    request_reason TEXT NOT NULL,
    phase_results JSONB NOT NULL,

    -- Approval status
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'expired')) DEFAULT 'pending',
    reviewer_id TEXT,
    reviewed_at TIMESTAMPTZ,
    reviewer_feedback TEXT,

    -- Timing
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),

    -- Notification tracking
    notifications_sent INTEGER DEFAULT 0,
    last_reminder_sent TIMESTAMPTZ
);

-- Error tracking table - comprehensive error logging
CREATE TABLE IF NOT EXISTS agent_factory_errors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    specification_id UUID REFERENCES agent_factory_specifications(id) ON DELETE CASCADE,

    -- Error classification
    error_type TEXT NOT NULL CHECK (error_type IN (
        'claude_api',
        'supabase',
        'validation',
        'timeout',
        'user_error',
        'system_error',
        'compliance_error'
    )),

    phase TEXT CHECK (phase IN (
        'clarification',
        'documentation',
        'parallel_development',
        'implementation',
        'validation',
        'delivery'
    )),

    -- Error details
    error_message TEXT NOT NULL,
    error_details JSONB DEFAULT '{}'::jsonb,
    stack_trace TEXT,

    -- Recovery information
    recoverable BOOLEAN NOT NULL DEFAULT FALSE,
    suggested_action TEXT,
    auto_retry_attempted BOOLEAN DEFAULT FALSE,
    resolution_status TEXT CHECK (resolution_status IN ('unresolved', 'resolved', 'ignored')) DEFAULT 'unresolved',

    -- Context
    user_context JSONB DEFAULT '{}'::jsonb,
    system_context JSONB DEFAULT '{}'::jsonb,

    -- Audit
    occurred_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by TEXT
);

-- Resource usage tracking table - cost and performance monitoring
CREATE TABLE IF NOT EXISTS agent_factory_resource_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    specification_id UUID NOT NULL REFERENCES agent_factory_specifications(id) ON DELETE CASCADE,

    -- Time period
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,

    -- API usage
    claude_api_calls INTEGER DEFAULT 0,
    claude_tokens_input INTEGER DEFAULT 0,
    claude_tokens_output INTEGER DEFAULT 0,

    -- Database usage
    supabase_queries INTEGER DEFAULT 0,
    supabase_storage_bytes BIGINT DEFAULT 0,

    -- Performance metrics
    avg_response_time_ms INTEGER DEFAULT 0,
    max_memory_usage_mb INTEGER DEFAULT 0,
    cpu_usage_percent DECIMAL(5,2) DEFAULT 0,

    -- Cost estimation
    estimated_cost_cents INTEGER DEFAULT 0,
    cost_breakdown JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log table - comprehensive activity tracking
CREATE TABLE IF NOT EXISTS agent_factory_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    specification_id UUID REFERENCES agent_factory_specifications(id) ON DELETE CASCADE,

    -- Action details
    action TEXT NOT NULL,
    action_type TEXT CHECK (action_type IN (
        'create', 'read', 'update', 'delete',
        'approve', 'reject', 'phase_start', 'phase_complete',
        'error', 'retry', 'cancel'
    )),

    phase TEXT CHECK (phase IN (
        'clarification',
        'documentation',
        'parallel_development',
        'implementation',
        'validation',
        'delivery'
    )),

    -- Actor information
    user_id TEXT,
    user_role TEXT,
    ip_address INET,
    user_agent TEXT,

    -- Action context
    details JSONB DEFAULT '{}'::jsonb,
    before_state JSONB,
    after_state JSONB,

    -- Result
    success BOOLEAN NOT NULL DEFAULT TRUE,
    error_message TEXT,

    -- Timing
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    duration_ms INTEGER
);

-- =============================================================================
-- Indexes for Performance
-- =============================================================================

-- Primary workflow queries
CREATE INDEX IF NOT EXISTS idx_agent_factory_specs_status ON agent_factory_specifications(status, current_phase);
CREATE INDEX IF NOT EXISTS idx_agent_factory_specs_created_by ON agent_factory_specifications(created_by, created_at);
CREATE INDEX IF NOT EXISTS idx_agent_factory_specs_updated_at ON agent_factory_specifications(updated_at DESC);

-- Phase results queries
CREATE INDEX IF NOT EXISTS idx_agent_factory_phase_results_spec_phase ON agent_factory_phase_results(specification_id, phase);
CREATE INDEX IF NOT EXISTS idx_agent_factory_phase_results_created_at ON agent_factory_phase_results(created_at DESC);

-- Approval workflow queries
CREATE INDEX IF NOT EXISTS idx_agent_factory_approvals_status ON agent_factory_approvals(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_agent_factory_approvals_spec ON agent_factory_approvals(specification_id, created_at DESC);

-- Error tracking queries
CREATE INDEX IF NOT EXISTS idx_agent_factory_errors_type_phase ON agent_factory_errors(error_type, phase);
CREATE INDEX IF NOT EXISTS idx_agent_factory_errors_occurred_at ON agent_factory_errors(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_factory_errors_spec ON agent_factory_errors(specification_id, occurred_at DESC);

-- Resource usage queries
CREATE INDEX IF NOT EXISTS idx_agent_factory_resource_usage_spec_period ON agent_factory_resource_usage(specification_id, period_start);
CREATE INDEX IF NOT EXISTS idx_agent_factory_resource_usage_period ON agent_factory_resource_usage(period_start DESC);

-- Audit log queries
CREATE INDEX IF NOT EXISTS idx_agent_factory_audit_log_spec ON agent_factory_audit_log(specification_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_agent_factory_audit_log_user ON agent_factory_audit_log(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_agent_factory_audit_log_action ON agent_factory_audit_log(action_type, timestamp DESC);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_agent_factory_specs_name_search ON agent_factory_specifications USING gin(to_tsvector('english', agent_name));
CREATE INDEX IF NOT EXISTS idx_agent_factory_specs_requirements_search ON agent_factory_specifications USING gin(requirements);

-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE agent_factory_specifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_factory_phase_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_factory_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_factory_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_factory_resource_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_factory_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for specifications table
CREATE POLICY "Users can read their own agent specifications" ON agent_factory_specifications
    FOR SELECT USING (
        created_by = current_setting('request.jwt.claims', true)::json->>'sub'
        OR current_setting('request.jwt.claims', true)::json->>'role' = 'admin'
    );

CREATE POLICY "Users can create agent specifications" ON agent_factory_specifications
    FOR INSERT WITH CHECK (
        created_by = current_setting('request.jwt.claims', true)::json->>'sub'
    );

CREATE POLICY "Users can update their own agent specifications" ON agent_factory_specifications
    FOR UPDATE USING (
        created_by = current_setting('request.jwt.claims', true)::json->>'sub'
        OR current_setting('request.jwt.claims', true)::json->>'role' = 'admin'
    );

-- RLS Policies for phase results (cascade from specifications)
CREATE POLICY "Users can read phase results for their specifications" ON agent_factory_phase_results
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM agent_factory_specifications s
            WHERE s.id = specification_id
            AND (s.created_by = current_setting('request.jwt.claims', true)::json->>'sub'
                 OR current_setting('request.jwt.claims', true)::json->>'role' = 'admin')
        )
    );

CREATE POLICY "System can insert phase results" ON agent_factory_phase_results
    FOR INSERT WITH CHECK (true); -- System inserts, RLS on parent table handles security

-- RLS Policies for approvals
CREATE POLICY "Users can read approvals for their specifications" ON agent_factory_approvals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM agent_factory_specifications s
            WHERE s.id = specification_id
            AND (s.created_by = current_setting('request.jwt.claims', true)::json->>'sub'
                 OR current_setting('request.jwt.claims', true)::json->>'role' = 'admin')
        )
    );

-- Admin-only policies for sensitive tables
CREATE POLICY "Admins can read all errors" ON agent_factory_errors
    FOR SELECT USING (current_setting('request.jwt.claims', true)::json->>'role' = 'admin');

CREATE POLICY "Admins can read all resource usage" ON agent_factory_resource_usage
    FOR SELECT USING (current_setting('request.jwt.claims', true)::json->>'role' = 'admin');

CREATE POLICY "Admins can read all audit logs" ON agent_factory_audit_log
    FOR SELECT USING (current_setting('request.jwt.claims', true)::json->>'role' = 'admin');

-- =============================================================================
-- Triggers for Automation
-- =============================================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to specifications
CREATE TRIGGER update_agent_factory_specifications_updated_at
    BEFORE UPDATE ON agent_factory_specifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit log trigger function
CREATE OR REPLACE FUNCTION log_agent_factory_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO agent_factory_audit_log (
        specification_id,
        action,
        action_type,
        user_id,
        details,
        before_state,
        after_state,
        timestamp
    ) VALUES (
        COALESCE(NEW.id, OLD.id),
        CASE
            WHEN TG_OP = 'INSERT' THEN 'Agent specification created'
            WHEN TG_OP = 'UPDATE' THEN 'Agent specification updated'
            WHEN TG_OP = 'DELETE' THEN 'Agent specification deleted'
        END,
        LOWER(TG_OP)::TEXT,
        current_setting('request.jwt.claims', true)::json->>'sub',
        jsonb_build_object('table', TG_TABLE_NAME, 'operation', TG_OP),
        CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)::jsonb ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW)::jsonb ELSE NULL END,
        NOW()
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Apply audit trigger to specifications
CREATE TRIGGER agent_factory_specifications_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON agent_factory_specifications
    FOR EACH ROW EXECUTE FUNCTION log_agent_factory_changes();

-- Automatic phase completion trigger
CREATE OR REPLACE FUNCTION update_specification_on_phase_complete()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the specification when a phase completes successfully
    IF NEW.success = TRUE AND NEW.completed_at IS NOT NULL THEN
        UPDATE agent_factory_specifications
        SET
            total_phases_completed = total_phases_completed + 1,
            overall_confidence_score = (
                SELECT AVG(confidence_score)::INTEGER
                FROM agent_factory_phase_results
                WHERE specification_id = NEW.specification_id
                AND success = TRUE
                AND confidence_score IS NOT NULL
            ),
            updated_at = NOW()
        WHERE id = NEW.specification_id;

        -- If this is the delivery phase, mark as completed
        IF NEW.phase = 'delivery' THEN
            UPDATE agent_factory_specifications
            SET
                current_phase = 'completed',
                status = 'completed',
                actual_completion_time = NOW()
            WHERE id = NEW.specification_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply phase completion trigger
CREATE TRIGGER agent_factory_phase_completion_trigger
    AFTER INSERT OR UPDATE ON agent_factory_phase_results
    FOR EACH ROW EXECUTE FUNCTION update_specification_on_phase_complete();

-- =============================================================================
-- Views for Common Queries
-- =============================================================================

-- Active agent factory workflows view
CREATE OR REPLACE VIEW agent_factory_active_workflows AS
SELECT
    s.id,
    s.agent_id,
    s.agent_name,
    s.current_phase,
    s.status,
    s.overall_confidence_score,
    s.total_phases_completed,
    s.created_at,
    s.updated_at,
    s.created_by,
    COUNT(pr.id) as completed_phases,
    AVG(pr.confidence_score) as avg_confidence,
    MAX(pr.completed_at) as last_phase_completed
FROM agent_factory_specifications s
LEFT JOIN agent_factory_phase_results pr ON s.id = pr.specification_id AND pr.success = TRUE
WHERE s.status IN ('not_started', 'in_progress', 'awaiting_approval', 'paused')
AND s.deleted_at IS NULL
GROUP BY s.id, s.agent_id, s.agent_name, s.current_phase, s.status,
         s.overall_confidence_score, s.total_phases_completed, s.created_at, s.updated_at, s.created_by;

-- Factory performance metrics view
CREATE OR REPLACE VIEW agent_factory_performance_metrics AS
SELECT
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as total_agents_started,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_agents,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_agents,
    AVG(CASE
        WHEN actual_completion_time IS NOT NULL
        THEN EXTRACT(EPOCH FROM (actual_completion_time - created_at))/3600
    END) as avg_completion_hours,
    AVG(overall_confidence_score) as avg_confidence_score
FROM agent_factory_specifications
WHERE deleted_at IS NULL
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- =============================================================================
-- Functions for Common Operations
-- =============================================================================

-- Function to get agent factory statistics
CREATE OR REPLACE FUNCTION get_agent_factory_stats()
RETURNS jsonb AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'total_agents', COUNT(*),
        'active_agents', COUNT(CASE WHEN status IN ('not_started', 'in_progress', 'awaiting_approval') THEN 1 END),
        'completed_agents', COUNT(CASE WHEN status = 'completed' THEN 1 END),
        'failed_agents', COUNT(CASE WHEN status = 'failed' THEN 1 END),
        'avg_confidence_score', ROUND(AVG(overall_confidence_score), 2),
        'avg_completion_time_hours', ROUND(AVG(
            CASE
                WHEN actual_completion_time IS NOT NULL
                THEN EXTRACT(EPOCH FROM (actual_completion_time - created_at))/3600
            END
        ), 2),
        'last_updated', NOW()
    ) INTO result
    FROM agent_factory_specifications
    WHERE deleted_at IS NULL;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old data (for data retention compliance)
CREATE OR REPLACE FUNCTION cleanup_agent_factory_data(retention_days INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Soft delete old completed agents
    UPDATE agent_factory_specifications
    SET deleted_at = NOW()
    WHERE status = 'completed'
    AND actual_completion_time < NOW() - (retention_days || ' days')::INTERVAL
    AND deleted_at IS NULL;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    -- Log the cleanup action
    INSERT INTO agent_factory_audit_log (
        action,
        action_type,
        user_id,
        details,
        timestamp
    ) VALUES (
        'Data retention cleanup performed',
        'delete',
        'system',
        jsonb_build_object('retention_days', retention_days, 'deleted_count', deleted_count),
        NOW()
    );

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- Initial Configuration
-- =============================================================================

-- Insert initial configuration data if needed
INSERT INTO agent_factory_audit_log (action, action_type, user_id, details)
VALUES ('AI Agent Factory schema initialized', 'create', 'system',
        jsonb_build_object('version', '1.0', 'timestamp', NOW()))
ON CONFLICT DO NOTHING;

-- Grant appropriate permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =============================================================================
-- Schema Validation
-- =============================================================================

-- Verify all tables were created successfully
DO $$
DECLARE
    table_count INTEGER;
    expected_tables TEXT[] := ARRAY[
        'agent_factory_specifications',
        'agent_factory_phase_results',
        'agent_factory_approvals',
        'agent_factory_errors',
        'agent_factory_resource_usage',
        'agent_factory_audit_log'
    ];
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY expected_tables
    LOOP
        SELECT COUNT(*) INTO table_count
        FROM information_schema.tables
        WHERE table_name = table_name AND table_schema = 'public';

        IF table_count = 0 THEN
            RAISE EXCEPTION 'Table % was not created successfully', table_name;
        END IF;
    END LOOP;

    RAISE NOTICE 'AI Agent Factory schema validation completed successfully';
END;
$$;