import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Stratos E2E tests
 * Migrated from Protractor configuration
 */
export default defineConfig({
  // Test directory
  testDir: './e2e/tests',

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 4 : undefined,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'e2e-reports/html' }],
    ['json', { outputFile: 'e2e-reports/results.json' }],
    ['list']
  ],

  // Shared settings for all the projects below
  use: {
    // Base URL for navigation
    baseURL: process.env.STRATOS_E2E_BASE_URL || 'https://localhost:5440',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Accept self-signed certificates (dev environment)
    ignoreHTTPSErrors: true,

    // Maximum time each action can take
    actionTimeout: 10000,

    // Maximum navigation time
    navigationTimeout: 30000,
  },

  // Global timeout for each test
  timeout: 40000, // Matches Protractor allScriptsTimeout

  // Global setup timeout
  globalSetup: undefined,

  // Global teardown timeout
  globalTeardown: undefined,

  // Expect timeout
  expect: {
    timeout: 5000,
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Chrome-specific options matching Protractor config
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-infobars',
            '--allow-insecure-localhost',
          ],
        },
      },
    },

    // Uncomment to test on Firefox
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // Uncomment to test on WebKit (Safari)
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Run your local dev server before starting the tests
  // Comment out if running against a different server
  webServer: {
    command: 'bun run start',
    url: 'https://localhost:5440',
    reuseExistingServer: true, // Always reuse existing server (dev server + backend must be running)
    ignoreHTTPSErrors: true,
    timeout: 120000, // 2 minutes to start server
  },
});
