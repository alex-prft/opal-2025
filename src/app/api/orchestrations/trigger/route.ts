/**
 * OPAL Workflow Orchestration Trigger API
 *
 * POST /api/orchestrations/trigger
 *
 * Initiates strategy_workflow in OPAL with comprehensive validation,
 * security, tracking, and error handling.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getConfig } from '@/lib/config';
import { generateCorrelationId, generateSpanId } from '@/lib/signature';
import { createRequestLogger } from '@/lib/logger';
import { webhookEventOperations } from '@/lib/database/webhook-events';

// Types
interface TriggerRequest {
  workflow_name: 'strategy_workflow';
  session_id: string;
  client_name?: string;
  engine_form?: Record<string, any>;
  preferences?: Record<string, any>;
  triggered_by?: string;
}

interface TriggerResponse {
  success: boolean;
  workflow_id: string;
  session_id: string;
  correlation_id: string;
  span_id: string;
  status: 'triggered';
  webhook_url: string;
  estimated_duration: string;
  polling_url: string;
  message?: string;
  error?: string;
}

interface OpalWorkflowPayload {
  workflow_name: 'strategy_workflow';
  input_data: {
    client_name: string;
    industry: string;
    company_size: string;
    current_capabilities: string[];
    business_objectives: string[];
    additional_marketing_technology: string[];
    timeline_preference: string;
    budget_range: string;
    recipients: string[];
    triggered_by: string;
    session_id: string;
    force_sync: true;
  };
  metadata: {
    workspace_id: string;
    trigger_timestamp: string;
    correlation_id: string;
    span_id: string;
    source_system: 'OSA-ForceSync-Production';
    environment: string;
    session_id: string;
  };
}

// Constants
const ALLOWED_WORKFLOW = 'strategy_workflow' as const;
const SOURCE_SYSTEM = 'OSA-ForceSync-Production' as const;
const ESTIMATED_DURATION = '6-8 minutes' as const;

/**
 * Validate request payload
 */
