#!/usr/bin/env node

/**
 * Direct Supabase Migration Script
 * Uses REST API to apply migrations directly to Supabase
 */

const https = require('https');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function makeSupabaseRequest(query) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query });

    const options = {
      hostname: supabaseUrl.replace('https://', '').split('/')[0],
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Length': postData.length,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function createExecuteFunction() {
  console.log('📋 Creating SQL execution function...');
  
  const createExecFunction = `
    CREATE OR REPLACE FUNCTION exec_sql(query text)
    RETURNS text
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE query;
      RETURN 'Success';
    EXCEPTION
      WHEN OTHERS THEN
        RETURN 'Error: ' || SQLERRM;
    END;
    $$;
  `;

  try {
    // Try to create the function using a direct SQL approach
    const { status, data } = await makeSupabaseRequest(createExecFunction);
    if (status === 200) {
      console.log('✅ SQL execution function created');
      return true;
    } else {
      console.log('⚠️  Could not create exec function via API');
      return false;
    }
  } catch (error) {
    console.log('⚠️  Could not create exec function:', error.message);
    return false;
  }
}

async function executeSQL(query, description) {
  console.log(`📋 ${description}...`);
  
  try {
    const { status, data } = await makeSupabaseRequest(query);
    if (status === 200 && !data.message?.includes('Error:')) {
      console.log(`✅ ${description}: Success`);
      return true;
    } else {
      console.log(`⚠️  ${description}: ${data.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${description}: ${error.message}`);
    return false;
  }
}

async function applyMigrations() {
  console.log('🚀 Direct Supabase Migration Setup\\n');
  
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables');
    process.exit(1);
  }

  console.log(`🔗 URL: ${supabaseUrl}`);
  console.log(`🔑 Key: ${supabaseKey.substring(0, 20)}...\\n`);

  // Try to create the exec function first
  await createExecuteFunction();

  const migrations = [
    {
      name: 'Audit Log Table',
      sql: `
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
      `
    },
    {
      name: 'OPAL Webhook Events Table', 
      sql: `
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
      `
    },
    {
      name: 'OPAL Confidence Scores Table',
      sql: `
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
      `
    },
    {
      name: 'OPAL Fallback Usage Table',
      sql: `
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
      `
    },
    {
      name: 'Security Event Function',
      sql: `
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
      `
    }
  ];

  let successCount = 0;
  
  for (const migration of migrations) {
    const success = await executeSQL(migration.sql, migration.name);
    if (success) successCount++;
  }

  console.log(`\\n📊 MIGRATION SUMMARY`);
  console.log(`====================`);
  console.log(`✅ Successfully applied: ${successCount}/${migrations.length}`);
  
  if (successCount === migrations.length) {
    console.log(`\\n🎉 All migrations applied successfully!`);
    console.log(`✅ Your database is now ready for full OPAL functionality`);
  } else {
    console.log(`\\n⚠️  Some migrations may need manual application`);
    console.log(`📋 Check your Supabase dashboard SQL editor for manual setup`);
  }

  console.log(`\\n🔗 Supabase Dashboard: https://supabase.com/dashboard/project/runniojabssuzfgysbtf`);
}

if (require.main === module) {
  applyMigrations().catch(console.error);
}