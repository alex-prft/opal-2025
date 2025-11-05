import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { OPALAgentClient } from '@/lib/integrations/opal-agent-client';
import { PMGWorkflowInput } from '@/lib/types/maturity';

interface OpalWebhookPayload {
  event_type: 'workflow.completed' | 'workflow.failed' | 'workflow.triggered' | 'data.updated';
  workflow_id: string;
  workflow_name: string;
  timestamp: string;
  data?: {
    audience_data?: any;
    experiment_data?: any;
    content_data?: any;
    personalization_data?: any;
    campaign_data?: any;
  };
  trigger_source?: 'schedule' | 'api' | 'event' | 'manual';
  metadata?: {
    client_id?: string;
    project_id?: string;
    environment?: string;
    user_id?: string;
  };
}

interface OpalWorkflowTriggerRequest {
  workflow_name: string;
  input_data: PMGWorkflowInput;
  trigger_source?: string;
  metadata?: {
    client_id?: string;
    project_id?: string;
    user_id?: string;
  };
}

// Webhook secret for signature validation
const WEBHOOK_SECRET = process.env.OPAL_WEBHOOK_SECRET || 'opal-webhook-secret-2025';

function validateWebhookSignature(payload: string, signature: string): boolean {
  if (!signature) return false;

  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  const receivedSignature = signature.replace('sha256=', '');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(receivedSignature, 'hex')
  );
}

