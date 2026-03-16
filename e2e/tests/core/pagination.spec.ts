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
      await paginatorInfo.filter({ hasNotText: '0 of 0' }).waitFor({ timeout: 60000 });
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

    test('should have "All" option in dropdown', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      if (!await goToOrgsPage(page)) {
        test.skip('Organizations page not reachable or no paginator');
      }

      // Find the All option by its value (-1)
      const allOption = page.locator('app-paginator select#pageSize option[value="-1"]');
      const allText = (await allOption.textContent({ timeout: 5000 }))?.trim() || '';
      expect(allText).toBe('All');
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

  test.describe('View Toggle', () => {

    /** Navigate to Applications page which supports both card and table views */
    async function goToAppsPage(page: any): Promise<boolean> {
      const appsNav = page.locator('a').filter({ hasText: /Applications/i }).first();
      const visible = await appsNav.isVisible({ timeout: 10000 }).catch(() => false);
      if (!visible) return false;
      await appsNav.click();
      await page.waitForLoadState('networkidle');

      // Wait for data to load — allow extra time after fresh deploys (cold start)
      const paginatorInfo = page.locator('app-paginator .paginator-info span').first();
      try {
        await paginatorInfo.filter({ hasNotText: '0 of 0' }).waitFor({ timeout: 60000 });
      } catch {
        return false;
      }
      return true;
    }

    test('should show card page sizes in card view and table page sizes in table view', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      if (!await goToAppsPage(page)) {
        test.skip('Applications page not reachable or no data');
      }

      const select = page.locator('app-paginator select#pageSize');

      // Ensure we're in card view first
      const tableToggle = page.locator('button[title="Table view"]');
      const cardToggle = page.locator('button[title="Card view"]');

      // If table toggle is visible, we're in card view
      const inCardView = await tableToggle.isVisible({ timeout: 3000 }).catch(() => false);
      if (!inCardView) {
        // Switch to card view
        if (await cardToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
          await cardToggle.click();
          await page.waitForTimeout(1000);
        }
      }

      // Card view should have card options
      const cardOptions = await select.locator('option').allTextContents();
      const cardTrimmed = cardOptions.map(t => t.trim());
      expect(cardTrimmed).toContain('6');
      expect(cardTrimmed).toContain('12');
      expect(cardTrimmed).toContain('96');
      expect(cardTrimmed).not.toContain('10');
      expect(cardTrimmed).not.toContain('25');

      // Switch to table view
      await tableToggle.click();
      await page.waitForTimeout(1000);

      // Table view should have table options
      const tableOptions = await select.locator('option').allTextContents();
      const tableTrimmed = tableOptions.map(t => t.trim());
      expect(tableTrimmed).toContain('10');
      expect(tableTrimmed).toContain('25');
      expect(tableTrimmed).toContain('100');
      expect(tableTrimmed).not.toContain('6');
      expect(tableTrimmed).not.toContain('12');
    });

    test('should show correct item count after view toggle', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      if (!await goToAppsPage(page)) {
        test.skip('Applications page not reachable or no data');
      }

      const select = page.locator('app-paginator select#pageSize');
      const info = page.locator('app-paginator .paginator-info span').first();

      // Switch to table view
      const tableToggle = page.locator('button[title="Table view"]');
      if (await tableToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
        await tableToggle.click();
        await page.waitForTimeout(1000);
      }

      // Default table page size is 10
      const tableValue = await select.inputValue();
      expect(tableValue).toBe('10');

      // Paginator should match
      const tableInfo = (await info.textContent()) || '';
      expect(tableInfo).toMatch(/1\s*-\s*10\s*of\s*\d+/);

      // Switch to card view
      const cardToggle = page.locator('button[title="Card view"]');
      await cardToggle.click();
      await page.waitForTimeout(1000);

      // Default card page size is 6
      const cardValue = await select.inputValue();
      expect(cardValue).toBe('6');

      // Paginator should match
      const cardInfo = (await info.textContent()) || '';
      expect(cardInfo).toMatch(/1\s*-\s*6\s*of\s*\d+/);
    });

    test('should remember page size per view when toggling', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      if (!await goToAppsPage(page)) {
        test.skip('Applications page not reachable or no data');
      }

      const select = page.locator('app-paginator select#pageSize');
      const tableToggle = page.locator('button[title="Table view"]');
      const cardToggle = page.locator('button[title="Card view"]');

      // Set card page size to 24
      if (await tableToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Already in card view
      } else {
        await cardToggle.click();
        await page.waitForTimeout(1000);
      }
      await select.selectOption('24');
      await page.waitForTimeout(500);

      // Switch to table, set to 50
      await tableToggle.click();
      await page.waitForTimeout(1000);
      await select.selectOption('50');
      await page.waitForTimeout(500);

      // Switch back to cards — should remember 24
      await cardToggle.click();
      await page.waitForTimeout(1000);
      const cardValue = await select.inputValue();
      expect(cardValue).toBe('24');

      // Switch back to table — should remember 50
      await tableToggle.click();
      await page.waitForTimeout(1000);
      const tableValue = await select.inputValue();
      expect(tableValue).toBe('50');
    });

    test('should sync dropdown and paginator info after "All" toggle', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      if (!await goToAppsPage(page)) {
        test.skip('Applications page not reachable or no data');
      }

      const select = page.locator('app-paginator select#pageSize');
      const info = page.locator('app-paginator .paginator-info span').first();
      const tableToggle = page.locator('button[title="Table view"]');
      const cardToggle = page.locator('button[title="Card view"]');

      // Ensure we start in card view
      if (await cardToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
        await cardToggle.click();
        await page.waitForTimeout(1000);
      }

      // Select "All" in card view
      await select.selectOption('-1');
      await page.waitForTimeout(500);

      // Dropdown should show "All" (-1) and paginator should show all items
      const allValue = await select.inputValue();
      expect(allValue).toBe('-1');
      const allInfo = (await info.textContent()) || '';
      const allMatch = allInfo.match(/1\s*-\s*(\d+)\s*of\s*(\d+)/);
      if (allMatch) {
        expect(allMatch[1]).toBe(allMatch[2]); // showing all items
      }

      // Switch to table — dropdown should show table default, not "All"
      await tableToggle.click();
      await page.waitForTimeout(1000);
      const tableValue = await select.inputValue();
      expect(tableValue).not.toBe('-1');
      const tableInfo = (await info.textContent()) || '';
      expect(tableInfo).not.toContain('0 of 0');

      // Switch back to card — should show "All" again
      await cardToggle.click();
      await page.waitForTimeout(1000);
      const cardAllValue = await select.inputValue();
      expect(cardAllValue).toBe('-1');
      const cardAllInfo = (await info.textContent()) || '';
      const cardAllMatch = cardAllInfo.match(/1\s*-\s*(\d+)\s*of\s*(\d+)/);
      if (cardAllMatch) {
        expect(cardAllMatch[1]).toBe(cardAllMatch[2]); // still showing all items
      }

      // Switch to table and back to card with a normal size
      await tableToggle.click();
      await page.waitForTimeout(1000);
      await cardToggle.click();
      await page.waitForTimeout(1000);

      // Set card to a specific size (12)
      await select.selectOption('12');
      await page.waitForTimeout(500);

      // Toggle to table and back — should show 12, not "All"
      await tableToggle.click();
      await page.waitForTimeout(1000);
      await cardToggle.click();
      await page.waitForTimeout(1000);
      const cardNormalValue = await select.inputValue();
      expect(cardNormalValue).toBe('12');
      const cardNormalInfo = (await info.textContent()) || '';
      expect(cardNormalInfo).toMatch(/1\s*-\s*12\s*of\s*\d+/);
    });
  });
});
