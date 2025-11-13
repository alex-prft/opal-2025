/**
 * Environment Configuration for OSA Force Sync
 *
 * Centralized configuration management with environment-specific overrides
 * and validation for production deployment.
 */

export interface OpalConfig {
  webhook: {
    url: string;
    authKey: string;
    timeout: number;
    retryAttempts: number;
    retryBaseDelay: number;
  };
  security: {
    hmacSecret: string;
    bearerToken?: string;
  };
  app: {
    baseUrl: string;
    environment: 'development' | 'staging' | 'production';
    debugMode: boolean;
  };
  database: {
    url?: string;
    connectionPoolSize: number;
  };
}

class ConfigManager {
  private config: OpalConfig;

  constructor() {
    this.config = this.buildConfig();
    this.validateConfig();
  }

  private buildConfig(): OpalConfig {
    const env = process.env.NODE_ENV as 'development' | 'staging' | 'production' || 'development';

    return {
      webhook: {
        // Use the exact webhook URL provided - DO NOT CHANGE
        url: process.env.OPAL_WEBHOOK_URL ||
             'https://webhook.opal.optimizely.com/webhooks/d3e181a30acf493bb65a5c7792cfeced/ba71d62d-aa74-4bbf-9ab8-a1a11ed4bf14',
        authKey: this.getRequiredEnv('OPAL_STRATEGY_WORKFLOW_AUTH_KEY'),
        timeout: parseInt(process.env.OPAL_TIMEOUT_MS || '45000'),
        retryAttempts: parseInt(process.env.OPAL_RETRY_ATTEMPTS || '3'),
        retryBaseDelay: parseInt(process.env.OPAL_RETRY_BASE_DELAY_MS || '1000'),
      },
      security: {
        hmacSecret: this.getRequiredEnv('OSA_WEBHOOK_SHARED_SECRET'),
        bearerToken: process.env.OSA_BEARER_TOKEN,
      },
      app: {
        baseUrl: this.getBaseUrl(),
        environment: env,
        debugMode: process.env.OPAL_DEBUG_MODE === 'true',
      },
      database: {
        url: process.env.DATABASE_URL,
        connectionPoolSize: parseInt(process.env.DB_POOL_SIZE || '10'),
      },
    };
  }

  private getRequiredEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Required environment variable ${key} is not set`);
    }
    return value;
  }

  private getBaseUrl(): string {
    if (process.env.BASE_URL) {
      return process.env.BASE_URL;
    }

    // Auto-detect based on environment
    switch (process.env.NODE_ENV) {
      case 'production':
        return process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : 'https://your-app.vercel.app';
      case 'staging':
        return 'https://staging-app.vercel.app';
      default:
        return 'http://localhost:3000';
    }
  }

  private validateConfig(): void {
    const errors: string[] = [];

    // Validate webhook URL format
    try {
      new URL(this.config.webhook.url);
    } catch {
      errors.push('Invalid OPAL_WEBHOOK_URL format');
    }

    // Validate auth key length
    if (this.config.webhook.authKey.length < 32) {
      errors.push('OPAL_STRATEGY_WORKFLOW_AUTH_KEY must be at least 32 characters');
    }

    // Validate HMAC secret
    if (this.config.security.hmacSecret.length < 32) {
      errors.push('OSA_WEBHOOK_SHARED_SECRET must be at least 32 characters');
    }

    // Production-specific validations
    if (this.config.app.environment === 'production') {
      if (this.config.webhook.authKey.includes('placeholder')) {
        errors.push('Production environment cannot use placeholder auth key');
      }

      if (this.config.security.hmacSecret.includes('placeholder')) {
        errors.push('Production environment cannot use placeholder HMAC secret');
      }

      if (!this.config.app.baseUrl.startsWith('https://')) {
        errors.push('Production environment must use HTTPS');
      }
    }

    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }
  }

  public getConfig(): OpalConfig {
    return { ...this.config };
  }

  public getWebhookUrl(): string {
    return this.config.webhook.url;
  }

  public getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.config.webhook.authKey}`,
      'Content-Type': 'application/json',
      'User-Agent': `OSA-ForceSync/${this.config.app.environment}`,
    };
  }

  public isDebugMode(): boolean {
    return this.config.app.debugMode;
  }

  public isDevelopment(): boolean {
    return this.config.app.environment === 'development';
  }

  public isProduction(): boolean {
    return this.config.app.environment === 'production';
  }
}

// Singleton instance
let configInstance: ConfigManager | null = null;

export function getConfig(): OpalConfig {
  if (!configInstance) {
    configInstance = new ConfigManager();
  }
  return configInstance.getConfig();
}

export function getConfigManager(): ConfigManager {
  if (!configInstance) {
    configInstance = new ConfigManager();
  }
  return configInstance;
}

// Export for testing
export { ConfigManager };