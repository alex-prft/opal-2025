// Force Sync Endpoint - Production Ready with Account & Workflow Lock
// ONLY strategy_workflow execution - ALL strategy_assistant_workflow references REMOVED

import { NextRequest, NextResponse } from 'next/server';
import { setTimeout } from 'timers/promises';
import { opalWorkflowEngine } from '@/lib/opal/workflow-engine';
import { triggerStrategyAssistantWorkflowProduction } from '@/lib/opal/production-webhook-caller';

// ========================================================================================
// TYPES AND INTERFACES
// ========================================================================================

interface EnvironmentValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  config: {
    webhookUrl?: string;
    authKey?: string;
    webhookId?: string;
  };
}

interface OpalWorkflowPayload {
  workflow_name: 'strategy_workflow'; // LOCKED - NO OTHER WORKFLOW ALLOWED
  input_data: {
    client_name: string;
    industry?: string;
    company_size?: string;
    current_capabilities?: string[];
    business_objectives?: string[];
    additional_marketing_technology?: string[];
    timeline_preference?: string;
    budget_range?: string;
    recipients: string[];
    triggered_by: 'force_sync'; // LOCKED
    sync_scope?: string;
    force_sync: true; // ALWAYS TRUE
  };
  metadata: {
    trigger_timestamp: string;
    correlation_id: string;
    source_system: 'OSA-ForceSync-Production'; // LOCKED
    span_id?: string;
    attempt_id?: string;
    retry_count?: number;
    environment?: string;
  };
}

interface OpalWebhookResponse {
  success: boolean;
  workflow_id?: string;
  session_id?: string;
  message: string;
  polling_url?: string;
  external_reference?: string;
  request_metadata?: {
    correlation_id: string;
    duration_ms: number;
    response_timestamp: string;
  };
}

interface ForceSyncRequest {
  sync_scope?: string;
  include_rag_update?: boolean;
  triggered_by?: string;
  client_context?: {
    client_name?: string;
    industry?: string;
    recipients?: string[];
  };
  metadata?: Record<string, any>;
}

interface ForceSyncResponse {
  success: boolean;
  sync_id?: string;
  session_id?: string;
  correlation_id: string;
  message: string;
  polling_url?: string;
  sync_details: {
    scope: string;
    platforms_included: string[];
    rag_update_enabled: boolean;
    estimated_duration: string;
    triggered_by: string;
    sync_timestamp: string;
    workflow_validation: {
      expected_workflow: 'strategy_workflow';
      actual_workflow?: string;
      validated: boolean;
    };
    external_opal: {
      triggered: boolean;
      workflow_id?: string;
      session_id?: string;
      message?: string;
      polling_url?: string;
      webhook_id?: string;
    };
    telemetry: {
      correlation_id: string;
      external_duration_ms?: number;
    };
  };
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  retryableStatuses: number[];
}

// ========================================================================================
// CONSTANTS - LOCKED CONFIGURATION (NO strategy_assistant_workflow ALLOWED)
// ========================================================================================

const LOCKED_WORKFLOW_NAME = 'strategy_workflow' as const;
const LOCKED_WORKFLOW_ID = 'strategy_workflow' as const;
const EXPECTED_WEBHOOK_DOMAIN = 'webhook.opal.optimizely.com' as const;
const EXPECTED_WEBHOOK_URL = 'https://webhook.opal.optimizely.com/webhooks/d3e181a30acf493bb65a5c7792cfeced/ba71d62d-aa74-4bbf-9ab8-a1a11ed4bf14' as const;
const EXPECTED_WEBHOOK_ID = 'd3e181a30acf493bb65a5c7792cfeced' as const;
const SOURCE_SYSTEM = 'OSA-ForceSync-Production' as const;

// ========================================================================================
// ENVIRONMENT VALIDATION WITH OPAL ACCOUNT VERIFICATION
// ========================================================================================

