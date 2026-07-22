import { test, expect } from '../../fixtures/test-base';
import { ApplicationPageSummary } from '../../pages/application/application.page';

/**
 * Revisions Tab Smoke Test
 * Task 16 of A10 Revisions UI plan
 *
 * Verifies the Revisions tab is reachable and displays the list area
 * (empty state or populated).
 */

test.describe('Application Revisions Tab', () => {
  test.describe('With Test Application', () => {

    test('should navigate to revisions tab', async ({ withTestApp }) => {
      const { page, testApp } = withTestApp;

      const appSummary = new ApplicationPageSummary(page, testApp.cfGuid, testApp.app.guid);
      await appSummary.navigateTo();
      await appSummary.waitForPage();

      // Navigate to revisions tab using the new helper
      await appSummary.goToRevisionsTab();

      // Verify URL matches the revisions endpoint
      const expectedUrl = `/applications/${testApp.cfGuid}/${testApp.app.guid}/revisions`;
      await expect(page).toHaveURL(new RegExp(expectedUrl.replace(/\//g, '\\/')));
    });

    test('should display revisions list area', async ({ withTestApp }) => {
      const { page, testApp } = withTestApp;

      const appSummary = new ApplicationPageSummary(page, testApp.cfGuid, testApp.app.guid);
      await appSummary.navigateTo();
      await appSummary.waitForPage();

      await appSummary.goToRevisionsTab();
      await page.waitForTimeout(500);

      // Look for the revisions list component
      // The revisions tab uses app-signal-list internally
      const revisionsList = page.locator('app-signal-list, app-revisions-tab').first();
      await expect(revisionsList).toBeVisible({ timeout: 10000 });
    });

    test('should show revisions or empty state', async ({ withTestApp }) => {
      const { page, testApp } = withTestApp;

      const appSummary = new ApplicationPageSummary(page, testApp.cfGuid, testApp.app.guid);
      await appSummary.navigateTo();
      await appSummary.waitForPage();

      await appSummary.goToRevisionsTab();
      await page.waitForTimeout(500);

      // Look for either a revision in the list or the empty state message
      const noRevisionsText = page.locator('text=/No revisions yet/i');
      const revisionRows = page.locator('mat-row, [role="row"]');

      const noRevisionsVisible = await noRevisionsText.isVisible().catch(() => false);
      const rowCount = await revisionRows.count();

      // Either empty state or at least one revision should be present
      expect(noRevisionsVisible || rowCount > 0).toBeTruthy();
    });

  });
});
