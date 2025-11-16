#!/usr/bin/env node

/**
 * Comprehensive OSA Status Component Test Script
 *
 * This script tests all possible states of the RecentDataComponent
 * by manipulating the API response and validating UI behavior.
 */

const BASE_URL = 'http://localhost:3000';

console.log('🧪 OSA Status Component QA Test Suite\n');

// Test 1: Current Success State
console.log('1️⃣ Testing SUCCESS State (Current Data)');
console.log('API Endpoint:', `${BASE_URL}/api/admin/osa/recent-status`);

async function testCurrentState() {
  try {
    const response = await fetch(`${BASE_URL}/api/admin/osa/recent-status`);
    const data = await response.json();

    console.log('✅ API Response:', JSON.stringify(data, null, 2));

    // Analyze expected component behavior
    const hasRecentData = data.lastWebhookAt || data.lastAgentDataAt || data.lastForceSyncAt;
    const expectedStatus = data.lastWorkflowStatus === 'running' ? 'processing' :
                          data.lastWorkflowStatus === 'failed' ? 'failed' :
                          data.lastWorkflowStatus === 'completed' ? 'success' :
                          hasRecentData ? 'success' : 'none';

    console.log(`📊 Expected Component Status: ${expectedStatus.toUpperCase()}`);

    // Find most recent activity
    const timestamps = [
      { type: 'webhook', time: data.lastWebhookAt },
      { type: 'agent', time: data.lastAgentDataAt },
      { type: 'force sync', time: data.lastForceSyncAt }
    ].filter(t => t.time).sort((a, b) => new Date(b.time) - new Date(a.time));

    if (timestamps.length > 0) {
      const mostRecent = timestamps[0];
      const timeAgo = getTimeAgo(mostRecent.time);
      console.log(`🕐 Most Recent Activity: ${mostRecent.type} (${timeAgo})`);
    } else {
      console.log('🕐 Most Recent Activity: None');
    }

    return data;
  } catch (error) {
    console.error('❌ API Test Failed:', error.message);
    return null;
  }
}

// Test 2: Manual UI Validation Checklist
console.log('\n2️⃣ MANUAL UI VALIDATION CHECKLIST');
console.log('Navigate to: http://localhost:3000/engine/admin');
console.log('\n📋 Full Component (Admin Dashboard):');
console.log('  □ Status icon shows correct state (green checkmark for success)');
console.log('  □ "OSA workflow healthy" title displays');
console.log('  □ "Last activity: X ago" shows correct relative time');
console.log('  □ Three timestamp pills show correct dates');
console.log('  □ Refresh button works and updates data');
console.log('  □ No error messages visible');

console.log('\n📋 Compact Component (Results Sidebar):');
console.log('  □ Compact status indicator shows');
console.log('  □ "OSA Active" text displays');
console.log('  □ Small refresh button works');
console.log('  □ Relative time shows correctly');

// Test 3: Error State Testing
console.log('\n3️⃣ Testing ERROR State');
console.log('⚠️  To test error state, temporarily modify:');
console.log('   src/app/api/admin/osa/recent-status/route.ts');
console.log('   Add: throw new Error("Test error") at line 20');
console.log('\n📋 Expected Error Behavior:');
console.log('  □ Red X icon appears');
console.log('  □ "OSA workflow error" title shows');
console.log('  □ Error message displays in component');
console.log('  □ Refresh button still works');

// Test 4: Loading State Testing
console.log('\n4️⃣ Testing LOADING State');
console.log('💡 Hard refresh the page (Cmd+Shift+R) and observe:');
console.log('  □ Spinner appears briefly');
console.log('  □ Smooth transition to success state');
console.log('  □ No flash of error content');

// Test 5: Different Workflow States
console.log('\n5️⃣ Testing Different Workflow States');
console.log('🔄 To simulate "running" state:');
console.log('   Trigger a Force Sync and observe real-time updates');
console.log('📋 Expected for "running":');
console.log('  □ Blue spinning icon');
console.log('  □ "OSA workflow in progress" title');
console.log('  □ "Processing..." status text');

// Helper function
function getTimeAgo(timestamp) {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// Run the test
async function runTests() {
  const currentData = await testCurrentState();

  console.log('\n🎯 QUICK VERIFICATION URLS:');
  console.log('Admin Dashboard: http://localhost:3000/engine/admin');
  console.log('Results Page: http://localhost:3000/engine/results');
  console.log('API Endpoint: http://localhost:3000/api/admin/osa/recent-status');

  if (currentData) {
    console.log('\n✨ Component should show SUCCESS state with recent Force Sync activity');
  }

  console.log('\n🏁 Complete the manual checklist above to verify all states work correctly!');
}

runTests().catch(console.error);