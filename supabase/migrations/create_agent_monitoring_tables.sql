-- Agent Status Tracking and Workflow Progress Monitoring Tables
-- For comprehensive OPAL Ingestion & Orchestration Service monitoring

-- Agent status tracking table
CREATE TABLE IF NOT EXISTS opal_agent_status_tracking (
    id SERIAL PRIMARY KEY,
    workflow_id TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN (
        'idle', 'starting', 'running', 'completed',
        'failed', 'timeout', 'retrying'
    )),
    execution_start TIMESTAMPTZ,
    execution_end TIMESTAMPTZ,
    execution_time_ms INTEGER,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure one status record per agent per workflow
    UNIQUE(workflow_id, agent_id)
);

-- Workflow progress tracking table
CREATE TABLE IF NOT EXISTS opal_workflow_progress (
    id SERIAL PRIMARY KEY,
    workflow_id TEXT NOT NULL UNIQUE,
    workflow_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN (
        'triggered', 'running', 'completed', 'failed'
    )),
    agents_total INTEGER NOT NULL DEFAULT 0,
    agents_completed INTEGER NOT NULL DEFAULT 0,
    agents_failed INTEGER NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    estimated_completion TIMESTAMPTZ,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent execution metrics table (for historical analysis)
CREATE TABLE IF NOT EXISTS opal_agent_metrics (
    id SERIAL PRIMARY KEY,
    workflow_id TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    execution_start TIMESTAMPTZ NOT NULL,
    execution_end TIMESTAMPTZ NOT NULL,
    execution_time_ms INTEGER NOT NULL,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    output_size_bytes INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow execution summary table (for performance analysis)
CREATE TABLE IF NOT EXISTS opal_workflow_metrics (
    id SERIAL PRIMARY KEY,
    workflow_id TEXT NOT NULL UNIQUE,
    workflow_name TEXT NOT NULL,
    total_execution_time_ms INTEGER,
    agents_successful INTEGER DEFAULT 0,
    agents_failed INTEGER DEFAULT 0,
    trigger_source TEXT,
    trigger_metadata JSONB,
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_status_workflow_id ON opal_agent_status_tracking(workflow_id);
CREATE INDEX IF NOT EXISTS idx_agent_status_agent_id ON opal_agent_status_tracking(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_status_status ON opal_agent_status_tracking(status);
CREATE INDEX IF NOT EXISTS idx_agent_status_last_updated ON opal_agent_status_tracking(last_updated);

CREATE INDEX IF NOT EXISTS idx_workflow_progress_status ON opal_workflow_progress(status);
CREATE INDEX IF NOT EXISTS idx_workflow_progress_started_at ON opal_workflow_progress(started_at);

CREATE INDEX IF NOT EXISTS idx_agent_metrics_workflow_id ON opal_agent_metrics(workflow_id);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_agent_id ON opal_agent_metrics(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_execution_start ON opal_agent_metrics(execution_start);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_success ON opal_agent_metrics(success);

CREATE INDEX IF NOT EXISTS idx_workflow_metrics_workflow_name ON opal_workflow_metrics(workflow_name);
CREATE INDEX IF NOT EXISTS idx_workflow_metrics_started_at ON opal_workflow_metrics(started_at);
CREATE INDEX IF NOT EXISTS idx_workflow_metrics_trigger_source ON opal_workflow_metrics(trigger_source);

-- Create functions for automatic metric collection
CREATE OR REPLACE FUNCTION update_workflow_progress_on_agent_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Update workflow progress when agent status changes
    UPDATE opal_workflow_progress SET
        agents_completed = (
            SELECT COUNT(*) FROM opal_agent_status_tracking
            WHERE workflow_id = NEW.workflow_id AND status = 'completed'
        ),
        agents_failed = (
            SELECT COUNT(*) FROM opal_agent_status_tracking
            WHERE workflow_id = NEW.workflow_id AND status IN ('failed', 'timeout')
        ),
        last_updated = NOW()
    WHERE workflow_id = NEW.workflow_id;

    -- Update workflow status based on agent completion
    UPDATE opal_workflow_progress SET
        status = CASE
            WHEN agents_completed + agents_failed = agents_total AND agents_failed > 0 THEN 'failed'
            WHEN agents_completed + agents_failed = agents_total AND agents_failed = 0 THEN 'completed'
            WHEN agents_completed > 0 OR agents_failed > 0 THEN 'running'
            ELSE status
        END,
        completed_at = CASE
            WHEN agents_completed + agents_failed = agents_total THEN NOW()
            ELSE completed_at
        END
    WHERE workflow_id = NEW.workflow_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic workflow progress updates
DROP TRIGGER IF EXISTS trigger_update_workflow_progress ON opal_agent_status_tracking;
CREATE TRIGGER trigger_update_workflow_progress
    AFTER INSERT OR UPDATE ON opal_agent_status_tracking
    FOR EACH ROW EXECUTE FUNCTION update_workflow_progress_on_agent_change();

-- Function to archive completed agent executions to metrics table
CREATE OR REPLACE FUNCTION archive_completed_agent_execution()
RETURNS TRIGGER AS $$
BEGIN
    -- Only archive when agent moves to completed or failed status
    IF NEW.status IN ('completed', 'failed', 'timeout') AND
       OLD.status NOT IN ('completed', 'failed', 'timeout') THEN

        INSERT INTO opal_agent_metrics (
            workflow_id, agent_id, agent_name,
            execution_start, execution_end, execution_time_ms,
            success, error_message, retry_count
        ) VALUES (
            NEW.workflow_id, NEW.agent_id, NEW.agent_name,
            COALESCE(NEW.execution_start, OLD.execution_start, NEW.created_at),
            COALESCE(NEW.execution_end, NOW()),
            COALESCE(NEW.execution_time_ms,
                EXTRACT(EPOCH FROM (COALESCE(NEW.execution_end, NOW()) -
                    COALESCE(NEW.execution_start, OLD.execution_start, NEW.created_at))) * 1000
            )::INTEGER,
            NEW.status = 'completed',
            NEW.error_message,
            NEW.retry_count
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic agent metrics archiving
DROP TRIGGER IF EXISTS trigger_archive_agent_metrics ON opal_agent_status_tracking;
CREATE TRIGGER trigger_archive_agent_metrics
    AFTER UPDATE ON opal_agent_status_tracking
    FOR EACH ROW EXECUTE FUNCTION archive_completed_agent_execution();

-- Function to archive completed workflows to metrics table
CREATE OR REPLACE FUNCTION archive_completed_workflow()
RETURNS TRIGGER AS $$
BEGIN
    -- Archive when workflow moves to completed or failed
    IF NEW.status IN ('completed', 'failed') AND OLD.status NOT IN ('completed', 'failed') THEN
        INSERT INTO opal_workflow_metrics (
            workflow_id, workflow_name,
            total_execution_time_ms, agents_successful, agents_failed,
            started_at, completed_at
        ) VALUES (
            NEW.workflow_id, NEW.workflow_name,
            EXTRACT(EPOCH FROM (NOW() - NEW.started_at)) * 1000,
            NEW.agents_completed, NEW.agents_failed,
            NEW.started_at, NOW()
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic workflow metrics archiving
DROP TRIGGER IF EXISTS trigger_archive_workflow_metrics ON opal_workflow_progress;
CREATE TRIGGER trigger_archive_workflow_metrics
    AFTER UPDATE ON opal_workflow_progress
    FOR EACH ROW EXECUTE FUNCTION archive_completed_workflow();

-- Create views for easy querying
CREATE OR REPLACE VIEW opal_agent_status_summary AS
SELECT
    ast.agent_id,
    ast.agent_name,
    ast.status,
    ast.workflow_id,
    wp.workflow_name,
    wp.started_at as workflow_started,
    ast.execution_start,
    ast.execution_end,
    ast.execution_time_ms,
    ast.retry_count,
    ast.progress_percentage,
    ast.error_message,
    ast.last_updated
FROM opal_agent_status_tracking ast
LEFT JOIN opal_workflow_progress wp ON ast.workflow_id = wp.workflow_id
ORDER BY ast.last_updated DESC;

-- View for current workflow status
CREATE OR REPLACE VIEW opal_current_workflows AS
SELECT
    wp.*,
    (wp.agents_completed::FLOAT / NULLIF(wp.agents_total, 0) * 100)::INTEGER as completion_percentage,
    CASE
        WHEN wp.status = 'completed' THEN wp.completed_at
        WHEN wp.estimated_completion IS NOT NULL THEN wp.estimated_completion
        ELSE wp.started_at + INTERVAL '5 minutes'
    END as expected_completion
FROM opal_workflow_progress wp
WHERE wp.status IN ('triggered', 'running')
   OR (wp.status IN ('completed', 'failed') AND wp.completed_at > NOW() - INTERVAL '1 hour')
ORDER BY wp.started_at DESC;

-- View for agent performance metrics
CREATE OR REPLACE VIEW opal_agent_performance AS
SELECT
    agent_id,
    agent_name,
    COUNT(*) as total_executions,
    COUNT(*) FILTER (WHERE success = true) as successful_executions,
    COUNT(*) FILTER (WHERE success = false) as failed_executions,
    (COUNT(*) FILTER (WHERE success = true)::FLOAT / COUNT(*) * 100)::NUMERIC(5,2) as success_rate,
    AVG(execution_time_ms)::INTEGER as avg_execution_time_ms,
    MIN(execution_time_ms) as min_execution_time_ms,
    MAX(execution_time_ms) as max_execution_time_ms,
    AVG(retry_count)::NUMERIC(3,1) as avg_retry_count
FROM opal_agent_metrics
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY agent_id, agent_name
ORDER BY success_rate DESC;

-- Grant permissions (adjust as needed for your security model)
-- GRANT SELECT, INSERT, UPDATE ON opal_agent_status_tracking TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON opal_workflow_progress TO authenticated;
-- GRANT SELECT ON opal_agent_metrics TO authenticated;
-- GRANT SELECT ON opal_workflow_metrics TO authenticated;
-- GRANT SELECT ON opal_agent_status_summary TO authenticated;
-- GRANT SELECT ON opal_current_workflows TO authenticated;
-- GRANT SELECT ON opal_agent_performance TO authenticated;

-- Insert comment for schema documentation
COMMENT ON TABLE opal_agent_status_tracking IS 'Real-time tracking of OPAL agent execution status';
COMMENT ON TABLE opal_workflow_progress IS 'Overall progress tracking for OPAL workflows';
COMMENT ON TABLE opal_agent_metrics IS 'Historical performance metrics for OPAL agents';
COMMENT ON TABLE opal_workflow_metrics IS 'Historical performance metrics for OPAL workflows';

COMMENT ON VIEW opal_agent_status_summary IS 'Current status of all agents with workflow context';
COMMENT ON VIEW opal_current_workflows IS 'Currently active or recently completed workflows';
COMMENT ON VIEW opal_agent_performance IS 'Performance statistics for agents over the last 30 days';