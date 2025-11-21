// src/tools/osa_send_data_to_osa_webhook.ts
import { tool, ParameterType } from "@optimizely-opal/opal-tools-sdk";

interface SendToOsaWebhookParams {
  agent_name: string;
  execution_results: Record<string, any>;
  workflow_id: string;
  metadata: {
    execution_status?: string;
    execution_time_ms?: number;
    timestamp?: string;
    success?: boolean;
  };
  webhook_endpoint?: string;
}

interface OsaWebhookResponse {
  success: boolean;
  message: string;
  tool_name: string;
  workflow_id: string;
  agent_name: string;
  execution_status: string;
  enhanced_tool_response?: any;
  correlation_id: string;
  processing_time_ms: number;
  timestamp: string;
}

/**
 * Maps OPAL execution status values to Enhanced Tools expected values
 */
function mapOpalStatusToEnhanced(opalStatus?: string): string {
  const statusMap: Record<string, string> = {
    'completed': 'success',
    'failed': 'failure',
    'in_progress': 'pending',
    'partial': 'pending',
    'timeout': 'timeout'
  };

  return statusMap[opalStatus || ''] || 'success';
}

async function osaSendDataToOsaWebhook(
  params: SendToOsaWebhookParams
): Promise<OsaWebhookResponse> {
  const startTime = Date.now();

  const {
    agent_name,
    execution_results,
    workflow_id,
    metadata,
    webhook_endpoint = 'webhooks/opal-workflow'
  } = params;

  // Generate correlation ID for distributed tracing
  const correlationId = `opal-webhook-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  if (!workflow_id || !agent_name) {
    throw new Error("Missing required parameters: workflow_id and agent_name are required");
  }

  let parsedExecutionResults: any;
  try {
    // If execution_results is already an object, use it as-is
    if (typeof execution_results === 'object' && execution_results !== null) {
      parsedExecutionResults = execution_results;
    } else if (typeof execution_results === 'string') {
      // If it's a string, try to parse it as JSON
      parsedExecutionResults = JSON.parse(execution_results);
    } else {
      parsedExecutionResults = execution_results;
    }
  } catch (error) {
    throw new Error(
      `Invalid execution_results format: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  console.log('🚀 [OPAL Webhook Tool] Processing webhook request', {
    correlationId,
    agent_name,
    workflow_id,
    execution_status: metadata.execution_status
  });

  try {
    // Transform OPAL parameters to enhanced tool format
    const enhancedToolRequest = {
      tool_name: 'send_data_to_osa_enhanced' as const,
      parameters: {
        workflow_id: workflow_id,
        agent_id: agent_name,
        execution_status: mapOpalStatusToEnhanced(metadata.execution_status),
        agent_data: parsedExecutionResults,
        target_environment: process.env.NODE_ENV || 'development',
        metadata: {
          ...metadata,
          source: 'opal_chat_interface',
          webhook_endpoint: webhook_endpoint,
          correlation_id: correlationId,
          original_timestamp: metadata.timestamp || new Date().toISOString()
        }
      }
    };

    console.log('🔄 [OPAL Webhook Tool] Calling enhanced tools API', {
      correlationId,
      transformed_agent_id: enhancedToolRequest.parameters.agent_id,
      transformed_execution_status: enhancedToolRequest.parameters.execution_status
    });

    // Determine the base URL for the API call
    const baseUrl = process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://opal-2025.vercel.app');

    const enhancedToolsUrl = `${baseUrl}/api/opal/enhanced-tools`;

    const response = await fetch(enhancedToolsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'OPAL-Chat-Webhook/1.0',
        'X-Correlation-ID': correlationId,
        'X-Source': 'opal-tools',
      },
      body: JSON.stringify(enhancedToolRequest),
    });

    let responseData: any;
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      try {
        responseData = await response.json();
      } catch {
        responseData = { raw_response: await response.text() };
      }
    } else {
      responseData = { raw_response: await response.text() };
    }

    const processingTime = Date.now() - startTime;

    if (!response.ok) {
      console.error('❌ [OPAL Webhook Tool] Enhanced tools request failed', {
        correlationId,
        status: response.status,
        response: responseData
      });

      return {
        success: false,
        message: `Enhanced tools execution failed: ${response.status} ${response.statusText}`,
        tool_name: 'osa_send_data_to_osa_webhook',
        workflow_id,
        agent_name,
        execution_status: metadata.execution_status || 'failed',
        enhanced_tool_response: responseData,
        correlation_id: correlationId,
        processing_time_ms: processingTime,
        timestamp: new Date().toISOString()
      };
    }

    console.log('✅ [OPAL Webhook Tool] Successfully processed webhook request', {
      correlationId,
      workflow_id,
      agent_name,
      processing_time_ms: processingTime
    });

    return {
      success: true,
      message: 'OPAL webhook data successfully sent to OSA',
      tool_name: 'osa_send_data_to_osa_webhook',
      workflow_id,
      agent_name,
      execution_status: metadata.execution_status || 'completed',
      enhanced_tool_response: responseData,
      correlation_id: correlationId,
      processing_time_ms: processingTime,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;

    console.error('❌ [OPAL Webhook Tool] Unexpected error:', {
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
      processing_time_ms: processingTime
    });

    return {
      success: false,
      message: 'Unexpected error processing OPAL webhook request',
      tool_name: 'osa_send_data_to_osa_webhook',
      workflow_id,
      agent_name,
      execution_status: 'failed',
      enhanced_tool_response: {
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      correlation_id: correlationId,
      processing_time_ms: processingTime,
      timestamp: new Date().toISOString()
    };
  }
}

// Register tool with OPAL SDK
tool({
  name: "osa_send_data_to_osa_webhook",
  description: "Send agent data and results to OSA application via webhook for real-time updates. Bridges OPAL chat interface calls to enhanced tools infrastructure.",
  parameters: [
    {
      name: "agent_name",
      type: ParameterType.String,
      description: "Name of the agent sending data (matches OSA endpoint schema)",
      required: true,
    },
    {
      name: "execution_results",
      type: ParameterType.Dictionary,
      description: "Agent execution results and insights as JSON object or valid JSON string",
      required: true,
    },
    {
      name: "workflow_id",
      type: ParameterType.String,
      description: "Unique workflow execution identifier for correlation tracking",
      required: true,
    },
    {
      name: "metadata",
      type: ParameterType.Dictionary,
      description: "Agent execution metadata including execution_status, timestamps, and quality metrics",
      required: true,
    },
    {
      name: "webhook_endpoint",
      type: ParameterType.String,
      description: "OSA webhook endpoint path (default: 'webhooks/opal-workflow')",
      required: false,
    },
  ],
})(osaSendDataToOsaWebhook);