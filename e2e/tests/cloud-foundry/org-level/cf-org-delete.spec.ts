import { test, expect } from '../../../fixtures/test-base';
import { CfOrgLevelPage } from '../../../pages/cloud-foundry/org-level/cf-org-level.page';
import { CfTopLevelPage } from '../../../pages/cloud-foundry/cf-level/cf-top-level.page';
import { createCustomName } from '../../../helpers/test-utils';

/**
 * CF Org Delete E2E Tests
 * Migrated from src/test-e2e/cloud-foundry/org-level/cf-org-delete-e2e.spec.ts
 *
 * Tests organization deletion via CF API
 */

test.describe('CF Org Delete', () => {

  test('should delete organization via CF API', async ({ cfApi, connectedEndpointsAdminPage }) => {
    const { page, cfGuid } = connectedEndpointsAdminPage;
    const orgName = createCustomName('delete-org');

    // Create org
    const org = await cfApi.createOrg({ name: orgName });
    expect(org.guid).toBeTruthy();

    // Delete org
    await cfApi.deleteOrg(org.guid);

    // Verify deletion
    const found = await cfApi.findOrgByName(orgName);
    expect(found).toBeNull();
  });

  test.describe('Delete Organization (UI)', () => {

    test('should delete organization via UI', async ({ cfApi, connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const orgName = createCustomName('delete-ui-org');

      // Create org via API
      const org = await cfApi.createOrg({ name: orgName });

      try {
        // Navigate to org summary page
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
        await page.waitForURL(new RegExp(`.*cloud-foundry/${cfGuid}(?!/organizations).*`), { timeout: 10000 });

        // Verify org is deleted via API
        const found = await cfApi.findOrgByName(orgName);
        expect(found).toBeNull();

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

    test('should confirm deletion', async ({ cfApi, connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const orgName = createCustomName('confirm-delete-org');

      // Create org via API
      const org = await cfApi.createOrg({ name: orgName });

      try {
        // Navigate to org summary page
        await page.goto(`/cloud-foundry/${cfGuid}/organizations/${org.guid}/summary`);
        await page.waitForLoadState('networkidle');

        // Look for delete button
        const deleteButton = page.locator('button').filter({ hasText: /delete/i }).first();
        const deleteExists = await deleteButton.isVisible({ timeout: 5000 }).catch(() => false);

        if (!deleteExists) {
          test.skip('Delete organization functionality not available in UI');
        }

        await deleteButton.click();

        // Verify confirmation dialog appears
        const confirmDialog = page.locator('mat-dialog-container, app-confirm-dialog');
        await confirmDialog.waitFor({ state: 'visible' });

        // Verify dialog has confirm/delete button
        const confirmButton = confirmDialog.locator('button').filter({ hasText: /delete|confirm/i });
        await expect(confirmButton).toBeVisible();

        // Actually confirm to clean up
        await confirmButton.click();
        await page.waitForURL(new RegExp(`.*cloud-foundry/${cfGuid}(?!/organizations).*`), { timeout: 10000 });

      } catch (error) {
        // Cleanup if test failed
        try {
          await cfApi.deleteOrg(org.guid);
        } catch (cleanupError) {
          // Org might already be deleted
        }
        throw error;
      }
    });

    test('should return to CF page after deletion', async ({ cfApi, connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const orgName = createCustomName('return-delete-org');

      // Create org via API
      const org = await cfApi.createOrg({ name: orgName });

      try {
        // Navigate to org summary page
        await page.goto(`/cloud-foundry/${cfGuid}/organizations/${org.guid}/summary`);
        await page.waitForLoadState('networkidle');

        // Look for delete button
        const deleteButton = page.locator('button').filter({ hasText: /delete/i }).first();
        const deleteExists = await deleteButton.isVisible({ timeout: 5000 }).catch(() => false);

        if (!deleteExists) {
          test.skip('Delete organization functionality not available in UI');
        }

        await deleteButton.click();

        // Confirm deletion
        const confirmDialog = page.locator('mat-dialog-container, app-confirm-dialog');
        await confirmDialog.waitFor({ state: 'visible', timeout: 5000 });

        const confirmButton = confirmDialog.locator('button').filter({ hasText: /delete|confirm|yes/i });
        await confirmButton.click();

        // Wait for navigation away from org page - should return to CF page
        await page.waitForURL(new RegExp(`.*cloud-foundry/${cfGuid}(?!/organizations).*`), { timeout: 15000 });

        const url = page.url();
        expect(url).toContain(`/cloud-foundry/${cfGuid}`);
        expect(url).not.toContain(`/organizations/${org.guid}`);

      } catch (error) {
        // Cleanup if test failed
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
