-- OSA Supabase Guardrails - Data Governance Functions
-- This migration creates database-level functions for PII protection and data governance

-- Function to detect PII patterns in JSON data
CREATE OR REPLACE FUNCTION detect_pii_in_json(input_json JSONB) 
RETURNS TABLE(field_path TEXT, pii_type TEXT, detected_value TEXT) 
LANGUAGE plpgsql AS $$
DECLARE
    json_text TEXT;
    email_pattern TEXT := '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}';
    phone_pattern TEXT := '(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})';
    ssn_pattern TEXT := '\d{3}-?\d{2}-?\d{4}';
    credit_card_pattern TEXT := '(?:\d{4}[-\s]?){3}\d{4}';
    ip_pattern TEXT := '(?:[0-9]{1,3}\.){3}[0-9]{1,3}';
BEGIN
    -- Convert JSON to text for pattern matching
    json_text := input_json::TEXT;
    
    -- Check for email patterns
    IF json_text ~* email_pattern THEN
        field_path := 'unknown';
        pii_type := 'email';
        detected_value := substring(json_text from email_pattern);
        RETURN NEXT;
    END IF;
    
    -- Check for phone patterns
    IF json_text ~* phone_pattern THEN
        field_path := 'unknown';
        pii_type := 'phone';
        detected_value := 'REDACTED';
        RETURN NEXT;
    END IF;
    
    -- Check for SSN patterns
    IF json_text ~* ssn_pattern THEN
        field_path := 'unknown';
        pii_type := 'ssn';
        detected_value := 'REDACTED';
        RETURN NEXT;
    END IF;
    
    -- Check for credit card patterns
    IF json_text ~* credit_card_pattern THEN
        field_path := 'unknown';
        pii_type := 'credit_card';
        detected_value := 'REDACTED';
        RETURN NEXT;
    END IF;
    
    -- Check for IP address patterns
    IF json_text ~* ip_pattern THEN
        field_path := 'unknown';
        pii_type := 'ip_address';
        detected_value := 'REDACTED';
        RETURN NEXT;
    END IF;
END;
$$;

-- PII prevention trigger function
CREATE OR REPLACE FUNCTION prevent_pii_insertion()
RETURNS TRIGGER AS $$
DECLARE
    pii_found RECORD;
    json_text TEXT;
BEGIN
    -- Convert the entire row to JSON for scanning
    json_text := row_to_json(NEW)::TEXT;
    
    -- Scan for PII patterns
    FOR pii_found IN SELECT * FROM detect_pii_in_json(row_to_json(NEW)::JSONB)
    LOOP
        -- Log the PII violation attempt
        INSERT INTO supabase_audit_log (
            event_type,
            table_name,
            operation,
            details,
            severity,
            status,
            created_at
        ) VALUES (
            'PII_VIOLATION',
            TG_TABLE_NAME,
            TG_OP,
            jsonb_build_object(
                'pii_type', pii_found.pii_type,
                'field_path', pii_found.field_path,
                'blocked', true,
                'trigger', 'prevent_pii_insertion'
            ),
            'critical',
            'warning',
            NOW()
        );
        
        -- Raise exception to prevent the insert/update
        RAISE EXCEPTION 'PII_VIOLATION: % detected in table %. Operation blocked for data protection.', 
            pii_found.pii_type, TG_TABLE_NAME;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Data classification enforcement function
