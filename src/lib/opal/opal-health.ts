/**
 * OPAL Health Check Utilities
 * Functions to ping external OPAL services and check connectivity
 */

import { loadOpalConfig, getEnvironmentConfig } from '@/lib/config/opal-env';

export interface OpalHealthData {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    external_opal_api: HealthCheckResult;
    discovery_endpoint: HealthCheckResult;
    webhook_connectivity: HealthCheckResult;
    configuration: HealthCheckResult;
  };
  response_time_ms: number;
  error_details?: string[];
}

export interface HealthCheckResult {
  status: 'pass' | 'warn' | 'fail';
  response_time_ms?: number;
  last_check: string;
  details?: string;
  error?: string;
}

/**
 * Comprehensive OPAL health check that pings external services
 */
export async function checkOpalHealth(): Promise<OpalHealthData> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  const errorDetails: string[] = [];

  try {
    // Load configuration
    const config = loadOpalConfig();
    const envConfig = getEnvironmentConfig();

    // Run all health checks in parallel
    const [
      externalOpalCheck,
      discoveryCheck,
      webhookCheck,
      configCheck
    ] = await Promise.allSettled([
      checkExternalOpalAPI(config, envConfig),
      checkDiscoveryEndpoint(config),
      checkWebhookConnectivity(config),
      checkConfiguration(config)
    ]);

    // Process results
    const checks = {
      external_opal_api: getCheckResult(externalOpalCheck, 'External OPAL API'),
      discovery_endpoint: getCheckResult(discoveryCheck, 'Discovery Endpoint'),
      webhook_connectivity: getCheckResult(webhookCheck, 'Webhook Connectivity'),
      configuration: getCheckResult(configCheck, 'Configuration')
    };

    // Collect errors
    Object.entries(checks).forEach(([name, result]) => {
      if (result.status === 'fail' && result.error) {
        errorDetails.push(`${name}: ${result.error}`);
      }
    });

    // Determine overall status
    const failedChecks = Object.values(checks).filter(c => c.status === 'fail').length;
    const warnChecks = Object.values(checks).filter(c => c.status === 'warn').length;

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (failedChecks === 0 && warnChecks === 0) {
      overallStatus = 'healthy';
    } else if (failedChecks === 0 && warnChecks > 0) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'unhealthy';
    }

    return {
      status: overallStatus,
      timestamp,
      checks,
      response_time_ms: Date.now() - startTime,
      error_details: errorDetails.length > 0 ? errorDetails : undefined
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during health check';
    errorDetails.push(`Health check failed: ${errorMessage}`);

    return {
      status: 'unhealthy',
      timestamp,
      checks: {
        external_opal_api: createFailedCheck(errorMessage),
        discovery_endpoint: createFailedCheck(errorMessage),
        webhook_connectivity: createFailedCheck(errorMessage),
        configuration: createFailedCheck(errorMessage)
      },
      response_time_ms: Date.now() - startTime,
      error_details: errorDetails
    };
  }
}

/**
 * Check external OPAL API connectivity
 */
async function checkExternalOpalAPI(config: any, envConfig: any): Promise<HealthCheckResult> {
  const startTime = Date.now();

  if (!config.opalWebhookUrl || !config.opalAuthKey) {
    return {
      status: 'warn',
      last_check: new Date().toISOString(),
      details: 'External OPAL API not configured - using internal health checks only'
    };
  }

  try {
    // Try to ping external OPAL API health endpoint if available
    const healthUrl = config.opalWebhookUrl.replace('/webhooks/', '/health/') || `${config.opalWebhookUrl}/health`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), envConfig.timeout || 10000);

    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.opalAuthKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'OSA-Health-Check/1.0'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      return {
        status: 'pass',
        response_time_ms: responseTime,
        last_check: new Date().toISOString(),
        details: `External OPAL API responding (${response.status})`
      };
    } else {
      return {
        status: 'warn',
        response_time_ms: responseTime,
        last_check: new Date().toISOString(),
        details: `External OPAL API returned ${response.status}`,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }

  } catch (error) {
    return {
      status: 'fail',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Failed to connect to external OPAL API'
    };
  }
}

/**
 * Check OPAL discovery endpoint
 */
