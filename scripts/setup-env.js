#!/usr/bin/env node

/**
 * Environment Setup Script
 * Helps developers generate secure tokens and set up their .env.local file
 *
 * Usage:
 *   node scripts/setup-env.js              # Interactive setup
 *   node scripts/setup-env.js --generate   # Just generate tokens
 *   node scripts/setup-env.js --validate   # Validate existing config
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ENV_EXAMPLE_FILE = '.env.local.example';
const ENV_FILE = '.env.local';

function generateSecureToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

function generateTokens() {
  return {
    webhookAuthKey: generateSecureToken(32),
    hmacSecret: generateSecureToken(32),
    apiSecretKey: generateSecureToken(24)
  };
}

async function askQuestion(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function interactiveSetup() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('🔧 OPAL-OSA Environment Setup\n');

  // Check if .env.local already exists
  if (fs.existsSync(ENV_FILE)) {
    const overwrite = await askQuestion(rl, `${ENV_FILE} already exists. Overwrite? (y/N): `);
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup cancelled. Use --validate to check your existing configuration.');
      rl.close();
      return;
    }
  }

  console.log('Generating secure tokens...\n');
  const tokens = generateTokens();

  console.log('🔐 Generated Secure Tokens:');
  console.log(`  • Webhook Auth Key: ${tokens.webhookAuthKey}`);
  console.log(`  • HMAC Secret: ${tokens.hmacSecret}`);
  console.log(`  • API Secret Key: ${tokens.apiSecretKey}\n`);

  // Get Supabase configuration
  console.log('📦 Supabase Configuration:');
  const supabaseUrl = await askQuestion(rl, 'Supabase URL: ');
  const supabaseAnonKey = await askQuestion(rl, 'Supabase Anon Key: ');
  const supabaseServiceKey = await askQuestion(rl, 'Supabase Service Role Key: ');

  // Get OPAL configuration
  console.log('\n🔄 OPAL Configuration (optional):');
  const opalApiUrl = await askQuestion(rl, 'OPAL API URL (press enter to skip): ');
  const opalApiToken = await askQuestion(rl, 'OPAL API Token (press enter to skip): ');
  const opalWorkflowId = await askQuestion(rl, 'OPAL Workflow ID (press enter to skip): ');

  // Get Optimizely API keys
  console.log('\n⚡ Optimizely API Keys (optional):');
  const odpApiKey = await askQuestion(rl, 'ODP API Key (press enter to skip): ');
  const expApiKey = await askQuestion(rl, 'Experimentation API Key (press enter to skip): ');
  const contentRecsApiKey = await askQuestion(rl, 'Content Recs API Key (press enter to skip): ');
  const cmpApiKey = await askQuestion(rl, 'CMP API Key (press enter to skip): ');

  rl.close();

  // Generate .env.local file
  const envContent = generateEnvFile({
    tokens,
    supabase: {
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      serviceKey: supabaseServiceKey
    },
    opal: {
      apiUrl: opalApiUrl,
      apiToken: opalApiToken,
      workflowId: opalWorkflowId
    },
    optimizely: {
      odpApiKey,
      expApiKey,
      contentRecsApiKey,
      cmpApiKey
    }
  });

  fs.writeFileSync(ENV_FILE, envContent);

  console.log(`\n✅ Generated ${ENV_FILE}`);
  console.log('🚨 IMPORTANT: Never commit this file to git!');
  console.log('🔒 Keep your tokens secure and rotate them regularly.');
  console.log('\n📝 Next steps:');
  console.log('  1. Run: npm run dev');
  console.log('  2. Check console for any configuration warnings');
  console.log('  3. Test webhook endpoints if OPAL integration is needed');
}

function generateEnvFile({ tokens, supabase, opal, optimizely }) {
  const timestamp = new Date().toISOString();

  return `# OPAL-OSA Environment Configuration
# Generated on: ${timestamp}
# CRITICAL: Never commit this file to git!

# Application Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Webhook Security (REQUIRED)
OPAL_WEBHOOK_AUTH_KEY=${tokens.webhookAuthKey}
OPAL_WEBHOOK_HMAC_SECRET=${tokens.hmacSecret}

# Optional: IP Whitelist for webhook security
# OPAL_ALLOWED_IPS=192.168.1.100,10.0.0.50

# OPAL API Configuration
${opal.apiUrl ? `OPAL_API_URL=${opal.apiUrl}` : '# OPAL_API_URL=https://api.optimizely.com/opal/v1'}
${opal.apiToken ? `OPAL_API_TOKEN=${opal.apiToken}` : '# OPAL_API_TOKEN=your-opal-api-token'}
${opal.workflowId ? `OPAL_WORKFLOW_ID=${opal.workflowId}` : '# OPAL_WORKFLOW_ID=your-opal-workflow-id'}

# API Authentication
API_SECRET_KEY=${tokens.apiSecretKey}

# Database Configuration (REQUIRED)
SUPABASE_URL=${supabase.url}
SUPABASE_ANON_KEY=${supabase.anonKey}
SUPABASE_SERVICE_ROLE_KEY=${supabase.serviceKey}

# Database connection settings
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_TIMEOUT_SECONDS=30

# Optimizely Data Platform (ODP)
${optimizely.odpApiKey ? `ODP_API_KEY=${optimizely.odpApiKey}` : '# ODP_API_KEY=your-odp-api-key'}
ODP_PROJECT_ID=your-odp-project-id
ODP_BASE_URL=https://function.zaius.com/twilio_segment

# Optimizely Experimentation
${optimizely.expApiKey ? `EXPERIMENTATION_API_KEY=${optimizely.expApiKey}` : '# EXPERIMENTATION_API_KEY=your-experimentation-api-key'}
EXPERIMENTATION_PROJECT_ID=your-experimentation-project-id
EXPERIMENTATION_BASE_URL=https://api.optimizely.com/v2

# Content Recommendations
${optimizely.contentRecsApiKey ? `CONTENT_RECS_API_KEY=${optimizely.contentRecsApiKey}` : '# CONTENT_RECS_API_KEY=your-content-recs-api-key'}
CONTENT_RECS_ACCOUNT_ID=your-content-recs-account-id
CONTENT_RECS_BASE_URL=https://api.idio.co

# Campaign Management Platform (CMP)
${optimizely.cmpApiKey ? `CMP_API_KEY=${optimizely.cmpApiKey}` : '# CMP_API_KEY=your-cmp-api-key'}
CMP_WORKSPACE_ID=your-cmp-workspace-id
CMP_BASE_URL=https://api.optimizely.com/v2

# Email Notifications
MS_GRAPH_TENANT_ID=your-tenant-id
MS_GRAPH_CLIENT_ID=your-client-id
MS_GRAPH_CLIENT_SECRET=your-client-secret
MS_GRAPH_SENDER_EMAIL=noreply@yourdomain.com

# Logging and Monitoring
LOG_LEVEL=info
ENABLE_REQUEST_LOGGING=true
`;
}

function validateEnvironment() {
  console.log('🔍 Validating Environment Configuration...\n');

  if (!fs.existsSync(ENV_FILE)) {
    console.log('❌ No .env.local file found. Run setup first:');
    console.log('   node scripts/setup-env.js\n');
    process.exit(1);
  }

  // Load environment variables from .env.local
  require('dotenv').config({ path: ENV_FILE });

  const requiredVars = [
    'OPAL_WEBHOOK_AUTH_KEY',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'API_SECRET_KEY'
  ];

  const errors = [];
  const warnings = [];

  // Check required variables
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      errors.push(`Missing required variable: ${varName}`);
    } else if (varName === 'OPAL_WEBHOOK_AUTH_KEY' && value.length < 32) {
      errors.push(`${varName} must be at least 32 characters`);
    }
  }

  // Check for example values
  const exampleValues = [
    { name: 'API_SECRET_KEY', example: 'your-secret-key-for-tool-authentication' },
    { name: 'ODP_API_KEY', example: 'your-odp-api-key' },
    { name: 'SUPABASE_URL', example: 'your-supabase-project-url' }
  ];

  for (const { name, example } of exampleValues) {
    if (process.env[name] === example) {
      warnings.push(`${name} is using example value - update with real value`);
    }
  }

  // Check URLs
  const urlVars = ['NEXT_PUBLIC_APP_URL', 'SUPABASE_URL'];
  for (const urlVar of urlVars) {
    const url = process.env[urlVar];
    if (url) {
      try {
        new URL(url);
      } catch {
        errors.push(`${urlVar} is not a valid URL: ${url}`);
      }
    }
  }

  // Print results
  if (errors.length === 0) {
    console.log('✅ Environment configuration is valid!');
  } else {
    console.log('❌ Environment configuration has errors:');
    errors.forEach(error => console.log(`  • ${error}`));
  }

  if (warnings.length > 0) {
    console.log('\n⚠️ Warnings:');
    warnings.forEach(warning => console.log(`  • ${warning}`));
  }

  console.log(`\n📊 Status: ${errors.length} errors, ${warnings.length} warnings\n`);

  if (errors.length > 0) {
    process.exit(1);
  }
}

function printTokens() {
  console.log('🔐 Generated Secure Tokens:\n');
  const tokens = generateTokens();

  console.log('Copy these to your .env.local file:\n');
  console.log(`OPAL_WEBHOOK_AUTH_KEY=${tokens.webhookAuthKey}`);
  console.log(`OPAL_WEBHOOK_HMAC_SECRET=${tokens.hmacSecret}`);
  console.log(`API_SECRET_KEY=${tokens.apiSecretKey}\n`);
}

// CLI handling
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🔧 OPAL-OSA Environment Setup Tool

Usage:
  node scripts/setup-env.js              Interactive setup
  node scripts/setup-env.js --generate   Generate secure tokens only
  node scripts/setup-env.js --validate   Validate existing configuration
  node scripts/setup-env.js --help       Show this help

The interactive setup will guide you through creating a secure .env.local file.
`);
    return;
  }

  if (args.includes('--generate')) {
    printTokens();
    return;
  }

  if (args.includes('--validate')) {
    validateEnvironment();
    return;
  }

  // Default: interactive setup
  await interactiveSetup();
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  generateTokens,
  validateEnvironment,
  generateEnvFile
};