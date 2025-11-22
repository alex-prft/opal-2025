/**
 * OPAL Enhanced Tools API Endpoint
 * Production-grade OPAL tool discovery and execution with comprehensive error handling
 *
 * ============================================================================
 * CRITICAL: Tool Schema Requirements for TypeScript Validation
 * ============================================================================
 *
 * This endpoint defines tool schemas that MUST include comprehensive description
 * fields for every parameter to prevent TypeScript compilation failures.
 *
 * DEPLOYMENT CRITICAL: Missing description fields cause 1,000+ cascade TypeScript
 * errors that block production builds. PR #26 resolved these by adding proper
 * schema descriptions and configuring TypeScript build optimization.
 *
 * REQUIRED SCHEMA PATTERN:
 * {
 *   name: 'tool_name',
 *   description: 'Comprehensive tool description with industry context',
 *   version: '3.0.0',  // MANDATORY: Version for compatibility tracking
 *   parameters: {
 *     type: 'object',
 *     properties: {
 *       param_name: {
 *         type: 'string',
 *         description: 'MANDATORY: Specific parameter description', // ← CRITICAL
 *         required: true
 *       }
 *     },
 *     required: ['param_name']  // MUST match properties with required: true
 *   }
 * }
 *
 * FORBIDDEN PATTERNS (cause TypeScript errors):
 * - { type: 'string', required: true }  // Missing description field
 * - Generic descriptions like "Tool parameter"
 * - Inconsistent required arrays vs properties
 *
 * VALIDATION COMMANDS:
 * - npm run build (must pass without TypeScript errors)
 * - grep -r "Property 'description' is missing" build-output (should be empty)
 *
 * FRESH PRODUCE INDUSTRY CONTEXT:
 * All tool descriptions must include FreshProduce.com/IFPA alignment with:
 * - Target personas (Strategic Buyer Sarah, Innovation-Focused Frank, etc.)
 * - Industry standards (IFPA certification, food safety, quality assessments)
 * - Business KPIs (membership conversion, content engagement, event registration)
 *
 * AGENT DISCOVERY IMPACT:
 * Comprehensive schemas improve OPAL agent tool discovery and execution success.
 * Poor schemas reduce integration health scores and agent effectiveness.
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
        },
        // Phase 3 Tools - Tier 1: Universal Tools
        {
          name: 'osa_retrieve_workflow_context',
          description: 'Retrieve comprehensive workflow context and execution state for OPAL operations',
          version: '3.0.0',
          parameters: {
            type: 'object',
            properties: {
              workflow_id: { type: 'string', description: 'Unique identifier for the workflow instance', required: true },
              context_scope: { type: 'string', description: 'Scope of context to retrieve (full, minimal, metadata)', required: false },
              include_execution_history: { type: 'boolean', description: 'Whether to include execution history in response', required: false }
            },
            required: ['workflow_id']
          }
        },
        {
          name: 'osa_store_workflow_data',
          description: 'Store and persist workflow execution data with comprehensive metadata tracking',
          version: '3.0.0',
          parameters: {
            type: 'object',
            properties: {
              workflow_id: { type: 'string', description: 'Unique identifier for the workflow instance', required: true },
              agent_name: { type: 'string', description: 'Name of the OPAL agent generating the data', required: true },
              execution_data: { type: 'object', description: 'Agent execution results and metadata', required: true },
              storage_tier: { type: 'string', description: 'Storage tier preference (standard, archive, ephemeral)', required: false }
            },
            required: ['workflow_id', 'agent_name', 'execution_data']
          }
        },
        {
          name: 'osa_send_data_to_osa_webhook',
          description: 'Send agent data and results to OSA application via webhook for real-time updates',
          version: '3.0.0',
          parameters: {
            type: 'object',
            properties: {
              agent_name: { type: 'string', description: 'Name of the OPAL agent sending data', required: true },
              execution_results: { type: 'object', description: 'Agent execution results and output data', required: true },
              workflow_id: { type: 'string', description: 'Unique identifier for the workflow instance', required: true },
              metadata: { type: 'object', description: 'Additional execution metadata and context', required: true }
            },
            required: ['agent_name', 'execution_results', 'workflow_id', 'metadata']
          }
        },
        // Phase 3 Tools - Tier 2: High-Frequency Cross-Agent Tools
        {
          name: 'osa_dxp_analyze_insights',
          description: 'Analyze DXP behavioral insights and user engagement patterns with fresh produce industry context',
          version: '3.0.0',
          parameters: {
            type: 'object',
            properties: {
              analysis_scope: { type: 'string', required: false },
              include_behavioral_analysis: { type: 'boolean', required: false },
              include_engagement_insights: { type: 'boolean', required: false }
            }
          }
        },
        {
          name: 'osa_dxp_behavioral_insights',
          description: 'Generate behavioral pattern analysis from DXP data for fresh produce professional workflows',
          version: '3.0.0',
          parameters: {
            type: 'object',
            properties: {
              behavioral_scope: { type: 'string', required: false },
              analysis_period: { type: 'string', required: false },
              include_seasonal_patterns: { type: 'boolean', required: false }
            }
          }
        },
        {
          name: 'osa_odp_audience_segments',
          description: 'Retrieve and analyze ODP audience segments with IFPA member targeting and fresh produce context',
          version: '3.0.0',
          parameters: {
            type: 'object',
            properties: {
              segmentation_scope: { type: 'string', required: false },
              include_performance_metrics: { type: 'boolean', required: false },
              segment_types: { type: 'array', required: false }
            }
          }
        },
        {
          name: 'osa_odp_generate_segment',
          description: 'Generate new audience segment profiles based on fresh produce industry criteria and member behavior',
          version: '3.0.0',
          parameters: {
            type: 'object',
            properties: {
              segment_criteria: { type: 'object', required: false },
              target_audience_type: { type: 'string', required: false },
              include_seasonal_targeting: { type: 'boolean', required: false }
            }
          }
        },
        {
          name: 'osa_cmp_send_strategy',
          description: 'Send comprehensive marketing strategy recommendations to CMP with fresh produce campaign optimization',
          version: '3.0.0',
          parameters: {
            type: 'object',
            properties: {
              strategy_type: { type: 'string', required: false },
              campaign_scope: { type: 'string', required: false },
              include_seasonal_strategies: { type: 'boolean', required: false }
            }
          }
        },
        {
          name: 'osa_cmp_get_calendar',
          description: 'Retrieve marketing calendar with seasonal fresh produce cycles and IFPA event integration',
          version: '3.0.0',
          parameters: {
            type: 'object',
            properties: {
              calendar_scope: { type: 'string', required: false },
              time_horizon: { type: 'string', required: false },
              include_seasonal_events: { type: 'boolean', required: false }
            }
          }
        },
        // Phase 3 Tools - Tier 3: Content-Impact Tools
        {
          name: 'osa_canvas_engagement',
          description: 'Generate engagement pattern visualizations with Canvas-style charts for fresh produce analytics',
          version: '3.0.0',
          parameters: {
            type: 'object',
            properties: {
              visualization_type: { type: 'string', required: false },
              data_source: { type: 'string', required: false },
              include_seasonal_overlays: { type: 'boolean', required: false }
            }
          }
        },
        {
          name: 'osa_canvas_behavioral',
          description: 'Create behavioral pattern Canvas visualizations for member journey analysis',
          version: '3.0.0',
          parameters: {
            type: 'object',
            properties: {
              pattern_type: { type: 'string', required: false },
              analysis_depth: { type: 'string', required: false },
              include_member_segmentation: { type: 'boolean', required: false }
            }
          }
        },
        {
          name: 'osa_canvas_audience',
          description: 'Generate audience segmentation Canvas visualizations with IFPA member categorization',
          version: '3.0.0',
          parameters: {
            type: 'object',
            properties: {
              audience_scope: { type: 'string', required: false },
              visualization_style: { type: 'string', required: false },
              include_industry_context: { type: 'boolean', required: false }
            }
          }
        },
        {
          name: 'osa_audit_content_structure',
          description: 'Audit comprehensive content structure and quality with fresh produce industry compliance checking',
          version: '3.0.0',
          parameters: {
            type: 'object',
            properties: {
              audit_scope: { type: 'string', required: false },
              include_deep_analysis: { type: 'boolean', required: false },
              include_compliance_check: { type: 'boolean', required: false }
            }
          }
        },
        {
          name: 'osa_analyze_website_content',
          description: 'Analyze website content comprehensively with performance assessment and fresh produce SEO optimization',
          version: '3.0.0',
          parameters: {
            type: 'object',
            properties: {
              website_url: { type: 'string', required: false },
              analysis_depth: { type: 'string', required: false },
              include_performance_assessment: { type: 'boolean', required: false }
            }
          }
        },
        {
          name: 'get_content_recommendations_by_topic',
          description: 'Generate comprehensive content recommendations by topic with fresh produce industry context',
          version: '3.0.0',
          parameters: {
            type: 'object',
            properties: {
              topic: { type: 'string', required: false },
              analysis_type: { type: 'string', required: false },
              include_section_analysis: { type: 'boolean', required: false }
            }
          }
        },
        {
          name: 'osa_compile_final_results',
          description: 'Compile comprehensive final results with executive summary, implementation roadmap, and fresh produce metrics',
          version: '3.0.0',
          parameters: {
            type: 'object',
            properties: {
              compilation_scope: { type: 'string', required: false },
              include_executive_summary: { type: 'boolean', required: false },
              include_implementation_roadmap: { type: 'boolean', required: false },
              include_performance_metrics: { type: 'boolean', required: false }
            }
          }
        },
        // Additional Phase 3 Tools - Missing from initial registration
        {
          name: 'osa_analyze_member_behavior',
          description: 'Analyze member behavior patterns and engagement metrics with fresh produce industry insights',
          version: '3.0.0',
          parameters: {
            type: 'object',
            properties: {
              member_segment: { type: 'string', required: false },
              analysis_timeframe: { type: 'string', required: false },
              behavior_categories: { type: 'array', required: false }
            }
          }
        },
        {
          name: 'osa_cma_analyze_content',
          description: 'Analyze content performance and effectiveness using CMA (Content Management Analytics)',
          version: '3.0.0',
          parameters: {
            type: 'object',
            properties: {
              content_type: { type: 'string', required: false },
              performance_metrics: { type: 'array', required: false },
              analysis_depth: { type: 'string', required: false }
            }
          }
        },
        {
          name: 'osa_cms_content_structure',
          description: 'Analyze and optimize CMS content structure for fresh produce industry standards',
          version: '3.0.0',
          parameters: {
            type: 'object',
            properties: {
              structure_scope: { type: 'string', required: false },
              include_taxonomy_analysis: { type: 'boolean', required: false },
              optimization_focus: { type: 'string', required: false }
            }
          }
        },
        {
          name: 'osa_contentrecs_topic',
          description: 'Generate content recommendations based on topic analysis and fresh produce trends',
          version: '3.0.0',
          parameters: {
            type: 'object',
            properties: {
              topic_category: { type: 'string', required: false },
              content_format: { type: 'string', required: false },
              seasonal_relevance: { type: 'boolean', required: false }
            }
          }
        },
        {
          name: 'osa_fetch_audience_segments',
          description: 'Fetch and analyze audience segments with comprehensive demographic and behavioral data',
          version: '3.0.0',
          parameters: {
            type: 'object',
            properties: {
              segment_criteria: { type: 'string', required: false },
              include_behavioral_data: { type: 'boolean', required: false },
              data_freshness: { type: 'string', required: false }
            }
          }
        },
        {
          name: 'osa_opal_send_to_osa',
          description: 'Send OPAL execution results and data directly to OSA system for integration',
          version: '3.0.0',
          parameters: {
            type: 'object',
            properties: {
              execution_data: { type: 'object', required: true },
              target_system: { type: 'string', required: false },
              priority_level: { type: 'string', required: false }
            },
            required: ['execution_data']
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

  console.log('🔧 [Enhanced Tools] Executing tool:', {
    attempt_id: attemptId,
    tool_name: toolRequest.tool_name,
    workflow_id: toolRequest.parameters.workflow_id,
    agent_id: toolRequest.parameters.agent_id
  });

  // Handle Phase 3 tool routing
  if (toolRequest.tool_name !== 'send_data_to_osa_enhanced') {
    return await executePhase3Tool(toolRequest, config, envConfig, attemptId, startTime);
  }

  // Original webhook execution for legacy tool
  return await executeLegacyWebhookTool(toolRequest, config, envConfig, attemptId, startTime);
}

/**
 * Execute Phase 3 tools via their specific API endpoints
 */
