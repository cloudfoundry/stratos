import { test, expect } from '../../../fixtures/test-base';
import { CfOrgLevelPage } from '../../../pages/cloud-foundry/org-level/cf-org-level.page';
import { createCustomName } from '../../../helpers/test-utils';

/**
 * CF Space Delete E2E Tests
 * Migrated from src/test-e2e/cloud-foundry/space-level/cf-space-delete-e2e.spec.ts
 *
 * Tests space deletion via CF API
 */

test.describe('CF Space Delete', () => {

  test('should delete space via CF API', async ({ cfApi, secrets }) => {
    const cfEndpoint = secrets.getCloudfoundryEndpoint(0);
    const orgGuid = cfEndpoint.testOrgGuid;
    const spaceName = createCustomName('delete-space');

    // Create space
    const space = await cfApi.createSpace({ name: spaceName, orgGuid });
    expect(space.guid).toBeTruthy();

    // Delete space
    await cfApi.deleteSpace(space.guid);

    // Verify deletion
    // CF deletes as a job: wait for the 404.
    await expect.poll(async () => {
      try {
        await cfApi.getSpace(space.guid);
        return 'present';
      } catch (error) {
        return String(error).includes(' failed: 404 ') ? 'gone' : String(error);
      }
    }, { timeout: 30000 }).toBe('gone');
  });

  test.describe('Delete Space (UI)', () => {

    test('should delete space via UI', async ({ cfApi, connectedEndpointsAdminPage, secrets }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const cfEndpoint = secrets.getCloudfoundryEndpoint(0);
      const orgGuid = cfEndpoint.testOrgGuid;
      const spaceName = createCustomName('delete-ui-space');

      // Create space via API
      const space = await cfApi.createSpace({ name: spaceName, orgGuid });

      try {
        // Navigate to org spaces page
        const orgPage = CfOrgLevelPage.forEndpoint(page, cfGuid, orgGuid);
        await orgPage.navigateTo();
        await orgPage.goToSpacesTab();

        // Wait for spaces list to load
        const listComponent = page.locator('app-signal-list');
        await listComponent.waitFor({ state: 'visible' });

        // Delete space using page object method
        await orgPage.deleteSpace(spaceName);

        // Verify space is deleted via API
        // CF deletes as a job: wait for the 404.
        await expect.poll(async () => {
          try {
            await cfApi.getSpace(space.guid);
            return 'present';
          } catch (error) {
            return String(error).includes(' failed: 404 ') ? 'gone' : String(error);
          }
        }, { timeout: 30000 }).toBe('gone');

      } catch (error) {
        // If test failed, cleanup the space
        try {
          await cfApi.deleteSpace(space.guid);
        } catch (cleanupError) {
          // Space might already be deleted
        }
        throw error;
      }
    });

    test('should confirm deletion', async ({ cfApi, connectedEndpointsAdminPage, secrets }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const cfEndpoint = secrets.getCloudfoundryEndpoint(0);
      const orgGuid = cfEndpoint.testOrgGuid;
      const spaceName = createCustomName('confirm-delete-space');

      // Create space via API
      const space = await cfApi.createSpace({ name: spaceName, orgGuid });

      try {
        // Navigate to org spaces page
        const orgPage = CfOrgLevelPage.forEndpoint(page, cfGuid, orgGuid);
        await orgPage.navigateTo();
        await orgPage.goToSpacesTab();

        const listComponent = page.locator('app-signal-list');
        await listComponent.waitFor({ state: 'visible' });

        const card = listComponent.locator('[data-test="card-grid"] > *').filter({ hasText: spaceName });
        await card.waitFor({ state: 'visible' });

        // Open action menu
        const menuButton = card.locator('[data-test="row-actions"]');
        await menuButton.click();

        // Click delete
        const deleteOption = page.locator('[data-test=\"row-action-Delete\"]');
        await deleteOption.click();

        // Verify confirmation dialog appears
        const confirmDialog = page.locator('app-dialog-confirm');
        await confirmDialog.waitFor({ state: 'visible' });

        // Verify dialog has confirm/delete button
        const confirmButton = confirmDialog.locator('[data-test="confirm-dialog-confirm"]');
        await expect(confirmButton).toBeVisible();

        // Actually confirm to clean up
        await confirmButton.click();
        await card.waitFor({ state: 'hidden', timeout: 20000 });

      } catch (error) {
        // Cleanup if test failed
        try {
          await cfApi.deleteSpace(space.guid);
        } catch (cleanupError) {
          // Space might already be deleted
        }
        throw error;
      }
    });

    test('should return to org page after deletion', async ({ cfApi, connectedEndpointsAdminPage, secrets }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const cfEndpoint = secrets.getCloudfoundryEndpoint(0);
      const orgGuid = cfEndpoint.testOrgGuid;
      const spaceName = createCustomName('return-delete-space');

      // Create space via API
      const space = await cfApi.createSpace({ name: spaceName, orgGuid });

      try {
        // Navigate to space summary page directly
        await page.goto(`/cloud-foundry/${cfGuid}/organizations/${orgGuid}/spaces/${space.guid}/summary`);
        await page.locator('app-cloud-foundry-space-summary').waitFor({ timeout: 30000 });

        // Look for delete button on space page
        const deleteButton = page.locator('button').filter({ hasText: /delete.*space/i }).first();
        const deleteExists = await deleteButton.isVisible({ timeout: 5000 }).catch(() => false);

        if (!deleteExists) {
          // If no delete button on space page, navigate to org spaces and delete from there
          const orgPage = CfOrgLevelPage.forEndpoint(page, cfGuid, orgGuid);
          await orgPage.navigateTo();
          await orgPage.goToSpacesTab();
          await orgPage.deleteSpace(spaceName);

          // Verify we're still on org page
          const url = page.url();
          expect(url).toContain(`/organizations/${orgGuid}`);
        } else {
          // Delete from space page
          await deleteButton.click();

          // Confirm deletion
          const confirmDialog = page.locator('app-dialog-confirm');
          await confirmDialog.waitFor({ state: 'visible', timeout: 5000 });

          const confirmButton = confirmDialog.locator('button').filter({ hasText: /delete|confirm|yes/i });
          await confirmButton.click();

          // Wait for navigation away from space page - should return to org page
          await page.waitForURL(new RegExp(`.*organizations/${orgGuid}(?!/spaces).*`), { timeout: 15000 });

          const url = page.url();
          expect(url).toContain(`/organizations/${orgGuid}`);
          expect(url).not.toContain(`/spaces/${space.guid}`);
        }

      } catch (error) {
        // Cleanup if test failed
        try {
          await cfApi.deleteSpace(space.guid);
        } catch (cleanupError) {
          // Space might already be deleted
        }
        throw error;
      }
    });
  });
});
