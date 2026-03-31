import { test, expect } from '../../fixtures/test-base';

/**
 * Visual inspection — screenshot key pages to verify no regressions.
 * Waits for data to fully render before capturing.
 *
 * Run: STRATOS_E2E_BASE_URL=https://console.run.adepttech.ca npx playwright test visual-inspection
 */

// Set a wide viewport so pages render fully
test.use({ viewport: { width: 1440, height: 900 } });

/** Wait for the page to fully render: network idle + no progress bars + content visible */
async function waitForPageReady(page: import('@playwright/test').Page) {
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});

  // Wait for progress bars to disappear (Stratos shows indeterminate progress during load)
  await page.locator('.progress-bar').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});

  // Wait for the main content area to have visible children
  await page.locator('.list-component, .card, app-info-card, .dashboard-page, .home-page')
    .first()
    .waitFor({ state: 'visible', timeout: 10000 })
    .catch(() => {});

  // Small settle time for animations/transitions
  await page.waitForTimeout(1000);
}

// CF pages need the GUID — resolve it once
let cfBaseUrl: string;

const corePages = [
  { name: 'home', path: '/' },
  { name: 'about', path: '/about' },
  { name: 'about-diagnostics', path: '/about/diagnostics' },
  { name: 'endpoints', path: '/endpoints' },
  { name: 'applications', path: '/applications' },
  { name: 'marketplace', path: '/marketplace' },
  { name: 'services', path: '/services' },
];

// CF sub-pages that need the CF GUID prefix
const cfSubPages = [
  { name: 'cf-orgs', suffix: '/organizations' },
  { name: 'cf-users', suffix: '/users' },
  { name: 'cf-routes', suffix: '/routes' },
  { name: 'cf-events', suffix: '/events' },
  { name: 'cf-feature-flags', suffix: '/feature-flags' },
  { name: 'cf-build-packs', suffix: '/build-packs' },
  { name: 'cf-stacks', suffix: '/stacks' },
  { name: 'cf-security-groups', suffix: '/security-groups' },
];

test.describe('Visual Inspection', () => {

  // Resolve CF GUID before CF sub-page tests
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'e2e/.auth/admin.json',
      ignoreHTTPSErrors: true,
    });
    const page = await context.newPage();
    await page.goto('/cloud-foundry');
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(3000);
    cfBaseUrl = page.url(); // e.g., .../cloud-foundry/<guid>/summary
    // Strip /summary if present to get the base CF URL
    cfBaseUrl = cfBaseUrl.replace(/\/summary$/, '');
    await context.close();
  });

  // Core pages (no CF GUID needed)
  for (const { name, path } of corePages) {
    test(`screenshot ${name}`, async ({ adminPage }) => {
      await adminPage.goto(path);
      await waitForPageReady(adminPage);
      await adminPage.screenshot({
        path: `e2e-screenshots/visual-inspection/${name}.png`,
        fullPage: true,
      });
    });
  }

  // CF Summary (uses redirected URL)
  test('screenshot cf-summary', async ({ adminPage }) => {
    await adminPage.goto('/cloud-foundry');
    await waitForPageReady(adminPage);
    await adminPage.screenshot({
      path: 'e2e-screenshots/visual-inspection/cf-summary.png',
      fullPage: true,
    });
  });

  // CF sub-pages (use resolved GUID)
  for (const { name, suffix } of cfSubPages) {
    test(`screenshot ${name}`, async ({ adminPage }) => {
      test.skip(!cfBaseUrl, 'Could not resolve CF GUID');
      await adminPage.goto(`${cfBaseUrl}${suffix}`);
      await waitForPageReady(adminPage);
      await adminPage.screenshot({
        path: `e2e-screenshots/visual-inspection/${name}.png`,
        fullPage: true,
      });
    });
  }

  // Events multi-select interaction
  test('screenshot events multi-select', async ({ adminPage }) => {
    test.skip(!cfBaseUrl, 'Could not resolve CF GUID');
    await adminPage.goto(`${cfBaseUrl}/events`);
    await waitForPageReady(adminPage);

    await adminPage.screenshot({
      path: 'e2e-screenshots/visual-inspection/events-initial.png',
      fullPage: true,
    });

    // Open the type dropdown
    const typeSelect = adminPage.locator('app-select[name="type"]');
    if (await typeSelect.isVisible()) {
      await typeSelect.click();
      await adminPage.waitForTimeout(500);
      await adminPage.screenshot({
        path: 'e2e-screenshots/visual-inspection/events-dropdown-open.png',
        fullPage: true,
      });

      // Select first option
      const firstOption = adminPage.locator('app-option').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();
        await adminPage.waitForTimeout(2000);
        await adminPage.screenshot({
          path: 'e2e-screenshots/visual-inspection/events-one-selected.png',
          fullPage: true,
        });
      }
    }
  });

  // Dark mode screenshots
  test('screenshot dark mode', async ({ adminPage }) => {
    await adminPage.goto('/');
    await waitForPageReady(adminPage);

    // Toggle dark mode via the theme button
    const darkToggle = adminPage.locator('[class*="theme-toggle"], button').filter({ hasText: /dark/i }).first();
    if (await darkToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      await darkToggle.click();
      await adminPage.waitForTimeout(1000);
    }

    await adminPage.screenshot({
      path: 'e2e-screenshots/visual-inspection/home-dark.png',
      fullPage: true,
    });

    await adminPage.goto('/applications');
    await waitForPageReady(adminPage);
    await adminPage.screenshot({
      path: 'e2e-screenshots/visual-inspection/applications-dark.png',
      fullPage: true,
    });

    await adminPage.goto('/marketplace');
    await waitForPageReady(adminPage);
    await adminPage.screenshot({
      path: 'e2e-screenshots/visual-inspection/marketplace-dark.png',
      fullPage: true,
    });
  });
});
