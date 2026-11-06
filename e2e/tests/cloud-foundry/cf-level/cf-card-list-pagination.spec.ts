import { test, expect } from '../../../fixtures/test-base';

/**
 * CF List Pagination Tests
 * Verifies that list views have pagination controls present (not hidden)
 * when items exceed the minimum page size.
 *
 * Regression test: list views had the paginator clipped off-screen
 * due to broken flex chain between app-list host element and its container.
 *
 * Uses authenticatedPage (login only) and endpointManager to connect
 * existing endpoints without clearing/re-registering them.
 */

test.describe('CF List Pagination', () => {
  test.setTimeout(120000);

  /** Navigate to /cloud-foundry, which auto-redirects to the single endpoint */
  async function goToCfTab(page: any, tabLabel: string, urlSuffix: string) {
    await page.goto('/cloud-foundry');
    await page.waitForURL(/\/cloud-foundry\/[^/]+/, { timeout: 15000 });

    const overlay = page.locator('.loading-page__overlay');
    await overlay.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});

    const tab = page.locator('button, a').filter({ hasText: tabLabel });
    await tab.waitFor({ state: 'visible', timeout: 10000 });
    await tab.click();
    await page.waitForURL(new RegExp(urlSuffix), { timeout: 10000 });

    await overlay.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
    const progress = page.locator('.progress-bar');
    await progress.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
  }

  /** Assert the paginator is present and not hidden (may be below viewport fold) */
  async function expectPaginatorPresent(page: any, timeout = 15000) {
    // Use polling to wait for the hidden attribute to become false
    await expect.poll(async () => {
      return await page.evaluate(() => {
        const el = document.querySelector('.list-component__paginator') as HTMLElement;
        if (!el) return 'not-found';
        if (el.hidden) return 'hidden';
        if (window.getComputedStyle(el).display === 'none') return 'display-none';
        return 'visible';
      });
    }, { timeout }).toBe('visible');
  }

  test('organizations page should show paginator', async ({ authenticatedPage: page, endpointManager }) => {
    await endpointManager.connectAllEndpoints();
    await goToCfTab(page, 'Organizations', 'organizations');

    // Wait for card data
    const bodyInner = page.locator('.list-component__body-inner');
    await bodyInner.waitFor({ state: 'visible', timeout: 30000 });
    await page.waitForTimeout(3000);

    await expectPaginatorPresent(page);
  });

  test('routes page should show paginator', async ({ authenticatedPage: page, endpointManager }) => {
    await endpointManager.connectAllEndpoints();
    await goToCfTab(page, 'Routes', 'routes');

    // Wait for table rows — routes can take longer to load
    const tableRow = page.locator('.list-component tbody tr');
    await tableRow.first().waitFor({ state: 'visible', timeout: 30000 });
    // Routes use server-side pagination; the totalResults observable
    // takes longer to settle than card-based lists
    await page.waitForTimeout(5000);

    await expectPaginatorPresent(page, 30000);
  });

  test('build packs page should show paginator', async ({ authenticatedPage: page, endpointManager }) => {
    await endpointManager.connectAllEndpoints();
    await goToCfTab(page, 'Build Packs', 'build-packs');

    // Wait for card data
    const bodyInner = page.locator('.list-component__body-inner');
    await bodyInner.waitFor({ state: 'visible', timeout: 30000 });
    await page.waitForTimeout(3000);

    await expectPaginatorPresent(page);
  });

});
