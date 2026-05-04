import { test, expect } from '../../fixtures/test-base';
import { ApplicationPageSummary } from '../../pages/application/application.page';
import { createCustomName } from '../../helpers/test-utils';

/**
 * Application Revisions Tab Action Bar E2E Tests
 *
 * Regression spec for Task 10 of A10 Revisions UI plan:
 * Verifies that the application action bar (start/stop/restart/restage/delete)
 * persists correctly across tab navigation, including the new Revisions tab.
 *
 * Background: AppApplicationActionBarComponent was extracted from BuildTabComponent
 * (Summary tab only) and moved to application-tabs-base so it appears on ALL tabs.
 * This spec ensures the bar is visible on Revisions and other tabs.
 */

const testAppName = createCustomName('test-revisions-actionbar');

test.describe('Application Revisions Tab Action Bar', () => {

  test.describe('With Test Application', () => {
    // Uses withTestApp fixture for automatic app creation and cleanup

    test('action bar should be visible on revisions tab', async ({ withTestApp }) => {
      const { page, testApp } = withTestApp;

      const appSummary = new ApplicationPageSummary(page, testApp.cfGuid, testApp.app.guid);
      await appSummary.navigateTo();
      await appSummary.waitForPage();

      // Navigate to Revisions tab
      await appSummary.goToRevisionsTab();
      await page.waitForTimeout(500);

      // Verify action bar buttons are visible
      // Check for start OR stop button (depends on app state)
      const startButton = page.locator('button[name="start"]');
      const stopButton = page.locator('button[name="stop"]');
      const hasStartOrStop = (await startButton.count()) > 0 || (await stopButton.count()) > 0;
      expect(hasStartOrStop).toBeTruthy();

      // Verify restart button is visible
      const restartButton = page.locator('button[name="restart"]');
      await expect(restartButton).toBeVisible();

      // Verify restage button is visible
      const restageButton = page.locator('button[name="restage"]');
      await expect(restageButton).toBeVisible();

      // Verify delete button is visible
      const deleteButton = page.locator('button[name="delete"]');
      await expect(deleteButton).toBeVisible();
    });

    test('restart action should open confirmation dialog on revisions tab', async ({ withTestApp }) => {
      const { page, testApp } = withTestApp;

      const appSummary = new ApplicationPageSummary(page, testApp.cfGuid, testApp.app.guid);
      await appSummary.navigateTo();
      await appSummary.waitForPage();

      // Navigate to Revisions tab
      await appSummary.goToRevisionsTab();
      await page.waitForTimeout(500);

      // Click restart button
      const restartButton = page.locator('button[name="restart"]');
      await restartButton.click();

      // Verify confirmation dialog or prompt appears
      const dialog = page.locator('mat-dialog-container, [role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Cancel out of the dialog (escape key or close button)
      await page.press('Escape');
      await page.waitForTimeout(300);
    });

    test('restage action should open confirmation dialog on revisions tab', async ({ withTestApp }) => {
      const { page, testApp } = withTestApp;

      const appSummary = new ApplicationPageSummary(page, testApp.cfGuid, testApp.app.guid);
      await appSummary.navigateTo();
      await appSummary.waitForPage();

      // Navigate to Revisions tab
      await appSummary.goToRevisionsTab();
      await page.waitForTimeout(500);

      // Click restage button
      const restageButton = page.locator('button[name="restage"]');
      await restageButton.click();

      // Verify confirmation dialog or prompt appears
      const dialog = page.locator('mat-dialog-container, [role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Cancel out of the dialog (escape key or close button)
      await page.press('Escape');
      await page.waitForTimeout(300);
    });

    test('action bar should persist across tab navigation', async ({ withTestApp }) => {
      const { page, testApp } = withTestApp;

      const appSummary = new ApplicationPageSummary(page, testApp.cfGuid, testApp.app.guid);
      await appSummary.navigateTo();
      await appSummary.waitForPage();

      // Verify action bar on Summary tab
      const restartButtonSummary = page.locator('button[name="restart"]');
      await expect(restartButtonSummary).toBeVisible();

      // Navigate to Revisions tab
      await appSummary.goToRevisionsTab();
      await page.waitForTimeout(500);

      // Verify action bar still visible on Revisions tab
      const restartButtonRevisions = page.locator('button[name="restart"]');
      await expect(restartButtonRevisions).toBeVisible();

      // Navigate to Variables tab
      await appSummary.goToVariablesTab();
      await page.waitForTimeout(500);

      // Verify action bar still visible on Variables tab
      const restartButtonVariables = page.locator('button[name="restart"]');
      await expect(restartButtonVariables).toBeVisible();

      // Navigate to Events tab
      await appSummary.goToEventsTab();
      await page.waitForTimeout(500);

      // Verify action bar still visible on Events tab
      const restartButtonEvents = page.locator('button[name="restart"]');
      await expect(restartButtonEvents).toBeVisible();
    });

    // Cleanup handled automatically by withTestApp fixture
  });
});