// POST: Receive webhook from Optimizely Opal
export async function POST(request: NextRequest) {
  try {
    console.log('Opal Workflow webhook received');

    const body = await request.text();
    const signature = request.headers.get('x-opal-signature') || request.headers.get('x-hub-signature-256') || '';

    // Validate webhook signature
    if (!validateWebhookSignature(body, signature)) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    let payload: OpalWebhookPayload;
    try {
      payload = JSON.parse(body);
    } catch (error) {
      console.error('Invalid JSON payload:', error);
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    console.log('Opal webhook payload:', {
      event_type: payload.event_type,
      workflow_id: payload.workflow_id,
      workflow_name: payload.workflow_name,
      trigger_source: payload.trigger_source
    });

    // Initialize Opal Agent Client
    const opalClient = new OPALAgentClient();

    // Process different event types
    switch (payload.event_type) {
      case 'workflow.completed':
        await handleWorkflowCompleted(payload, opalClient);
        break;

      case 'workflow.failed':
        await handleWorkflowFailed(payload, opalClient);
        break;

      case 'workflow.triggered':
        await handleWorkflowTriggered(payload, opalClient);
        break;

      case 'data.updated':
        await handleDataUpdated(payload, opalClient);
        break;

      default:
        console.log(`Unhandled event type: ${payload.event_type}`);
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${payload.event_type} event`,
      workflow_id: payload.workflow_id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Opal Workflow webhook error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT: Trigger Opal workflow from the engine
export async function PUT(request: NextRequest) {
  try {
    console.log('Triggering Opal Workflow from engine');

    const triggerRequest: OpalWorkflowTriggerRequest = await request.json();

    // Validate required fields
    if (!triggerRequest.workflow_name || !triggerRequest.input_data) {
      return NextResponse.json(
        { error: 'Missing required fields: workflow_name, input_data' },
        { status: 400 }
      );
    }

    // Initialize Opal Agent Client
    const opalClient = new OPALAgentClient();

    // Trigger the workflow
    const workflowResult = await triggerOpalWorkflow(triggerRequest, opalClient);

    console.log('Opal Workflow triggered successfully:', {
      workflow_name: triggerRequest.workflow_name,
      workflow_id: workflowResult.workflow_id
    });

    return NextResponse.json({
      success: true,
      message: 'Opal Workflow triggered successfully',
      workflow_id: workflowResult.workflow_id,
      workflow_name: triggerRequest.workflow_name,
      trigger_source: triggerRequest.trigger_source || 'api',
      timestamp: new Date().toISOString(),
      data: workflowResult
    });

  } catch (error) {
    console.error('Opal Workflow trigger error:', error);
    return NextResponse.json(
      {
        error: 'Failed to trigger Opal Workflow',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function handleWorkflowCompleted(payload: OpalWebhookPayload, opalClient: OPALAgentClient) {
  console.log(`Workflow completed: ${payload.workflow_name} (${payload.workflow_id})`);

  try {
    // Store workflow results in our system
    if (payload.data) {
      // Save to session storage or database
      const workflowData = {
        workflow_id: payload.workflow_id,
        workflow_name: payload.workflow_name,
        completed_at: payload.timestamp,
        data: payload.data,
        metadata: payload.metadata
      };

      // In a production system, you would save this to a database
      // For now, we'll log it and potentially trigger notifications
      console.log('Storing workflow results:', workflowData);

      // Send notification about completion
      if (payload.metadata?.client_id) {
        await opalClient.sendNotification({
          to: ['workflow-notifications@ifpa.org'],
          plan_title: `Opal Workflow Completed: ${payload.workflow_name}`,
          cmp_url: '#',
          plan_summary: `The workflow "${payload.workflow_name}" has completed successfully.`,
          sender_name: 'Opal System'
        });
      }
    }
  } catch (error) {
    console.error('Error handling workflow completion:', error);
  }
}

async function handleWorkflowFailed(payload: OpalWebhookPayload, opalClient: OPALAgentClient) {
  console.error(`Workflow failed: ${payload.workflow_name} (${payload.workflow_id})`);

  try {
    // Log failure details
    const failureData = {
      workflow_id: payload.workflow_id,
      workflow_name: payload.workflow_name,
      failed_at: payload.timestamp,
      error_data: payload.data,
      metadata: payload.metadata
    };

    console.error('Workflow failure details:', failureData);

    // Send failure notification
    if (payload.metadata?.client_id) {
      await opalClient.sendNotification({
        to: ['workflow-alerts@ifpa.org'],
        plan_title: `Opal Workflow Failed: ${payload.workflow_name}`,
        cmp_url: '#',
        plan_summary: `The workflow "${payload.workflow_name}" has failed. Please check the logs for details.`,
        sender_name: 'Opal System'
      });
    }
  } catch (error) {
    console.error('Error handling workflow failure:', error);
  }
}

async function handleWorkflowTriggered(payload: OpalWebhookPayload, opalClient: OPALAgentClient) {
  console.log(`Workflow triggered: ${payload.workflow_name} (${payload.workflow_id})`);

  try {
    // Log trigger event
    const triggerData = {
      workflow_id: payload.workflow_id,
      workflow_name: payload.workflow_name,
      triggered_at: payload.timestamp,
      trigger_source: payload.trigger_source,
      metadata: payload.metadata
    };

    console.log('Workflow trigger event:', triggerData);

    // Optionally pull initial data or set up monitoring
    if (payload.trigger_source === 'schedule') {
      // Handle scheduled workflow triggers
      console.log('Scheduled workflow triggered, setting up monitoring...');
    }
  } catch (error) {
    console.error('Error handling workflow trigger:', error);
  }
}

async function handleDataUpdated(payload: OpalWebhookPayload, opalClient: OPALAgentClient) {
  console.log(`Data updated for workflow: ${payload.workflow_name}`);

  try {
    // Handle data updates from Opal
    if (payload.data) {
      // Update our local data stores or trigger re-analysis
      console.log('Processing data updates:', {
        workflow_id: payload.workflow_id,
        data_keys: Object.keys(payload.data),
        timestamp: payload.timestamp
      });

      // If audience data was updated, refresh our audience insights
      if (payload.data.audience_data) {
        console.log('Refreshing audience insights...');
        // Trigger audience data refresh in our system
      }

      // If experiment data was updated, refresh our experiment recommendations
      if (payload.data.experiment_data) {
        console.log('Refreshing experiment recommendations...');
        // Trigger experiment data refresh in our system
      }

      // If personalization data was updated, refresh our personalization insights
      if (payload.data.personalization_data) {
        console.log('Refreshing personalization insights...');
        // Trigger personalization data refresh in our system
      }
    }
  } catch (error) {
    console.error('Error handling data update:', error);
  }
}

async function triggerOpalWorkflow(
  triggerRequest: OpalWorkflowTriggerRequest,
  opalClient: OPALAgentClient
): Promise<any> {
  try {
    // Prepare workflow payload
    const workflowPayload = {
      workflow_name: triggerRequest.workflow_name,
      input_data: triggerRequest.input_data,
      trigger_source: triggerRequest.trigger_source || 'api',
      metadata: {
        ...triggerRequest.metadata,
        triggered_at: new Date().toISOString(),
        engine_version: '1.0.0'
      }
    };

    // In a real implementation, this would call the Opal API to trigger the workflow
    // For now, we'll simulate the workflow trigger
    const workflowId = `opal-wf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.log('Triggering Opal Workflow:', {
      workflow_id: workflowId,
      workflow_name: triggerRequest.workflow_name,
      input_data_keys: Object.keys(triggerRequest.input_data)
    });

    // Return workflow trigger result
    return {
      workflow_id: workflowId,
      status: 'triggered',
      message: 'Workflow triggered successfully',
      estimated_completion: new Date(Date.now() + 300000).toISOString(), // 5 minutes
      webhook_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/opal-workflow`
    };

  } catch (error) {
    console.error('Error triggering Opal Workflow:', error);
    throw new Error(`Failed to trigger workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// GET: Get webhook status and configuration
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workflow_id = searchParams.get('workflow_id');

    if (workflow_id) {
      // Return status for specific workflow
      return NextResponse.json({
        workflow_id,
        status: 'active',
        webhook_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/opal-workflow`,
        supported_events: [
          'workflow.completed',
          'workflow.failed',
          'workflow.triggered',
          'data.updated'
        ],
        last_ping: new Date().toISOString()
      });
    }

    // Return general webhook configuration
    return NextResponse.json({
      webhook_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/opal-workflow`,
      supported_events: [
        'workflow.completed',
        'workflow.failed',
        'workflow.triggered',
        'data.updated'
      ],
      authentication: {
        method: 'signature',
        header: 'x-opal-signature',
        algorithm: 'sha256'
      },
      status: 'active',
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Webhook status error:', error);
    return NextResponse.json(
      { error: 'Failed to get webhook status' },
      { status: 500 }
    );
  }
}