import { Locator, Page } from '@playwright/test';
import { test, expect } from '../../fixtures/test-base';
import { ApplicationsPage } from '../../pages/application/applications-list.page';

/**
 * List Filter E2E Tests
 *
 * Tests that typing in the app wall's name filter really filters the
 * rendered rows/cards, not just the count:
 * - Table view: a filter shows only matching rows, changing it re-filters,
 *   a non-matching filter shows the empty-filtered message, and clearing
 *   it restores the full list.
 * - Card view: the same filter / re-filter / clear behaviour for cards.
 * - Cross-view: the filter survives switching table→card and card→table.
 *
 * Uses withTestApps (3 seeded apps whose names carry a timestamp and a
 * random suffix) so every assertion is keyed to names no other app on the
 * foundation can share.
 */

type View = 'table' | 'card';

const wall = (page: Page): Locator => page.locator('app-application-wall app-signal-list');

/** The rendered list items for a view: table rows or cards. */
const items = (page: Page, view: View): Locator =>
  wall(page).locator(view === 'table' ? 'tbody tr[data-test="row"]' : '[data-test="card"]');

const nameFilter = (page: Page): Locator => wall(page).locator('[data-test="name-filter"]');

/**
 * Put the wall in the given view. The signal-list has a single toggle whose
 * title names the view it switches TO, so read it rather than the body
 * (which renders neither table nor cards while loading or empty).
 */
async function setView(page: Page, view: View): Promise<void> {
  const toggle = wall(page).locator('[data-test="view-toggle"]');
  await expect(toggle).toBeVisible({ timeout: 15000 });
  const switchesTo = view === 'table' ? 'Table view' : 'Card view';
  if ((await toggle.getAttribute('title')) === switchesTo) {
    await toggle.click();
  }
  await expect(toggle).toHaveAttribute('title', view === 'table' ? 'Card view' : 'Table view');
}

/** Land on the wall in the given view, with the seeded apps rendered. */
async function openWall(page: Page, view: View): Promise<ApplicationsPage> {
  const appsPage = new ApplicationsPage(page);
  await appsPage.navigateTo();
  await appsPage.waitForPage();
  await setView(page, view);
  await expect.poll(async () => items(page, view).count(), { timeout: 15000 }).toBeGreaterThan(0);
  return appsPage;
}

/**
 * Assert the list is filtered to `name`: the named app renders, every
 * rendered item contains the filter text, and the `absent` apps are gone.
 * (A CF registered under two endpoints can show the same app twice, so the
 * check is "all items match", not "exactly one item".)
 */
async function expectFilteredTo(page: Page, view: View, name: string, absent: string[]): Promise<void> {
  const list = items(page, view);
  // Generous wait: a just-created app on the polled wall can be slow to appear.
  await expect(list.filter({ hasText: name }).first()).toBeVisible({ timeout: 30000 });
  await expect.poll(async () => {
    const texts = await list.allTextContents();
    return texts.length > 0 && texts.every(t => t.toLowerCase().includes(name.toLowerCase()));
  }, { timeout: 15000 }).toBe(true);
  for (const other of absent) {
    await expect(list.filter({ hasText: other })).toHaveCount(0);
  }
}

