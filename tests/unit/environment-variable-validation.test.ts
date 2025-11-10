/**
 * Environment Variable Validation Tests
 *
 * Comprehensive tests to prevent build failures caused by missing or
 * improperly configured environment variables during deployment.
 *
 * These tests ensure robust environment variable handling across
 * development, staging, and production environments.
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

// Store original environment
const originalEnv = process.env;

describe('Environment Variable Validation Tests', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Critical Environment Variables', () => {
    const criticalEnvVars = [
      'JWT_SECRET',
      'API_SECRET_KEY',
      'OPAL_WEBHOOK_AUTH_KEY',
      'NEXT_PUBLIC_BASE_URL'
    ];

    test('should identify all critical environment variables', () => {
      // Ensure we're testing all the variables that caused deployment issues
      expect(criticalEnvVars).toContain('JWT_SECRET');
      expect(criticalEnvVars).toContain('API_SECRET_KEY');
      expect(criticalEnvVars).toContain('OPAL_WEBHOOK_AUTH_KEY');
    });

    test('should handle missing environment variables gracefully during build', () => {
      // Clear all critical environment variables
      criticalEnvVars.forEach(varName => {
        delete process.env[varName];
      });

      // Simulate build environment
      process.env.NODE_ENV = 'production';
      process.env.VERCEL = '1';

      // These imports should NOT fail during build time
      expect(() => {
        require('../../src/lib/auth/jwt');
        require('../../src/lib/config/env-config');
        require('../../src/app/api/gateway/route');
      }).not.toThrow();
    });

    test('should provide helpful error messages for missing variables at runtime', () => {
      delete process.env.JWT_SECRET;
      process.env.NODE_ENV = 'production';

      const { generateJWT } = require('../../src/lib/auth/jwt');

      expect(generateJWT('test')).rejects.toThrow(
        expect.stringMatching(/JWT_SECRET.*required.*production.*environment settings/)
      );
    });
  });

  describe('Environment Variable Security Validation', () => {
    test('should reject weak secrets in production', () => {
      const weakSecrets = [
        'test',
        'dev',
        'secret',
        'password',
        '12345',
        'development',
        'localhost'
      ];

      process.env.NODE_ENV = 'production';

      weakSecrets.forEach(weak => {
        process.env.JWT_SECRET = weak.padEnd(32, 'x');

        const { generateJWT } = require('../../src/lib/auth/jwt');
        vi.resetModules();

        expect(generateJWT('test')).rejects.toThrow(
          expect.stringMatching(/weak.*production/)
        );
      });
    });

    test('should enforce minimum length requirements', () => {
      const shortSecrets = ['a', 'ab', 'abc', 'short', '1234567890'];

      process.env.NODE_ENV = 'development';

      shortSecrets.forEach(short => {
        process.env.JWT_SECRET = short;

        const { generateJWT } = require('../../src/lib/auth/jwt');
        vi.resetModules();

        expect(generateJWT('test')).rejects.toThrow(
          expect.stringMatching(/at least 32 characters/)
        );
      });
    });

    test('should accept strong secrets', async () => {
      const strongSecrets = [
        'cryptographically-secure-random-jwt-secret-for-production-deployment',
        'a1b2c3d4e5f6789012345678901234567890abcdef1234567890',
        'super-secure-production-jwt-secret-with-high-entropy-content-2024'
      ];

      process.env.NODE_ENV = 'production';

      for (const strong of strongSecrets) {
        process.env.JWT_SECRET = strong;

        const { generateJWT, verifyJWT } = require('../../src/lib/auth/jwt');
        vi.resetModules();

        // Should work without throwing
        const token = await generateJWT('test-user');
        expect(token).toBeDefined();

        const payload = await verifyJWT(token);
        expect(payload?.sub).toBe('test-user');
      }
    });
  });

  describe('Vercel-Specific Environment Handling', () => {
    test('should handle Vercel build environment variables', () => {
      // Simulate Vercel build environment
      process.env.VERCEL = '1';
      process.env.VERCEL_ENV = 'production';
      delete process.env.JWT_SECRET;

      // Should not throw during build
      expect(() => {
        require('../../src/lib/auth/jwt');
      }).not.toThrow();
    });

    test('should provide Vercel-specific error messages', () => {
      process.env.VERCEL = '1';
      delete process.env.JWT_SECRET;
      delete process.env.NODE_ENV;

      const { generateJWT } = require('../../src/lib/auth/jwt');

      expect(generateJWT('test')).rejects.toThrow(
        expect.stringMatching(/Vercel deployment/)
      );
    });

    test('should handle Vercel preview deployments', () => {
      process.env.VERCEL = '1';
      process.env.VERCEL_ENV = 'preview';
      process.env.JWT_SECRET = 'preview-jwt-secret-32-characters-minimum-length';

      const { generateJWT } = require('../../src/lib/auth/jwt');

      expect(generateJWT('preview-user')).resolves.toBeDefined();
    });
  });

  describe('Environment Configuration Files', () => {
    test('should validate .env.local.example contains all required variables', () => {
      const envExamplePath = path.join(process.cwd(), '.env.local.example');

      if (fs.existsSync(envExamplePath)) {
        const content = fs.readFileSync(envExamplePath, 'utf8');

        // Critical variables should be documented
        expect(content).toContain('JWT_SECRET');
        expect(content).toContain('API_SECRET_KEY');
        expect(content).toContain('OPAL_WEBHOOK_AUTH_KEY');
        expect(content).toContain('NEXT_PUBLIC_BASE_URL');

        // Should not contain real secrets
        expect(content).not.toMatch(/[A-Za-z0-9]{40,}/); // No long API keys
        expect(content).not.toContain('sk_live_');
        expect(content).not.toContain('pk_live_');
      }
    });

    test('should ensure .env.local is in .gitignore', () => {
      const gitignorePath = path.join(process.cwd(), '.gitignore');

      if (fs.existsSync(gitignorePath)) {
        const content = fs.readFileSync(gitignorePath, 'utf8');
        expect(content).toContain('.env.local');
        expect(content).toContain('.env.production');
      }
    });
  });

  describe('Build-Time vs Runtime Environment Handling', () => {
    test('should differentiate build-time and runtime contexts', () => {
      // Build-time: should import successfully
      delete process.env.JWT_SECRET;
      process.env.NEXT_BUILD = 'true'; // Simulate Next.js build

      expect(() => {
        require('../../src/lib/auth/jwt');
      }).not.toThrow();

      // Runtime: should provide clear error
      delete process.env.NEXT_BUILD;

      const { generateJWT } = require('../../src/lib/auth/jwt');
      expect(generateJWT('test')).rejects.toThrow();
    });

    test('should handle static generation gracefully', () => {
      // During static generation, modules are imported but may not execute
      delete process.env.JWT_SECRET;
      process.env.NODE_ENV = 'production';

      // Import should work (lazy loading)
      const jwtModule = require('../../src/lib/auth/jwt');
      expect(typeof jwtModule.generateJWT).toBe('function');
      expect(typeof jwtModule.verifyJWT).toBe('function');
    });
  });

  describe('Error Recovery and Fallback Mechanisms', () => {
    test('should provide recovery instructions in error messages', () => {
      delete process.env.JWT_SECRET;
      process.env.NODE_ENV = 'production';

      const { generateJWT } = require('../../src/lib/auth/jwt');

      expect(generateJWT('test')).rejects.toThrow(
        expect.stringMatching(/configure.*environment settings/)
      );
    });

    test('should handle environment variable changes at runtime', async () => {
      // Start without JWT_SECRET
      delete process.env.JWT_SECRET;

      const jwtModule = require('../../src/lib/auth/jwt');

      // Should fail initially
      await expect(jwtModule.generateJWT('test')).rejects.toThrow();

      // Add JWT_SECRET
      process.env.JWT_SECRET = 'runtime-added-secret-32-characters-minimum-length';

      // Should work after environment is set
      const token = await jwtModule.generateJWT('test');
      expect(token).toBeDefined();
    });

    test('should handle partial environment configuration', () => {
      // Set some but not all required variables
      process.env.JWT_SECRET = 'valid-jwt-secret-32-characters-minimum-length';
      delete process.env.API_SECRET_KEY;

      // JWT functions should work
      const { generateJWT } = require('../../src/lib/auth/jwt');
      expect(generateJWT('test')).resolves.toBeDefined();

      // But other modules requiring API_SECRET_KEY might need graceful handling
      // This ensures modular environment validation
    });
  });

  describe('Deployment Pipeline Environment Tests', () => {
    test('should simulate GitHub Actions deployment environment', () => {
      // Simulate CI/CD environment variables
      process.env.GITHUB_ACTIONS = 'true';
      process.env.CI = 'true';
      delete process.env.JWT_SECRET;

      // Should allow build without throwing
      expect(() => {
        require('../../src/lib/auth/jwt');
        require('../../src/app/api/gateway/route');
      }).not.toThrow();
    });

    test('should simulate Vercel deployment environment', () => {
      // Simulate Vercel deployment
      process.env.VERCEL = '1';
      process.env.VERCEL_ENV = 'production';
      delete process.env.JWT_SECRET;

      // Should allow build analysis without throwing
      expect(() => {
        require('../../src/lib/auth/jwt');
        require('../../src/app/api/gateway/route');
      }).not.toThrow();
    });

    test('should validate production deployment readiness', async () => {
      // Simulate production environment with proper secrets
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'production-ready-jwt-secret-32-characters-minimum-secure';
      process.env.API_SECRET_KEY = 'production-api-secret';
      process.env.OPAL_WEBHOOK_AUTH_KEY = 'production-opal-webhook-key-32-characters-minimum';

      const { generateJWT, verifyJWT, generateServiceToken } = require('../../src/lib/auth/jwt');

      // Should handle all JWT operations successfully
      const userToken = await generateJWT('prod-user');
      const serviceToken = await generateServiceToken('prod-service');

      expect(userToken).toBeDefined();
      expect(serviceToken).toBeDefined();

      const userPayload = await verifyJWT(userToken);
      const servicePayload = await verifyJWT(serviceToken);

      expect(userPayload?.sub).toBe('prod-user');
      expect(servicePayload?.service).toBe('prod-service');
    });
  });

  describe('Regression Prevention Checks', () => {
    test('should prevent eager initialization patterns', () => {
      // Check that problematic patterns are not present in codebase
      const problematicPatterns = [
        /const [A-Z_]+ = get[A-Za-z]+\(\);?\s*$/, // e.g., const JWT_SECRET = getJWTSecret();
        /const [A-Z_]+ = process\.env\.[A-Z_]+\s*$/, // e.g., const SECRET = process.env.SECRET;
      ];

      const sourceFiles = [
        path.join(process.cwd(), 'src/lib/auth/jwt.ts'),
        path.join(process.cwd(), 'src/lib/config/env-config.ts')
      ];

      sourceFiles.forEach(filePath => {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');

          problematicPatterns.forEach((pattern, index) => {
            expect(content).not.toMatch(pattern);
          });
        }
      });
    });

    test('should validate lazy loading patterns are present', () => {
      const jwtFilePath = path.join(process.cwd(), 'src/lib/auth/jwt.ts');

      if (fs.existsSync(jwtFilePath)) {
        const content = fs.readFileSync(jwtFilePath, 'utf8');

        // Should contain lazy loading patterns
        expect(content).toContain('JWT_SECRET_CACHE');
        expect(content).toContain('if (JWT_SECRET_CACHE)');
        expect(content).toMatch(/getJWTSecret\(\)/);
      }
    });

    test('should ensure all API routes handle missing environment variables', () => {
      const apiRoutes = [
        'src/app/api/gateway/route.ts'
        // Add other API routes as needed
      ];

      apiRoutes.forEach(routePath => {
        const fullPath = path.join(process.cwd(), routePath);

        if (fs.existsSync(fullPath)) {
          delete process.env.JWT_SECRET;

          // Should not throw during import
          expect(() => {
            require(`../../${routePath}`);
          }).not.toThrow();
        }
      });
    });
  });
});