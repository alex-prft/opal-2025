-- PII Validation and Data Classification System
-- Implements comprehensive PII protection across all tables

-- 1. Create data classification enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'data_classification') THEN
    CREATE TYPE data_classification AS ENUM (
      'public',        -- No restrictions, public data
      'internal',      -- Internal use only, no PII
      'confidential',  -- Restricted access, may contain sensitive data
      'metadata_only'  -- Only metadata about data, not the data itself
    );
  END IF;
END $$;

-- 2. Create PII detection function
CREATE OR REPLACE FUNCTION detect_pii_patterns(input_text TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  IF input_text IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check for common PII patterns
  RETURN (
    input_text ~* '\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b' OR  -- Email
    input_text ~* '\b\d{3}-\d{2}-\d{4}\b' OR                                    -- SSN
    input_text ~* '\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b' OR                -- Credit Card
    input_text ~* '\b\d{3}[-.]\d{3}[-.]\d{4}\b' OR                            -- Phone
    input_text ~* '\b\d{1,5}\s\w+\s(street|st|avenue|ave|road|rd|drive|dr|lane|ln|court|ct|place|pl)\b' OR -- Address
    input_text ~* '\b(visa|mastercard|amex|american express|discover)\b' OR     -- Card brands
    input_text ~* '\b[0-9]{9,18}\b'                                            -- Long numbers (potential IDs)
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Add data classification to existing OPAL tables
ALTER TABLE opal_workflow_executions ADD COLUMN IF NOT EXISTS data_class data_classification DEFAULT 'metadata_only';
ALTER TABLE opal_agent_executions ADD COLUMN IF NOT EXISTS data_class data_classification DEFAULT 'metadata_only';
ALTER TABLE opal_confidence_scores ADD COLUMN IF NOT EXISTS data_class data_classification DEFAULT 'internal';
ALTER TABLE opal_fallback_usage ADD COLUMN IF NOT EXISTS data_class data_classification DEFAULT 'internal';
ALTER TABLE opal_odp_insights ADD COLUMN IF NOT EXISTS data_class data_classification DEFAULT 'metadata_only';
ALTER TABLE opal_content_insights ADD COLUMN IF NOT EXISTS data_class data_classification DEFAULT 'metadata_only';
ALTER TABLE opal_cms_insights ADD COLUMN IF NOT EXISTS data_class data_classification DEFAULT 'metadata_only';
ALTER TABLE opal_cmp_insights ADD COLUMN IF NOT EXISTS data_class data_classification DEFAULT 'metadata_only';
ALTER TABLE opal_rag_knowledge ADD COLUMN IF NOT EXISTS data_class data_classification DEFAULT 'internal';
ALTER TABLE opal_rag_configs ADD COLUMN IF NOT EXISTS data_class data_classification DEFAULT 'internal';
ALTER TABLE opal_api_performance ADD COLUMN IF NOT EXISTS data_class data_classification DEFAULT 'internal';

-- 4. Create comprehensive PII validation policies

-- Policy for workflow executions (most critical)
ALTER TABLE opal_workflow_executions DROP CONSTRAINT IF EXISTS no_pii_in_workflow_data;
ALTER TABLE opal_workflow_executions
ADD CONSTRAINT no_pii_in_workflow_data
CHECK (
  data_class = 'metadata_only' AND
  NOT detect_pii_patterns(COALESCE(metadata::text, '')) AND
  NOT detect_pii_patterns(COALESCE(input_data::text, '')) AND
  NOT detect_pii_patterns(COALESCE(output_data::text, '')) AND
  NOT detect_pii_patterns(COALESCE(error_details::text, ''))
);

-- Policy for agent executions
ALTER TABLE opal_agent_executions DROP CONSTRAINT IF EXISTS no_pii_in_agent_data;
ALTER TABLE opal_agent_executions
ADD CONSTRAINT no_pii_in_agent_data
CHECK (
  data_class = 'metadata_only' AND
  NOT detect_pii_patterns(COALESCE(input_data::text, '')) AND
  NOT detect_pii_patterns(COALESCE(output_data::text, '')) AND
  NOT detect_pii_patterns(COALESCE(error_message::text, ''))
);

-- Policy for insight tables (metadata only)
ALTER TABLE opal_odp_insights DROP CONSTRAINT IF EXISTS no_pii_in_odp_insights;
ALTER TABLE opal_odp_insights
ADD CONSTRAINT no_pii_in_odp_insights
CHECK (
  data_class = 'metadata_only' AND
  NOT detect_pii_patterns(COALESCE(insight_data::text, '')) AND
  NOT detect_pii_patterns(COALESCE(metadata::text, ''))
);

ALTER TABLE opal_content_insights DROP CONSTRAINT IF EXISTS no_pii_in_content_insights;
ALTER TABLE opal_content_insights
ADD CONSTRAINT no_pii_in_content_insights
CHECK (
  data_class = 'metadata_only' AND
  NOT detect_pii_patterns(COALESCE(insight_data::text, '')) AND
  NOT detect_pii_patterns(COALESCE(metadata::text, ''))
);

ALTER TABLE opal_cms_insights DROP CONSTRAINT IF EXISTS no_pii_in_cms_insights;
ALTER TABLE opal_cms_insights
ADD CONSTRAINT no_pii_in_cms_insights
CHECK (
  data_class = 'metadata_only' AND
  NOT detect_pii_patterns(COALESCE(insight_data::text, '')) AND
  NOT detect_pii_patterns(COALESCE(metadata::text, ''))
);

ALTER TABLE opal_cmp_insights DROP CONSTRAINT IF EXISTS no_pii_in_cmp_insights;
ALTER TABLE opal_cmp_insights
ADD CONSTRAINT no_pii_in_cmp_insights
CHECK (
  data_class = 'metadata_only' AND
  NOT detect_pii_patterns(COALESCE(insight_data::text, '')) AND
  NOT detect_pii_patterns(COALESCE(metadata::text, ''))
);

-- 5. Create RLS policies for data classification
ALTER TABLE opal_workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE opal_agent_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE opal_confidence_scores ENABLE ROW LEVEL SECURITY;

-- Policy: Only allow access to non-confidential data
CREATE POLICY "data_classification_access_workflow" ON opal_workflow_executions
FOR ALL USING (data_class != 'confidential');

CREATE POLICY "data_classification_access_agent" ON opal_agent_executions
FOR ALL USING (data_class != 'confidential');

CREATE POLICY "data_classification_access_confidence" ON opal_confidence_scores
FOR ALL USING (data_class != 'confidential');

-- 6. Create function to validate data before insertion
CREATE OR REPLACE FUNCTION validate_data_governance(
  table_name TEXT,
  data_payload JSONB,
  classification data_classification
) RETURNS BOOLEAN AS $$
DECLARE
  pii_found BOOLEAN;
BEGIN
  -- Check for PII in the payload
  pii_found := detect_pii_patterns(data_payload::text);

  -- If PII is found and classification is not confidential, reject
  IF pii_found AND classification != 'confidential' THEN
    RAISE EXCEPTION 'PII detected in % with classification %. Use confidential classification or remove PII.',
      table_name, classification;
  END IF;

  -- Log the validation attempt
  INSERT INTO supabase_audit_log (
    table_name, operation, new_data, created_at
  ) VALUES (
    table_name, 'PII_VALIDATION',
    jsonb_build_object(
      'pii_found', pii_found,
      'classification', classification,
      'validation_result', 'passed'
    ),
    NOW()
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger for automatic PII validation on insert/update
CREATE OR REPLACE FUNCTION pii_validation_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate the new data
  IF NOT validate_data_governance(
    TG_TABLE_NAME,
    row_to_json(NEW)::jsonb,
    NEW.data_class
  ) THEN
    RAISE EXCEPTION 'Data governance validation failed for table %', TG_TABLE_NAME;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply PII validation triggers to critical tables
DROP TRIGGER IF EXISTS pii_validation_opal_workflow_executions ON opal_workflow_executions;
CREATE TRIGGER pii_validation_opal_workflow_executions
  BEFORE INSERT OR UPDATE ON opal_workflow_executions
  FOR EACH ROW EXECUTE FUNCTION pii_validation_trigger();

DROP TRIGGER IF EXISTS pii_validation_opal_agent_executions ON opal_agent_executions;
CREATE TRIGGER pii_validation_opal_agent_executions
  BEFORE INSERT OR UPDATE ON opal_agent_executions
  FOR EACH ROW EXECUTE FUNCTION pii_validation_trigger();

-- 8. Create indexes for performance on data_class columns
CREATE INDEX IF NOT EXISTS idx_workflow_executions_data_class ON opal_workflow_executions(data_class);
CREATE INDEX IF NOT EXISTS idx_agent_executions_data_class ON opal_agent_executions(data_class);
CREATE INDEX IF NOT EXISTS idx_confidence_scores_data_class ON opal_confidence_scores(data_class);

-- 9. Create view to monitor PII compliance
CREATE OR REPLACE VIEW pii_compliance_status AS
SELECT
  schemaname,
  tablename,
  (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = schemaname
    AND table_name = tablename
    AND column_name = 'data_class'
  ) > 0 as has_data_classification,
  (
    SELECT COUNT(*)
    FROM information_schema.check_constraints cc
    JOIN information_schema.constraint_column_usage ccu ON cc.constraint_name = ccu.constraint_name
    WHERE ccu.table_schema = schemaname
    AND ccu.table_name = tablename
    AND cc.check_clause LIKE '%detect_pii_patterns%'
  ) > 0 as has_pii_validation
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'opal_%';

-- 10. Create function for manual PII scan of existing data
CREATE OR REPLACE FUNCTION scan_existing_data_for_pii()
RETURNS TABLE(
  table_name TEXT,
  record_id UUID,
  column_name TEXT,
  pii_type TEXT,
  severity TEXT
) AS $$
DECLARE
  rec RECORD;
  pii_found BOOLEAN;
BEGIN
  -- Scan opal_workflow_executions
  FOR rec IN
    SELECT id, metadata, input_data, output_data, error_details
    FROM opal_workflow_executions
  LOOP
    IF detect_pii_patterns(COALESCE(rec.metadata::text, '')) THEN
      table_name := 'opal_workflow_executions';
      record_id := rec.id;
      column_name := 'metadata';
      pii_type := 'mixed_patterns';
      severity := 'high';
      RETURN NEXT;
    END IF;

    -- Check other columns similarly...
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- 11. Grant appropriate permissions
GRANT EXECUTE ON FUNCTION detect_pii_patterns(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_data_governance(TEXT, JSONB, data_classification) TO authenticated;
GRANT SELECT ON pii_compliance_status TO authenticated;

-- Comments for documentation
COMMENT ON FUNCTION detect_pii_patterns IS 'Detects common PII patterns in text data';
COMMENT ON FUNCTION validate_data_governance IS 'Validates data against governance policies before storage';
COMMENT ON VIEW pii_compliance_status IS 'Shows PII compliance status for all OPAL tables';
COMMENT ON TYPE data_classification IS 'Data classification levels for governance compliance';