test.describe('List Filter', () => {

  test.describe('Table View', () => {

    test('should filter rows and show only matching apps', async ({ withTestApps }) => {
      const { page, testApps } = withTestApps;
      const [target, ...others] = testApps.map(a => a.app.name);
      const appsPage = await openWall(page, 'table');

      await appsPage.setSearchText(target);
      await appsPage.list.waitForNoLoadingIndicator();

      await expectFilteredTo(page, 'table', target, others);
    });

    test('should update displayed rows when filter changes', async ({ withTestApps }) => {
      const { page, testApps } = withTestApps;
      const [first, second, third] = testApps.map(a => a.app.name);
      const appsPage = await openWall(page, 'table');

      await appsPage.setSearchText(first);
      await appsPage.list.waitForNoLoadingIndicator();
      await expectFilteredTo(page, 'table', first, [second, third]);

      // Re-filtering must replace the old result set, not add to it.
      await appsPage.setSearchText(second);
      await appsPage.list.waitForNoLoadingIndicator();
      await expectFilteredTo(page, 'table', second, [first, third]);
    });

    test('should show no-entries message when filter matches nothing', async ({ withTestApps }) => {
      const { page, testApps } = withTestApps;
      const appsPage = await openWall(page, 'table');

      // Derived from a seeded name so it is unique, but suffixed so it matches nothing.
      await appsPage.setSearchText(`${testApps[0].app.name}-no-such-app`);
      await appsPage.list.waitForNoLoadingIndicator();

      // With zero matches the list shows either the empty-filtered message or,
      // when an endpoint failed to load, the failed-load state instead.
      const emptyFiltered = wall(page).locator('[data-test="empty-filtered"]');
      const emptyError = wall(page).locator('[data-test="empty-error"]');
      await expect(emptyFiltered.or(emptyError)).toBeVisible({ timeout: 30000 });
      if (await emptyError.isVisible()) {
        test.skip(true, 'An endpoint failed to load, so the wall shows its error state instead of the empty-filtered message');
      }

      await expect(emptyFiltered).toContainText('No applications match the current filters');
      await expect(items(page, 'table')).toHaveCount(0);
    });

    test('should restore all rows when filter is cleared', async ({ withTestApps }) => {
      const { page, testApps } = withTestApps;
      const [target, ...others] = testApps.map(a => a.app.name);
      const appsPage = await openWall(page, 'table');

      await appsPage.setSearchText(target);
      await appsPage.list.waitForNoLoadingIndicator();
      await expectFilteredTo(page, 'table', target, others);
      const filteredTotal = await appsPage.list.getTotalResults();

      await appsPage.setSearchText('');
      await appsPage.list.waitForNoLoadingIndicator();

      // All three seeded apps count again, so the total grows past the
      // filtered set; other apps on the foundation can only add to it.
      await expect(nameFilter(page)).toHaveValue('');
      await expect.poll(async () => appsPage.list.getTotalResults(), { timeout: 30000 })
        .toBeGreaterThanOrEqual(testApps.length);
      await expect.poll(async () => appsPage.list.getTotalResults(), { timeout: 30000 })
        .toBeGreaterThan(filteredTotal);
      await expect.poll(async () => items(page, 'table').count()).toBeGreaterThan(0);
    });
  });

  test.describe('Card View', () => {

    test('should filter cards and show only matching apps', async ({ withTestApps }) => {
      const { page, testApps } = withTestApps;
      const [target, ...others] = testApps.map(a => a.app.name);
      const appsPage = await openWall(page, 'card');

      await appsPage.setSearchText(target);
      await appsPage.list.waitForNoLoadingIndicator();

      await expectFilteredTo(page, 'card', target, others);
    });

    test('should update cards when filter changes', async ({ withTestApps }) => {
      const { page, testApps } = withTestApps;
      const [first, second, third] = testApps.map(a => a.app.name);
      const appsPage = await openWall(page, 'card');

      await appsPage.setSearchText(first);
      await appsPage.list.waitForNoLoadingIndicator();
      await expectFilteredTo(page, 'card', first, [second, third]);

      await appsPage.setSearchText(second);
      await appsPage.list.waitForNoLoadingIndicator();
      await expectFilteredTo(page, 'card', second, [first, third]);
    });

    test('should restore cards when filter is cleared', async ({ withTestApps }) => {
      const { page, testApps } = withTestApps;
      const [target, ...others] = testApps.map(a => a.app.name);
      const appsPage = await openWall(page, 'card');

      await appsPage.setSearchText(target);
      await appsPage.list.waitForNoLoadingIndicator();
      await expectFilteredTo(page, 'card', target, others);
      const filteredTotal = await appsPage.list.getTotalResults();

      // Escape in the name filter clears it.
      await nameFilter(page).press('Escape');
      await appsPage.list.waitForNoLoadingIndicator();

      await expect(nameFilter(page)).toHaveValue('');
      await expect.poll(async () => appsPage.list.getTotalResults(), { timeout: 30000 })
        .toBeGreaterThanOrEqual(testApps.length);
      await expect.poll(async () => appsPage.list.getTotalResults(), { timeout: 30000 })
        .toBeGreaterThan(filteredTotal);
      await expect.poll(async () => items(page, 'card').count()).toBeGreaterThan(0);
    });
  });

  test.describe('Cross-View Filter', () => {

    test('should maintain filter when switching from table to card view', async ({ withTestApps }) => {
      const { page, testApps } = withTestApps;
      const [target, ...others] = testApps.map(a => a.app.name);
      const appsPage = await openWall(page, 'table');

      await appsPage.setSearchText(target);
      await appsPage.list.waitForNoLoadingIndicator();
      await expectFilteredTo(page, 'table', target, others);
      const tableTotal = await appsPage.list.getTotalResults();

      await setView(page, 'card');

      await expect(nameFilter(page)).toHaveValue(target);
      await expectFilteredTo(page, 'card', target, others);
      expect(await appsPage.list.getTotalResults()).toBe(tableTotal);
    });

    test('should maintain filter when switching from card to table view', async ({ withTestApps }) => {
      const { page, testApps } = withTestApps;
      const [target, ...others] = testApps.map(a => a.app.name);
      const appsPage = await openWall(page, 'card');

      await appsPage.setSearchText(target);
      await appsPage.list.waitForNoLoadingIndicator();
      await expectFilteredTo(page, 'card', target, others);
      const cardTotal = await appsPage.list.getTotalResults();

      await setView(page, 'table');

      await expect(nameFilter(page)).toHaveValue(target);
      await expectFilteredTo(page, 'table', target, others);
      expect(await appsPage.list.getTotalResults()).toBe(cardTotal);
    });
  });
});
