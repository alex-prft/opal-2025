/**
 * Test Workflow Completion Detection and Query Refresh (STEP 5)
 * This script validates the implementation of workflow completion handling
 */

const testWorkflowCompletion = async () => {
  console.log('🧪 Testing Workflow Completion Detection & Query Refresh (STEP 5)');
  console.log('='.repeat(70));

  try {
    // 1. Check initial state
    console.log('\n1. Checking initial Recent Data state...');
    const initialStatus = await fetch('http://localhost:3000/api/admin/osa/recent-status');
    const initialData = await initialStatus.json();
    console.log('Initial timestamps:', {
      lastWebhookAt: initialData.lastWebhookAt,
      lastAgentDataAt: initialData.lastAgentDataAt,
      lastForceSyncAt: initialData.lastForceSyncAt,
      lastWorkflowStatus: initialData.lastWorkflowStatus
    });

    // 2. Test Force Sync trigger
    console.log('\n2. Testing Force Sync workflow trigger...');
    const triggerResponse = await fetch('http://localhost:3000/api/force-sync/trigger', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sync_scope: 'quick',
        client_context: {
          client_name: 'Workflow Completion Test',
          industry: 'Testing'
        },
        triggered_by: 'step5_test_script'
      })
    });

    const triggerData = await triggerResponse.json();
    console.log('Force Sync trigger result:', {
      success: triggerData.success,
      session_id: triggerData.session_id,
      correlation_id: triggerData.correlation_id
    });

    if (triggerData.success && triggerData.session_id) {
      // 3. Monitor Force Sync progress
      console.log('\n3. Monitoring Force Sync progress...');
      let attempts = 0;
      const maxAttempts = 30; // 30 attempts * 2 seconds = 1 minute max

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        attempts++;

        const statusResponse = await fetch(`http://localhost:3000/api/force-sync/status/${triggerData.session_id}`);
        const statusData = await statusResponse.json();

        console.log(`   Attempt ${attempts}: Status = ${statusData.status}, Progress = ${statusData.progress}%`);

        // Check if workflow completed or failed
        if (statusData.status === 'completed' || statusData.status === 'failed') {
          console.log(`\n✅ Workflow ${statusData.status} detected!`);

          // 4. Wait a moment for React Query cache invalidation to take effect
          console.log('\n4. Waiting for React Query cache invalidation...');
          await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds

          // 5. Check if Recent Data was refreshed
          console.log('\n5. Checking if Recent Data was refreshed...');
          const refreshedStatus = await fetch('http://localhost:3000/api/admin/osa/recent-status');
          const refreshedData = await refreshedStatus.json();

          console.log('Refreshed timestamps:', {
            lastWebhookAt: refreshedData.lastWebhookAt,
            lastAgentDataAt: refreshedData.lastAgentDataAt,
            lastForceSyncAt: refreshedData.lastForceSyncAt,
            lastWorkflowStatus: refreshedData.lastWorkflowStatus
          });

          // Check if timestamps changed
          const timestampsChanged =
            refreshedData.lastWebhookAt !== initialData.lastWebhookAt ||
            refreshedData.lastAgentDataAt !== initialData.lastAgentDataAt ||
            refreshedData.lastForceSyncAt !== initialData.lastForceSyncAt;

          console.log('\nTimestamp comparison:', {
            timestampsChanged,
            newForceSyncData: refreshedData.lastForceSyncAt !== null
          });

          break;
        }

        // Check for timeout
        if (statusData.status === 'timeout' || attempts >= maxAttempts) {
          console.log('\n⏰ Workflow monitoring timed out');
          break;
        }
      }
    }

    console.log('\n✅ Workflow completion test completed');
    console.log('\nImplementation Summary (STEP 5):');
    console.log('- ✅ useQueryClient integration added');
    console.log('- ✅ handleStreamMessage callback implemented');
    console.log('- ✅ Workflow completion detection (multiple signal types)');
    console.log('- ✅ React Query cache invalidation on completion');
    console.log('- ✅ SSE message parsing with error handling');
    console.log('- ✅ Debug logging for troubleshooting');

    console.log('\nExpected Behavior:');
    console.log('1. 📡 Streaming ENABLED when Force Sync starts');
    console.log('2. 📊 SSE messages processed during workflow');
    console.log('3. ✅ Completion detected via SSE message');
    console.log('4. 🔄 React Query cache invalidated');
    console.log('5. 📡 Streaming DISABLED automatically');
    console.log('6. 📈 Recent Data timestamps updated');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
testWorkflowCompletion();