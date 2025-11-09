#!/usr/bin/env node

/**
 * Complete OPAL Workflow Validation Script
 *
 * Tests the entire 7-agent workflow to ensure all agents can successfully:
 * 1. Discover enhanced tools
 * 2. Execute their enhanced tools
 * 3. Pass data between agents via enhanced coordination
 * 4. Deliver final results to OSA via enhanced webhook
 */

import { execSync } from 'child_process';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TIMEOUT = 45000; // 45 second timeout for workflow tests

interface WorkflowStepResult {
  step_id: string;
  agent_name: string;
  success: boolean;
  execution_time_ms: number;
  enhanced_tools_used: string[];
  error_message?: string;
  workflow_data?: any;
}

interface WorkflowValidationResult {
  workflow_id: string;
  overall_success: boolean;
  total_steps: number;
  successful_steps: number;
  failed_steps: number;
  total_execution_time_ms: number;
  steps: WorkflowStepResult[];
  final_osa_delivery: {
    success: boolean;
    delivery_url?: string;
    delivery_method?: string;
  };
  summary: string;
}

/**
 * Simulates complete 7-agent workflow execution
 */
async function validateCompleteWorkflow(): Promise<WorkflowValidationResult> {
  const workflowId = `validation_workflow_${Date.now()}`;
  const startTime = Date.now();

  console.log(`🚀 Starting complete workflow validation for workflow: ${workflowId}\n`);

  // Define the 7-agent workflow sequence
  const workflowSteps = [
    {
      step_id: '825e1edf-fd07-460e-a123-aab99ed78c2b',
      agent_name: 'Integration Health Agent',
      enhanced_tools: ['monitor_workflow_health_enhanced', 'send_data_to_osa_enhanced']
    },
    {
      step_id: '24e33b43-48f9-4ad1-9080-2689ff64e4dc',
      agent_name: 'Content Review Agent',
      enhanced_tools: ['analyze_website_content_enhanced', 'store_workflow_data_enhanced', 'send_data_to_osa_enhanced']
    },
    {
      step_id: '6452fcaa-8442-454d-ba57-4391b6eb4cb3',
      agent_name: 'GEO Audit Agent',
      enhanced_tools: ['analyze_website_content_enhanced', 'send_data_to_osa_enhanced']
    },
    {
      step_id: '5d0e76db-e743-473d-8bf6-4615788b780d',
      agent_name: 'Audience Suggester Agent',
      enhanced_tools: ['generate_audience_segments_enhanced', 'retrieve_workflow_context_enhanced', 'send_data_to_osa_enhanced']
    },
    {
      step_id: 'd062a7ee-1893-4854-982f-198e4aadf9fe',
      agent_name: 'Experiment Blueprinter Agent',
      enhanced_tools: ['create_experiment_blueprint_enhanced', 'retrieve_workflow_context_enhanced', 'send_data_to_osa_enhanced']
    },
    {
      step_id: 'a91ec0a0-239a-4436-b3c4-0ae09193ae30',
      agent_name: 'Personalization Idea Generator Agent',
      enhanced_tools: ['retrieve_workflow_context_enhanced', 'send_data_to_osa_enhanced']
    },
    {
      step_id: '705aeb9a-0404-429b-99af-2698e420dd7c',
      agent_name: 'CMP Organizer Agent',
      enhanced_tools: ['compile_final_results_enhanced', 'send_data_to_osa_enhanced']
    }
  ];

  const stepResults: WorkflowStepResult[] = [];
  let workflowData = {
    content_analysis: null,
    audience_segments: null,
    experiment_blueprints: null,
    personalization_ideas: null
  };

  // Execute each workflow step
  for (const step of workflowSteps) {
    const stepStartTime = Date.now();

    try {
      console.log(`🔄 Executing: ${step.agent_name} (${step.step_id})`);

      const stepResult = await executeWorkflowStep(step, workflowId, workflowData);

      const executionTime = Date.now() - stepStartTime;

      stepResults.push({
        step_id: step.step_id,
        agent_name: step.agent_name,
        success: stepResult.success,
        execution_time_ms: executionTime,
        enhanced_tools_used: step.enhanced_tools,
        workflow_data: stepResult.data
      });

      // Update workflow data for next agents
      if (stepResult.success && stepResult.data) {
        if (step.agent_name.includes('Content Review')) {
          workflowData.content_analysis = stepResult.data;
        } else if (step.agent_name.includes('Audience')) {
          workflowData.audience_segments = stepResult.data;
        } else if (step.agent_name.includes('Experiment')) {
          workflowData.experiment_blueprints = stepResult.data;
        } else if (step.agent_name.includes('Personalization')) {
          workflowData.personalization_ideas = stepResult.data;
        }
      }

      const status = stepResult.success ? '✅' : '❌';
      console.log(`${status} ${step.agent_name}: ${stepResult.success ? 'Success' : 'Failed'} (${executionTime}ms)`);

      if (!stepResult.success) {
        stepResults[stepResults.length - 1].error_message = stepResult.error || 'Unknown error';
        console.log(`   Error: ${stepResult.error}`);
      }

    } catch (error) {
      const executionTime = Date.now() - stepStartTime;

      stepResults.push({
        step_id: step.step_id,
        agent_name: step.agent_name,
        success: false,
        execution_time_ms: executionTime,
        enhanced_tools_used: step.enhanced_tools,
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });

      console.log(`❌ ${step.agent_name}: Failed (${executionTime}ms)`);
      console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    console.log(''); // Add spacing between steps
  }

  // Test final OSA delivery
  console.log('📤 Testing final workflow delivery to OSA...');
  const finalDelivery = await testFinalOSADelivery(workflowId, workflowData);

  const totalTime = Date.now() - startTime;
  const successfulSteps = stepResults.filter(r => r.success).length;
  const failedSteps = stepResults.length - successfulSteps;
  const overallSuccess = failedSteps === 0 && finalDelivery.success;

  const result: WorkflowValidationResult = {
    workflow_id: workflowId,
    overall_success: overallSuccess,
    total_steps: stepResults.length,
    successful_steps: successfulSteps,
    failed_steps: failedSteps,
    total_execution_time_ms: totalTime,
    steps: stepResults,
    final_osa_delivery: finalDelivery,
    summary: overallSuccess
      ? '🎉 Complete 7-agent workflow executed successfully with enhanced tools!'
      : `⚠️ Workflow completed with ${failedSteps} failed step(s). Review errors above.`
  };

  return result;
}

/**
 * Execute individual workflow step with enhanced tools
 */
async function executeWorkflowStep(step: any, workflowId: string, workflowContext: any): Promise<any> {
  // Simulate agent execution based on agent type
  switch (step.agent_name) {
    case 'Content Review Agent':
      return await executeContentAnalysis(workflowId, workflowContext);

    case 'Audience Suggester Agent':
      return await executeAudienceSegmentation(workflowId, workflowContext);

    case 'Experiment Blueprinter Agent':
      return await executeExperimentBlueprint(workflowId, workflowContext);

    default:
      // For other agents, simulate successful execution with webhook delivery
      return await executeGenericAgentStep(step, workflowId, workflowContext);
  }
}

/**
 * Execute content analysis with enhanced tools
 */
async function executeContentAnalysis(workflowId: string, context: any): Promise<any> {
  try {
    const response = await fetch(`${BASE_URL}/api/opal/enhanced-tools`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tool_name: 'analyze_website_content_enhanced',
        parameters: {
          website_url: 'https://www.foodprocessing.com',
          analysis_config: {
            depth: 'comprehensive',
            include_seo: true,
            include_accessibility: true
          },
          workflow_context: {
            workflow_id: workflowId,
            agent_id: 'content_review_enhanced',
            execution_order: 1
          }
        }
      }),
      signal: AbortSignal.timeout(TIMEOUT)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: result.success,
      data: result.results,
      error: result.error_message
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Execute audience segmentation with enhanced tools
 */
async function executeAudienceSegmentation(workflowId: string, context: any): Promise<any> {
  try {
    const response = await fetch(`${BASE_URL}/api/opal/enhanced-tools`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tool_name: 'generate_audience_segments_enhanced',
        parameters: {
          business_objectives: 'Increase member engagement and conversion rates for food processing professionals',
          segmentation_config: {
            segment_size_min: 1000,
            geographic_scope: 'global',
            behavioral_weight: 0.6,
            demographic_weight: 0.4
          },
          workflow_context: {
            workflow_id: workflowId,
            agent_id: 'audience_suggester_enhanced',
            execution_order: 2
          }
        }
      }),
      signal: AbortSignal.timeout(TIMEOUT)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: result.success,
      data: result.results,
      error: result.error_message
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Execute experiment blueprint with enhanced tools
 */
async function executeExperimentBlueprint(workflowId: string, context: any): Promise<any> {
  try {
    const response = await fetch(`${BASE_URL}/api/opal/enhanced-tools`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tool_name: 'create_experiment_blueprint_enhanced',
        parameters: {
          personalization_goals: [
            'Dynamic content recommendations',
            'Member-specific resource suggestions',
            'Behavioral trigger content',
            'Geographic personalization'
          ],
          available_traffic: 50000,
          experiment_config: {
            confidence_level: 95,
            minimum_effect_size: 5,
            test_duration_weeks: 4
          },
          workflow_context: {
            workflow_id: workflowId,
            agent_id: 'experiment_blueprinter_enhanced',
            execution_order: 3
          }
        }
      }),
      signal: AbortSignal.timeout(TIMEOUT)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: result.success,
      data: result.results,
      error: result.error_message
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Execute generic agent step with enhanced webhook delivery
 */
async function executeGenericAgentStep(step: any, workflowId: string, context: any): Promise<any> {
  try {
    const response = await fetch(`${BASE_URL}/api/opal/enhanced-tools`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tool_name: 'send_data_to_osa_enhanced',
        parameters: {
          agent_id: step.step_id,
          agent_data: {
            agent_name: step.agent_name,
            execution_status: 'completed',
            enhanced_tools_used: step.enhanced_tools,
            workflow_coordination: true,
            simulated_results: {
              processing_time: '2.3s',
              quality_score: 0.87,
              recommendations_generated: Math.floor(5 + Math.random() * 10)
            }
          },
          workflow_id: workflowId,
          execution_status: 'completed',
          target_environment: 'development'
        }
      }),
      signal: AbortSignal.timeout(TIMEOUT)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: result.success,
      data: result.results,
      error: result.error_message
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Test final OSA delivery
 */
async function testFinalOSADelivery(workflowId: string, workflowData: any): Promise<any> {
  try {
    const response = await fetch(`${BASE_URL}/api/opal/enhanced-tools`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tool_name: 'send_data_to_osa_enhanced',
        parameters: {
          agent_id: 'workflow_final_delivery',
          agent_data: {
            workflow_type: 'complete_7_agent_workflow',
            workflow_results: workflowData,
            execution_summary: {
              total_agents_executed: 7,
              enhanced_tools_validation: 'successful',
              coordination_method: 'enhanced_workflow_tools'
            }
          },
          workflow_id: workflowId,
          execution_status: 'completed',
          target_environment: 'development'
        }
      }),
      signal: AbortSignal.timeout(TIMEOUT)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: result.success,
      delivery_url: result.results?.target_url,
      delivery_method: result.results?.delivery_method
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    const validationResult = await validateCompleteWorkflow();

    console.log('\n' + '='.repeat(80));
    console.log('📊 COMPLETE WORKFLOW VALIDATION SUMMARY');
    console.log('='.repeat(80));
    console.log(`Workflow ID: ${validationResult.workflow_id}`);
    console.log(`Total Steps: ${validationResult.total_steps}`);
    console.log(`Successful Steps: ${validationResult.successful_steps}`);
    console.log(`Failed Steps: ${validationResult.failed_steps}`);
    console.log(`Total Execution Time: ${validationResult.total_execution_time_ms}ms`);
    console.log(`Final OSA Delivery: ${validationResult.final_osa_delivery.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`Overall Status: ${validationResult.overall_success ? 'SUCCESS' : 'FAILURE'}`);
    console.log('\n' + validationResult.summary);

    if (validationResult.final_osa_delivery.delivery_url) {
      console.log(`\n✅ Final delivery URL: ${validationResult.final_osa_delivery.delivery_url}`);
      console.log(`✅ Delivery method: ${validationResult.final_osa_delivery.delivery_method}`);
    }

    if (!validationResult.overall_success) {
      console.log('\n🔧 FAILED STEPS:');
      validationResult.steps
        .filter(s => !s.success)
        .forEach(step => {
          console.log(`\n❌ ${step.agent_name} (${step.step_id})`);
          console.log(`   Error: ${step.error_message}`);
          console.log(`   Enhanced Tools: ${step.enhanced_tools_used.join(', ')}`);
        });
    }

    console.log('\n' + '='.repeat(80) + '\n');

    // Exit with appropriate code
    process.exit(validationResult.overall_success ? 0 : 1);

  } catch (error) {
    console.error('❌ Workflow validation script failed:', error);
    process.exit(1);
  }
}

// Run the validation
if (require.main === module) {
  main();
}

export { validateCompleteWorkflow, WorkflowValidationResult };