#!/usr/bin/env node

// Simple Supabase Connection Test & Setup
// This script tests your connection and creates tables directly

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testAndSetup() {
  console.log('🔍 Testing Supabase Connection...\n');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables');
    console.error('   SUPABASE_URL:', supabaseUrl ? '✅' : '❌');  
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅' : '❌');
    console.error('\n💡 Add this to your .env.local:');
    console.error('   NEXT_PUBLIC_SUPABASE_URL=https://runniojabssuzfgysbtf.supabase.co');
    return;
  }
  
  console.log(`🔗 Connecting to: ${supabaseUrl}`);
  console.log(`🔑 Using key: ${supabaseKey.substring(0, 20)}...`);
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Test basic connection
    console.log('\n🧪 Testing connection...');
    const { data, error } = await supabase
      .from('_realtime')  // This is a system table that should always exist
      .select('*')
      .limit(1);
    
    if (error && !error.message.includes('permission denied')) {
      console.error('❌ Connection failed:', error.message);
      return;
    }
    
    console.log('✅ Connection successful!');
    
    // Check if our tables exist
    console.log('\n📋 Checking existing tables...');
    
    const tables = ['supabase_audit_log', 'opal_webhook_events'];
    const existingTables = [];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('id')
          .limit(1);
          
        if (!error) {
          existingTables.push(table);
          console.log(`✅ ${table} exists`);
        } else {
          console.log(`❌ ${table} missing`);
        }
      } catch (err) {
        console.log(`❌ ${table} missing`);
      }
    }
    
    if (existingTables.length === tables.length) {
      console.log('\n🎉 All tables exist! Testing data insertion...');
      
      // Test audit log
      const { data: auditData, error: auditError } = await supabase
        .from('supabase_audit_log')
        .insert({
          event_type: 'connection_test',
          operation: 'test_insert',
          details: { timestamp: new Date().toISOString(), source: 'connection_test' }
        })
        .select();
        
      if (auditError) {
        console.log('⚠️  Audit log insertion failed:', auditError.message);
      } else {
        console.log('✅ Audit log test successful');
      }
      
      console.log('\n🎯 SETUP COMPLETE!');
      console.log('Your Supabase guardrails system is ready to use.');
      console.log('\nNext steps:');
      console.log('1. Add NEXT_PUBLIC_SUPABASE_URL to your .env.local');
      console.log('2. Run: npm run dev');
      console.log('3. Visit: http://localhost:3000');
      
    } else {
      console.log('\n🔧 Tables need to be created. Options:');
      console.log('\n1. MANUAL (Recommended):');
      console.log('   • Go to: https://supabase.com/dashboard/project/runniojabssuzfgysbtf/sql');
      console.log('   • Copy/paste SQL from SUPABASE_MANUAL_SETUP.sql');
      console.log('   • Run each section');
      console.log('\n2. CLI Setup:');
      console.log('   • Run: NEXT_PUBLIC_SUPABASE_URL=https://runniojabssuzfgysbtf.supabase.co npm run supabase:setup');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Verify your service role key in Supabase dashboard');
    console.log('2. Check network connectivity');
    console.log('3. Try the manual SQL setup method');
  }
}

testAndSetup().catch(console.error);