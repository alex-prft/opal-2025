/**
 * HMAC Diagnostics API
 * Provides HMAC signature validation diagnostics and testing capabilities
 */

import { NextRequest, NextResponse } from 'next/server';
import { loadOpalConfig } from '@/lib/config/opal-env';
import { validateHmacSetup, testHmacValidation, generateWebhookSignature } from '@/lib/security/hmac';
import { WebhookDatabase } from '@/lib/storage/webhook-database';

/**
 * GET /api/admin/hmac-diagnostics - HMAC Configuration Diagnostics
 * Returns comprehensive HMAC configuration status and validation results
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const includeTests = searchParams.get('tests') === 'true';

    // Load configuration
    let config;
    let configError = null;
    try {
      config = loadOpalConfig();
    } catch (error) {
      configError = error instanceof Error ? error.message : 'Unknown config error';
    }

    // Get recent webhook statistics
    const webhookStats = await WebhookDatabase.getEventStats();

    // Validate HMAC setup
    const setupValidation = validateHmacSetup(config?.osaWebhookSecret);

    // Environment information
    const environmentInfo = {
      node_env: process.env.NODE_ENV,
      skip_hmac_verification: process.env.SKIP_HMAC_VERIFICATION === 'true',
      webhook_secret_configured: !!process.env.OSA_WEBHOOK_SECRET,
      webhook_secret_length: process.env.OSA_WEBHOOK_SECRET?.length || 0,
      config_loaded: !configError
    };

    // Test results (if requested)
    let testResults = null;
    if (includeTests && config?.osaWebhookSecret) {
      testResults = {
        basic_test: testHmacValidation('test payload for diagnostics', config.osaWebhookSecret),
        json_test: testHmacValidation(JSON.stringify({ test: 'data', timestamp: Date.now() }), config.osaWebhookSecret),
        empty_test: testHmacValidation('', config.osaWebhookSecret)
      };
    }

    // Recent failure analysis
    const recentEvents = await WebhookDatabase.getFilteredEvents({
      limit: 10,
      status: 'failure',
      hours: 24
    });

    const failurePatterns = recentEvents.events.reduce((patterns: Record<string, number>, event) => {
      if (event.error_details) {
        const errorType = event.error_details.split(':')[0] || 'unknown';
        patterns[errorType] = (patterns[errorType] || 0) + 1;
      }
      return patterns;
    }, {});

    return NextResponse.json({
      status: 'success',
      hmac_diagnostics: {
        configuration: {
          valid: setupValidation.isValid,
          issues: setupValidation.issues,
          recommendations: setupValidation.recommendations,
          config_error: configError
        },
        environment: environmentInfo,
        webhook_statistics: {
          total_events_24h: webhookStats.total_events_24h,
          successful_events_24h: webhookStats.successful_events_24h,
          failed_events_24h: webhookStats.failed_events_24h,
          signature_valid_rate: webhookStats.signature_valid_rate,
          signature_valid_count: webhookStats.signature_valid_count
        },
        recent_failures: {
          failure_count: recentEvents.total_count,
          failure_patterns: failurePatterns,
          sample_events: recentEvents.events.slice(0, 5).map(event => ({
            id: event.id,
            received_at: event.received_at,
            error_details: event.error_details,
            payload_size: event.payload_size_bytes
          }))
        },
        test_results: testResults,
        recommendations: {
          immediate_actions: getImmediateRecommendations(setupValidation, webhookStats),
          configuration_improvements: getConfigurationImprovements(environmentInfo, setupValidation)
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('HMAC Diagnostics error:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Failed to run HMAC diagnostics',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * POST /api/admin/hmac-diagnostics - Test HMAC Signature Validation
 * Allows testing HMAC validation with custom payloads
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { test_payload, custom_secret } = body;

    if (!test_payload) {
      return NextResponse.json({
        error: 'test_payload is required'
      }, { status: 400 });
    }

    // Use custom secret or configured secret
    let secret = custom_secret;
    if (!secret) {
      try {
        const config = loadOpalConfig();
        secret = config.osaWebhookSecret;
      } catch (error) {
        return NextResponse.json({
          error: 'No secret available for testing',
          message: 'Either provide custom_secret or configure OSA_WEBHOOK_SECRET'
        }, { status: 400 });
      }
    }

    // Run the test
    const testResult = testHmacValidation(test_payload, secret);

    return NextResponse.json({
      status: 'success',
      test_result: testResult,
      input: {
        payload_length: Buffer.from(test_payload).length,
        secret_length: secret.length,
        custom_secret_used: !!custom_secret
      }
    });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: 'HMAC test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Generate immediate action recommendations based on diagnostics
 */
function getImmediateRecommendations(
  setupValidation: ReturnType<typeof validateHmacSetup>,
  webhookStats: { signature_valid_rate: number; failed_events_24h: number }
): string[] {
  const recommendations: string[] = [];

  if (webhookStats.signature_valid_rate < 0.5) {
    recommendations.push('CRITICAL: Signature validation rate is below 50% - check webhook secret configuration');
  } else if (webhookStats.signature_valid_rate < 0.8) {
    recommendations.push('WARNING: Signature validation rate is below 80% - review HMAC setup');
  }

  if (webhookStats.failed_events_24h > 10) {
    recommendations.push(`High failure rate: ${webhookStats.failed_events_24h} failed events in 24h - investigate error patterns`);
  }

  if (!setupValidation.isValid) {
    recommendations.push('Fix HMAC configuration issues: ' + setupValidation.issues.join(', '));
  }

  if (recommendations.length === 0) {
    recommendations.push('HMAC configuration appears healthy - monitor for continued stability');
  }

  return recommendations;
}

/**
 * Generate configuration improvement recommendations
 */
function getConfigurationImprovements(
  environmentInfo: any,
  setupValidation: ReturnType<typeof validateHmacSetup>
): string[] {
  const improvements: string[] = [];

  if (environmentInfo.skip_hmac_verification && environmentInfo.node_env === 'production') {
    improvements.push('SECURITY RISK: HMAC verification is disabled in production');
  }

  if (environmentInfo.webhook_secret_length > 0 && environmentInfo.webhook_secret_length < 32) {
    improvements.push('Use a longer webhook secret (minimum 32 characters) for better security');
  }

  if (setupValidation.recommendations.length > 0) {
    improvements.push(...setupValidation.recommendations);
  }

  improvements.push('Consider implementing webhook signature rotation for enhanced security');
  improvements.push('Monitor signature validation rates regularly for anomaly detection');

  return improvements;
}