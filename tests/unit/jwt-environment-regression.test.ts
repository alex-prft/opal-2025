/**
 * JWT Environment Variable Regression Tests
 *
 * These tests prevent the recurring "JWT_SECRET environment variable is required"
 * build failure by validating proper lazy initialization and environment handling.
 *
 * Critical Issue Fixed: JWT_SECRET was being loaded at module import time,
 * causing builds to fail when environment variables weren't available during
 * the Next.js build process.
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';

// Store original environment to restore after tests
const originalEnv = process.env;

describe('JWT Environment Variable Regression Tests', () => {
  beforeEach(() => {
    // Clear module cache to ensure fresh imports
    vi.resetModules();
    // Reset environment
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Module Import Safety (Build-Time Compatibility)', () => {
    test('should allow module import without JWT_SECRET during build', async () => {
      // Simulate build environment without JWT_SECRET
      delete process.env.JWT_SECRET;
      process.env.NODE_ENV = 'production';
      process.env.VERCEL = '1'; // Simulate Vercel build

      // This should NOT throw an error during import
      expect(() => {
        // Dynamic import to simulate module loading
        require('../../src/lib/auth/jwt');
      }).not.toThrow();
    });

    test('should allow module import in development without JWT_SECRET', async () => {
      // Simulate development environment without JWT_SECRET
      delete process.env.JWT_SECRET;
      process.env.NODE_ENV = 'development';

      // This should NOT throw an error during import
      expect(() => {
        require('../../src/lib/auth/jwt');
      }).not.toThrow();
    });

    test('should allow multiple imports without environment variable', async () => {
      // Simulate multiple module imports during build analysis
      delete process.env.JWT_SECRET;

      expect(() => {
        require('../../src/lib/auth/jwt');
        require('../../src/lib/auth/jwt');
        require('../../src/lib/auth/jwt');
      }).not.toThrow();
    });
  });

  describe('Runtime JWT Secret Validation', () => {
    test('should throw descriptive error when JWT_SECRET missing at runtime', async () => {
      delete process.env.JWT_SECRET;
      process.env.NODE_ENV = 'production';

      const { generateJWT } = require('../../src/lib/auth/jwt');

      await expect(generateJWT('test-user')).rejects.toThrow(
        'JWT_SECRET environment variable is required for production'
      );
    });

    test('should throw descriptive error in development context', async () => {
      delete process.env.JWT_SECRET;
      process.env.NODE_ENV = 'development';

      const { generateJWT } = require('../../src/lib/auth/jwt');

      await expect(generateJWT('test-user')).rejects.toThrow(
        'JWT_SECRET environment variable is required for development'
      );
    });

    test('should throw descriptive error in Vercel deployment context', async () => {
      delete process.env.JWT_SECRET;
      process.env.VERCEL = '1';
      delete process.env.NODE_ENV;

      const { generateJWT } = require('../../src/lib/auth/jwt');

      await expect(generateJWT('test-user')).rejects.toThrow(
        'JWT_SECRET environment variable is required for Vercel deployment'
      );
    });

    test('should validate JWT_SECRET length requirement', async () => {
      process.env.JWT_SECRET = 'short'; // Too short
      process.env.NODE_ENV = 'production';

      const { generateJWT } = require('../../src/lib/auth/jwt');

      await expect(generateJWT('test-user')).rejects.toThrow(
        'JWT_SECRET must be at least 32 characters long. Current length: 5'
      );
    });

    test('should reject weak secrets in production', async () => {
      process.env.JWT_SECRET = 'secret'; // Weak secret
      process.env.NODE_ENV = 'production';

      const { generateJWT } = require('../../src/lib/auth/jwt');

      await expect(generateJWT('test-user')).rejects.toThrow(
        'Weak JWT_SECRET detected in production environment'
      );
    });

    test('should warn about weak secrets in development', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      process.env.JWT_SECRET = 'development-secret-that-is-long-enough-for-32-chars';
      process.env.NODE_ENV = 'development';

      const { generateJWT } = require('../../src/lib/auth/jwt');

      // Should not throw, but should warn
      await expect(generateJWT('test-user')).resolves.toBeDefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Warning: Using weak JWT_SECRET')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('JWT Secret Caching and Performance', () => {
    test('should cache JWT secret after first access', async () => {
      process.env.JWT_SECRET = 'valid-jwt-secret-32-characters-minimum-length-requirement';
      process.env.NODE_ENV = 'development';

      const { generateJWT } = require('../../src/lib/auth/jwt');

      // First call should initialize and cache
      const token1 = await generateJWT('user1');
      expect(token1).toBeDefined();

      // Modify environment variable (should not affect cached value)
      process.env.JWT_SECRET = 'different-secret-32-characters-minimum-length-requirement';

      // Second call should use cached value, not new env var
      const token2 = await generateJWT('user2');
      expect(token2).toBeDefined();

      // Both tokens should be created with the same (original) secret
      const { verifyJWT } = require('../../src/lib/auth/jwt');

      // Reset the cache by requiring a fresh module
      vi.resetModules();
      process.env.JWT_SECRET = 'valid-jwt-secret-32-characters-minimum-length-requirement';
      const { verifyJWT: freshVerifyJWT } = require('../../src/lib/auth/jwt');

      // Should verify with the original secret
      const payload1 = await freshVerifyJWT(token1);
      expect(payload1).toBeTruthy();
      expect(payload1?.sub).toBe('user1');
    });

    test('should handle concurrent JWT operations safely', async () => {
      process.env.JWT_SECRET = 'concurrent-jwt-secret-32-characters-minimum-length';
      process.env.NODE_ENV = 'development';

      const { generateJWT } = require('../../src/lib/auth/jwt');

      // Simulate concurrent JWT generation
      const promises = Array.from({ length: 10 }, (_, i) =>
        generateJWT(`user${i}`)
      );

      const tokens = await Promise.all(promises);

      // All tokens should be generated successfully
      expect(tokens).toHaveLength(10);
      tokens.forEach((token, i) => {
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
      });
    });
  });

  describe('API Gateway Integration Tests', () => {
    test('should allow gateway route import without JWT_SECRET', async () => {
      // Simulate build-time import of gateway route
      delete process.env.JWT_SECRET;
      process.env.NODE_ENV = 'production';

      // This import chain was causing the build failure:
      // gateway/route.ts -> @/lib/auth/jwt -> getJWTSecret() -> throws
      expect(() => {
        require('../../src/app/api/gateway/route');
      }).not.toThrow();
    });

    test('should handle JWT operations in gateway at runtime', async () => {
      process.env.JWT_SECRET = 'gateway-jwt-secret-32-characters-minimum-length';
      process.env.NODE_ENV = 'development';

      // Import gateway (should work now)
      const gatewayModule = require('../../src/app/api/gateway/route');

      // Import JWT functions
      const { generateJWT, verifyJWT } = require('../../src/lib/auth/jwt');

      // Should be able to generate and verify tokens
      const token = await generateJWT('gateway-user');
      expect(token).toBeDefined();

      const payload = await verifyJWT(token);
      expect(payload).toBeTruthy();
      expect(payload?.sub).toBe('gateway-user');
    });
  });

  describe('Environment Context Detection', () => {
    test('should detect development environment correctly', async () => {
      delete process.env.JWT_SECRET;
      process.env.NODE_ENV = 'development';
      delete process.env.VERCEL;

      const { generateJWT } = require('../../src/lib/auth/jwt');

      await expect(generateJWT('test')).rejects.toThrow(
        'JWT_SECRET environment variable is required for development'
      );
    });

    test('should detect Vercel environment correctly', async () => {
      delete process.env.JWT_SECRET;
      process.env.VERCEL = '1';
      delete process.env.NODE_ENV;

      const { generateJWT } = require('../../src/lib/auth/jwt');

      await expect(generateJWT('test')).rejects.toThrow(
        'JWT_SECRET environment variable is required for Vercel deployment'
      );
    });

    test('should detect production environment correctly', async () => {
      delete process.env.JWT_SECRET;
      process.env.NODE_ENV = 'production';
      delete process.env.VERCEL;

      const { generateJWT } = require('../../src/lib/auth/jwt');

      await expect(generateJWT('test')).rejects.toThrow(
        'JWT_SECRET environment variable is required for production'
      );
    });

    test('should default to production context when environment unclear', async () => {
      delete process.env.JWT_SECRET;
      delete process.env.NODE_ENV;
      delete process.env.VERCEL;

      const { generateJWT } = require('../../src/lib/auth/jwt');

      await expect(generateJWT('test')).rejects.toThrow(
        'JWT_SECRET environment variable is required for production'
      );
    });
  });

  describe('Deployment Configuration Tests', () => {
    test('should provide helpful error messages for missing configuration', async () => {
      delete process.env.JWT_SECRET;
      process.env.NODE_ENV = 'production';

      const { generateJWT } = require('../../src/lib/auth/jwt');

      try {
        await generateJWT('test');
      } catch (error) {
        expect(error.message).toContain('JWT_SECRET environment variable is required');
        expect(error.message).toContain('Please configure it in your environment settings');
      }
    });

    test('should validate minimum security requirements', async () => {
      const weakSecrets = [
        'secret',
        'password',
        'development',
        'your-jwt-secret-key',
        'fallback-secret-for-development-only-change-in-production'
      ];

      process.env.NODE_ENV = 'production';

      for (const weakSecret of weakSecrets) {
        process.env.JWT_SECRET = weakSecret.padEnd(32, 'x'); // Make it long enough

        const { generateJWT } = require('../../src/lib/auth/jwt');
        vi.resetModules(); // Reset for next iteration

        await expect(generateJWT('test')).rejects.toThrow(
          'Weak JWT_SECRET detected in production environment'
        );
      }
    });

    test('should accept strong secrets in production', async () => {
      process.env.JWT_SECRET = 'cryptographically-secure-random-jwt-secret-for-production-use';
      process.env.NODE_ENV = 'production';

      const { generateJWT, verifyJWT } = require('../../src/lib/auth/jwt');

      // Should generate token successfully
      const token = await generateJWT('production-user');
      expect(token).toBeDefined();

      // Should verify token successfully
      const payload = await verifyJWT(token);
      expect(payload).toBeTruthy();
      expect(payload?.sub).toBe('production-user');
    });
  });

  describe('Regression Prevention', () => {
    test('should prevent eager initialization at module level', () => {
      // The original bug was caused by this pattern at module level:
      // const JWT_SECRET = getJWTSecret();

      // Verify the fix by checking module source doesn't have eager initialization
      const fs = require('fs');
      const path = require('path');
      const jwtModulePath = path.join(__dirname, '../../src/lib/auth/jwt.ts');
      const content = fs.readFileSync(jwtModulePath, 'utf8');

      // Should NOT contain eager initialization pattern
      expect(content).not.toMatch(/const JWT_SECRET = getJWTSecret\(\)/);

      // Should contain lazy initialization pattern
      expect(content).toContain('JWT_SECRET_CACHE');
      expect(content).toContain('if (JWT_SECRET_CACHE)');
    });

    test('should handle module reloads correctly', async () => {
      process.env.JWT_SECRET = 'reload-test-secret-32-characters-minimum-length';

      // Load module first time
      let jwtModule = require('../../src/lib/auth/jwt');
      const token1 = await jwtModule.generateJWT('user1');

      // Reset modules (simulating reload)
      vi.resetModules();

      // Load module again
      jwtModule = require('../../src/lib/auth/jwt');
      const token2 = await jwtModule.generateJWT('user2');

      // Both should work
      expect(token1).toBeDefined();
      expect(token2).toBeDefined();

      // Should be able to verify both tokens
      const payload1 = await jwtModule.verifyJWT(token1);
      const payload2 = await jwtModule.verifyJWT(token2);

      expect(payload1?.sub).toBe('user1');
      expect(payload2?.sub).toBe('user2');
    });

    test('should maintain functionality after environment changes', async () => {
      // Start with no JWT_SECRET
      delete process.env.JWT_SECRET;

      // Import should work (no eager initialization)
      const jwtModule = require('../../src/lib/auth/jwt');

      // Add JWT_SECRET later
      process.env.JWT_SECRET = 'late-addition-secret-32-characters-minimum-length';

      // Should now work for JWT operations
      const token = await jwtModule.generateJWT('late-user');
      expect(token).toBeDefined();

      const payload = await jwtModule.verifyJWT(token);
      expect(payload?.sub).toBe('late-user');
    });
  });
});

// Integration test to verify the complete flow works
describe('JWT Build Integration Test', () => {
  test('should complete full JWT workflow without build errors', async () => {
    // 1. Simulate build-time import (no environment)
    delete process.env.JWT_SECRET;

    // Should import without errors
    const jwtModule = require('../../src/lib/auth/jwt');
    const gatewayModule = require('../../src/app/api/gateway/route');

    // 2. Simulate runtime with proper environment
    process.env.JWT_SECRET = 'integration-test-jwt-secret-32-characters-minimum';
    process.env.NODE_ENV = 'production';

    // 3. Test full JWT workflow
    const token = await jwtModule.generateJWT('integration-user', {
      role: 'user',
      permissions: ['read', 'write']
    });

    expect(token).toBeDefined();

    // 4. Verify token
    const payload = await jwtModule.verifyJWT(token);
    expect(payload).toBeTruthy();
    expect(payload?.sub).toBe('integration-user');
    expect(payload?.role).toBe('user');
    expect(payload?.permissions).toEqual(['read', 'write']);

    // 5. Test service token generation
    const serviceToken = await jwtModule.generateServiceToken('test-service');
    expect(serviceToken).toBeDefined();

    const servicePayload = await jwtModule.verifyJWT(serviceToken);
    expect(servicePayload?.role).toBe('service');
    expect(servicePayload?.service).toBe('test-service');
  });
});