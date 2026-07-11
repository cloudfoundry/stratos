import { Page } from '@playwright/test';
import { test, expect } from '../../fixtures/test-base';
import { ListComponent } from '../../components/list.component';

/**
 * Apps list filter sync regression test
 *
 * Verifies that the org/space filter dropdowns stay in sync with the
 * underlying store, preventing the 49→2 regression where persisted filters
 * silently re-applied while the dropdowns still showed "All".
 *
 * Modern-wall realities this suite has to drive (all confirmed live):
 *  - The wall aggregates 4 connected CFs *progressively*, so the total is a
 *    moving target until every CF reports — see settledTotal().
 *  - The org/space catalog is *lazy*: options are empty until the dropdown's
 *    onOpen hook fires, and that only happens on a real (trusted) click, not
 *    a synthetic focus/dispatch — see openDropdownForOptions().
 *  - Picking the first alphabetical org can hit an org with zero apps, so we
 *    derive a guaranteed-non-empty org from the first app's row link.
 */

const CF_DD = '[data-test="dropdown-Cloud Foundry"] select';
const ORG_DD = '[data-test="dropdown-Organization"] select';

/**
 * Resolve the *settled* filtered total. The refresh button reads
 * data-test="refresh-loading" while ANY CF is still aggregating (with results
 * already present) and flips to "refresh" only once all report — the one
 * reliable "fully aggregated" DOM signal. We then hold until getTotalResults
 * (the real [data-test="page-range"] "of N") is unchanged for 3s to cover
 * walls without a refresh button and any late settle.
 */
async function settledTotal(page: Page, list: ListComponent, requirePositive: boolean, timeout = 120000): Promise<number> {
  const start = Date.now();
  const refreshLoading = page.locator('[data-test="refresh-loading"]');
  let prev = -1;
  let stableSince = Date.now();
  while (Date.now() - start < timeout) {
    // refresh-loading is present while ANY CF is still aggregating (with
    // results already shown). Re-check it every poll: never settle a total
    // while it shows, or a mid-load plateau under 2-worker CF latency reads
    // as the final count (a filtered subset would then exceed it).
    const loading = (await refreshLoading.count()) > 0;
    const cur = await list.getTotalResults().catch(() => -1);
    if (loading || cur !== prev) {
      prev = cur;
      stableSince = Date.now();
    } else if (cur >= 0 && (!requirePositive || cur > 0) && Date.now() - stableSince >= 4000) {
      return cur;
    }
    await page.waitForTimeout(500);
  }
  return prev >= 0 ? prev : 0;
}

/**
 * Fire the dropdown's lazy onOpen catalog fetch with a real (trusted) click,
 * then wait for its options to load. Returns the final option count (incl.
 * "All"). A synthetic focus/dispatchEvent does NOT trigger onOpen.
 */
async function openDropdownForOptions(page: Page, selectSelector: string, timeout = 75000): Promise<number> {
  const sel = page.locator(selectSelector);
  await expect(sel).toBeVisible({ timeout: 15000 });
  await sel.click();
  await page.keyboard.press('Escape').catch(() => {});

  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await sel.locator('option').count() > 1) break;
    await page.waitForTimeout(500);
  }
  return await sel.locator('option').count();
}

/**
 * Read the org guid of the first app on the wall from its CF/Org/Space cell
 * link (/cloud-foundry/{cnsi}/organizations/{orgGuid}). Guarantees the org
 * owns at least one app, so filtering by it can't collapse to an empty list.
 * Requires the catalog to have resolved names first (the org segment renders
 * as a link only once orgName !== '—').
 */
async function firstAppOrgGuid(page: Page): Promise<string | null> {
  const orgLink = page
    .locator('app-application-wall app-signal-list a[href*="/organizations/"]:not([href*="/spaces/"])')
    .first();
  if (!(await orgLink.count())) return null;
  const href = (await orgLink.getAttribute('href')) ?? '';
  const m = href.match(/\/organizations\/([^/?]+)/);
  return m ? m[1] : null;
}

