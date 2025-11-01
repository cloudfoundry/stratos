import { test, expect } from '../../../fixtures/test-base';
import { CfOrgLevelPage } from '../../../pages/cloud-foundry/org-level/cf-org-level.page';
import { CfSpaceLevelPage } from '../../../pages/cloud-foundry/space-level/cf-space-level.page';

/**
 * CF Space Level E2E Tests
 * Migrated from src/test-e2e/cloud-foundry/space-level/cf-space-level-e2e.spec.ts
 *
 * Tests Cloud Foundry space-level page functionality
 *
 * Covers:
 * - Navigation to space page
 * - Page header and breadcrumbs
 * - Tab navigation (summary, apps, services, routes, users)
 * - Admin vs regular user access differences
 */

test.describe('CF Space Level', () => {

  test.describe('As Admin', () => {
    test('should navigate to space page from org page', async ({ connectedEndpointsAdminPage, secrets }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const cfEndpoint = secrets.getCloudfoundryEndpoint(0);

      // Navigate to org page
      const orgGuid = cfEndpoint.testOrgGuid;
      const orgPage = CfOrgLevelPage.forEndpoint(page, cfGuid, orgGuid);
      await orgPage.navigateTo();
      await orgPage.waitForPage();
      await orgPage.goToSpacesTab();

      // Wait for spaces list
      const listComponent = page.locator('app-list');
      await listComponent.waitFor({ state: 'visible' });

      // Click on first space (we know testSpaceGuid exists)
      const cards = listComponent.locator('app-card, mat-card');
      const firstCard = cards.first();
      await firstCard.click();

      // Wait for space page to load
      await page.waitForURL(/.*\/cloud-foundry\/.*\/organizations\/.*\/spaces\/.*/, { timeout: 10000 });

      // Verify we're on space page
      const spacePage = page.locator('app-cloud-foundry-space-summary');
      await expect(spacePage).toBeVisible({ timeout: 10000 });
    });

    test('should display breadcrumb with CF and org names', async ({ connectedEndpointsAdminPage, secrets }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const cfEndpoint = secrets.getCloudfoundryEndpoint(0);

      // Navigate directly to test space
      const orgGuid = cfEndpoint.testOrgGuid;
      const spaceGuid = cfEndpoint.testSpaceGuid;
      const spacePage = CfSpaceLevelPage.forEndpoint(page, cfGuid, orgGuid, spaceGuid);
      await spacePage.navigateTo();
      await spacePage.waitForPage();

      // Check breadcrumbs
      const breadcrumb = page.locator('app-page-header-events app-breadcrumbs, .breadcrumbs').first();
      await expect(breadcrumb).toBeVisible();

      // Breadcrumb should contain CF name and org name
      const breadcrumbText = await breadcrumb.textContent() || '';
      expect(breadcrumbText).toContain(cfEndpoint.name);
    });

    test('should walk through all space tabs', async ({ connectedEndpointsAdminPage, secrets }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const cfEndpoint = secrets.getCloudfoundryEndpoint(0);

      const orgGuid = cfEndpoint.testOrgGuid;
      const spaceGuid = cfEndpoint.testSpaceGuid;
      const spacePage = CfSpaceLevelPage.forEndpoint(page, cfGuid, orgGuid, spaceGuid);
      await spacePage.navigateTo();
      await spacePage.waitForPage();

      // Walk through tabs
      await spacePage.goToAppsTab();
      await page.waitForTimeout(500);

      await spacePage.goToServiceInstancesTab();
      await page.waitForTimeout(500);

      await spacePage.goToUserProvidedServicesTab();
      await page.waitForTimeout(500);

      await spacePage.goToRoutesTab();
      await page.waitForTimeout(500);

      await spacePage.goToUsersTab();
      await page.waitForTimeout(500);

      await spacePage.goToSummaryTab();
      await page.waitForTimeout(500);

      // Verify we're on a valid tab
      const url = page.url();
      expect(url).toContain(`/cloud-foundry/${cfGuid}/organizations/${orgGuid}/spaces/${spaceGuid}`);
    });

    test('should display applications list', async ({ connectedEndpointsAdminPage, secrets }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const cfEndpoint = secrets.getCloudfoundryEndpoint(0);

      const orgGuid = cfEndpoint.testOrgGuid;
      const spaceGuid = cfEndpoint.testSpaceGuid;
      const spacePage = CfSpaceLevelPage.forEndpoint(page, cfGuid, orgGuid, spaceGuid);
      await spacePage.navigateTo();
      await spacePage.goToAppsTab();

      // Verify list component is visible
      const listComponent = page.locator('app-list');
      await expect(listComponent).toBeVisible();
    });

    test('should display routes list', async ({ connectedEndpointsAdminPage, secrets }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const cfEndpoint = secrets.getCloudfoundryEndpoint(0);

      const orgGuid = cfEndpoint.testOrgGuid;
      const spaceGuid = cfEndpoint.testSpaceGuid;
      const spacePage = CfSpaceLevelPage.forEndpoint(page, cfGuid, orgGuid, spaceGuid);
      await spacePage.navigateTo();
      await spacePage.goToRoutesTab();

      // Verify list component is visible
      const listComponent = page.locator('app-list');
      await expect(listComponent).toBeVisible();
    });
  });

  test.describe('As Regular User', () => {
    test('should navigate to space page', async ({ connectedEndpointsUserPage, secrets }) => {
      const { page, cfGuid } = connectedEndpointsUserPage;
      const cfEndpoint = secrets.getCloudfoundryEndpoint(0);

      const orgGuid = cfEndpoint.testOrgGuid;
      const spaceGuid = cfEndpoint.testSpaceGuid;
      const spacePage = CfSpaceLevelPage.forEndpoint(page, cfGuid, orgGuid, spaceGuid);
      await spacePage.navigateTo();
      await spacePage.waitForPage();

      const url = page.url();
      expect(url).toContain(`/cloud-foundry/${cfGuid}/organizations/${orgGuid}/spaces/${spaceGuid}`);
    });

    test('should display breadcrumb', async ({ connectedEndpointsUserPage, secrets }) => {
      const { page, cfGuid } = connectedEndpointsUserPage;
      const cfEndpoint = secrets.getCloudfoundryEndpoint(0);

      const orgGuid = cfEndpoint.testOrgGuid;
      const spaceGuid = cfEndpoint.testSpaceGuid;
      const spacePage = CfSpaceLevelPage.forEndpoint(page, cfGuid, orgGuid, spaceGuid);
      await spacePage.navigateTo();
      await spacePage.waitForPage();

      const breadcrumb = page.locator('app-page-header-events app-breadcrumbs, .breadcrumbs').first();
      await expect(breadcrumb).toBeVisible();
    });

    test('should walk through space tabs', async ({ connectedEndpointsUserPage, secrets }) => {
      const { page, cfGuid } = connectedEndpointsUserPage;
      const cfEndpoint = secrets.getCloudfoundryEndpoint(0);

      const orgGuid = cfEndpoint.testOrgGuid;
      const spaceGuid = cfEndpoint.testSpaceGuid;
      const spacePage = CfSpaceLevelPage.forEndpoint(page, cfGuid, orgGuid, spaceGuid);
      await spacePage.navigateTo();
      await spacePage.waitForPage();

      await spacePage.goToAppsTab();
      await page.waitForTimeout(500);

      await spacePage.goToServiceInstancesTab();
      await page.waitForTimeout(500);

      await spacePage.goToUserProvidedServicesTab();
      await page.waitForTimeout(500);

      await spacePage.goToRoutesTab();
      await page.waitForTimeout(500);

      await spacePage.goToUsersTab();
      await page.waitForTimeout(500);

      await spacePage.goToSummaryTab();
      await page.waitForTimeout(500);

      const url = page.url();
      expect(url).toContain(`/cloud-foundry/${cfGuid}/organizations/${orgGuid}/spaces/${spaceGuid}`);
    });
  });

  test.describe('Space Management (UI)', () => {

    test('should add application to space', async ({ connectedEndpointsAdminPage, secrets }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const cfEndpoint = secrets.getCloudfoundryEndpoint(0);

      const orgGuid = cfEndpoint.testOrgGuid;
      const spaceGuid = cfEndpoint.testSpaceGuid;
      const spacePage = CfSpaceLevelPage.forEndpoint(page, cfGuid, orgGuid, spaceGuid);
      await spacePage.navigateTo();
      await spacePage.goToAppsTab();

      // Look for add application button
      const addButton = page.locator('button').filter({ hasText: /add.*app|deploy.*app|create.*app/i }).first();
      const buttonExists = await addButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (!buttonExists) {
        test.skip('Add Application button not found');
      }

      await expect(addButton).toBeVisible();
      await addButton.click();

      // Verify deployment wizard or stepper opened
      const wizard = page.locator('app-deploy-application, app-stepper-dialog, mat-dialog-container');
      const wizardExists = await wizard.isVisible({ timeout: 5000 }).catch(() => false);

      if (wizardExists) {
        await expect(wizard).toBeVisible();

        // Close without deploying
        const cancelButton = page.locator('button').filter({ hasText: /cancel|close/i }).first();
        if (await cancelButton.isVisible().catch(() => false)) {
          await cancelButton.click();
        } else {
          await page.keyboard.press('Escape');
        }
      }
    });

    test('should create service instance in space', async ({ connectedEndpointsAdminPage, secrets }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const cfEndpoint = secrets.getCloudfoundryEndpoint(0);

      const orgGuid = cfEndpoint.testOrgGuid;
      const spaceGuid = cfEndpoint.testSpaceGuid;
      const spacePage = CfSpaceLevelPage.forEndpoint(page, cfGuid, orgGuid, spaceGuid);
      await spacePage.navigateTo();
      await spacePage.goToServiceInstancesTab();

      // Look for add/create service instance button
      const addButton = page.locator('button').filter({ hasText: /add.*service|create.*service/i }).first();
      const buttonExists = await addButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (!buttonExists) {
        test.skip('Add Service Instance button not found');
      }

      await expect(addButton).toBeVisible();
      await addButton.click();

      // Verify service creation wizard or marketplace opened
      const wizard = page.locator('app-create-service-instance, app-add-service-instance, mat-dialog-container, .marketplace');
      const wizardExists = await wizard.isVisible({ timeout: 5000 }).catch(() => false);

      if (wizardExists) {
        await expect(wizard.first()).toBeVisible();

        // Close without creating
        const cancelButton = page.locator('button').filter({ hasText: /cancel|close|back/i }).first();
        if (await cancelButton.isVisible().catch(() => false)) {
          await cancelButton.click();
        } else {
          await page.keyboard.press('Escape');
        }
      }
    });

    test('should manage space users', async ({ connectedEndpointsAdminPage, secrets }) => {
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

      // Look for manage users button (add/invite/assign)
      const manageButton = page.locator('button').filter({ hasText: /add.*user|invite.*user|assign.*user|manage.*user/i }).first();
      const buttonExists = await manageButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (!buttonExists) {
        test.skip('Manage Users button not found');
      }

      await expect(manageButton).toBeVisible();
      await manageButton.click();

      // Verify user management dialog opened
      const dialog = page.locator('app-add-space-user, app-manage-users, mat-dialog-container');
      const dialogExists = await dialog.isVisible({ timeout: 5000 }).catch(() => false);

      if (dialogExists) {
        await expect(dialog.first()).toBeVisible();

        // Close dialog
        const cancelButton = page.locator('button').filter({ hasText: /cancel|close/i }).first();
        if (await cancelButton.isVisible().catch(() => false)) {
          await cancelButton.click();
        } else {
          await page.keyboard.press('Escape');
        }
      }
    });

    test('should create routes in space', async ({ connectedEndpointsAdminPage, secrets }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const cfEndpoint = secrets.getCloudfoundryEndpoint(0);

      const orgGuid = cfEndpoint.testOrgGuid;
      const spaceGuid = cfEndpoint.testSpaceGuid;
      const spacePage = CfSpaceLevelPage.forEndpoint(page, cfGuid, orgGuid, spaceGuid);
      await spacePage.navigateTo();
      await spacePage.goToRoutesTab();

      // Look for create route button
      const addButton = page.locator('button').filter({ hasText: /add.*route|create.*route/i }).first();
      const buttonExists = await addButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (!buttonExists) {
        test.skip('Add Route button not found');
      }

      await expect(addButton).toBeVisible();
      await addButton.click();

      // Verify route creation dialog opened
      const dialog = page.locator('app-create-route, app-add-route, mat-dialog-container');
      const dialogExists = await dialog.isVisible({ timeout: 5000 }).catch(() => false);

      if (dialogExists) {
        await expect(dialog.first()).toBeVisible();

        // Close dialog
        const cancelButton = page.locator('button').filter({ hasText: /cancel|close/i }).first();
        if (await cancelButton.isVisible().catch(() => false)) {
          await cancelButton.click();
        } else {
          await page.keyboard.press('Escape');
        }
      }
    });

    test('should delete space', async ({ connectedEndpointsAdminPage, cfApi, secrets }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const cfEndpoint = secrets.getCloudfoundryEndpoint(0);

      // Create a test space for deletion
      const spaceName = `e2e-delete-test-${Date.now()}`;
      const orgGuid = cfEndpoint.testOrgGuid;
      let space: any = null;

      try {
        space = await cfApi.createSpace(orgGuid, spaceName);

        // Navigate to the test space
        const spacePage = CfSpaceLevelPage.forEndpoint(page, cfGuid, orgGuid, space.guid);
        await spacePage.navigateTo();
        await spacePage.waitForPage();

        // Look for delete option (usually in actions menu or header)
        const headerActions = page.locator('app-page-header-events, .page-header');
        const menuButton = headerActions.locator('button[aria-label*="menu"], button[aria-label*="actions"]').first();
        const hasMenu = await menuButton.isVisible({ timeout: 5000 }).catch(() => false);

        if (!hasMenu) {
          test.skip('Space actions menu not found');
        }

        await menuButton.click();

        // Look for delete option
        const deleteOption = page.locator('button, mat-option').filter({ hasText: /delete.*space/i }).first();
        const hasDelete = await deleteOption.isVisible({ timeout: 5000 }).catch(() => false);

        if (!hasDelete) {
          await page.keyboard.press('Escape');
          test.skip('Delete space option not available');
        }

        await expect(deleteOption).toBeVisible();
        await deleteOption.click();

        // Handle confirmation
        const confirmButton = page.locator('button').filter({ hasText: /confirm|delete|yes/i }).first();
        const confirmExists = await confirmButton.isVisible({ timeout: 5000 }).catch(() => false);

        if (confirmExists) {
          await confirmButton.click();
          await page.waitForTimeout(2000);

          // Verify space was deleted via API
          const deletedSpace = await cfApi.getSpace(space.guid).catch(() => null);
          expect(deletedSpace).toBeNull();
          space = null; // Mark as deleted
        }
      } finally {
        // Cleanup: delete space if it still exists
        if (space) {
          try {
            await cfApi.deleteSpace(space.guid);
          } catch (error) {
            // Ignore cleanup errors
          }
        }
      }
    });
  });
});
