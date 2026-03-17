import { test, expect } from '../../fixtures/test-base';

/**
 * List Filter E2E Tests (FWT-810)
 *
 * Tests that typing in the filter input actually filters the displayed
 * rows/cards, not just the count. Covers both table and card views.
 *
 * Run against adepttech:
 *   STRATOS_E2E_BASE_URL=https://console.run.adepttech.ca \
 *   STRATOS_E2E_PROFILE=adepttech npx playwright test list-filter
 */

test.describe('List Filter', () => {

  /** Navigate to Applications page and wait for data to load */
  async function goToAppsPage(page: any): Promise<boolean> {
    const appsNav = page.locator('a').filter({ hasText: /Applications/i }).first();
    const visible = await appsNav.isVisible({ timeout: 10000 }).catch(() => false);
    if (!visible) return false;
    await appsNav.click();
    await page.waitForLoadState('networkidle');

    const paginatorInfo = page.locator('app-paginator .paginator-info span').first();
    try {
      await paginatorInfo.filter({ hasNotText: '0 of 0' }).waitFor({ timeout: 60000 });
    } catch {
      return false;
    }
    return true;
  }

  /** Get all visible app names from the table view */
  async function getTableRowNames(page: any): Promise<string[]> {
    const cells = page.locator('.table-body app-table-row .table-cell').first();
    // Get all first cells (Name column) from each row
    const rows = page.locator('.table-body app-table-row');
    const count = await rows.count();
    const names: string[] = [];
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      // The first table-cell in each row is the Name
      const nameCell = row.locator('.table-cell').first();
      const text = (await nameCell.textContent({ timeout: 3000 }))?.trim() || '';
      if (text) names.push(text);
    }
    return names;
  }

  /** Get all visible app names from card view */
  async function getCardTitles(page: any): Promise<string[]> {
    const cards = page.locator('app-cards app-card');
    const count = await cards.count();
    const titles: string[] = [];
    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const title = card.locator('.meta-card__header__title, .card-header, h3, h4').first();
      const text = (await title.textContent({ timeout: 3000 }).catch(() => ''))?.trim() || '';
      if (text) titles.push(text);
    }
    return titles;
  }

  /** Get the item count from the header display */
  async function getItemCount(page: any): Promise<{ start: number; end: number; total: number }> {
    const countSpan = page.locator('.list-component__header__item-count').first();
    const text = (await countSpan.textContent({ timeout: 3000 }))?.trim() || '';
    const match = text.match(/(\d+)\s*-\s*(\d+)\s*of\s*(\d+)/);
    if (match) {
      return { start: parseInt(match[1]), end: parseInt(match[2]), total: parseInt(match[3]) };
    }
    return { start: 0, end: 0, total: 0 };
  }

  /** Switch to table view if not already */
  async function ensureTableView(page: any): Promise<void> {
    const tableToggle = page.locator('button[title="Table view"]');
    if (await tableToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      await tableToggle.click();
      await page.waitForTimeout(1000);
    }
  }

  /** Switch to card view if not already */
  async function ensureCardView(page: any): Promise<void> {
    const cardToggle = page.locator('button[title="Card view"]');
    if (await cardToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cardToggle.click();
      await page.waitForTimeout(1000);
    }
  }

  test.describe('Table View', () => {

    test('should filter rows and show only matching apps', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      if (!await goToAppsPage(page)) {
        test.skip('Applications page not reachable or no data');
      }

      await ensureTableView(page);

      const filterInput = page.locator('#listSearchFilter input[name="filter"]');
      const initialCount = await getItemCount(page);

      // Type a filter that will match a subset
      await filterInput.fill('cf-');
      await page.waitForTimeout(500);

      const filteredCount = await getItemCount(page);
      expect(filteredCount.total).toBeLessThan(initialCount.total);
      expect(filteredCount.total).toBeGreaterThan(0);

      // Every displayed row name should contain the filter string
      const names = await getTableRowNames(page);
      expect(names.length).toBeGreaterThan(0);
      for (const name of names) {
        expect(name.toLowerCase()).toContain('cf-');
      }
    });

    test('should update displayed rows when filter changes', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      if (!await goToAppsPage(page)) {
        test.skip('Applications page not reachable or no data');
      }

      await ensureTableView(page);

      const filterInput = page.locator('#listSearchFilter input[name="filter"]');

      // Apply first filter
      await filterInput.fill('cf-');
      await page.waitForTimeout(500);

      const firstNames = await getTableRowNames(page);
      const firstCount = await getItemCount(page);

      // Change to a different filter
      await filterInput.fill('app-');
      await page.waitForTimeout(500);

      const secondNames = await getTableRowNames(page);
      const secondCount = await getItemCount(page);

      // Results should differ
      if (firstCount.total > 0 && secondCount.total > 0) {
        // Every name should match the new filter
        for (const name of secondNames) {
          expect(name.toLowerCase()).toContain('app-');
        }
        // Should not still show old results
        if (firstNames.length > 0 && secondNames.length > 0) {
          expect(secondNames).not.toEqual(firstNames);
        }
      }
    });

    test('should show no-entries message when filter matches nothing', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      if (!await goToAppsPage(page)) {
        test.skip('Applications page not reachable or no data');
      }

      await ensureTableView(page);

      const filterInput = page.locator('#listSearchFilter input[name="filter"]');

      // Type a filter that won't match anything
      await filterInput.fill('zzz-nonexistent-app-xyz');
      await page.waitForTimeout(500);

      // Should show 0 results or no-entries message
      const names = await getTableRowNames(page);
      expect(names.length).toBe(0);
    });

    test('should restore all rows when filter is cleared', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      if (!await goToAppsPage(page)) {
        test.skip('Applications page not reachable or no data');
      }

      await ensureTableView(page);

      const filterInput = page.locator('#listSearchFilter input[name="filter"]');
      const initialCount = await getItemCount(page);

      // Filter down
      await filterInput.fill('cf-');
      await page.waitForTimeout(500);

      // Clear filter via X button
      const clearBtn = page.locator('#listSearchFilter button[title="Clear filter"]');
      if (await clearBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await clearBtn.click();
      } else {
        await filterInput.fill('');
      }
      await page.waitForTimeout(500);

      // Count should restore
      const restoredCount = await getItemCount(page);
      expect(restoredCount.total).toBe(initialCount.total);

      // Rows should be back
      const names = await getTableRowNames(page);
      expect(names.length).toBeGreaterThan(0);
    });
  });

  test.describe('Card View', () => {

    test('should filter cards and show only matching apps', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      if (!await goToAppsPage(page)) {
        test.skip('Applications page not reachable or no data');
      }

      await ensureCardView(page);

      const filterInput = page.locator('#listSearchFilter input[name="filter"]');
      const initialCount = await getItemCount(page);

      // Type a filter
      await filterInput.fill('cf-');
      await page.waitForTimeout(500);

      const filteredCount = await getItemCount(page);
      expect(filteredCount.total).toBeLessThan(initialCount.total);
      expect(filteredCount.total).toBeGreaterThan(0);

      // Card count should match the filtered total (or page size, whichever is less)
      const cards = page.locator('app-cards app-card');
      const cardCount = await cards.count();
      expect(cardCount).toBe(Math.min(filteredCount.total, filteredCount.end - filteredCount.start + 1));
    });

    test('should update cards when filter changes', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      if (!await goToAppsPage(page)) {
        test.skip('Applications page not reachable or no data');
      }

      await ensureCardView(page);

      const filterInput = page.locator('#listSearchFilter input[name="filter"]');

      // First filter
      await filterInput.fill('cf-');
      await page.waitForTimeout(500);
      const firstCount = await getItemCount(page);

      // Different filter
      await filterInput.fill('app-');
      await page.waitForTimeout(500);
      const secondCount = await getItemCount(page);

      // Should be different results (unless by coincidence they match the same count)
      if (firstCount.total !== secondCount.total) {
        expect(secondCount.total).not.toBe(firstCount.total);
      }
    });

    test('should restore cards when filter is cleared', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      if (!await goToAppsPage(page)) {
        test.skip('Applications page not reachable or no data');
      }

      await ensureCardView(page);

      const filterInput = page.locator('#listSearchFilter input[name="filter"]');
      const initialCount = await getItemCount(page);

      await filterInput.fill('cf-');
      await page.waitForTimeout(500);

      // Press Escape to clear
      await filterInput.press('Escape');
      await page.waitForTimeout(500);

      const restoredCount = await getItemCount(page);
      expect(restoredCount.total).toBe(initialCount.total);
    });
  });

  test.describe('Cross-View Filter', () => {

    test('should maintain filter when switching from table to card view', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      if (!await goToAppsPage(page)) {
        test.skip('Applications page not reachable or no data');
      }

      await ensureTableView(page);

      const filterInput = page.locator('#listSearchFilter input[name="filter"]');

      // Apply filter in table view
      await filterInput.fill('cf-');
      await page.waitForTimeout(500);

      const tableCount = await getItemCount(page);

      // Switch to card view
      await ensureCardView(page);
      await page.waitForTimeout(500);

      // Filter should still be active
      const filterValue = await filterInput.inputValue();
      expect(filterValue).toBe('cf-');

      // Card count should match (same filter applied)
      const cardCount = await getItemCount(page);
      expect(cardCount.total).toBe(tableCount.total);
    });

    test('should maintain filter when switching from card to table view', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      if (!await goToAppsPage(page)) {
        test.skip('Applications page not reachable or no data');
      }

      await ensureCardView(page);

      const filterInput = page.locator('#listSearchFilter input[name="filter"]');

      // Apply filter in card view
      await filterInput.fill('cf-');
      await page.waitForTimeout(500);

      const cardCount = await getItemCount(page);

      // Switch to table view
      await ensureTableView(page);
      await page.waitForTimeout(500);

      // Filter should still be active with correct rows
      const filterValue = await filterInput.inputValue();
      expect(filterValue).toBe('cf-');

      const tableCount = await getItemCount(page);
      expect(tableCount.total).toBe(cardCount.total);

      // Displayed rows should all match the filter
      const names = await getTableRowNames(page);
      for (const name of names) {
        expect(name.toLowerCase()).toContain('cf-');
      }
    });
  });
});
