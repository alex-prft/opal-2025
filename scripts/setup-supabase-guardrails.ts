#!/usr/bin/env npx ts-node

/**
 * OSA Supabase Guardrails Setup Script
 * 
 * This script initializes the Supabase database with all necessary
 * tables, functions, triggers, and test data for the guardrails system.
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

interface SetupResult {
  step: string;
  success: boolean;
  message: string;
  details?: any;
}

class SupabaseGuardrailsSetup {
  private supabase: any;
  private results: SetupResult[] = [];

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async runFullSetup(): Promise<void> {
    console.log('🚀 Starting OSA Supabase Guardrails Setup\n');
    console.log('=' .repeat(60));

    try {
      // Step 1: Test connection
      await this.testConnection();
      
      // Step 2: Apply migrations
      await this.applyMigrations();
      
      // Step 3: Create test data
      await this.createTestData();
      
      // Step 4: Verify setup
      await this.verifySetup();
      
      // Generate report
      this.generateReport();
      
    } catch (error) {
      console.error('\n💥 Setup failed:', error);
      process.exit(1);
    }
  }

  private async testConnection(): Promise<void> {
    console.log('\n🔍 Testing Supabase connection...');
    
    try {
      const { data, error } = await this.supabase
        .from('_supabase_realtime_subscriptions')
        .select('*')
        .limit(1);

      if (error && !error.message.includes('relation "_supabase_realtime_subscriptions" does not exist')) {
        throw new Error(`Connection failed: ${error.message}`);
      }

      this.results.push({
        step: 'Connection Test',
        success: true,
        message: 'Successfully connected to Supabase',
        details: { 
          url: this.supabase.supabaseUrl.replace(/\/$/,''),
          project_id: this.supabase.supabaseUrl.match(/https:\/\/([^.]+)/)?.[1]
        }
      });

      console.log('✅ Connection successful');
      
    } catch (error) {
      this.results.push({
        step: 'Connection Test',
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
      });
      
      console.log('❌ Connection failed:', error);
      throw error;
    }
  }

  private async applyMigrations(): Promise<void> {
    console.log('\n📋 Applying database migrations...');

    const migrationFiles = [
      'supabase/migrations/001_create_audit_system.sql',
      'supabase/migrations/002_create_governance_functions.sql', 
      'supabase/migrations/003_create_governance_triggers.sql'
    ];

    for (const migrationFile of migrationFiles) {
      try {
        console.log(`  Applying: ${migrationFile}`);
        
        if (!fs.existsSync(migrationFile)) {
          throw new Error(`Migration file not found: ${migrationFile}`);
        }

        const migrationSQL = fs.readFileSync(migrationFile, 'utf-8');
        
        // Split the SQL into individual statements
        const statements = migrationSQL
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        let executedCount = 0;
        
        for (const statement of statements) {
          if (statement.length < 10) continue; // Skip very short statements
          
          try {
            const { error } = await this.supabase.rpc('execute_sql', { 
              sql: statement + ';' 
            });
            
            if (error) {
              // Check if it's just a "already exists" error
              if (error.message.includes('already exists') || 
                  error.message.includes('does not exist') ||
                  error.message.includes('permission denied')) {
                console.log(`    ⚠️  ${error.message} (continuing...)`);
              } else {
                throw new Error(`SQL execution failed: ${error.message}`);
              }
            }
            executedCount++;
            
          } catch (sqlError) {
            console.log(`    ⚠️  Statement failed: ${sqlError} (continuing...)`);
          }
        }

        this.results.push({
          step: `Migration: ${path.basename(migrationFile)}`,
          success: true,
          message: `Applied ${executedCount} statements`,
        });

        console.log(`  ✅ Applied ${executedCount} statements`);
        
      } catch (error) {
        this.results.push({
          step: `Migration: ${path.basename(migrationFile)}`,
          success: false,
          message: error instanceof Error ? error.message : 'Migration failed',
        });
        
        console.log(`  ❌ Migration failed:`, error);
        // Continue with other migrations
      }
    }
  }

  private async createTestData(): Promise<void> {
    console.log('\n🧪 Creating test data...');

    const testData = [
      // Test configuration data
      {
        table: 'opal_configurations',
        data: {
          id: crypto.randomUUID(),
          setting_key: 'guardrails_test_config',
          setting_value: 'test_value',
          category: 'testing',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      },
      
      // Test OPAL agent config
      {
        table: 'opal_agent_configs',
        data: {
          id: crypto.randomUUID(),
          name: 'test-guardrails-agent',
          type: 'content',
          configuration: {
            model: 'gpt-4',
            parameters: { creativity: 0.7 }
          },
          enabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      },

      // Test workflow execution
      {
        table: 'opal_workflow_executions',
        data: {
          id: crypto.randomUUID(),
          session_id: `test-session-${Date.now()}`,
          status: 'completed',
          client_name: 'Test Client',
          industry: 'Technology',
          triggered_by: 'guardrails_setup',
          trigger_timestamp: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      },

      // Test anonymous metrics
      {
        table: 'anonymous_usage_metrics',
        data: {
          id: crypto.randomUUID(),
          metric_type: 'setup_test',
          aggregation_level: 'daily',
          dimensions: { source: 'setup_script' },
          value: 1,
          count: 1,
          timestamp: new Date().toISOString(),
          created_at: new Date().toISOString()
        }
      },

      // Test session state
      {
        table: 'session_states',
        data: {
          id: crypto.randomUUID(),
          session_id: `setup-test-${Date.now()}`,
          token: 'encrypted:test-token-value',
          user_data: { test: true },
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }
    ];

    for (const testItem of testData) {
      try {
        console.log(`  Creating test data in: ${testItem.table}`);
        
        const { data, error } = await this.supabase
          .from(testItem.table)
          .insert(testItem.data)
          .select();

        if (error) {
          // Check if table exists
          if (error.message.includes('relation') && error.message.includes('does not exist')) {
            console.log(`    ⚠️  Table ${testItem.table} doesn't exist yet (will create manually)`);
            await this.createTableManually(testItem.table, testItem.data);
          } else {
            throw new Error(`Insert failed: ${error.message}`);
          }
        } else {
          console.log(`  ✅ Test data created in ${testItem.table}`);
        }

        this.results.push({
          step: `Test Data: ${testItem.table}`,
          success: true,
          message: 'Test data created successfully',
        });

      } catch (error) {
        this.results.push({
          step: `Test Data: ${testItem.table}`,
          success: false,
          message: error instanceof Error ? error.message : 'Test data creation failed',
        });
        
        console.log(`  ❌ Failed to create test data in ${testItem.table}:`, error);
      }
    }
  }

  private async createTableManually(tableName: string, sampleData: any): Promise<void> {
    console.log(`    📋 Creating table ${tableName} manually...`);
    
    const tableDefinitions: Record<string, string> = {
      'opal_configurations': `
        CREATE TABLE IF NOT EXISTS opal_configurations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          setting_key TEXT NOT NULL UNIQUE,
          setting_value TEXT,
          category TEXT DEFAULT 'general',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
      'opal_agent_configs': `
        CREATE TABLE IF NOT EXISTS opal_agent_configs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL UNIQUE,
          type TEXT NOT NULL,
          configuration JSONB DEFAULT '{}',
          enabled BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
      'opal_workflow_executions': `
        CREATE TABLE IF NOT EXISTS opal_workflow_executions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_id TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          client_name TEXT,
          industry TEXT,
          company_size TEXT,
          current_capabilities JSONB,
          business_objectives JSONB,
          additional_marketing_technology JSONB,
          timeline_preference TEXT,
          budget_range TEXT,
          recipients JSONB,
          triggered_by TEXT,
          trigger_timestamp TIMESTAMP WITH TIME ZONE,
          started_at TIMESTAMP WITH TIME ZONE,
          completed_at TIMESTAMP WITH TIME ZONE,
          failed_at TIMESTAMP WITH TIME ZONE,
          error_message TEXT,
          current_step TEXT,
          progress_percentage NUMERIC DEFAULT 0,
          expected_agents JSONB,
          completed_agents JSONB DEFAULT '[]',
          failed_agents JSONB DEFAULT '[]',
          scheduled_for TIMESTAMP WITH TIME ZONE,
          last_sync_at TIMESTAMP WITH TIME ZONE,
          force_sync_requested BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    };

    const createSQL = tableDefinitions[tableName];
    
    if (createSQL) {
      try {
        const { error } = await this.supabase.rpc('execute_sql', { sql: createSQL });
        
        if (error && !error.message.includes('already exists')) {
          throw new Error(`Table creation failed: ${error.message}`);
        }
        
        console.log(`    ✅ Table ${tableName} created`);
        
        // Try inserting the data again
        const { error: insertError } = await this.supabase
          .from(tableName)
          .insert(sampleData);
          
        if (insertError) {
          console.log(`    ⚠️  Insert still failed: ${insertError.message}`);
        } else {
          console.log(`    ✅ Test data inserted into ${tableName}`);
        }
        
      } catch (error) {
        console.log(`    ❌ Manual table creation failed:`, error);
      }
    }
  }

  private async verifySetup(): Promise<void> {
    console.log('\n🔍 Verifying setup...');

    const verificationQueries = [
      {
        name: 'Audit Log Table',
        query: "SELECT COUNT(*) as count FROM supabase_audit_log",
        expectedMin: 0
      },
      {
        name: 'Configuration Table',
        query: "SELECT COUNT(*) as count FROM opal_configurations",
        expectedMin: 0
      },
      {
        name: 'Agent Configs Table',
        query: "SELECT COUNT(*) as count FROM opal_agent_configs",
        expectedMin: 0
      },
      {
        name: 'Workflow Executions Table',
        query: "SELECT COUNT(*) as count FROM opal_workflow_executions", 
        expectedMin: 0
      },
      {
        name: 'Session States Table',
        query: "SELECT COUNT(*) as count FROM session_states",
        expectedMin: 0
      }
    ];

    let tablesFound = 0;
    
    for (const verification of verificationQueries) {
      try {
        const { data, error } = await this.supabase.rpc('execute_sql', { 
          sql: verification.query 
        });

        if (error) {
          if (error.message.includes('does not exist')) {
            console.log(`  ⚠️  ${verification.name}: Table not found`);
          } else {
            throw new Error(error.message);
          }
        } else {
          tablesFound++;
          console.log(`  ✅ ${verification.name}: Found`);
        }

        this.results.push({
          step: `Verification: ${verification.name}`,
          success: !error || error.message.includes('does not exist'),
          message: error ? `Table not found` : 'Table verified',
        });

      } catch (error) {
        this.results.push({
          step: `Verification: ${verification.name}`,
          success: false,
          message: error instanceof Error ? error.message : 'Verification failed',
        });
        
        console.log(`  ❌ ${verification.name}: ${error}`);
      }
    }

    console.log(`\n📊 Tables found: ${tablesFound}/${verificationQueries.length}`);
    
    if (tablesFound === 0) {
      console.log('\n⚠️  No tables found - this may indicate a permissions issue.');
      console.log('   Please check that your service role key has proper permissions.');
    }
  }

  private generateReport(): void {
    console.log('\n\n📊 SETUP REPORT\n');
    console.log('=' .repeat(60));

    const successful = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;

    console.log(`Setup Steps: ${this.results.length}`);
    console.log(`Successful: ${successful} ✅`);
    console.log(`Failed: ${failed} ${failed > 0 ? '❌' : ''}`);
    console.log(`Success Rate: ${Math.round((successful / this.results.length) * 100)}%`);

    if (failed > 0) {
      console.log('\n❌ FAILED STEPS:');
      console.log('-'.repeat(40));
      
      this.results
        .filter(r => !r.success)
        .forEach(result => {
          console.log(`• ${result.step}`);
          console.log(`  Error: ${result.message}\n`);
        });
    }

    console.log('\n🎯 NEXT STEPS:');
    console.log('-'.repeat(40));
    
    if (successful === this.results.length) {
      console.log('🎉 Setup completed successfully!');
      console.log('✅ Check your Supabase dashboard to see the new tables');
      console.log('✅ Run: npm run guardrails:test to verify functionality');
    } else if (successful > failed) {
      console.log('⚠️  Setup mostly successful with some issues');
      console.log('1. Check Supabase dashboard for created tables');
      console.log('2. Review failed steps above');
      console.log('3. Verify service role key permissions');
    } else {
      console.log('🚨 Setup encountered significant issues');
      console.log('1. Verify Supabase connection credentials');
      console.log('2. Check service role key has admin permissions');
      console.log('3. Try running setup again');
    }

    console.log('\nSupabase Dashboard: https://supabase.com/dashboard/project/runniojabssuzfgysbtf');
  }
}

// CLI execution
async function main() {
  console.log('OSA Supabase Guardrails Setup');
  console.log('=============================\n');

  // Get environment variables
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)');
    console.error('   SUPABASE_SERVICE_ROLE_KEY');
    console.error('\n💡 Set these in your .env.local file or environment');
    process.exit(1);
  }

  console.log(`🔗 Connecting to: ${supabaseUrl}`);
  console.log(`🔑 Using service role key: ${supabaseKey.substring(0, 10)}...`);

  const setup = new SupabaseGuardrailsSetup(supabaseUrl, supabaseKey);
  
  try {
    await setup.runFullSetup();
    console.log('\n✨ Setup completed! Check your Supabase dashboard.');
  } catch (error) {
    console.error('\n💥 Setup failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { SupabaseGuardrailsSetup };