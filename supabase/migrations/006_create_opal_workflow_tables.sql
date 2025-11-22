-- ===============================
-- OPAL Workflow Management Tables
-- Creates core workflow execution and agent tracking tables for P0-002 database integration
-- Date: 2025-11-22
-- Resolves: opal_agent_executions table missing (PGRST205 error)
-- ===============================

-- Workflow Executions - Track each Opal workflow run
CREATE TABLE IF NOT EXISTS opal_workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'triggered',
    -- Status: triggered, running, completed, failed, cancelled

    -- Form Data (from /engine submission)
    client_name VARCHAR(500) NOT NULL,
    industry VARCHAR(255),
    company_size VARCHAR(100),
    current_capabilities JSONB,
    business_objectives JSONB,
    additional_marketing_technology JSONB,
    timeline_preference VARCHAR(50),
    budget_range VARCHAR(50),
    recipients JSONB,

    -- Execution Metadata
    triggered_by VARCHAR(100) DEFAULT 'form_submission', -- form_submission, daily_sync, force_sync
    trigger_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    error_message TEXT,

    -- Progress Tracking
    current_step VARCHAR(100),
    progress_percentage INTEGER DEFAULT 0,
    expected_agents JSONB, -- Array of agent names
    completed_agents JSONB DEFAULT '[]'::jsonb,
    failed_agents JSONB DEFAULT '[]'::jsonb,

    -- Scheduling
    scheduled_for TIMESTAMPTZ, -- For daily sync at 9am ET
    last_sync_at TIMESTAMPTZ,
    force_sync_requested BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent Executions - Track individual agent runs within workflows
-- IMPORTANT: Using 'agent_data' field to match WorkflowDatabaseOperations.getLatestAgentExecution() expectations
CREATE TABLE IF NOT EXISTS opal_agent_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES opal_workflow_executions(id) ON DELETE CASCADE,

    agent_name VARCHAR(100) NOT NULL,
    agent_type VARCHAR(50), -- content_review, geo_audit, audience_suggester, etc.
    execution_order INTEGER,

    -- Execution Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    -- Status: pending, in_progress, completed, failed, skipped

    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,

    -- Input/Output Data
    input_data JSONB,
    agent_data JSONB, -- CHANGED: Using 'agent_data' instead of 'output_data' to match code expectations
    workflow_context JSONB, -- Data received from previous agents

    -- Error Handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 2,
    timeout_ms INTEGER DEFAULT 120000, -- 2 minutes default

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===============================
-- INDEXES FOR PERFORMANCE
-- ===============================

-- Workflow Execution Indexes
CREATE INDEX IF NOT EXISTS idx_opal_workflows_status ON opal_workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_opal_workflows_session ON opal_workflow_executions(session_id);
CREATE INDEX IF NOT EXISTS idx_opal_workflows_scheduled ON opal_workflow_executions(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_opal_workflows_client ON opal_workflow_executions(client_name);
CREATE INDEX IF NOT EXISTS idx_opal_workflows_created ON opal_workflow_executions(created_at);

-- Agent Execution Indexes (Critical for P0-002 database-first queries)
CREATE INDEX IF NOT EXISTS idx_opal_agents_workflow ON opal_agent_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_opal_agents_status ON opal_agent_executions(status);
CREATE INDEX IF NOT EXISTS idx_opal_agents_name ON opal_agent_executions(agent_name);
CREATE INDEX IF NOT EXISTS idx_opal_agents_name_status_created ON opal_agent_executions(agent_name, status, created_at DESC);

-- ===============================
-- FUNCTIONS AND TRIGGERS
-- ===============================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_opal_workflow_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER IF NOT EXISTS trigger_opal_workflows_updated_at
    BEFORE UPDATE ON opal_workflow_executions
    FOR EACH ROW EXECUTE FUNCTION update_opal_workflow_updated_at();

CREATE TRIGGER IF NOT EXISTS trigger_opal_agents_updated_at
    BEFORE UPDATE ON opal_agent_executions
    FOR EACH ROW EXECUTE FUNCTION update_opal_workflow_updated_at();

-- ===============================
-- ROW LEVEL SECURITY (RLS)
-- ===============================

-- Enable RLS on tables
ALTER TABLE opal_workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE opal_agent_executions ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (services)
CREATE POLICY "Services can manage workflow executions" ON opal_workflow_executions
    FOR ALL USING (true);

CREATE POLICY "Services can manage agent executions" ON opal_agent_executions
    FOR ALL USING (true);

-- ===============================
-- GRANTS AND PERMISSIONS
-- ===============================

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON opal_workflow_executions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON opal_agent_executions TO authenticated;

-- ===============================
-- COMMENTS AND DOCUMENTATION
-- ===============================

COMMENT ON TABLE opal_workflow_executions IS 'Main workflow execution tracking table - stores each Opal workflow run triggered from /engine form or scheduled sync';
COMMENT ON TABLE opal_agent_executions IS 'Individual agent execution tracking within workflows - enables detailed monitoring of each agent step for P0-002 database integration';
COMMENT ON COLUMN opal_agent_executions.agent_data IS 'OPAL agent execution results - matches WorkflowDatabaseOperations.getLatestAgentExecution() expectations';

-- ===============================
-- VALIDATION QUERY
-- ===============================

-- Validation: Check that the tables were created successfully
DO $$
BEGIN
    -- Verify opal_workflow_executions table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'opal_workflow_executions'
        AND table_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'Failed to create opal_workflow_executions table';
    END IF;

    -- Verify opal_agent_executions table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'opal_agent_executions'
        AND table_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'Failed to create opal_agent_executions table';
    END IF;

    -- Verify agent_data column exists (not output_data)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'opal_agent_executions'
        AND column_name = 'agent_data'
        AND table_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'Failed to create agent_data column in opal_agent_executions';
    END IF;

    RAISE NOTICE 'OPAL workflow tables created successfully for P0-002 database integration';
END $$;