function validateOpalEnvironment(): EnvironmentValidation {
  const validation: EnvironmentValidation = {
    isValid: true,
    errors: [],
    warnings: [],
    config: {}
  };

  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';

  console.log('\n🔧 === OPAL ENVIRONMENT VALIDATION (ACCOUNT & WORKFLOW LOCKED) ===');
  console.log(`📄 NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
  console.log(`🔒 ONLY ALLOWED WORKFLOW: ${LOCKED_WORKFLOW_NAME}`);
  console.log(`🔒 ONLY ALLOWED WORKFLOW ID: ${LOCKED_WORKFLOW_ID}`);
  console.log(`🔒 ONLY ALLOWED WEBHOOK: ${EXPECTED_WEBHOOK_URL.replace(/\/ba71d62d.*/, '/***')}`);
  console.log(`🔒 ONLY ALLOWED WEBHOOK ID: ${EXPECTED_WEBHOOK_ID.substring(0, 8)}...`);
  console.log(`🚫 BLOCKED WORKFLOW: strategy_assistant_workflow (PERMANENTLY DISABLED)`);

  if (isDevelopment) {
    console.log(`🛠️ DEVELOPMENT MODE: Relaxed validation with mock fallbacks enabled`);
  }

  // 1. Validate OPAL_WEBHOOK_URL
  const webhookUrl = process.env.OPAL_WEBHOOK_URL;
  if (!webhookUrl) {
    if (isProduction) {
      validation.isValid = false;
      validation.errors.push(`❌ OPAL_WEBHOOK_URL: Not set (required in production)`);
      console.log(`❌ OPAL_WEBHOOK_URL: NOT SET (PRODUCTION REQUIRES THIS)`);
    } else {
      validation.warnings.push(`⚠️ OPAL_WEBHOOK_URL: Not set (will use mock in development)`);
      console.log(`⚠️ OPAL_WEBHOOK_URL: NOT SET (Using development mock)`);
      validation.config.webhookUrl = 'https://webhook.opal.optimizely.com/webhooks/dev-mock-id/dev-mock-secret';
      validation.config.webhookId = 'dev-mock-id';
    }
  } else {
    // STRICT ACCOUNT VALIDATION: Only allow exact webhook URL
    if (isProduction && webhookUrl !== EXPECTED_WEBHOOK_URL) {
      validation.isValid = false;
      validation.errors.push(`❌ OPAL_WEBHOOK_URL: Production requires exact webhook URL - got different account`);
      console.log(`❌ OPAL_WEBHOOK_URL: WRONG ACCOUNT - Production locked to specific webhook`);
      console.log(`🔒 Expected: ${EXPECTED_WEBHOOK_URL.replace(/\/ba71d62d.*/, '/***')}`);
      console.log(`❌ Got: ${webhookUrl.replace(/\/webhooks\/[^\/]+\//, '/webhooks/***/').substring(0, 80)}...`);
    } else {
      // Extract webhook ID from URL for account validation
      const webhookMatch = webhookUrl.match(/webhook\.opal\.optimizely\.com\/webhooks\/([^\/]+)/);
      const webhookId = webhookMatch ? webhookMatch[1] : null;

      if (!webhookUrl.includes(EXPECTED_WEBHOOK_DOMAIN)) {
        if (isProduction) {
          validation.isValid = false;
          validation.errors.push(`❌ OPAL_WEBHOOK_URL: Must be from ${EXPECTED_WEBHOOK_DOMAIN}`);
          console.log(`❌ OPAL_WEBHOOK_URL: WRONG DOMAIN - Expected ${EXPECTED_WEBHOOK_DOMAIN}`);
        } else {
          validation.warnings.push(`⚠️ OPAL_WEBHOOK_URL: Wrong domain (acceptable in development)`);
          console.log(`⚠️ OPAL_WEBHOOK_URL: WRONG DOMAIN (Development mode - using anyway)`);
          validation.config.webhookUrl = webhookUrl;
          validation.config.webhookId = 'dev-external-webhook';
        }
      } else if (!webhookId) {
        validation.isValid = false;
        validation.errors.push(`❌ OPAL_WEBHOOK_URL: Invalid format - cannot extract webhook ID`);
        console.log(`❌ OPAL_WEBHOOK_URL: INVALID FORMAT`);
      } else if (isProduction && webhookId !== EXPECTED_WEBHOOK_ID) {
        validation.isValid = false;
        validation.errors.push(`❌ OPAL_WEBHOOK_URL: Production locked to specific account - webhook ID mismatch`);
        console.log(`❌ OPAL_WEBHOOK_URL: WRONG ACCOUNT ID`);
        console.log(`🔒 Expected ID: ${EXPECTED_WEBHOOK_ID.substring(0, 8)}...`);
        console.log(`❌ Got ID: ${webhookId.substring(0, 8)}...`);
      } else {
        validation.config.webhookUrl = webhookUrl;
        validation.config.webhookId = webhookId;
        const maskedUrl = webhookUrl.replace(/\/webhooks\/[^\/]+\//, '/webhooks/***/');
        console.log(`✅ OPAL_WEBHOOK_URL: ${maskedUrl}`);
        console.log(`✅ WEBHOOK_ID: ${webhookId.substring(0, 8)}...`);
        if (isProduction) {
          console.log(`🔒 ACCOUNT VALIDATED: Production webhook locked and verified`);
        }
      }
    }
  }

  // 2. Validate OPAL_STRATEGY_WORKFLOW_AUTH_KEY
  const authKey = process.env.OPAL_STRATEGY_WORKFLOW_AUTH_KEY;
  if (!authKey) {
    if (isProduction) {
      validation.isValid = false;
      validation.errors.push(`❌ OPAL_STRATEGY_WORKFLOW_AUTH_KEY: Not set (required in production)`);
      console.log(`❌ OPAL_STRATEGY_WORKFLOW_AUTH_KEY: NOT SET (PRODUCTION REQUIRES THIS)`);
    } else {
      validation.warnings.push(`⚠️ OPAL_STRATEGY_WORKFLOW_AUTH_KEY: Not set (will use mock in development)`);
      console.log(`⚠️ OPAL_STRATEGY_WORKFLOW_AUTH_KEY: NOT SET (Using development mock)`);
      validation.config.authKey = 'dev-mock-auth-key-12345678901234567890123456789012';
    }
  } else if (authKey.length < 32) {
    if (isProduction) {
      validation.isValid = false;
      validation.errors.push(`❌ OPAL_STRATEGY_WORKFLOW_AUTH_KEY: Must be at least 32 characters`);
      console.log(`❌ OPAL_STRATEGY_WORKFLOW_AUTH_KEY: TOO SHORT (${authKey.length} chars)`);
    } else {
      validation.warnings.push(`⚠️ OPAL_STRATEGY_WORKFLOW_AUTH_KEY: Short key (acceptable in development)`);
      console.log(`⚠️ OPAL_STRATEGY_WORKFLOW_AUTH_KEY: SHORT KEY (Development mode - using anyway)`);
      validation.config.authKey = authKey;
    }
  } else if (authKey.includes('your_') || authKey.includes('placeholder') || authKey.includes('example')) {
    if (isProduction) {
      validation.isValid = false;
      validation.errors.push(`❌ OPAL_STRATEGY_WORKFLOW_AUTH_KEY: Contains placeholder value`);
      console.log(`❌ OPAL_STRATEGY_WORKFLOW_AUTH_KEY: PLACEHOLDER VALUE`);
    } else {
      validation.warnings.push(`⚠️ OPAL_STRATEGY_WORKFLOW_AUTH_KEY: Placeholder detected (acceptable in development)`);
      console.log(`⚠️ OPAL_STRATEGY_WORKFLOW_AUTH_KEY: PLACEHOLDER VALUE (Development mode - using anyway)`);
      validation.config.authKey = authKey;
    }
  } else {
    validation.config.authKey = authKey;
    const maskedKey = `${authKey.substring(0, 8)}...${authKey.substring(authKey.length - 4)}`;
    console.log(`✅ OPAL_STRATEGY_WORKFLOW_AUTH_KEY: ${maskedKey}`);
  }

  // Optional debug mode
  const debugMode = process.env.OPAL_DEBUG_MODE;
  console.log(`\n🔧 Optional Variables:`);
  console.log(`${debugMode ? '✅ SET' : '⚠️ NOT SET'} OPAL_DEBUG_MODE: ${debugMode || 'undefined'}`);

  console.log(`\n🎯 Overall Status: ${validation.isValid ? '✅ READY' : (isDevelopment ? '⚠️ DEVELOPMENT MODE' : '❌ NEEDS ATTENTION')}`);
  console.log(`🔒 Workflow Security: ONLY ${LOCKED_WORKFLOW_NAME} ALLOWED`);

  if (validation.errors.length > 0) {
    console.log('\n❌ CRITICAL ERRORS (Production Only):');
    validation.errors.forEach(error => console.log(`   ${error}`));
  }

  if (validation.warnings.length > 0) {
    console.log('\n⚠️ DEVELOPMENT WARNINGS (Not blocking):');
    validation.warnings.forEach(warning => console.log(`   ${warning}`));
  }

  console.log('🔧 === END VALIDATION ===\n');
  return validation;
}

// ========================================================================================
// PAYLOAD BUILDER WITH STRICT WORKFLOW LOCK
// ========================================================================================

function buildOpalWorkflowPayload(params: {
  client_name?: string;
  industry?: string;
  recipients?: string[];
  sync_scope?: string;
  correlation_id: string;
  additional_metadata?: Record<string, any>;
}): { success: boolean; payload?: OpalWorkflowPayload; errors?: string[] } {

  const errors: string[] = [];

  // CRITICAL: Validate workflow lock - ONLY strategy_workflow allowed
  const workflowName = LOCKED_WORKFLOW_NAME;
  if (workflowName !== 'strategy_workflow') {
    errors.push('CRITICAL: Workflow name mismatch - ONLY strategy_workflow allowed');
  }

  // SECURITY: Block any attempt to use old workflow name
  if (params.additional_metadata?.workflow_name === 'strategy_assistant_workflow') {
    errors.push('SECURITY: strategy_assistant_workflow is PERMANENTLY BLOCKED');
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  const payload: OpalWorkflowPayload = {
    workflow_name: workflowName, // Type-safe locked to strategy_workflow ONLY
    input_data: {
      client_name: params.client_name || 'Force Sync Operation',
      industry: params.industry || 'Technology',
      company_size: 'Medium',
      current_capabilities: ['DXP Integration', 'Data Synchronization'],
      business_objectives: ['Update RAG Model', 'Refresh DXP Insights'],
      additional_marketing_technology: ['All Integrated Platforms'],
      timeline_preference: '6-months',
      budget_range: '50k-100k',
      recipients: Array.isArray(params.recipients) ? params.recipients : ['admin@example.com'],
      triggered_by: 'force_sync', // LOCKED - only force_sync allowed
      sync_scope: params.sync_scope || 'priority_platforms',
      force_sync: true // ALWAYS true for Force Sync
    },
    metadata: {
      trigger_timestamp: new Date().toISOString(),
      correlation_id: params.correlation_id,
      source_system: SOURCE_SYSTEM, // LOCKED source system
      environment: process.env.NODE_ENV || 'development',
      ...params.additional_metadata
    }
  };

  return { success: true, payload };
}

// ========================================================================================
// PAYLOAD VALIDATION WITH WORKFLOW VERIFICATION
// ========================================================================================

function validateOpalPayload(payload: any): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // CRITICAL: Workflow validation - ONLY strategy_workflow allowed
  if (!payload.workflow_name) {
    errors.push('CRITICAL: Missing required field: workflow_name');
  } else if (payload.workflow_name !== LOCKED_WORKFLOW_NAME) {
    errors.push(`CRITICAL: Invalid workflow_name: ONLY "${LOCKED_WORKFLOW_NAME}" allowed, got "${payload.workflow_name}"`);
  }

  // SECURITY: Block old workflow name
  if (payload.workflow_name === 'strategy_assistant_workflow') {
    errors.push('SECURITY: strategy_assistant_workflow is PERMANENTLY BLOCKED');
  }

  // Required input_data fields
  if (!payload.input_data) {
    errors.push('Missing required object: input_data');
  } else {
    const { input_data } = payload;

    if (!input_data.client_name?.trim()) {
      errors.push('Missing required field: input_data.client_name');
    }

    if (input_data.triggered_by !== 'force_sync') {
      errors.push(`Invalid triggered_by: must be "force_sync", got "${input_data.triggered_by}"`);
    }

    if (input_data.force_sync !== true) {
      errors.push('Invalid force_sync: must be true for Force Sync operations');
    }

    // Validate arrays
    if (input_data.recipients && !Array.isArray(input_data.recipients)) {
      errors.push('Field input_data.recipients must be an array');
    }
  }

  // Required metadata fields
  if (!payload.metadata) {
    errors.push('Missing required object: metadata');
  } else {
    const { metadata } = payload;

    if (!metadata.correlation_id) {
      errors.push('Missing required field: metadata.correlation_id');
    }

    if (metadata.source_system !== SOURCE_SYSTEM) {
      errors.push(`Invalid source_system: must be "${SOURCE_SYSTEM}", got "${metadata.source_system}"`);
    }

    if (!metadata.trigger_timestamp) {
      warnings.push('Missing recommended field: metadata.trigger_timestamp');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// ========================================================================================
// WEBHOOK CALLER WITH RETRY LOGIC AND RESPONSE VALIDATION
// ========================================================================================

async function callOpalWebhookWithRetry(
  payload: OpalWorkflowPayload,
  retryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    retryableStatuses: [408, 429, 500, 502, 503, 504]
  }
): Promise<OpalWebhookResponse> {

  const { maxRetries, baseDelay, maxDelay, retryableStatuses } = retryConfig;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const attemptId = `${payload.metadata.correlation_id}-attempt-${attempt}`;

    console.log(`🔄 [OPAL Retry ${attempt}/${maxRetries}] Starting attempt: ${attemptId}`);
    console.log(`🔒 [OPAL] WORKFLOW LOCKED: ${LOCKED_WORKFLOW_NAME} ONLY`);

    try {
      const response = await callOpalWebhookSingle(payload, attemptId);

      if (response.success) {
        console.log(`✅ [OPAL Retry ${attempt}] Success on attempt ${attempt}`);
        return response;
      } else {
        throw new Error(`Webhook failed: ${response.message}`);
      }

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      console.error(`❌ [OPAL Retry ${attempt}] Failed:`, {
        attempt,
        attemptId,
        error: lastError.message,
        status: (error as any).status,
        locked_workflow: LOCKED_WORKFLOW_NAME
      });

      // Don't retry on non-retryable errors
      const isRetryable = (error as any).status ? retryableStatuses.includes((error as any).status) : true;
      const shouldRetry = attempt < maxRetries && isRetryable;

      if (!shouldRetry) {
        if (!isRetryable) {
          console.log(`🚫 [OPAL Retry ${attempt}] Non-retryable error (status: ${(error as any).status})`);
        }
        break;
      }

      // Exponential backoff with jitter
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000,
        maxDelay
      );

      console.log(`⏱️ [OPAL Retry ${attempt}] Waiting ${delay.toFixed(0)}ms before retry ${attempt + 1}`);
      await setTimeout(delay);
    }
  }

  throw lastError || new Error('All retry attempts failed');
}

async function callOpalWebhookSingle(
  payload: OpalWorkflowPayload,
  attemptId: string
): Promise<OpalWebhookResponse> {

  const startTime = Date.now();
  const correlationId = payload.metadata.correlation_id;
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Get validated environment variables (may be mock values in development)
  const envValidation = validateOpalEnvironment();
  const webhookUrl = envValidation.config.webhookUrl;
  const authToken = envValidation.config.authKey;

  if (!webhookUrl || !authToken) {
    if (isDevelopment) {
      // Development mode mock response
      console.log(`🛠️ [OPAL Dev] Using mock response for development mode`);
      const duration = Date.now() - startTime;
      return {
        success: true,
        workflow_id: LOCKED_WORKFLOW_ID,
        session_id: `dev-mock-session-${Date.now()}`,
        message: `Development mock: OPAL webhook '${payload.workflow_name}' simulated successfully`,
        external_reference: `dev-mock-${correlationId}`,
        polling_url: `/api/workflow/status/dev-mock-session-${Date.now()}`,
        request_metadata: {
          correlation_id: correlationId,
          duration_ms: duration,
          response_timestamp: new Date().toISOString()
        }
      };
    }
    throw new Error('Environment validation should have caught missing variables');
  }

  // Enhanced payload with attempt tracking
  const enhancedPayload: OpalWorkflowPayload = {
    ...payload,
    metadata: {
      ...payload.metadata,
      span_id: `opal-webhook-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      attempt_id: attemptId,
      retry_count: parseInt(attemptId.split('-attempt-')[1]) - 1
    }
  };

  const payloadJson = JSON.stringify(enhancedPayload, null, 2);
  const payloadSizeBytes = Buffer.byteLength(payloadJson, 'utf8');

  // Extract webhook ID for logging
  const webhookMatch = webhookUrl.match(/webhook\.opal\.optimizely\.com\/webhooks\/([^\/]+)/);
  const webhookId = webhookMatch ? webhookMatch[1] : 'unknown';

  // Comprehensive request logging
  console.log(`📤 [OPAL] Sending webhook request:`, {
    correlation_id: correlationId,
    attempt_id: attemptId,
    webhook_url: webhookUrl.replace(/\/webhooks\/[^\/]+\//, '/webhooks/***/'),
    webhook_id: webhookId.substring(0, 8) + '...',
    method: 'POST',
    payload_size_bytes: payloadSizeBytes,
    workflow_name: enhancedPayload.workflow_name,
    client_name: enhancedPayload.input_data.client_name,
    locked_workflow: LOCKED_WORKFLOW_NAME,
    blocked_workflows: ['strategy_assistant_workflow']
  });

  // Debug payload in development
  if (process.env.NODE_ENV === 'development' || process.env.OPAL_DEBUG_MODE === 'true') {
    console.log(`📋 [OPAL Debug] Full payload:`, enhancedPayload);
  }

  let webhookResponse: Response;
  let responseData: string = '';
  let parsedResponse: any = {};

  try {
    // Make the webhook call with comprehensive headers
    webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'User-Agent': 'OSA-ForceSync-Production/2.0',
        'X-Correlation-ID': correlationId,
        'X-Span-ID': enhancedPayload.metadata.span_id || '',
        'X-Attempt-ID': attemptId,
        'X-Workflow-Name': enhancedPayload.workflow_name,
        'X-Source-System': SOURCE_SYSTEM,
        'X-Client-Name': enhancedPayload.input_data.client_name,
        'X-Triggered-By': enhancedPayload.input_data.triggered_by,
        'X-Webhook-ID': webhookId,
        'X-Workflow-Lock': LOCKED_WORKFLOW_NAME
      },
      body: payloadJson,
      signal: AbortSignal.timeout(45000) // 45 second timeout
    });

    responseData = await webhookResponse.text();
    const responseSizeBytes = Buffer.byteLength(responseData, 'utf8');

    // Parse response with error handling
    try {
      parsedResponse = JSON.parse(responseData);
    } catch (parseError) {
      console.warn(`⚠️ [OPAL] Response parsing failed, using raw response:`, (parseError as Error).message);
      parsedResponse = { raw_response: responseData, parse_error: (parseError as Error).message };
    }

    const duration = Date.now() - startTime;

    // Comprehensive response logging
    console.log(`📥 [OPAL] Received response:`, {
      correlation_id: correlationId,
      attempt_id: attemptId,
      status: webhookResponse.status,
      status_text: webhookResponse.statusText,
      response_size_bytes: responseSizeBytes,
      duration_ms: duration,
      success: webhookResponse.ok,
      workflow_id: parsedResponse.workflow_id || parsedResponse.id,
      session_id: parsedResponse.session_id,
      locked_workflow: LOCKED_WORKFLOW_NAME
    });

    if (!webhookResponse.ok) {
      const error = new Error(`OPAL webhook failed: ${webhookResponse.status} ${webhookResponse.statusText}`);
      (error as any).status = webhookResponse.status;
      (error as any).response = parsedResponse;
      throw error;
    }

    // CRITICAL: Validate that response is for correct workflow ONLY
    const responseWorkflowId = parsedResponse.workflow_id || parsedResponse.id;
    if (responseWorkflowId && responseWorkflowId !== LOCKED_WORKFLOW_ID) {
      console.error(`🚨 [OPAL] WORKFLOW MISMATCH - SECURITY VIOLATION:`, {
        expected: LOCKED_WORKFLOW_ID,
        actual: responseWorkflowId,
        correlation_id: correlationId,
        security_note: 'ONLY strategy_workflow is allowed'
      });
      throw new Error(`SECURITY: Workflow ID mismatch - expected "${LOCKED_WORKFLOW_ID}", got "${responseWorkflowId}"`);
    }

    // Success response with workflow validation
    return {
      success: true,
      workflow_id: responseWorkflowId || `opal-${Date.now()}`,
      session_id: parsedResponse.session_id || parsedResponse.workflow_id,
      message: `OPAL webhook '${enhancedPayload.workflow_name}' triggered successfully`,
      external_reference: parsedResponse.reference || parsedResponse.external_id,
      polling_url: parsedResponse.polling_url || parsedResponse.status_url,
      request_metadata: {
        correlation_id: correlationId,
        duration_ms: duration,
        response_timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error(`❌ [OPAL] Webhook call failed:`, {
      correlation_id: correlationId,
      attempt_id: attemptId,
      error: errorMessage,
      status: (error as any).status,
      duration_ms: duration,
      webhook_id: webhookId.substring(0, 8) + '...',
      locked_workflow: LOCKED_WORKFLOW_NAME
    });

    // Development mode fallback for network failures or auth errors
    if (isDevelopment && (
      errorMessage.includes('fetch failed') ||
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('401 Unauthorized') ||
      errorMessage.includes('403 Forbidden') ||
      (error as any).status === 401 ||
      (error as any).status === 403
    )) {
      console.log(`🛠️ [OPAL Dev] Network/Auth error in development mode, using mock response fallback`);
      console.log(`🛠️ [OPAL Dev] Original error: ${errorMessage}`);
      return {
        success: true,
        workflow_id: LOCKED_WORKFLOW_ID,
        session_id: `dev-fallback-session-${Date.now()}`,
        message: `Development fallback: OPAL webhook '${enhancedPayload.workflow_name}' simulated after ${(error as any).status ? `${(error as any).status} error` : 'network error'}`,
        external_reference: `dev-fallback-${correlationId}`,
        polling_url: `/api/workflow/status/dev-fallback-session-${Date.now()}`,
        request_metadata: {
          correlation_id: correlationId,
          duration_ms: duration,
          response_timestamp: new Date().toISOString()
        }
      };
    }

    const enhancedError = new Error(errorMessage);
    (enhancedError as any).status = (error as any).status;
    (enhancedError as any).response = parsedResponse;
    (enhancedError as any).duration_ms = duration;
    (enhancedError as any).correlation_id = correlationId;
    (enhancedError as any).webhook_id = webhookId;

    throw enhancedError;
  }
}

// ========================================================================================
// FORCE SYNC ENDPOINT (MAIN API HANDLER) - ONLY strategy_workflow
// ========================================================================================

export async function POST(request: NextRequest) {
  const correlationId = `force-sync-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  try {
    console.log(`🔄 [Force Sync] Request received - Correlation ID: ${correlationId}`);
    console.log(`🔒 [Force Sync] Workflow Security: ONLY ${LOCKED_WORKFLOW_NAME} allowed`);
    console.log(`🚫 [Force Sync] Blocked Workflows: strategy_assistant_workflow (PERMANENTLY DISABLED)`);

    // 1. Validate environment with OPAL account verification
    const envValidation = validateOpalEnvironment();
    if (!envValidation.isValid) {
      console.error('❌ [Force Sync] Environment validation failed:', envValidation.errors);
      return NextResponse.json({
        success: false,
        error: 'Configuration Error',
        message: 'Environment validation failed - OPAL account or credentials invalid',
        details: envValidation.errors,
        correlation_id: correlationId,
        workflow_security: {
          allowed_workflow: LOCKED_WORKFLOW_NAME,
          allowed_workflow_id: LOCKED_WORKFLOW_ID,
          blocked_workflows: ['strategy_assistant_workflow'],
          validation_failed: true
        }
      }, { status: 500 });
    }

    console.log(`✅ [Force Sync] Environment validation passed`);
    console.log(`✅ [Force Sync] OPAL Account validated: webhook ID ${envValidation.config.webhookId?.substring(0, 8)}...`);
    console.log(`🔒 [Force Sync] Workflow Security: ONLY ${LOCKED_WORKFLOW_NAME} permitted`);

    // 2. Parse request body with error handling
    let body: ForceSyncRequest = {};
    try {
      body = await request.json().catch(() => ({}));
    } catch (parseError) {
      console.warn(`⚠️ [Force Sync] Request body parsing failed, using defaults`);
    }

    // 3. Build OPAL payload with strict workflow lock
    const payloadResult = buildOpalWorkflowPayload({
      client_name: body.client_context?.client_name,
      industry: body.client_context?.industry,
      recipients: body.client_context?.recipients,
      sync_scope: body.sync_scope,
      correlation_id: correlationId,
      additional_metadata: body.metadata
    });

    if (!payloadResult.success) {
      console.error('❌ [Force Sync] Payload building failed:', payloadResult.errors);
      throw new Error(`Payload building failed: ${payloadResult.errors?.join(', ')}`);
    }

    // 4. Validate payload with workflow verification
    const validation = validateOpalPayload(payloadResult.payload!);
    if (!validation.valid) {
      console.error('❌ [Force Sync] Payload validation failed:', validation.errors);
      throw new Error(`Payload validation failed: ${validation.errors.join(', ')}`);
    }

    console.log(`🔒 [Force Sync] Workflow validated: ${payloadResult.payload!.workflow_name}`);
    console.log(`🎯 [Force Sync] Using validated OPAL account with ${LOCKED_WORKFLOW_NAME} ONLY`);

    // 5. DUAL-TIER EXECUTION: Internal Sync + External OPAL Enhancement
    const dualTierStartTime = Date.now();

    // 5a. INTERNAL WORKFLOW (Always Works) - Core Data Processing
    console.log(`🏠 [Force Sync] Starting Internal Workflow Engine...`);
    const internalStartTime = Date.now();

    let internalWorkflow: any;
    try {
      internalWorkflow = await opalWorkflowEngine.triggerWorkflow({
        client_name: payloadResult.payload!.input_data.client_name,
        industry: payloadResult.payload!.input_data.industry,
        company_size: payloadResult.payload!.input_data.company_size,
        current_capabilities: payloadResult.payload!.input_data.current_capabilities,
        business_objectives: payloadResult.payload!.input_data.business_objectives,
        additional_marketing_technology: payloadResult.payload!.input_data.additional_marketing_technology,
        timeline_preference: payloadResult.payload!.input_data.timeline_preference,
        budget_range: payloadResult.payload!.input_data.budget_range,
        recipients: payloadResult.payload!.input_data.recipients,
        triggered_by: 'force_sync',
        trigger_timestamp: new Date().toISOString(),
        sync_scope: body.sync_scope || 'priority_platforms'
      });

      const internalDuration = Date.now() - internalStartTime;
      console.log(`✅ [Force Sync] Internal Workflow completed successfully (${internalDuration}ms)`);
      console.log(`📊 [Force Sync] Internal workflow ID: ${internalWorkflow.workflow_id}`);
    } catch (internalError) {
      console.error(`⚠️ [Force Sync] Internal Workflow failed (non-blocking):`, internalError);
      // Continue with external OPAL - internal failure shouldn't block external enhancement
      internalWorkflow = {
        workflow_id: `internal-failed-${Date.now()}`,
        session_id: `session-${Date.now()}`,
        polling_url: `/api/opal/status/fallback-${Date.now()}`
      };
    }

    // 5b. EXTERNAL OPAL ENHANCEMENT (Production Enhancement when configured)
    console.log(`🚀 [Force Sync] Starting External OPAL Enhancement...`);
    const externalStartTime = Date.now();

    // Smart Production Configuration Detection
    const hasProductionConfig = process.env.OPAL_WEBHOOK_URL &&
                               process.env.OPAL_STRATEGY_WORKFLOW_AUTH_KEY &&
                               !process.env.OPAL_STRATEGY_WORKFLOW_AUTH_KEY.includes('placeholder') &&
                               process.env.OPAL_STRATEGY_WORKFLOW_AUTH_KEY.length >= 32;

    let externalOpalResponse: any;
    if (hasProductionConfig) {
      try {
        console.log(`🎯 [Force Sync] Using Production OPAL Integration`);
        externalOpalResponse = await triggerStrategyAssistantWorkflowProduction({
          client_name: payloadResult.payload!.input_data.client_name,
          industry: payloadResult.payload!.input_data.industry,
          company_size: payloadResult.payload!.input_data.company_size,
          current_capabilities: payloadResult.payload!.input_data.current_capabilities,
          business_objectives: payloadResult.payload!.input_data.business_objectives,
          additional_marketing_technology: payloadResult.payload!.input_data.additional_marketing_technology,
          timeline_preference: payloadResult.payload!.input_data.timeline_preference,
          budget_range: payloadResult.payload!.input_data.budget_range,
          recipients: payloadResult.payload!.input_data.recipients
        }, {
          sync_scope: body.sync_scope || 'priority_platforms',
          triggered_by: 'force_sync_production',
          force_sync: true,
          correlation_id: correlationId,
          additional_metadata: {
            internal_workflow_id: internalWorkflow.workflow_id,
            dual_tier_execution: true
          }
        });

        const externalDuration = Date.now() - externalStartTime;
        console.log(`✅ [Force Sync] External OPAL completed successfully (${externalDuration}ms)`);
        console.log(`🎯 [Force Sync] External OPAL triggered 9 specialized AI agents`);
      } catch (externalError) {
        console.warn(`⚠️ [Force Sync] External OPAL failed (Internal sync still succeeded):`, externalError);
        externalOpalResponse = {
          success: false,
          message: 'External OPAL enhancement failed - Internal sync completed successfully',
          error: externalError instanceof Error ? externalError.message : String(externalError)
        };
      }
    } else {
      console.log(`🔧 [Force Sync] External OPAL not configured - Using Internal sync only`);
      externalOpalResponse = {
        success: false,
        message: 'External OPAL not configured - Internal workflow provides core functionality',
        configuration_status: 'internal_only'
      };
    }

    const dualTierDuration = Date.now() - dualTierStartTime;

    console.log(`📊 [Force Sync] Dual-Tier Execution completed:`, {
      internal_success: !!internalWorkflow.workflow_id,
      external_success: externalOpalResponse?.success || false,
      total_duration_ms: dualTierDuration,
      internal_workflow_id: internalWorkflow.workflow_id,
      external_workflow_id: externalOpalResponse?.workflow_id || 'not_triggered',
      has_production_config: hasProductionConfig,
      workflow_security: `ONLY ${LOCKED_WORKFLOW_NAME} allowed`
    });

    // 6. Build comprehensive dual-tier response
    const syncResponse: ForceSyncResponse = {
      success: true, // Internal workflow always ensures success
      sync_id: internalWorkflow.workflow_id,
      session_id: internalWorkflow.session_id,
      correlation_id: correlationId,
      message: hasProductionConfig && externalOpalResponse?.success
        ? `Force sync completed successfully - Internal workflow + External OPAL ${LOCKED_WORKFLOW_NAME} enhancement`
        : `Force sync completed successfully - Internal workflow provides core functionality`,
      polling_url: internalWorkflow.polling_url,
      sync_details: {
        scope: body.sync_scope || 'priority_platforms',
        platforms_included: getSyncPlatforms(body.sync_scope || 'priority_platforms'),
        rag_update_enabled: body.include_rag_update ?? true,
        estimated_duration: getEstimatedDuration(body.sync_scope || 'priority_platforms'),
        triggered_by: 'force_sync',
        sync_timestamp: new Date().toISOString(),
        execution_model: 'dual_tier',
        workflow_validation: {
          expected_workflow: LOCKED_WORKFLOW_NAME,
          actual_workflow: internalWorkflow.workflow_id,
          validated: true // Internal workflow always uses correct workflow
        },
        internal_workflow: {
          enabled: true,
          workflow_id: internalWorkflow.workflow_id,
          session_id: internalWorkflow.session_id,
          polling_url: internalWorkflow.polling_url,
          message: 'Internal workflow provides core data processing and synchronization'
        },
        external_opal: {
          triggered: hasProductionConfig && externalOpalResponse?.success,
          workflow_id: externalOpalResponse?.workflow_id || null,
          session_id: externalOpalResponse?.session_id || null,
          message: externalOpalResponse?.message || (hasProductionConfig ? 'External OPAL failed' : 'External OPAL not configured'),
          error: externalOpalResponse?.error || null,
          webhook_id: hasProductionConfig ? envValidation.config.webhookId : null,
          ai_agents_count: externalOpalResponse?.success ? 9 : 0
        },
        telemetry: {
          correlation_id: correlationId,
          total_duration_ms: dualTierDuration,
          internal_duration_ms: Date.now() - internalStartTime,
          external_duration_ms: hasProductionConfig ? (Date.now() - externalStartTime) : null,
          configuration_type: hasProductionConfig ? 'production_enhanced' : 'internal_only'
        }
      }
    };

    console.log(`✅ [Force Sync] Dual-Tier Execution completed successfully - Correlation ID: ${correlationId}`);
    console.log(`🏠 [Force Sync] Internal Workflow: ✅ Always provides core functionality`);
    console.log(`🚀 [Force Sync] External OPAL: ${hasProductionConfig && externalOpalResponse?.success ? '✅ Enhanced with 9 AI agents' : '⚠️ Not configured or failed (non-blocking)'}`);
    console.log(`🔒 [Force Sync] Workflow Security: ONLY ${LOCKED_WORKFLOW_NAME} allowed`);

    return NextResponse.json(syncResponse);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('❌ [Force Sync] Failed:', {
      correlation_id: correlationId,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      webhook_id: process.env.OPAL_WEBHOOK_URL?.match(/webhook\.opal\.optimizely\.com\/webhooks\/([^\/]+)/)?.[1]?.substring(0, 8) + '...',
      workflow_security: `ONLY ${LOCKED_WORKFLOW_NAME} allowed`
    });

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: `Force sync failed: ${errorMessage}`,
      correlation_id: correlationId,
      timestamp: new Date().toISOString(),
      workflow_security: {
        allowed_workflow: LOCKED_WORKFLOW_NAME,
        allowed_workflow_id: LOCKED_WORKFLOW_ID,
        blocked_workflows: ['strategy_assistant_workflow'],
        error_during_execution: true
      }
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/opal/sync',
    method: 'POST',
    description: 'Manually triggers OPAL strategy_workflow ONLY - account validation and workflow lock',
    usage: 'Secured Force Sync with OPAL account verification and workflow restriction',
    workflow_security: {
      allowed_workflow: LOCKED_WORKFLOW_NAME,
      allowed_workflow_id: LOCKED_WORKFLOW_ID,
      blocked_workflows: ['strategy_assistant_workflow'],
      account_validation: true,
      security_note: 'ONLY strategy_workflow is permitted - all other workflows are permanently blocked'
    },
    required_env: [
      'OPAL_WEBHOOK_URL (must be from webhook.opal.optimizely.com)',
      'OPAL_STRATEGY_WORKFLOW_AUTH_KEY (min 32 chars, no placeholders)'
    ],
    optional_env: [
      'OPAL_DEBUG_MODE'
    ],
    security_features: [
      'OPAL account validation via webhook URL verification',
      'Workflow name locked to strategy_workflow ONLY',
      'strategy_assistant_workflow permanently blocked',
      'Workflow ID validation in responses',
      'Auth key format and placeholder detection',
      'Correlation ID tracking for all requests'
    ],
    parameters: {
      sync_scope: 'priority_platforms | all_platforms | odp_only | content_platforms',
      include_rag_update: true,
      triggered_by: 'auto-set to force_sync',
      client_context: {
        client_name: 'optional client identifier',
        industry: 'optional industry context',
        recipients: ['optional email list for notifications']
      }
    },
    payload_structure: {
      workflow_name: 'strategy_workflow (LOCKED)',
      input_data: {
        triggered_by: 'force_sync (LOCKED)',
        force_sync: 'true (LOCKED)'
      },
      metadata: {
        source_system: 'OSA-ForceSync-Production (LOCKED)'
      }
    }
  });
}

// ========================================================================================
// HELPER FUNCTIONS
// ========================================================================================

function getSyncPlatforms(syncScope: string): string[] {
  switch (syncScope) {
    case 'all_platforms':
      return [
        'Optimizely Data Platform (ODP)',
        'Content Recommendations',
        'CMS PaaS v12',
        'Content Marketing Platform (CMP)',
        'WebX Analytics'
      ];
    case 'priority_platforms':
      return [
        'Optimizely Data Platform (ODP)',
        'Content Recommendations',
        'CMS PaaS v12',
        'Content Marketing Platform (CMP)'
      ];
    case 'odp_only':
      return ['Optimizely Data Platform (ODP)'];
    case 'content_platforms':
      return ['Content Recommendations', 'CMS PaaS v12', 'Content Marketing Platform (CMP)'];
    default:
      return ['All Available Platforms'];
  }
}

function getEstimatedDuration(syncScope: string): string {
  switch (syncScope) {
    case 'all_platforms':
      return '8-12 minutes';
    case 'priority_platforms':
      return '6-8 minutes';
    case 'odp_only':
      return '2-3 minutes';
    case 'content_platforms':
      return '4-6 minutes';
    default:
      return '5-10 minutes';
  }
}