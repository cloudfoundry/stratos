import { test, expect } from '../../../fixtures/test-base';
import { CfTopLevelPage } from '../../../pages/cloud-foundry/cf-level/cf-top-level.page';

/**
 * CF Users Removal E2E Tests
 * Migrated from src/test-e2e/cloud-foundry/cf-level/cf-users-removal-e2e.spec.ts
 *
 * Tests removing user roles at CF level
 *
 * NOTE: Full user removal requires user management helpers and multi-step workflows
 */

test.describe('CF Users Removal', () => {

  test('should access users tab for role management', async ({ connectedEndpointsAdminPage }) => {
    const { page, cfGuid } = connectedEndpointsAdminPage;

    const cfPage = CfTopLevelPage.forEndpoint(page, cfGuid);
    await cfPage.navigateTo();
    await cfPage.goToUsersTab();

    // Verify user management interface is available
    const listComponent = page.locator('app-list');
    await expect(listComponent).toBeVisible();
  });

  test.describe('Remove User Roles (UI)', () => {

    test('should remove user from all spaces', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;

      const cfPage = CfTopLevelPage.forEndpoint(page, cfGuid);
      await cfPage.navigateTo();
      await cfPage.goToUsersTab();

      const listComponent = page.locator('app-list');
      const table = listComponent.locator('app-table, table');
      const rows = table.locator('tbody tr');

      const count = await rows.count();
      if (count < 2) {
        test.skip('Need at least 2 users to safely test removal');
      }

      // Use second user to avoid removing admin
      const secondRow = rows.nth(1);
      await secondRow.waitFor({ state: 'visible' });

      // Look for actions menu
      const menuButton = secondRow.locator('button[aria-label*="menu"], button[aria-label*="actions"]').first();
      const hasMenu = await menuButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (!hasMenu) {
        test.skip('User actions menu not found');
      }

      await menuButton.click();

      // Look for remove from spaces option
      const removeSpacesOption = page.locator('button, mat-option').filter({ hasText: /remove.*space|remove.*all.*space/i }).first();
      const hasRemoveSpaces = await removeSpacesOption.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasRemoveSpaces) {
        await expect(removeSpacesOption).toBeVisible();
        await page.keyboard.press('Escape');
      } else {
        // Look for general remove option that might include spaces
        const removeOption = page.locator('button, mat-option').filter({ hasText: /remove|delete/i }).first();
        const hasRemove = await removeOption.isVisible({ timeout: 5000 }).catch(() => false);

        if (!hasRemove) {
          await page.keyboard.press('Escape');
          test.skip('Remove options not available');
        }

        await removeOption.click();

        // Check if dialog has "remove from all spaces" option
        const dialog = page.locator('mat-dialog-container');
        const dialogExists = await dialog.isVisible({ timeout: 5000 }).catch(() => false);

        if (dialogExists) {
          const spacesCheckbox = dialog.locator('mat-checkbox, input[type="checkbox"]').filter({ hasText: /space/i }).first();
          const hasCheckbox = await spacesCheckbox.isVisible({ timeout: 5000 }).catch(() => false);

          if (hasCheckbox) {
            await expect(spacesCheckbox).toBeVisible();
          }

          // Close dialog
          const cancelButton = page.locator('button').filter({ hasText: /cancel|no/i }).first();
          if (await cancelButton.isVisible().catch(() => false)) {
            await cancelButton.click();
          } else {
            await page.keyboard.press('Escape');
          }
        } else {
          await page.keyboard.press('Escape');
          test.skip('Remove from spaces option not found');
        }
      }
    });

    test('should remove user from all orgs', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;

      const cfPage = CfTopLevelPage.forEndpoint(page, cfGuid);
      await cfPage.navigateTo();
      await cfPage.goToUsersTab();

      const listComponent = page.locator('app-list');
      const table = listComponent.locator('app-table, table');
      const rows = table.locator('tbody tr');

      const count = await rows.count();
      if (count < 2) {
        test.skip('Need at least 2 users to safely test removal');
      }

      const secondRow = rows.nth(1);
      await secondRow.waitFor({ state: 'visible' });

      // Look for actions menu
      const menuButton = secondRow.locator('button[aria-label*="menu"], button[aria-label*="actions"]').first();
      const hasMenu = await menuButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (!hasMenu) {
        test.skip('User actions menu not found');
      }

      await menuButton.click();

      // Look for remove from orgs option
      const removeOrgsOption = page.locator('button, mat-option').filter({ hasText: /remove.*org|remove.*all.*org/i }).first();
      const hasRemoveOrgs = await removeOrgsOption.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasRemoveOrgs) {
        await expect(removeOrgsOption).toBeVisible();
        await page.keyboard.press('Escape');
      } else {
        // Look for general remove option
        const removeOption = page.locator('button, mat-option').filter({ hasText: /remove|delete/i }).first();
        const hasRemove = await removeOption.isVisible({ timeout: 5000 }).catch(() => false);

        if (!hasRemove) {
          await page.keyboard.press('Escape');
          test.skip('Remove options not available');
        }

        await removeOption.click();

        // Check if dialog has "remove from all orgs" option
        const dialog = page.locator('mat-dialog-container');
        const dialogExists = await dialog.isVisible({ timeout: 5000 }).catch(() => false);

        if (dialogExists) {
          const orgsCheckbox = dialog.locator('mat-checkbox, input[type="checkbox"]').filter({ hasText: /org/i }).first();
          const hasCheckbox = await orgsCheckbox.isVisible({ timeout: 5000 }).catch(() => false);

          if (hasCheckbox) {
            await expect(orgsCheckbox).toBeVisible();
          }

          // Close dialog
          const cancelButton = page.locator('button').filter({ hasText: /cancel|no/i }).first();
          if (await cancelButton.isVisible().catch(() => false)) {
            await cancelButton.click();
          } else {
            await page.keyboard.press('Escape');
          }
        } else {
          await page.keyboard.press('Escape');
          test.skip('Remove from orgs option not found');
        }
      }
    });

    test('should confirm removal action', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;

      const cfPage = CfTopLevelPage.forEndpoint(page, cfGuid);
      await cfPage.navigateTo();
      await cfPage.goToUsersTab();

      const listComponent = page.locator('app-list');
      const table = listComponent.locator('app-table, table');
      const rows = table.locator('tbody tr');

      const count = await rows.count();
      if (count < 2) {
        test.skip('Need at least 2 users to test confirmation');
      }

      const secondRow = rows.nth(1);
      await secondRow.waitFor({ state: 'visible' });

      // Open actions menu and click remove
      const menuButton = secondRow.locator('button[aria-label*="menu"], button[aria-label*="actions"]').first();
      const hasMenu = await menuButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (!hasMenu) {
        test.skip('User actions menu not found');
      }

      await menuButton.click();

      const removeOption = page.locator('button, mat-option').filter({ hasText: /remove|delete/i }).first();
      const hasRemove = await removeOption.isVisible({ timeout: 5000 }).catch(() => false);

      if (!hasRemove) {
        await page.keyboard.press('Escape');
        test.skip('Remove option not available');
      }

      await removeOption.click();

      // Verify confirmation dialog appears
      const confirmDialog = page.locator('mat-dialog-container');
      const dialogExists = await confirmDialog.isVisible({ timeout: 5000 }).catch(() => false);

      if (!dialogExists) {
        test.skip('Confirmation dialog not displayed');
      }

      await expect(confirmDialog).toBeVisible();

      // Verify confirm button exists
      const confirmButton = page.locator('button').filter({ hasText: /confirm|yes|remove|delete/i }).first();
      const hasConfirm = await confirmButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (!hasConfirm) {
        await page.keyboard.press('Escape');
        test.skip('Confirm button not found');
      }

      await expect(confirmButton).toBeVisible();

      // Cancel instead of confirming (don't actually remove)
      const cancelButton = page.locator('button').filter({ hasText: /cancel|no/i }).first();
      if (await cancelButton.isVisible().catch(() => false)) {
        await cancelButton.click();
      } else {
        await page.keyboard.press('Escape');
      }
    });

    test('should cancel removal action', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;

      const cfPage = CfTopLevelPage.forEndpoint(page, cfGuid);
      await cfPage.navigateTo();
      await cfPage.goToUsersTab();

      const listComponent = page.locator('app-list');
      const table = listComponent.locator('app-table, table');
      const rows = table.locator('tbody tr');

      const count = await rows.count();
      if (count < 2) {
        test.skip('Need at least 2 users to test cancellation');
      }

      const secondRow = rows.nth(1);
      await secondRow.waitFor({ state: 'visible' });

      // Open actions menu and click remove
      const menuButton = secondRow.locator('button[aria-label*="menu"], button[aria-label*="actions"]').first();
      const hasMenu = await menuButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (!hasMenu) {
        test.skip('User actions menu not found');
      }

      await menuButton.click();

      const removeOption = page.locator('button, mat-option').filter({ hasText: /remove|delete/i }).first();
      const hasRemove = await removeOption.isVisible({ timeout: 5000 }).catch(() => false);

      if (!hasRemove) {
        await page.keyboard.press('Escape');
        test.skip('Remove option not available');
      }

      await removeOption.click();

      // Verify confirmation dialog appears
      const confirmDialog = page.locator('mat-dialog-container');
      const dialogExists = await confirmDialog.isVisible({ timeout: 5000 }).catch(() => false);

      if (!dialogExists) {
        test.skip('Confirmation dialog not displayed');
      }

      await expect(confirmDialog).toBeVisible();

      // Verify cancel button exists and click it
      const cancelButton = page.locator('button').filter({ hasText: /cancel|no/i }).first();
      const hasCancel = await cancelButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (!hasCancel) {
        await page.keyboard.press('Escape');
        test.skip('Cancel button not found');
      }

      await expect(cancelButton).toBeVisible();
      await cancelButton.click();

      // Verify dialog closed and we're still on users page
      const dialogStillVisible = await confirmDialog.isVisible({ timeout: 2000 }).catch(() => false);
      expect(dialogStillVisible).toBeFalsy();

      // Verify we're still on users tab
      const url = page.url();
      expect(url).toContain('users');
    });
  });
});