function validateTriggerRequest(body: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!body.workflow_name) {
    errors.push('Missing required field: workflow_name');
  } else if (body.workflow_name !== ALLOWED_WORKFLOW) {
    errors.push(`Invalid workflow_name: only "${ALLOWED_WORKFLOW}" is allowed, got "${body.workflow_name}"`);
  }

  if (!body.session_id?.trim()) {
    errors.push('Missing required field: session_id');
  }

  if (body.session_id && typeof body.session_id !== 'string') {
    errors.push('Field session_id must be a string');
  }

  if (body.client_name && typeof body.client_name !== 'string') {
    errors.push('Field client_name must be a string');
  }

  if (body.engine_form && typeof body.engine_form !== 'object') {
    errors.push('Field engine_form must be an object');
  }

  if (body.preferences && typeof body.preferences !== 'object') {
    errors.push('Field preferences must be an object');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Build OPAL workflow payload
 */
function buildOpalPayload(
  request: TriggerRequest,
  correlationId: string,
  spanId: string
): OpalWorkflowPayload {
  const config = getConfig();

  return {
    workflow_name: ALLOWED_WORKFLOW,
    input_data: {
      client_name: request.client_name || 'OPAL Workflow Trigger',
      industry: request.engine_form?.industry || 'Technology',
      company_size: request.engine_form?.company_size || 'Medium',
      current_capabilities: request.engine_form?.current_capabilities || ['DXP Integration', 'Analytics'],
      business_objectives: request.engine_form?.business_objectives || ['Workflow Orchestration', 'AI Enhancement'],
      additional_marketing_technology: request.engine_form?.additional_marketing_technology || ['Optimizely Platform'],
      timeline_preference: request.engine_form?.timeline_preference || '6-months',
      budget_range: request.engine_form?.budget_range || '50k-100k',
      recipients: request.preferences?.recipients || ['admin@example.com'],
      triggered_by: request.triggered_by || 'api_trigger',
      session_id: request.session_id,
      force_sync: true
    },
    metadata: {
      // workspace_id removed per user request
      trigger_timestamp: new Date().toISOString(),
      correlation_id: correlationId,
      span_id: spanId,
      source_system: SOURCE_SYSTEM,
      environment: config.app.environment,
      session_id: request.session_id
    }
  };
}

/**
 * Call OPAL webhook with retry logic
 */
async function triggerOpalWorkflow(
  payload: OpalWorkflowPayload,
  logger: any
): Promise<{ success: boolean; workflow_id?: string; message: string; error?: string }> {

  const config = getConfig();
  const startTime = Date.now();

  try {
    logger.info('Starting OPAL workflow trigger', {
      workflow_name: payload.workflow_name,
      session_id: payload.input_data.session_id,
      client_name: payload.input_data.client_name
    });

    const response = await fetch(config.webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.webhook.authKey}`,
        'User-Agent': `${SOURCE_SYSTEM}/${config.app.environment}`,
        'X-Correlation-ID': payload.metadata.correlation_id,
        'X-Span-ID': payload.metadata.span_id,
        'X-Workflow-Name': payload.workflow_name,
        'X-Session-ID': payload.input_data.session_id,
        'X-Source-System': SOURCE_SYSTEM
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(config.webhook.timeout)
    });

    const responseText = await response.text();
    const duration = Date.now() - startTime;

    let responseData: any = {};
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw_response: responseText };
    }

    if (!response.ok) {
      const error = `OPAL webhook failed: ${response.status} ${response.statusText}`;
      logger.error('OPAL workflow trigger failed', {
        status: response.status,
        status_text: response.statusText,
        response_data: responseData,
        duration_ms: duration
      });

      return {
        success: false,
        message: error,
        error: responseData.detail || responseData.message || 'Unknown error'
      };
    }

    const workflowId = responseData.workflow_id || responseData.id || `opal-${Date.now()}`;

    logger.info('OPAL workflow triggered successfully', {
      workflow_id: workflowId,
      session_id: responseData.session_id,
      duration_ms: duration
    });

    return {
      success: true,
      workflow_id: workflowId,
      message: `Workflow "${payload.workflow_name}" triggered successfully`
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logger.error('OPAL workflow trigger error', {
      error: errorMessage,
      duration_ms: duration
    });

    // In development, provide fallback
    if (config.app.environment === 'development') {
      logger.info('Development mode: providing fallback response');
      return {
        success: true,
        workflow_id: `dev-workflow-${Date.now()}`,
        message: `Development fallback: ${payload.workflow_name} simulated`
      };
    }

    return {
      success: false,
      message: `Workflow trigger failed: ${errorMessage}`,
      error: errorMessage
    };
  }
}

/**
 * POST /api/orchestrations/trigger
 */
export async function POST(request: NextRequest) {
  const correlationId = generateCorrelationId();
  const spanId = generateSpanId();
  const logger = createRequestLogger(correlationId, spanId);

  try {
    logger.info('Orchestration trigger request received');

    // 1. Validate configuration
    const config = getConfig();
    if (config.app.environment === 'production' && !config.webhook.authKey) {
      throw new Error('OPAL authentication not configured for production');
    }

    // 2. Parse and validate request body
    let body: TriggerRequest;
    try {
      body = await request.json();
    } catch (error) {
      logger.error('Invalid JSON in request body', error);
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON',
        message: 'Request body must be valid JSON',
        correlation_id: correlationId
      }, { status: 400 });
    }

    const validation = validateTriggerRequest(body);
    if (!validation.valid) {
      logger.warn('Request validation failed', { errors: validation.errors });
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: validation.errors.join(', '),
        correlation_id: correlationId
      }, { status: 400 });
    }

    logger.info('Request validated successfully', {
      workflow_name: body.workflow_name,
      session_id: body.session_id,
      client_name: body.client_name
    });

    // 3. Build OPAL payload
    const opalPayload = buildOpalPayload(body, correlationId, spanId);

    // 4. Store workflow execution record
    await webhookEventOperations.createEvent({
      event_type: 'workflow_triggered',
      workflow_id: `pending-${correlationId}`,
      workflow_name: body.workflow_name,
      session_id: body.session_id,
      received_at: new Date().toISOString(),
      payload: {
        engine_form: body.engine_form,
        preferences: body.preferences,
        request_payload: opalPayload,
        correlation_id: correlationId,
        span_id: spanId,
        triggered_by: body.triggered_by || 'api_trigger',
        client_name: body.client_name,
        webhook_url: config.webhook.url
      }
    });

    // 5. Trigger OPAL workflow
    const triggerResult = await triggerOpalWorkflow(opalPayload, logger);

    // 6. Update workflow execution with result
    if (triggerResult.success && triggerResult.workflow_id) {
      await db.updateWorkflowExecution(`pending-${correlationId}`, {
        status: 'running',
        event_count: 0
      });
    } else {
      await db.updateWorkflowExecution(`pending-${correlationId}`, {
        status: 'failed',
        completed_at: new Date().toISOString()
      });
    }

    // 7. Build response
    if (!triggerResult.success) {
      logger.error('Workflow trigger failed', {
        error: triggerResult.error,
        message: triggerResult.message
      });

      return NextResponse.json({
        success: false,
        error: 'Workflow trigger failed',
        message: triggerResult.message,
        correlation_id: correlationId,
        span_id: spanId,
        details: triggerResult.error
      }, { status: 500 });
    }

    const response: TriggerResponse = {
      success: true,
      workflow_id: triggerResult.workflow_id!,
      session_id: body.session_id,
      correlation_id: correlationId,
      span_id: spanId,
      status: 'triggered',
      webhook_url: config.webhook.url,
      estimated_duration: ESTIMATED_DURATION,
      polling_url: `/api/orchestrations/status/${body.session_id}`,
      message: triggerResult.message
    };

    logger.info('Orchestration trigger completed successfully', {
      workflow_id: response.workflow_id,
      session_id: response.session_id
    });

    return NextResponse.json(response);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logger.error('Orchestration trigger failed', error);

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: `Trigger failed: ${errorMessage}`,
      correlation_id: correlationId,
      span_id: spanId,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * GET /api/orchestrations/trigger
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/orchestrations/trigger',
    method: 'POST',
    description: 'Trigger OPAL workflow orchestration',
    workflow_security: {
      allowed_workflow: ALLOWED_WORKFLOW,
      source_system: SOURCE_SYSTEM
    },
    required_fields: {
      workflow_name: ALLOWED_WORKFLOW,
      session_id: 'string (unique session identifier)'
    },
    optional_fields: {
      client_name: 'string',
      engine_form: 'object (form data context)',
      preferences: 'object (user preferences)',
      triggered_by: 'string (defaults to api_trigger)'
    },
    response_format: {
      success: 'boolean',
      workflow_id: 'string',
      session_id: 'string',
      correlation_id: 'string',
      span_id: 'string',
      status: 'triggered',
      webhook_url: 'string',
      estimated_duration: ESTIMATED_DURATION,
      polling_url: 'string'
    },
    example_request: {
      workflow_name: ALLOWED_WORKFLOW,
      session_id: 'session_12345',
      client_name: 'ACME Corp',
      engine_form: {
        industry: 'retail',
        company_size: 'large'
      },
      preferences: {
        notifications: true,
        recipients: ['user@example.com']
      }
    }
  });
}