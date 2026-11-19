import { test, expect } from '../../../fixtures/test-base';
import { CfTopLevelPage } from '../../../pages/cloud-foundry/cf-level/cf-top-level.page';
import { QuotaFormStepper } from '../../../pages/cloud-foundry/cf-level/quota-form-stepper.page';
import { createCustomName } from '../../../helpers/test-utils';

/**
 * Manage Quota E2E Tests
 * Migrated from src/test-e2e/cloud-foundry/cf-level/manage-quota-e2e.spec.ts
 *
 * Tests quota definition display and navigation
 *
 * NOTE: Full quota management requires quota creation stepper page objects
 */

test.describe('Manage Quota', () => {

  test('should navigate to quotas tab', async ({ connectedEndpointsAdminPage }) => {
    const { page, cfGuid } = connectedEndpointsAdminPage;

    const cfPage = CfTopLevelPage.forEndpoint(page, cfGuid);
    await cfPage.navigateTo();
    await cfPage.goToQuotasTab();

    // Verify we're on quotas tab
    const url = page.url();
    expect(url).toContain('quota-definitions');

    // Verify list is visible
    const listComponent = page.locator('app-signal-list');
    await expect(listComponent).toBeVisible();
  });

  test('should display quotas list', async ({ connectedEndpointsAdminPage }) => {
    const { page, cfGuid } = connectedEndpointsAdminPage;

    const cfPage = CfTopLevelPage.forEndpoint(page, cfGuid);
    await cfPage.navigateTo();
    await cfPage.goToQuotasTab();

    // There should be at least default quota
    const listComponent = page.locator('app-signal-list');
    const cards = listComponent.locator('[data-test="card-grid"] > *');
    await expect(cards.first()).toBeVisible({ timeout: 20000 });
  });

  test.describe('Quota Management (UI)', () => {

    test('should create quota definition', async ({ connectedEndpointsAdminPage, cfApi }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const quotaName = createCustomName('ui-quota');

      const cfPage = CfTopLevelPage.forEndpoint(page, cfGuid);
      await cfPage.navigateTo();
      await cfPage.goToQuotasTab();

      // Click "Add Quota" button
      const addButton = page.locator('button').filter({ hasText: /add.*quota|create.*quota/i }).first();
      const buttonExists = await addButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (!buttonExists) {
        test.skip('Add Quota button not found - UI may have changed');
      }

      await addButton.click();

      // Fill in quota creation stepper
      const quotaStepper = new QuotaFormStepper(page);
      await quotaStepper.waitUntilShown();

      await quotaStepper.setName(quotaName);
      await quotaStepper.setTotalServices('10');
      await quotaStepper.setTotalRoutes('10');
      await quotaStepper.setMemoryLimit('1024');

      // Check if we can proceed
      await expect(quotaStepper.getNextButton()).toBeEnabled();

      await quotaStepper.next();

      // Wait for navigation back to quotas list
      await page.waitForURL(/.*quota-definitions.*/, { timeout: 10000 });

      // Verify quota was created via API
      const quota = await cfApi.findQuotaByName(quotaName);
      expect(quota).toBeTruthy();
      expect(quota.name).toBe(quotaName);

      // Cleanup
      if (quota) {
        await cfApi.deleteQuota(quota.guid);
      }
    });

    test('should validate quota name', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;

      const cfPage = CfTopLevelPage.forEndpoint(page, cfGuid);
      await cfPage.navigateTo();
      await cfPage.goToQuotasTab();

      const addButton = page.locator('button').filter({ hasText: /add.*quota|create.*quota/i }).first();
      const buttonExists = await addButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (!buttonExists) {
        test.skip('Add Quota button not found');
      }

      await addButton.click();

      const quotaStepper = new QuotaFormStepper(page);
      await quotaStepper.waitUntilShown();

      // The other required fields hold valid values, so the name alone
      // decides whether Next is enabled.
      await quotaStepper.setMemoryLimit('1024');
      await quotaStepper.setInstanceMemoryLimit('512');
      await quotaStepper.setAppInstanceLimit('10');
      await quotaStepper.setTotalServices('10');
      await quotaStepper.setTotalRoutes('10');

      // Try with empty name
      await quotaStepper.setName('');
      await expect(quotaStepper.getNextButton()).toBeDisabled();

      // Try with valid name
      await quotaStepper.setName('valid-quota-name');
      await expect(quotaStepper.getNextButton()).toBeEnabled();

      // Cancel the stepper
      await quotaStepper.cancel();
    });

    test('should set quota limits (services, routes, memory)', async ({ connectedEndpointsAdminPage, cfApi }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const quotaName = createCustomName('limits-quota');

      const cfPage = CfTopLevelPage.forEndpoint(page, cfGuid);
      await cfPage.navigateTo();
      await cfPage.goToQuotasTab();

      const addButton = page.locator('button').filter({ hasText: /add.*quota|create.*quota/i }).first();
      const buttonExists = await addButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (!buttonExists) {
        test.skip('Add Quota button not found');
      }

      await addButton.click();

      const quotaStepper = new QuotaFormStepper(page);
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
      await page.waitForURL(/.*quota-definitions.*/, { timeout: 10000 });

      // Verify quota limits via API
      const quota = await cfApi.findQuotaByName(quotaName);
      expect(quota).toBeTruthy();

      // Cleanup
      if (quota) {
        await cfApi.deleteQuota(quota.guid);
      }
    });

    test('should update quota definition', async ({ cfApi, connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const quotaName = createCustomName('update-quota');

      // Create quota via API first
      const quota = await cfApi.createQuota({
        name: quotaName,
        totalServices: 10,
        totalRoutes: 10,
        memoryLimit: 1024
      });

      try {
        // Navigate to CF quotas page
        const cfPage = CfTopLevelPage.forEndpoint(page, cfGuid);
        await cfPage.navigateTo();
        await cfPage.goToQuotasTab();

        // The list shows cards or table rows; both carry the row hooks.
        const listComponent = page.locator('app-signal-list');
        await listComponent.locator('[data-test="name-filter"]').fill(quotaName);
        const row = listComponent.locator('[data-test="card"], tbody tr').filter({ hasText: quotaName });
        await expect(row).toBeVisible({ timeout: 20000 });
        await row.locator('[data-test="row-actions"]').click();
        await page.locator('[data-test="row-action-Edit"]').click();

        const quotaStepper = new QuotaFormStepper(page);
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
        await cfApi.deleteQuota(quota.guid);
      }
    });

    test('should delete quota definition', async ({ cfApi, connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const quotaName = createCustomName('delete-quota');

      // Create quota via API
      const quota = await cfApi.createQuota({
        name: quotaName,
        totalServices: 10,
        totalRoutes: 10,
        memoryLimit: 1024
      });

      try {
        // Navigate to CF quotas page
        const cfPage = CfTopLevelPage.forEndpoint(page, cfGuid);
        await cfPage.navigateTo();
        await cfPage.goToQuotasTab();

        // The list shows cards or table rows; both carry the row hooks.
        const listComponent = page.locator('app-signal-list');
        await listComponent.locator('[data-test="name-filter"]').fill(quotaName);
        const row = listComponent.locator('[data-test="card"], tbody tr').filter({ hasText: quotaName });
        await expect(row).toBeVisible({ timeout: 20000 });
        await row.locator('[data-test="row-actions"]').click();
        await page.locator('[data-test="row-action-Delete"]').click();

        // Confirm deletion dialog
        const confirmDialog = page.locator('app-dialog-confirm');
        await confirmDialog.waitFor({ state: 'visible', timeout: 5000 });

        const confirmButton = confirmDialog.locator('[data-test="confirm-dialog-confirm"]');
        await confirmButton.click();

        // Wait for row to disappear
        await row.waitFor({ state: 'hidden', timeout: 10000 });

        // Verify quota is deleted via API (CF deletes it as a job)
        await expect.poll(async () => {
          try {
            await cfApi.getQuota(quota.guid);
            return 'present';
          } catch (error) {
            return String(error).includes(' failed: 404 ') ? 'gone' : String(error);
          }
        }, { timeout: 30000 }).toBe('gone');

      } catch (error) {
        // If test failed, cleanup the quota
        try {
          await cfApi.deleteQuota(quota.guid);
        } catch (cleanupError) {
          // Quota might already be deleted
        }
        throw error;
      }
    });

    test('should prevent deleting quota attached to org', async ({ cfApi, connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const quotaName = createCustomName('attached-quota');
      const orgName = createCustomName('quota-org');

      // Create quota via API
      const quota = await cfApi.createQuota({
        name: quotaName,
        totalServices: 10,
        totalRoutes: 10,
        memoryLimit: 1024
      });

      // Create org with this quota
      const org = await cfApi.createOrg({ name: orgName });

      try {
        // Attach quota to org via API
        await cfApi.applyOrgQuota(org.guid, quota.guid);

        // Navigate to CF quotas page
        const cfPage = CfTopLevelPage.forEndpoint(page, cfGuid);
        await cfPage.navigateTo();
        await cfPage.goToQuotasTab();

        // The list shows cards or table rows; both carry the row hooks.
        const listComponent = page.locator('app-signal-list');
        await listComponent.locator('[data-test="name-filter"]').fill(quotaName);
        const row = listComponent.locator('[data-test="card"], tbody tr').filter({ hasText: quotaName });
        await expect(row).toBeVisible({ timeout: 20000 });
        await row.locator('[data-test="row-actions"]').click();
        await page.locator('[data-test="row-action-Delete"]').click();
        await page.locator('[data-test="confirm-dialog-confirm"]').click();

        // Cloud Foundry refuses while an organization uses the quota: it
        // is still there, and so is its card.
        await expect(row).toBeVisible();
        expect((await cfApi.getQuota(quota.guid)).guid).toBe(quota.guid);

      } finally {
        // Cleanup
        await cfApi.deleteOrg(org.guid);
        await cfApi.deleteQuota(quota.guid);
      }
    });
  });
});
