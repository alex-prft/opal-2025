-- Workflow Log Purging System for Customer Reference Cleanup
-- Automatically purges logs containing customer references while preserving analytics

-- 1. Create purge policy configuration table
CREATE TABLE IF NOT EXISTS purge_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL UNIQUE,
  retention_days INTEGER NOT NULL DEFAULT 90,
  purge_conditions JSONB NOT NULL, -- Conditions that trigger purging
  preserve_fields TEXT[] DEFAULT '{}', -- Fields to preserve for analytics
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Insert default purge policies for OPAL tables
INSERT INTO purge_policies (table_name, retention_days, purge_conditions, preserve_fields) VALUES
('opal_workflow_executions', 90,
 '{"customer_reference_patterns": ["customer_id", "user_id", "email", "external_id", "client_id"], "data_fields": ["metadata", "input_data", "output_data", "error_details"]}',
 ARRAY['id', 'workflow_type', 'status', 'created_at', 'execution_time_ms', 'agent_count']
),
('opal_agent_executions', 90,
 '{"customer_reference_patterns": ["customer_id", "user_id", "email", "external_id"], "data_fields": ["input_data", "output_data", "error_message"]}',
 ARRAY['id', 'workflow_id', 'agent_type', 'status', 'created_at', 'execution_time_ms', 'confidence_score']
),
('session_metadata', 365,
 '{"customer_reference_patterns": [], "data_fields": []}',
 ARRAY['session_id', 'session_type', 'created_at', 'expires_at']
);

-- 3. Create function to detect customer references
CREATE OR REPLACE FUNCTION contains_customer_references(
  data_value JSONB,
  reference_patterns TEXT[]
) RETURNS BOOLEAN AS $$
DECLARE
  pattern TEXT;
  data_text TEXT;
BEGIN
  IF data_value IS NULL THEN
    RETURN FALSE;
  END IF;

  data_text := data_value::text;

  -- Check for each reference pattern
  FOREACH pattern IN ARRAY reference_patterns
  LOOP
    -- Check for pattern as key
    IF data_text ~* pattern THEN
      RETURN TRUE;
    END IF;

    -- Check for email patterns if pattern is 'email'
    IF pattern = 'email' AND data_text ~* '\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b' THEN
      RETURN TRUE;
    END IF;

    -- Check for ID patterns if pattern contains 'id'
    IF pattern ILIKE '%id%' AND data_text ~* '\b[a-f0-9]{8}-?[a-f0-9]{4}-?[a-f0-9]{4}-?[a-f0-9]{4}-?[a-f0-9]{12}\b' THEN
      RETURN TRUE;
    END IF;
  END LOOP;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. Create workflow-specific purging function
CREATE OR REPLACE FUNCTION purge_workflow_executions()
RETURNS TABLE(
  purged_count INTEGER,
  preserved_count INTEGER,
  errors_encountered TEXT[]
) AS $$
DECLARE
  policy_record RECORD;
  workflow_record RECORD;
  purged INTEGER := 0;
  preserved INTEGER := 0;
  errors TEXT[] := '{}';
  reference_patterns TEXT[];
  data_fields TEXT[];
  cutoff_date TIMESTAMPTZ;
  should_purge BOOLEAN;
