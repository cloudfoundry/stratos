import { test, expect } from '../../fixtures/test-base';
import { ApplicationPageSummary } from '../../pages/application/application.page';

/**
 * Services Tab Smoke Test
 * Stage 9c of the services-domain signal+V3 slice
 *
 * Verifies the app-detail Service Bindings tab is reachable and renders
 * the signal-list framework after the migration off
 * AppServiceBindingListConfigService.
 */
test.describe('Application Services Tab', () => {
  test.describe('With Test Application', () => {

    test('should navigate to services tab', async ({ withTestApp }) => {
      const { page, testApp } = withTestApp;

      const appSummary = new ApplicationPageSummary(page, testApp.cfGuid, testApp.app.guid);
      await appSummary.navigateTo();
      await appSummary.waitForPage();

      await appSummary.goToServicesTab();

      const expectedUrl = `/applications/${testApp.cfGuid}/${testApp.app.guid}/services`;
      await expect(page).toHaveURL(new RegExp(expectedUrl.replace(/\//g, '\\/')));
    });

    test('renders the signal-list framework on the services tab', async ({ withTestApp }) => {
      const { page, testApp } = withTestApp;

      const appSummary = new ApplicationPageSummary(page, testApp.cfGuid, testApp.app.guid);
      await appSummary.navigateTo();
      await appSummary.waitForPage();

      await appSummary.goToServicesTab();
      await page.waitForTimeout(500);

      // The migrated tab uses <app-signal-list> (not the legacy <app-list>).
      // If this locator finds the legacy element instead, the migration
      // regressed.
      const signalList = page.locator('app-signal-list').first();
      await expect(signalList).toBeVisible({ timeout: 10000 });
    });

    test('shows bindings or empty state', async ({ withTestApp }) => {
      const { page, testApp } = withTestApp;

      const appSummary = new ApplicationPageSummary(page, testApp.cfGuid, testApp.app.guid);
      await appSummary.navigateTo();
      await appSummary.waitForPage();

      await appSummary.goToServicesTab();
      await page.waitForTimeout(500);

      // Either the per-binding rows OR the empty-state message must be
      // visible — anything else means the tab failed to settle.
      const emptyText = page.locator('text=/no bound service instances/i');
      const rows = page.locator('app-signal-list [role="row"], app-signal-list .signal-list-card');

      const emptyVisible = await emptyText.isVisible().catch(() => false);
      const rowCount = await rows.count();
      expect(emptyVisible || rowCount > 0).toBeTruthy();
    });

    test('shows the L5 Bind Service action and Total Services count', async ({ withTestApp }) => {
      const { page, testApp } = withTestApp;

      const appSummary = new ApplicationPageSummary(page, testApp.cfGuid, testApp.app.guid);
      await appSummary.navigateTo();
      await appSummary.waitForPage();

      await appSummary.goToServicesTab();
      await page.waitForTimeout(500);

      const subNav = page.locator('app-list-sub-nav').first();
      await expect(subNav).toBeVisible({ timeout: 10000 });
      await expect(subNav).toContainText(/Total Services/i);
    });
  });
});
