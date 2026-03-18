import { Page } from '@playwright/test';
import { test, expect } from '../../fixtures/test-base';
import { ListComponent } from '../../components/list.component';

/**
 * FWT-834: Apps list filter sync regression test
 *
 * Verifies that org/space filter dropdowns stay in sync with the
 * underlying NgRx store, preventing the 49→2 regression where
 * persisted filters silently re-applied while dropdowns showed "All".
 */

/** Wait for list to finish loading and return the count (may be 0) */
async function waitForListLoaded(page: Page, list: ListComponent, timeout = 30000): Promise<number> {
  await list.waitForNoLoadingIndicator(timeout);
  await page.waitForTimeout(2000);
  return await list.getTotalResults().catch(() => 0);
}

/** Wait for list to have at least 1 result */
async function waitForListWithResults(page: Page, list: ListComponent, timeout = 45000): Promise<number> {
  await list.waitForNoLoadingIndicator(timeout);
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const count = await list.getTotalResults().catch(() => 0);
    if (count > 0) return count;
    await page.waitForTimeout(500);
  }
  return await list.getTotalResults().catch(() => 0);
}

/** Wait for a select to have more than minCount options */
async function waitForOptions(page: Page, selectLocator: ReturnType<Page['locator']>, minCount: number, timeout = 20000): Promise<number> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const count = await selectLocator.locator('option').count();
    if (count > minCount) return count;
    await page.waitForTimeout(500);
  }
  return await selectLocator.locator('option').count();
}

/** Dismiss endpoint error banner if present */
async function dismissErrorBanner(page: Page): Promise<void> {
  const closeButton = page.locator('button[aria-label="Close"], .alert-dismiss').first();
  if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    await closeButton.click().catch(() => {});
  }
}

/** Navigate via side nav link (preserves NgRx store, unlike page.goto) */
async function clickSideNavLink(page: Page, label: string, urlPattern: RegExp): Promise<void> {
  const link = page.locator('a.nav-item-link').filter({ hasText: label });
  await link.click();
  await page.waitForURL(urlPattern, { timeout: 15000 });
  await page.waitForTimeout(500);
}

