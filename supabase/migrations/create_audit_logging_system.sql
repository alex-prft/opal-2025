-- Comprehensive Audit Logging System for Borderline Data
-- Captures security-relevant metadata while respecting PII policies

-- 1. Create audit log table if not exists
CREATE TABLE IF NOT EXISTS supabase_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL, -- INSERT, UPDATE, DELETE, PII_SCAN, LOGIN, etc.
  old_data JSONB,
  new_data JSONB,

  -- User context (internal users, not customers)
  user_id TEXT,
  auth_method TEXT, -- 'bearer_token', 'session', 'api_key'

  -- Request context (hashed for privacy)
  ip_hash TEXT, -- SHA256 hash of IP address
  user_agent_hash TEXT, -- SHA256 hash of user agent
  request_id TEXT, -- For tracing requests
  session_id TEXT, -- Links to session_metadata

  -- Security metadata
  threat_level TEXT DEFAULT 'none' CHECK (threat_level IN ('none', 'low', 'medium', 'high', 'critical')),
  security_flags JSONB DEFAULT '{}', -- Flexible security metadata

  -- PII compliance tracking
  pii_scan_result JSONB, -- Results from PII scanner
  data_classification TEXT DEFAULT 'internal',
  compliance_status TEXT DEFAULT 'unknown' CHECK (compliance_status IN ('compliant', 'violation', 'review_needed', 'unknown')),

  -- Timing and tracking
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  processed_at TIMESTAMPTZ,

  -- Data governance
  retention_policy TEXT DEFAULT 'standard', -- 'standard', 'extended', 'permanent'
  audit_category TEXT DEFAULT 'general' -- 'security', 'pii', 'access', 'data_change', 'general'
);

-- 2. Create indexes for performance and queries
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON supabase_audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_operation ON supabase_audit_log(operation);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON supabase_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON supabase_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_threat_level ON supabase_audit_log(threat_level);
CREATE INDEX IF NOT EXISTS idx_audit_log_compliance_status ON supabase_audit_log(compliance_status);
CREATE INDEX IF NOT EXISTS idx_audit_log_audit_category ON supabase_audit_log(audit_category);
CREATE INDEX IF NOT EXISTS idx_audit_log_ip_hash ON supabase_audit_log(ip_hash);

-- GIN index for JSONB fields
CREATE INDEX IF NOT EXISTS idx_audit_log_security_flags ON supabase_audit_log USING gin(security_flags);
CREATE INDEX IF NOT EXISTS idx_audit_log_pii_scan_result ON supabase_audit_log USING gin(pii_scan_result);

-- 3. Create enhanced audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
  user_context TEXT;
  ip_context TEXT;
  ua_context TEXT;
BEGIN
  -- Get current user context (if available)
  user_context := COALESCE(auth.uid()::text, current_setting('app.current_user_id', true), 'system');

  -- Get request context from application settings (set by middleware)
  ip_context := current_setting('app.client_ip_hash', true);
  ua_context := current_setting('app.user_agent_hash', true);

  INSERT INTO supabase_audit_log (
    table_name,
    operation,
    old_data,
    new_data,
    user_id,
    ip_hash,
    user_agent_hash,
    request_id,
    audit_category,
    created_at
  ) VALUES (
    TG_TABLE_NAME,
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)::jsonb ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW)::jsonb ELSE NULL END,
    user_context,
    NULLIF(ip_context, ''),
    NULLIF(ua_context, ''),
    current_setting('app.request_id', true),
    CASE
      WHEN TG_TABLE_NAME LIKE '%session%' THEN 'security'
      WHEN TG_TABLE_NAME LIKE '%opal%' THEN 'data_change'
      ELSE 'general'
    END,
    NOW()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 4. Create security event logging function
CREATE OR REPLACE FUNCTION log_security_event(
  event_type TEXT,
  event_data JSONB DEFAULT '{}',
  threat_level TEXT DEFAULT 'low',
  user_context TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO supabase_audit_log (
    table_name,
    operation,
    new_data,
    user_id,
    ip_hash,
    user_agent_hash,
    threat_level,
    security_flags,
    audit_category,
    compliance_status
  ) VALUES (
    'security_events',
    event_type,
    event_data,
    COALESCE(user_context, auth.uid()::text),
    current_setting('app.client_ip_hash', true),
    current_setting('app.user_agent_hash', true),
    threat_level,
    jsonb_build_object(
      'event_type', event_type,
      'automated', true,
      'source', 'security_monitor'
    ),
    'security',
    'review_needed'
  ) RETURNING id INTO log_id;

  RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- 5. Create PII violation logging function
CREATE OR REPLACE FUNCTION log_pii_violation(
  violation_data JSONB,
  severity TEXT DEFAULT 'medium',
  table_context TEXT DEFAULT 'unknown'
) RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO supabase_audit_log (
    table_name,
    operation,
    new_data,
    user_id,
    threat_level,
    pii_scan_result,
    audit_category,
    compliance_status
  ) VALUES (
    table_context,
    'PII_VIOLATION',
    violation_data,
    auth.uid()::text,
    CASE severity
      WHEN 'critical' THEN 'critical'
      WHEN 'high' THEN 'high'
      WHEN 'medium' THEN 'medium'
      ELSE 'low'
    END,
    violation_data,
    'pii',
    'violation'
  ) RETURNING id INTO log_id;

  RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- 6. Create access logging function
CREATE OR REPLACE FUNCTION log_data_access(
  accessed_table TEXT,
  access_type TEXT,
  record_count INTEGER DEFAULT 1,
  query_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO supabase_audit_log (
    table_name,
    operation,
    new_data,
    user_id,
    ip_hash,
    user_agent_hash,
    security_flags,
    audit_category
  ) VALUES (
    accessed_table,
    access_type,
    jsonb_build_object(
      'record_count', record_count,
      'query_metadata', query_metadata,
      'access_timestamp', NOW()
    ),
    auth.uid()::text,
    current_setting('app.client_ip_hash', true),
    current_setting('app.user_agent_hash', true),
    jsonb_build_object(
      'record_count', record_count,
      'automated_log', true
    ),
    'access'
  ) RETURNING id INTO log_id;

  RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- 7. Create audit summary views
CREATE OR REPLACE VIEW audit_security_summary AS
SELECT
  DATE_TRUNC('day', created_at) as audit_date,
  audit_category,
  threat_level,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT ip_hash) as unique_ips
FROM supabase_audit_log
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at), audit_category, threat_level
ORDER BY audit_date DESC, event_count DESC;

