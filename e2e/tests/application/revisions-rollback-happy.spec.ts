import { test, expect } from '../../fixtures/test-base';
import { ApplicationPageSummary } from '../../pages/application/application.page';

/**
 * Application Revisions Rollback E2E Test
 * Tests the happy path for rolling back to a previous revision
 *
 * PRECONDITION: This spec requires the test app to have AT LEAST TWO revisions.
 * A fresh withTestApp has only one revision.
 *
 * To enable this test:
 * 1. Set environment variable E2E_MULTI_REVISION_APP_GUID pointing at a known multi-revision app, OR
 * 2. Comment out test.skip() and run after deploying the app twice (e.g., via cf restage or code push)
 *
 * When enabled, the test will:
 * - Navigate to Revisions tab
 * - Assert ≥ 2 revisions exist
 * - Click rollback on the first non-deployed row
 * - Verify dialog opens with target revision number and strategy label
 * - Click Confirm, wait for dialog close
 * - Assert the deployed revision changed (rollback creates a new revision with higher version)
 */

test.describe('Application Revisions', () => {
  test.describe('Rollback Happy Path', () => {
    // TODO: Replace test.skip() with test() once a multi-revision app is available.
    // Set E2E_MULTI_REVISION_APP_GUID env var or run after at least two deployments.
    test.skip('should rollback to a previous revision and create new deployed revision', async ({ withTestApp, page }) => {
      const { testApp } = withTestApp;

      // Navigate to Revisions tab
      const appSummary = new ApplicationPageSummary(page, testApp.cfGuid, testApp.app.guid);
      await appSummary.navigateTo();
      await appSummary.waitForPage();
      await appSummary.goToRevisionsTab();

      // Wait for revisions list to load
      const revisionsList = page.locator('app-signal-list, mat-table, .revisions-list').first();
      await expect(revisionsList).toBeVisible({ timeout: 10000 });

      // Assert we have at least 2 revisions
      const revisionRows = page.locator('mat-table tbody tr, [role="row"]');
      const rowCount = await revisionRows.count();
      expect(rowCount).toBeGreaterThanOrEqual(2);

      // Find the deployed revision and capture its version
      const deployedRow = page.locator('mat-table tbody tr, [role="row"]').filter({
        has: page.locator('text=/deployed|current/i')
      }).first();
      const deployedVersionText = await deployedRow.locator('[class*="version"]').textContent() || '';
      const deployedVersion = parseInt(deployedVersionText.match(/\d+/)?.[0] || '0');

      // Find the first non-deployed row and click rollback
      const nonDeployedRows = await page.locator('mat-table tbody tr, [role="row"]').all();
      let rollbackClicked = false;
      let targetRevisionVersion = 0;

      for (const row of nonDeployedRows) {
        const isDeployed = await row.locator('text=/deployed|current/i').isVisible().catch(() => false);
        if (!isDeployed) {
          const versionText = await row.locator('[class*="version"]').textContent() || '';
          targetRevisionVersion = parseInt(versionText.match(/\d+/)?.[0] || '0');

          // Click rollback button on this row
          const rollbackBtn = row.locator('button, mat-icon-button').filter({ hasText: /rollback|revert/i }).first();
          if (await rollbackBtn.isVisible().catch(() => false)) {
            await rollbackBtn.click();
            rollbackClicked = true;
            break;
          }
        }
      }

      expect(rollbackClicked).toBeTruthy();

      // Wait for and verify rollback dialog
      const dialog = page.locator('mat-dialog-container, [role="dialog"]').first();
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Assert dialog contains revision number
      const dialogHeading = dialog.locator('h1, h2');
      await expect(dialogHeading).toContainText(`#${targetRevisionVersion}`);

      // Assert Strategy: rolling is shown
      const strategyLabel = dialog.locator('dt, dd, text=/strategy/i').filter({ hasText: /strategy/i }).first();
      const strategyValue = dialog.locator('text=/rolling/i');
      await expect(strategyValue).toBeVisible();

      // Get confirm button and assert it shows either "Confirm Rollback" or "Rolling back…"
      const confirmBtn = dialog.locator('[data-testid="confirm-btn"]');
      await expect(confirmBtn).toBeEnabled();
      const btnText = await confirmBtn.textContent() || '';
      expect(btnText).toMatch(/confirm rollback|rolling back/i);

      // Click Confirm
      await confirmBtn.click();

      // Wait for dialog to close
      await expect(dialog).not.toBeVisible({ timeout: 10000 });

      // Wait for list to refresh and assert deployed revision changed
      await page.waitForTimeout(1000); // Allow time for list refresh
      await expect(revisionsList).toBeVisible();

      // Find the new deployed row and verify its version is higher than the original deployed
      const newDeployedRow = page.locator('mat-table tbody tr, [role="row"]').filter({
        has: page.locator('text=/deployed|current/i')
      }).first();
      const newDeployedVersionText = await newDeployedRow.locator('[class*="version"]').textContent() || '';
      const newDeployedVersion = parseInt(newDeployedVersionText.match(/\d+/)?.[0] || '0');

      // Rollback creates a new revision, so new deployed version should be higher
      expect(newDeployedVersion).toBeGreaterThan(deployedVersion);
    });
  });
});