BEGIN
  -- Get purge policy for workflow executions
  SELECT * INTO policy_record
  FROM purge_policies
  WHERE table_name = 'opal_workflow_executions' AND enabled = true;

  IF NOT FOUND THEN
    errors := errors || 'No purge policy found for opal_workflow_executions';
    RETURN QUERY SELECT 0, 0, errors;
    RETURN;
  END IF;

  -- Extract configuration
  reference_patterns := ARRAY(SELECT jsonb_array_elements_text(policy_record.purge_conditions->'customer_reference_patterns'));
  data_fields := ARRAY(SELECT jsonb_array_elements_text(policy_record.purge_conditions->'data_fields'));
  cutoff_date := NOW() - (policy_record.retention_days || ' days')::INTERVAL;

  -- Process each workflow execution older than retention period
  FOR workflow_record IN
    SELECT * FROM opal_workflow_executions
    WHERE created_at < cutoff_date
  LOOP
    should_purge := FALSE;

    -- Check each data field for customer references
    FOR i IN 1..array_length(data_fields, 1) LOOP
      DECLARE
        field_name TEXT := data_fields[i];
        field_value JSONB;
      BEGIN
        -- Get field value dynamically
        EXECUTE format('SELECT %I FROM opal_workflow_executions WHERE id = $1', field_name)
        INTO field_value
        USING workflow_record.id;

        IF contains_customer_references(field_value, reference_patterns) THEN
          should_purge := TRUE;
          EXIT; -- Exit loop if any field contains customer references
        END IF;
      EXCEPTION WHEN OTHERS THEN
        errors := errors || ('Error checking field ' || field_name || ': ' || SQLERRM);
      END;
    END LOOP;

    IF should_purge THEN
      BEGIN
        -- Create preserved record with analytics data only
        INSERT INTO opal_workflow_executions_preserved (
          original_id,
          workflow_type,
          status,
          created_at,
          execution_time_ms,
          agent_count,
          purged_at,
          purge_reason
        ) VALUES (
          workflow_record.id,
          workflow_record.workflow_type,
          workflow_record.status,
          workflow_record.created_at,
          workflow_record.execution_time_ms,
          (SELECT COUNT(*) FROM opal_agent_executions WHERE workflow_id = workflow_record.id),
          NOW(),
          'customer_reference_detected'
        );

        -- Delete original record
        DELETE FROM opal_workflow_executions WHERE id = workflow_record.id;
        purged := purged + 1;

      EXCEPTION WHEN OTHERS THEN
        errors := errors || ('Error purging workflow ' || workflow_record.id::text || ': ' || SQLERRM);
      END;
    ELSE
      preserved := preserved + 1;
    END IF;
  END LOOP;

  RETURN QUERY SELECT purged, preserved, errors;
END;
$$ LANGUAGE plpgsql;

-- 5. Create preserved workflows table for analytics
CREATE TABLE IF NOT EXISTS opal_workflow_executions_preserved (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_id UUID NOT NULL, -- Reference to original workflow ID
  workflow_type TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  execution_time_ms INTEGER,
  agent_count INTEGER,
  purged_at TIMESTAMPTZ DEFAULT NOW(),
  purge_reason TEXT,

  -- Analytics metadata
  data_class TEXT DEFAULT 'metadata_only',

  CONSTRAINT fk_original_workflow UNIQUE(original_id)
);

-- 6. Create agent execution purging function
CREATE OR REPLACE FUNCTION purge_agent_executions()
RETURNS TABLE(
  purged_count INTEGER,
  preserved_count INTEGER,
  errors_encountered TEXT[]
) AS $$
DECLARE
  policy_record RECORD;
  agent_record RECORD;
  purged INTEGER := 0;
  preserved INTEGER := 0;
  errors TEXT[] := '{}';
  reference_patterns TEXT[];
  data_fields TEXT[];
  cutoff_date TIMESTAMPTZ;
  should_purge BOOLEAN;
