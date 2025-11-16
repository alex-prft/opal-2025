-- SUPABASE MANUAL SETUP SQL
-- Copy and paste these queries into your Supabase Dashboard SQL Editor
-- Run each section separately

-- ===== 1. AUDIT LOG TABLE =====
CREATE TABLE IF NOT EXISTS supabase_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  table_name TEXT,
  operation TEXT,
  user_context JSONB,
  data_classification TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  severity TEXT NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failure', 'warning')),
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_event_type ON supabase_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON supabase_audit_log(created_at);

-- ===== 2. WEBHOOK EVENTS TABLE =====
CREATE TABLE IF NOT EXISTS opal_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id TEXT NOT NULL,
  workflow_id TEXT NOT NULL,
  agent_id TEXT,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received',
  event_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opal_webhook_events_workflow_id ON opal_webhook_events(workflow_id);
CREATE INDEX IF NOT EXISTS idx_opal_webhook_events_created_at ON opal_webhook_events(created_at);

-- ===== 3. CONFIDENCE SCORES TABLE =====
CREATE TABLE IF NOT EXISTS opal_confidence_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id TEXT NOT NULL,
  agent_type TEXT NOT NULL,
  workflow_id TEXT,
  confidence_score DECIMAL(4,3) NOT NULL,
  response_time_ms INTEGER NOT NULL,
  content_hash TEXT NOT NULL,
  validation_passed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opal_confidence_scores_page_id ON opal_confidence_scores(page_id);
CREATE INDEX IF NOT EXISTS idx_opal_confidence_scores_created_at ON opal_confidence_scores(created_at);

-- ===== 4. FALLBACK USAGE TABLE =====
CREATE TABLE IF NOT EXISTS opal_fallback_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id TEXT NOT NULL,
  agent_type TEXT NOT NULL,
  workflow_id TEXT,
  trigger_reason TEXT NOT NULL,
  fallback_type TEXT NOT NULL DEFAULT 'cached',
  transparency_label_shown BOOLEAN NOT NULL DEFAULT false,
  resolved_successfully BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opal_fallback_usage_page_id ON opal_fallback_usage(page_id);

-- ===== 5. SECURITY FUNCTION =====
CREATE OR REPLACE FUNCTION log_security_event(
  event_type TEXT,
  event_data JSONB DEFAULT '{}',
  threat_level TEXT DEFAULT 'low'
) RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO supabase_audit_log (
    table_name,
    operation,
    details,
    severity,
    status
  ) VALUES (
    'security_events',
    event_type,
    event_data,
    threat_level,
    'success'
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- ===== TEST THE SETUP =====
-- Insert test data to verify tables work
INSERT INTO supabase_audit_log (event_type, operation, details) 
VALUES ('test', 'setup_verification', '{"source": "manual_setup"}');

INSERT INTO opal_webhook_events (webhook_id, workflow_id, event_type) 
VALUES ('test-webhook', 'test-workflow', 'workflow_completed');

-- Test the function
SELECT log_security_event('setup_test', '{"test": true}'::jsonb, 'low');