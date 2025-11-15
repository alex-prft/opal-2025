-- Session Metadata Table (Data Governance Compliant)
-- Stores ONLY metadata, NO tokens, NO PII

CREATE TABLE IF NOT EXISTS session_metadata (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- Internal OSA user ID, not customer ID
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_activity TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  session_type TEXT CHECK (session_type IN ('admin', 'workflow', 'api')) NOT NULL,
  ip_hash TEXT NOT NULL, -- Hashed IP address for audit purposes
  user_agent_hash TEXT NOT NULL, -- Hashed user agent for audit purposes

  -- Metadata for tracking
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Data governance classification
  data_class TEXT DEFAULT 'internal' CHECK (data_class IN ('public', 'internal', 'confidential', 'metadata_only'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_session_metadata_user_id ON session_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_session_metadata_expires_at ON session_metadata(expires_at);
CREATE INDEX IF NOT EXISTS idx_session_metadata_session_type ON session_metadata(session_type);
CREATE INDEX IF NOT EXISTS idx_session_metadata_created_at ON session_metadata(created_at);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_session_metadata_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER session_metadata_updated_at
  BEFORE UPDATE ON session_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_session_metadata_updated_at();

-- Row Level Security (RLS)
ALTER TABLE session_metadata ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own session metadata
CREATE POLICY "Users can view own session metadata" ON session_metadata
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update own session metadata" ON session_metadata
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Policy: Prevent any PII storage (additional safeguard)
CREATE POLICY "No PII in session metadata" ON session_metadata
  FOR ALL USING (
    NOT (
      user_id ~* '(email|phone|ssn|credit_card|@)' OR
      ip_hash ~* '(email|phone|ssn|credit_card|@)' OR
      user_agent_hash ~* '(email|phone|ssn|credit_card|@)'
    )
  );

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON session_metadata TO authenticated;

-- Create audit trigger for session metadata
CREATE TRIGGER audit_session_metadata
  AFTER INSERT OR UPDATE OR DELETE ON session_metadata
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- Comments for documentation
COMMENT ON TABLE session_metadata IS 'Stores session metadata only - NO tokens, NO PII. Compliant with data governance policies.';
COMMENT ON COLUMN session_metadata.user_id IS 'Internal OSA user identifier, not customer data';
COMMENT ON COLUMN session_metadata.ip_hash IS 'SHA256 hash of IP address for audit purposes';
COMMENT ON COLUMN session_metadata.user_agent_hash IS 'SHA256 hash of user agent for audit purposes';
COMMENT ON COLUMN session_metadata.data_class IS 'Data classification for governance compliance';