import { test, expect } from '../../fixtures/test-base';

/**
 * Pagination E2E Tests (FWT-800)
 *
 * Tests page size options, "All" option, and session memory.
 * Uses the CF Organizations page on adepttech (55 orgs) as the
 * primary test surface.
 *
 * Run against adepttech:
 *   STRATOS_E2E_BASE_URL=https://console.run.adepttech.ca \
 *   STRATOS_E2E_PROFILE=adepttech npx playwright test pagination
 */

test.describe('Pagination', () => {

  /** Navigate to CF orgs page via sidebar after login, wait for data to load */
  async function goToOrgsPage(page: any): Promise<boolean> {
    // Click Cloud Foundry in sidebar
    const cfNav = page.locator('a').filter({ hasText: /Cloud Foundry/i }).first();
    const cfVisible = await cfNav.isVisible({ timeout: 10000 }).catch(() => false);
    if (!cfVisible) return false;
    await cfNav.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Click Organizations in sub-nav
    const orgsNav = page.locator('a').filter({ hasText: /Organizations/i }).first();
    const orgsVisible = await orgsNav.isVisible({ timeout: 10000 }).catch(() => false);
    if (!orgsVisible) return false;
    await orgsNav.click();
    await page.waitForLoadState('networkidle');

    // Wait for paginator to show data (not "0 of 0")
    const paginatorInfo = page.locator('app-paginator .paginator-info span').first();
    try {
      await paginatorInfo.filter({ hasNotText: '0 of 0' }).waitFor({ timeout: 30000 });
    } catch {
      return false;
    }

    return await page.locator('app-paginator').isVisible().catch(() => false);
  }

  test.describe('Page Size Options', () => {

    test('should show new page size options', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      if (!await goToOrgsPage(page)) {
        test.skip('Organizations page not reachable or no paginator');
      }

      const options = await page.locator('app-paginator select#pageSize option').allTextContents();
      const trimmed = options.map(t => t.trim());

      // New options present
      expect(trimmed).toContain('6');
      expect(trimmed).toContain('12');
      expect(trimmed).toContain('24');
      expect(trimmed).toContain('48');
      expect(trimmed).toContain('96');

      // Old options gone
      expect(trimmed).not.toContain('9');
      expect(trimmed).not.toContain('30');
      expect(trimmed).not.toContain('80');

      // "All" option exists
      expect(trimmed.some(t => t.startsWith('All'))).toBeTruthy();
    });

    test('should show "All" with item count', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      if (!await goToOrgsPage(page)) {
        test.skip('Organizations page not reachable or no paginator');
      }

      // Get total from paginator info "X - Y of Z"
      const info = (await page.locator('app-paginator .paginator-info span').first().textContent()) || '';
      const totalMatch = info.match(/of\s+(\d+)/);

      // Find the All option by its value (-1)
      const allOption = page.locator('app-paginator select#pageSize option[value="-1"]');
      const allText = (await allOption.textContent({ timeout: 5000 }))?.trim() || '';

      if (totalMatch) {
        expect(allText).toBe(`All (${totalMatch[1]})`);
      } else {
        expect(allText).toMatch(/^All/);
      }
    });

    test('should update display when page size changes', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      if (!await goToOrgsPage(page)) {
        test.skip('Organizations page not reachable or no paginator');
      }

      await page.locator('app-paginator select#pageSize').selectOption('12');

      // Wait for paginator info to reflect the new page size
      const paginatorInfo = page.locator('app-paginator .paginator-info span').first();
      await paginatorInfo.filter({ hasText: /1\s*-\s*\d+\s*of\s*\d+/ }).waitFor({ timeout: 10000 });

      const info = (await paginatorInfo.textContent()) || '';
      expect(info).toMatch(/1\s*-\s*12\s*of\s*\d+/);
    });

    test('should show all items when "All" selected', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      if (!await goToOrgsPage(page)) {
        test.skip('Organizations page not reachable or no paginator');
      }

      await page.locator('app-paginator select#pageSize').selectOption('-1');
      await page.waitForTimeout(500);

      const info = (await page.locator('app-paginator .paginator-info span').first().textContent()) || '';
      const match = info.match(/1\s*-\s*(\d+)\s*of\s*(\d+)/);

      if (match) {
        expect(match[1]).toBe(match[2]);
      }

      await expect(page.locator('app-paginator button[title="Next page"]')).toBeDisabled();
    });
  });

  test.describe('Session Memory', () => {

    test('should remember page size after navigating away and back', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      if (!await goToOrgsPage(page)) {
        test.skip('Organizations page not reachable or no paginator');
      }

      // Set page size to 24
      await page.locator('app-paginator select#pageSize').selectOption('24');
      await page.waitForTimeout(500);

      // Navigate to home
      const homeNav = page.locator('a').filter({ hasText: /Home/i }).first();
      await homeNav.click();
      await page.waitForLoadState('networkidle');

      // Navigate back to orgs
      await goToOrgsPage(page);

      const value = await page.locator('app-paginator select#pageSize').inputValue();
      expect(value).toBe('24');
    });

    test('should inherit last choice on a different list', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      if (!await goToOrgsPage(page)) {
        test.skip('Organizations page not reachable or no paginator');
      }

      // Set page size to 12 on orgs
      await page.locator('app-paginator select#pageSize').selectOption('12');
      await page.waitForTimeout(500);

      // Navigate to Applications (different list)
      const appsNav = page.locator('a, button').filter({ hasText: /^Applications$/ }).first();
      const appsVisible = await appsNav.isVisible({ timeout: 3000 }).catch(() => false);
      if (!appsVisible) {
        test.skip('Applications nav not visible');
      }
      await appsNav.click();
      await page.waitForLoadState('networkidle');

      const paginator = page.locator('app-paginator');
      const visible = await paginator.isVisible({ timeout: 5000 }).catch(() => false);
      if (!visible) {
        test.skip('Applications page has no paginator');
      }

      // Should inherit 12 from orgs
      const value = await paginator.locator('select#pageSize').inputValue();
      expect(value).toBe('12');
    });
  });
});
