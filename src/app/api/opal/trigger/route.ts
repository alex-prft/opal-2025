// API Route: Trigger Opal Workflow
// Handles workflow initiation from /engine form submission and manual triggers
// Provides immediate response with polling URL for progress tracking

import { NextRequest, NextResponse } from 'next/server';
import { opalWorkflowEngine } from '@/lib/opal/workflow-engine';
import { workflowDb } from '@/lib/database/workflow-operations';
import {
  TriggerWorkflowRequest,
  TriggerWorkflowResponse,
  OpalTriggerRequest
} from '@/lib/types/opal';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('🚀 [API] Opal workflow trigger request received');

    // Parse and validate request body
    const body: TriggerWorkflowRequest = await request.json();

    if (!body.formData) {
      return NextResponse.json({
        success: false,
        error: 'Missing form data in request body',
        message: 'Form data is required to trigger Opal workflow'
      }, { status: 400 });
    }

    // Validate required fields
    if (!body.formData.client_name) {
      return NextResponse.json({
        success: false,
        error: 'Missing required field: client_name',
        message: 'Client name is required to trigger Opal workflow'
      }, { status: 400 });
    }

    // Log performance metrics
    await workflowDb.logAPIPerformance({
      endpoint: '/api/opal/trigger',
      method: 'POST',
      responseTimeMs: Date.now() - startTime,
      statusCode: 200,
      payloadSizeBytes: JSON.stringify(body).length,
      dxpPlatform: 'opal',
      apiCallType: 'workflow_trigger'
    });

    console.log(`📋 [API] Triggering workflow for client: ${body.formData.client_name}`);

    // Convert form data to trigger request
    const triggerRequest: OpalTriggerRequest = {
      client_name: body.formData.client_name,
      industry: body.formData.industry,
      company_size: body.formData.company_size,
      current_capabilities: body.formData.current_capabilities,
      business_objectives: body.formData.business_objectives,
      additional_marketing_technology: body.formData.additional_marketing_technology,
      timeline_preference: body.formData.timeline_preference,
      budget_range: body.formData.budget_range,
      recipients: body.formData.recipients,
      triggered_by: 'form_submission',
      force_sync: false
    };

    // Trigger workflow execution
    const workflowResponse = await opalWorkflowEngine.triggerWorkflow(triggerRequest);

    const response: TriggerWorkflowResponse = {
      success: true,
      workflow_id: workflowResponse.workflow_id,
      session_id: workflowResponse.session_id,
      message: `Opal workflow triggered successfully for ${body.formData.client_name}`,
      polling_url: workflowResponse.polling_url
    };

    const totalDuration = Date.now() - startTime;
    console.log(`✅ [API] Workflow trigger completed (${totalDuration}ms)`);

    return NextResponse.json(response);

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    console.error('❌ [API] Workflow trigger failed:', error);

    // Log error performance
    await workflowDb.logAPIPerformance({
      endpoint: '/api/opal/trigger',
      method: 'POST',
      responseTimeMs: duration,
      statusCode: 500,
      dxpPlatform: 'opal',
      apiCallType: 'workflow_trigger',
      errorMessage
    });

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: `Failed to trigger Opal workflow: ${errorMessage}`
    }, { status: 500 });
  }
}

export async function GET() {
  // Return API information for health checks
  return NextResponse.json({
    endpoint: '/api/opal/trigger',
    method: 'POST',
    description: 'Triggers Opal workflow execution for DXP analysis',
    usage: 'Submit form data from /engine to initiate personalization analysis',
    required_fields: ['client_name'],
    response: {
      success: true,
      workflow_id: 'uuid',
      session_id: 'uuid',
      polling_url: '/api/opal/status/{session_id}'
    }
  });
}