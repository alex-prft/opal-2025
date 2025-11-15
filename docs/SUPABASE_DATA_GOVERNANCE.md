# Supabase Data Governance Framework

## Core Principles

### ✅ ALLOWED in Supabase
- OSA configurations and OPAL mapping data
- Service dependencies and microservice configurations
- Customer-specific OPAL agent configurations
- A/B testing configurations (even with customer segments)
- Aggregated/anonymized metrics
- Customer preferences (theme, dashboard layout)
- Metadata about insights (not actual customer data)
- Session metadata (not tokens)
- Audit logs for compliance

### ❌ PROHIBITED in Supabase
- PII (Personally Identifiable Information)
- Direct customer analytics or raw data
- Customer leads (process only, never persist)
- API keys for external integrations
- Session tokens or refresh tokens
- Raw customer behavior data

## Implementation Strategy

### 1. Session Token Handling
```typescript
// RECOMMENDED APPROACH:
// Supabase: Store session metadata only
// Redis: Store actual tokens with TTL
// Environment Variables: Store API keys

interface SessionMetadata {
  session_id: string;
  user_id: string;  // Internal OSA user, not customer
  created_at: timestamp;
  last_activity: timestamp;
  session_type: 'admin' | 'workflow' | 'api';
  ip_hash: string;  // Hashed, not raw IP
}
```

### 2. Schema-Level Validation Policies

```sql
-- Data classification enum
CREATE TYPE data_classification AS ENUM (
  'public',
  'internal',
  'confidential',
  'metadata_only'
);

-- Add classification to all tables
ALTER TABLE opal_configurations ADD COLUMN data_class data_classification DEFAULT 'internal';

-- RLS Policy: Prevent PII storage
CREATE POLICY "no_pii_policy" ON opal_configurations
FOR ALL USING (
  data_class != 'confidential' AND
  NOT (data::text ~* '(email|phone|ssn|credit_card|address)')
);

-- Check constraint for sensitive fields
ALTER TABLE opal_workflow_executions
ADD CONSTRAINT no_pii_in_metadata
CHECK (NOT (metadata::text ~* '(email|phone|ssn|address|credit_card)'));
```

### 3. Automated PII Scanning

```typescript
// src/lib/security/pii-scanner.ts
export class PIIScanner {
  private static PII_PATTERNS = [
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
    /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
    /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, // Credit Card
    /\b\d{3}[-.]\d{3}[-.]\d{4}\b/g, // Phone
  ];

  static scanForPII(data: any): PIIViolation[] {
    const violations: PIIViolation[] = [];
    const jsonStr = JSON.stringify(data);

    this.PII_PATTERNS.forEach((pattern, index) => {
      const matches = jsonStr.match(pattern);
      if (matches) {
        violations.push({
          type: ['email', 'ssn', 'credit_card', 'phone'][index],
          matches: matches.length,
          field: this.findFieldPath(data, matches[0])
        });
      }
    });

    return violations;
  }
}
```

### 4. Audit Logging System

```sql
-- Audit table for borderline data
CREATE TABLE supabase_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  old_data JSONB,
  new_data JSONB,
  user_id TEXT,
  ip_hash TEXT, -- Hashed IP address
  user_agent_hash TEXT, -- Hashed user agent
  created_at TIMESTAMPTZ DEFAULT NOW(),
  pii_scan_result JSONB -- Results from PII scanner
);

-- Trigger function for automatic auditing
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO supabase_audit_log (
    table_name, operation, old_data, new_data, user_id, created_at
  ) VALUES (
    TG_TABLE_NAME, TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) ELSE NULL END,
    auth.uid()::text, NOW()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
```

### 5. Workflow Log Purging

```sql
-- Function to purge logs with potential customer references
CREATE OR REPLACE FUNCTION purge_customer_referenced_logs()
RETURNS INTEGER AS $$
DECLARE
  purged_count INTEGER;
BEGIN
  -- Delete workflow executions older than 90 days that contain potential customer refs
  DELETE FROM opal_workflow_executions
  WHERE created_at < NOW() - INTERVAL '90 days'
    AND (
      metadata::text ~* '(customer_id|user_id|email|external_id)' OR
      input_data::text ~* '(customer_id|user_id|email|external_id)' OR
      output_data::text ~* '(customer_id|user_id|email|external_id)'
    );

  GET DIAGNOSTICS purged_count = ROW_COUNT;

  INSERT INTO supabase_audit_log (
    table_name, operation, new_data
  ) VALUES (
    'opal_workflow_executions', 'PURGE',
    json_build_object('purged_records', purged_count, 'reason', 'customer_reference_cleanup')
  );

  RETURN purged_count;
END;
$$ LANGUAGE plpgsql;

-- Schedule daily purging
SELECT cron.schedule('purge-customer-logs', '0 2 * * *', 'SELECT purge_customer_referenced_logs();');
```

### 6. Data Retention Policies

```sql
-- Configuration data: Keep forever (as requested)
-- Performance data: Keep forever (as requested)
-- Workflow execution logs: Purge if contains customer references after 90 days
-- Audit logs: Keep for 7 years (compliance)
-- Session metadata: Keep for 1 year

CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM session_metadata
  WHERE created_at < NOW() - INTERVAL '1 year';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
```

## Environment Configuration

### External Secret Management
```typescript
// Use Vercel Environment Variables or AWS Secrets Manager
const secretConfig = {
  optimizely_api_key: process.env.OPTIMIZELY_API_KEY, // Not in Supabase
  sendgrid_api_key: process.env.SENDGRID_API_KEY,     // Not in Supabase
  salesforce_token: process.env.SALESFORCE_TOKEN,     // Not in Supabase
};

// Supabase connection string can be in environment
const supabaseConfig = {
  url: process.env.SUPABASE_URL,
  anon_key: process.env.SUPABASE_ANON_KEY, // This is safe, it's public
};
```

## Monitoring & Compliance

### Daily Checks
- Run PII scanner on all new data
- Review audit logs for suspicious patterns
- Monitor data classification compliance
- Check retention policy execution

### Weekly Reviews
- Audit external API key usage
- Review customer data processing logs
- Validate purging schedules are working

### Monthly Assessments
- Full PII compliance scan
- Data governance policy review
- External security audit of data flows

## Implementation Checklist

- [ ] Create data classification columns
- [ ] Implement RLS policies
- [ ] Deploy PII scanner
- [ ] Set up audit logging
- [ ] Configure purging schedules
- [ ] Move API keys to external secrets
- [ ] Test session token handling
- [ ] Document data flows
- [ ] Train team on policies
- [ ] Set up monitoring alerts