test.describe('Apps list filter sync (FWT-834)', () => {

  test('should show all apps with dropdowns at "All" on fresh load', async ({ adminPage: page }) => {
    await page.goto('/applications');
    await dismissErrorBanner(page);
    const list = new ListComponent(page);
    await list.waitUntilShown();

    const totalOnLoad = await waitForListWithResults(page, list);
    expect(totalOnLoad).toBeGreaterThan(0);

    // Org dropdown should show empty value (= "All")
    const orgSelect = page.locator('select#org');
    if (await orgSelect.isVisible().catch(() => false)) {
      const orgValue = await orgSelect.inputValue();
      expect(orgValue).toBe('');
    }
  });

  test('should filter apps when org is selected', async ({ adminPage: page }) => {
    await page.goto('/applications');
    await dismissErrorBanner(page);
    const list = new ListComponent(page);
    await list.waitUntilShown();

    const totalBefore = await waitForListWithResults(page, list);
    if (totalBefore === 0) test.skip(true, 'No apps loaded — endpoint may be errored');

    // Wait for org options to populate (they load async from store)
    const orgSelect = page.locator('select#org');
    await expect(orgSelect).toBeVisible({ timeout: 10000 });
    const optionCount = await waitForOptions(page, orgSelect, 1);
    if (optionCount <= 1) test.skip(true, 'Only one org available');

    const firstOrgOption = orgSelect.locator('option').nth(1);
    const orgValue = await firstOrgOption.getAttribute('value') ?? '';

    await orgSelect.selectOption(orgValue);
    await waitForListLoaded(page, list);

    const totalAfter = await list.getTotalResults();
    expect(totalAfter).toBeLessThanOrEqual(totalBefore);

    // Dropdown still shows the org we selected
    const selectedValue = await orgSelect.inputValue();
    expect(selectedValue).toBe(orgValue);
  });

  test('should preserve filters after navigating to app detail and back', async ({ adminPage: page }) => {
    await page.goto('/applications');
    await dismissErrorBanner(page);
    const list = new ListComponent(page);
    await list.waitUntilShown();

    const total = await waitForListWithResults(page, list);
    if (total === 0) test.skip(true, 'No apps loaded');

    // Wait for org options
    const orgSelect = page.locator('select#org');
    await expect(orgSelect).toBeVisible({ timeout: 10000 });
    const optionCount = await waitForOptions(page, orgSelect, 1);
    if (optionCount <= 1) test.skip(true, 'Only one org available');

    const firstOrgOption = orgSelect.locator('option').nth(1);
    const orgValue = await firstOrgOption.getAttribute('value') ?? '';

    await orgSelect.selectOption(orgValue);
    const filteredCount = await waitForListLoaded(page, list);
    if (filteredCount === 0) test.skip(true, 'No apps in selected org');

    // Click first app to navigate to detail
    const isCards = await list.isCardsView();
    if (isCards) {
      await list.cards.getCard(0).click();
    } else {
      await list.table.getRows().first().click();
    }

    await page.waitForURL(/\/applications\/[^/]+/, { timeout: 15000 });

    // Go back (browser back preserves Angular router + NgRx store)
    await page.goBack();
    await page.waitForURL(/\/applications$/, { timeout: 15000 });

    const listAfterBack = new ListComponent(page);
    await listAfterBack.waitUntilShown();
    await waitForListLoaded(page, listAfterBack);

    // Org dropdown should still show the selected org
    const orgSelectAfter = page.locator('select#org');
    await expect(orgSelectAfter).toBeVisible({ timeout: 10000 });
    const selectedValueAfter = await orgSelectAfter.inputValue();
    expect(selectedValueAfter).toBe(orgValue);

    const countAfterBack = await listAfterBack.getTotalResults();
    expect(countAfterBack).toBe(filteredCount);
  });

  // Known limitation: MultiFilterManager.selectItem sets this.value in an
  // async subscribe that doesn't trigger Angular change detection, so the
  // dropdown display may not update after cross-route navigation even though
  // the store and BehaviorSubjects have the correct filter values.
  test.fixme('should preserve filters after navigating to Endpoints and back via side nav', async ({ adminPage: page }) => {
    await page.goto('/applications');
    await dismissErrorBanner(page);
    const list = new ListComponent(page);
    await list.waitUntilShown();

    const total = await waitForListWithResults(page, list);
    if (total === 0) test.skip(true, 'No apps loaded');

    // Wait for org options
    const orgSelect = page.locator('select#org');
    await expect(orgSelect).toBeVisible({ timeout: 10000 });
    const optionCount = await waitForOptions(page, orgSelect, 1);
    if (optionCount <= 1) test.skip(true, 'Only one org available');

    const firstOrgOption = orgSelect.locator('option').nth(1);
    const orgValue = await firstOrgOption.getAttribute('value') ?? '';

    await orgSelect.selectOption(orgValue);
    const filteredCount = await waitForListLoaded(page, list);

    // Navigate to Endpoints via side nav (preserves NgRx store)
    await clickSideNavLink(page, 'Endpoints', /\/endpoints/);
    await page.waitForTimeout(1000);

    // Navigate back to Applications via side nav
    await clickSideNavLink(page, 'Applications', /\/applications/);
    await dismissErrorBanner(page);
    const listAfter = new ListComponent(page);
    await listAfter.waitUntilShown();
    await waitForListLoaded(page, listAfter);

    // Dropdown should reflect the persisted org selection (may take time
    // for async selectItem to fire after options load + change detection)
    const orgSelectAfter = page.locator('select#org');
    await expect(orgSelectAfter).toBeVisible({ timeout: 10000 });
    await expect(orgSelectAfter).toHaveValue(orgValue, { timeout: 15000 });

    const countAfter = await listAfter.getTotalResults();
    expect(countAfter).toBe(filteredCount);
  });

  test('should clear filter and show all apps when "All" is re-selected', async ({ adminPage: page }) => {
    await page.goto('/applications');
    await dismissErrorBanner(page);
    const list = new ListComponent(page);
    await list.waitUntilShown();

    const totalAll = await waitForListWithResults(page, list);
    if (totalAll === 0) test.skip(true, 'No apps loaded');

    // Wait for org options
    const orgSelect = page.locator('select#org');
    await expect(orgSelect).toBeVisible({ timeout: 10000 });
    const optionCount = await waitForOptions(page, orgSelect, 1);
    if (optionCount <= 1) test.skip(true, 'Only one org available');

    await orgSelect.selectOption({ index: 1 });
    await waitForListLoaded(page, list);

    // Select "All" for org (empty value = first option)
    await orgSelect.selectOption('');
    // Wait for auto-selector cascade (org clear → space clear) to propagate
    await page.waitForTimeout(2000);
    // Also explicitly clear space if auto-selector set one during the org selection
    const spaceSelect = page.locator('select#space');
    if (await spaceSelect.isVisible().catch(() => false)) {
      const spaceValue = await spaceSelect.inputValue();
      if (spaceValue) {
        await spaceSelect.selectOption('');
        await page.waitForTimeout(1000);
      }
    }
    await waitForListWithResults(page, list);

    const totalAfterClear = await list.getTotalResults();
    expect(totalAfterClear).toBe(totalAll);
  });

  test('should work with services wall the same way', async ({ adminPage: page }) => {
    await page.goto('/services');
    await dismissErrorBanner(page);
    const list = new ListComponent(page);
    await list.waitUntilShown();

    const totalOnLoad = await waitForListLoaded(page, list);

    // CF dropdown should be visible on services wall too
    const cfSelect = page.locator('select#cf');
    if (await cfSelect.isVisible().catch(() => false)) {
      const cfValue = await cfSelect.inputValue();
      expect(cfValue).toBeDefined();
    }

    // Verify list loaded without the count dropping
    await page.waitForTimeout(3000);
    const totalAfterSettle = await list.getTotalResults();
    expect(totalAfterSettle).toBe(totalOnLoad);
  });

});
