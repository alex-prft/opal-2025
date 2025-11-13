/**
 * Vitest test setup configuration for OPAL/OSA development
 */

import { vi } from 'vitest';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.BASE_URL = 'http://localhost:3000';
process.env.USE_FILE_STORAGE = 'true';
process.env.FILE_STORAGE_PATH = './data/test';

// Required OPAL Health Check Variables for testing
process.env.OSA_WEBHOOK_URL = 'http://localhost:3000/api/webhooks/opal-workflow';
process.env.OSA_WEBHOOK_SECRET = 'test-webhook-secret-32-chars-minimum-for-hmac';
process.env.OPAL_TOOLS_DISCOVERY_URL = 'http://localhost:3000';

// Additional test configuration
process.env.OPAL_STRATEGY_WORKFLOW_AUTH_KEY = 'test-strategy-workflow-key-32-chars';
process.env.DEBUG = 'false';
process.env.LOG_LEVEL = 'error';

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  debug: vi.fn()
};

// Mock fetch for tests that don't actually hit the API
global.fetch = vi.fn();

// Setup global beforeEach and afterEach
beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
});

afterEach(() => {
  // Clean up after each test
  vi.restoreAllMocks();
});

// Create test data directory if it doesn't exist
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const testDataDir = './data/test';
if (!existsSync(testDataDir)) {
  mkdirSync(testDataDir, { recursive: true });
}

// Create empty test JSON files
const testFiles = [
  'workflows.json',
  'webhook-events.json',
  'performance-metrics.json'
];

testFiles.forEach(file => {
  const filePath = join(testDataDir, file);
  if (!existsSync(filePath)) {
    writeFileSync(filePath, '[]');
  }
});

console.log('✅ Vitest setup completed - Local development test environment ready');