BEGIN
  -- Get purge policy
  SELECT * INTO policy_record
  FROM purge_policies
  WHERE table_name = 'opal_agent_executions' AND enabled = true;

  IF NOT FOUND THEN
    errors := errors || 'No purge policy found for opal_agent_executions';
    RETURN QUERY SELECT 0, 0, errors;
    RETURN;
  END IF;

  reference_patterns := ARRAY(SELECT jsonb_array_elements_text(policy_record.purge_conditions->'customer_reference_patterns'));
  data_fields := ARRAY(SELECT jsonb_array_elements_text(policy_record.purge_conditions->'data_fields'));
  cutoff_date := NOW() - (policy_record.retention_days || ' days')::INTERVAL;

  FOR agent_record IN
    SELECT * FROM opal_agent_executions
    WHERE created_at < cutoff_date
  LOOP
    should_purge := FALSE;

    -- Check data fields for customer references
    IF contains_customer_references(agent_record.input_data, reference_patterns) OR
       contains_customer_references(agent_record.output_data, reference_patterns) OR
       (agent_record.error_message IS NOT NULL AND
        contains_customer_references(to_jsonb(agent_record.error_message), reference_patterns)) THEN
      should_purge := TRUE;
    END IF;

    IF should_purge THEN
      BEGIN
        -- Create preserved record
        INSERT INTO opal_agent_executions_preserved (
          original_id,
          workflow_id,
          agent_type,
          status,
          created_at,
          execution_time_ms,
          confidence_score,
          purged_at,
          purge_reason
        ) VALUES (
          agent_record.id,
          agent_record.workflow_id,
          agent_record.agent_type,
          agent_record.status,
          agent_record.created_at,
          agent_record.execution_time_ms,
          agent_record.confidence_score,
          NOW(),
          'customer_reference_detected'
        );

        DELETE FROM opal_agent_executions WHERE id = agent_record.id;
        purged := purged + 1;

      EXCEPTION WHEN OTHERS THEN
        errors := errors || ('Error purging agent ' || agent_record.id::text || ': ' || SQLERRM);
      END;
    ELSE
      preserved := preserved + 1;
    END IF;
  END LOOP;

  RETURN QUERY SELECT purged, preserved, errors;
END;
$$ LANGUAGE plpgsql;

-- 7. Create preserved agent executions table
CREATE TABLE IF NOT EXISTS opal_agent_executions_preserved (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_id UUID NOT NULL,
  workflow_id UUID,
  agent_type TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  execution_time_ms INTEGER,
  confidence_score DECIMAL(3,2),
  purged_at TIMESTAMPTZ DEFAULT NOW(),
  purge_reason TEXT,

  data_class TEXT DEFAULT 'metadata_only',

  CONSTRAINT fk_original_agent UNIQUE(original_id)
);

-- 8. Create comprehensive purge function
CREATE OR REPLACE FUNCTION execute_purge_policies()
RETURNS JSONB AS $$
DECLARE
  workflow_result RECORD;
  agent_result RECORD;
  session_result RECORD;
  total_purged INTEGER := 0;
  total_preserved INTEGER := 0;
  all_errors TEXT[] := '{}';
  result JSONB;
