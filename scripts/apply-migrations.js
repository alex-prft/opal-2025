#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function applyMigrations() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables');
    return;
  }

  console.log('🔗 Connecting to Supabase...');
  const supabase = createClient(supabaseUrl, supabaseKey);

  // List of critical migrations to apply
  const migrations = [
    'supabase/migrations/001_create_audit_system.sql',
    'supabase/migrations/create_audit_logging_system.sql',
    'supabase/migrations/002_create_governance_functions.sql',
    'supabase/migrations/20241114_create_opal_tracking_tables.sql'
  ];

  for (const migrationFile of migrations) {
    console.log(`\\n📋 Processing: ${migrationFile}`);
    
    if (!fs.existsSync(migrationFile)) {
      console.log(`⚠️  File not found: ${migrationFile}`);
      continue;
    }

    try {
      const sqlContent = fs.readFileSync(migrationFile, 'utf-8');
      
      // Split into individual statements and filter out comments
      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 10 && !stmt.startsWith('--') && !stmt.startsWith('/*'));

      console.log(`  Found ${statements.length} SQL statements to execute`);
      
      let successCount = 0;
      let skipCount = 0;
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        
        if (statement.length < 10) continue;
        
        try {
          // Try to execute the statement directly using the SQL editor functionality
          const { data, error } = await supabase.rpc('sql', {
            query: statement + ';'
          });
          
          if (error) {
            // Check for acceptable errors (already exists, etc.)
            const errorMsg = error.message.toLowerCase();
            if (errorMsg.includes('already exists') || 
                errorMsg.includes('duplicate') ||
                errorMsg.includes('does not exist')) {
              console.log(`    ⚠️  ${error.message} (continuing...)`);
              skipCount++;
            } else {
              console.log(`    ❌ Statement ${i + 1} failed: ${error.message}`);
            }
          } else {
            successCount++;
          }
          
        } catch (execError) {
          console.log(`    ❌ Execution error: ${execError.message}`);
        }
      }
      
      console.log(`  ✅ Migration completed: ${successCount} executed, ${skipCount} skipped`);
      
    } catch (error) {
      console.log(`  ❌ Migration failed: ${error.message}`);
    }
  }
  
  console.log('\\n🎯 Checking if key tables exist...');
  
  // Test if the important tables were created
  const tableTests = [
    'supabase_audit_log',
    'opal_confidence_scores', 
    'opal_fallback_usage'
  ];
  
  for (const tableName of tableTests) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
        
      if (error) {
        if (error.message.includes('does not exist')) {
          console.log(`❌ Table ${tableName}: Not found`);
        } else {
          console.log(`⚠️  Table ${tableName}: ${error.message}`);
        }
      } else {
        console.log(`✅ Table ${tableName}: Accessible`);
      }
    } catch (error) {
      console.log(`❌ Table ${tableName}: Test failed`);
    }
  }
  
  console.log('\\n🏁 Migration application completed!');
}

if (require.main === module) {
  applyMigrations().catch(console.error);
}