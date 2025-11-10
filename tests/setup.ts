/**
 * Vitest test setup configuration
 */

import { vi } from 'vitest';

// Set test environment variables
// Note: Tests directory is excluded from Next.js build via tsconfig.json
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.API_SECRET_KEY = 'test-secret-key';

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  // Keep log and warn for debugging
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