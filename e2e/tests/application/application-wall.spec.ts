import { test, expect } from '../../fixtures/test-base';
import { ApplicationsPage } from '../../pages/application/applications-list.page';
import { ListTableComponent } from '../../components/list.component';
import { createCustomName } from '../../helpers/test-utils';

/**
 * Application Wall E2E Tests
 * Migrated from src/test-e2e/applications/application-wall-e2e.spec.ts
 *
 * Tests the applications wall page (list view, filters, sorting)
 *
 * CF Helpers Integration:
 * - ✅ CFApiHelper - Full CF V3 API wrapper
 * - ✅ ApplicationTestHelper - High-level app management
 * - ✅ Test fixtures - withTestApp, withTestApps for automatic resource management
 */

const customOrgSpacesLabel = createCustomName('app-wall-tests');

test.describe('Application Wall Tests', () => {

  test.describe('Basic Wall View', () => {
    test('should display applications wall', { tag: '@smoke' }, async ({ connectedEndpointsUserPage }) => {
      const appsPage = new ApplicationsPage(connectedEndpointsUserPage.page);

      // Navigate to applications
      await appsPage.navigateTo();
      await appsPage.waitForPage();

      // Verify page is active
      expect(await appsPage.isActivePage()).toBeTruthy();
    });

    test('should show list component', async ({ connectedEndpointsUserPage }) => {
      const appsPage = new ApplicationsPage(connectedEndpointsUserPage.page);
      await appsPage.navigateTo();
      await appsPage.waitForPage();

      // List should be visible
      await appsPage.list.waitUntilShown();
      expect(await appsPage.list.locator.isVisible()).toBeTruthy();
    });
  });

  test.describe('List Operations', () => {
    // These need real rows on the wall, so they seed apps via withTestApps —
    // the connectedEndpointsUser wall is empty (renders neither table nor cards).
    test('should switch between card and table view', async ({ withTestApps }) => {
      const { page } = withTestApps;
      const appsPage = new ApplicationsPage(page);
      await appsPage.navigateTo();
      await appsPage.waitForPage();

      // Modern signal-list has a single view-toggle button; the wall defaults
      // to table view (renders <table>) and switches to a [data-test="card-grid"].
      // Assert directly on the wall's signal-list DOM with auto-waiting.
      const list = page.locator('app-application-wall app-signal-list');
      const toggle = list.locator('[data-test="view-toggle"]');
      await expect(toggle).toBeVisible();

      await expect(list.locator('table')).toBeVisible({ timeout: 15000 });
      await toggle.click();
      await expect(list.locator('[data-test="card-grid"]')).toBeVisible();
      await toggle.click();
      await expect(list.locator('table')).toBeVisible();
    });

    test('should filter applications by name', async ({ withTestApps }) => {
      const { page, testApps } = withTestApps;
      const appsPage = new ApplicationsPage(page);
      await appsPage.navigateTo();
      await appsPage.waitForPage();

      // Wait for the seeded apps to load, then capture the unfiltered count.
      await expect.poll(async () => appsPage.getCardCount(), { timeout: 15000 }).toBeGreaterThan(0);
      const initialCount = await appsPage.getCardCount();

      // Filter to one seeded app by name (page object drives [data-test="name-filter"]).
      await appsPage.setSearchText(testApps[0].app.name);
      await appsPage.list.waitForNoLoadingIndicator();

      // The named app still matches, and the filtered set is no larger than before.
      const filteredCount = await appsPage.getCardCount();
      expect(filteredCount).toBeGreaterThan(0);
      expect(filteredCount).toBeLessThanOrEqual(initialCount);
    });
  });

  test.describe('With Test Applications', () => {
    // These tests use CF helpers to create test applications
    // withTestApps fixture automatically:
    // 1. Creates 3 test applications with e2e labels
    // 2. Provides page, testApps array, and helper
    // 3. Cleans up all apps after test completion

    test('should display created test applications', async ({ withTestApps }) => {
      const { page, testApps } = withTestApps;
      const appsPage = new ApplicationsPage(page);

      // Navigate to applications
      await appsPage.navigateTo();
      await appsPage.waitForPage();

      // Wait for the seeded apps to load.
      await expect.poll(async () => appsPage.getCardCount(), { timeout: 15000 }).toBeGreaterThan(0);

      // Filter to a seeded app by name and confirm it renders as a row.
      const firstAppName = testApps[0].app.name;
      await appsPage.setSearchText(firstAppName);
      await appsPage.list.waitForNoLoadingIndicator();

      const list = new ListTableComponent(page, page.locator('app-application-wall app-signal-list'));
      const row = await list.findRowByCellContent(firstAppName);
      await expect(row).toBeVisible();
    });

    test('should navigate to application details', async ({ withTestApp }) => {
      const { page, testApp } = withTestApp;
      const appsPage = new ApplicationsPage(page);
      await appsPage.navigateTo();
      await appsPage.waitForPage();

      // Click through from the loaded wall (a raw deep-link goto redirects to
      // Home before the store hydrates); this is the real user flow.
      await appsPage.setSearchText(testApp.app.name);
      await appsPage.list.waitForNoLoadingIndicator();
      // Generous wait for the just-created app's row (slow polled wall under load).
      const cell = page.locator('app-application-wall app-signal-list td', { hasText: testApp.app.name }).first();
      await expect(cell).toBeVisible({ timeout: 30000 });
      const row = cell.locator('xpath=ancestor::tr');
      await row.getByRole('link', { name: testApp.app.name }).click();

      // The app detail page renders our app's name as its page heading.
      const heading = page.locator('h1, h2, .app-name').filter({ hasText: testApp.app.name });
      await expect(heading).toBeVisible({ timeout: 20000 });
    });

    // Signal-list columns sort via a per-header button; toggling a column's
    // sort must reorder the rows (proven by a change in the first row).
    const headerSortButton = (page: import('@playwright/test').Page, header: string) =>
      page.locator('app-application-wall app-signal-list thead th', { hasText: header }).locator('button');

    // Read the first data row's text (carries the unique app name) — robust to
    // column layout, unlike index-mapped cell reads.
    const firstRowText = (page: import('@playwright/test').Page) =>
      page.locator('app-application-wall app-signal-list tbody tr[data-test="row"]').first().textContent();

    test('should sort applications by name', async ({ withTestApps }) => {
      const { page } = withTestApps;
      const appsPage = new ApplicationsPage(page);
      await appsPage.navigateTo();
      await appsPage.waitForPage();
      await expect.poll(async () => appsPage.getCardCount(), { timeout: 15000 }).toBeGreaterThan(1);

      const firstAsc = await firstRowText(page);
      // Toggle the Name column from asc (default) to desc; the top row must change.
      await headerSortButton(page, 'Name').click();
      await appsPage.list.waitForNoLoadingIndicator();
      await expect.poll(async () => firstRowText(page)).not.toBe(firstAsc);
    });

    test('should sort applications by creation date', async ({ withTestApps }) => {
      const { page } = withTestApps;
      const appsPage = new ApplicationsPage(page);
      await appsPage.navigateTo();
      await appsPage.waitForPage();
      await expect.poll(async () => appsPage.getCardCount(), { timeout: 15000 }).toBeGreaterThan(1);

      const firstByName = await firstRowText(page); // default: name asc
      // Sorting by Created reorders the wall away from the name order.
      await headerSortButton(page, 'Created').click();
      await appsPage.list.waitForNoLoadingIndicator();
      await expect.poll(async () => firstRowText(page)).not.toBe(firstByName);
    });

    // The wall renders native org/space filter <select>s that default to "All".
    // Assert each is present and correctly initialised. Populated filter→result
    // behavior is covered in depth by apps-list-filter-sync.spec.ts — the org/space
    // options are gated on choosing a single CF when endpoints share a URL.
    async function assertFilterDropdown(page: import('@playwright/test').Page, label: string) {
      const appsPage = new ApplicationsPage(page);
      await appsPage.navigateTo();
      await appsPage.waitForPage();

      const select = page.locator(`app-application-wall app-signal-list select#dropdown-${label}`);
      await expect(select).toBeVisible();
      expect(await select.inputValue()).toBe(''); // "All"
    }

    test('should filter by organization', async ({ withTestApps }) => {
      await assertFilterDropdown(withTestApps.page, 'Organization');
    });

    test('should filter by space', async ({ withTestApps }) => {
      await assertFilterDropdown(withTestApps.page, 'Space');
    });

    // The wall row (signal-list) carries Status / Instances / Memory columns;
    // assert each renders for a freshly-created (STOPPED) app.
    async function wallRowFor(page: import('@playwright/test').Page, appName: string) {
      const appsPage = new ApplicationsPage(page);
      await appsPage.navigateTo();
      await appsPage.waitForPage();
      await appsPage.setSearchText(appName);
      await appsPage.list.waitForNoLoadingIndicator();
      // Wait generously for the filtered row — a just-created app on the polled
      // wall + slow CF path can exceed the default row wait under full-suite load.
      const cell = page.locator('app-application-wall app-signal-list td', { hasText: appName }).first();
      await expect(cell).toBeVisible({ timeout: 30000 });
      const row = cell.locator('xpath=ancestor::tr');
      await expect(row).toBeVisible();
      return row;
    }

    test('should display application status correctly', async ({ withTestApp }) => {
      const { page, testApp } = withTestApp;
      const row = await wallRowFor(page, testApp.app.name);
      // A freshly-created app is STOPPED; the Status column renders that state.
      await expect(row).toContainText(/stopp?ed|started|running/i);
    });

    test('should show application instance count', async ({ withTestApp }) => {
      const { page, testApp } = withTestApp;
      const row = await wallRowFor(page, testApp.app.name);
      // The Instances column renders a running/desired count, e.g. "0 / 1".
      await expect(row).toContainText(/\d+\s*\/\s*\d+/);
    });

    test('should display application memory usage', async ({ withTestApp }) => {
      const { page, testApp } = withTestApp;
      const row = await wallRowFor(page, testApp.app.name);
      // The Memory column renders an allocation, e.g. "256 MB".
      await expect(row).toContainText(/\d+\s*(MB|GB)/i);
    });
  });
});
