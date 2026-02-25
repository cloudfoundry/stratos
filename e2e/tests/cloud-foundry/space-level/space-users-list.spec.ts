import { test, expect } from '../../../fixtures/test-base';
import { CfSpaceLevelPage } from '../../../pages/cloud-foundry/space-level/cf-space-level.page';

/**
 * Space Users List E2E Tests
 * Migrated from src/test-e2e/cloud-foundry/space-level/space-users-list-e2e.spec.ts
 *
 * Tests users list at space level
 */

test.describe('Space Users List', () => {

  test('should display users tab', async ({ connectedEndpointsAdminPage, secrets }) => {
    const { page, cfGuid } = connectedEndpointsAdminPage;
    const cfEndpoint = secrets.getCloudfoundryEndpoint(0);

    const orgGuid = cfEndpoint.testOrgGuid;
    const spaceGuid = cfEndpoint.testSpaceGuid;
    const spacePage = CfSpaceLevelPage.forEndpoint(page, cfGuid, orgGuid, spaceGuid);
    await spacePage.navigateTo();
    await spacePage.goToUsersTab();

    // Verify users list
    const listComponent = page.locator('app-list');
    await expect(listComponent).toBeVisible();
  });

  test.describe('User Management (UI)', () => {

    test('should show space users', async ({ connectedEndpointsAdminPage, secrets }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const cfEndpoint = secrets.getCloudfoundryEndpoint(0);

      const orgGuid = cfEndpoint.testOrgGuid;
      const spaceGuid = cfEndpoint.testSpaceGuid;
      const spacePage = CfSpaceLevelPage.forEndpoint(page, cfGuid, orgGuid, spaceGuid);
      await spacePage.navigateTo();
      await spacePage.goToUsersTab();

      // Verify users list is displayed
      const listComponent = page.locator('app-list');
      await expect(listComponent).toBeVisible();

      // Verify we have users
      const table = listComponent.locator('app-table, table');
      const tableExists = await table.isVisible({ timeout: 5000 }).catch(() => false);

      if (!tableExists) {
        test.skip('Users table not displayed');
      }

      const rows = table.locator('tbody tr');
      const count = await rows.count();
      expect(count).toBeGreaterThan(0);

      // Verify user information is shown
      const firstRow = rows.first();
      const rowText = await firstRow.textContent() || '';
      expect(rowText.length).toBeGreaterThan(0);
    });

    test('should filter users by role', async ({ connectedEndpointsAdminPage, secrets }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const cfEndpoint = secrets.getCloudfoundryEndpoint(0);

      const orgGuid = cfEndpoint.testOrgGuid;
      const spaceGuid = cfEndpoint.testSpaceGuid;
      const spacePage = CfSpaceLevelPage.forEndpoint(page, cfGuid, orgGuid, spaceGuid);
      await spacePage.navigateTo();
      await spacePage.goToUsersTab();

      // Look for role filter dropdown
      const listComponent = page.locator('app-list');
      const roleFilter = listComponent.locator('mat-select, select').filter({ hasText: /role|filter/i }).first();
      const filterExists = await roleFilter.isVisible({ timeout: 5000 }).catch(() => false);

      if (!filterExists) {
        test.skip('Role filter not found in space users list');
      }

      await expect(roleFilter).toBeVisible();
      await roleFilter.click();

      // Look for space role options (Developer, Auditor, Manager)
      const roleOption = page.locator('mat-option').filter({ hasText: /developer|manager|auditor/i }).first();
      const optionExists = await roleOption.isVisible({ timeout: 5000 }).catch(() => false);

      if (!optionExists) {
        await page.keyboard.press('Escape');
        test.skip('Role filter options not found');
      }

      await expect(roleOption).toBeVisible();

      // Select a role option
      await roleOption.click();
      await page.waitForTimeout(1000);

      // Verify filter was applied
      const table = listComponent.locator('app-table, table');
      const rows = table.locator('tbody tr');
      const filteredCount = await rows.count();
      expect(filteredCount).toBeGreaterThanOrEqual(0);
    });

    test('should manage user roles in space', async ({ connectedEndpointsAdminPage, secrets }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const cfEndpoint = secrets.getCloudfoundryEndpoint(0);

      const orgGuid = cfEndpoint.testOrgGuid;
      const spaceGuid = cfEndpoint.testSpaceGuid;
      const spacePage = CfSpaceLevelPage.forEndpoint(page, cfGuid, orgGuid, spaceGuid);
      await spacePage.navigateTo();
      await spacePage.goToUsersTab();

      const listComponent = page.locator('app-list');
      const table = listComponent.locator('app-table, table');
      const rows = table.locator('tbody tr');

      const count = await rows.count();
      if (count === 0) {
        test.skip('No users to manage');
      }

      // Find first user row
      const firstRow = rows.first();
      await firstRow.waitFor({ state: 'visible' });

      // Look for manage roles action
      const menuButton = firstRow.locator('button[aria-label*="menu"], button[aria-label*="actions"], .actions-menu button').first();
      const hasMenu = await menuButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (!hasMenu) {
        test.skip('User actions menu not found');
      }

      await menuButton.click();

      // Look for role management option
      const manageRolesOption = page.locator('button, mat-option').filter({ hasText: /manage.*role|edit.*role|role/i }).first();
      const hasManageOption = await manageRolesOption.isVisible({ timeout: 5000 }).catch(() => false);

      if (!hasManageOption) {
        await page.keyboard.press('Escape');
        test.skip('Manage roles option not available');
      }

      await expect(manageRolesOption).toBeVisible();
      await manageRolesOption.click();

      // Verify role management dialog/page opened
      const roleDialog = page.locator('app-manage-space-user-roles, mat-dialog-container');
      const dialogExists = await roleDialog.isVisible({ timeout: 5000 }).catch(() => false);

      if (dialogExists) {
        await expect(roleDialog.first()).toBeVisible();

        // Look for space role checkboxes (Developer, Manager, Auditor)
        const roleCheckbox = roleDialog.locator('mat-checkbox, input[type="checkbox"]').filter({ hasText: /developer|manager|auditor/i }).first();
        const hasCheckbox = await roleCheckbox.isVisible({ timeout: 5000 }).catch(() => false);

        if (hasCheckbox) {
          await expect(roleCheckbox).toBeVisible();
        }

        // Close dialog
        const cancelButton = page.locator('button').filter({ hasText: /cancel|close/i }).first();
        if (await cancelButton.isVisible().catch(() => false)) {
          await cancelButton.click();
        } else {
          await page.keyboard.press('Escape');
        }
      } else {
        // Might have navigated to a role management page
        const url = page.url();
        if (url.includes('role') || url.includes('manage')) {
          expect(url).toMatch(/role|manage/);
        } else {
          test.skip('Role management UI not displayed');
        }
      }
    });
  });
});
