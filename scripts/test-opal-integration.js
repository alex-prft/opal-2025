#!/usr/bin/env node

/**
 * OPAL Integration Test Script
 * Tests Bearer token authentication and tool functionality
 */

const https = require('https');
const http = require('http');

const BEARER_TOKEN = 'e0d762e632798f12a1026a1d66f6e0d6abcbff5dcf0f2589c9f0f7a752d1668d';
const BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://opal-2025.vercel.app'
  : 'http://localhost:3000';

console.log('🔍 OPAL Integration Test Suite');
console.log('===============================');
console.log(`Base URL: ${BASE_URL}`);
console.log(`Bearer Token: ${BEARER_TOKEN.substring(0, 16)}...${BEARER_TOKEN.substring(-8)}`);
console.log('');

async function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const client = url.protocol === 'https:' ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Authorization': `Bearer ${BEARER_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'OPAL-Integration-Test/1.0'
      }
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = client.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsed
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: body
          });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testDiscoveryEndpoint() {
  console.log('🔍 Testing Discovery Endpoint...');

  try {
    const response = await makeRequest('/api/tools/osa-tools/discovery');

    if (response.status === 200) {
      const { service_name, total_tools, integration_health } = response.data.discovery_info;
      console.log(`✅ Discovery Success: ${service_name}`);
      console.log(`   Tools Available: ${total_tools}`);
      console.log(`   Health Status: ${integration_health.status}`);
      console.log(`   Correlation ID: ${response.headers['x-correlation-id'] || 'N/A'}`);
      return true;
    } else {
      console.log(`❌ Discovery Failed: HTTP ${response.status}`);
      console.log(`   Error: ${response.data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Discovery Error: ${error.message}`);
    return false;
  }
}

async function testToolEndpoint(toolName, testData) {
  console.log(`🔧 Testing Tool: ${toolName}...`);

  try {
    const response = await makeRequest(`/api/tools/${toolName}`, 'POST', testData);

    if (response.status === 200 && response.data.success) {
      console.log(`✅ Tool Success: ${toolName}`);
      console.log(`   Processing Time: ${response.data._metadata?.processing_time_ms || 'N/A'}ms`);
      console.log(`   Correlation ID: ${response.data._metadata?.correlation_id || 'N/A'}`);
      return true;
    } else {
      console.log(`❌ Tool Failed: ${toolName} - HTTP ${response.status}`);
      console.log(`   Error: ${response.data.error || response.data.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Tool Error: ${toolName} - ${error.message}`);
    return false;
  }
}

async function runIntegrationTests() {
  const startTime = Date.now();
  let passedTests = 0;
  let totalTests = 0;

  // Test 1: Discovery Endpoint
  totalTests++;
  if (await testDiscoveryEndpoint()) {
    passedTests++;
  }

  console.log('');

  // Test 2: Audience Segments Tool
  totalTests++;
  if (await testToolEndpoint('osa_fetch_audience_segments', {
    member_tiers: ['premium'],
    include_size_estimates: true
  })) {
    passedTests++;
  }

  // Test 3: Webhook Tool
  totalTests++;
  if (await testToolEndpoint('osa_send_data_to_osa_webhook', {
    agent_name: 'test_agent',
    execution_results: { test: 'data' },
    workflow_id: 'test_workflow_' + Date.now(),
    metadata: {
      execution_status: 'completed',
      timestamp: new Date().toISOString()
    }
  })) {
    passedTests++;
  }

  // Test 4: Language Validation Tool
  totalTests++;
  if (await testToolEndpoint('osa_validate_language_rules', {
    content_text: 'This is a test content for validation.',
    content_type: 'general',
    validation_level: 'comprehensive'
  })) {
    passedTests++;
  }

  const duration = Date.now() - startTime;

  console.log('');
  console.log('📊 Test Results Summary');
  console.log('=======================');
  console.log(`Tests Passed: ${passedTests}/${totalTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log(`Total Duration: ${duration}ms`);
  console.log(`Bearer Token: ${passedTests > 0 ? '✅ Working' : '❌ Failed'}`);

  if (passedTests === totalTests) {
    console.log('');
    console.log('🎉 All tests passed! OPAL integration is ready for production.');
    process.exit(0);
  } else {
    console.log('');
    console.log('⚠️  Some tests failed. Check the logs above for details.');
    process.exit(1);
  }
}

// Run the tests
runIntegrationTests().catch((error) => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});