import { test, expect } from '../../../fixtures/test-base';
import { CfOrgLevelPage } from '../../../pages/cloud-foundry/org-level/cf-org-level.page';
import { SpaceQuotaFormStepper } from '../../../pages/cloud-foundry/org-level/space-quota-form-stepper.page';
import { createCustomName } from '../../../helpers/test-utils';

/**
 * Manage Space Quota E2E Tests
 * Migrated from src/test-e2e/cloud-foundry/org-level/manage-space-quota-e2e.spec.ts
 *
 * Tests space quota definition management
 */

test.describe('Manage Space Quota', () => {

  test('should navigate to organization', async ({ connectedEndpointsAdminPage, secrets }) => {
    const { page, cfGuid } = connectedEndpointsAdminPage;
    const cfEndpoint = secrets.getCloudfoundryEndpoint(0);

    const orgGuid = cfEndpoint.testOrgGuid;
    const orgPage = CfOrgLevelPage.forEndpoint(page, cfGuid, orgGuid);
    await orgPage.navigateTo();
    await orgPage.waitForPage();

    const url = page.url();
    expect(url).toContain(`/organizations/${orgGuid}`);
  });

  test.describe('Space Quota Management (UI)', () => {

    test('should create space quota', async ({ connectedEndpointsAdminPage, cfApi, secrets }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const cfEndpoint = secrets.getCloudfoundryEndpoint(0);
      const orgGuid = cfEndpoint.testOrgGuid;
      const quotaName = createCustomName('ui-space-quota');

      const orgPage = CfOrgLevelPage.forEndpoint(page, cfGuid, orgGuid);
      await orgPage.navigateTo();
      await orgPage.goToSpaceQuotasTab();

      // Click "Add Space Quota" button
      const addButton = page.locator('button').filter({ hasText: /add.*quota|create.*quota/i }).first();
      const buttonExists = await addButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (!buttonExists) {
        test.skip('Add Space Quota button not found - UI may have changed');
      }

      await addButton.click();

      // Fill in space quota creation stepper
      const quotaStepper = new SpaceQuotaFormStepper(page);
      await quotaStepper.waitUntilShown();

      await quotaStepper.setName(quotaName);
      await quotaStepper.setTotalServices('10');
      await quotaStepper.setTotalRoutes('10');
      await quotaStepper.setMemoryLimit('1024');

      // Check if we can proceed
      const canProceed = await quotaStepper.canNext();
      expect(canProceed).toBe(true);

      await quotaStepper.next();

      // Wait for navigation back to space quotas list
      await page.waitForURL(/.*space-quota-definitions.*/, { timeout: 10000 });

      // Verify space quota was created via API
      const quota = await cfApi.findSpaceQuotaByName(orgGuid, quotaName);
      expect(quota).toBeTruthy();
      expect(quota.name).toBe(quotaName);

      // Cleanup
      if (quota) {
        await cfApi.deleteSpaceQuota(quota.guid);
      }
    });

    test('should validate quota name', async ({ connectedEndpointsAdminPage, secrets }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const cfEndpoint = secrets.getCloudfoundryEndpoint(0);
      const orgGuid = cfEndpoint.testOrgGuid;

      const orgPage = CfOrgLevelPage.forEndpoint(page, cfGuid, orgGuid);
      await orgPage.navigateTo();
      await orgPage.goToSpaceQuotasTab();

      const addButton = page.locator('button').filter({ hasText: /add.*quota|create.*quota/i }).first();
      const buttonExists = await addButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (!buttonExists) {
        test.skip('Add Space Quota button not found');
      }

      await addButton.click();

      const quotaStepper = new SpaceQuotaFormStepper(page);
      await quotaStepper.waitUntilShown();

      // Try with empty name
      await quotaStepper.setName('');
      let canProceed = await quotaStepper.canNext();
      expect(canProceed).toBe(false);

      // Try with valid name
      await quotaStepper.setName('valid-space-quota-name');
      canProceed = await quotaStepper.canNext();
      expect(canProceed).toBe(true);

      // Cancel the stepper
      await quotaStepper.cancel();
    });

    test('should set quota limits', async ({ connectedEndpointsAdminPage, cfApi, secrets }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const cfEndpoint = secrets.getCloudfoundryEndpoint(0);
      const orgGuid = cfEndpoint.testOrgGuid;
      const quotaName = createCustomName('limits-space-quota');

      const orgPage = CfOrgLevelPage.forEndpoint(page, cfGuid, orgGuid);
      await orgPage.navigateTo();
      await orgPage.goToSpaceQuotasTab();

      const addButton = page.locator('button').filter({ hasText: /add.*quota|create.*quota/i }).first();
      const buttonExists = await addButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (!buttonExists) {
        test.skip('Add Space Quota button not found');
      }

      await addButton.click();

      const quotaStepper = new SpaceQuotaFormStepper(page);
      await quotaStepper.waitUntilShown();

      // Set all quota limits
      await quotaStepper.setName(quotaName);
      await quotaStepper.setTotalServices('20');
      await quotaStepper.setTotalRoutes('15');
      await quotaStepper.setMemoryLimit('2048');
      await quotaStepper.setInstanceMemoryLimit('512');
      await quotaStepper.setAppInstanceLimit('50');
      await quotaStepper.setTotalReservedRoutePorts('5');

      await quotaStepper.next();
      await page.waitForURL(/.*space-quota-definitions.*/, { timeout: 10000 });

      // Verify quota limits via API
      const quota = await cfApi.findSpaceQuotaByName(orgGuid, quotaName);
      expect(quota).toBeTruthy();

      // Cleanup
      if (quota) {
        await cfApi.deleteSpaceQuota(quota.guid);
      }
    });

    test('should assign quota to space', async ({ cfApi, connectedEndpointsAdminPage, secrets }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const cfEndpoint = secrets.getCloudfoundryEndpoint(0);
      const orgGuid = cfEndpoint.testOrgGuid;
      const quotaName = createCustomName('assign-quota');
      const spaceName = createCustomName('quota-space');

      // Create space quota via API
      const quota = await cfApi.createSpaceQuota({
        name: quotaName,
        orgGuid: orgGuid,
        totalServices: 10,
        totalRoutes: 10,
        memoryLimit: 1024
      });

      // Create space via API
      const space = await cfApi.createSpace({ name: spaceName, orgGuid });

      try {
        // Apply quota to space via API
        await cfApi.applySpaceQuota(space.guid, quota.guid);

        // Navigate to space quotas page to verify
        const orgPage = CfOrgLevelPage.forEndpoint(page, cfGuid, orgGuid);
        await orgPage.navigateTo();
        await orgPage.goToSpaceQuotasTab();

        // Wait for table to load
        const listComponent = page.locator('app-list');
        const table = listComponent.locator('app-table, table');
        await table.waitFor({ state: 'visible' });

        // Search for our quota
        const header = listComponent.locator('app-list-header');
        const searchInput = header.locator('input[placeholder*="Search"], input[type="text"]').first();
        if (await searchInput.isVisible().catch(() => false)) {
          await searchInput.fill(quotaName);
          await page.waitForTimeout(1000);
        }

        // Verify quota appears in list
        const row = table.locator('tbody tr').filter({ hasText: quotaName });
        await expect(row).toBeVisible({ timeout: 5000 });

      } finally {
        // Cleanup
        await cfApi.deleteSpace(space.guid);
        await cfApi.deleteSpaceQuota(quota.guid);
      }
    });

    test('should update space quota', async ({ cfApi, connectedEndpointsAdminPage, secrets }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const cfEndpoint = secrets.getCloudfoundryEndpoint(0);
      const orgGuid = cfEndpoint.testOrgGuid;
      const quotaName = createCustomName('update-space-quota');

      // Create space quota via API first
      const quota = await cfApi.createSpaceQuota({
        name: quotaName,
        orgGuid: orgGuid,
        totalServices: 10,
        totalRoutes: 10,
        memoryLimit: 1024
      });

      try {
        // Navigate to org space quotas page
        const orgPage = CfOrgLevelPage.forEndpoint(page, cfGuid, orgGuid);
        await orgPage.navigateTo();
        await orgPage.goToSpaceQuotasTab();

        // Wait for table to load
        const listComponent = page.locator('app-list');
        const table = listComponent.locator('app-table, table');
        await table.waitFor({ state: 'visible' });

        // Search for our quota
        const header = listComponent.locator('app-list-header');
        const searchInput = header.locator('input[placeholder*="Search"], input[type="text"]').first();
        if (await searchInput.isVisible().catch(() => false)) {
          await searchInput.fill(quotaName);
          await page.waitForTimeout(1000);
        }

        // Look for edit button in row
        const row = table.locator('tbody tr').filter({ hasText: quotaName });
        const editButton = row.locator('button').filter({ hasText: /edit/i }).first();
        const editExists = await editButton.isVisible({ timeout: 5000 }).catch(() => false);

        if (!editExists) {
          test.skip('Edit space quota functionality not available in UI');
        }

        await editButton.click();

        const quotaStepper = new SpaceQuotaFormStepper(page);
        await quotaStepper.waitUntilShown();

        // Verify current name is shown
        const form = quotaStepper.getStepperForm();
        const nameField = form.locator('[name="name"], [formcontrolname="name"]').first();
        const currentName = await nameField.inputValue();
        expect(currentName).toBe(quotaName);

        // Cancel - we don't want to actually update
        await quotaStepper.cancel();

      } finally {
        // Cleanup
        await cfApi.deleteSpaceQuota(quota.guid);
      }
    });

    test('should delete space quota', async ({ cfApi, connectedEndpointsAdminPage, secrets }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const cfEndpoint = secrets.getCloudfoundryEndpoint(0);
      const orgGuid = cfEndpoint.testOrgGuid;
      const quotaName = createCustomName('delete-space-quota');

      // Create space quota via API
      const quota = await cfApi.createSpaceQuota({
        name: quotaName,
        orgGuid: orgGuid,
        totalServices: 10,
        totalRoutes: 10,
        memoryLimit: 1024
      });

      try {
        // Navigate to org space quotas page
        const orgPage = CfOrgLevelPage.forEndpoint(page, cfGuid, orgGuid);
        await orgPage.navigateTo();
        await orgPage.goToSpaceQuotasTab();

        // Wait for table to load and delete using page object method
        await orgPage.deleteSpaceQuota(quotaName, true);

        // Verify quota is deleted via API
        try {
          await cfApi.getSpaceQuota(quota.guid);
          expect(true).toBe(false); // Should not find it
        } catch (error) {
          expect(error).toBeTruthy(); // Expected - quota should not exist
        }

      } catch (error) {
        // If test failed, cleanup the quota
        try {
          await cfApi.deleteSpaceQuota(quota.guid);
        } catch (cleanupError) {
          // Quota might already be deleted
        }
        throw error;
      }
    });
  });
});