async function executePhase3Tool(
  toolRequest: EnhancedToolExecute,
  config: any,
  envConfig: any,
  attemptId: string,
  startTime: number
): Promise<any> {
  // Build the tool endpoint URL
  const toolEndpoint = `${envConfig.baseUrl}/api/tools/${toolRequest.tool_name}`;

  console.log('🎯 [Enhanced Tools] Calling Phase 3 tool endpoint:', {
    attempt_id: attemptId,
    tool_name: toolRequest.tool_name,
    endpoint: toolEndpoint
  });

  // Call the specific tool endpoint
  const response = await fetch(toolEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Correlation-ID': attemptId,
      'User-Agent': 'OPAL-Enhanced-Tools/3.0'
    },
    body: JSON.stringify(toolRequest.parameters),
    signal: AbortSignal.timeout(envConfig.timeout)
  });

  const responseText = await response.text();
  const duration = Date.now() - startTime;

  console.log('📥 [Enhanced Tools] Phase 3 tool response:', {
    attempt_id: attemptId,
    tool_name: toolRequest.tool_name,
    status: response.status,
    status_text: response.statusText,
    duration_ms: duration,
    response_size: responseText.length
  });

  if (!response.ok) {
    const error = new Error(`Tool execution failed: ${response.status} ${response.statusText}`);
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
    message: 'Phase 3 tool executed successfully',
    tool_name: toolRequest.tool_name,
    workflow_id: toolRequest.parameters.workflow_id,
    agent_id: toolRequest.parameters.agent_id,
    execution_status: toolRequest.parameters.execution_status,
    tool_response: {
      status: response.status,
      data: responseData
    },
    duration_ms: duration,
    attempt_id: attemptId,
    timestamp: new Date().toISOString()
  };
}

/**
 * Execute legacy webhook tool (original implementation)
 */
async function executeLegacyWebhookTool(
  toolRequest: EnhancedToolExecute,
  config: any,
  envConfig: any,
  attemptId: string,
  startTime: number
): Promise<any> {
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

  console.log('📤 [Enhanced Tools] Sending legacy webhook request:', {
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

  console.log('📥 [Enhanced Tools] Legacy webhook response:', {
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
    message: 'Legacy tool executed successfully',
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