#!/usr/bin/env node
/**
 * OPAL Environment Validation Script
 *
 * Validates environment configuration and NODE_ENV consistency
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

console.log('🚀 OPAL Environment Validation');
console.log('=' .repeat(50));

// Check NODE_ENV
const nodeEnv = process.env.NODE_ENV;
console.log(`📊 NODE_ENV: ${nodeEnv || 'NOT SET'}`);

const validNodeEnvs = ['development', 'production', 'test'];
if (!nodeEnv || !validNodeEnvs.includes(nodeEnv)) {
    console.log('❌ NODE_ENV issue detected');
    console.log('💡 Valid values: development, production, test');
} else {
    console.log('✅ NODE_ENV is valid');
}

// Check critical OPAL variables
const criticalVars = [
    'OPAL_API_BASE',
    'OPAL_CALLBACK_URL',
    'BASE_URL',
    'OSA_WEBHOOK_SHARED_SECRET',
    'JWT_SECRET',
    'NEXT_PUBLIC_API_SECRET_KEY'
];

console.log('\n🔧 Checking critical environment variables:');
let missing = [];
let configured = [];

criticalVars.forEach(varName => {
    const value = process.env[varName];
    if (!value || value.startsWith('your_')) {
        missing.push(varName);
        console.log(`❌ ${varName}: Not configured`);
    } else {
        configured.push(varName);
        const displayValue = value.length > 30 ? value.substring(0, 30) + '...' : value;
        console.log(`✅ ${varName}: ${displayValue}`);
    }
});

console.log('\n📊 Summary:');
console.log(`   ✅ Configured: ${configured.length}/${criticalVars.length}`);
console.log(`   ❌ Missing: ${missing.length}`);

if (missing.length > 0) {
    console.log(`\n⚠️  Missing variables: ${missing.join(', ')}`);
}

// Check .env.local exists
const envLocalPath = '.env.local';
if (fs.existsSync(envLocalPath)) {
    console.log(`\n📄 Environment file: ✅ ${envLocalPath} exists`);
} else {
    console.log(`\n📄 Environment file: ❌ ${envLocalPath} not found`);
}

// Check if development server is likely to work
const allCriticalSet = missing.length === 0;
const nodeEnvOk = nodeEnv && validNodeEnvs.includes(nodeEnv);

console.log('\n🎯 Validation Results:');
if (allCriticalSet && nodeEnvOk) {
    console.log('✅ Environment is ready for development');
    process.exit(0);
} else {
    console.log('⚠️  Environment needs attention:');
    if (!nodeEnvOk) console.log('   • Fix NODE_ENV value');
    if (!allCriticalSet) console.log('   • Configure missing variables');
    console.log('\n💡 Run: cp .env.template .env.local and configure values');
    process.exit(1);
}