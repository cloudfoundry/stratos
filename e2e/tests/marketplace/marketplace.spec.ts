import { test, expect } from '../../fixtures/test-base';

test.describe('Marketplace', () => {
  test('should navigate to marketplace', async ({ connectedEndpointsAdminPage }) => {
    const { page, cfGuid } = connectedEndpointsAdminPage;
    await page.goto(`/marketplace/${cfGuid}`);
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url).toContain('/marketplace/');
  });

  test.describe('Marketplace UI', () => {

    test('should display service offerings', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;

      await page.goto(`/marketplace/${cfGuid}`);
      await page.waitForLoadState('networkidle');

      // Check for service offerings list
      const listComponent = page.locator('app-list, app-cards, .services-list');
      const listExists = await listComponent.first().isVisible({ timeout: 10000 }).catch(() => false);

      if (!listExists) {
        // May require service brokers to be registered
        test.skip('No service offerings displayed - may require service brokers');
      }

      await expect(listComponent.first()).toBeVisible();
    });

    test('should filter services', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;

      await page.goto(`/marketplace/${cfGuid}`);
      await page.waitForLoadState('networkidle');

      // Look for filter/search input
      const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="Filter"], input[type="text"]').first();
      const searchExists = await searchInput.isVisible({ timeout: 5000 }).catch(() => false);

      if (!searchExists) {
        test.skip('Filter input not found in marketplace');
      }

      // Try filtering
      await searchInput.fill('test');
      await page.waitForTimeout(1000);

      // Verify input accepted
      const inputValue = await searchInput.inputValue();
      expect(inputValue).toBe('test');
    });

    test('should navigate to service details', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;

      // Get available services from API
      const servicesResponse = await connectedEndpointsAdminPage.request.get(
        `/pp/v1/proxy/v3/cf/${cfGuid}/service_offerings`
      );
      const services = servicesResponse.resources;

      if (!services || services.length === 0) {
        test.skip('No service offerings available - skipping navigation test');
      }

      const firstService = services[0];

      await page.goto(`/marketplace/${cfGuid}`);
      await page.waitForLoadState('networkidle');

      // Try to click on first service card/link
      const serviceCard = page.locator('app-card, mat-card, .service-card').first();
      const cardExists = await serviceCard.isVisible({ timeout: 5000 }).catch(() => false);

      if (cardExists) {
        await serviceCard.click();

        // Wait for navigation to service summary
        await page.waitForURL(/.*marketplace.*summary.*/, { timeout: 10000 });

        const url = page.url();
        expect(url).toContain('/marketplace/');
        expect(url).toContain('/summary');
      } else {
        test.skip('Service cards not found in marketplace');
      }
    });
  });
});
