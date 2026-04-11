import { defineConfig, devices } from '@playwright/test';

// Default secrets profile — auto-detect from base URL, fall back to 'local'
if (!process.env.E2E_PROFILE) {
  const baseUrl = process.env.E2E_BASE_URL || '';
  process.env.E2E_PROFILE = baseUrl.includes('adepttech') ? 'adepttech' : 'local';
}

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

  // Worker count: configurable via E2E_WORKERS env var.
  // Each worker gets its own authenticated session to avoid session contention.
  // Default: CI=4, local=half CPU cores (Playwright default)
  workers: process.env.E2E_WORKERS
    ? parseInt(process.env.E2E_WORKERS)
    : (process.env.CI ? 4 : undefined),

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'e2e-reports/html' }],
    ['json', { outputFile: 'e2e-reports/results.json' }],
    ['list']
  ],

  // Shared settings for all the projects below
  use: {
    // Base URL for navigation
    baseURL: process.env.E2E_BASE_URL || `https://localhost:${FRONTEND_PORT}`,

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
  // SSO login fixtures can take 15-20s each (headless browser OAuth flow)
  timeout: 90000,

  // Report test environment status before tests start
  globalSetup: './e2e/global-setup.ts',

  // Kill test servers (identified by STRATOS_E2E env var) after tests complete
  globalTeardown: './e2e/global-teardown.ts',

  // Expect timeout
  expect: {
    timeout: 5000,
  },

  // Configure projects — auth setup runs once, then tests reuse saved state
  projects: [
    {
      name: 'setup',
      testDir: './e2e',
      testMatch: /auth\.setup\.ts/,
      use: { storageState: undefined },
    },
    {
      name: 'chromium',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        // Default to admin state — fixtures override per-test as needed
        storageState: 'e2e/.auth/admin.json',
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

    {
      name: 'firefox',
      dependencies: ['setup'],
      use: { ...devices['Desktop Firefox'], storageState: 'e2e/.auth/admin.json' },
    },

    {
      name: 'webkit',
      dependencies: ['setup'],
      use: { ...devices['Desktop Safari'], storageState: 'e2e/.auth/admin.json' },
    },
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
  // Skip local servers when targeting a remote deployment
  ...(process.env.E2E_BASE_URL ? {} : {
    webServer: [
      {
        command: `cd src/jetstream && STRATOS_E2E=e2e:${BACKEND_PORT} CONSOLE_PROXY_TLS_ADDRESS=:${BACKEND_PORT} SESSION_STORE_EXPIRY=120 ../../dist/bin/jetstream`,
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
  }),
});
