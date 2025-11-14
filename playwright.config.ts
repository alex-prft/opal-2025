import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for OSA Admin Dashboard E2E Tests
 * Production-ready browser testing configuration
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './__tests__/e2e', // Updated to our new test directory
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Enhanced reporters for production monitoring */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'test-results/playwright-results.xml' }],
    ['json', { outputFile: 'test-results/playwright-results.json' }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Enhanced debugging and monitoring */
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  /* Test timeouts */
  timeout: 30000, // 30 seconds per test
  expect: {
    timeout: 10000, // 10 seconds for assertions
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports - enabled for responsive testing */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    /* Test against branded browsers - enabled for comprehensive coverage */
    {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 minutes to start the server
    env: {
      // Test environment variables for proper OPAL integration testing
      NODE_ENV: 'test',
      OPAL_API_BASE: process.env.OPAL_API_BASE || 'https://api.opal.optimizely.com',
      OPAL_API_KEY: process.env.OPAL_API_KEY || 'test-api-key',
      OPAL_WORKSPACE_ID: process.env.OPAL_WORKSPACE_ID || 'test-workspace',
      OPAL_STRATEGY_WORKFLOW_AUTH_KEY: process.env.OPAL_STRATEGY_WORKFLOW_AUTH_KEY || 'test-auth-key',
      OSA_WEBHOOK_SHARED_SECRET: process.env.OSA_WEBHOOK_SHARED_SECRET || 'test-webhook-secret',
    },
  },

  /* Output directories for test artifacts */
  outputDir: 'test-results/playwright-artifacts',

  /* Test metadata for reporting */
  metadata: {
    project: 'OSA Admin Dashboard',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'test',
  },
});