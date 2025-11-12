/**
 * Diagnostics API: Last Webhook Attempts
 *
 * Provides comprehensive diagnostics for troubleshooting OPAL webhook integration issues.
 * Shows recent webhook attempts, failures, authentication issues, and configuration problems.
 */

import { NextRequest, NextResponse } from 'next/server';
import { workflowDb } from '@/lib/database/workflow-operations';

// In-memory storage for recent webhook attempts (for development/debugging)
// In production, this would be stored in database or external logging service
let recentWebhookAttempts: WebhookAttempt[] = [];
const MAX_STORED_ATTEMPTS = 50;

interface WebhookAttempt {
  id: string;
  timestamp: string;
  webhook_url: string;
  method: string;
  headers: Record<string, string>;
  payload_size_bytes: number;
  response_status?: number;
  response_time_ms?: number;
  success: boolean;
  error_message?: string;
  correlation_id?: string;
  span_id?: string;
  source: 'force_sync' | 'custom_tools' | 'manual';
  environment: string;
  auth_method: 'bearer' | 'hmac' | 'none';
  payload_summary: any;
}

// Store webhook attempt for diagnostics
export function logWebhookAttempt(attempt: Omit<WebhookAttempt, 'id' | 'timestamp'>) {
  const diagnosticEntry: WebhookAttempt = {
    id: `webhook-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    timestamp: new Date().toISOString(),
    ...attempt
  };

  // Add to in-memory storage
  recentWebhookAttempts.unshift(diagnosticEntry);

  // Limit storage size
  if (recentWebhookAttempts.length > MAX_STORED_ATTEMPTS) {
    recentWebhookAttempts = recentWebhookAttempts.slice(0, MAX_STORED_ATTEMPTS);
  }

  console.log(`📊 [Webhook Diagnostics] Logged attempt: ${diagnosticEntry.id}`, {
    success: attempt.success,
    status: attempt.response_status,
    duration: attempt.response_time_ms,
    source: attempt.source
  });
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const source = searchParams.get('source') as 'force_sync' | 'custom_tools' | 'manual' | null;
    const success = searchParams.get('success');

    console.log(`🔍 [Webhook Diagnostics] Retrieving webhook attempts`, {
      limit,
      source,
      success_filter: success
    });

    // Filter attempts based on query parameters
    let filteredAttempts = [...recentWebhookAttempts];

    if (source) {
      filteredAttempts = filteredAttempts.filter(attempt => attempt.source === source);
    }

    if (success !== null) {
      const successBoolean = success === 'true';
      filteredAttempts = filteredAttempts.filter(attempt => attempt.success === successBoolean);
    }

    // Limit results
    const limitedAttempts = filteredAttempts.slice(0, limit);

    // Get database-stored Force Sync attempts for additional context
    let databaseAttempts = [];
    try {
      databaseAttempts = await workflowDb.getRecentForceSyncAttempts(10);
    } catch (dbError) {
      console.warn('⚠️ [Webhook Diagnostics] Could not retrieve database attempts:', dbError);
    }

    // Analyze patterns and issues
    const diagnosticSummary = analyzeWebhookAttempts(filteredAttempts);

    // Current environment configuration
    const currentConfig = {
      node_env: process.env.NODE_ENV || 'development',
      opal_target_env: process.env.OPAL_TARGET_ENV,
      opal_webhook_url: process.env.OPAL_WEBHOOK_URL ?
        `${process.env.OPAL_WEBHOOK_URL.substring(0, 30)}...` : 'NOT_CONFIGURED',
      opal_auth_configured: !!(process.env.OPAL_STRATEGY_WORKFLOW_AUTH_KEY || process.env.OPAL_WEBHOOK_AUTH_KEY)
      // opal_workspace_id removed per user request
    };

    const diagnosticsResponse = {
      summary: {
        total_attempts_stored: recentWebhookAttempts.length,
        filtered_results: limitedAttempts.length,
        database_attempts: databaseAttempts.length,
        last_attempt: recentWebhookAttempts[0]?.timestamp || 'No attempts recorded',
        diagnostic_analysis: diagnosticSummary
      },

      current_configuration: currentConfig,

      recent_webhook_attempts: limitedAttempts.map(attempt => ({
        ...attempt,
        // Mask sensitive information
        headers: maskSensitiveHeaders(attempt.headers),
        payload_summary: attempt.payload_summary
      })),

      database_force_sync_attempts: databaseAttempts.slice(0, 5).map(attempt => ({
        span_id: attempt.span_id,
        correlation_id: attempt.correlation_id,
        started_at: attempt.started_at,
        status: attempt.status,
        success: attempt.success,
        duration_ms: attempt.duration_ms,
        sync_scope: attempt.sync_scope,
        triggered_by: attempt.triggered_by,
        external_opal_triggered: attempt.external_opal_triggered,
        error_message: attempt.error_message
      })),

      troubleshooting_guidance: generateTroubleshootingGuidance(diagnosticSummary, currentConfig),

      debug_endpoints: {
        force_sync_test: '/api/opal/sync',
        enhanced_tools_discovery: '/api/opal/enhanced-tools',
        mock_webhook_test: '/api/webhooks/opal-mock-test'
      },

      timestamp: new Date().toISOString()
    };

    return NextResponse.json(diagnosticsResponse);

  } catch (error) {
    console.error('❌ [Webhook Diagnostics] Diagnostics endpoint failed:', error);

    return NextResponse.json({
      success: false,
      error: 'Diagnostics retrieval failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'clear_attempts') {
      const previousCount = recentWebhookAttempts.length;
      recentWebhookAttempts = [];

      console.log(`🗑️ [Webhook Diagnostics] Cleared ${previousCount} stored webhook attempts`);

      return NextResponse.json({
        success: true,
        message: `Cleared ${previousCount} webhook attempts from diagnostic storage`,
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'test_configuration') {
      // Test current webhook configuration
      const configTest = await testWebhookConfiguration();

      return NextResponse.json({
        success: true,
        configuration_test: configTest,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Unknown action',
      available_actions: ['clear_attempts', 'test_configuration']
    }, { status: 400 });

  } catch (error) {
    console.error('❌ [Webhook Diagnostics] POST action failed:', error);

    return NextResponse.json({
      success: false,
      error: 'Diagnostics action failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function analyzeWebhookAttempts(attempts: WebhookAttempt[]) {
  if (attempts.length === 0) {
    return {
      status: 'no_data',
      message: 'No webhook attempts recorded yet'
    };
  }

  const successfulAttempts = attempts.filter(a => a.success);
  const failedAttempts = attempts.filter(a => !a.success);
  const recentAttempts = attempts.filter(a =>
    new Date(a.timestamp).getTime() > Date.now() - (30 * 60 * 1000) // Last 30 minutes
  );

  // Common failure patterns
  const authFailures = failedAttempts.filter(a =>
    a.response_status === 401 || a.response_status === 403
  );
  const timeoutFailures = failedAttempts.filter(a =>
    a.error_message?.includes('timeout') || a.error_message?.includes('AbortError')
  );
  const networkFailures = failedAttempts.filter(a =>
    a.error_message?.includes('network') || a.error_message?.includes('ENOTFOUND')
  );

  return {
    success_rate: attempts.length > 0 ? (successfulAttempts.length / attempts.length * 100).toFixed(1) : '0',
    total_attempts: attempts.length,
    successful_attempts: successfulAttempts.length,
    failed_attempts: failedAttempts.length,
    recent_attempts_30min: recentAttempts.length,
    average_response_time: attempts
      .filter(a => a.response_time_ms)
      .reduce((sum, a) => sum + (a.response_time_ms || 0), 0) /
      Math.max(attempts.filter(a => a.response_time_ms).length, 1),
    failure_patterns: {
      auth_failures: authFailures.length,
      timeout_failures: timeoutFailures.length,
      network_failures: networkFailures.length,
      other_failures: failedAttempts.length - authFailures.length - timeoutFailures.length - networkFailures.length
    },
    most_recent_error: failedAttempts[0]?.error_message || 'No recent failures'
  };
}

function maskSensitiveHeaders(headers: Record<string, string>) {
  const maskedHeaders = { ...headers };

  // Mask authorization header
  if (maskedHeaders.Authorization) {
    maskedHeaders.Authorization = `Bearer ${maskedHeaders.Authorization.substring(7, 15)}...`;
  }

  // Mask other sensitive headers
  Object.keys(maskedHeaders).forEach(key => {
    if (key.toLowerCase().includes('secret') || key.toLowerCase().includes('token')) {
      maskedHeaders[key] = `${maskedHeaders[key].substring(0, 8)}...`;
    }
  });

  return maskedHeaders;
}

function generateTroubleshootingGuidance(analysis: any, config: any) {
  const guidance = [];

  // Check configuration issues
  if (!config.opal_auth_configured) {
    guidance.push({
      level: 'CRITICAL',
      issue: 'Missing OPAL authentication configuration',
      solution: 'Set OPAL_STRATEGY_WORKFLOW_AUTH_KEY or OPAL_WEBHOOK_AUTH_KEY in your environment variables',
      docs_link: '/OPAL_CONFIGURATION.md#authentication'
    });
  }

  if (config.opal_webhook_url === 'NOT_CONFIGURED') {
    guidance.push({
      level: 'CRITICAL',
      issue: 'Missing OPAL webhook URL configuration',
      solution: 'Set OPAL_WEBHOOK_URL to your production OPAL webhook endpoint',
      docs_link: '/OPAL_CONFIGURATION.md#webhook-url'
    });
  }

  // Check failure patterns
  if (analysis.failure_patterns?.auth_failures > 0) {
    guidance.push({
      level: 'HIGH',
      issue: 'Authentication failures detected',
      solution: 'Verify your OPAL auth token is correct and not expired',
      docs_link: '/OPAL_CONFIGURATION.md#troubleshooting-auth'
    });
  }

  if (analysis.failure_patterns?.timeout_failures > 0) {
    guidance.push({
      level: 'MEDIUM',
      issue: 'Timeout failures detected',
      solution: 'Check network connectivity to OPAL webhook endpoint or increase timeout values',
      docs_link: '/OPAL_CONFIGURATION.md#timeout-configuration'
    });
  }

  if (analysis.success_rate < 50 && analysis.total_attempts > 5) {
    guidance.push({
      level: 'HIGH',
      issue: 'Low webhook success rate',
      solution: 'Review error patterns and check OPAL endpoint health',
      docs_link: '/OPAL_CONFIGURATION.md#troubleshooting'
    });
  }

  if (guidance.length === 0) {
    guidance.push({
      level: 'INFO',
      issue: 'No critical issues detected',
      solution: 'Webhook integration appears to be working correctly',
      docs_link: '/OPAL_CONFIGURATION.md'
    });
  }

  return guidance;
}

async function testWebhookConfiguration() {
  const config = {
    webhook_url: process.env.OPAL_WEBHOOK_URL,
    auth_key: process.env.OPAL_STRATEGY_WORKFLOW_AUTH_KEY || process.env.OPAL_WEBHOOK_AUTH_KEY,
    // workspace_id removed per user request
    environment: process.env.NODE_ENV
  };

  const tests = [];

  // Test 1: Configuration completeness
  tests.push({
    test: 'configuration_completeness',
    result: !!(config.webhook_url && config.auth_key),
    details: {
      webhook_url_configured: !!config.webhook_url,
      auth_key_configured: !!config.auth_key,
      workspace_id_configured: !!config.workspace_id
    }
  });

  // Test 2: URL format validation
  if (config.webhook_url) {
    try {
      new URL(config.webhook_url);
      tests.push({
        test: 'webhook_url_format',
        result: true,
        details: 'Webhook URL format is valid'
      });
    } catch {
      tests.push({
        test: 'webhook_url_format',
        result: false,
        details: 'Webhook URL format is invalid'
      });
    }
  }

  // Test 3: Auth key length validation
  if (config.auth_key) {
    tests.push({
      test: 'auth_key_strength',
      result: config.auth_key.length >= 32,
      details: `Auth key length: ${config.auth_key.length} characters (minimum 32 recommended)`
    });
  }

  return {
    overall_status: tests.every(t => t.result) ? 'PASS' : 'FAIL',
    tests,
    configuration_summary: {
      ...config,
      auth_key: config.auth_key ? `${config.auth_key.substring(0, 8)}...` : 'NOT_SET'
    }
  };
}