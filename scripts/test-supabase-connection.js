#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing environment variables:');
    console.error('- SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
    console.error('- SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅' : '❌');
    return;
  }

  console.log('🔗 Testing Supabase connection...');
  console.log('URL:', supabaseUrl);
  console.log('Key preview:', supabaseKey.substring(0, 10) + '...');

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Try a simple query first
    console.log('\\n1. Testing basic connection...');
    const { data, error } = await supabase.rpc('version');
    
    if (error) {
      console.log('❌ Basic connection failed:', error.message);
      
      // Try alternative connection test
      console.log('\\n2. Trying alternative connection test...');
      const { data: testData, error: testError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .limit(5);
        
      if (testError) {
        console.log('❌ Alternative test failed:', testError.message);
        return;
      } else {
        console.log('✅ Alternative connection successful');
        console.log('Available tables sample:', testData);
      }
    } else {
      console.log('✅ Basic connection successful');
      console.log('Database version:', data);
    }

    // Check what tables exist
    console.log('\\n3. Checking existing tables...');
    const { data: tables, error: tablesError } = await supabase
      .rpc('sql', { 
        query: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;" 
      });

    if (tablesError) {
      console.log('❌ Could not list tables:', tablesError.message);
    } else {
      console.log('✅ Found tables:', tables);
    }

  } catch (error) {
    console.error('💥 Connection test failed:', error);
  }
}

if (require.main === module) {
  testConnection();
}