/** Dismiss endpoint error banner if present */
async function dismissErrorBanner(page: Page): Promise<void> {
  const closeButton = page.locator('button[aria-label="Close"], .alert-dismiss').first();
  if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    await closeButton.click().catch(() => {});
  }
}

/** Navigate via side nav link (preserves the store, unlike page.goto) */
async function clickSideNavLink(page: Page, label: string, urlPattern: RegExp): Promise<void> {
  const link = page.locator('a.nav-item-link').filter({ hasText: label });
  await link.click();
  await page.waitForURL(urlPattern, { timeout: 15000 });
  await page.waitForTimeout(500);
}

/**
 * Shared setup: land on the wall, open the org dropdown to load the catalog,
 * and derive a guaranteed-non-empty org. Skips (with the TRUE reason) when the
 * live CF genuinely can't satisfy the precondition. Returns the settled
 * unfiltered total and the chosen org guid.
 */
async function loadWallAndPickOrg(page: Page, list: ListComponent): Promise<{ totalAll: number; orgGuid: string } | null> {
  const totalAll = await settledTotal(page, list, true);
  if (totalAll === 0) {
    test.skip(true, 'No apps loaded — endpoint may be errored');
    return null;
  }

  const optionCount = await openDropdownForOptions(page, ORG_DD);
  if (optionCount <= 1) {
    test.skip(true, 'Org filter catalog did not load within 75s (multi-CF CAPI latency)');
    return null;
  }

  const orgGuid = await firstAppOrgGuid(page);
  if (!orgGuid) {
    test.skip(true, 'Could not resolve the first app\'s org from the wall (names still draining)');
    return null;
  }
  return { totalAll, orgGuid };
}

