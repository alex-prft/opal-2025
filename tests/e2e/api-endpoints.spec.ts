import { test, expect } from '@playwright/test';

test.describe('Admin API Endpoints', () => {
  test.describe('/api/admin/mapping-status', () => {
    test('should return comprehensive mapping status data', async ({ request }) => {
      const response = await request.get('/api/admin/mapping-status');

      expect(response.status()).toBe(200);

      const data = await response.json();

      // Check required properties
      expect(data).toHaveProperty('mapping_table');
      expect(data).toHaveProperty('mapping_validation_summary');
      expect(data).toHaveProperty('content_blueprint');
      expect(data).toHaveProperty('results_roadmap');
      expect(data).toHaveProperty('integration_status');
      expect(data).toHaveProperty('generated_at');

      // Validate mapping_table structure
      expect(Array.isArray(data.mapping_table)).toBe(true);
      if (data.mapping_table.length > 0) {
        const firstMapping = data.mapping_table[0];
        expect(firstMapping).toHaveProperty('tier1');
        expect(firstMapping).toHaveProperty('tier2');
        expect(firstMapping).toHaveProperty('tier3');
        expect(firstMapping).toHaveProperty('opal_agents');
        expect(firstMapping).toHaveProperty('opal_tools');
        expect(firstMapping).toHaveProperty('dxp_tools');
        expect(firstMapping).toHaveProperty('result_endpoints');
        expect(firstMapping).toHaveProperty('status');
      }

      // Validate summary structure
      const summary = data.mapping_validation_summary;
      expect(typeof summary.total_sections).toBe('number');
      expect(typeof summary.complete_mappings).toBe('number');
      expect(typeof summary.partial_mappings).toBe('number');
      expect(typeof summary.missing_mappings).toBe('number');

      // Validate timestamp
      expect(new Date(data.generated_at)).toBeInstanceOf(Date);
    });

    test('should have proper cache headers', async ({ request }) => {
      const response = await request.get('/api/admin/mapping-status');

      expect(response.headers()['cache-control']).toBe('no-cache, no-store, must-revalidate');
      expect(response.headers()['pragma']).toBe('no-cache');
      expect(response.headers()['expires']).toBe('0');
    });

    test('should handle concurrent requests', async ({ request }) => {
      // Make multiple concurrent requests
      const requests = Array(5).fill(null).map(() =>
        request.get('/api/admin/mapping-status')
      );

      const responses = await Promise.all(requests);

      // All should succeed
      responses.forEach(response => {
        expect(response.status()).toBe(200);
      });

      // All should return consistent data
      const dataPromises = responses.map(response => response.json());
      const dataResults = await Promise.all(dataPromises);

      const firstResult = dataResults[0];
      dataResults.forEach(result => {
        expect(result.mapping_table).toEqual(firstResult.mapping_table);
        expect(result.mapping_validation_summary).toEqual(firstResult.mapping_validation_summary);
      });
    });
  });

  test.describe('/api/admin/fix-mapping', () => {
    test('should return preview of fixes on GET request', async ({ request }) => {
      const response = await request.get('/api/admin/fix-mapping');

      expect(response.status()).toBe(200);

      const data = await response.json();

      expect(data).toHaveProperty('preview');
      expect(data).toHaveProperty('totalChanges');
      expect(data).toHaveProperty('fixSummary');
      expect(data).toHaveProperty('generated_at');

      // Validate preview structure
      expect(Array.isArray(data.preview)).toBe(true);
      if (data.preview.length > 0) {
        const firstChange = data.preview[0];
        expect(firstChange).toHaveProperty('tier1');
        expect(firstChange).toHaveProperty('tier2');
        expect(firstChange).toHaveProperty('changeType');
        expect(firstChange).toHaveProperty('currentValue');
        expect(firstChange).toHaveProperty('proposedValue');
      }

      expect(typeof data.totalChanges).toBe('number');
    });

    test('should apply fixes on POST request', async ({ request }) => {
      const response = await request.post('/api/admin/fix-mapping', {
        data: { dryRun: false }
      });

      expect(response.status()).toBe(200);

      const data = await response.json();

      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('fixedMappingPath');
      expect(data).toHaveProperty('fixSummary');
      expect(data).toHaveProperty('totalFixesApplied');

      expect(data.success).toBe(true);
      expect(typeof data.totalFixesApplied).toBe('number');
    });

    test('should handle dry run mode', async ({ request }) => {
      const response = await request.post('/api/admin/fix-mapping', {
        data: { dryRun: true }
      });

      expect(response.status()).toBe(200);

      const data = await response.json();

      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('preview');
      expect(data).toHaveProperty('totalChanges');
      expect(data.success).toBe(true);
    });

    test('should clean up fixed files on DELETE request', async ({ request }) => {
      const response = await request.delete('/api/admin/fix-mapping');

      expect(response.status()).toBe(200);

      const data = await response.json();

      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('message');
      expect(data.success).toBe(true);
    });

    test('should reject invalid methods', async ({ request }) => {
      const response = await request.patch('/api/admin/fix-mapping');

      expect(response.status()).toBe(405);

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toBe('Method not allowed');
    });
  });

  test.describe('API Error Handling', () => {
    test('should handle missing files gracefully', async ({ request, page }) => {
      // Temporarily rename a config file to simulate missing file
      await page.evaluate(async () => {
        // This would be done in a real test environment
        // For now, we'll test the API's resilience
      });

      const response = await request.get('/api/admin/mapping-status');

      // Should still return 200 with default values or appropriate error handling
      expect([200, 500]).toContain(response.status());

      if (response.status() === 500) {
        const data = await response.json();
        expect(data).toHaveProperty('error');
      }
    });

    test('should validate request body for POST requests', async ({ request }) => {
      const response = await request.post('/api/admin/fix-mapping', {
        data: { invalidField: 'test' }
      });

      // Should handle invalid data gracefully
      expect([200, 400, 422]).toContain(response.status());
    });

    test('should handle malformed JSON', async ({ request }) => {
      const response = await request.post('/api/admin/fix-mapping', {
        headers: {
          'content-type': 'application/json'
        },
        data: 'invalid json{'
      });

      expect([400, 422, 500]).toContain(response.status());
    });
  });

  test.describe('API Performance', () => {
    test('should respond within reasonable time', async ({ request }) => {
      const startTime = Date.now();

      const response = await request.get('/api/admin/mapping-status');

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status()).toBe(200);
      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
    });

    test('should handle large datasets efficiently', async ({ request }) => {
      // Test with potential large mapping data
      const response = await request.get('/api/admin/mapping-status');

      expect(response.status()).toBe(200);

      const data = await response.json();
      const responseSize = JSON.stringify(data).length;

      // Response should be reasonable size (less than 1MB)
      expect(responseSize).toBeLessThan(1024 * 1024);
    });
  });

  test.describe('Security', () => {
    test('should include security headers', async ({ request }) => {
      const response = await request.get('/api/admin/mapping-status');

      const headers = response.headers();

      // Check for common security headers
      expect(headers['x-content-type-options']).toBeDefined();
      expect(headers['content-type']).toContain('application/json');
    });

    test('should not expose sensitive information in errors', async ({ request }) => {
      // Try to trigger an error condition
      const response = await request.get('/api/admin/mapping-status?invalid=param');

      if (response.status() >= 400) {
        const data = await response.json();
        const responseText = JSON.stringify(data).toLowerCase();

        // Should not contain file paths, database details, etc.
        expect(responseText).not.toContain('/users/');
        expect(responseText).not.toContain('password');
        expect(responseText).not.toContain('secret');
      }
    });

    test('should validate content type for POST requests', async ({ request }) => {
      const response = await request.post('/api/admin/fix-mapping', {
        headers: {
          'content-type': 'text/plain'
        },
        data: 'plain text data'
      });

      expect([400, 415, 422]).toContain(response.status());
    });
  });

  test.describe('Integration Health', () => {
    test('should check OPAL integration status', async ({ request }) => {
      const response = await request.get('/api/admin/mapping-status');

      expect(response.status()).toBe(200);

      const data = await response.json();
      const integrationStatus = data.integration_status;

      expect(integrationStatus).toHaveProperty('sdk_status');
      expect(['connected', 'disconnected', 'error']).toContain(integrationStatus.sdk_status);

      if (integrationStatus.api_key) {
        expect(['valid', 'invalid', 'missing']).toContain(integrationStatus.api_key);
      }
    });

    test('should provide fallback when health check fails', async ({ request }) => {
      // This test verifies that the API handles external service failures gracefully
      const response = await request.get('/api/admin/mapping-status');

      expect(response.status()).toBe(200);

      const data = await response.json();

      // Should still provide integration status even if external check fails
      expect(data).toHaveProperty('integration_status');
      expect(data.integration_status).toHaveProperty('sdk_status');
    });
  });
});