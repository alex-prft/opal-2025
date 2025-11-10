#!/usr/bin/env npx tsx

/**
 * OPAL Test Execution Guide
 *
 * Complete step-by-step guide for testing OPAL Connector - Agents
 * Ensures OSA receives data from OPAL during manual workflow execution
 */

class OPALTestGuide {
  private baseUrl: string;
  private expectedAgents: string[];

  constructor() {
    this.baseUrl = 'https://ifpa-strategy.vercel.app';
    this.expectedAgents = [
      'experiment_blueprinter',
      'audience_suggester',
      'content_review',
      'roadmap_generator',
      'integration_health',
      'personalization_idea_generator',
      'cmp_organizer',
      'customer_journey',
      'geo_audit'
    ];
  }

  displayPreTestSetup(): void {
    console.log('🚀 OPAL Connector - Agents Test Setup');
    console.log('=====================================');
    console.log('');
    console.log('📋 Pre-Test Checklist:');
    console.log('');

    console.log('1️⃣ OPAL Registration (CRITICAL):');
    console.log(`   Register OSA Custom Tool in OPAL using:`);
    console.log(`   🌐 Discovery URL: ${this.baseUrl}/api/opal/discovery`);
    console.log(`   ✅ This URL now returns proper functions array format`);
    console.log(`   ✅ Fixed "Discovery URL does not return valid functions data" error`);
    console.log('');

    console.log('2️⃣ Endpoint Validation:');
    console.log(`   📡 Workflow Endpoint: ${this.baseUrl}/api/opal/osa-workflow`);
    console.log(`   🔍 Discovery Format: OPAL Tools SDK compliant`);
    console.log(`   🛡️  CORS: Enabled for cross-origin requests`);
    console.log('');

    console.log('3️⃣ Expected Agent List:');
    this.expectedAgents.forEach((agent, index) => {
      console.log(`   ${index + 1}. ${agent}`);
    });
    console.log(`   📊 Total Expected: ${this.expectedAgents.length} agents`);
    console.log('');
  }

  displayTestCommands(): void {
    console.log('🔧 Test Execution Commands');
    console.log('==========================');
    console.log('');

    console.log('📊 Start Monitoring (Run in Terminal 1):');
    console.log('   npx tsx scripts/monitor-opal-test.ts');
    console.log('');

    console.log('🔍 Data Validation (Run in Terminal 2):');
    console.log('   npx tsx scripts/validate-opal-data-reception.ts');
    console.log('');

    console.log('🧪 Discovery Validation (One-time check):');
    console.log('   npm run validate:opal:prod');
    console.log('');

    console.log('📡 Live Endpoint Test:');
    console.log(`   curl -X GET ${this.baseUrl}/api/opal/discovery | jq '.functions | length'`);
    console.log('   Expected: Should return a number > 0');
    console.log('');
  }

  displayWorkflowInstructions(): void {
    console.log('🎮 Workflow Execution Instructions');
    console.log('==================================');
    console.log('');

    console.log('1️⃣ BEFORE running strategy_assistant_workflow.json:');
    console.log('   • Start monitoring scripts (see commands above)');
    console.log('   • Verify OPAL registration is complete');
    console.log('   • Confirm discovery endpoint returns functions array');
    console.log('');

    console.log('2️⃣ DURING workflow execution:');
    console.log('   • Monitor Terminal 1 for real-time agent data reception');
    console.log('   • Monitor Terminal 2 for data structure validation');
    console.log('   • Watch for 9 distinct agent data packets');
    console.log('');

    console.log('3️⃣ AFTER workflow completion:');
    console.log('   • Review monitoring logs for all 9 agents');
    console.log('   • Generate final validation report');
    console.log('   • Confirm no data loss or format errors');
    console.log('');
  }

