#!/usr/bin/env npx tsx

/**
 * OPAL Webhook Simulator CLI
 *
 * Command-line interface for testing the OPAL Connector - Agents service
 * with realistic webhook data simulation.
 *
 * Usage:
 *   npx tsx scripts/test-opal-simulator.ts [command] [options]
 *
 * Commands:
 *   workflow     - Simulate a single workflow with all agents
 *   multiple     - Simulate multiple concurrent workflows
 *   agent        - Test a specific agent
 *   failures     - Test failure scenarios
 *   performance  - Performance testing with high load
 */

import { OpalWebhookSimulator, SimulationConfig } from '../src/lib/testing/opal-webhook-simulator';

// CLI argument parsing
const args = process.argv.slice(2);
const command = args[0] || 'workflow';
const baseUrl = process.env.OPAL_SIMULATOR_URL || 'http://localhost:3000';

async function runSimulator() {
  console.log('🚀 OPAL Webhook Simulator CLI');
  console.log(`📍 Target URL: ${baseUrl}`);
  console.log(`⚡ Command: ${command}\n`);

  const simulator = new OpalWebhookSimulator(baseUrl);

  try {
    switch (command) {
      case 'workflow':
        await runSingleWorkflow(simulator);
        break;

      case 'multiple':
        await runMultipleWorkflows(simulator);
        break;

      case 'agent':
        await runAgentTest(simulator);
        break;

      case 'failures':
        await runFailureTests(simulator);
        break;

      case 'performance':
        await runPerformanceTest(simulator);
        break;

      case 'demo':
        await runDemoScenario(simulator);
        break;

      default:
        showUsage();
        process.exit(1);
    }

    console.log('\n✅ Simulation completed successfully!');

  } catch (error) {
    console.error('\n❌ Simulation failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function runSingleWorkflow(simulator: OpalWebhookSimulator) {
  console.log('📊 Simulating single workflow with all 9 agents...\n');

  const config: SimulationConfig = {
    workflowCount: 1,
    verbose: true,
    clientName: 'IFPA Strategy - Demo Client',
    businessObjectives: [
      'Increase conversion rate by 15%',
      'Improve mobile user experience',
      'Optimize personalization engine',
      'Reduce customer acquisition cost'
    ]
  };

  await simulator.simulateWorkflow(config);
}

async function runMultipleWorkflows(simulator: OpalWebhookSimulator) {
  const count = parseInt(args[1]) || 3;
  console.log(`🔄 Simulating ${count} concurrent workflows...\n`);

  const config: SimulationConfig = {
    workflowCount: count,
    agentDelay: 1000, // Faster for multiple workflows
    failureRate: 0.05, // 5% failure rate
    verbose: false
  };

  await simulator.simulateMultipleWorkflows(config);
}

async function runAgentTest(simulator: OpalWebhookSimulator) {
  const agentId = args[1] as any || 'content_review';
  console.log(`🧪 Testing individual agent: ${agentId}\n`);

  await simulator.testAgent(agentId);
}

async function runFailureTests(simulator: OpalWebhookSimulator) {
  console.log('💥 Testing failure scenarios and error handling...\n');
  await simulator.simulateFailureScenarios();
}

async function runPerformanceTest(simulator: OpalWebhookSimulator) {
  const workflows = parseInt(args[1]) || 10;
  console.log(`⚡ Performance testing with ${workflows} concurrent workflows...\n`);

  const config: SimulationConfig = {
    workflowCount: workflows,
    agentDelay: 500, // Very fast for performance testing
    failureRate: 0.02, // 2% failure rate
    verbose: false
  };

  console.time('Performance Test');
  await simulator.simulateMultipleWorkflows(config);
  console.timeEnd('Performance Test');
}

async function runDemoScenario(simulator: OpalWebhookSimulator) {
  console.log('🎭 Running comprehensive demo scenario...\n');

  // Step 1: Single successful workflow
  console.log('Step 1: Complete successful workflow');
  await simulator.simulateWorkflow({
    failureRate: 0,
    verbose: true,
    clientName: 'IFPA Demo - Success Case'
  });

  await sleep(2000);

  // Step 2: Workflow with some failures
  console.log('\nStep 2: Workflow with partial failures');
  await simulator.simulateWorkflow({
    failureRate: 0.3,
    verbose: true,
    clientName: 'IFPA Demo - Mixed Results'
  });

  await sleep(2000);

  // Step 3: Individual agent tests
  console.log('\nStep 3: Individual agent testing');
  for (const agentId of ['content_review', 'experiment_blueprinter', 'integration_health']) {
    await simulator.testAgent(agentId as any);
    await sleep(1000);
  }

  console.log('\n🎉 Demo scenario completed!');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function showUsage() {
  console.log(`
Usage: npx tsx scripts/test-opal-simulator.ts [command] [options]

Commands:
  workflow              Simulate single workflow (default)
  multiple [count]      Simulate multiple workflows (default: 3)
  agent [agent_id]      Test specific agent (default: content_review)
  failures              Test failure scenarios
  performance [count]   Performance test (default: 10 workflows)
  demo                  Run comprehensive demo scenario

Environment Variables:
  OPAL_SIMULATOR_URL    Target URL (default: http://localhost:3000)

Examples:
  npx tsx scripts/test-opal-simulator.ts workflow
  npx tsx scripts/test-opal-simulator.ts multiple 5
  npx tsx scripts/test-opal-simulator.ts agent experiment_blueprinter
  npx tsx scripts/test-opal-simulator.ts performance 20
  npx tsx scripts/test-opal-simulator.ts demo

Available Agent IDs:
  - content_review
  - geo_audit
  - audience_suggester
  - experiment_blueprinter
  - personalization_idea_generator
  - roadmap_generator
  - integration_health
  - cmp_organizer
  - customer_journey
`);
}

// Run the CLI
if (require.main === module) {
  runSimulator().catch(console.error);
}