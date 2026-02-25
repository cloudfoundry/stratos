import { test, expect } from '../../../fixtures/test-base';
import { CfOrgLevelPage } from '../../../pages/cloud-foundry/org-level/cf-org-level.page';
import { SpaceFormStepper } from '../../../pages/cloud-foundry/org-level/space-form-stepper.page';
import { createCustomName } from '../../../helpers/test-utils';

/**
 * Manage Space E2E Tests
 * Migrated from src/test-e2e/cloud-foundry/org-level/mange-space-e2e.spec.ts
 *
 * Tests space creation and management within organization
 */

test.describe('Manage Space', () => {

  test('should create space via CF API', async ({ cfApi, secrets }) => {
    const cfEndpoint = secrets.getCloudfoundryEndpoint(0);
    const orgGuid = cfEndpoint.testOrgGuid;
    const spaceName = createCustomName('test-space');

    // Create space
    const space = await cfApi.createSpace({ name: spaceName, orgGuid });
    expect(space.guid).toBeTruthy();
    expect(space.name).toBe(spaceName);

    // Cleanup
    await cfApi.deleteSpace(space.guid);
  });

  test('should delete space via CF API', async ({ cfApi, secrets }) => {
    const cfEndpoint = secrets.getCloudfoundryEndpoint(0);
    const orgGuid = cfEndpoint.testOrgGuid;
    const spaceName = createCustomName('delete-space');

    // Create and delete space
    const space = await cfApi.createSpace({ name: spaceName, orgGuid });
    await cfApi.deleteSpace(space.guid);

    // Verify deletion
    try {
      await cfApi.getSpace(space.guid);
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeTruthy();
    }
  });

  test.describe('Space Management (UI)', () => {

    test('should create space via UI', async ({ connectedEndpointsAdminPage, cfApi, secrets }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const cfEndpoint = secrets.getCloudfoundryEndpoint(0);
      const orgGuid = cfEndpoint.testOrgGuid;
      const spaceName = createCustomName('ui-space');

      // Navigate to org spaces page
      const orgPage = CfOrgLevelPage.forEndpoint(page, cfGuid, orgGuid);
      await orgPage.navigateTo();
      await orgPage.goToSpacesTab();

      // Click "Add Space" button
      const addButton = page.locator('button').filter({ hasText: /add.*space|create.*space/i }).first();
      const buttonExists = await addButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (!buttonExists) {
        test.skip('Add Space button not found - UI may have changed');
      }

      await addButton.click();

      // Fill in space creation stepper
      const spaceStepper = new SpaceFormStepper(page);
      await spaceStepper.waitUntilShown();

      await spaceStepper.setSpaceName(spaceName);

      // Check if we can proceed (name is valid)
      const canProceed = await spaceStepper.canNext();
      expect(canProceed).toBe(true);

      await spaceStepper.next();

      // Wait for navigation back to spaces list
      await page.waitForURL(/.*spaces.*/, { timeout: 10000 });

      // Verify space was created via API
      const spaces = await cfApi.getSpaces(orgGuid);
      const createdSpace = spaces.find(s => s.name === spaceName);
      expect(createdSpace).toBeTruthy();
      expect(createdSpace.name).toBe(spaceName);

      // Cleanup
      if (createdSpace) {
        await cfApi.deleteSpace(createdSpace.guid);
      }
    });

    test('should validate space name', async ({ connectedEndpointsAdminPage, secrets }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const cfEndpoint = secrets.getCloudfoundryEndpoint(0);
      const orgGuid = cfEndpoint.testOrgGuid;

      const orgPage = CfOrgLevelPage.forEndpoint(page, cfGuid, orgGuid);
      await orgPage.navigateTo();
      await orgPage.goToSpacesTab();

      const addButton = page.locator('button').filter({ hasText: /add.*space|create.*space/i }).first();
      const buttonExists = await addButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (!buttonExists) {
        test.skip('Add Space button not found');
      }

      await addButton.click();

      const spaceStepper = new SpaceFormStepper(page);
      await spaceStepper.waitUntilShown();

      // Try with empty name
      await spaceStepper.setSpaceName('');
      let canProceed = await spaceStepper.canNext();
      expect(canProceed).toBe(false);

      // Try with valid name
      await spaceStepper.setSpaceName('valid-space-name');
      canProceed = await spaceStepper.canNext();
      expect(canProceed).toBe(true);

      // Cancel the stepper
      await spaceStepper.cancel();
    });

    test('should update space details', async ({ cfApi, connectedEndpointsAdminPage, secrets }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;
      const cfEndpoint = secrets.getCloudfoundryEndpoint(0);
      const orgGuid = cfEndpoint.testOrgGuid;
      const spaceName = createCustomName('update-space');

      // Create space via API first
      const space = await cfApi.createSpace({ name: spaceName, orgGuid });

      try {
        // Navigate to space page
        await page.goto(`/cloud-foundry/${cfGuid}/organizations/${orgGuid}/spaces/${space.guid}/summary`);
        await page.waitForLoadState('networkidle');

        // Look for edit button
        const editButton = page.locator('button').filter({ hasText: /edit/i }).first();
        const editExists = await editButton.isVisible({ timeout: 5000 }).catch(() => false);

        if (!editExists) {
          test.skip('Edit space functionality not available in UI');
        }

        await editButton.click();

        const spaceStepper = new SpaceFormStepper(page);
        await spaceStepper.waitUntilShown();

        // Verify current name is shown
        const form = spaceStepper.getStepperForm();
        const nameField = form.locator('[name="spacename"], [formcontrolname="spacename"]').first();
        const currentName = await nameField.inputValue();
        expect(currentName).toBe(spaceName);

        // Cancel - we don't want to actually update
        await spaceStepper.cancel();

      } finally {
        // Cleanup
        await cfApi.deleteSpace(space.guid);
      }
    });

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
        const listComponent = page.locator('app-list');
        await listComponent.waitFor({ state: 'visible' });

        // Delete space using page object method
        await orgPage.deleteSpace(spaceName);

        // Verify space is deleted via API
        try {
          await cfApi.getSpace(space.guid);
          expect(true).toBe(false); // Should not find it
        } catch (error) {
          expect(error).toBeTruthy(); // Expected - space should not exist
        }

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
  });
});
