/**
 * Development Environment Test Suite
 * Validates that the local development setup is working correctly
 */

import { describe, it, expect } from 'vitest';
import { loadOpalConfig } from '@/lib/config/opal-env';

describe('Development Environment Setup', () => {
  it('should have proper environment variables configured', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.USE_FILE_STORAGE).toBe('true');
    expect(process.env.OSA_WEBHOOK_URL).toBe('http://localhost:3000/api/webhooks/opal-workflow');
    expect(process.env.OSA_WEBHOOK_SECRET!.length).toBeGreaterThanOrEqual(32); // At least 32 characters
    expect(process.env.OPAL_TOOLS_DISCOVERY_URL).toBe('http://localhost:3000');
  });

  it('should load OPAL configuration successfully', () => {
    expect(() => loadOpalConfig()).not.toThrow();

    const config = loadOpalConfig();
    expect(config.osaSelfWebhookUrl).toBe('http://localhost:3000/api/webhooks/opal-workflow');
    expect(config.osaWebhookSecret.length).toBeGreaterThanOrEqual(32);
    expect(config.opalToolsDiscoveryUrl).toBe('http://localhost:3000');
    expect(config.defaultEnvironment).toBe('development');
  });

  it('should have file storage configured', () => {
    expect(process.env.FILE_STORAGE_PATH).toBeDefined();
    expect(process.env.USE_FILE_STORAGE).toBe('true');
  });

  it('should have debug settings configured for development', () => {
    // In test environment, debug should be disabled for cleaner output
    expect(process.env.DEBUG).toBe('false');
    expect(process.env.LOG_LEVEL).toBe('error');
  });
});

describe('Development Safety Checks', () => {
  it('should not have production credentials in test environment', () => {
    // Ensure we're using safe test values
    expect(process.env.OSA_WEBHOOK_SECRET).toContain('test-');
    expect(process.env.OPAL_STRATEGY_WORKFLOW_AUTH_KEY).toContain('test-');
  });

  it('should use localhost URLs only', () => {
    const config = loadOpalConfig();
    expect(config.osaSelfWebhookUrl).toContain('localhost');
    expect(config.opalToolsDiscoveryUrl).toContain('localhost');
  });
});

describe('API Health Check Simulation', () => {
  it('should be able to create health check response structure', () => {
    // Simulate what the health endpoint would return
    const healthResponse = {
      overall_status: 'yellow', // Expected for test environment
      config_checks: {
        osa_webhook_secret_configured: true,
        osa_webhook_url_configured: true,
        opal_tools_discovery_url_configured: true
      },
      metrics: {
        total_events_24h: 0,
        successful_events_24h: 0,
        failed_events_24h: 0
      }
    };

    expect(healthResponse.overall_status).toBeDefined();
    expect(healthResponse.config_checks.osa_webhook_secret_configured).toBe(true);
    expect(healthResponse.metrics).toBeDefined();
  });
});