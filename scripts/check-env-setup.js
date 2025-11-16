#!/usr/bin/env node

/**
 * Environment Setup Checker for OSA Supabase Guardrails
 * 
 * This script checks if all required environment variables are properly configured.
 */

console.log('🔍 OSA Supabase Environment Check\\n');
console.log('=' .repeat(50));

// Required environment variables
const requiredVars = {
  'SUPABASE_URL': {
    description: 'Supabase project URL',
    example: 'https://runniojabssuzfgysbtf.supabase.co',
    required: true
  },
  'NEXT_PUBLIC_SUPABASE_URL': {
    description: 'Public Supabase URL (same as above)',
    example: 'https://runniojabssuzfgysbtf.supabase.co',
    required: true
  },
  'SUPABASE_SERVICE_ROLE_KEY': {
    description: 'Supabase service role key (secret)',
    example: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...',
    required: true,
    sensitive: true
  },
  'SUPABASE_GUARDRAILS_ENABLED': {
    description: 'Enable guardrails system',
    example: 'true',
    default: 'true'
  },
  'DATA_GOVERNANCE_ENABLED': {
    description: 'Enable data governance features',
    example: 'true',
    default: 'true'
  },
  'AUDIT_LOGGING_ENABLED': {
    description: 'Enable audit logging',
    example: 'true',
    default: 'true'
  },
  'PII_SCANNING_ENABLED': {
    description: 'Enable PII scanning and blocking',
    example: 'true',
    default: 'true'
  }
};

let allGood = true;
let warnings = [];
let errors = [];

console.log('Checking environment variables:\\n');

// Check each required variable
Object.entries(requiredVars).forEach(([varName, config]) => {
  const value = process.env[varName];
  const hasValue = value && value.length > 0;
  
  let status = '';
  let message = '';
  
  if (config.required && !hasValue) {
    status = '❌ MISSING';
    message = `Required variable not set`;
    errors.push(`${varName}: ${message}`);
    allGood = false;
  } else if (!hasValue && config.default) {
    status = '⚠️  DEFAULT';
    message = `Using default: ${config.default}`;
    warnings.push(`${varName}: Will use default value '${config.default}'`);
  } else if (hasValue) {
    if (config.sensitive) {
      const maskedValue = value.substring(0, 10) + '...';
      status = '✅ SET';
      message = `Value: ${maskedValue}`;
    } else {
      status = '✅ SET';
      message = `Value: ${value}`;
    }
  } else {
    status = '⚠️  EMPTY';
    message = 'Variable is empty';
    warnings.push(`${varName}: Variable is empty`);
  }
  
  console.log(`${status.padEnd(12)} ${varName}`);
  console.log(`             ${config.description}`);
  console.log(`             ${message}\\n`);
});

// Check for .env.local file
const fs = require('fs');
const envLocalExists = fs.existsSync('.env.local');

console.log('Configuration files:\\n');
console.log(`${envLocalExists ? '✅ FOUND' : '❌ MISSING'.padEnd(12)} .env.local`);

if (!envLocalExists) {
  errors.push('.env.local file not found');
  allGood = false;
}

// Special validation for Supabase URL
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
if (supabaseUrl) {
  if (!supabaseUrl.includes('runniojabssuzfgysbtf')) {
    warnings.push('Supabase URL does not match expected project ID (runniojabssuzfgysbtf)');
  }
  if (!supabaseUrl.startsWith('https://')) {
    errors.push('Supabase URL should start with https://');
    allGood = false;
  }
}

// Special validation for service role key
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (serviceKey) {
  if (!serviceKey.startsWith('eyJ')) {
    errors.push('Service role key should start with "eyJ" (JWT token)');
    allGood = false;
  }
  if (serviceKey.length < 100) {
    warnings.push('Service role key seems too short - make sure you copied the full key');
  }
}

// Summary
console.log('\\n📊 SUMMARY\\n');
console.log('=' .repeat(30));

if (allGood && warnings.length === 0) {
  console.log('🎉 All environment variables are properly configured!');
  console.log('\\n✅ You can now run:');
  console.log('   npm run supabase:setup');
} else if (allGood) {
  console.log('✅ All required variables are set');
  console.log(`⚠️  ${warnings.length} warning(s) found`);
} else {
  console.log('❌ Configuration issues found');
  console.log(`   Errors: ${errors.length}`);
  console.log(`   Warnings: ${warnings.length}`);
}

if (errors.length > 0) {
  console.log('\\n❌ ERRORS TO FIX:\\n');
  errors.forEach((error, i) => {
    console.log(`${i + 1}. ${error}`);
  });
}

if (warnings.length > 0) {
  console.log('\\n⚠️  WARNINGS:\\n');
  warnings.forEach((warning, i) => {
    console.log(`${i + 1}. ${warning}`);
  });
}

if (!allGood) {
  console.log('\\n💡 QUICK FIX:\\n');
  console.log('1. Create .env.local file in your project root');
  console.log('2. Add these variables:');
  console.log('\\n# Copy this to your .env.local file:');
  console.log('SUPABASE_URL=https://runniojabssuzfgysbtf.supabase.co');
  console.log('NEXT_PUBLIC_SUPABASE_URL=https://runniojabssuzfgysbtf.supabase.co');
  console.log('SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9... # Get this from Supabase dashboard');
  console.log('SUPABASE_GUARDRAILS_ENABLED=true');
  console.log('DATA_GOVERNANCE_ENABLED=true');
  console.log('AUDIT_LOGGING_ENABLED=true');
  console.log('PII_SCANNING_ENABLED=true');
  console.log('\\n3. Get your service role key from:');
  console.log('   https://supabase.com/dashboard/project/runniojabssuzfgysbtf/settings/api');
  
  process.exit(1);
}

console.log('\\n🚀 NEXT STEPS:\\n');
console.log('1. Run database setup:    npm run supabase:setup');
console.log('2. Test the integration:  npm run guardrails:test');
console.log('3. Start development:     npm run dev');
console.log('\\n📋 Helpful links:');
console.log('   Supabase Dashboard: https://supabase.com/dashboard/project/runniojabssuzfgysbtf');
console.log('   API Settings: https://supabase.com/dashboard/project/runniojabssuzfgysbtf/settings/api');