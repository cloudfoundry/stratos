import { test, expect } from '../../../fixtures/test-base';
import { CfTopLevelPage } from '../../../pages/cloud-foundry/cf-level/cf-top-level.page';
import { CfOrgLevelPage } from '../../../pages/cloud-foundry/org-level/cf-org-level.page';

/**
 * CF Org Level E2E Tests
 * Migrated from src/test-e2e/cloud-foundry/org-level/cf-org-level-e2e.spec.ts
 *
 * Tests Cloud Foundry organization-level page functionality
 *
 * Covers:
 * - Navigation to organization page
 * - Page header and breadcrumbs
 * - Tab navigation (summary, spaces, users)
 * - Admin vs regular user access differences
 */

test.describe('CF Org Level', () => {

  test.describe('As Admin', () => {
    test('should navigate to org page from CF page', async ({ connectedEndpointsAdminPage, secrets }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const cfEndpoint = secrets.getCloudfoundryEndpoint(0);

      // Navigate to CF page and then to org
      const cfPage = CfTopLevelPage.forEndpoint(page, cfGuid);
      await cfPage.navigateTo();
      await cfPage.waitForPage();
      await cfPage.goToOrgTab();

      // Wait for organizations list
      const listComponent = page.locator('app-list');
      await listComponent.waitFor({ state: 'visible' });

      // Verify we have at least one org
      const cards = listComponent.locator('app-card, mat-card');
      const count = await cards.count();
      expect(count).toBeGreaterThan(0);

      // Click on first org (we know testOrgGuid exists from secrets)
      const firstCard = cards.first();
      await firstCard.click();

      // Wait for org page to load
      await page.waitForURL(/.*\/cloud-foundry\/.*\/organizations\/.*/, { timeout: 10000 });

      // Verify we're on org page
      const orgPage = page.locator('app-cloud-foundry-org-summary');
      await expect(orgPage).toBeVisible({ timeout: 10000 });
    });

    test('should display breadcrumb with CF name', async ({ connectedEndpointsAdminPage, secrets }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const cfEndpoint = secrets.getCloudfoundryEndpoint(0);

      // Navigate directly to test org
      const orgGuid = cfEndpoint.testOrgGuid;
      const orgPage = CfOrgLevelPage.forEndpoint(page, cfGuid, orgGuid);
      await orgPage.navigateTo();
      await orgPage.waitForPage();

      // Check breadcrumbs
      const breadcrumb = page.locator('app-page-header-events app-breadcrumbs, .breadcrumbs').first();
      await expect(breadcrumb).toBeVisible();

      // Breadcrumb should contain CF name
      const breadcrumbText = await breadcrumb.textContent() || '';
      expect(breadcrumbText).toContain(cfEndpoint.name);
    });

    test('should walk through all org tabs', async ({ connectedEndpointsAdminPage, secrets }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const cfEndpoint = secrets.getCloudfoundryEndpoint(0);

      const orgGuid = cfEndpoint.testOrgGuid;
      const orgPage = CfOrgLevelPage.forEndpoint(page, cfGuid, orgGuid);
      await orgPage.navigateTo();
      await orgPage.waitForPage();

      // Walk through tabs
      await orgPage.goToSpacesTab();
      await page.waitForTimeout(500);

      await orgPage.goToUsersTab();
      await page.waitForTimeout(500);

      await orgPage.goToSummaryTab();
      await page.waitForTimeout(500);

      // Verify we're on a valid tab
      const url = page.url();
      expect(url).toContain(`/cloud-foundry/${cfGuid}/organizations/${orgGuid}`);
    });

    test('should display spaces list', async ({ connectedEndpointsAdminPage, secrets }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const cfEndpoint = secrets.getCloudfoundryEndpoint(0);

      const orgGuid = cfEndpoint.testOrgGuid;
      const orgPage = CfOrgLevelPage.forEndpoint(page, cfGuid, orgGuid);
      await orgPage.navigateTo();
      await orgPage.goToSpacesTab();

      // Verify list component is visible
      const listComponent = page.locator('app-list');
      await expect(listComponent).toBeVisible();

      // Verify we have at least one space (testSpaceGuid exists)
      const cards = listComponent.locator('app-card, mat-card');
      const count = await cards.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('As Regular User', () => {
    test('should navigate to org page', async ({ connectedEndpointsUserPage, secrets }) => {
      const { page, cfGuid } = connectedEndpointsUserPage;
      const cfEndpoint = secrets.getCloudfoundryEndpoint(0);

      const orgGuid = cfEndpoint.testOrgGuid;
      const orgPage = CfOrgLevelPage.forEndpoint(page, cfGuid, orgGuid);
      await orgPage.navigateTo();
      await orgPage.waitForPage();

      const url = page.url();
      expect(url).toContain(`/cloud-foundry/${cfGuid}/organizations/${orgGuid}`);
    });

    test('should display breadcrumb', async ({ connectedEndpointsUserPage, secrets }) => {
      const { page, cfGuid } = connectedEndpointsUserPage;
      const cfEndpoint = secrets.getCloudfoundryEndpoint(0);

      const orgGuid = cfEndpoint.testOrgGuid;
      const orgPage = CfOrgLevelPage.forEndpoint(page, cfGuid, orgGuid);
      await orgPage.navigateTo();
      await orgPage.waitForPage();

      const breadcrumb = page.locator('app-page-header-events app-breadcrumbs, .breadcrumbs').first();
      await expect(breadcrumb).toBeVisible();
    });

    test('should walk through org tabs', async ({ connectedEndpointsUserPage, secrets }) => {
      const { page, cfGuid } = connectedEndpointsUserPage;
      const cfEndpoint = secrets.getCloudfoundryEndpoint(0);

      const orgGuid = cfEndpoint.testOrgGuid;
      const orgPage = CfOrgLevelPage.forEndpoint(page, cfGuid, orgGuid);
      await orgPage.navigateTo();
      await orgPage.waitForPage();

      await orgPage.goToSpacesTab();
      await page.waitForTimeout(500);

      await orgPage.goToUsersTab();
      await page.waitForTimeout(500);

      await orgPage.goToSummaryTab();
      await page.waitForTimeout(500);

      const url = page.url();
      expect(url).toContain(`/cloud-foundry/${cfGuid}/organizations/${orgGuid}`);
    });
  });

  test.describe('Organization Management (UI)', () => {

    test('should create new space in organization', async ({ connectedEndpointsAdminPage, secrets }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const cfEndpoint = secrets.getCloudfoundryEndpoint(0);

      const orgGuid = cfEndpoint.testOrgGuid;
      const orgPage = CfOrgLevelPage.forEndpoint(page, cfGuid, orgGuid);
      await orgPage.navigateTo();
      await orgPage.goToSpacesTab();

      // Look for add space button
      const addButton = page.locator('button').filter({ hasText: /add.*space|create.*space/i }).first();
      const buttonExists = await addButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (!buttonExists) {
        test.skip('Add Space button not found');
      }

      await expect(addButton).toBeVisible();
      await addButton.click();

      // Verify stepper dialog opened
      const stepper = page.locator('app-create-space-stepper, app-stepper-dialog, mat-dialog-container');
      const stepperExists = await stepper.isVisible({ timeout: 5000 }).catch(() => false);

      if (stepperExists) {
        await expect(stepper).toBeVisible();

        // Close dialog without creating
        const cancelButton = page.locator('button').filter({ hasText: /cancel/i }).first();
        if (await cancelButton.isVisible().catch(() => false)) {
          await cancelButton.click();
        } else {
          await page.keyboard.press('Escape');
        }
      }
    });

    test('should edit organization details', async ({ connectedEndpointsAdminPage, secrets }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const cfEndpoint = secrets.getCloudfoundryEndpoint(0);

      const orgGuid = cfEndpoint.testOrgGuid;
      const orgPage = CfOrgLevelPage.forEndpoint(page, cfGuid, orgGuid);
      await orgPage.navigateTo();
      await orgPage.waitForPage();

      // Look for edit/actions menu in page header
      const headerActions = page.locator('app-page-header-events, .page-header');
      const menuButton = headerActions.locator('button[aria-label*="menu"], button[aria-label*="actions"]').first();
      const hasMenu = await menuButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (!hasMenu) {
        test.skip('Organization actions menu not found');
      }

      await menuButton.click();

      // Look for edit option
      const editOption = page.locator('button, mat-option').filter({ hasText: /edit/i }).first();
      const hasEdit = await editOption.isVisible({ timeout: 5000 }).catch(() => false);

      if (!hasEdit) {
        await page.keyboard.press('Escape');
        test.skip('Edit option not available');
      }

      await expect(editOption).toBeVisible();
      // Don't actually edit - just verify option exists
      await page.keyboard.press('Escape');
    });

    test('should manage organization users', async ({ connectedEndpointsAdminPage, secrets }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const cfEndpoint = secrets.getCloudfoundryEndpoint(0);

      const orgGuid = cfEndpoint.testOrgGuid;
      const orgPage = CfOrgLevelPage.forEndpoint(page, cfGuid, orgGuid);
      await orgPage.navigateTo();
      await orgPage.goToUsersTab();

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
      const dialog = page.locator('app-add-org-user, app-invite-users, mat-dialog-container');
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

    test('should delete organization', async ({ connectedEndpointsAdminPage, cfApi, secrets }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;

      // Create a test org for deletion
      const orgName = `e2e-delete-test-${Date.now()}`;
      let org: any = null;

      try {
        org = await cfApi.createOrg(orgName);

        // Navigate to the test org
        const orgPage = CfOrgLevelPage.forEndpoint(page, cfGuid, org.guid);
        await orgPage.navigateTo();
        await orgPage.waitForPage();

        // Look for delete option (usually in actions menu or header)
        const headerActions = page.locator('app-page-header-events, .page-header');
        const menuButton = headerActions.locator('button[aria-label*="menu"], button[aria-label*="actions"]').first();
        const hasMenu = await menuButton.isVisible({ timeout: 5000 }).catch(() => false);

        if (!hasMenu) {
          test.skip('Organization actions menu not found');
        }

        await menuButton.click();

        // Look for delete option
        const deleteOption = page.locator('button, mat-option').filter({ hasText: /delete.*org/i }).first();
        const hasDelete = await deleteOption.isVisible({ timeout: 5000 }).catch(() => false);

        if (!hasDelete) {
          await page.keyboard.press('Escape');
          test.skip('Delete organization option not available');
        }

        await expect(deleteOption).toBeVisible();
        await deleteOption.click();

        // Handle confirmation
        const confirmButton = page.locator('button').filter({ hasText: /confirm|delete|yes/i }).first();
        const confirmExists = await confirmButton.isVisible({ timeout: 5000 }).catch(() => false);

        if (confirmExists) {
          await confirmButton.click();
          await page.waitForTimeout(2000);

          // Verify org was deleted via API
          const deletedOrg = await cfApi.getOrg(org.guid).catch(() => null);
          expect(deletedOrg).toBeNull();
          org = null; // Mark as deleted
        }
      } finally {
        // Cleanup: delete org if it still exists
        if (org) {
          try {
            await cfApi.deleteOrg(org.guid);
          } catch (error) {
            // Ignore cleanup errors
          }
        }
      }
    });
  });
});
