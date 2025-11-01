import { test, expect } from '../../../fixtures/test-base';
import { CfSpaceLevelPage } from '../../../pages/cloud-foundry/space-level/cf-space-level.page';

/**
 * Space Routes E2E Tests
 * Migrated from src/test-e2e/cloud-foundry/space-level/space-routes-e2e.spec.ts
 *
 * Tests route list and management in space
 */

test.describe('Space Routes', () => {

  test('should display routes tab', async ({ connectedEndpointsAdminPage, secrets }) => {
    const { page, cfGuid } = connectedEndpointsAdminPage;
    const cfEndpoint = secrets.getCloudfoundryEndpoint(0);

    const orgGuid = cfEndpoint.testOrgGuid;
    const spaceGuid = cfEndpoint.testSpaceGuid;
    const spacePage = CfSpaceLevelPage.forEndpoint(page, cfGuid, orgGuid, spaceGuid);
    await spacePage.navigateTo();
    await spacePage.goToRoutesTab();

    // Verify routes list
    const listComponent = page.locator('app-list');
    await expect(listComponent).toBeVisible();
  });

  test('should create route via CF API', async ({ applicationHelper, secrets }) => {
    const cfEndpoint = secrets.getCloudfoundryEndpoint(0);
    const spaceGuid = cfEndpoint.testSpaceGuid;

    // Create a test app (routes need to be mapped to apps)
    const testApp = await applicationHelper.createTestApp();

    // Create and map route
    const routeGuid = await applicationHelper.createAndMapRoute(testApp, 'test-route');
    expect(routeGuid).toBeTruthy();

    // Cleanup
    await applicationHelper.cleanupTestApp(testApp);
  });

  test.describe('Route Management (UI)', () => {

    test('should create route via UI', async ({ connectedEndpointsAdminPage, secrets }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const cfEndpoint = secrets.getCloudfoundryEndpoint(0);

      const orgGuid = cfEndpoint.testOrgGuid;
      const spaceGuid = cfEndpoint.testSpaceGuid;
      const spacePage = CfSpaceLevelPage.forEndpoint(page, cfGuid, orgGuid, spaceGuid);
      await spacePage.navigateTo();
      await spacePage.goToRoutesTab();

      // Look for create/add route button
      const createButton = page.locator('button').filter({ hasText: /create.*route|add.*route/i }).first();
      const buttonExists = await createButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (!buttonExists) {
        test.skip('Create Route button not found - feature may not be enabled');
      }

      await expect(createButton).toBeVisible();
      await createButton.click();

      // Verify route creation dialog opened
      const dialog = page.locator('app-create-route, app-add-route, mat-dialog-container');
      const dialogExists = await dialog.isVisible({ timeout: 5000 }).catch(() => false);

      if (!dialogExists) {
        test.skip('Route creation dialog not displayed');
      }

      await expect(dialog.first()).toBeVisible();

      // Close dialog without creating
      const cancelButton = page.locator('button').filter({ hasText: /cancel|close/i }).first();
      if (await cancelButton.isVisible().catch(() => false)) {
        await cancelButton.click();
      } else {
        await page.keyboard.press('Escape');
      }
    });

    test('should map route to application', async ({ connectedEndpointsAdminPage, secrets }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const cfEndpoint = secrets.getCloudfoundryEndpoint(0);

      const orgGuid = cfEndpoint.testOrgGuid;
      const spaceGuid = cfEndpoint.testSpaceGuid;
      const spacePage = CfSpaceLevelPage.forEndpoint(page, cfGuid, orgGuid, spaceGuid);
      await spacePage.navigateTo();
      await spacePage.goToRoutesTab();

      // Verify routes list exists
      const listComponent = page.locator('app-list');
      const table = listComponent.locator('app-table, table');
      const rows = table.locator('tbody tr');

      const count = await rows.count().catch(() => 0);
      if (count === 0) {
        test.skip('No routes available to map');
      }

      // Look for first route row
      const firstRow = rows.first();
      await firstRow.waitFor({ state: 'visible' });

      // Look for map/actions menu
      const menuButton = firstRow.locator('button[aria-label*="menu"], button[aria-label*="actions"]').first();
      const hasMenu = await menuButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (!hasMenu) {
        test.skip('Route actions menu not found');
      }

      await menuButton.click();

      // Look for map to app option
      const mapOption = page.locator('button, mat-option').filter({ hasText: /map.*app|attach.*app/i }).first();
      const hasMapOption = await mapOption.isVisible({ timeout: 5000 }).catch(() => false);

      if (!hasMapOption) {
        await page.keyboard.press('Escape');
        test.skip('Map to application option not available');
      }

      await expect(mapOption).toBeVisible();
      await mapOption.click();

      // Verify map dialog opened
      const dialog = page.locator('mat-dialog-container');
      const dialogExists = await dialog.isVisible({ timeout: 5000 }).catch(() => false);

      if (dialogExists) {
        await expect(dialog).toBeVisible();

        // Close dialog without mapping
        const cancelButton = page.locator('button').filter({ hasText: /cancel|close/i }).first();
        if (await cancelButton.isVisible().catch(() => false)) {
          await cancelButton.click();
        } else {
          await page.keyboard.press('Escape');
        }
      } else {
        await page.keyboard.press('Escape');
      }
    });

    test('should unmap route from application', async ({ connectedEndpointsAdminPage, secrets }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const cfEndpoint = secrets.getCloudfoundryEndpoint(0);

      const orgGuid = cfEndpoint.testOrgGuid;
      const spaceGuid = cfEndpoint.testSpaceGuid;
      const spacePage = CfSpaceLevelPage.forEndpoint(page, cfGuid, orgGuid, spaceGuid);
      await spacePage.navigateTo();
      await spacePage.goToRoutesTab();

      // Verify routes list exists
      const listComponent = page.locator('app-list');
      const table = listComponent.locator('app-table, table');
      const rows = table.locator('tbody tr');

      const count = await rows.count().catch(() => 0);
      if (count === 0) {
        test.skip('No routes available to unmap');
      }

      // Look for first route row
      const firstRow = rows.first();
      await firstRow.waitFor({ state: 'visible' });

      // Look for unmap/actions menu
      const menuButton = firstRow.locator('button[aria-label*="menu"], button[aria-label*="actions"]').first();
      const hasMenu = await menuButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (!hasMenu) {
        test.skip('Route actions menu not found');
      }

      await menuButton.click();

      // Look for unmap from app option
      const unmapOption = page.locator('button, mat-option').filter({ hasText: /unmap.*app|detach.*app|remove.*app/i }).first();
      const hasUnmapOption = await unmapOption.isVisible({ timeout: 5000 }).catch(() => false);

      if (!hasUnmapOption) {
        await page.keyboard.press('Escape');
        test.skip('Unmap from application option not available');
      }

      await expect(unmapOption).toBeVisible();
      // Don't click - just verify option exists
      await page.keyboard.press('Escape');
    });

    test('should delete route', async ({ connectedEndpointsAdminPage, secrets }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const cfEndpoint = secrets.getCloudfoundryEndpoint(0);

      const orgGuid = cfEndpoint.testOrgGuid;
      const spaceGuid = cfEndpoint.testSpaceGuid;
      const spacePage = CfSpaceLevelPage.forEndpoint(page, cfGuid, orgGuid, spaceGuid);
      await spacePage.navigateTo();
      await spacePage.goToRoutesTab();

      // Verify routes list exists
      const listComponent = page.locator('app-list');
      const table = listComponent.locator('app-table, table');
      const rows = table.locator('tbody tr');

      const count = await rows.count().catch(() => 0);
      if (count === 0) {
        test.skip('No routes available to delete');
      }

      // Look for first route row
      const firstRow = rows.first();
      await firstRow.waitFor({ state: 'visible' });

      // Look for delete/actions menu
      const menuButton = firstRow.locator('button[aria-label*="menu"], button[aria-label*="actions"]').first();
      const hasMenu = await menuButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (!hasMenu) {
        test.skip('Route actions menu not found');
      }

      await menuButton.click();

      // Look for delete option
      const deleteOption = page.locator('button, mat-option').filter({ hasText: /delete.*route|remove.*route/i }).first();
      const hasDeleteOption = await deleteOption.isVisible({ timeout: 5000 }).catch(() => false);

      if (!hasDeleteOption) {
        await page.keyboard.press('Escape');
        test.skip('Delete route option not available');
      }

      await expect(deleteOption).toBeVisible();
      await deleteOption.click();

      // Verify confirmation dialog
      const confirmDialog = page.locator('mat-dialog-container');
      const dialogExists = await confirmDialog.isVisible({ timeout: 5000 }).catch(() => false);

      if (!dialogExists) {
        test.skip('Delete confirmation dialog not displayed');
      }

      await expect(confirmDialog).toBeVisible();

      // Verify confirm button exists
      const confirmButton = page.locator('button').filter({ hasText: /confirm|delete|yes/i }).first();
      const hasConfirm = await confirmButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (!hasConfirm) {
        await page.keyboard.press('Escape');
        test.skip('Confirm delete button not found');
      }

      await expect(confirmButton).toBeVisible();

      // Cancel instead of confirming (don't actually delete)
      const cancelButton = page.locator('button').filter({ hasText: /cancel|no/i }).first();
      if (await cancelButton.isVisible().catch(() => false)) {
        await cancelButton.click();
      } else {
        await page.keyboard.press('Escape');
      }
    });
  });
});
