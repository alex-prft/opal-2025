#!/usr/bin/env node

/**
 * OPAL Integration Testing Script
 *
 * Comprehensive testing for the osa_send_data_to_osa_webhook endpoint
 * Tests parameter transformation, authentication, and error handling
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:3000';
const ENDPOINT = '/api/tools/osa_send_data_to_osa_webhook';

// Test data matching OPAL webhook format
const OPAL_TEST_PAYLOAD = {
  agent_name: 'audience_suggester',
  execution_results: {
    hero: {
      title: 'Audience Segmentation Strategy',
      promise: 'Data-driven segmentation approach for targeted campaigns',
      confidence: 85,
      metrics: [
        { label: 'Segments Identified', value: '4 key groups', hint: 'Primary audience categories' },
        { label: 'Reach Potential', value: '12,500 members', hint: 'Total addressable audience' },
        { label: 'Engagement Score', value: 'High', hint: 'Based on historical interaction data' }
      ]
    },
    overview: {
      summary: 'Comprehensive audience analysis reveals distinct behavioral segments with high engagement potential.',
      keyPoints: [
        'Strategic Buyer Sarah segment shows highest conversion rates',
        'Innovation-Focused Frank requires technical content approach',
        'Mobile-first experience critical for 65% of audience'
      ]
    },
    insights: [
      {
        title: 'Behavioral Segmentation',
        description: 'Four distinct user personas identified through data analysis',
        bullets: [
          'Strategic buyers prioritize ROI and efficiency metrics',
          'Innovation adopters seek cutting-edge features and early access',
          'Value-conscious users focus on cost-effectiveness and reliability'
        ]
      }
    ],
    opportunities: [
      {
        label: 'Personalized content streams for each segment',
        impactLevel: 'High',
        effortLevel: 'Medium',
        confidence: 78
      },
      {
        label: 'Dynamic messaging based on user behavior patterns',
        impactLevel: 'High',
        effortLevel: 'Low',
        confidence: 92
      }
    ],
    nextSteps: [
      {
        label: 'Implement segment-specific landing page variants',
        ownerHint: 'Marketing Team',
        timeframeHint: '2-3 weeks'
      },
      {
        label: 'Set up behavioral trigger campaigns',
        ownerHint: 'CRM Team',
        timeframeHint: '1 week'
      }
    ],
    meta: {
      tier: 'optimization',
      agents: ['audience_suggester'],
      maturity: 'walk',
      lastUpdated: new Date().toISOString()
    }
  },
  workflow_id: 'test-workflow-' + Date.now(),
  metadata: {
    execution_status: 'completed',
    execution_time_ms: 2340,
    timestamp: new Date().toISOString(),
    success: true
  }
};

// Test cases
const TEST_CASES = [
  {
    name: 'Basic Parameter Transformation',
    description: 'Test OPAL → Enhanced Tools parameter mapping',
    payload: OPAL_TEST_PAYLOAD,
    headers: {
      'Content-Type': 'application/json'
    }
  },
  {
    name: 'Authentication Header Forwarding',
    description: 'Test HMAC signature and Bearer token forwarding',
    payload: OPAL_TEST_PAYLOAD,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token-12345',
      'X-OSA-Signature': 'sha256=test-hmac-signature'
    }
  },
  {
    name: 'Correlation ID Tracking',
    description: 'Test correlation ID generation and response headers',
    payload: OPAL_TEST_PAYLOAD,
    headers: {
      'Content-Type': 'application/json',
      'X-Correlation-ID': 'manual-test-correlation-' + Date.now()
    }
  },
  {
    name: 'Error Handling - Invalid Payload',
    description: 'Test error handling with malformed data',
    payload: {
      invalid_field: 'test'
    },
    headers: {
      'Content-Type': 'application/json'
    }
  },
  {
    name: 'Tool Discovery',
    description: 'Test GET endpoint for tool information',
    method: 'GET',
    payload: null,
    headers: {}
  }
];

// HTTP request helper
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Run test case
async function runTest(testCase) {
  console.log(`\n🧪 Running: ${testCase.name}`);
  console.log(`📋 ${testCase.description}\n`);

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: ENDPOINT,
    method: testCase.method || 'POST',
    headers: testCase.headers
  };

  try {
    const response = await makeRequest(options, testCase.payload);

    console.log(`✅ Status: ${response.statusCode}`);

    // Check correlation ID in response headers
    if (response.headers['x-correlation-id']) {
      console.log(`🔗 Correlation ID: ${response.headers['x-correlation-id']}`);
    }

    // Check processing time
    if (response.headers['x-processing-time']) {
      console.log(`⏱️  Processing Time: ${response.headers['x-processing-time']}ms`);
    }

    // Parse and display response
    let responseData;
    try {
      responseData = JSON.parse(response.body);
      console.log(`📄 Response: ${JSON.stringify(responseData, null, 2)}`);
    } catch (e) {
      console.log(`📄 Raw Response: ${response.body}`);
    }

    // Validate key success indicators
    if (response.statusCode === 200 && responseData) {
      if (responseData.success) {
        console.log('✅ Success confirmed in response');
      }
      if (responseData.correlation_id) {
        console.log(`✅ Correlation ID confirmed: ${responseData.correlation_id}`);
      }
      if (responseData.enhanced_tool_response) {
        console.log('✅ Enhanced tool integration confirmed');
      }
    }

    return {
      testCase: testCase.name,
      success: response.statusCode < 400,
      statusCode: response.statusCode,
      correlationId: response.headers['x-correlation-id'],
      processingTime: response.headers['x-processing-time']
    };

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return {
      testCase: testCase.name,
      success: false,
      error: error.message
    };
  }
}

// Main test execution
async function runAllTests() {
  console.log('🚀 OPAL Integration Testing Suite');
  console.log('=================================\n');

  const results = [];

  for (const testCase of TEST_CASES) {
    const result = await runTest(testCase);
    results.push(result);

    // Brief pause between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('================');

  const successful = results.filter(r => r.success).length;
  const total = results.length;

  console.log(`✅ Passed: ${successful}/${total}`);
  console.log(`❌ Failed: ${total - successful}/${total}`);

  if (successful === total) {
    console.log('\n🎉 All tests passed! OPAL integration is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check server logs for details.');
  }

  return results;
}

// Run tests if called directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests, OPAL_TEST_PAYLOAD };