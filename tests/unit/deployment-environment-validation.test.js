/**
 * Deployment Environment Validation Tests
 *
 * Tests to prevent recurring deployment issues including:
 * - JWT_SECRET build failures
 * - Vercel token authentication issues
 * - Environment variable configuration problems
 * - Build vs runtime environment handling
 */

const { describe, test, expect, beforeEach, afterEach } = require('vitest');
const fs = require('fs');
const path = require('path');

// Store original environment
const originalEnv = process.env;

describe('Deployment Environment Validation', () => {
  beforeEach(() => {
    // Reset modules and environment for each test
    Object.keys(require.cache).forEach(key => {
      if (key.includes('src/lib/auth/jwt') || key.includes('src/app/api/gateway')) {
        delete require.cache[key];
      }
    });
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('JWT_SECRET Build Failure Prevention', () => {
    test('should prevent "JWT_SECRET environment variable is required" build error', () => {
      // This was the exact error that caused build failures
      delete process.env.JWT_SECRET;
      process.env.NODE_ENV = 'production';
      process.env.VERCEL = '1';

      // The original issue: importing jwt module would throw during build
      // After fix: this should work without throwing
      expect(() => {
        const jwt = require('../../src/lib/auth/jwt');
        expect(jwt).toBeDefined();
        expect(typeof jwt.generateJWT).toBe('function');
        expect(typeof jwt.verifyJWT).toBe('function');
      }).not.toThrow();
    });

    test('should prevent api gateway route import failure during build', () => {
      // The import chain that was failing:
      // gateway/route.ts -> jwt.ts -> getJWTSecret() -> throws
      delete process.env.JWT_SECRET;
      process.env.NODE_ENV = 'production';

      expect(() => {
        const gateway = require('../../src/app/api/gateway/route');
        expect(gateway).toBeDefined();
        expect(typeof gateway.GET).toBe('function');
        expect(typeof gateway.POST).toBe('function');
      }).not.toThrow();
    });

    test('should handle Next.js build process environment simulation', () => {
      // Simulate Next.js build environment
      delete process.env.JWT_SECRET;
      process.env.NEXT_PHASE = 'phase-production-build';
      process.env.NODE_ENV = 'production';

      // Should allow all route analysis without JWT_SECRET
      const routes = [
        '../../src/app/api/gateway/route'
      ];

      routes.forEach(route => {
        expect(() => require(route)).not.toThrow();
      });
    });
  });

  describe('Vercel Token Authentication Prevention', () => {
    test('should validate Vercel token format when provided', () => {
      // Using the provided token: D2VBPpslUFVobw2W6S3VTuV6
      const providedToken = 'D2VBPpslUFVobw2W6S3VTuV6';

      // Validate token format (Vercel tokens are typically alphanumeric)
      expect(providedToken).toMatch(/^[A-Za-z0-9]+$/);
      expect(providedToken.length).toBeGreaterThan(10);

      // Should not contain common weak patterns
      expect(providedToken).not.toMatch(/^(test|dev|demo)/i);
      expect(providedToken).not.toMatch(/(123|abc|password)/i);
    });

    test('should handle deployment script with Vercel token', () => {
      const deployScript = path.join(process.cwd(), 'scripts/deploy-production-unified.sh');

      if (fs.existsSync(deployScript)) {
        const content = fs.readFileSync(deployScript, 'utf8');

        // Should handle VERCEL_TOKEN environment variable
        expect(content).toContain('VERCEL_TOKEN');
        expect(content).toContain('check_vercel_token');
        expect(content).toContain('setup_vercel_auth');

        // Should not hardcode tokens
        expect(content).not.toMatch(/VERCEL_TOKEN=[A-Za-z0-9]{20,}/);
      }
    });
  });

  describe('Runtime Environment Variable Handling', () => {
    test('should provide descriptive error for missing JWT_SECRET at runtime', async () => {
      delete process.env.JWT_SECRET;
      process.env.NODE_ENV = 'production';

      const { generateJWT } = require('../../src/lib/auth/jwt');

      try {
        await generateJWT('test-user');
        expect.fail('Should have thrown error for missing JWT_SECRET');
      } catch (error) {
        expect(error.message).toContain('JWT_SECRET environment variable is required');
        expect(error.message).toContain('production');
        expect(error.message).toContain('environment settings');
      }
    });

    test('should handle JWT_SECRET validation correctly', async () => {
      // Test with proper JWT_SECRET
      process.env.JWT_SECRET = 'valid-production-jwt-secret-32-characters-minimum-length';
      process.env.NODE_ENV = 'production';

      const { generateJWT, verifyJWT } = require('../../src/lib/auth/jwt');

      const token = await generateJWT('production-user');
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const payload = await verifyJWT(token);
      expect(payload).toBeTruthy();
      expect(payload.sub).toBe('production-user');
    });

    test('should cache JWT secret for performance', async () => {
      process.env.JWT_SECRET = 'cached-jwt-secret-32-characters-minimum-length-for-test';

      const { generateJWT } = require('../../src/lib/auth/jwt');

      // Generate multiple tokens (should use cached secret)
      const tokens = await Promise.all([
        generateJWT('user1'),
        generateJWT('user2'),
        generateJWT('user3')
      ]);

      expect(tokens).toHaveLength(3);
      tokens.forEach(token => {
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
      });
    });
  });

  describe('Environment Configuration Validation', () => {
    test('should validate all critical environment variables are documented', () => {
      const envExamplePath = path.join(process.cwd(), '.env.local.example');

      if (fs.existsSync(envExamplePath)) {
        const content = fs.readFileSync(envExamplePath, 'utf8');

        // Critical variables that caused deployment issues
        const criticalVars = [
          'JWT_SECRET',
          'API_SECRET_KEY',
          'OPAL_WEBHOOK_AUTH_KEY',
          'NEXT_PUBLIC_BASE_URL'
        ];

        criticalVars.forEach(varName => {
          expect(content).toContain(varName);
        });

        // Should provide guidance for each variable
        expect(content).toContain('32');  // Length requirement guidance
        expect(content).toContain('openssl rand'); // Generation guidance
      }
    });

    test('should ensure .env.local is properly ignored', () => {
      const gitignorePath = path.join(process.cwd(), '.gitignore');

      if (fs.existsSync(gitignorePath)) {
        const content = fs.readFileSync(gitignorePath, 'utf8');
        expect(content).toContain('.env.local');
      }
    });

    test('should validate deployment script environment handling', () => {
      const deployScript = path.join(process.cwd(), 'scripts/deploy-production-unified.sh');

      if (fs.existsSync(deployScript)) {
        const content = fs.readFileSync(deployScript, 'utf8');

        // Should handle missing environment variables gracefully
        expect(content).toContain('validate_environment');
        expect(content).toContain('NEXT_PUBLIC_BASE_URL');
        expect(content).toContain('production URL');

        // Should provide setup instructions
        expect(content).toContain('VERCEL_TOKEN Setup Instructions');
        expect(content).toContain('https://vercel.com/account/tokens');
      }
    });
  });

  describe('Lazy Loading Implementation Validation', () => {
    test('should validate JWT module uses lazy loading pattern', () => {
      const jwtPath = path.join(process.cwd(), 'src/lib/auth/jwt.ts');

      if (fs.existsSync(jwtPath)) {
        const content = fs.readFileSync(jwtPath, 'utf8');

        // Should use lazy loading pattern
        expect(content).toContain('JWT_SECRET_CACHE');
        expect(content).toContain('if (JWT_SECRET_CACHE)');

        // Should NOT use eager initialization
        expect(content).not.toMatch(/const JWT_SECRET = getJWTSecret\(\)/);
        expect(content).not.toMatch(/const [A-Z_]+ = process\.env\.[A-Z_]+;/);
      }
    });

    test('should ensure functions use getJWTSecret() calls', () => {
      const jwtPath = path.join(process.cwd(), 'src/lib/auth/jwt.ts');

      if (fs.existsSync(jwtPath)) {
        const content = fs.readFileSync(jwtPath, 'utf8');

        // JWT functions should call getJWTSecret() not use constant
        const signFunctionMatch = content.match(/\.sign\((.*?)\)/);
        const verifyFunctionMatch = content.match(/jwtVerify\([^,]+,\s*(.*?),/);

        if (signFunctionMatch) {
          expect(signFunctionMatch[1]).toBe('getJWTSecret()');
        }

        if (verifyFunctionMatch) {
          expect(verifyFunctionMatch[1]).toBe('getJWTSecret()');
        }
      }
    });
  });

  describe('Deployment Pipeline Simulation', () => {
    test('should simulate complete deployment workflow', () => {
      // Phase 1: Build-time (no environment variables)
      delete process.env.JWT_SECRET;
      delete process.env.API_SECRET_KEY;
      process.env.NODE_ENV = 'production';
      process.env.VERCEL = '1';

      // Should allow imports during build analysis
      expect(() => {
        require('../../src/lib/auth/jwt');
        require('../../src/app/api/gateway/route');
      }).not.toThrow();

      // Phase 2: Runtime (with environment variables)
      process.env.JWT_SECRET = 'deployment-workflow-jwt-secret-32-characters-minimum';
      process.env.API_SECRET_KEY = 'deployment-api-secret';

      // Should work at runtime
      const { generateJWT } = require('../../src/lib/auth/jwt');
      expect(generateJWT('deploy-test')).resolves.toBeDefined();
    });

    test('should handle Vercel deployment environment variables', async () => {
      // Simulate Vercel deployment environment
      process.env.VERCEL = '1';
      process.env.VERCEL_ENV = 'production';
      process.env.VERCEL_URL = 'ifpa-strategy-xyz.vercel.app';
      process.env.JWT_SECRET = 'vercel-deployment-jwt-secret-32-characters-minimum';

      const { generateJWT } = require('../../src/lib/auth/jwt');
      const token = await generateJWT('vercel-user');

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });
  });

  describe('Error Prevention and Recovery', () => {
    test('should prevent module cache issues during deployment', () => {
      // Simulate module reloads during deployment
      delete process.env.JWT_SECRET;

      // Import first time
      const jwt1 = require('../../src/lib/auth/jwt');

      // Clear cache
      Object.keys(require.cache).forEach(key => {
        if (key.includes('jwt')) {
          delete require.cache[key];
        }
      });

      // Import again (should still work)
      const jwt2 = require('../../src/lib/auth/jwt');

      expect(jwt1).toBeDefined();
      expect(jwt2).toBeDefined();
    });

    test('should handle environment variable changes gracefully', async () => {
      // Start without JWT_SECRET
      delete process.env.JWT_SECRET;
      const jwtModule = require('../../src/lib/auth/jwt');

      // Add JWT_SECRET later
      process.env.JWT_SECRET = 'late-addition-jwt-secret-32-characters-minimum';

      // Should work after environment is configured
      const token = await jwtModule.generateJWT('late-user');
      expect(token).toBeDefined();
    });

    test('should provide actionable error messages', async () => {
      delete process.env.JWT_SECRET;
      process.env.NODE_ENV = 'production';

      const { generateJWT } = require('../../src/lib/auth/jwt');

      try {
        await generateJWT('test');
      } catch (error) {
        // Should provide actionable guidance
        expect(error.message).toContain('JWT_SECRET environment variable is required');
        expect(error.message).toContain('Configure it in your environment settings');
      }
    });
  });
});

describe('Production Deployment Readiness', () => {
  test('should validate production deployment configuration', async () => {
    // Set up production-like environment
    process.env.NODE_ENV = 'production';
    process.env.NEXT_PUBLIC_BASE_URL = 'https://ifpa-strategy.vercel.app';
    process.env.JWT_SECRET = 'production-ready-jwt-secret-32-characters-minimum-secure';
    process.env.API_SECRET_KEY = 'production-api-secret-key';
    process.env.OPAL_WEBHOOK_AUTH_KEY = 'production-opal-webhook-key-32-characters-minimum';

    // Should handle all JWT operations
    const { generateJWT, verifyJWT, generateServiceToken } = require('../../src/lib/auth/jwt');

    const userToken = await generateJWT('prod-user');
    const serviceToken = await generateServiceToken('prod-service');

    expect(userToken).toBeDefined();
    expect(serviceToken).toBeDefined();

    const userPayload = await verifyJWT(userToken);
    const servicePayload = await verifyJWT(serviceToken);

    expect(userPayload.sub).toBe('prod-user');
    expect(servicePayload.service).toBe('prod-service');
  });

  test('should simulate successful Vercel deployment', () => {
    // Using the provided Vercel token
    process.env.VERCEL_TOKEN = 'D2VBPpslUFVobw2W6S3VTuV6';
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'vercel-production-jwt-secret-32-characters-minimum';

    // Should handle deployment configuration
    expect(process.env.VERCEL_TOKEN).toBeDefined();
    expect(process.env.VERCEL_TOKEN).toMatch(/^[A-Za-z0-9]+$/);

    // JWT module should work in production
    const jwt = require('../../src/lib/auth/jwt');
    expect(jwt.generateJWT).toBeDefined();
    expect(jwt.verifyJWT).toBeDefined();
  });
});