async function checkDiscoveryEndpoint(config: any): Promise<HealthCheckResult> {
  const startTime = Date.now();

  if (!config.opalToolsDiscoveryUrl) {
    return {
      status: 'fail',
      last_check: new Date().toISOString(),
      error: 'OPAL tools discovery URL not configured'
    };
  }

  try {
    // Try a simple connectivity check to the discovery endpoint
    const discoveryUrl = config.opalToolsDiscoveryUrl;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(discoveryUrl, {
      method: 'HEAD', // Use HEAD to minimize data transfer
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const responseTime = Date.now() - startTime;

    if (response.ok || response.status === 404) { // 404 is acceptable for discovery endpoint
      return {
        status: 'pass',
        response_time_ms: responseTime,
        last_check: new Date().toISOString(),
        details: `Discovery endpoint reachable (${response.status})`
      };
    } else {
      return {
        status: 'warn',
        response_time_ms: responseTime,
        last_check: new Date().toISOString(),
        details: `Discovery endpoint returned ${response.status}`,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }

  } catch (error) {
    return {
      status: 'fail',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Failed to reach discovery endpoint'
    };
  }
}

/**
 * Check webhook connectivity (internal validation)
 */
async function checkWebhookConnectivity(config: any): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    // Validate webhook configuration
    if (!config.osaSelfWebhookUrl) {
      return {
        status: 'fail',
        last_check: new Date().toISOString(),
        error: 'Webhook URL not configured'
      };
    }

    if (!config.osaWebhookSecret || config.osaWebhookSecret.length < 32) {
      return {
        status: 'fail',
        last_check: new Date().toISOString(),
        error: 'Webhook secret not configured or too short (minimum 32 characters)'
      };
    }

    // For internal webhook, we can't easily test connectivity without triggering actual webhooks
    // So we validate the URL format and configuration instead
    const webhookUrl = new URL(config.osaSelfWebhookUrl);

    if (!['http:', 'https:'].includes(webhookUrl.protocol)) {
      return {
        status: 'fail',
        last_check: new Date().toISOString(),
        error: 'Invalid webhook URL protocol (must be http or https)'
      };
    }

    return {
      status: 'pass',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
      details: 'Webhook configuration valid'
    };

  } catch (error) {
    return {
      status: 'fail',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Webhook configuration validation failed'
    };
  }
}

/**
 * Check configuration completeness
 */
async function checkConfiguration(config: any): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    const requiredFields = [
      'osaSelfWebhookUrl',
      'osaWebhookSecret',
      'opalToolsDiscoveryUrl'
    ];

    const missingFields = requiredFields.filter(field => !config[field]);
    const issues: string[] = [];

    if (missingFields.length > 0) {
      issues.push(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Additional validation
    if (config.osaWebhookSecret && config.osaWebhookSecret.length < 32) {
      issues.push('Webhook secret too short (minimum 32 characters)');
    }

    if (config.opalToolsDiscoveryUrl && !config.opalToolsDiscoveryUrl.startsWith('https://')) {
      issues.push('Discovery URL should use HTTPS in production');
    }

    if (issues.length === 0) {
      return {
        status: 'pass',
        response_time_ms: Date.now() - startTime,
        last_check: new Date().toISOString(),
        details: 'All required configuration present and valid'
      };
    } else if (issues.some(issue => issue.includes('Missing required fields'))) {
      return {
        status: 'fail',
        response_time_ms: Date.now() - startTime,
        last_check: new Date().toISOString(),
        error: issues.join('; '),
        details: 'Critical configuration issues detected'
      };
    } else {
      return {
        status: 'warn',
        response_time_ms: Date.now() - startTime,
        last_check: new Date().toISOString(),
        details: issues.join('; ')
      };
    }

  } catch (error) {
    return {
      status: 'fail',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Configuration check failed'
    };
  }
}

/**
 * Helper function to extract result from Promise.allSettled
 */
function getCheckResult(settledResult: PromiseSettledResult<HealthCheckResult>, checkName: string): HealthCheckResult {
  if (settledResult.status === 'fulfilled') {
    return settledResult.value;
  } else {
    return createFailedCheck(`${checkName} check threw an error: ${settledResult.reason}`);
  }
}

/**
 * Helper function to create a failed check result
 */
function createFailedCheck(error: string): HealthCheckResult {
  return {
    status: 'fail',
    last_check: new Date().toISOString(),
    error,
    details: 'Health check failed to execute'
  };
}

/**
 * Simple ping function for basic connectivity test
 */
export async function pingOpalService(url: string, timeoutMs: number = 5000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    return response.ok || response.status === 404; // 404 can be acceptable for some endpoints

  } catch (error) {
    return false;
  }
}