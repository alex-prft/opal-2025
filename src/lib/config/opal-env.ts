/**
 * OPAL Environment Configuration
 * Production-grade environment variable loader with validation and type safety
 */

export interface OpalConfig {
  // Webhook configuration
  osaSelfWebhookUrl: string;          // Where OSA receives webhook callbacks
  osaWebhookSecret: string;           // HMAC secret for signature verification
  opalToolsDiscoveryUrl: string;      // Public URL for OPAL agent discovery

  // Environment settings
  defaultEnvironment: 'development' | 'staging' | 'production';
  diagnosticsLimitDefault: number;

  // External OPAL integration
  opalWebhookUrl?: string;           // External OPAL webhook URL (optional)
  opalAuthKey?: string;              // Auth key for external OPAL calls
}

export interface EnvironmentConfig {
  baseUrl: string;
  apiUrl: string;
  webhookUrl: string;
  timeout: number;
  retries: number;
  authKey: string;
}

/**
 * Load and validate OPAL configuration from environment variables
 * Fails fast if critical configuration is missing
 */
export function loadOpalConfig(): OpalConfig {
  const errors: string[] = [];

  // Required configuration
  const osaSelfWebhookUrl = process.env.OSA_WEBHOOK_URL;
  const osaWebhookSecret = process.env.OSA_WEBHOOK_SECRET;
  const opalToolsDiscoveryUrl = process.env.OPAL_TOOLS_DISCOVERY_URL;

  if (!osaSelfWebhookUrl) {
    errors.push('OSA_WEBHOOK_URL is required');
  }

  if (!osaWebhookSecret) {
    errors.push('OSA_WEBHOOK_SECRET is required');
  }

  if (!opalToolsDiscoveryUrl) {
    errors.push('OPAL_TOOLS_DISCOVERY_URL is required');
  }

  // Optional configuration with defaults
  const defaultEnvironmentRaw = process.env.DEFAULT_ENVIRONMENT || 'development';
  const defaultEnvironment = ['development', 'staging', 'production'].includes(defaultEnvironmentRaw)
    ? defaultEnvironmentRaw as 'development' | 'staging' | 'production'
    : 'development';

  const diagnosticsLimitDefault = parseInt(process.env.DIAGNOSTICS_LIMIT_DEFAULT || '25', 10);

  // External OPAL integration (optional)
  const opalWebhookUrl = process.env.OPAL_WEBHOOK_URL;
  const opalAuthKey = process.env.OPAL_STRATEGY_WORKFLOW_AUTH_KEY;

  if (errors.length > 0) {
    throw new Error(`OPAL Configuration validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}`);
  }

  return {
    osaSelfWebhookUrl: osaSelfWebhookUrl!,
    osaWebhookSecret: osaWebhookSecret!,
    opalToolsDiscoveryUrl: opalToolsDiscoveryUrl!,
    defaultEnvironment,
    diagnosticsLimitDefault,
    opalWebhookUrl,
    opalAuthKey
  };
}

/**
 * Get environment-aware configuration
 */
export function getEnvironmentConfig(targetEnv?: string): EnvironmentConfig {
  const env = targetEnv || process.env.NODE_ENV || 'development';
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

  const configs: Record<string, EnvironmentConfig> = {
    development: {
      baseUrl: 'http://localhost:3000',
      apiUrl: 'http://localhost:3000/api',
      webhookUrl: 'http://localhost:3000/api/webhooks/opal-workflow',
      timeout: 30000,
      retries: 3,
      authKey: process.env.OPAL_STRATEGY_WORKFLOW_AUTH_KEY || 'dev-fallback-key'
    },
    staging: {
      baseUrl,
      apiUrl: `${baseUrl}/api`,
      webhookUrl: `${baseUrl}/api/webhooks/opal-workflow`,
      timeout: 45000,
      retries: 5,
      authKey: process.env.OPAL_STRATEGY_WORKFLOW_AUTH_KEY || 'staging-fallback-key'
    },
    production: {
      baseUrl,
      apiUrl: `${baseUrl}/api`,
      webhookUrl: `${baseUrl}/api/webhooks/opal-workflow`,
      timeout: 60000,
      retries: 5,
      authKey: process.env.OPAL_STRATEGY_WORKFLOW_AUTH_KEY || 'prod-fallback-key'
    }
  };

  return configs[env] || configs.development;
}

/**
 * Validate configuration on application boot
 * Call this in your app startup to fail fast on misconfiguration
 */
export function validateOpalConfigOnBoot(): void {
  try {
    const config = loadOpalConfig();
    console.log('✅ OPAL Configuration validated successfully');
    console.log(`   - Environment: ${config.defaultEnvironment}`);
    console.log(`   - Discovery URL: ${config.opalToolsDiscoveryUrl}`);
    console.log(`   - Webhook URL: ${config.osaSelfWebhookUrl}`);
    console.log(`   - External OPAL: ${config.opalWebhookUrl ? 'Configured' : 'Not configured'}`);
  } catch (error) {
    console.error('❌ OPAL Configuration validation failed:', error);
    throw error;
  }
}