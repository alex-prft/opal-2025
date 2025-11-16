-- OSA Supabase Guardrails - Governance Triggers
-- This migration creates triggers to enforce data governance policies

-- Create triggers for PII prevention on key tables
-- These will scan data before insertion/update and block PII

-- Note: Only create triggers for tables that exist
-- Future tables can have triggers added in later migrations

-- Session states - temporary classification with auto-expiration
DROP TRIGGER IF EXISTS trigger_expire_session_states ON session_states;
CREATE TRIGGER trigger_expire_session_states
    BEFORE INSERT OR UPDATE ON session_states
    FOR EACH ROW EXECUTE FUNCTION expire_session_tokens();

-- Apply PII check to session states as well
DROP TRIGGER IF EXISTS trigger_pii_check_session_states ON session_states;
CREATE TRIGGER trigger_pii_check_session_states
    BEFORE INSERT OR UPDATE ON session_states
    FOR EACH ROW EXECUTE FUNCTION prevent_pii_insertion();

-- Temporary workflow data - temporary classification
DROP TRIGGER IF EXISTS trigger_pii_check_temporary_workflow_data ON temporary_workflow_data;
CREATE TRIGGER trigger_pii_check_temporary_workflow_data
    BEFORE INSERT OR UPDATE ON temporary_workflow_data
    FOR EACH ROW EXECUTE FUNCTION prevent_pii_insertion();

-- Apply triggers to tables that exist (from 001_create_audit_system.sql)

-- Anonymous metrics (should never contain PII)
DROP TRIGGER IF EXISTS trigger_pii_check_anonymous_usage_metrics ON anonymous_usage_metrics;
CREATE TRIGGER trigger_pii_check_anonymous_usage_metrics
    BEFORE INSERT OR UPDATE ON anonymous_usage_metrics
    FOR EACH ROW EXECUTE FUNCTION prevent_pii_insertion();

-- Performance analytics (should never contain PII)
DROP TRIGGER IF EXISTS trigger_pii_check_performance_analytics ON performance_analytics;
CREATE TRIGGER trigger_pii_check_performance_analytics
    BEFORE INSERT OR UPDATE ON performance_analytics
    FOR EACH ROW EXECUTE FUNCTION prevent_pii_insertion();

-- Create a function to enable/disable PII checking for maintenance
CREATE OR REPLACE FUNCTION set_pii_check_mode(enabled BOOLEAN)
RETURNS VOID AS $$
BEGIN
    IF enabled THEN
        -- Re-enable PII check triggers for existing tables only
        ALTER TABLE session_states ENABLE TRIGGER trigger_pii_check_session_states;
        ALTER TABLE temporary_workflow_data ENABLE TRIGGER trigger_pii_check_temporary_workflow_data;
        ALTER TABLE anonymous_usage_metrics ENABLE TRIGGER trigger_pii_check_anonymous_usage_metrics;
        ALTER TABLE performance_analytics ENABLE TRIGGER trigger_pii_check_performance_analytics;

        INSERT INTO supabase_audit_log (event_type, details, severity, status)
        VALUES ('SYSTEM_EVENT', '{"event": "pii_checking_enabled"}', 'medium', 'success');
    ELSE
        -- Disable PII check triggers for maintenance
        ALTER TABLE session_states DISABLE TRIGGER trigger_pii_check_session_states;
        ALTER TABLE temporary_workflow_data DISABLE TRIGGER trigger_pii_check_temporary_workflow_data;
        ALTER TABLE anonymous_usage_metrics DISABLE TRIGGER trigger_pii_check_anonymous_usage_metrics;
        ALTER TABLE performance_analytics DISABLE TRIGGER trigger_pii_check_performance_analytics;

        INSERT INTO supabase_audit_log (event_type, details, severity, status)
        VALUES ('SYSTEM_EVENT', '{"event": "pii_checking_disabled"}', 'high', 'warning');
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled cleanup job (if supported by Supabase)
-- This will run daily to clean up expired data
CREATE OR REPLACE FUNCTION schedule_cleanup()
RETURNS VOID AS $$
BEGIN
    -- This function can be called by a cron job or scheduled task
    PERFORM cleanup_expired_data();
END;
$$ LANGUAGE plpgsql;

-- Grant permissions for service role
GRANT EXECUTE ON FUNCTION set_pii_check_mode(BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION schedule_cleanup() TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_expired_data() TO service_role;