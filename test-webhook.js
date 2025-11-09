#!/usr/bin/env node

/**
 * Test script for Opal webhook endpoint with Bearer token authentication
 */

const https = require('https');

// Configuration
const WEBHOOK_URL = 'https://ifpa-strategy-h7m1rt4zt-alex-harris-projects-f468cccf.vercel.app/api/webhooks/opal-workflow';
const AUTH_TOKEN = 'opal-workflow-webhook-secret-2025';

// Test payload simulating an Opal agent completion event
const testPayload = {
  event_type: 'agent.completed',
  workflow_id: 'test-workflow-' + Date.now(),
  workflow_name: 'get_opal',
  timestamp: new Date().toISOString(),
  agent_id: 'content_review',
  agent_name: 'content_review',
  agent_success: true,
  agent_output: {
    text: `# Content Review Analysis for Test Client

## Executive Summary
Comprehensive content audit reveals significant opportunities for personalization enhancement.

## Key Findings
- Content Quality Score: 85/100
- Personalization Readiness: High
- SEO Optimization: 90% complete

## Recommendations
1. Implement dynamic content blocks
2. Optimize recommendation algorithms
3. Enhance category-based personalization`
  },
  execution_time_ms: 3500,
  trigger_source: 'api',
  metadata: {
    client_id: 'test-client',
    project_id: 'test-project',
    user_id: 'test-user',
    session_id: 'test-session-' + Date.now()
  }
};

function testWebhook() {
  console.log('🧪 Testing Opal Webhook Endpoint');
  console.log('📍 URL:', WEBHOOK_URL);
  console.log('🔐 Using Bearer token authentication');
  console.log('📦 Payload type:', testPayload.event_type);

  const postData = JSON.stringify(testPayload);

  const url = new URL(WEBHOOK_URL);

  const options = {
    hostname: url.hostname,
    port: url.port || 443,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      'User-Agent': 'Opal-Webhook-Test/1.0'
    }
  };

  const req = https.request(options, (res) => {
    console.log('\n📊 Response Status:', res.statusCode);
    console.log('📋 Response Headers:', res.headers);

    let responseData = '';
    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      console.log('\n📄 Response Body:');
      try {
        const parsed = JSON.parse(responseData);
        console.log(JSON.stringify(parsed, null, 2));

        if (res.statusCode === 200) {
          console.log('\n✅ Webhook test successful!');
          console.log('🎯 Authentication: PASSED');
          console.log('🎯 Payload processing: PASSED');
        } else if (res.statusCode === 401) {
          console.log('\n❌ Webhook test failed: Authentication error');
          console.log('🔍 Check if the Bearer token matches the server configuration');
        } else {
          console.log(`\n⚠️ Webhook test returned status ${res.statusCode}`);
        }
      } catch (error) {
        console.log('Raw response:', responseData);
        console.log('Parse error:', error.message);
      }
    });
  });

  req.on('error', (error) => {
    console.error('\n❌ Request failed:', error.message);
    console.error('🔍 Check network connectivity and URL');
  });

  req.write(postData);
  req.end();
}

// Run the test
console.log('🚀 Starting webhook test...\n');
testWebhook();