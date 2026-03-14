import { test, expect } from '../../../fixtures/test-base';

/**
 * CF Card List Pagination Tests
 * Verifies that card list views show pagination controls when items are present.
 *
 * Regression test for FWT-799: card-only list views had no scrolling or pagination,
 * causing content to be cut off at the bottom of the viewport.
 *
 * Uses authenticatedPage (login only) and endpointManager to connect
 * existing endpoints without clearing/re-registering them.
 */

test.describe('Card List Pagination', () => {

  /** Navigate to /cloud-foundry, which auto-redirects to the single endpoint */
  async function goToCfTab(page: any, tabLabel: string, urlSuffix: string) {
    await page.goto('/cloud-foundry');
    // Wait for redirect to /cloud-foundry/{guid}/...
    await page.waitForURL(/\/cloud-foundry\/[^/]+/, { timeout: 15000 });

    // Wait for loading overlay to clear before interacting
    const overlay = page.locator('.loading-page__overlay');
    await overlay.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});

    const tab = page.locator('button, a').filter({ hasText: tabLabel });
    await tab.waitFor({ state: 'visible', timeout: 10000 });
    await tab.click();
    await page.waitForURL(new RegExp(urlSuffix), { timeout: 10000 });

    // Wait for loading overlay again after tab navigation
    await overlay.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
  }

  test('organizations page should show paginator', async ({ authenticatedPage: page, endpointManager }) => {
    await endpointManager.connectAllEndpoints();
    await goToCfTab(page, 'Organizations', 'organizations');

    const list = page.locator('.list-component');
    await list.waitFor({ state: 'visible' });

    const cards = list.locator('.list-component__body-inner app-cards');
    await expect(cards).toBeVisible();

    const paginator = list.locator('.list-component__paginator');
    await expect(paginator).toBeVisible();
  });

  test('routes page should show paginator', async ({ authenticatedPage: page, endpointManager }) => {
    await endpointManager.connectAllEndpoints();
    await goToCfTab(page, 'Routes', 'routes');

    const list = page.locator('.list-component');
    await list.waitFor({ state: 'visible' });

    const bodyInner = list.locator('.list-component__body-inner');
    await expect(bodyInner).toBeVisible();

    const paginator = list.locator('.list-component__paginator');
    await expect(paginator).toBeVisible();
  });

  test('build packs page should show paginator', async ({ authenticatedPage: page, endpointManager }) => {
    await endpointManager.connectAllEndpoints();
    await goToCfTab(page, 'Build Packs', 'build-packs');

    const list = page.locator('.list-component');
    await list.waitFor({ state: 'visible' });

    const bodyInner = list.locator('.list-component__body-inner');
    await expect(bodyInner).toBeVisible();

    const paginator = list.locator('.list-component__paginator');
    await expect(paginator).toBeVisible();
  });

  test('feature flags page should show paginator', async ({ authenticatedPage: page, endpointManager }) => {
    await endpointManager.connectAllEndpoints();
    await goToCfTab(page, 'Feature Flags', 'feature-flags');

    const list = page.locator('.list-component');
    await list.waitFor({ state: 'visible' });

    const bodyInner = list.locator('.list-component__body-inner');
    await expect(bodyInner).toBeVisible();

    const paginator = list.locator('.list-component__paginator');
    await expect(paginator).toBeVisible();
  });

});
