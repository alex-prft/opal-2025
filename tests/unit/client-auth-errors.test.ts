/**
 * Unit Tests for Client Authentication Error Scenarios
 *
 * Tests for specific authentication errors:
 * 1. Missing NEXT_PUBLIC_API_SECRET_KEY environment variable
 * 2. Client-side environment variable access issues
 * 3. Server vs client-side authentication handling
 * 4. Invalid API key formats
 * 5. Authentication header creation failures
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getClientAPISecretKey,
  createAuthHeaders,
  authenticatedFetch,
  hasValidAPICredentials
} from '@/lib/utils/client-auth';

// Mock window and environment
const mockWindow = vi.hoisted(() => ({
  location: { href: 'http://localhost:3000' }
}));

Object.defineProperty(window, 'location', {
  value: mockWindow.location,
  writable: true
});

// Mock process.env
const originalEnv = process.env;

describe('Client Authentication Error Scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('Environment Variable Handling', () => {
    it('should throw error when NEXT_PUBLIC_API_SECRET_KEY is missing', () => {
      // Remove the environment variable
      delete process.env.NEXT_PUBLIC_API_SECRET_KEY;

      expect(() => getClientAPISecretKey()).toThrow(
        'Missing NEXT_PUBLIC_API_SECRET_KEY environment variable'
      );
    });

    it('should throw error when NEXT_PUBLIC_API_SECRET_KEY is empty string', () => {
      process.env.NEXT_PUBLIC_API_SECRET_KEY = '';

      expect(() => getClientAPISecretKey()).toThrow(
        'Missing NEXT_PUBLIC_API_SECRET_KEY environment variable'
      );
    });

    it('should return empty string on server side', () => {
      // Mock server-side environment (no window)
      const originalWindow = global.window;
      delete (global as any).window;

      const result = getClientAPISecretKey();
      expect(result).toBe('');

      // Restore window
      global.window = originalWindow;
    });

    it('should return valid key when environment is properly set', () => {
      process.env.NEXT_PUBLIC_API_SECRET_KEY = 'test-api-key-123';

      const result = getClientAPISecretKey();
      expect(result).toBe('test-api-key-123');
    });
  });

  describe('Auth Headers Creation', () => {
    it('should create proper auth headers when API key is available', () => {
      process.env.NEXT_PUBLIC_API_SECRET_KEY = 'test-api-key-123';

      const headers = createAuthHeaders();

      expect(headers).toEqual({
        'Authorization': 'Bearer test-api-key-123',
        'Content-Type': 'application/json'
      });
    });

    it('should return headers without auth when API key is missing', () => {
      delete process.env.NEXT_PUBLIC_API_SECRET_KEY;

      // Mock console.error to avoid test output pollution
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const headers = createAuthHeaders();

      expect(headers).toEqual({
        'Content-Type': 'application/json'
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to create auth headers:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should handle exceptions during header creation', () => {
      // Mock getClientAPISecretKey to throw
      const originalGetKey = getClientAPISecretKey;
      vi.mocked(getClientAPISecretKey).mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const headers = createAuthHeaders();

      expect(headers).toEqual({
        'Content-Type': 'application/json'
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Authenticated Fetch', () => {
    const mockFetch = vi.fn();

    beforeEach(() => {
      global.fetch = mockFetch;
      mockFetch.mockClear();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should add auth headers to fetch request', async () => {
      process.env.NEXT_PUBLIC_API_SECRET_KEY = 'test-api-key-123';
      mockFetch.mockResolvedValue(new Response('{}', { status: 200 }));

      await authenticatedFetch('/api/test', {
        method: 'POST',
        body: JSON.stringify({ test: 'data' })
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        method: 'POST',
        body: JSON.stringify({ test: 'data' }),
        headers: {
          'Authorization': 'Bearer test-api-key-123',
          'Content-Type': 'application/json'
        }
      });
    });

    it('should make request without auth when API key is missing', async () => {
      delete process.env.NEXT_PUBLIC_API_SECRET_KEY;
      mockFetch.mockResolvedValue(new Response('{}', { status: 401 }));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await authenticatedFetch('/api/test');

      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      consoleSpy.mockRestore();
    });

    it('should merge custom headers with auth headers', async () => {
      process.env.NEXT_PUBLIC_API_SECRET_KEY = 'test-api-key-123';
      mockFetch.mockResolvedValue(new Response('{}', { status: 200 }));

      await authenticatedFetch('/api/test', {
        headers: {
          'X-Custom-Header': 'custom-value',
          'Content-Type': 'application/xml' // Should be overridden
        }
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        headers: {
          'Authorization': 'Bearer test-api-key-123',
          'Content-Type': 'application/json', // Auth header takes precedence
          'X-Custom-Header': 'custom-value'
        }
      });
    });

    it('should handle fetch errors gracefully', async () => {
      process.env.NEXT_PUBLIC_API_SECRET_KEY = 'test-api-key-123';
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(authenticatedFetch('/api/test')).rejects.toThrow('Network error');
    });
  });

  describe('Credential Validation', () => {
    it('should return true when valid credentials exist', () => {
      process.env.NEXT_PUBLIC_API_SECRET_KEY = 'valid-key-123';

      const result = hasValidAPICredentials();
      expect(result).toBe(true);
    });

    it('should return false when credentials are missing', () => {
      delete process.env.NEXT_PUBLIC_API_SECRET_KEY;

      const result = hasValidAPICredentials();
      expect(result).toBe(false);
    });

    it('should return false when credentials are empty', () => {
      process.env.NEXT_PUBLIC_API_SECRET_KEY = '';

      const result = hasValidAPICredentials();
      expect(result).toBe(false);
    });

    it('should return false on server side', () => {
      // Mock server-side environment
      const originalWindow = global.window;
      delete (global as any).window;

      const result = hasValidAPICredentials();
      expect(result).toBe(false);

      // Restore window
      global.window = originalWindow;
    });

    it('should handle exceptions during validation', () => {
      // Force an exception by mocking getClientAPISecretKey
      vi.doMock('@/lib/utils/client-auth', async () => {
        const actual = await vi.importActual('@/lib/utils/client-auth');
        return {
          ...actual,
          getClientAPISecretKey: () => { throw new Error('Test error'); }
        };
      });

      const result = hasValidAPICredentials();
      expect(result).toBe(false);
    });
  });

  describe('Environment Edge Cases', () => {
    it('should handle undefined process.env', () => {
      const originalProcessEnv = process.env;
      (process as any).env = undefined;

      expect(() => getClientAPISecretKey()).toThrow();

      process.env = originalProcessEnv;
    });

    it('should handle null environment values', () => {
      (process.env as any).NEXT_PUBLIC_API_SECRET_KEY = null;

      expect(() => getClientAPISecretKey()).toThrow(
        'Missing NEXT_PUBLIC_API_SECRET_KEY environment variable'
      );
    });

    it('should handle whitespace-only environment values', () => {
      process.env.NEXT_PUBLIC_API_SECRET_KEY = '   ';

      expect(() => getClientAPISecretKey()).toThrow(
        'Missing NEXT_PUBLIC_API_SECRET_KEY environment variable'
      );
    });
  });

  describe('Security Considerations', () => {
    it('should not expose API key in error messages', () => {
      process.env.NEXT_PUBLIC_API_SECRET_KEY = 'secret-key-do-not-expose';

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Force an error condition
      const originalGetKey = getClientAPISecretKey;
      vi.doMock('@/lib/utils/client-auth', () => ({
        getClientAPISecretKey: () => { throw new Error('Auth error'); }
      }));

      createAuthHeaders();

      // Verify that the secret key is not in any console output
      const consoleCalls = consoleSpy.mock.calls.flat();
      const allOutput = consoleCalls.join(' ');

      expect(allOutput).not.toContain('secret-key-do-not-expose');

      consoleSpy.mockRestore();
    });

    it('should handle malformed API keys', () => {
      // Test with various malformed keys
      const malformedKeys = [
        'key with spaces',
        'key\nwith\nnewlines',
        'key\twith\ttabs',
        'key"with"quotes',
        "key'with'quotes",
        'key\\with\\backslashes'
      ];

      malformedKeys.forEach(key => {
        process.env.NEXT_PUBLIC_API_SECRET_KEY = key;

        expect(() => {
          const headers = createAuthHeaders();
          expect(headers.Authorization).toBe(`Bearer ${key}`);
        }).not.toThrow();
      });
    });
  });
});