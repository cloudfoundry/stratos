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
async function waitForPageReady(page: import('@playwright/test').Page, { extraWait = 0 } = {}) {
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});

  // Wait for progress bars to disappear (Stratos shows indeterminate progress during load)
  await page.locator('.progress-bar').waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});

  // Wait for the main content area to have visible children
  await page.locator('.list-component, .card, app-info-card, .dashboard-page, .home-page')
    .first()
    .waitFor({ state: 'visible', timeout: 15000 })
    .catch(() => {});

  // Wait for any data tables/cards to populate
  await page.locator('app-table tr, .meta-card, .list-component__body').first()
    .waitFor({ state: 'visible', timeout: 10000 })
    .catch(() => {});

  // Settle time for animations/transitions + extra for slow pages
  await page.waitForTimeout(1500 + extraWait);
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

  // CF sub-pages (use resolved GUID) — extra wait for API-heavy pages
  const slowCfPages = ['cf-orgs', 'cf-users', 'cf-routes', 'cf-events'];
  for (const { name, suffix } of cfSubPages) {
    test(`screenshot ${name}`, async ({ adminPage }) => {
      test.skip(!cfBaseUrl, 'Could not resolve CF GUID');
      await adminPage.goto(`${cfBaseUrl}${suffix}`);
      const extra = slowCfPages.includes(name) ? 3000 : 0;
      await waitForPageReady(adminPage, { extraWait: extra });
      await adminPage.screenshot({
        path: `e2e-screenshots/visual-inspection/${name}.png`,
        fullPage: true,
      });
    });
  }

  // Org summary — navigate to first org and screenshot
  test('screenshot org-summary', async ({ adminPage }) => {
    test.setTimeout(120000);
    test.skip(!cfBaseUrl, 'Could not resolve CF GUID');
    await adminPage.goto(`${cfBaseUrl}/organizations`);
    await waitForPageReady(adminPage, { extraWait: 3000 });

    // Org cards use clickAction (not <a> tags) — click the first card
    const orgCard = adminPage.locator('app-meta-card').first();
    const hasOrgs = await orgCard.isVisible({ timeout: 15000 }).catch(() => false);
    test.skip(!hasOrgs, 'No organizations loaded (CF backend may be unavailable)');
    await orgCard.click();
    await waitForPageReady(adminPage);
    await adminPage.screenshot({
      path: 'e2e-screenshots/visual-inspection/org-summary.png',
      fullPage: true,
    });
  });

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

  // Dark mode screenshots — visits 3 pages, needs extra time
  test('screenshot dark mode', async ({ adminPage }) => {
    test.setTimeout(180000);
    await adminPage.goto('/');
    await waitForPageReady(adminPage);

    // Toggle dark mode via the theme-toggle-button
    const themeToggle = adminPage.locator('button.theme-toggle-button');
    await themeToggle.waitFor({ state: 'visible', timeout: 5000 });

    // Check current label — click to toggle to dark if currently showing "Light"
    const label = await themeToggle.locator('.theme-label').textContent();
    if (label?.trim() === 'Light') {
      await themeToggle.click();
      // Wait for dark-theme class to appear on body
      await adminPage.waitForFunction(() => document.body.classList.contains('dark-theme'), { timeout: 5000 });
      await adminPage.waitForTimeout(500);
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
    await waitForPageReady(adminPage, { extraWait: 2000 });
    await adminPage.screenshot({
      path: 'e2e-screenshots/visual-inspection/marketplace-dark.png',
      fullPage: true,
    });

    // Toggle back to light for other tests
    const toggleBack = adminPage.locator('button.theme-toggle-button');
    const darkLabel = await toggleBack.locator('.theme-label').textContent();
    if (darkLabel?.trim() === 'Dark') {
      await toggleBack.click();
      await adminPage.waitForTimeout(500);
    }
  });
});