  displayExpectedDataStructure(): void {
    console.log('📋 Expected OPAL Agent Data Structure');
    console.log('====================================');
    console.log('');

    const sampleStructure = {
      workflow_id: "your-workflow-id",
      agent_data: [
        {
          agent_id: "content_review",
          agent_name: "Content Review Agent",
          workflow_id: "your-workflow-id",
          execution_results: {
            summary: "Analysis completed",
            recommendations: ["Recommendation 1"],
            confidence_score: 0.95,
            data_points_analyzed: 100
          },
          metadata: {
            execution_time_ms: 30000,
            timestamp: "2024-01-01T00:00:00.000Z",
            success: true,
            started_at: "2024-01-01T00:00:00.000Z",
            completed_at: "2024-01-01T00:00:00.000Z"
          }
        }
      ],
      client_name: "Test Client",
      business_objectives: ["Objective 1"]
    };

    console.log('📋 Expected JSON Structure:');
    console.log('```json');
    console.log(JSON.stringify(sampleStructure, null, 2));
    console.log('```');
    console.log('');

    console.log('✅ Validation Criteria:');
    console.log('   • workflow_id must be consistent');
    console.log('   • agent_data must be non-empty array');
    console.log('   • Each agent must have valid agent_id from expected list');
    console.log('   • execution_results must contain summary and recommendations');
    console.log('   • metadata must include timestamp and success status');
    console.log('');
  }

  displayTroubleshootingGuide(): void {
    console.log('🔧 Troubleshooting Guide');
    console.log('========================');
    console.log('');

    console.log('❌ Common Issues & Solutions:');
    console.log('');

    console.log('🔴 "Discovery URL does not return valid functions data":');
    console.log('   ✅ FIXED: Discovery endpoint now returns functions array');
    console.log('   🔍 Verify: npm run validate:opal:prod should show ✅ success');
    console.log('');

    console.log('🔴 No agent data received:');
    console.log('   • Check OPAL registration is complete');
    console.log('   • Verify workflow execution started');
    console.log('   • Confirm agents are running (may take several minutes)');
    console.log('');

    console.log('🔴 Partial agent data:');
    console.log('   • Some agents may take longer to execute');
    console.log('   • Monitor for up to 10 minutes total');
    console.log('   • Check agent-specific execution logs');
    console.log('');

    console.log('🔴 Data format errors:');
    console.log('   • Validation script will show specific field errors');
    console.log('   • Check agent_id matches expected list');
    console.log('   • Verify metadata includes required fields');
    console.log('');

    console.log('🔧 Debug Commands:');
    console.log('   • Check endpoint: curl -I ' + this.baseUrl + '/api/opal/osa-workflow');
    console.log('   • Test discovery: npm run validate:opal:main');
    console.log('   • View logs: Check monitoring script output');
    console.log('');
  }

  displaySuccessCriteria(): void {
    console.log('🎯 Test Success Criteria');
    console.log('========================');
    console.log('');

    console.log('✅ Complete Success Indicators:');
    console.log(`   • All ${this.expectedAgents.length} agents send data successfully`);
    console.log('   • Data structure validation passes for all agents');
    console.log('   • No format or parsing errors');
    console.log('   • Workflow completes within expected timeframe');
    console.log('');

    console.log('⚠️ Partial Success Indicators:');
    console.log('   • Most agents (7+) send data successfully');
    console.log('   • Minor validation warnings (but no errors)');
    console.log('   • Some agents may still be executing');
    console.log('');

    console.log('❌ Failure Indicators:');
    console.log('   • No agent data received after 10 minutes');
    console.log('   • Multiple data validation errors');
    console.log('   • Discovery endpoint format errors');
    console.log('   • OPAL registration issues');
    console.log('');
  }

  displayFullGuide(): void {
    console.clear();
    this.displayPreTestSetup();
    this.displayTestCommands();
    this.displayWorkflowInstructions();
    this.displayExpectedDataStructure();
    this.displayTroubleshootingGuide();
    this.displaySuccessCriteria();

    console.log('🚀 Ready to Begin OPAL Test');
    console.log('===========================');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('1. Register OSA Custom Tool in OPAL using discovery URL above');
    console.log('2. Start monitoring scripts in separate terminals');
    console.log('3. Execute strategy_assistant_workflow.json');
    console.log('4. Monitor real-time data reception');
    console.log('5. Generate final validation report');
    console.log('');
    console.log('🎯 Test Objective: Confirm OSA receives data from all 9 OPAL agents');
    console.log('');
  }
}

// Execute guide if run directly
if (require.main === module) {
  const guide = new OPALTestGuide();
  guide.displayFullGuide();
}

export { OPALTestGuide };