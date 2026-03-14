import { defineConfig, devices } from '@playwright/test';

// Default secrets profile to 'local' unless overridden
process.env.STRATOS_E2E_PROFILE ??= 'local';

// Test environment ports (separate from dev to avoid conflicts)
const BACKEND_PORT = process.env.BACKEND_PORT || '5543';
const FRONTEND_PORT = process.env.FRONTEND_PORT || '5540';

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
    baseURL: process.env.STRATOS_E2E_BASE_URL || `https://localhost:${FRONTEND_PORT}`,

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

  // Report test environment status before tests start
  globalSetup: './e2e/global-setup.ts',

  // Kill test servers (identified by STRATOS_E2E env var) after tests complete
  globalTeardown: './e2e/global-teardown.ts',

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

  // Auto-start backend and frontend for tests using dedicated ports.
  // Reuses existing servers if already running on these ports.
  //
  // Process identification: STRATOS_E2E=e2e:<backend_port> is set as an env
  // var on both backend and frontend processes. This appears in the command
  // line visible to pkill/pgrep, enabling targeted cleanup without PID files
  // (which can become stale if a process crashes).
  //
  // The backend port is the session ID — one ID covers both processes.
  //
  //   ps aux | grep 'STRATOS_E2E=e2e'       # find all test sessions
  //   ps aux | grep 'e2e:5543'             # find a specific session
  //   pkill -f 'e2e:5543'                  # kill a specific session
  webServer: [
    {
      command: `cd src/jetstream && STRATOS_E2E=e2e:${BACKEND_PORT} CONSOLE_PROXY_TLS_ADDRESS=:${BACKEND_PORT} ../../dist/bin/jetstream`,
      url: `https://localhost:${BACKEND_PORT}/pp/v1/info`,
      reuseExistingServer: true,
      ignoreHTTPSErrors: true,
      timeout: 30000,
    },
    {
      command: `STRATOS_E2E=e2e:${BACKEND_PORT} BACKEND_PORT=${BACKEND_PORT} bun run ng serve --port ${FRONTEND_PORT} --proxy-config proxy.conf.cjs`,
      url: `https://localhost:${FRONTEND_PORT}`,
      reuseExistingServer: true,
      ignoreHTTPSErrors: true,
      timeout: 120000,
    },
  ],
});
