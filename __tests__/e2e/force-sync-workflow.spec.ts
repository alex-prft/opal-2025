/**
 * Force Sync E2E Workflow Tests
 * End-to-end tests for force sync UI interactions and workflows
 */

import { test, expect, Page } from '@playwright/test';

// Test configuration
test.describe.configure({ mode: 'serial' });

test.describe('Force Sync Workflow', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test.beforeEach(async () => {
    // Navigate to admin dashboard
    await page.goto('/engine/admin');
    await page.waitForLoadState('networkidle');

    // Ensure force sync component is loaded
    await expect(page.locator('[data-testid="force-sync-trigger"]')).toBeVisible();
  });

  test('should display force sync trigger button', async () => {
    const forceSyncButton = page.locator('[data-testid="force-sync-trigger"]');

    await expect(forceSyncButton).toBeVisible();
    await expect(forceSyncButton).toHaveText(/force sync/i);
    await expect(forceSyncButton).toBeEnabled();
  });

  test('should show force sync progress when triggered', async () => {
    // Mock API responses for controlled testing
    await page.route('**/api/force-sync/trigger', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          correlation_id: 'test-correlation-123',
          session_id: 'test-session-456',
          polling_url: '/api/force-sync/status/test-session-456',
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
      const message = progress === 100 ? 'Force sync completed successfully' : `Processing... (${progress}%)`;

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          session_id: 'test-session-456',
          status,
          progress,
          message,
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          polling_interval: status === 'in_progress' ? 2000 : null,
          details: status === 'completed' ? { workflow_id: 'completed-workflow-123' } : null
        })
      });
    });

    // Trigger force sync
    await page.click('[data-testid="force-sync-trigger"]');

    // Should show loading state
    await expect(page.locator('[data-testid="force-sync-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="force-sync-progress-bar"]')).toBeVisible();

    // Should show progress updates
    await expect(page.locator('[data-testid="force-sync-message"]')).toHaveText(/processing/i);

    // Wait for completion
    await expect(page.locator('[data-testid="force-sync-status"]')).toHaveText(/completed/i, { timeout: 10000 });

    // Should show success state
    await expect(page.locator('[data-testid="force-sync-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="force-sync-workflow-id"]')).toHaveText(/completed-workflow-123/);
  });

  test('should handle force sync cancellation', async () => {
    // Mock long-running sync
    await page.route('**/api/force-sync/trigger', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          session_id: 'long-running-session',
          polling_url: '/api/force-sync/status/long-running-session'
        })
      });
    });

    await page.route('**/api/force-sync/status/long-running-session', async route => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            session_id: 'long-running-session',
            message: 'Sync operation cancelled successfully'
          })
        });
      } else {
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

    // Trigger sync
    await page.click('[data-testid="force-sync-trigger"]');

    // Wait for progress to show
    await expect(page.locator('[data-testid="force-sync-progress"]')).toBeVisible();

    // Cancel button should appear
    await expect(page.locator('[data-testid="force-sync-cancel"]')).toBeVisible();

    // Click cancel
    await page.click('[data-testid="force-sync-cancel"]');

    // Should show cancellation confirmation
    await expect(page.locator('[data-testid="force-sync-cancelled"]')).toBeVisible();
    await expect(page.locator('[data-testid="force-sync-message"]')).toHaveText(/cancelled/i);
  });

  test('should handle force sync errors gracefully', async () => {
    // Mock sync failure
    await page.route('**/api/force-sync/trigger', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Internal Server Error',
          message: 'Force sync failed: OPAL workflow timeout'
        })
      });
    });

    // Trigger sync
    await page.click('[data-testid="force-sync-trigger"]');

    // Should show error state
    await expect(page.locator('[data-testid="force-sync-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="force-sync-error-message"]')).toHaveText(/opal workflow timeout/i);

    // Retry button should be available
    await expect(page.locator('[data-testid="force-sync-retry"]')).toBeVisible();
  });

  test('should show concurrent sync prevention', async () => {
    // Mock active sync check
    await page.route('**/api/force-sync/trigger', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            has_active_sync: true,
            active_syncs: [{
              session_id: 'existing-session-123',
              status: 'in_progress',
              progress: 60,
              message: 'Another sync in progress',
              started_at: new Date().toISOString()
            }]
          })
        });
      } else {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Sync Already Active',
            message: 'Another force sync is currently in progress',
            active_sync: {
              session_id: 'existing-session-123',
              status: 'in_progress',
              polling_url: '/api/force-sync/status/existing-session-123'
            }
          })
        });
      }
    });

    // Try to trigger sync
    await page.click('[data-testid="force-sync-trigger"]');

    // Should show concurrent sync warning
    await expect(page.locator('[data-testid="concurrent-sync-warning"]')).toBeVisible();
    await expect(page.locator('[data-testid="concurrent-sync-message"]')).toHaveText(/another force sync is currently in progress/i);

    // Should show link to existing sync
    await expect(page.locator('[data-testid="existing-sync-link"]')).toBeVisible();
    await expect(page.locator('[data-testid="existing-sync-session-id"]')).toHaveText(/existing-session-123/);
  });

  test('should display force sync metrics', async () => {
    // Mock metrics data
    await page.route('**/api/webhook-events/stats**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          forceSync: {
            lastForceSync: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
            forceSyncSuccess: true,
            forceSyncAgentCount: 9,
            total_syncs_24h: 5,
            success_rate_24h: 0.8
          }
        })
      });
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should show metrics
    await expect(page.locator('[data-testid="force-sync-metrics"]')).toBeVisible();
    await expect(page.locator('[data-testid="last-sync-time"]')).toBeVisible();
    await expect(page.locator('[data-testid="sync-count-24h"]')).toHaveText(/5 total/);
    await expect(page.locator('[data-testid="success-rate"]')).toHaveText(/80%/);
  });
});