CREATE OR REPLACE FUNCTION enforce_data_classification()
RETURNS TRIGGER AS $$
BEGIN
    -- Block operations on restricted tables
    IF TG_TABLE_NAME = ANY(ARRAY['customer_data', 'personal_info', 'pii_data', 'crm_leads']) THEN
        INSERT INTO supabase_audit_log (
            event_type,
            table_name,
            operation,
            details,
            severity,
            status
        ) VALUES (
            'POLICY_VIOLATION',
            TG_TABLE_NAME,
            TG_OP,
            jsonb_build_object(
                'violation_type', 'restricted_table_access',
                'message', 'Access to restricted table blocked'
            ),
            'critical',
            'warning'
        );
        
        RAISE EXCEPTION 'RESTRICTED_TABLE: Direct access to % not allowed for data protection compliance', TG_TABLE_NAME;
    END IF;
    
    -- Log configuration table access
    IF TG_TABLE_NAME = ANY(ARRAY['opal_configurations', 'opal_agent_configs', 'system_settings']) THEN
        INSERT INTO supabase_audit_log (
            event_type,
            table_name,
            operation,
            details,
            severity,
            status
        ) VALUES (
            'CONFIGURATION_CHANGE',
            TG_TABLE_NAME,
            TG_OP,
            jsonb_build_object(
                'trigger_source', 'database_trigger'
            ),
            'medium',
            'success'
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Session token expiration function
CREATE OR REPLACE FUNCTION expire_session_tokens()
RETURNS TRIGGER AS $$
BEGIN
    -- Automatically set expiration for session tokens if not provided
    IF TG_TABLE_NAME = 'session_states' AND NEW.expires_at IS NULL THEN
        NEW.expires_at := NOW() + INTERVAL '24 hours';
    END IF;
    
    -- Set updated_at timestamp
    NEW.updated_at := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired data
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS VOID AS $$
BEGIN
    -- Clean up expired sessions
    DELETE FROM session_states WHERE expires_at < NOW();
    
    -- Clean up expired temporary workflow data
    DELETE FROM temporary_workflow_data WHERE expires_at < NOW();
    
    -- Clean up old cache invalidation queue entries
    DELETE FROM cache_invalidation_queue 
    WHERE processed = true AND created_at < NOW() - INTERVAL '1 day';
    
    -- Log cleanup activity
    INSERT INTO supabase_audit_log (
        event_type,
        operation,
        details,
        severity,
        status
    ) VALUES (
        'DATA_RETENTION',
        'cleanup',
        jsonb_build_object(
            'cleanup_type', 'expired_data_automatic',
            'timestamp', NOW()
        ),
        'low',
        'success'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get table columns (for retention manager)
CREATE OR REPLACE FUNCTION get_table_columns(table_name TEXT)
RETURNS TABLE(column_name TEXT, data_type TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.column_name::TEXT,
        c.data_type::TEXT
    FROM information_schema.columns c
    WHERE c.table_name = $1
    AND c.table_schema = 'public';
END;
$$ LANGUAGE plpgsql;

-- Function to create archive tables
CREATE OR REPLACE FUNCTION create_archive_table(original_table TEXT, archive_table TEXT)
RETURNS VOID AS $$
DECLARE
    create_sql TEXT;
BEGIN
    -- Get the structure of the original table and create archive table
    SELECT INTO create_sql
        'CREATE TABLE IF NOT EXISTS ' || archive_table || ' AS SELECT *, 
         NULL::TIMESTAMP WITH TIME ZONE as archived_at,
         NULL::TEXT as original_table
         FROM ' || original_table || ' WHERE false';
    
    EXECUTE create_sql;
    
    -- Add archived_at column with default
    EXECUTE 'ALTER TABLE ' || archive_table || ' 
             ALTER COLUMN archived_at SET DEFAULT NOW(),
             ALTER COLUMN original_table SET DEFAULT ''' || original_table || '''';
    
    -- Log archive table creation
    INSERT INTO supabase_audit_log (
        event_type,
        details,
        severity,
        status
    ) VALUES (
        'SYSTEM_EVENT',
        jsonb_build_object(
            'event', 'archive_table_created',
            'original_table', original_table,
            'archive_table', archive_table
        ),
        'low',
        'success'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to execute purge policies (called by retention manager)
CREATE OR REPLACE FUNCTION execute_purge_policies()
RETURNS TABLE(table_name TEXT, records_purged INTEGER) AS $$
DECLARE
    rec RECORD;
    purge_count INTEGER;
BEGIN
    -- This is a placeholder that will be called by the application
    -- The actual logic is implemented in the DataRetentionManager
    table_name := 'system';
    records_purged := 0;
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to check purge eligibility
CREATE OR REPLACE FUNCTION check_purge_eligibility(table_name TEXT, retention_days INTEGER)
RETURNS TABLE(eligible_count INTEGER) AS $$
BEGIN
    -- This is a helper function for the retention manager
    RETURN QUERY
    SELECT 0 as eligible_count; -- Placeholder
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;