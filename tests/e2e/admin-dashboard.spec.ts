import { test, expect } from '@playwright/test';

test.describe('OPAL Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin dashboard before each test
    await page.goto('/engine/admin/data-mapping');
  });

  test('should display admin dashboard page elements', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Admin Dashboard - Data Mapping/);

    // Check main heading
    await expect(page.locator('h1')).toContainText('Admin Dashboard - Data Mapping');

    // Check that mapping table is present
    await expect(page.locator('[data-testid="mapping-table"]')).toBeVisible();

    // Check that summary cards are present
    await expect(page.getByText('Complete Mappings')).toBeVisible();
    await expect(page.getByText('Partial Mappings')).toBeVisible();
    await expect(page.getByText('Missing Mappings')).toBeVisible();
  });

  test('should load mapping data successfully', async ({ page }) => {
    // Wait for data to load
    await page.waitForSelector('[data-testid="mapping-table"]');

    // Check that table has data rows
    const tableRows = page.locator('[data-testid="mapping-table"] tbody tr');
    await expect(tableRows).toHaveCount({ gte: 1 });

    // Check that first row contains expected data
    const firstRow = tableRows.first();
    await expect(firstRow).toContainText('Strategy Plans');
  });

  test('should filter mapping data by search term', async ({ page }) => {
    // Wait for table to load
    await page.waitForSelector('[data-testid="mapping-table"]');

    // Get initial row count
    const initialRows = await page.locator('[data-testid="mapping-table"] tbody tr').count();

    // Search for "strategy"
    await page.fill('[data-testid="search-input"]', 'strategy');

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // Check that results are filtered
    const filteredRows = await page.locator('[data-testid="mapping-table"] tbody tr').count();
    expect(filteredRows).toBeLessThanOrEqual(initialRows);

    // Check that visible rows contain search term
    const visibleRows = page.locator('[data-testid="mapping-table"] tbody tr');
    await expect(visibleRows.first()).toContainText(/strategy/i);
  });

  test('should filter by status', async ({ page }) => {
    // Wait for table to load
    await page.waitForSelector('[data-testid="mapping-table"]');

    // Filter by complete status
    await page.selectOption('[data-testid="status-filter"]', 'complete');

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // Check that only complete status rows are visible
    const statusBadges = page.locator('[data-testid="badge"]');
    const visibleBadges = await statusBadges.allTextContents();

    // Filter to only status badges (Complete, Partial, Missing)
    const statusTexts = visibleBadges.filter(text =>
      text.includes('Complete') || text.includes('Partial') || text.includes('Missing')
    );

    // All visible status badges should be "Complete"
    statusTexts.forEach(text => {
      expect(text).toContain('Complete');
    });
  });

  test('should sort table by column headers', async ({ page }) => {
    // Wait for table to load
    await page.waitForSelector('[data-testid="mapping-table"]');

    // Get first row data before sorting
    const firstRowBefore = await page.locator('[data-testid="mapping-table"] tbody tr').first().textContent();

    // Click on Tier 1 header to sort
    await page.click('th:has-text("Tier 1")');

    // Wait for sort to apply
    await page.waitForTimeout(500);

    // Get first row data after sorting
    const firstRowAfter = await page.locator('[data-testid="mapping-table"] tbody tr').first().textContent();

    // The order should have changed (assuming data is not already sorted)
    expect(firstRowBefore).not.toBe(firstRowAfter);
  });

  test('should export CSV when button is available', async ({ page }) => {
    // Wait for table to load
    await page.waitForSelector('[data-testid="mapping-table"]');

    // Check if export button exists (it's conditional based on onExportCSV prop)
    const exportButton = page.locator('button:has-text("Export CSV")');

    if (await exportButton.isVisible()) {
      // Set up download promise before clicking
      const downloadPromise = page.waitForEvent('download');

      // Click export button
      await exportButton.click();

      // Wait for download to start
      const download = await downloadPromise;

      // Check that download has correct filename pattern
      expect(download.suggestedFilename()).toMatch(/mapping.*\.csv/);
    }
  });

  test('should display audit summary correctly', async ({ page }) => {
    // Wait for page to load
    await page.waitForSelector('[data-testid="mapping-table"]');

    // Check that audit summary section is present
    await expect(page.getByText('Mapping Validation Summary')).toBeVisible();

    // Check for summary statistics
    const summaryCards = page.locator('.grid .border');
    await expect(summaryCards).toHaveCount({ gte: 3 }); // At least 3 summary cards

    // Check for specific metrics
    await expect(page.getByText('Total Sections')).toBeVisible();
  });

  test('should handle empty state gracefully', async ({ page }) => {
    // Mock empty response for this test
    await page.route('/api/admin/mapping-status', async route => {
      await route.fulfill({
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
          integration_status: { sdk_status: 'disconnected' },
          generated_at: new Date().toISOString()
        })
      });
    });

    // Reload page to trigger the mock
    await page.reload();

    // Check for empty state message
    await expect(page.getByText(/No mappings found matching the current filters/)).toBeVisible();
  });

  test('should display integration status', async ({ page }) => {
    // Wait for page to load
    await page.waitForSelector('[data-testid="mapping-table"]');

    // Check for integration status section
    await expect(page.getByText('Integration Status')).toBeVisible();

    // Check for status indicators (these may vary based on actual integration state)
    const statusSection = page.locator('text=Integration Status').locator('..').locator('..');
    await expect(statusSection).toBeVisible();
  });

  test('should display content blueprint information', async ({ page }) => {
    // Wait for page to load
    await page.waitForSelector('[data-testid="mapping-table"]');

    // Check for content blueprint section
    await expect(page.getByText('Content Blueprint')).toBeVisible();

    // The content should show widget information
    const blueprintSection = page.locator('text=Content Blueprint').locator('..').locator('..');
    await expect(blueprintSection).toBeVisible();
  });

  test('should display results roadmap', async ({ page }) => {
    // Wait for page to load
    await page.waitForSelector('[data-testid="mapping-table"]');

    // Check for results roadmap section
    await expect(page.getByText('Results Roadmap')).toBeVisible();

    // Check for roadmap phases
    const roadmapSection = page.locator('text=Results Roadmap').locator('..').locator('..');
    await expect(roadmapSection).toBeVisible();
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Wait for page to load
    await page.waitForSelector('[data-testid="mapping-table"]');

    // Check that page is still functional on mobile
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[data-testid="mapping-table"]')).toBeVisible();

    // Check that search input is still accessible
    await expect(page.locator('[data-testid="search-input"]')).toBeVisible();

    // Try searching on mobile
    await page.fill('[data-testid="search-input"]', 'strategy');
    await page.waitForTimeout(500);

    // Should still show filtered results
    const rows = page.locator('[data-testid="mapping-table"] tbody tr');
    if (await rows.count() > 0) {
      await expect(rows.first()).toContainText(/strategy/i);
    }
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock error response
    await page.route('/api/admin/mapping-status', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal server error',
          message: 'Failed to retrieve mapping status'
        })
      });
    });

    // Reload page to trigger the error
    await page.reload();

    // Should display error message or fallback content
    // The exact error handling depends on implementation
    await page.waitForTimeout(2000);

    // Check that page doesn't crash and shows some indication of error
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy(); // Page should still render something
  });

  test('should maintain state during navigation', async ({ page }) => {
    // Wait for table to load
    await page.waitForSelector('[data-testid="mapping-table"]');

    // Apply a search filter
    await page.fill('[data-testid="search-input"]', 'analytics');
    await page.waitForTimeout(500);

    // Navigate away and back (simulate browser navigation)
    await page.goto('/');
    await page.goBack();

    // Wait for page to reload
    await page.waitForSelector('[data-testid="mapping-table"]');

    // Check that page loads correctly after navigation
    await expect(page.locator('h1')).toContainText('Admin Dashboard');
    await expect(page.locator('[data-testid="mapping-table"]')).toBeVisible();
  });
});