test.describe('Health Status Monitoring', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/engine/admin');
    await page.waitForLoadState('networkidle');
  });

  test('should display health status components', async () => {
    // Mock health data
    await page.route('**/api/opal/health', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'healthy',
          data: {
            status: 'healthy',
            checks: {
              database: {
                status: 'connected',
                latency_ms: 25
              },
              opal_api: {
                status: 'available',
                response_time_ms: 150
              },
              webhooks: {
                status: 'active',
                last_received: new Date().toISOString()
              },
              workflow_engine: {
                status: 'operational',
                active_workflows: 3
              }
            },
            fallback_used: false
          },
          timestamp: new Date().toISOString()
        })
      });
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should show health status cards
    await expect(page.locator('[data-testid="health-status-database"]')).toBeVisible();
    await expect(page.locator('[data-testid="health-status-opal-api"]')).toBeVisible();
    await expect(page.locator('[data-testid="health-status-webhooks"]')).toBeVisible();
    await expect(page.locator('[data-testid="health-status-workflow-engine"]')).toBeVisible();

    // Should show healthy status
    await expect(page.locator('[data-testid="health-status-database"] [data-testid="status-badge"]')).toHaveText('connected');
    await expect(page.locator('[data-testid="health-status-opal-api"] [data-testid="status-badge"]')).toHaveText('available');

    // Should show metrics
    await expect(page.locator('[data-testid="database-latency"]')).toHaveText(/25ms/);
    await expect(page.locator('[data-testid="opal-response-time"]')).toHaveText(/150ms/);
    await expect(page.locator('[data-testid="active-workflows"]')).toHaveText(/3/);
  });

  test('should handle degraded health status', async () => {
    // Mock degraded health
    await page.route('**/api/opal/health', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'degraded',
          data: {
            status: 'degraded',
            checks: {
              database: {
                status: 'connected',
                latency_ms: 250 // High latency
              },
              opal_api: {
                status: 'degraded',
                response_time_ms: 5000,
                last_error: 'Timeout after 3000ms'
              },
              webhooks: {
                status: 'active',
                last_received: new Date(Date.now() - 600000).toISOString() // 10 minutes ago
              },
              workflow_engine: {
                status: 'operational',
                active_workflows: 1
              }
            },
            fallback_used: false,
            warnings: ['OPAL API experiencing high latency', 'No recent webhook activity']
          }
        })
      });
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should show degraded status
    await expect(page.locator('[data-testid="health-overall-status"]')).toHaveText(/degraded/i);
    await expect(page.locator('[data-testid="health-status-opal-api"] [data-testid="status-badge"]')).toHaveText('degraded');

    // Should show warnings
    await expect(page.locator('[data-testid="health-warnings"]')).toBeVisible();
    await expect(page.locator('[data-testid="health-warning-message"]')).toContainText('OPAL API experiencing high latency');
  });

  test('should show fallback data when health check fails', async () => {
    // Mock health service returning cached data
    await page.route('**/api/opal/health', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'degraded',
          data: {
            status: 'degraded',
            checks: {
              database: { status: 'connected' },
              opal_api: { status: 'available' },
              webhooks: { status: 'active' },
              workflow_engine: { status: 'operational' }
            },
            fallback_used: true,
            cache_age_ms: 180000 // 3 minutes old
          },
          cached: true,
          error: 'Health check failed, using cached data'
        })
      });
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should show cached data indicator
    await expect(page.locator('[data-testid="health-cached-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="health-cache-age"]')).toHaveText(/180s old/);

    // Should show fallback warning
    await expect(page.locator('[data-testid="health-fallback-warning"]')).toBeVisible();
    await expect(page.locator('[data-testid="fallback-message"]')).toHaveText(/using cached health data/i);
  });
});

