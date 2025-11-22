import { NextRequest, NextResponse } from 'next/server';
import { MockOpalIntegrationValidator, VALIDATION_TEST_SCENARIOS } from '@/lib/opal/integration-validator-mock';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { forceSyncWorkflowId, opalCorrelationId, tenantId } = body;

    if (!forceSyncWorkflowId || !opalCorrelationId) {
      return NextResponse.json(
        { error: 'Missing required parameters: forceSyncWorkflowId and opalCorrelationId' },
        { status: 400 }
      );
    }

    // Initialize mock validator
    const mockValidator = new MockOpalIntegrationValidator();

    // Determine which scenario to use based on workflow ID
    let scenarioKey = 'healthy_complete'; // default
    
    if (forceSyncWorkflowId.includes('partial_fail')) {
      scenarioKey = 'partial_agent_failure';
    } else if (forceSyncWorkflowId.includes('ingestion_fail')) {
      scenarioKey = 'osa_ingestion_issues';
    } else if (forceSyncWorkflowId.includes('results_fail')) {
      scenarioKey = 'results_generation_failure';
    } else if (forceSyncWorkflowId.includes('timeout')) {
      scenarioKey = 'timeout_scenario';
    } else if (forceSyncWorkflowId.includes('healthy')) {
      scenarioKey = 'healthy_complete';
    }

    console.log(`[Mock Validator] Running scenario: ${scenarioKey} for workflow: ${forceSyncWorkflowId}`);

    // Run mock validation
    const validationResult = await mockValidator.validateWorkflow({
      forceSyncWorkflowId,
      opalCorrelationId,
      tenantId
    } as any);

    // Add test metadata
    const response = {
      ...validationResult,
      test_mode: true,
      scenario_used: scenarioKey,
      mock_data: true,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[Mock Validator API] Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Mock validation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        test_mode: true,
        mock_data: true
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Return available test scenarios and mock validator status
    const mockValidator = new MockOpalIntegrationValidator();
    
    return NextResponse.json({
      status: 'operational',
      test_mode: true,
      available_scenarios: Object.keys(VALIDATION_TEST_SCENARIOS),
      scenario_details: Object.entries(VALIDATION_TEST_SCENARIOS).map(([key, scenario]) => ({
        id: key,
        name: scenario.name,
        description: scenario.description,
        expected_status: (scenario as any).expectedOutcome?.overall_status || scenario.expectedStatus
      })),
      mock_validator_initialized: true,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Mock Validator API] GET Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get mock validator status',
        details: error instanceof Error ? error.message : 'Unknown error',
        test_mode: true
      },
      { status: 500 }
    );
  }
}