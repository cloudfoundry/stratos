import { test, expect } from '../../fixtures/test-base';

/**
 * Pagination E2E Tests
 *
 * Tests page size options, "All" option, and session memory.
 * Uses the CF Organizations page on adepttech (55 orgs) as the
 * primary test surface.
 *
 * Run against adepttech:
 *   E2E_BASE_URL=https://console.run.adepttech.ca \
 *   E2E_PROFILE=adepttech npx playwright test pagination
 */

test.describe('Pagination', () => {

  /** Navigate to CF orgs page directly via URL, wait for data to load */
  async function goToOrgsPage(page: any, maxAttempts = 2): Promise<boolean> {
    // Get CF endpoint GUID via API
    const endpoints = await page.request.get('/api/v1/endpoints').then((r: any) => r.json()).catch(() => []);
    const cfEndpoint = Array.isArray(endpoints) ? endpoints.find((ep: any) => ep.cnsi_type === 'cf') : null;
    if (!cfEndpoint) return false;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await page.goto(`/cloud-foundry/${cfEndpoint.guid}/organizations`);
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

      // Wait for paginator to show data (not "0 of 0")
      const paginatorInfo = page.locator('app-paginator .paginator-info span').first();
      try {
        await paginatorInfo.filter({ hasNotText: '0 of 0' }).waitFor({ timeout: 30000 });
        return await page.locator('app-paginator').isVisible().catch(() => false);
      } catch {
        if (attempt === maxAttempts) return false;
      }
    }
    return false;
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
      // PageSizeSessionService is in-memory only — no persistence across full page reloads.
      // FWT-805 will add localStorage persistence. Until then, only client-side (Angular router)
      // navigation preserves page size. This test verifies within-session memory via router nav.
      const page = authenticatedPage;
      if (!await goToOrgsPage(page)) {
        test.skip('Organizations page not reachable or no paginator');
      }

      // Set page size to 24
      await page.locator('app-paginator select#pageSize').selectOption('24');
      await page.waitForTimeout(500);

      // Navigate to Spaces via CF page-side-nav (pure Angular router, no reload, service state preserved)
      const spacesNav = page.locator('.page-side-nav__item').filter({ hasText: 'Spaces' }).first();
      const spacesVisible = await spacesNav.isVisible({ timeout: 10000 }).catch(() => false);
      if (!spacesVisible) {
        test.skip('Spaces nav item not visible — CF page-side-nav not rendered');
      }
      await spacesNav.click();
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

      // Navigate back to Organizations — CF page-side-nav stays visible
      const orgsNav = page.locator('.page-side-nav__item').filter({ hasText: 'Organizations' }).first();
      await orgsNav.waitFor({ state: 'visible', timeout: 10000 });
      await orgsNav.click();
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

      // Wait for paginator to show data
      const paginatorInfo = page.locator('app-paginator .paginator-info span').first();
      await paginatorInfo.filter({ hasNotText: '0 of 0' }).waitFor({ timeout: 30000 }).catch(() => {});

      const value = await page.locator('app-paginator select#pageSize').inputValue();
      expect(value).toBe('24');
    });

    test('should inherit last choice on a different list', { timeout: 150000 }, async ({ authenticatedPage }) => {
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
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

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
    async function goToAppsPage(page: any, maxAttempts = 2): Promise<boolean> {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        await page.goto('/applications');
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

        // Wait for data to load — allow extra time after fresh deploys (cold start)
        const paginatorInfo = page.locator('app-paginator .paginator-info span').first();
        try {
          await paginatorInfo.filter({ hasNotText: '0 of 0' }).waitFor({ timeout: 30000 });
          // Wait for filter to be enabled — ensures isLoadingPage$ is false before interactions
          const filterInput = page.locator('#listSearchFilter input[name="filter"]');
          await filterInput.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
          await expect(filterInput).toBeEnabled({ timeout: 15000 }).catch(() => {});
          return true;
        } catch {
          if (attempt === maxAttempts) return false;
        }
      }
      return false;
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

      // tableToggle is ENABLED when in card view, DISABLED when in table view
      const inCardView = await tableToggle.isEnabled({ timeout: 3000 }).catch(() => false);
      if (!inCardView) {
        // In table view — switch to card view
        const cardEnabled = await cardToggle.isEnabled({ timeout: 5000 }).catch(() => false);
        if (cardEnabled) {
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
      await expect(tableToggle).toBeEnabled({ timeout: 10000 });
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
      const tableToggleVisible = await tableToggle.isVisible({ timeout: 3000 }).catch(() => false);
      const tableToggleEnabled = tableToggleVisible && await tableToggle.isEnabled({ timeout: 2000 }).catch(() => false);
      if (tableToggleEnabled) {
        await tableToggle.click();
        await page.waitForTimeout(1000);
      } else if (!tableToggleVisible) {
        test.skip('Table view toggle not visible — page may not have loaded');
      }

      // Default table page size is 10
      const tableValue = await select.inputValue();
      expect(tableValue).toBe('10');

      // Paginator should match
      const tableInfo = (await info.textContent()) || '';
      expect(tableInfo).toMatch(/1\s*-\s*10\s*of\s*\d+/);

      // Switch to card view
      const cardToggle = page.locator('button[title="Card view"]');
      const cardToggleEnabled = await cardToggle.isEnabled({ timeout: 3000 }).catch(() => false);
      if (!cardToggleEnabled) {
        test.skip('Card view toggle not enabled — already in card view or not available');
      }
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

      // tableToggle is ENABLED when in card view, DISABLED when in table view
      if (await tableToggle.isEnabled({ timeout: 3000 }).catch(() => false)) {
        // Already in card view — nothing to do
      } else {
        // In table view — switch to card first
        const cardEnabled = await cardToggle.isEnabled({ timeout: 5000 }).catch(() => false);
        if (cardEnabled) {
          await cardToggle.click();
          await page.waitForTimeout(1000);
        }
      }
      await select.selectOption('24');
      await page.waitForTimeout(500);

      // Switch to table, set to 50
      await expect(tableToggle).toBeEnabled({ timeout: 10000 });
      await tableToggle.click();
      await page.waitForTimeout(1000);
      await select.selectOption('50');
      await page.waitForTimeout(500);

      // Switch back to cards — should remember 24
      await expect(cardToggle).toBeEnabled({ timeout: 10000 });
      await cardToggle.click();
      await page.waitForTimeout(1000);
      const cardValue = await select.inputValue();
      expect(cardValue).toBe('24');

      // Switch back to table — should remember 50
      await expect(tableToggle).toBeEnabled({ timeout: 10000 });
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

      // Ensure we start in card view (cardToggle is visible+enabled only when NOT already in card view)
      const cardToggleEnabled = await cardToggle.isEnabled({ timeout: 3000 }).catch(() => false);
      if (cardToggleEnabled) {
        await cardToggle.click();
        await page.waitForTimeout(1000);
      }

      // Select "All" in card view
      await select.selectOption('-1');
      await page.waitForTimeout(500);

      // After selecting "All" (-1), the paginator resolves it to the actual total count.
      // If that count happens to equal an existing concrete option (e.g. 48), the dropdown
      // shows 48 not -1 — that is correct paginator behaviour (selectValue getter).
      // Verify all items are shown instead of checking the raw dropdown value.
      const allInfo = (await info.textContent()) || '';
      const allMatch = allInfo.match(/1\s*-\s*(\d+)\s*of\s*(\d+)/);
      if (allMatch) {
        expect(allMatch[1]).toBe(allMatch[2]); // showing all items
      }

      // Switch to table — dropdown should revert to a table default page size
      // Loading all apps may take time; use a generous timeout
      await expect(tableToggle).toBeEnabled({ timeout: 30000 });
      await tableToggle.click();
      await page.waitForTimeout(1000);
      const tableValue = await select.inputValue();
      const tableOptions = [10, 25, 50, 100]; // default table page size options
      expect(tableOptions.map(String)).toContain(tableValue);
      const tableInfo = (await info.textContent()) || '';
      expect(tableInfo).not.toContain('0 of 0');

      // Switch back to card — should show all items again
      await expect(cardToggle).toBeEnabled({ timeout: 15000 });
      await cardToggle.click();
      await page.waitForTimeout(1000);
      const cardAllInfo = (await info.textContent()) || '';
      const cardAllMatch = cardAllInfo.match(/1\s*-\s*(\d+)\s*of\s*(\d+)/);
      if (cardAllMatch) {
        expect(cardAllMatch[1]).toBe(cardAllMatch[2]); // still showing all items
      }

      // Switch to table and back to card with a normal size
      await expect(tableToggle).toBeEnabled({ timeout: 15000 });
      await tableToggle.click();
      await page.waitForTimeout(1000);
      await expect(cardToggle).toBeEnabled({ timeout: 15000 });
      await cardToggle.click();
      await page.waitForTimeout(1000);

      // Set card to a specific size (12)
      await select.selectOption('12');
      await page.waitForTimeout(500);

      // Toggle to table and back — should show 12, not "All"
      await expect(tableToggle).toBeEnabled({ timeout: 15000 });
      await tableToggle.click();
      await page.waitForTimeout(1000);
      await expect(cardToggle).toBeEnabled({ timeout: 15000 });
      await cardToggle.click();
      await page.waitForTimeout(1000);
      const cardNormalValue = await select.inputValue();
      expect(cardNormalValue).toBe('12');
      const cardNormalInfo = (await info.textContent()) || '';
      expect(cardNormalInfo).toMatch(/1\s*-\s*12\s*of\s*\d+/);
    });
  });

  test.describe('Filter Clear', () => {

    /** Navigate to Applications page and wait for data and filter */
    async function goToAppsPage(page: any, maxAttempts = 2): Promise<boolean> {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        await page.goto('/applications');
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
        const paginatorInfo = page.locator('app-paginator .paginator-info span').first();
        try {
          await paginatorInfo.filter({ hasNotText: '0 of 0' }).waitFor({ timeout: 20000 });
          // Wait for filter to be enabled — ensures isLoadingPage$ is false before interactions
          const filterInput = page.locator('#listSearchFilter input[name="filter"]');
          await filterInput.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
          await expect(filterInput).toBeEnabled({ timeout: 15000 }).catch(() => {});
          return true;
        } catch {
          if (attempt === maxAttempts) return false;
        }
      }
      return false;
    }

    test('should show X button when filter has text and hide when empty', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      if (!await goToAppsPage(page)) {
        test.skip('Applications page not reachable or no data');
      }

      const filterInput = page.locator('#listSearchFilter input[name="filter"]');
      const clearBtn = page.locator('#listSearchFilter button[title="Clear filter"]');

      // X button should not be visible initially
      await expect(clearBtn).not.toBeVisible();

      // Type in filter
      await filterInput.fill('console');
      await page.waitForTimeout(500);

      // X button should now be visible
      await expect(clearBtn).toBeVisible();

      // Click X — filter should clear
      await clearBtn.click();
      await page.waitForTimeout(500);

      const value = await filterInput.inputValue();
      expect(value).toBe('');

      // X button should be hidden again
      await expect(clearBtn).not.toBeVisible();
    });

    test('should clear filter with Escape key', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      if (!await goToAppsPage(page)) {
        test.skip('Applications page not reachable or no data');
      }

      const filterInput = page.locator('#listSearchFilter input[name="filter"]');
      const info = page.locator('app-paginator .paginator-info span').first();

      // Get initial count
      const initialInfo = (await info.textContent()) || '';
      const initialMatch = initialInfo.match(/of\s*(\d+)/);
      const totalItems = initialMatch ? parseInt(initialMatch[1]) : 0;
      if (totalItems === 0) {
        test.skip('Skipped: total items is 0 — page may not have loaded data');
      }

      // Type filter text to reduce results
      await filterInput.fill('console');
      await page.waitForTimeout(1000);

      // Results should be filtered (fewer items)
      const filteredInfo = (await info.textContent()) || '';
      const filteredMatch = filteredInfo.match(/of\s*(\d+)/);
      const filteredItems = filteredMatch ? parseInt(filteredMatch[1]) : 0;
      expect(filteredItems).toBeLessThanOrEqual(totalItems);

      // Press Escape to clear
      await filterInput.press('Escape');
      await page.waitForTimeout(500);

      // Input should be empty
      const value = await filterInput.inputValue();
      expect(value).toBe('');

      // Results should be back to original count
      const restoredInfo = (await info.textContent()) || '';
      const restoredMatch = restoredInfo.match(/of\s*(\d+)/);
      const restoredItems = restoredMatch ? parseInt(restoredMatch[1]) : 0;
      expect(restoredItems).toBeGreaterThanOrEqual(totalItems);
    });
  });
});
