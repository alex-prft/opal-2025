/**
 * Content Security Policy (CSP) Vercel Compatibility Tests
 *
 * These tests prevent regression of the CSP configuration that was blocking
 * Vercel Live feedback scripts and other essential Vercel functionality.
 *
 * Critical Issue Fixed: CSP was too restrictive and blocked:
 * - https://vercel.live/_next-live/feedback/feedback.js
 * - Other Vercel platform scripts and resources
 */

import { describe, test, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('CSP Vercel Compatibility Tests', () => {
  let nextConfig;

  beforeEach(async () => {
    // Clear module cache to get fresh config
    const configPath = path.join(process.cwd(), 'next.config.js');
    // Dynamic import for ES modules
    const configModule = await import(configPath + '?t=' + Date.now());
    nextConfig = configModule.default;
  });

  describe('CSP Configuration Validation', () => {
    test('should have CSP header configuration', async () => {
      expect(nextConfig.headers).toBeDefined();
      expect(typeof nextConfig.headers).toBe('function');

      const headers = await nextConfig.headers();
      expect(Array.isArray(headers)).toBe(true);

      // Find security headers configuration
      const securityConfig = headers.find(config =>
        config.source === '/(.*)'
      );

      expect(securityConfig).toBeDefined();
      expect(securityConfig.headers).toBeDefined();

      // Find CSP header
      const cspHeader = securityConfig.headers.find(header =>
        header.key === 'Content-Security-Policy'
      );

      expect(cspHeader).toBeDefined();
      expect(cspHeader.value).toBeDefined();
    });

    test('should allow Vercel Live domains in production CSP', async () => {
      // Set production environment
      process.env.NODE_ENV = 'production';

      const headers = await nextConfig.headers();
      const securityConfig = headers.find(config => config.source === '/(.*)')?.headers;
      const cspHeader = securityConfig?.find(header => header.key === 'Content-Security-Policy');

      expect(cspHeader).toBeDefined();

      const cspValue = cspHeader.value;

      // Should allow vercel.live for scripts
      expect(cspValue).toContain('https://vercel.live');

      // Should allow *.vercel.app domains
      expect(cspValue).toContain('https://*.vercel.app');

      // Should allow scripts from Vercel domains
      expect(cspValue).toMatch(/script-src[^;]*https:\/\/vercel\.live/);
      expect(cspValue).toMatch(/script-src[^;]*https:\/\/\*\.vercel\.app/);
    });

    test('should allow Vercel domains for all necessary resource types', async () => {
      process.env.NODE_ENV = 'production';

      const headers = await nextConfig.headers();
      const securityConfig = headers.find(config => config.source === '/(.*)')?.headers;
      const cspHeader = securityConfig?.find(header => header.key === 'Content-Security-Policy');

      const cspValue = cspHeader.value;

      // Test that Vercel domains are allowed for different CSP directives
      const requiredDirectives = [
        'script-src',
        'style-src',
        'img-src',
        'font-src'
      ];

      requiredDirectives.forEach(directive => {
        // Extract the directive value from CSP
        const directiveRegex = new RegExp(`${directive}\\s+([^;]+)`);
        const match = cspValue.match(directiveRegex);

        expect(match).toBeTruthy();
        const directiveValue = match[1];

        // Should include Vercel domains
        expect(directiveValue).toContain('https://vercel.live');
        expect(directiveValue).toContain('https://*.vercel.app');
      });
    });

    test('should allow WebSocket connections to Vercel Live', async () => {
      process.env.NODE_ENV = 'production';

      const headers = await nextConfig.headers();
      const securityConfig = headers.find(config => config.source === '/(.*)')?.headers;
      const cspHeader = securityConfig?.find(header => header.key === 'Content-Security-Policy');

      const cspValue = cspHeader.value;

      // Should allow WebSocket connections for live features
      expect(cspValue).toMatch(/connect-src[^;]*wss:\/\/vercel\.live/);
    });

    test('should maintain security while allowing Vercel domains', async () => {
      process.env.NODE_ENV = 'production';

      const headers = await nextConfig.headers();
      const securityConfig = headers.find(config => config.source === '/(.*)')?.headers;
      const cspHeader = securityConfig?.find(header => header.key === 'Content-Security-Policy');

      const cspValue = cspHeader.value;

      // Should still enforce 'self' as primary source
      expect(cspValue).toContain("'self'");

      // Should not allow overly permissive directives
      expect(cspValue).not.toContain("'unsafe-eval'");
      // Should not allow general wildcards (but *.vercel.app is acceptable)
      expect(cspValue).not.toMatch(/script-src[^;]*\*(?!\.vercel\.app)/);

      // Should maintain frame protection
      expect(cspValue).toContain("default-src 'self'");
    });
  });

  describe('Development vs Production CSP Differences', () => {
    test('should have more permissive CSP in development', async () => {
      process.env.NODE_ENV = 'development';

      const headers = await nextConfig.headers();
      const securityConfig = headers.find(config => config.source === '/(.*)')?.headers;
      const cspHeader = securityConfig?.find(header => header.key === 'Content-Security-Policy');

      const cspValue = cspHeader.value;

      // Development should allow eval and local connections
      expect(cspValue).toContain("'unsafe-eval'");
      expect(cspValue).toContain("localhost");
    });

    test('should have stricter CSP in production with Vercel exceptions', async () => {
      process.env.NODE_ENV = 'production';

      const headers = await nextConfig.headers();
      const securityConfig = headers.find(config => config.source === '/(.*)')?.headers;
      const cspHeader = securityConfig?.find(header => header.key === 'Content-Security-Policy');

      const cspValue = cspHeader.value;

      // Production should not allow eval
      expect(cspValue).not.toContain("'unsafe-eval'");

      // But should allow Vercel domains
      expect(cspValue).toContain('https://vercel.live');
      expect(cspValue).toContain('https://*.vercel.app');

      // Should not allow localhost in production
      expect(cspValue).not.toContain('localhost');
    });
  });

  describe('Vercel Live Feedback Script Compatibility', () => {
    test('should allow the specific Vercel Live feedback script', async () => {
      process.env.NODE_ENV = 'production';

      const headers = await nextConfig.headers();
      const securityConfig = headers.find(config => config.source === '/(.*)')?.headers;
      const cspHeader = securityConfig?.find(header => header.key === 'Content-Security-Policy');

      const cspValue = cspHeader.value;

      // Parse script-src directive
      const scriptSrcMatch = cspValue.match(/script-src\s+([^;]+)/);
      expect(scriptSrcMatch).toBeTruthy();

      const scriptSrcValue = scriptSrcMatch[1];

      // Should allow the specific feedback script domain
      expect(scriptSrcValue).toContain('https://vercel.live');

      // Should allow the script that was being blocked:
      // https://vercel.live/_next-live/feedback/feedback.js
      const allowedSources = scriptSrcValue.split(' ');
      const hasVercelLive = allowedSources.some(source =>
        source === 'https://vercel.live' || source === 'https://*.vercel.app'
      );

      expect(hasVercelLive).toBe(true);
    });

    test('should prevent the original CSP violation error', async () => {
      process.env.NODE_ENV = 'production';

      const headers = await nextConfig.headers();
      const securityConfig = headers.find(config => config.source === '/(.*)')?.headers;
      const cspHeader = securityConfig?.find(header => header.key === 'Content-Security-Policy');

      // The original error was:
      // "Refused to load the script 'https://vercel.live/_next-live/feedback/feedback.js'
      //  because it violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline'"

      // The fix should allow this script
      const cspValue = cspHeader.value;

      // Parse the current script-src directive
      const scriptSrcMatch = cspValue.match(/script-src\s+([^;]+)/);
      const scriptSrc = scriptSrcMatch[1];

      // Should now include vercel.live in addition to 'self' and 'unsafe-inline'
      expect(scriptSrc).toContain("'self'");
      expect(scriptSrc).toContain("'unsafe-inline'");
      expect(scriptSrc).toContain('https://vercel.live');

      // This combination should allow the feedback script to load
      const allowedSources = ['self', 'unsafe-inline', 'https://vercel.live', 'https://*.vercel.app'];
      allowedSources.forEach(source => {
        const quotedSource = source.startsWith('http') ? source : `'${source}'`;
        expect(scriptSrc).toContain(quotedSource);
      });
    });
  });

  describe('CSP Security Validation', () => {
    test('should maintain essential security headers', async () => {
      const headers = await nextConfig.headers();
      const securityConfig = headers.find(config => config.source === '/(.*)')?.headers;

      const expectedSecurityHeaders = [
        'X-Frame-Options',
        'X-Content-Type-Options',
        'Referrer-Policy',
        'X-XSS-Protection',
        'Content-Security-Policy'
      ];

      expectedSecurityHeaders.forEach(headerName => {
        const header = securityConfig.find(h => h.key === headerName);
        expect(header).toBeDefined();
        expect(header.value).toBeDefined();
      });
    });

    test('should not allow dangerous CSP directives', async () => {
      process.env.NODE_ENV = 'production';

      const headers = await nextConfig.headers();
      const securityConfig = headers.find(config => config.source === '/(.*)')?.headers;
      const cspHeader = securityConfig?.find(header => header.key === 'Content-Security-Policy');

      const cspValue = cspHeader.value;

      // Should not allow dangerous directives in production
      expect(cspValue).not.toContain("'unsafe-eval'");
      expect(cspValue).not.toContain('data: javascript:');
      expect(cspValue).not.toContain('* http:');
    });

    test('should properly scope allowed domains', async () => {
      process.env.NODE_ENV = 'production';

      const headers = await nextConfig.headers();
      const securityConfig = headers.find(config => config.source === '/(.*)')?.headers;
      const cspHeader = securityConfig?.find(header => header.key === 'Content-Security-Policy');

      const cspValue = cspHeader.value;

      // Should allow specific Vercel domains, not all domains
      expect(cspValue).toContain('https://vercel.live');
      expect(cspValue).toContain('https://*.vercel.app');

      // Should not allow general https: in script-src (but connect-src https: is acceptable)
      expect(cspValue).not.toMatch(/script-src[^;]*\bhttps:\s/);
    });
  });

  describe('Regression Prevention', () => {
    test('should prevent reverting to overly restrictive CSP', async () => {
      process.env.NODE_ENV = 'production';

      const headers = await nextConfig.headers();
      const securityConfig = headers.find(config => config.source === '/(.*)')?.headers;
      const cspHeader = securityConfig?.find(header => header.key === 'Content-Security-Policy');

      const cspValue = cspHeader.value;

      // The problematic CSP that caused the Vercel Live script to be blocked:
      const problematicCSP = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https:; font-src 'self';";

      // Current CSP should NOT be the same as the problematic one
      expect(cspValue).not.toBe(problematicCSP);

      // Should include Vercel domains
      expect(cspValue).toContain('vercel.live');
    });

    test('should validate CSP syntax is correct', async () => {
      process.env.NODE_ENV = 'production';

      const headers = await nextConfig.headers();
      const securityConfig = headers.find(config => config.source === '/(.*)')?.headers;
      const cspHeader = securityConfig?.find(header => header.key === 'Content-Security-Policy');

      const cspValue = cspHeader.value;

      // Should have proper CSP directive syntax
      const cspDirectives = cspValue.split(';').map(d => d.trim()).filter(d => d);

      cspDirectives.forEach(directive => {
        // Each directive should have a name and values
        const parts = directive.split(/\s+/);
        expect(parts.length).toBeGreaterThan(1);

        const directiveName = parts[0];
        const validDirectives = [
          'default-src', 'script-src', 'style-src', 'img-src',
          'connect-src', 'font-src', 'object-src', 'frame-src'
        ];

        expect(validDirectives.includes(directiveName)).toBe(true);
      });
    });
  });

  describe('File Configuration Validation', () => {
    test('should ensure next.config.js contains the CSP fix', () => {
      const configPath = path.join(process.cwd(), 'next.config.js');
      const configContent = fs.readFileSync(configPath, 'utf8');

      // Should contain Vercel domain allowances
      expect(configContent).toContain('https://vercel.live');
      expect(configContent).toContain('https://*.vercel.app');

      // Should not contain the old restrictive CSP
      expect(configContent).not.toContain(`"script-src 'self' 'unsafe-inline';"`);
    });

    test('should maintain environment-based CSP configuration', () => {
      const configPath = path.join(process.cwd(), 'next.config.js');
      const configContent = fs.readFileSync(configPath, 'utf8');

      // Should have different CSP for development and production
      expect(configContent).toContain('isDevelopment');
      expect(configContent).toContain('NODE_ENV');
      expect(configContent).toMatch(/value:\s*isDevelopment\s*\?.*:/);
    });
  });
});

describe('Vercel Platform Integration Tests', () => {
  test('should allow all necessary Vercel platform scripts', async () => {
    process.env.NODE_ENV = 'production';

    const configModule = await import(path.join(process.cwd(), 'next.config.js') + '?t=' + Date.now());
    const nextConfig = configModule.default;
    const headers = await nextConfig.headers();
    const securityConfig = headers.find(config => config.source === '/(.*)')?.headers;
    const cspHeader = securityConfig?.find(header => header.key === 'Content-Security-Policy');

    const cspValue = cspHeader.value;

    // Common Vercel script patterns that should be allowed
    const vercelScriptPatterns = [
      'vercel.live',
      '*.vercel.app',
      '_next-live',
      'feedback'
    ];

    // Parse script-src directive
    const scriptSrcMatch = cspValue.match(/script-src\s+([^;]+)/);
    const scriptSrc = scriptSrcMatch[1];

    // Should allow Vercel domains that cover these patterns
    expect(scriptSrc).toContain('https://vercel.live');
    expect(scriptSrc).toContain('https://*.vercel.app');
  });

  test('should support Vercel deployment domains', async () => {
    process.env.NODE_ENV = 'production';

    const configModule = await import(path.join(process.cwd(), 'next.config.js') + '?t=' + Date.now());
    const nextConfig = configModule.default;
    const headers = await nextConfig.headers();

    // Should allow the main deployment domain
    const apiConfig = headers.find(config => config.source === '/api/:path*');
    expect(apiConfig).toBeDefined();

    const originHeader = apiConfig.headers.find(h => h.key === 'Access-Control-Allow-Origin');
    expect(originHeader.value).toContain('https://ifpa-strategy.vercel.app');
  });
});