CREATE OR REPLACE VIEW audit_pii_compliance AS
SELECT
  DATE_TRUNC('day', created_at) as audit_date,
  compliance_status,
  COUNT(*) as violation_count,
  COUNT(DISTINCT user_id) as affected_users,
  jsonb_agg(DISTINCT table_name) as affected_tables
FROM supabase_audit_log
WHERE audit_category = 'pii'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at), compliance_status
ORDER BY audit_date DESC;

CREATE OR REPLACE VIEW audit_suspicious_activity AS
SELECT
  ip_hash,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_id) as user_count,
  COUNT(DISTINCT table_name) as table_count,
  MIN(created_at) as first_seen,
  MAX(created_at) as last_seen,
  jsonb_agg(DISTINCT operation) as operations
FROM supabase_audit_log
WHERE created_at >= NOW() - INTERVAL '24 hours'
  AND ip_hash IS NOT NULL
GROUP BY ip_hash
HAVING COUNT(DISTINCT user_id) > 3 OR COUNT(*) > 100
ORDER BY event_count DESC;

-- 8. Create retention policy functions
CREATE OR REPLACE FUNCTION cleanup_audit_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete standard retention logs older than 1 year
  DELETE FROM supabase_audit_log
  WHERE created_at < NOW() - INTERVAL '1 year'
    AND retention_policy = 'standard'
    AND audit_category NOT IN ('security', 'pii');

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Log the cleanup operation
  INSERT INTO supabase_audit_log (
    table_name, operation, new_data, audit_category
  ) VALUES (
    'supabase_audit_log', 'CLEANUP',
    jsonb_build_object('deleted_records', deleted_count, 'retention_type', 'standard'),
    'general'
  );

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 9. Create monitoring functions
CREATE OR REPLACE FUNCTION get_audit_health_metrics()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_events_24h', (
      SELECT COUNT(*) FROM supabase_audit_log
      WHERE created_at >= NOW() - INTERVAL '24 hours'
    ),
    'pii_violations_24h', (
      SELECT COUNT(*) FROM supabase_audit_log
      WHERE created_at >= NOW() - INTERVAL '24 hours'
        AND compliance_status = 'violation'
    ),
    'security_events_24h', (
      SELECT COUNT(*) FROM supabase_audit_log
      WHERE created_at >= NOW() - INTERVAL '24 hours'
        AND audit_category = 'security'
    ),
    'unique_users_24h', (
      SELECT COUNT(DISTINCT user_id) FROM supabase_audit_log
      WHERE created_at >= NOW() - INTERVAL '24 hours'
        AND user_id IS NOT NULL
    ),
    'suspicious_ips', (
      SELECT COUNT(*) FROM audit_suspicious_activity
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 10. Set up Row Level Security
ALTER TABLE supabase_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own audit logs (except admins)
CREATE POLICY "Users can view own audit logs" ON supabase_audit_log
  FOR SELECT USING (
    auth.uid()::text = user_id OR
    auth.jwt() ->> 'role' = 'admin'
  );

-- Policy: Only system and admins can insert audit logs
CREATE POLICY "System can insert audit logs" ON supabase_audit_log
  FOR INSERT WITH CHECK (
    auth.uid() IS NULL OR -- System/trigger context
    auth.jwt() ->> 'role' = 'admin'
  );

-- 11. Grant permissions
GRANT SELECT ON audit_security_summary TO authenticated;
GRANT SELECT ON audit_pii_compliance TO authenticated;
GRANT SELECT ON audit_suspicious_activity TO service_role; -- Restricted view
GRANT EXECUTE ON FUNCTION log_security_event(TEXT, JSONB, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_pii_violation(JSONB, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_data_access(TEXT, TEXT, INTEGER, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_audit_health_metrics() TO authenticated;

-- 12. Schedule cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-audit-logs', '0 3 * * 0', 'SELECT cleanup_audit_logs();');

-- Comments for documentation
COMMENT ON TABLE supabase_audit_log IS 'Comprehensive audit logging with PII-compliant data capture';
COMMENT ON COLUMN supabase_audit_log.ip_hash IS 'SHA256 hash of client IP for security analysis';
COMMENT ON COLUMN supabase_audit_log.user_agent_hash IS 'SHA256 hash of user agent for security analysis';
COMMENT ON COLUMN supabase_audit_log.pii_scan_result IS 'Results from automated PII scanning';
COMMENT ON FUNCTION log_security_event IS 'Log security events with appropriate threat levels';
COMMENT ON FUNCTION log_pii_violation IS 'Log PII compliance violations for review';
COMMENT ON VIEW audit_suspicious_activity IS 'Identifies potentially suspicious access patterns';