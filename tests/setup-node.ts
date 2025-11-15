/**
 * Jest test setup configuration for Node.js environment (API routes)
 */

import { Request, Response } from 'node-fetch';
import { TextEncoder, TextDecoder } from 'util';
import { ReadableStream } from 'web-streams-polyfill/ponyfill';
import { Blob } from 'buffer';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.API_SECRET_KEY = 'test-secret-key';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';

// Polyfill Web APIs for Node.js environment
if (!globalThis.Request) {
  globalThis.Request = Request as any;
}

if (!globalThis.Response) {
  globalThis.Response = Response as any;
}

if (!globalThis.fetch) {
  globalThis.fetch = require('node-fetch').default;
}

if (!globalThis.Headers) {
  globalThis.Headers = require('node-fetch').Headers;
}

if (!globalThis.TextEncoder) {
  globalThis.TextEncoder = TextEncoder;
}

if (!globalThis.TextDecoder) {
  globalThis.TextDecoder = TextDecoder as any;
}

if (!globalThis.ReadableStream) {
  globalThis.ReadableStream = ReadableStream as any;
}

if (!globalThis.Blob) {
  globalThis.Blob = Blob as any;
}

// URL polyfill
if (!globalThis.URL) {
  globalThis.URL = URL;
}

if (!globalThis.URLSearchParams) {
  globalThis.URLSearchParams = URLSearchParams;
}

// Performance API polyfill for response time measurements
if (!globalThis.performance) {
  globalThis.performance = {
    now: () => Date.now(),
    mark: () => {},
    measure: () => {},
    clearMarks: () => {},
    clearMeasures: () => {},
    getEntries: () => [],
    getEntriesByName: () => [],
    getEntriesByType: () => [],
    timeOrigin: Date.now()
  } as any;
}

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  // Keep error for debugging, but mock others
  log: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
};

// Mock setTimeout and setInterval for consistent testing
jest.useFakeTimers();

// Setup global beforeEach and afterEach for Node tests
beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();

  // Reset fake timers
  jest.clearAllTimers();
});

afterEach(() => {
  // Clean up after each test
  jest.restoreAllMocks();

  // Run any pending timers
  jest.runOnlyPendingTimers();
});

// Cleanup after all tests
afterAll(() => {
  jest.useRealTimers();
});

// Custom matchers for API testing
expect.extend({
  toBeValidApiResponse(received: any) {
    const pass = received &&
      typeof received.status === 'number' &&
      received.status >= 200 && received.status < 600 &&
      typeof received.json === 'function';

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid API response`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid API response with status and json method`,
        pass: false,
      };
    }
  },

  toBeSuccessfulApiResponse(received: any) {
    const pass = received &&
      received.status >= 200 &&
      received.status < 300;

    if (pass) {
      return {
        message: () => `expected ${received} not to be a successful API response (2xx)`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a successful API response (2xx), but got status ${received?.status}`,
        pass: false,
      };
    }
  },
});

// Extend Jest matchers type
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidApiResponse(): R;
      toBeSuccessfulApiResponse(): R;
    }
  }
}