/**
 * OPAL Enhanced Tools API Endpoint
 * Production-grade OPAL tool discovery and execution with comprehensive error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { loadOpalConfig, getEnvironmentConfig } from '@/lib/config/opal-env';
import { generateWebhookSignature } from '@/lib/security/hmac';
import { parseEnhancedToolRequest, generateDedupHash, ToolDiscovery, EnhancedToolExecute } from '@/lib/schemas/opal-schemas';
import { z } from 'zod';

// Retry configuration
interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableStatuses: number[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504]
};

/**
 * GET /api/opal/enhanced-tools - Tool Discovery
 * Returns the tools available for OPAL agents to discover and execute
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('🔍 [Enhanced Tools] Discovery request received');

    const config = loadOpalConfig();
    const envConfig = getEnvironmentConfig();

    const toolDiscovery: ToolDiscovery = {
      tools: [
        {
          name: 'send_data_to_osa_enhanced',
          description: 'Send OPAL agent execution data to OSA with enhanced processing capabilities',
          version: '2.0.0',
          parameters: {
            type: 'object',
            properties: {
              workflow_id: {
                type: 'string',
                description: 'Unique identifier for the workflow instance',
                required: true
              },
              agent_id: {
                type: 'string',
                description: 'Unique identifier for the OPAL agent',
                required: true
              },
              agent_data: {
                type: 'object',
                description: 'Agent execution data and results',
                required: false
              },
              execution_status: {
                type: 'string',
                description: 'Status of agent execution: success, failure, pending, timeout',
                required: true
              },
              target_environment: {
                type: 'string',
                description: 'Target environment for data routing: development, staging, production',
                required: false
              },
              offset: {
                type: 'number',
                description: 'Optional sequence offset for ordered processing',
                required: false
              },
              metadata: {
                type: 'object',
                description: 'Additional metadata for the execution context',
                required: false
              }
            },
            required: ['workflow_id', 'agent_id', 'execution_status']
          },
          webhook_target_url: config.osaSelfWebhookUrl,
          required_headers: {
            'Content-Type': 'application/json',
            'X-OSA-Signature': 'HMAC-SHA256 signature with timestamp',
            'User-Agent': 'OPAL-Agent/2.0'
          }
        }
      ],
      base_url: envConfig.baseUrl,
      version: '2.0.0',
      updated_at: new Date().toISOString()
    };

    console.log('✅ [Enhanced Tools] Discovery response generated', {
      tools_count: toolDiscovery.tools.length,
      base_url: toolDiscovery.base_url,
      webhook_target: config.osaSelfWebhookUrl
    });

    return NextResponse.json(toolDiscovery, {
      headers: {
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('❌ [Enhanced Tools] Discovery failed:', error);

    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to generate tool discovery response',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * POST /api/opal/enhanced-tools - Tool Execution
 * Executes the specified OPAL tool with validation and forwarding to webhook
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const correlationId = `enhanced-tools-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  try {
    console.log('🚀 [Enhanced Tools] Execution request received', { correlationId });

    // Parse and validate request body
    const body = await request.json();
    const toolRequest = parseEnhancedToolRequest(body);

    console.log('📋 [Enhanced Tools] Request validated', {
      correlationId,
      tool_name: toolRequest.tool_name,
      workflow_id: toolRequest.parameters.workflow_id,
      agent_id: toolRequest.parameters.agent_id,
      target_environment: toolRequest.parameters.target_environment
    });

    // Load configuration
    const config = loadOpalConfig();
    const envConfig = getEnvironmentConfig(toolRequest.parameters.target_environment);

    // Execute tool with retry logic
    const result = await executeToolWithRetry(toolRequest, config, envConfig, correlationId);

    console.log('✅ [Enhanced Tools] Execution completed', {
      correlationId,
      success: result.success,
      duration_ms: result.duration_ms
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ [Enhanced Tools] Execution failed:', {
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        message: 'Invalid request payload',
        details: error.errors,
        correlation_id: correlationId
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Tool execution failed',
      correlation_id: correlationId
    }, { status: 500 });
  }
}

/**
 * Execute tool with retry logic and exponential backoff
 */