BEGIN
  -- Purge workflow executions
  SELECT * INTO workflow_result FROM purge_workflow_executions();
  total_purged := total_purged + workflow_result.purged_count;
  total_preserved := total_preserved + workflow_result.preserved_count;
  all_errors := all_errors || workflow_result.errors_encountered;

  -- Purge agent executions
  SELECT * INTO agent_result FROM purge_agent_executions();
  total_purged := total_purged + agent_result.purged_count;
  total_preserved := total_preserved + agent_result.preserved_count;
  all_errors := all_errors || agent_result.errors_encountered;

  -- Purge old session metadata (simple time-based)
  DELETE FROM session_metadata
  WHERE created_at < NOW() - INTERVAL '1 year';

  -- Log the purge operation
  INSERT INTO supabase_audit_log (
    table_name, operation, new_data, audit_category
  ) VALUES (
    'purge_system', 'PURGE_EXECUTION',
    jsonb_build_object(
      'total_purged', total_purged,
      'total_preserved', total_preserved,
      'workflow_purged', workflow_result.purged_count,
      'agent_purged', agent_result.purged_count,
      'errors', all_errors,
      'execution_time', NOW()
    ),
    'data_change'
  );

  result := jsonb_build_object(
    'success', true,
    'total_purged', total_purged,
    'total_preserved', total_preserved,
    'details', jsonb_build_object(
      'workflows', jsonb_build_object(
        'purged', workflow_result.purged_count,
        'preserved', workflow_result.preserved_count
      ),
      'agents', jsonb_build_object(
        'purged', agent_result.purged_count,
        'preserved', agent_result.preserved_count
      )
    ),
    'errors', all_errors
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 9. Create purge monitoring views
CREATE OR REPLACE VIEW purge_status AS
SELECT
  p.table_name,
  p.retention_days,
  p.enabled,
  COUNT(CASE WHEN pe.table_name = 'opal_workflow_executions_preserved' THEN 1 END) as workflows_preserved,
  COUNT(CASE WHEN pe.table_name = 'opal_agent_executions_preserved' THEN 1 END) as agents_preserved,
  MAX(pe.purged_at) as last_purge
FROM purge_policies p
LEFT JOIN (
  SELECT 'opal_workflow_executions_preserved' as table_name, purged_at FROM opal_workflow_executions_preserved
  UNION ALL
  SELECT 'opal_agent_executions_preserved' as table_name, purged_at FROM opal_agent_executions_preserved
) pe ON TRUE
GROUP BY p.table_name, p.retention_days, p.enabled;

-- 10. Create function to check purge eligibility
CREATE OR REPLACE FUNCTION check_purge_eligibility(
  table_name_param TEXT DEFAULT NULL
) RETURNS TABLE(
  table_name TEXT,
  records_eligible INTEGER,
  oldest_record TIMESTAMPTZ,
  estimated_purge_size TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    'opal_workflow_executions'::TEXT,
    COUNT(*)::INTEGER,
    MIN(owe.created_at),
    pg_size_pretty(pg_total_relation_size('opal_workflow_executions'))
  FROM opal_workflow_executions owe
  JOIN purge_policies pp ON pp.table_name = 'opal_workflow_executions'
  WHERE owe.created_at < NOW() - (pp.retention_days || ' days')::INTERVAL
    AND pp.enabled = true
    AND (table_name_param IS NULL OR table_name_param = 'opal_workflow_executions')

  UNION ALL

  SELECT
    'opal_agent_executions'::TEXT,
    COUNT(*)::INTEGER,
    MIN(oae.created_at),
    pg_size_pretty(pg_total_relation_size('opal_agent_executions'))
  FROM opal_agent_executions oae
  JOIN purge_policies pp ON pp.table_name = 'opal_agent_executions'
  WHERE oae.created_at < NOW() - (pp.retention_days || ' days')::INTERVAL
    AND pp.enabled = true
    AND (table_name_param IS NULL OR table_name_param = 'opal_agent_executions');
END;
$$ LANGUAGE plpgsql;

-- 11. Create indexes on preserved tables for performance
CREATE INDEX IF NOT EXISTS idx_workflow_preserved_original_id ON opal_workflow_executions_preserved(original_id);
CREATE INDEX IF NOT EXISTS idx_workflow_preserved_created_at ON opal_workflow_executions_preserved(created_at);
CREATE INDEX IF NOT EXISTS idx_workflow_preserved_workflow_type ON opal_workflow_executions_preserved(workflow_type);

CREATE INDEX IF NOT EXISTS idx_agent_preserved_original_id ON opal_agent_executions_preserved(original_id);
CREATE INDEX IF NOT EXISTS idx_agent_preserved_workflow_id ON opal_agent_executions_preserved(workflow_id);
CREATE INDEX IF NOT EXISTS idx_agent_preserved_created_at ON opal_agent_executions_preserved(created_at);

-- 12. Set up automatic purging (requires pg_cron)
-- Run daily at 2 AM
-- SELECT cron.schedule('execute-purge-policies', '0 2 * * *', 'SELECT execute_purge_policies();');

-- 13. Grant permissions
GRANT SELECT ON purge_policies TO authenticated;
GRANT SELECT ON purge_status TO authenticated;
GRANT SELECT ON opal_workflow_executions_preserved TO authenticated;
GRANT SELECT ON opal_agent_executions_preserved TO authenticated;
GRANT EXECUTE ON FUNCTION check_purge_eligibility(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION execute_purge_policies() TO service_role; -- Restricted function

-- Comments
COMMENT ON TABLE purge_policies IS 'Configuration for automatic purging of customer reference data';
COMMENT ON TABLE opal_workflow_executions_preserved IS 'Analytics-safe preserved data from purged workflows';
COMMENT ON TABLE opal_agent_executions_preserved IS 'Analytics-safe preserved data from purged agents';
COMMENT ON FUNCTION contains_customer_references IS 'Detects customer references in JSONB data';
COMMENT ON FUNCTION execute_purge_policies IS 'Executes all configured purge policies';
COMMENT ON VIEW purge_status IS 'Shows current status of purge operations';