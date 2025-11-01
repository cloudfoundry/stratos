import { test, expect } from '../../fixtures/test-base';
import { APIKeysListPage } from '../../pages/api-keys/api-keys-list.page';
import { ApiKeyAddDialogPage } from '../../pages/api-keys/api-key-add-dialog.page';
import { EndpointsPage } from '../../pages/endpoints/endpoints.page';
import { ConfirmDialogComponent } from '../../components';
import { createCustomAppLabel } from '../../helpers/test-utils';

/**
 * API Keys E2E Tests
 * Migrated from src/test-e2e/apikeys/apikeys-e2e.spec.ts
 *
 * Tests API key management functionality (CRUD operations)
 */
test.describe('API Keys', () => {
  const customApiKeyLabel = createCustomAppLabel() + '-api-key';
  let newKeyComment: string;
  let currentKeysCount = 0;

  test.beforeAll(() => {
    newKeyComment = customApiKeyLabel.toLowerCase();
  });

  // These tests must run in order (sequential)
  test.describe.serial('Ordered Tests', () => {
    let apiKeysPage: APIKeysListPage;

    test('should load UI', async ({ noEndpointsAdminPage }) => {
      // Wait for endpoints page to load
      const endpointsPage = new EndpointsPage(noEndpointsAdminPage);
      await endpointsPage.waitForPage();
    });

    test('navigate to api key page', async ({ noEndpointsAdminPage }) => {
      // Click on user menu and navigate to API Keys
      await noEndpointsAdminPage.locator('button[aria-label="User menu"], .user-menu-button').click();
      await noEndpointsAdminPage.locator('button, mat-menu-item').filter({ hasText: 'API Keys' }).click();

      // Initialize page object
      apiKeysPage = new APIKeysListPage(noEndpointsAdminPage);
      await apiKeysPage.waitForPage();
    });

    test('new key does not exist', async ({ noEndpointsAdminPage }) => {
      apiKeysPage = new APIKeysListPage(noEndpointsAdminPage);

      // Check if list is present
      const isListDisplayed = await apiKeysPage.list.isDisplayed();

      if (isListDisplayed) {
        // Verify the new key doesn't exist
        const rowIndex = await apiKeysPage.list.table.findRow('comment', newKeyComment, false);
        expect(rowIndex).toBeLessThan(0);

        // Store current key count
        currentKeysCount = await apiKeysPage.list.table.getRowCount();
      } else {
        // No keys exist - no content message should be shown
        const noContent = noEndpointsAdminPage.locator('app-no-content-message, .no-content-message');
        await expect(noContent).toBeVisible();
        currentKeysCount = 0;
      }
    });

    test.describe('Add Dialog', () => {
      test('basic dialog tests', async ({ noEndpointsAdminPage }) => {
        apiKeysPage = new APIKeysListPage(noEndpointsAdminPage);

        // Click add key button
        const addButton = apiKeysPage.getAddKeyButton();
        await expect(addButton).toBeVisible();
        await addButton.click();

        // Create dialog page object
        const dialog = new ApiKeyAddDialogPage(noEndpointsAdminPage);
        await dialog.waitUntilShown('API Key Add Dialog');

        // Verify dialog is displayed
        expect(await dialog.isDisplayed()).toBeTruthy();

        // Verify can close but cannot create (form not filled)
        expect(await dialog.canClose()).toBeTruthy();
        expect(await dialog.canCreate()).toBeFalsy();

        // Close dialog
        await dialog.close();
        await dialog.waitUntilNotShown();

        // Wait for page to be ready
        await apiKeysPage.waitForPage();
      });

      test('add a new key', async ({ noEndpointsAdminPage }) => {
        apiKeysPage = new APIKeysListPage(noEndpointsAdminPage);

        // Click add key button
        const addButton = apiKeysPage.getAddKeyButton();
        await expect(addButton).toBeVisible();
        await addButton.click();

        // Create dialog page object
        const dialog = new ApiKeyAddDialogPage(noEndpointsAdminPage);
        await dialog.waitUntilShown();

        // Verify create button is disabled before filling form
        expect(await dialog.canCreate()).toBeFalsy();

        // Fill in the comment/description
        await dialog.form.fill({
          comment: newKeyComment
        });

        // Now should be able to close and create
        expect(await dialog.canClose()).toBeTruthy();
        expect(await dialog.canCreate()).toBeTruthy();

        // Create the key
        await dialog.create();
        await dialog.waitUntilNotShown();
      });
    });

    test('new key has a secret', async ({ noEndpointsAdminPage }) => {
      apiKeysPage = new APIKeysListPage(noEndpointsAdminPage);

      // Wait for secret to be displayed
      await apiKeysPage.waitForSecret();

      // Verify secret text is present
      const secretText = await apiKeysPage.getSecretText();
      expect(secretText).toBeDefined();
      expect(secretText.length).toBeGreaterThan(0);

      // Close the secret
      await apiKeysPage.closeKeySecret();

      // Wait for secret to be hidden
      await apiKeysPage.getKeySecret().waitFor({ state: 'hidden', timeout: 5000 });
    });

    test('new key is in updated table', async ({ noEndpointsAdminPage }) => {
      apiKeysPage = new APIKeysListPage(noEndpointsAdminPage);

      // Find the new key in the table
      const rowIndex = await apiKeysPage.list.table.findRow('description', newKeyComment, true);
      expect(rowIndex).toBeGreaterThanOrEqual(0);
    });

    test('delete new key', async ({ noEndpointsAdminPage }) => {
      apiKeysPage = new APIKeysListPage(noEndpointsAdminPage);

      // Find the key row
      const rowIndex = await apiKeysPage.list.table.findRow('description', newKeyComment, true);
      expect(rowIndex).toBeGreaterThanOrEqual(0);

      // Open row action menu
      await apiKeysPage.list.table.openRowActionMenuByIndex(rowIndex);

      // Click delete
      await noEndpointsAdminPage.locator('button, mat-menu-item').filter({ hasText: 'Delete' }).click();

      // Confirm deletion
      await ConfirmDialogComponent.expectDialogAndConfirm(
        noEndpointsAdminPage,
        'Delete',
        'Delete Key'
      );

      // Wait for page to update
      await apiKeysPage.waitForPage();

      // Check if list is still displayed
      const isListDisplayed = await apiKeysPage.list.isPresent();

      if (isListDisplayed) {
        // Wait for list to update
        await apiKeysPage.list.waitForNoLoadingIndicator();

        // Verify count is back to original
        const finalCount = await apiKeysPage.list.table.getRowCount();
        expect(finalCount).toEqual(currentKeysCount);
      } else {
        // No keys left - verify count was 0
        expect(currentKeysCount).toEqual(0);
      }
    });
  });
});