async function executeToolWithRetry(
  toolRequest: EnhancedToolExecute,
  config: any,
  envConfig: any,
  correlationId: string,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<any> {
  const { maxRetries, baseDelayMs, maxDelayMs, backoffMultiplier, retryableStatuses } = retryConfig;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const attemptId = `${correlationId}-attempt-${attempt}`;

    try {
      console.log(`🔄 [Enhanced Tools] Attempt ${attempt}/${maxRetries}`, { attemptId });

      const result = await executeTool(toolRequest, config, envConfig, attemptId);

      console.log(`✅ [Enhanced Tools] Attempt ${attempt} succeeded`, { attemptId });
      return result;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      console.warn(`⚠️ [Enhanced Tools] Attempt ${attempt} failed:`, {
        attemptId,
        error: lastError.message,
        status: (error as any).status
      });

      // Don't retry on non-retryable errors
      const errorStatus = (error as any).status;
      const isRetryable = errorStatus ? retryableStatuses.includes(errorStatus) : true;
      const shouldRetry = attempt < maxRetries && isRetryable;

      if (!shouldRetry) {
        if (!isRetryable) {
          console.log(`🚫 [Enhanced Tools] Non-retryable error (status: ${errorStatus})`);
        }
        break;
      }

      // Exponential backoff with jitter
      const delay = Math.min(
        baseDelayMs * Math.pow(backoffMultiplier, attempt - 1) + Math.random() * 1000,
        maxDelayMs
      );

      console.log(`⏱️ [Enhanced Tools] Waiting ${delay.toFixed(0)}ms before retry ${attempt + 1}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('All retry attempts failed');
}

/**
 * Execute the actual tool operation
 */
async function executeTool(
  toolRequest: EnhancedToolExecute,
  config: any,
  envConfig: any,
  attemptId: string
): Promise<any> {
  const startTime = Date.now();

  // Build webhook payload
  const webhookPayload = {
    workflow_id: toolRequest.parameters.workflow_id,
    agent_id: toolRequest.parameters.agent_id,
    agent_data: toolRequest.parameters.agent_data || {},
    execution_status: toolRequest.parameters.execution_status,
    offset: toolRequest.parameters.offset || null,
    timestamp: new Date().toISOString(),
    metadata: {
      ...toolRequest.parameters.metadata,
      source: 'opal_enhanced_tools',
      attempt_id: attemptId,
      target_environment: toolRequest.parameters.target_environment
    }
  };

  const payloadJson = JSON.stringify(webhookPayload);
  const payloadBuffer = Buffer.from(payloadJson, 'utf8');

  // Generate HMAC signature
  const signature = generateWebhookSignature(payloadBuffer, config.osaWebhookSecret);

  console.log('📤 [Enhanced Tools] Sending webhook request:', {
    attempt_id: attemptId,
    webhook_url: config.osaSelfWebhookUrl,
    payload_size_bytes: payloadBuffer.length,
    workflow_id: webhookPayload.workflow_id,
    agent_id: webhookPayload.agent_id
  });

  // Make webhook call
  const response = await fetch(config.osaSelfWebhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-OSA-Signature': signature,
      'User-Agent': 'OPAL-Enhanced-Tools/2.0',
      'X-Correlation-ID': attemptId
    },
    body: payloadJson,
    signal: AbortSignal.timeout(envConfig.timeout)
  });

  const responseText = await response.text();
  const duration = Date.now() - startTime;

  console.log('📥 [Enhanced Tools] Webhook response:', {
    attempt_id: attemptId,
    status: response.status,
    status_text: response.statusText,
    duration_ms: duration,
    response_size: responseText.length
  });

  if (!response.ok) {
    const error = new Error(`Webhook request failed: ${response.status} ${response.statusText}`);
    (error as any).status = response.status;
    (error as any).response = responseText;
    throw error;
  }

  // Parse response if JSON
  let responseData: any = responseText;
  try {
    responseData = JSON.parse(responseText);
  } catch {
    // Keep as text if not valid JSON
  }

  return {
    success: true,
    message: 'Tool executed successfully',
    tool_name: toolRequest.tool_name,
    workflow_id: toolRequest.parameters.workflow_id,
    agent_id: toolRequest.parameters.agent_id,
    execution_status: toolRequest.parameters.execution_status,
    webhook_response: {
      status: response.status,
      data: responseData
    },
    duration_ms: duration,
    attempt_id: attemptId,
    timestamp: new Date().toISOString()
  };
}