test.describe('Agent Status Monitoring', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/engine/admin');
    await page.waitForLoadState('networkidle');
  });

  test('should display agent status grid', async () => {
    // Mock agent data
    await page.route('**/api/webhook-events/stats**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          agentStatuses: {
            integration_health: 'success',
            content_review: 'success',
            geo_audit: 'failed',
            audience_suggester: 'success',
            experiment_blueprinter: 'unknown',
            personalization_idea_generator: 'success',
            customer_journey: 'success',
            roadmap_generator: 'success',
            cmp_organizer: 'success'
          }
        })
      });
    });

    await page.route('**/api/monitoring/agent-logs**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          agent_error_patterns: [{
            agent_id: 'geo_audit',
            agent_name: 'Geographic Audit',
            error_count: 3,
            last_error: new Date().toISOString(),
            recent_errors: [{
              timestamp: new Date().toISOString(),
              message: 'Location service timeout'
            }]
          }]
        })
      });
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should show agent grid
    await expect(page.locator('[data-testid="agent-status-grid"]')).toBeVisible();

    // Should show individual agents
    await expect(page.locator('[data-testid="agent-integration-health"]')).toBeVisible();
    await expect(page.locator('[data-testid="agent-geo-audit"]')).toBeVisible();

    // Should show error count for problematic agents
    await expect(page.locator('[data-testid="agent-geo-audit"] [data-testid="error-count"]')).toHaveText(/3 errors/);

    // Should show last error time
    await expect(page.locator('[data-testid="agent-geo-audit"] [data-testid="last-error-time"]')).toBeVisible();
  });

  test('should expand webhook events when requested', async () => {
    // Mock webhook events
    await page.route('**/api/diagnostics/last-webhook**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          events: [
            {
              id: 'webhook-1',
              workflow_id: 'workflow-123',
              agent_id: 'integration_health',
              http_status: 200,
              signature_valid: true,
              processing_time_ms: 150,
              timestamp: new Date().toISOString()
            },
            {
              id: 'webhook-2',
              workflow_id: 'workflow-456',
              agent_id: 'geo_audit',
              http_status: 500,
              signature_valid: true,
              processing_time_ms: 3000,
              timestamp: new Date(Date.now() - 300000).toISOString() // 5 minutes ago
            }
          ]
        })
      });
    });

    // Click expand webhook events
    await page.click('[data-testid="expand-webhook-events"]');

    // Should show webhook events
    await expect(page.locator('[data-testid="webhook-events-panel"]')).toBeVisible();

    // Should show individual events
    await expect(page.locator('[data-testid="webhook-event-webhook-1"]')).toBeVisible();
    await expect(page.locator('[data-testid="webhook-event-webhook-2"]')).toBeVisible();

    // Should show status badges
    await expect(page.locator('[data-testid="webhook-event-webhook-1"] [data-testid="status-badge"]')).toHaveText('200');
    await expect(page.locator('[data-testid="webhook-event-webhook-2"] [data-testid="status-badge"]')).toHaveText('500');

    // Should show processing times
    await expect(page.locator('[data-testid="webhook-event-webhook-1"] [data-testid="processing-time"]')).toHaveText('150ms');
    await expect(page.locator('[data-testid="webhook-event-webhook-2"] [data-testid="processing-time"]')).toHaveText('3000ms');
  });
});

test.describe('Responsive Design', () => {
  test('should adapt to mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/engine/admin');
    await page.waitForLoadState('networkidle');

    // Should show compact version of components
    await expect(page.locator('[data-testid="enhanced-recent-data"][data-compact="true"]')).toBeVisible();

    // Force sync button should be smaller
    await expect(page.locator('[data-testid="force-sync-trigger-compact"]')).toBeVisible();

    // Health cards should stack vertically
    const healthCards = page.locator('[data-testid^="health-status-"]');
    const firstCard = healthCards.first();
    const secondCard = healthCards.nth(1);

    const firstCardBox = await firstCard.boundingBox();
    const secondCardBox = await secondCard.boundingBox();

    if (firstCardBox && secondCardBox) {
      expect(secondCardBox.y).toBeGreaterThan(firstCardBox.y + firstCardBox.height - 10);
    }
  });

  test('should show full features on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/engine/admin');
    await page.waitForLoadState('networkidle');

    // Should show full version
    await expect(page.locator('[data-testid="enhanced-recent-data"][data-compact="false"]')).toBeVisible();

    // Should show detailed health monitoring
    await expect(page.locator('[data-testid="health-detailed-view"]')).toBeVisible();

    // Should show force sync management panel
    await expect(page.locator('[data-testid="force-sync-management-panel"]')).toBeVisible();
  });
});