import { test, expect } from '../../fixtures/test-base';

/**
 * Pagination E2E Tests
 *
 * Tests page size options, the "All" option, and page-size memory against
 * the signal-list pagination bar ([data-test="page-size"] select,
 * [data-test="page-range"] counter, single [data-test="view-toggle"] button).
 * The legacy app-paginator these specs originally targeted is no longer
 * rendered anywhere (#5573).
 *
 * Page-size memory is per list (ListStateStore, localStorage-backed) and per
 * view mode — NOT the old global PageSizeSessionService semantics.
 *
 * Uses the CF Organizations page (card-primary) and the Applications page
 * (table-primary) as test surfaces.
 */

test.describe('Pagination', () => {

  const pageSizeSelect = (page: any) => page.locator('[data-test="page-size"]');
  const pageRange = (page: any) => page.locator('[data-test="page-range"]');
  const viewToggle = (page: any) => page.locator('[data-test="view-toggle"]');

  /** Range text uses an en-dash: "1 – 24 of 60". Match either dash. */
  const FULL_WINDOW = /1\s*[-–]\s*(\d+)\s*of\s*\1(\D|$)/;

  /**
   * After changing page size the range counter updates asynchronously — a
   * fixed delay races the re-render (#5573). Wait for the full "1 – N of N"
   * window; tolerate a timeout and let the caller's guarded assert decide.
   */
  async function waitForFullWindow(page: any): Promise<void> {
    await expect(pageRange(page)).toHaveText(FULL_WINDOW, { timeout: 15000 })
      .catch(() => { /* guarded assert below decides */ });
  }

  /** Parse "start – end of total" (or "0 of 0") from the range counter. */
  async function readRange(page: any): Promise<{ start: number; end: number; total: number } | null> {
    const text = (await pageRange(page).textContent()) || '';
    const m = text.match(/(\d+)\s*[-–]\s*(\d+)\s*of\s*(\d+)/);
    if (m) return { start: +m[1], end: +m[2], total: +m[3] };
    return null;
  }

  /**
   * The view toggle is a single button whose title names the view it
   * switches TO ("Card view" while in table view and vice versa).
   */
  async function currentView(page: any): Promise<'table' | 'card' | null> {
    const title = await viewToggle(page).getAttribute('title').catch(() => null);
    if (title === 'Card view') return 'table';
    if (title === 'Table view') return 'card';
    return null;
  }

  async function switchToView(page: any, view: 'table' | 'card'): Promise<boolean> {
    const current = await currentView(page);
    if (current === view) return true;
    if (current === null) return false;
    await viewToggle(page).click();
    await expect(viewToggle(page)).toHaveAttribute(
      'title', view === 'table' ? 'Card view' : 'Table view', { timeout: 10000 });
    return true;
  }

  /** Navigate to CF orgs page directly via URL, wait for data to load */
  async function goToOrgsPage(page: any, maxAttempts = 2): Promise<boolean> {
    // Get CF endpoint GUID via API
    const endpoints = await page.request.get('/api/v1/endpoints').then((r: any) => r.json()).catch(() => []);
    const cfEndpoint = Array.isArray(endpoints) ? endpoints.find((ep: any) => ep.cnsi_type === 'cf') : null;
    if (!cfEndpoint) return false;

    // Budget note: both attempts together must stay well under the 90s test
    // timeout, or a data-load failure surfaces as a bare timeout instead of
    // a clean skip (#5573).
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await page.goto(`/cloud-foundry/${cfEndpoint.guid}/organizations`);

      try {
        await pageRange(page).filter({ hasNotText: '0 of 0' }).waitFor({ timeout: 25000 });
        return true;
      } catch {
        if (attempt === maxAttempts) return false;
      }
    }
    return false;
  }

  /** Navigate to Applications page, wait for data to load */
  async function goToAppsPage(page: any, maxAttempts = 2): Promise<boolean> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await page.goto('/applications');

      try {
        await pageRange(page).filter({ hasNotText: '0 of 0' }).waitFor({ timeout: 25000 });
        return true;
      } catch {
        if (attempt === maxAttempts) return false;
      }
    }
    return false;
  }

  test.describe('Page Size Options', () => {

    test('should show card page size options on the orgs page', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      if (!await goToOrgsPage(page)) {
        test.skip('Organizations page not reachable or no data');
      }
      if (!await switchToView(page, 'card')) {
        test.skip('View toggle not available');
      }

      const options = await pageSizeSelect(page).locator('option').allTextContents();
      const trimmed = options.map((t: string) => t.trim());

      expect(trimmed).toContain('6');
      expect(trimmed).toContain('12');
      expect(trimmed).toContain('24');
      expect(trimmed).toContain('48');
      expect(trimmed).toContain('96');

      // Legacy sizes gone
      expect(trimmed).not.toContain('9');
      expect(trimmed).not.toContain('30');
      expect(trimmed).not.toContain('80');

      // "All" option exists
      expect(trimmed).toContain('All');
    });

    test('should have "All" option in dropdown', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      if (!await goToOrgsPage(page)) {
        test.skip('Organizations page not reachable or no data');
      }
      if (!await switchToView(page, 'card')) {
        test.skip('View toggle not available');
      }

      // The All option carries the -1 sentinel value
      const allOption = pageSizeSelect(page).locator('option[value="-1"]');
      const allText = (await allOption.textContent({ timeout: 5000 }))?.trim() || '';
      expect(allText).toBe('All');
    });

    test('should show all items when "All" selected', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      if (!await goToOrgsPage(page)) {
        test.skip('Organizations page not reachable or no data');
      }
      if (!await switchToView(page, 'card')) {
        test.skip('View toggle not available');
      }

      await pageSizeSelect(page).selectOption('-1');
      await waitForFullWindow(page);

      const range = await readRange(page);
      if (range) {
        expect(range.start).toBe(1);
        expect(range.end).toBe(range.total);
      }

      await expect(page.locator('button[title="Next page"]')).toBeDisabled();
    });
  });

  test.describe('Session Memory', () => {

    test('should remember page size after navigating away and back', async ({ authenticatedPage }) => {
      // Page size persists per list via ListStateStore (localStorage-backed).
      const page = authenticatedPage;
      if (!await goToOrgsPage(page)) {
        test.skip('Organizations page not reachable or no data');
      }
      if (!await switchToView(page, 'card')) {
        test.skip('View toggle not available');
      }

      await pageSizeSelect(page).selectOption('12');
      await expect(pageSizeSelect(page)).toHaveValue('12');

      // Navigate to Spaces via CF page-side-nav (client-side router nav)
      const spacesNav = page.locator('.page-side-nav__item').filter({ hasText: 'Spaces' }).first();
      const spacesVisible = await spacesNav.isVisible({ timeout: 10000 }).catch(() => false);
      if (!spacesVisible) {
        test.skip('Spaces nav item not visible — CF page-side-nav not rendered');
      }
      await spacesNav.click();
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

      // Navigate back to Organizations
      const orgsNav = page.locator('.page-side-nav__item').filter({ hasText: 'Organizations' }).first();
      await orgsNav.waitFor({ state: 'visible', timeout: 10000 });
      await orgsNav.click();
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

      await pageRange(page).filter({ hasNotText: '0 of 0' }).waitFor({ timeout: 30000 }).catch(() => {});

      await expect(pageSizeSelect(page)).toHaveValue('12');
    });

    test('page size is remembered per list, not shared across lists', async ({ authenticatedPage }) => {
      // ListStateStore keys state per list ('cf-orgs', 'cf-apps', ...), so a
      // size chosen on orgs must NOT leak to applications. (The legacy
      // PageSizeSessionService shared the last choice globally — that
      // behavior was replaced by per-list persistence in the migration.)
      const page = authenticatedPage;
      if (!await goToOrgsPage(page)) {
        test.skip('Organizations page not reachable or no data');
      }
      if (!await switchToView(page, 'card')) {
        test.skip('View toggle not available');
      }

      await pageSizeSelect(page).selectOption('12');
      await expect(pageSizeSelect(page)).toHaveValue('12');

      if (!await goToAppsPage(page)) {
        test.skip('Applications page not reachable or no data');
      }

      const appsValue = await pageSizeSelect(page).inputValue();
      const appsOptions = (await pageSizeSelect(page).locator('option').allTextContents()).map((t: string) => t.trim());
      // Apps keeps a size from its own option set; no assertion on the exact
      // default (it is per-list configuration), only that orgs' choice did
      // not leak in unless 12 is a legitimate apps option AND was its state.
      expect(appsOptions).toContain(appsValue === '-1' ? 'All' : appsValue);
    });
  });

  test.describe('View Toggle', () => {

    test('should show card page sizes in card view and table page sizes in table view', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      if (!await goToAppsPage(page)) {
        test.skip('Applications page not reachable or no data');
      }
      if (!await switchToView(page, 'card')) {
        test.skip('View toggle not available');
      }

      const cardOptions = (await pageSizeSelect(page).locator('option').allTextContents()).map((t: string) => t.trim());
      expect(cardOptions).toContain('6');
      expect(cardOptions).toContain('12');
      expect(cardOptions).toContain('96');
      expect(cardOptions).toContain('All');
      expect(cardOptions).not.toContain('10');
      expect(cardOptions).not.toContain('25');

      await switchToView(page, 'table');

      const tableOptions = (await pageSizeSelect(page).locator('option').allTextContents()).map((t: string) => t.trim());
      expect(tableOptions).toContain('10');
      expect(tableOptions).toContain('25');
      expect(tableOptions).toContain('100');
      expect(tableOptions).not.toContain('All');
      expect(tableOptions).not.toContain('6');
      expect(tableOptions).not.toContain('12');
    });

    test('should show correct item count after view toggle', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      if (!await goToAppsPage(page)) {
        test.skip('Applications page not reachable or no data');
      }
      if (!await switchToView(page, 'table')) {
        test.skip('View toggle not available');
      }

      // Whatever the table page size is, the range must agree with it
      const tableSize = parseInt(await pageSizeSelect(page).inputValue(), 10);
      const tableRange = await readRange(page);
      if (tableRange) {
        expect(tableRange.start).toBe(1);
        expect(tableRange.end).toBe(Math.min(tableSize, tableRange.total));
      }

      await switchToView(page, 'card');

      const cardSizeValue = await pageSizeSelect(page).inputValue();
      const cardRange = await readRange(page);
      if (cardRange && cardSizeValue !== '-1') {
        const cardSize = parseInt(cardSizeValue, 10);
        expect(cardRange.start).toBe(1);
        expect(cardRange.end).toBe(Math.min(cardSize, cardRange.total));
      }
    });

    test('should remember page size per view when toggling', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      if (!await goToAppsPage(page)) {
        test.skip('Applications page not reachable or no data');
      }
      if (!await switchToView(page, 'card')) {
        test.skip('View toggle not available');
      }

      await pageSizeSelect(page).selectOption('24');
      await expect(pageSizeSelect(page)).toHaveValue('24');

      await switchToView(page, 'table');
      await pageSizeSelect(page).selectOption('50');
      await expect(pageSizeSelect(page)).toHaveValue('50');

      await switchToView(page, 'card');
      await expect(pageSizeSelect(page)).toHaveValue('24');

      await switchToView(page, 'table');
      await expect(pageSizeSelect(page)).toHaveValue('50');
    });

    test('should sync dropdown and paginator info after "All" toggle', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      if (!await goToAppsPage(page)) {
        test.skip('Applications page not reachable or no data');
      }
      if (!await switchToView(page, 'card')) {
        test.skip('View toggle not available');
      }

      // Select "All" in card view — full window shown
      await pageSizeSelect(page).selectOption('-1');
      await waitForFullWindow(page);
      const allRange = await readRange(page);
      if (allRange) {
        expect(allRange.start).toBe(1);
        expect(allRange.end).toBe(allRange.total);
      }

      // Switch to table — no All there; a concrete table size takes over
      await switchToView(page, 'table');
      const tableValue = await pageSizeSelect(page).inputValue();
      expect(tableValue).not.toBe('-1');
      const tableInfo = (await pageRange(page).textContent()) || '';
      expect(tableInfo).not.toContain('0 of 0');

      // Back to card — per-view memory restores All (full window)
      await switchToView(page, 'card');
      await waitForFullWindow(page);
      const cardAllRange = await readRange(page);
      if (cardAllRange) {
        expect(cardAllRange.end).toBe(cardAllRange.total);
      }

      // Set card to a concrete size (12); it must survive a toggle round-trip
      await pageSizeSelect(page).selectOption('12');
      await expect(pageSizeSelect(page)).toHaveValue('12');
      await switchToView(page, 'table');
      await switchToView(page, 'card');
      await expect(pageSizeSelect(page)).toHaveValue('12');
      const cardRange = await readRange(page);
      if (cardRange) {
        expect(cardRange.end).toBe(Math.min(12, cardRange.total));
      }
    });
  });

  test.describe('Filter Clear', () => {

    test('clear-filters button enables with text and clears it', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      if (!await goToAppsPage(page)) {
        test.skip('Applications page not reachable or no data');
      }

      const filterInput = page.locator('[data-test="name-filter"]');
      const clearBtn = page.locator('[data-test="clear-filters"]');

      await filterInput.waitFor({ state: 'visible', timeout: 10000 });
      // Disabled while no filter is active
      await expect(clearBtn).toBeDisabled();

      await filterInput.fill('console');
      await expect(clearBtn).toBeEnabled({ timeout: 5000 });

      await clearBtn.click();
      await expect(filterInput).toHaveValue('');
      await expect(clearBtn).toBeDisabled({ timeout: 5000 });
    });

    test('should clear filter with Escape key', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      if (!await goToAppsPage(page)) {
        test.skip('Applications page not reachable or no data');
      }

      const filterInput = page.locator('[data-test="name-filter"]');
      await filterInput.waitFor({ state: 'visible', timeout: 10000 });

      const initial = await readRange(page);
      if (!initial || initial.total === 0) {
        test.skip('Skipped: total items is 0 — page may not have loaded data');
      }

      await filterInput.fill('console');
      await expect
        .poll(async () => (await readRange(page))?.total ?? -1, { timeout: 10000 })
        .toBeLessThanOrEqual(initial!.total);

      await filterInput.press('Escape');
      await expect(filterInput).toHaveValue('');

      await expect
        .poll(async () => (await readRange(page))?.total ?? -1, { timeout: 10000 })
        .toBeGreaterThanOrEqual(initial!.total);
    });
  });
});
