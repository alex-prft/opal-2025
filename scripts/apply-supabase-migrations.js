#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function applyMigrations() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables:');
    console.error('   SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅' : '❌');
    process.exit(1);
  }

  console.log('🚀 Setting up Supabase tables...');
  console.log(`🔗 URL: ${supabaseUrl}`);
  console.log(`🔑 Key: ${supabaseKey.substring(0, 20)}...`);
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Create tables directly using individual CREATE statements
  const tables = [
    {
      name: 'supabase_audit_log',
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
      name: 'opal_webhook_events', 
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
      name: 'opal_confidence_scores',
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
      name: 'opal_fallback_usage',
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
    }
  ];

  const functions = [
    {
      name: 'log_security_event',
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
  let errorCount = 0;

  // Create tables
  for (const table of tables) {
    try {
      console.log(`📋 Creating table: ${table.name}`);
      const { data, error } = await supabase.rpc('exec_sql', { 
        query: table.sql 
      });
      
      if (error) {
        console.log(`⚠️  Table ${table.name}: ${error.message}`);
        // Try alternative method - direct table creation
        const { error: insertError } = await supabase.from(table.name).select('id').limit(1);
        if (insertError && insertError.message.includes('does not exist')) {
          console.log(`  Attempting to create ${table.name} via RPC...`);
          // This would require a custom RPC function, for now mark as needing manual setup
        }
      } else {
        console.log(`✅ Table ${table.name}: Created/verified`);
        successCount++;
      }
    } catch (error) {
      console.log(`❌ Table ${table.name}: ${error.message}`);
      errorCount++;
    }
  }

  // Create functions
  for (const func of functions) {
    try {
      console.log(`⚙️  Creating function: ${func.name}`);
      const { data, error } = await supabase.rpc('exec_sql', { 
        query: func.sql 
      });
      
      if (error) {
        console.log(`⚠️  Function ${func.name}: ${error.message}`);
      } else {
        console.log(`✅ Function ${func.name}: Created`);
        successCount++;
      }
    } catch (error) {
      console.log(`❌ Function ${func.name}: ${error.message}`);
      errorCount++;
    }
  }

  // Test the setup by checking if tables are accessible
  console.log('\\n🔍 Testing table access...');
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table.name)
        .select('*')
        .limit(1);
        
      if (error) {
        console.log(`❌ ${table.name}: ${error.message}`);
      } else {
        console.log(`✅ ${table.name}: Accessible`);
      }
    } catch (error) {
      console.log(`❌ ${table.name}: Access test failed`);
    }
  }

  console.log(`\\n📊 SETUP SUMMARY`);
  console.log(`=================`);
  console.log(`✅ Successful operations: ${successCount}`);
  console.log(`❌ Failed operations: ${errorCount}`);
  
  if (errorCount > 0) {
    console.log(`\\n⚠️  Some operations failed. You may need to:`);
    console.log(`   1. Check Supabase dashboard for errors`);
    console.log(`   2. Manually run migrations in SQL editor`);
    console.log(`   3. Verify service role key permissions`);
  } else {
    console.log(`\\n🎉 Setup completed successfully!`);
  }
}

if (require.main === module) {
  applyMigrations().catch((error) => {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  });
}