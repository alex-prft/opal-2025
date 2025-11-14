import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard Complete Workflow', () => {
  test('complete admin workflow: view ’ filter ’ export ’ fix', async ({ page, request }) => {
    // Step 1: Navigate to admin dashboard
    await page.goto('/engine/admin/data-mapping');

    // Wait for data to load
    await page.waitForSelector('[data-testid="mapping-table"]');

    // Verify dashboard is loaded
    await expect(page.locator('h1')).toContainText('Admin Dashboard - Data Mapping');
    await expect(page.locator('[data-testid="mapping-table"]')).toBeVisible();

    // Step 2: Analyze current mapping status
    const summaryCards = page.locator('.grid .border');
    await expect(summaryCards).toHaveCount({ gte: 3 });

    // Get initial counts
    const totalSections = await page.locator('text=Total Sections').locator('..').locator('.text-2xl').textContent();
    const completeMappings = await page.locator('text=Complete Mappings').locator('..').locator('.text-2xl').textContent();

    console.log(`Initial status - Total: ${totalSections}, Complete: ${completeMappings}`);

    // Step 3: Filter data to find issues
    await page.fill('[data-testid="search-input"]', 'strategy');
    await page.waitForTimeout(500);

    // Check filtered results
    const filteredRows = await page.locator('[data-testid="mapping-table"] tbody tr').count();
    expect(filteredRows).toBeGreaterThan(0);

    // Step 4: Check for partial/missing mappings
    await page.selectOption('[data-testid="status-filter"]', 'missing');
    await page.waitForTimeout(500);

    const missingRows = await page.locator('[data-testid="mapping-table"] tbody tr').count();

    // Step 5: Clear filters to see all data
    await page.fill('[data-testid="search-input"]', '');
    await page.selectOption('[data-testid="status-filter"]', 'all');
    await page.waitForTimeout(500);

    // Step 6: Export current data (if export functionality is available)
    const exportButton = page.locator('button:has-text("Export CSV")');
    if (await exportButton.isVisible()) {
      const downloadPromise = page.waitForEvent('download');
      await exportButton.click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/mapping.*\.csv/);
    }

    // Step 7: Check auto-fix recommendations
    // First, call the API to see what fixes are available
    const fixPreviewResponse = await request.get('/api/admin/fix-mapping');
    expect(fixPreviewResponse.status()).toBe(200);

    const fixPreviewData = await fixPreviewResponse.json();
    console.log(`Auto-fix preview - Total changes: ${fixPreviewData.totalChanges}`);

    // Step 8: Apply auto-fixes if there are any
    if (fixPreviewData.totalChanges > 0) {
      // First try dry run
      const dryRunResponse = await request.post('/api/admin/fix-mapping', {
        data: { dryRun: true }
      });
      expect(dryRunResponse.status()).toBe(200);

      const dryRunData = await dryRunResponse.json();
      expect(dryRunData.success).toBe(true);

      // Apply actual fixes
      const applyFixesResponse = await request.post('/api/admin/fix-mapping', {
        data: { dryRun: false }
      });
      expect(applyFixesResponse.status()).toBe(200);

      const fixedData = await applyFixesResponse.json();
      expect(fixedData.success).toBe(true);
      expect(fixedData.totalFixesApplied).toBeGreaterThan(0);

      console.log(`Applied ${fixedData.totalFixesApplied} fixes`);

      // Step 9: Reload dashboard to see updated data
      await page.reload();
      await page.waitForSelector('[data-testid="mapping-table"]');

      // Verify improvements in mapping completeness
      const newCompleteMappings = await page.locator('text=Complete Mappings').locator('..').locator('.text-2xl').textContent();

      // The number of complete mappings should have increased or stayed the same
      expect(parseInt(newCompleteMappings || '0')).toBeGreaterThanOrEqual(parseInt(completeMappings || '0'));

      console.log(`After fixes - Complete mappings: ${newCompleteMappings}`);
    }

    // Step 10: Verify integration status
    await expect(page.getByText('Integration Status')).toBeVisible();

    // Step 11: Check content blueprint and roadmap sections
    await expect(page.getByText('Content Blueprint')).toBeVisible();
    await expect(page.getByText('Results Roadmap')).toBeVisible();

    // Final verification: Ensure dashboard is fully functional
    await page.fill('[data-testid="search-input"]', 'analytics');
    await page.waitForTimeout(500);

    const finalFilteredRows = await page.locator('[data-testid="mapping-table"] tbody tr').count();
    if (finalFilteredRows > 0) {
      await expect(page.locator('[data-testid="mapping-table"] tbody tr').first()).toContainText(/analytics/i);
    }
  });

  test('audit and fix workflow with detailed validation', async ({ page, request }) => {
    // Navigate to dashboard
    await page.goto('/engine/admin/data-mapping');
    await page.waitForSelector('[data-testid="mapping-table"]');

    // Step 1: Get comprehensive mapping status
    const statusResponse = await request.get('/api/admin/mapping-status');
    expect(statusResponse.status()).toBe(200);

    const statusData = await statusResponse.json();
    const initialSummary = statusData.mapping_validation_summary;

    console.log('Initial validation summary:', {
      total: initialSummary.total_sections,
      complete: initialSummary.complete_mappings,
      partial: initialSummary.partial_mappings,
      missing: initialSummary.missing_mappings,
      tier3_gaps: initialSummary.missing_tier3,
      agent_gaps: initialSummary.agent_gaps,
      endpoint_gaps: initialSummary.endpoint_gaps
    });

    // Step 2: Analyze specific issues in the UI
    const tableRows = page.locator('[data-testid="mapping-table"] tbody tr');
    const totalRows = await tableRows.count();

    // Check each row for status
    const statusCounts = { complete: 0, partial: 0, missing: 0 };

    for (let i = 0; i < Math.min(totalRows, 10); i++) { // Check first 10 rows
      const row = tableRows.nth(i);
      const statusBadge = row.locator('[data-testid="badge"]').last(); // Assuming last badge is status

      if (await statusBadge.isVisible()) {
        const statusText = await statusBadge.textContent();
        if (statusText?.includes('Complete')) statusCounts.complete++;
        else if (statusText?.includes('Partial')) statusCounts.partial++;
        else if (statusText?.includes('Missing')) statusCounts.missing++;
      }
    }

    console.log('UI status counts (first 10 rows):', statusCounts);

    // Step 3: Get auto-fix preview
    const fixPreviewResponse = await request.get('/api/admin/fix-mapping');
    const fixPreview = await fixPreviewResponse.json();

    if (fixPreview.totalChanges > 0) {
      console.log('Auto-fix preview:', {
        totalChanges: fixPreview.totalChanges,
        summary: fixPreview.fixSummary
      });

      // Step 4: Apply fixes in dry run mode first
      const dryRunResponse = await request.post('/api/admin/fix-mapping', {
        data: { dryRun: true }
      });

      const dryRunResult = await dryRunResponse.json();
      expect(dryRunResult.success).toBe(true);

      // Step 5: Apply actual fixes
      const fixResponse = await request.post('/api/admin/fix-mapping', {
        data: { dryRun: false }
      });

      const fixResult = await fixResponse.json();
      expect(fixResult.success).toBe(true);

      console.log('Fixes applied:', {
        totalFixes: fixResult.totalFixesApplied,
        fixPath: fixResult.fixedMappingPath
      });

      // Step 6: Verify improvements
      const updatedStatusResponse = await request.get('/api/admin/mapping-status');
      const updatedStatus = await updatedStatusResponse.json();
      const updatedSummary = updatedStatus.mapping_validation_summary;

      console.log('Updated validation summary:', {
        total: updatedSummary.total_sections,
        complete: updatedSummary.complete_mappings,
        partial: updatedSummary.partial_mappings,
        missing: updatedSummary.missing_mappings,
        tier3_gaps: updatedSummary.missing_tier3,
        agent_gaps: updatedSummary.agent_gaps,
        endpoint_gaps: updatedSummary.endpoint_gaps
      });

      // Verify improvements
      expect(updatedSummary.complete_mappings).toBeGreaterThanOrEqual(initialSummary.complete_mappings);
      expect(updatedSummary.missing_tier3).toBeLessThanOrEqual(initialSummary.missing_tier3);
      expect(updatedSummary.agent_gaps).toBeLessThanOrEqual(initialSummary.agent_gaps);
      expect(updatedSummary.endpoint_gaps).toBeLessThanOrEqual(initialSummary.endpoint_gaps);

      // Step 7: Reload UI and verify changes are reflected
      await page.reload();
      await page.waitForSelector('[data-testid="mapping-table"]');

      // Check that the summary cards reflect the improvements
      const newCompleteCount = await page.locator('text=Complete Mappings').locator('..').locator('.text-2xl').textContent();
      expect(parseInt(newCompleteCount || '0')).toBe(updatedSummary.complete_mappings);

      // Step 8: Clean up fixed files (optional)
      const cleanupResponse = await request.delete('/api/admin/fix-mapping');
      expect(cleanupResponse.status()).toBe(200);

      const cleanupResult = await cleanupResponse.json();
      expect(cleanupResult.success).toBe(true);
    } else {
      console.log('No fixes needed - all mappings are complete');
    }
  });

  test('error handling and recovery workflow', async ({ page, request }) => {
    // Test the dashboard's resilience to various error conditions

    // Step 1: Test API error handling
    await page.route('/api/admin/mapping-status', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Simulated server error' })
      });
    });

    await page.goto('/engine/admin/data-mapping');

    // Should handle the error gracefully
    await page.waitForTimeout(2000);

    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy(); // Page should still render

    // Step 2: Remove the route override and reload
    await page.unroute('/api/admin/mapping-status');
    await page.reload();
    await page.waitForSelector('[data-testid="mapping-table"]');

    // Should recover and load data normally
    await expect(page.locator('h1')).toContainText('Admin Dashboard');

    // Step 3: Test fix API error handling
    await page.route('/api/admin/fix-mapping', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Fix operation failed' })
      });
    });

    // Try to call the fix API directly
    const errorResponse = await request.get('/api/admin/fix-mapping');
    expect(errorResponse.status()).toBe(500);

    // Step 4: Test partial data scenarios
    await page.unroute('/api/admin/fix-mapping');
    await page.route('/api/admin/mapping-status', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          mapping_table: [],
          mapping_validation_summary: {
            total_sections: 0,
            complete_mappings: 0,
            partial_mappings: 0,
            missing_mappings: 0,
            missing_tier3: 0,
            agent_gaps: 0,
            endpoint_gaps: 0
          },
          content_blueprint: {},
          results_roadmap: [],
          integration_status: { sdk_status: 'error' },
          generated_at: new Date().toISOString()
        })
      });
    });

    await page.reload();

    // Should handle empty data gracefully
    await expect(page.getByText(/No mappings found matching the current filters/)).toBeVisible();

    // Step 5: Restore normal functionality
    await page.unroute('/api/admin/mapping-status');
    await page.reload();
    await page.waitForSelector('[data-testid="mapping-table"]');

    // Should be back to normal
    await expect(page.locator('[data-testid="mapping-table"]')).toBeVisible();
  });

  test('performance and responsiveness workflow', async ({ page }) => {
    // Test dashboard performance with various operations

    // Step 1: Measure initial load time
    const startTime = Date.now();
    await page.goto('/engine/admin/data-mapping');
    await page.waitForSelector('[data-testid="mapping-table"]');
    const loadTime = Date.now() - startTime;

    console.log(`Dashboard load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(10000); // Should load within 10 seconds

    // Step 2: Test search performance
    const searchStartTime = Date.now();
    await page.fill('[data-testid="search-input"]', 'strategy');
    await page.waitForTimeout(500);
    const searchTime = Date.now() - searchStartTime;

    console.log(`Search operation time: ${searchTime}ms`);
    expect(searchTime).toBeLessThan(2000); // Search should be fast

    // Step 3: Test filter performance
    const filterStartTime = Date.now();
    await page.selectOption('[data-testid="status-filter"]', 'complete');
    await page.waitForTimeout(500);
    const filterTime = Date.now() - filterStartTime;

    console.log(`Filter operation time: ${filterTime}ms`);
    expect(filterTime).toBeLessThan(2000);

    // Step 4: Test sort performance
    const sortStartTime = Date.now();
    await page.click('th:has-text("Tier 1")');
    await page.waitForTimeout(500);
    const sortTime = Date.now() - sortStartTime;

    console.log(`Sort operation time: ${sortTime}ms`);
    expect(sortTime).toBeLessThan(2000);

    // Step 5: Test responsive design
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);

    await expect(page.locator('[data-testid="mapping-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="search-input"]')).toBeVisible();

    // Test mobile interactions
    await page.fill('[data-testid="search-input"]', 'analytics');
    await page.waitForTimeout(500);

    const mobileRows = await page.locator('[data-testid="mapping-table"] tbody tr').count();
    if (mobileRows > 0) {
      await expect(page.locator('[data-testid="mapping-table"] tbody tr').first()).toContainText(/analytics/i);
    }

    // Step 6: Return to desktop view
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);

    await expect(page.locator('[data-testid="mapping-table"]')).toBeVisible();
  });
});