/**
 * Comprehensive Force Sync Integration Tests
 * End-to-end testing of force sync workflows and UI interactions
 */

import { test, expect } from '@playwright/test';

test.describe('Force Sync Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin dashboard
    await page.goto('/engine/admin');
    await page.waitForLoadState('networkidle');
  });

  test('Force Sync button triggers workflow and updates Recent Data', async ({ page }) => {
    // Mock successful force sync response
    await page.route('**/api/force-sync/trigger', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          session_id: 'test-session-123',
          correlation_id: 'test-correlation-456',
          polling_url: '/api/force-sync/status/test-session-123',
          message: 'Force sync initiated successfully'
        })
      });
    });

    // Mock status polling responses
    let pollCount = 0;
    await page.route('**/api/force-sync/status/**', async route => {
      pollCount++;
      const progress = Math.min(pollCount * 25, 100);
      const status = progress === 100 ? 'completed' : 'in_progress';

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          session_id: 'test-session-123',
          status,
          progress,
          message: progress === 100 ? 'Sync completed successfully' : `Processing... (${progress}%)`,
          polling_interval: status === 'in_progress' ? 2000 : null
        })
      });
    });

    // Click force sync button
    await page.click('[data-testid="force-sync-trigger"]');

    // Verify loading state
    await expect(page.locator('.loading-indicator')).toBeVisible();
    await expect(page.locator('[data-testid="force-sync-progress"]')).toBeVisible();

    // Wait for completion
    await page.waitForSelector('[data-testid="force-sync-success"]', { timeout: 10000 });

    // Verify Recent Data section updates
    await expect(page.locator('.recent-data-timestamp')).toBeVisible();
    const timestamp = await page.locator('.recent-data-timestamp').textContent();
    expect(timestamp).toContain('ago');

    // Verify success indicators
    await expect(page.locator('[data-testid="force-sync-success"]')).toContainText('completed successfully');
  });

  test('Displays degraded state when health API fails', async ({ page }) => {
    // Mock health API failure
    await page.route('**/api/opal/health**', route => route.fulfill({
      status: 200, // Always returns 200 but with degraded status
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'degraded',
        data: {
          status: 'degraded',
          checks: {
            database: { status: 'connected' },
            opal_api: { status: 'unavailable' },
            webhooks: { status: 'stale' },
            workflow_engine: { status: 'operational' }
          },
          fallback_used: true,
          cache_age_ms: 300000
        },
        cached: true,
        error: 'Health check failed, using cached data'
      })
    }));

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify degraded state indicators
    await expect(page.locator('.status-warning')).toBeVisible();
    await expect(page.locator('.status-warning')).toContainText('Health check unavailable');
    await expect(page.locator('[data-testid="health-cached-indicator"]')).toBeVisible();

    // Verify retry button is available
    await expect(page.locator('[data-testid="retry-health-check"]')).toBeVisible();
  });

  test('Handles concurrent force sync attempts', async ({ page }) => {
    // Mock active sync response
    await page.route('**/api/force-sync/trigger', async route => {
      if (route.request().method() === 'GET') {
        // Check active syncs
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            has_active_sync: false,
            active_syncs: []
          })
        });
      } else {
        // First POST succeeds
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            session_id: 'active-session-123'
          })
        });
      }
    });

    // Mock second request as conflict
    let requestCount = 0;
    await page.route('**/api/force-sync/trigger', async route => {
      requestCount++;
      if (requestCount > 1) {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Sync Already Active',
            message: 'Another force sync is currently in progress',
            active_sync: {
              session_id: 'active-session-123',
              status: 'in_progress'
            }
          })
        });
      }
    });

    // Start first sync
    await page.click('[data-testid="force-sync-trigger"]');
    await expect(page.locator('[data-testid="force-sync-progress"]')).toBeVisible();

    // Try to start second sync (should be prevented)
    await page.click('[data-testid="force-sync-trigger"]');
    await expect(page.locator('[data-testid="concurrent-sync-warning"]')).toBeVisible();
  });

  test('Force sync cancellation workflow', async ({ page }) => {
    // Mock long-running sync
    await page.route('**/api/force-sync/trigger', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          session_id: 'long-session-123'
        })
      });
    });

    await page.route('**/api/force-sync/status/long-session-123', async route => {
      if (route.request().method() === 'DELETE') {
        // Cancellation request
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            session_id: 'long-session-123',
            message: 'Sync cancelled successfully'
          })
        });
      } else {
        // Status check - always in progress
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            status: 'in_progress',
            progress: 30,
            message: 'Long running operation...',
            polling_interval: 2000
          })
        });
      }
    });

    // Start sync
    await page.click('[data-testid="force-sync-trigger"]');
    await expect(page.locator('[data-testid="force-sync-progress"]')).toBeVisible();

    // Wait for cancel button to appear
    await expect(page.locator('[data-testid="force-sync-cancel"]')).toBeVisible();

    // Cancel the sync
    await page.click('[data-testid="force-sync-cancel"]');

    // Verify cancellation
    await expect(page.locator('[data-testid="force-sync-cancelled"]')).toBeVisible();
    await expect(page.locator('[data-testid="force-sync-message"]')).toContainText('cancelled');
  });

  test('Error recovery and retry functionality', async ({ page }) => {
    let attemptCount = 0;

    await page.route('**/api/force-sync/trigger', async route => {
      attemptCount++;

      if (attemptCount === 1) {
        // First attempt fails
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Internal Server Error',
            message: 'Force sync failed: Network timeout'
          })
        });
      } else {
        // Retry succeeds
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            session_id: 'retry-session-123'
          })
        });
      }
    });

    // Initial sync attempt (fails)
    await page.click('[data-testid="force-sync-trigger"]');
    await expect(page.locator('[data-testid="force-sync-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="force-sync-error-message"]')).toContainText('Network timeout');

    // Retry button should be available
    await expect(page.locator('[data-testid="force-sync-retry"]')).toBeVisible();

    // Click retry
    await page.click('[data-testid="force-sync-retry"]');

    // Second attempt should succeed
    await expect(page.locator('[data-testid="force-sync-progress"]')).toBeVisible();
  });

  test('Real-time progress tracking', async ({ page }) => {
    await page.route('**/api/force-sync/trigger', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          session_id: 'progress-session-123'
        })
      });
    });

    // Mock progressive status updates
    let statusCallCount = 0;
    await page.route('**/api/force-sync/status/progress-session-123', async route => {
      statusCallCount++;
      const progress = Math.min(statusCallCount * 20, 100);
      const status = progress === 100 ? 'completed' : 'in_progress';

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          status,
          progress,
          message: `Processing step ${statusCallCount}/5...`,
          details: {
            current_step: `Step ${statusCallCount}`,
            steps_completed: statusCallCount,
            total_steps: 5
          }
        })
      });
    });

    await page.click('[data-testid="force-sync-trigger"]');

    // Verify progress bar updates
    await expect(page.locator('[data-testid="force-sync-progress-bar"]')).toBeVisible();

    // Wait for progress updates
    for (let i = 1; i <= 5; i++) {
      const expectedProgress = Math.min(i * 20, 100);
      await expect(page.locator('[data-testid="progress-percentage"]')).toContainText(`${expectedProgress}%`);
      await page.waitForTimeout(500); // Allow time for polling
    }

    // Final completion check
    await expect(page.locator('[data-testid="force-sync-success"]')).toBeVisible();
  });

  test('Mobile responsive force sync interface', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify mobile-optimized interface
    await expect(page.locator('[data-testid="enhanced-recent-data"][data-compact="true"]')).toBeVisible();
    await expect(page.locator('[data-testid="force-sync-trigger-compact"]')).toBeVisible();

    // Trigger sync on mobile
    await page.route('**/api/force-sync/trigger', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          session_id: 'mobile-session-123'
        })
      });
    });

    await page.click('[data-testid="force-sync-trigger-compact"]');

    // Verify mobile-optimized progress display
    await expect(page.locator('[data-testid="mobile-progress-indicator"]')).toBeVisible();
  });

  test('Health status integration with force sync', async ({ page }) => {
    // Mock healthy status initially
    await page.route('**/api/opal/health**', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'healthy',
        data: {
          status: 'healthy',
          checks: {
            database: { status: 'connected' },
            opal_api: { status: 'available' },
            webhooks: { status: 'active' },
            workflow_engine: { status: 'operational' }
          }
        }
      })
    }));

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify healthy status indicators
    await expect(page.locator('[data-testid="health-status-healthy"]')).toBeVisible();
    await expect(page.locator('[data-testid="force-sync-trigger"]')).toBeEnabled();

    // Mock force sync affecting health
    await page.route('**/api/force-sync/trigger', async route => {
      // After sync trigger, health becomes degraded temporarily
      await page.route('**/api/opal/health**', innerRoute => innerRoute.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'degraded',
          data: {
            status: 'degraded',
            checks: {
              database: { status: 'connected' },
              opal_api: { status: 'busy' },
              webhooks: { status: 'processing' },
              workflow_engine: { status: 'active' }
            }
          }
        })
      }));

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          session_id: 'health-impact-123'
        })
      });
    });

    await page.click('[data-testid="force-sync-trigger"]');

    // Verify health status changes during sync
    await expect(page.locator('[data-testid="health-status-degraded"]')).toBeVisible();
  });
});