test.describe('Apps list filter sync', () => {
  // Each test drives the lazy multi-CF org catalog and settles the
  // progressively-aggregating wall total several times; under 2-worker CF
  // latency that legitimately exceeds the default 90s cap.
  test.describe.configure({ timeout: 240000 });


  test('should show all apps with dropdowns at "All" on fresh load', async ({ adminPage: page }) => {
    await page.goto('/applications');
    await dismissErrorBanner(page);
    const list = new ListComponent(page);
    await list.waitUntilShown();

    const totalOnLoad = await settledTotal(page, list, true);
    expect(totalOnLoad).toBeGreaterThan(0);

    // Org dropdown renders and defaults to "All" (empty value).
    const orgSelect = page.locator(ORG_DD);
    await expect(orgSelect).toBeVisible({ timeout: 10000 });
    expect(await orgSelect.inputValue()).toBe('');
  });

  test('should filter apps when org is selected', async ({ adminPage: page }) => {
    await page.goto('/applications');
    await dismissErrorBanner(page);
    const list = new ListComponent(page);
    await list.waitUntilShown();

    const picked = await loadWallAndPickOrg(page, list);
    if (!picked) return;

    const orgSelect = page.locator(ORG_DD);
    await orgSelect.selectOption(picked.orgGuid);

    const totalAfter = await settledTotal(page, list, false);
    // The derived org owns at least one app, so the filter is non-empty and
    // can only ever be a subset of the unfiltered wall.
    expect(totalAfter).toBeGreaterThan(0);
    expect(totalAfter).toBeLessThanOrEqual(picked.totalAll);

    // Dropdown still reflects the org we selected.
    expect(await orgSelect.inputValue()).toBe(picked.orgGuid);
  });

  test('should preserve filters after navigating to app detail and back', async ({ adminPage: page }) => {
    await page.goto('/applications');
    await dismissErrorBanner(page);
    const list = new ListComponent(page);
    await list.waitUntilShown();

    const picked = await loadWallAndPickOrg(page, list);
    if (!picked) return;

    const orgSelect = page.locator(ORG_DD);
    await orgSelect.selectOption(picked.orgGuid);
    const filteredCount = await settledTotal(page, list, false);
    expect(filteredCount).toBeGreaterThan(0);

    // Navigate to a detail page by CLICKING an app row (deep-linking redirects
    // to Home on a fresh store); browser back preserves the router + store.
    const isCards = await list.isCardsView();
    if (isCards) {
      await list.cards.getCard(0).click();
    } else {
      await list.table.getRows().first().click();
    }
    await page.waitForURL(/\/applications\/[^/]+/, { timeout: 15000 });

    await page.goBack();
    await page.waitForURL(/\/applications$/, { timeout: 15000 });

    const listAfterBack = new ListComponent(page);
    await listAfterBack.waitUntilShown();

    // Org dropdown still shows the selected org, and the count is unchanged.
    const orgSelectAfter = page.locator(ORG_DD);
    await expect(orgSelectAfter).toBeVisible({ timeout: 10000 });
    expect(await orgSelectAfter.inputValue()).toBe(picked.orgGuid);

    const countAfterBack = await settledTotal(page, listAfterBack, false);
    expect(countAfterBack).toBe(filteredCount);
  });

  test('should preserve filters after navigating to Endpoints and back via side nav', async ({ adminPage: page }) => {
    await page.goto('/applications');
    await dismissErrorBanner(page);
    const list = new ListComponent(page);
    await list.waitUntilShown();

    const picked = await loadWallAndPickOrg(page, list);
    if (!picked) return;

    const orgSelect = page.locator(ORG_DD);
    await orgSelect.selectOption(picked.orgGuid);
    const filteredCount = await settledTotal(page, list, false);
    expect(filteredCount).toBeGreaterThan(0);

    // Navigate away to Endpoints and back via side nav (preserves the store).
    await clickSideNavLink(page, 'Endpoints', /\/endpoints/);
    await page.waitForTimeout(1000);
    await clickSideNavLink(page, 'Applications', /\/applications/);
    await dismissErrorBanner(page);

    const listAfter = new ListComponent(page);
    await listAfter.waitUntilShown();

    // Dropdown reflects the persisted org selection, count unchanged.
    const orgSelectAfter = page.locator(ORG_DD);
    await expect(orgSelectAfter).toBeVisible({ timeout: 10000 });
    await expect(orgSelectAfter).toHaveValue(picked.orgGuid, { timeout: 30000 });

    const countAfter = await settledTotal(page, listAfter, false);
    expect(countAfter).toBe(filteredCount);
  });

  test('should clear filter and show all apps when "All" is re-selected', async ({ adminPage: page }) => {
    await page.goto('/applications');
    await dismissErrorBanner(page);
    const list = new ListComponent(page);
    await list.waitUntilShown();

    const picked = await loadWallAndPickOrg(page, list);
    if (!picked) return;

    const orgSelect = page.locator(ORG_DD);
    await orgSelect.selectOption(picked.orgGuid);
    const filteredCount = await settledTotal(page, list, false);
    expect(filteredCount).toBeLessThanOrEqual(picked.totalAll);

    // Re-select "All" (empty value) — the filter must fully clear back to the
    // unfiltered total, not stick at the previous org (the 49→2 regression).
    await orgSelect.selectOption('');
    const totalAfterClear = await settledTotal(page, list, true);
    expect(totalAfterClear).toBe(picked.totalAll);
  });

  test('should work with services wall the same way', async ({ adminPage: page }) => {
    await page.goto('/services');
    await dismissErrorBanner(page);
    const list = new ListComponent(page);
    await list.waitUntilShown();

    // Services aggregate across CFs progressively, so the count only ever
    // grows as endpoints report — with filters at "All" it must never DROP
    // (a silent filtered re-apply while the dropdown still shows "All").
    const settled = await settledTotal(page, list, true);
    expect(settled).toBeGreaterThan(0);

    // CF dropdown is present and left at "All" (no stuck filter).
    const cfSelect = page.locator(CF_DD);
    if (await cfSelect.count()) {
      expect(await cfSelect.inputValue()).toBe('');
    }

    // No late drop after a further settle window.
    await page.waitForTimeout(3000);
    const totalAfterSettle = await list.getTotalResults();
    expect(totalAfterSettle).toBeGreaterThanOrEqual(settled);
  });

});
