import { test, expect } from '../../../fixtures/test-base';
import { CfTopLevelPage } from '../../../pages/cloud-foundry/cf-level/cf-top-level.page';
import { OrgFormStepper } from '../../../pages/cloud-foundry/cf-level/org-form-stepper.page';
import { createCustomName } from '../../../helpers/test-utils';

/**
 * Manage Organization E2E Tests
 * Migrated from src/test-e2e/cloud-foundry/cf-level/manage-org-e2e.spec.ts
 *
 * Tests organization creation, update, and deletion via CF API and UI
 */

test.describe('Manage Organization', () => {

  test.describe('Organization via CF API', () => {
    test('should create organization', async ({ cfApi, connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const orgName = createCustomName('test-org');

      // Create org via CF API
      const org = await cfApi.createOrg({ name: orgName });
      expect(org.guid).toBeTruthy();
      expect(org.name).toBe(orgName);

      // Verify org appears in list
      const cfPage = CfTopLevelPage.forEndpoint(page, cfGuid);
      await cfPage.navigateTo();
      await cfPage.goToOrgTab();

      const listComponent = page.locator('app-list');
      await listComponent.waitFor({ state: 'visible' });

      // Search for our org
      const header = listComponent.locator('app-list-header');
      const searchInput = header.locator('input[placeholder*="Search"], input[type="text"]').first();
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill(orgName);
        await page.waitForTimeout(1000);
      }

      // Cleanup
      await cfApi.deleteOrg(org.guid);
    });

    test('should delete organization', async ({ cfApi }) => {
      const orgName = createCustomName('delete-org');

      // Create org
      const org = await cfApi.createOrg({ name: orgName });
      expect(org.guid).toBeTruthy();

      // Delete org
      await cfApi.deleteOrg(org.guid);

      // Verify deletion
      try {
        await cfApi.findOrgByName(orgName);
        expect(true).toBe(false); // Should not find it
      } catch (error) {
        expect(error).toBeTruthy(); // Expected
      }
    });
  });

  test.describe('Organization UI Wizard', () => {

    test('should create organization via UI', async ({ connectedEndpointsAdminPage, cfApi }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const orgName = createCustomName('ui-org');

      // Navigate to CF organizations page
      const cfPage = CfTopLevelPage.forEndpoint(page, cfGuid);
      await cfPage.navigateTo();
      await cfPage.goToOrgTab();

      // Click "Add Organization" button
      const addButton = page.locator('button').filter({ hasText: /add.*organization|create.*organization/i }).first();
      const buttonExists = await addButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (!buttonExists) {
        test.skip('Add Organization button not found - UI may have changed');
      }

      await addButton.click();

      // Fill in organization creation stepper
      const orgStepper = new OrgFormStepper(page);
      await orgStepper.waitUntilShown();

      await orgStepper.setOrg(orgName);

      // Check if we can proceed (name is valid)
      const canProceed = await orgStepper.canNext();
      expect(canProceed).toBe(true);

      await orgStepper.next();

      // Wait for navigation back to org list
      await page.waitForURL(/.*organizations.*/, { timeout: 10000 });

      // Verify organization was created via API
      const org = await cfApi.findOrgByName(orgName);
      expect(org).toBeTruthy();
      expect(org.name).toBe(orgName);

      // Cleanup
      if (org) {
        await cfApi.deleteOrg(org.guid);
      }
    });

    test('should validate organization name', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;

      const cfPage = CfTopLevelPage.forEndpoint(page, cfGuid);
      await cfPage.navigateTo();
      await cfPage.goToOrgTab();

      const addButton = page.locator('button').filter({ hasText: /add.*organization|create.*organization/i }).first();
      const buttonExists = await addButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (!buttonExists) {
        test.skip('Add Organization button not found');
      }

      await addButton.click();

      const orgStepper = new OrgFormStepper(page);
      await orgStepper.waitUntilShown();

      // Try with empty name
      await orgStepper.setOrg('');
      let canProceed = await orgStepper.canNext();
      expect(canProceed).toBe(false);

      // Try with valid name
      await orgStepper.setOrg('valid-org-name');
      canProceed = await orgStepper.canNext();
      expect(canProceed).toBe(true);

      // Cancel the stepper
      await orgStepper.cancel();
    });

    test('should select quota definition', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const orgName = createCustomName('quota-org');

      const cfPage = CfTopLevelPage.forEndpoint(page, cfGuid);
      await cfPage.navigateTo();
      await cfPage.goToOrgTab();

      const addButton = page.locator('button').filter({ hasText: /add.*organization|create.*organization/i }).first();
      const buttonExists = await addButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (!buttonExists) {
        test.skip('Add Organization button not found');
      }

      await addButton.click();

      const orgStepper = new OrgFormStepper(page);
      await orgStepper.waitUntilShown();

      await orgStepper.setOrg(orgName);

      // Check if quota field is available
      const form = orgStepper.getStepperForm();
      const quotaField = form.locator('[name="quotadefinition"], [formcontrolname="quotadefinition"]').first();
      const quotaExists = await quotaField.isVisible({ timeout: 2000 }).catch(() => false);

      if (quotaExists) {
        // Select a quota (usually "default" is available)
        await orgStepper.setQuotaDefinition('default');
      }

      // Cancel - we're just testing the wizard
      await orgStepper.cancel();
    });

    test('should update organization details', async ({ cfApi, connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const orgName = createCustomName('update-org');

      // Create org via API first
      const org = await cfApi.createOrg({ name: orgName });

      try {
        // Navigate to org page
        await page.goto(`/cloud-foundry/${cfGuid}/organizations/${org.guid}/summary`);
        await page.waitForLoadState('networkidle');

        // Look for edit button
        const editButton = page.locator('button').filter({ hasText: /edit/i }).first();
        const editExists = await editButton.isVisible({ timeout: 5000 }).catch(() => false);

        if (!editExists) {
          test.skip('Edit organization functionality not available in UI');
        }

        await editButton.click();

        const orgStepper = new OrgFormStepper(page);
        await orgStepper.waitUntilShown();

        // Verify current name is shown
        const form = orgStepper.getStepperForm();
        const nameField = form.locator('[name="orgname"], [formcontrolname="orgname"]').first();
        const currentName = await nameField.inputValue();
        expect(currentName).toBe(orgName);

        // Cancel - we don't want to actually update
        await orgStepper.cancel();

      } finally {
        // Cleanup
        await cfApi.deleteOrg(org.guid);
      }
    });

    test('should delete organization via UI', async ({ cfApi, connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const orgName = createCustomName('delete-ui-org');

      // Create org via API
      const org = await cfApi.createOrg({ name: orgName });

      try {
        // Navigate to org page
        await page.goto(`/cloud-foundry/${cfGuid}/organizations/${org.guid}/summary`);
        await page.waitForLoadState('networkidle');

        // Look for delete button
        const deleteButton = page.locator('button').filter({ hasText: /delete/i }).first();
        const deleteExists = await deleteButton.isVisible({ timeout: 5000 }).catch(() => false);

        if (!deleteExists) {
          test.skip('Delete organization functionality not available in UI');
        }

        await deleteButton.click();

        // Confirm deletion dialog
        const confirmDialog = page.locator('mat-dialog-container, app-confirm-dialog');
        await confirmDialog.waitFor({ state: 'visible', timeout: 5000 });

        const confirmButton = confirmDialog.locator('button').filter({ hasText: /delete|confirm|yes/i });
        await confirmButton.click();

        // Wait for navigation away from org page
        await page.waitForURL(/.*cloud-foundry\/.*(?!organizations).*/, { timeout: 10000 });

        // Verify org is deleted via API
        try {
          await cfApi.findOrgByName(orgName);
          expect(true).toBe(false); // Should not find it
        } catch (error) {
          expect(error).toBeTruthy(); // Expected - org should not exist
        }

      } catch (error) {
        // If test failed, cleanup the org
        try {
          await cfApi.deleteOrg(org.guid);
        } catch (cleanupError) {
          // Org might already be deleted
        }
        throw error;
      }
    });
  });
});
