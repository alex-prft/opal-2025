#!/usr/bin/env node

/**
 * Test Corrected OPAL Agent → OSA Workflow Flow
 * Tests the updated configuration with correct schema and authentication
 */

const crypto = require('crypto');

class CorrectedOPALFlowTester {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.hmacSecret = process.env.OPAL_WEBHOOK_HMAC_SECRET || 'secure-hmac-verification-secret-32chars-dev';
    this.testWorkflowId = `test-corrected-flow-${Date.now()}`;
  }

  /**
   * Generate HMAC signature matching the OSA webhook expectations
   */
  generateHMACSignature(payload, timestamp) {
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const signatureData = timestamp.toString() + payloadString;

    const hmac = crypto.createHmac('sha256', this.hmacSecret);
    hmac.update(signatureData, 'utf8');
    const signature = hmac.digest('hex');

    return `t=${timestamp},v1=${signature}`;
  }

  /**
   * Test sending agent data using corrected schema format
   */
  async testAgentDataSubmission(agentName) {
    console.log(`🧪 [Test] Testing agent data submission for: ${agentName}`);

    // Create payload matching the webhook schema (WebhookEventSchema)
    const payload = {
      agent_id: agentName,                     // ✅ Webhook expects agent_id
      workflow_id: this.testWorkflowId,
      agent_data: {                            // ✅ Webhook expects agent_data
        status: 'completed',
        success: true,
        insights: [`${agentName} executed successfully`],
        recommendations: [`Recommendation from ${agentName}`],
        data_quality_score: 0.95,
        execution_time_ms: Math.floor(Math.random() * 5000) + 1000
      },
      execution_status: 'success',             // ✅ Webhook expects specific enum
      offset: Math.floor(Math.random() * 100),
      timestamp: new Date().toISOString(),
      metadata: {
        agent_version: '1.0.0',
        simulation: true,
        test_run: true
      }
    };

    const payloadJson = JSON.stringify(payload);
    const timestamp = Date.now();
    const signature = this.generateHMACSignature(payloadJson, timestamp);

    try {
      console.log(`📤 [Test] Sending to /api/webhooks/opal-workflow...`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${this.baseUrl}/api/webhooks/opal-workflow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-OSA-Signature': signature,         // ✅ Corrected signature header
          'User-Agent': 'OPAL-Agent-Test/1.0.0'
        },
        body: payloadJson,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const result = await response.json();

      if (response.ok) {
        console.log(`✅ [Test] ${agentName} data submitted successfully:`, {
          status: response.status,
          workflow_id: result.workflow_id,
          correlation_id: result.correlation_id
        });
        return { success: true, result };
      } else {
        console.error(`❌ [Test] ${agentName} submission failed:`, {
          status: response.status,
          error: result.error,
          message: result.message
        });
        return { success: false, error: result };
      }
    } catch (error) {
      console.error(`💥 [Test] ${agentName} submission error:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Test complete workflow with all 9 agents
   */
  async testCompleteWorkflow() {
    console.log('🚀 [Test] Starting corrected OPAL workflow test...');
    console.log(`📋 [Test] Workflow ID: ${this.testWorkflowId}`);

    const agents = [
      'integration_health',
      'content_review',
      'geo_audit',
      'audience_suggester',
      'experiment_blueprinter',
      'personalization_idea_generator',
      'customer_journey',
      'roadmap_generator',
      'cmp_organizer'
    ];

    const results = [];

    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];
      console.log(`\n🤖 [Test] Agent ${i + 1}/9: ${agent}`);

      const result = await this.testAgentDataSubmission(agent);
      results.push({ agent, ...result });

      // Small delay between agents
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`\n📊 [Test] Workflow Test Results:`);
    console.log(`✅ Successful: ${successful}/${agents.length}`);
    console.log(`❌ Failed: ${failed}/${agents.length}`);

    if (failed > 0) {
      console.log(`\n🔍 [Test] Failed agents:`);
      results.filter(r => !r.success).forEach(r => {
        console.log(`  - ${r.agent}: ${r.error}`);
      });
    }

    return {
      workflow_id: this.testWorkflowId,
      total_agents: agents.length,
      successful,
      failed,
      results
    };
  }

  /**
   * Verify OSA received the data
   */
  async verifyOSADataReception() {
    console.log(`\n🔍 [Test] Verifying OSA data reception...`);

    try {
      const response = await fetch(`${this.baseUrl}/api/webhook-events/stats?hours=1`);
      const stats = await response.json();

      if (stats.success && stats.osaWorkflowData) {
        const recentActivity = new Date(stats.osaWorkflowData.lastOSAToolExecution);
        const minutesAgo = (Date.now() - recentActivity.getTime()) / (1000 * 60);

        console.log(`✅ [Test] OSA data reception verified:`);
        console.log(`  - Last execution: ${recentActivity.toISOString()}`);
        console.log(`  - Minutes ago: ${minutesAgo.toFixed(1)}`);
        console.log(`  - Total executions: ${stats.osaWorkflowData.totalOSAToolExecutions}`);
        console.log(`  - Reception rate: ${(stats.osaWorkflowData.dataReceptionRate * 100).toFixed(1)}%`);

        return true;
      } else {
        console.warn(`⚠️ [Test] No OSA workflow data found in stats`);
        return false;
      }
    } catch (error) {
      console.error(`❌ [Test] Failed to verify OSA data reception:`, error.message);
      return false;
    }
  }
}

// Run the test
async function main() {
  console.log('🧪 Testing Corrected OPAL Agent → OSA Workflow Flow\n');

  const tester = new CorrectedOPALFlowTester();

  try {
    // Test complete workflow
    const workflowResults = await tester.testCompleteWorkflow();

    // Verify OSA received the data
    const dataReceived = await tester.verifyOSADataReception();

    // Final results
    console.log(`\n🎯 [Test] Final Results:`);
    console.log(`  Workflow Success: ${workflowResults.successful}/${workflowResults.total_agents} agents`);
    console.log(`  OSA Data Received: ${dataReceived ? 'Yes' : 'No'}`);
    console.log(`  Overall Success: ${workflowResults.successful === workflowResults.total_agents && dataReceived}`);

    if (workflowResults.successful === workflowResults.total_agents && dataReceived) {
      console.log(`\n🎉 [Test] SUCCESS! Corrected OPAL → OSA flow is working!`);
      process.exit(0);
    } else {
      console.log(`\n💥 [Test] FAILURE! Some issues remain to be fixed.`);
      process.exit(1);
    }

  } catch (error) {
    console.error('💥 [Test] Test failed with error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { CorrectedOPALFlowTester };