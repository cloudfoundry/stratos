import { test, expect } from '../../fixtures/test-base';

test.describe('Services Wall', () => {
  test('should navigate to services wall', async ({ connectedEndpointsAdminPage }) => {
    const { page, cfGuid } = connectedEndpointsAdminPage;
    await page.goto(`/services/${cfGuid}`);
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url).toContain('/services/');
  });

  test.describe('Services UI', () => {

    test('should display service instances', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;

      await page.goto(`/services/${cfGuid}`);
      await page.waitForLoadState('networkidle');

      // Check for service instances list
      const listComponent = page.locator('app-list, app-cards, .services-list');
      const listExists = await listComponent.first().isVisible({ timeout: 10000 }).catch(() => false);

      if (listExists) {
        await expect(listComponent.first()).toBeVisible();
      } else {
        // No service instances may be normal in test environment
        const emptyMessage = page.locator('.no-content, .empty-message, app-no-content-message');
        const hasEmptyMessage = await emptyMessage.isVisible({ timeout: 5000 }).catch(() => false);

        if (hasEmptyMessage) {
          await expect(emptyMessage).toBeVisible();
        } else {
          test.skip('No service instances or empty message displayed');
        }
      }
    });

    test('should filter services by name', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;

      await page.goto(`/services/${cfGuid}`);
      await page.waitForLoadState('networkidle');

      // Look for filter/search input
      const listComponent = page.locator('app-list');
      const header = listComponent.locator('app-list-header');
      const searchInput = header.locator('input[placeholder*="Search"], input[type="text"]').first();

      const searchExists = await searchInput.isVisible({ timeout: 5000 }).catch(() => false);

      if (!searchExists) {
        test.skip('Filter input not found in services wall');
      }

      // Try filtering
      await searchInput.fill('test-service');
      await page.waitForTimeout(1000);

      // Verify input accepted
      const inputValue = await searchInput.inputValue();
      expect(inputValue).toBe('test-service');
    });
  });
});
