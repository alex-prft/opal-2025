#!/usr/bin/env node

// Test script for Optimizely CMS 12 PaaS integration
// Validates that the content recommendations APIs work with both CMS and fallback content

const fetch = require('node-fetch');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function testCMSIntegration() {
  console.log('🧪 Testing Optimizely CMS 12 PaaS Integration for OSA Content Recommendations Tools\n');

  const tests = [
    {
      name: 'Content Recommendations by Topic',
      endpoint: '/api/tools/contentrecs/by-topic',
      method: 'POST',
      body: {
        topic: 'seasonal_produce',
        audience: 'paid_members',
        limit: 5,
        content_format: 'all'
      }
    },
    {
      name: 'Content Recommendations by Section',
      endpoint: '/api/tools/contentrecs/by-section',
      method: 'POST',
      body: {
        section: 'member_portal',
        audience: 'paid_members',
        limit: 3,
        personalization_level: 'moderate'
      }
    },
    {
      name: 'Content Catalog Retrieval',
      endpoint: '/api/tools/contentrecs/catalog',
      method: 'GET',
      queryParams: '?catalog_type=both&include_metadata=true&audience_filter=paid_members'
    },
    {
      name: 'Tier-based Content Data Generation',
      endpoint: '/api/tools/contentrecs/tier-data',
      method: 'POST',
      body: {
        content_recommendations: [
          {
            title: 'Test Content Item',
            topics: ['seasonal_produce'],
            sections: ['resource_center'],
            confidence_score: 0.85,
            audience: 'Paid Members'
          }
        ],
        tier_configuration: {
          tier1_summary: true,
          tier2_kpis: true,
          tier3_detailed: true
        }
      }
    },
    {
      name: 'Cache Refresh',
      endpoint: '/api/tools/contentrecs/cache-refresh',
      method: 'POST',
      body: {
        cache_scope: 'topics',
        force_refresh: false,
        cache_duration: '1_hour'
      }
    }
  ];

  const results = [];

  for (const test of tests) {
    console.log(`🔍 Testing: ${test.name}`);

    try {
      const url = `${BASE_URL}${test.endpoint}${test.queryParams || ''}`;
      const options = {
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
        }
      };

      if (test.body) {
        options.body = JSON.stringify(test.body);
      }

      const startTime = Date.now();
      const response = await fetch(url, options);
      const responseTime = Date.now() - startTime;

      const data = await response.json();

      const result = {
        test: test.name,
        status: response.ok ? 'PASS' : 'FAIL',
        statusCode: response.status,
        responseTime: responseTime,
        endpoint: test.endpoint,
        success: data.success,
        dataReceived: !!data
      };

      if (response.ok) {
        console.log(`✅ ${test.name}: PASS (${responseTime}ms)`);

        // Log specific success metrics
        if (data.recommendations) {
          console.log(`   📄 Recommendations: ${data.recommendations.length}`);
          result.recommendationCount = data.recommendations.length;
        }
        if (data.topics) {
          console.log(`   🏷️ Topics: ${data.topics.length}`);
          result.topicCount = data.topics.length;
        }
        if (data.sections) {
          console.log(`   🏗️ Sections: ${data.sections.length}`);
          result.sectionCount = data.sections.length;
        }
        if (data.tier_data_structure) {
          console.log(`   📊 Tier structure generated successfully`);
          result.tierDataGenerated = true;
        }
        if (data.cache_refreshed) {
          console.log(`   🔄 Cache refreshed: ${data.cache_refreshed}`);
          result.cacheRefreshed = data.cache_refreshed;
        }

      } else {
        console.log(`❌ ${test.name}: FAIL (${response.status})`);
        console.log(`   Error: ${data.error || data.message}`);
        result.error = data.error || data.message;
      }

      results.push(result);
      console.log('');

    } catch (error) {
      console.log(`❌ ${test.name}: ERROR`);
      console.log(`   ${error.message}`);
      results.push({
        test: test.name,
        status: 'ERROR',
        error: error.message,
        endpoint: test.endpoint
      });
      console.log('');
    }
  }

  // Summary
  console.log('📋 Test Summary:');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const errors = results.filter(r => r.status === 'ERROR').length;

  console.log(`   ✅ Passed: ${passed}/${results.length}`);
  console.log(`   ❌ Failed: ${failed}/${results.length}`);
  console.log(`   🚨 Errors: ${errors}/${results.length}`);

  const avgResponseTime = results
    .filter(r => r.responseTime)
    .reduce((sum, r) => sum + r.responseTime, 0) / results.filter(r => r.responseTime).length;

  if (avgResponseTime) {
    console.log(`   ⏱️ Average Response Time: ${Math.round(avgResponseTime)}ms`);
  }

  console.log('\n🔗 CMS Integration Status:');
  console.log('   CMS Configuration:', process.env.CMS_PAAS_API_KEY ? '✅ Configured' : '⚠️ Using Fallback');
  console.log('   Content Source:', process.env.CMS_PAAS_API_KEY === 'your_cms_api_key_here' ? 'Enhanced IFPA Fallback' : 'Optimizely CMS 12 PaaS');

  if (passed === results.length) {
    console.log('\n🎉 All tests passed! CMS integration is working correctly.');
    process.exit(0);
  } else {
    console.log('\n⚠️ Some tests failed. Check the configuration and try again.');
    process.exit(1);
  }
}

// Run the test
testCMSIntegration().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});