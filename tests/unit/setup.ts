/**
 * Test Setup Configuration for Force Sync Unit Tests
 */

import { jest } from '@jest/globals';

// Global test setup
beforeAll(() => {
  // Mock global fetch for all tests
  global.fetch = jest.fn();

  // Mock console methods to reduce noise in test output
  global.console = {
    ...console,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
});

afterAll(() => {
  // Clean up global mocks
  jest.restoreAllMocks();
});

// Mock Next.js modules that might not be available in test environment
jest.mock('next/server', () => ({
  NextRequest: class MockNextRequest {
    url: string;
    method: string;
    headers: Map<string, string>;
    body: string | undefined;

    constructor(url: string, options?: any) {
      this.url = url;
      this.method = options?.method || 'GET';
      this.headers = new Map();
      if (options?.headers) {
        Object.entries(options.headers).forEach(([key, value]) => {
          this.headers.set(key, value as string);
        });
      }
      this.body = options?.body;
    }

    async json() {
      if (!this.body) return {};
      try {
        return JSON.parse(this.body);
      } catch {
        return {};
      }
    }
  },
  NextResponse: {
    json: (data: any, options?: any) => ({
      json: () => Promise.resolve(data),
      status: options?.status || 200
    })
  }
}));

// Mock timers/promises for retry logic testing
jest.mock('timers/promises', () => ({
  setTimeout: jest.fn().mockResolvedValue(undefined)
}));

// Export test utilities
export const TestUtils = {
  createMockEnvironment: (overrides: Record<string, string> = {}) => ({
    OPAL_WEBHOOK_URL: 'https://webhook.opal.optimizely.com/webhooks/test-webhook-id/secret',
    OPAL_STRATEGY_WORKFLOW_AUTH_KEY: 'test-auth-key-12345678901234567890123456789012',
    NODE_ENV: 'test',
    ...overrides
  }),

  createMockFetchResponse: (data: any, options: { status?: number; ok?: boolean } = {}) => ({
    ok: options.ok ?? true,
    status: options.status ?? 200,
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Headers()
  }),

  createMockError: (message: string, status?: number) => {
    const error = new Error(message);
    if (status) {
      (error as any).status = status;
    }
    return error;
  }
};