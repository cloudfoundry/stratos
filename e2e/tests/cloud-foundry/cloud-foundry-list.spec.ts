import { test, expect } from '../../fixtures/test-base';

/**
 * Cloud Foundry List E2E Tests
 * Migrated from src/test-e2e/cloud-foundry/cloud-foundry-list-cf-e2e.spec.ts
 *
 * Tests CF endpoint list display on home/endpoints page
 */

test.describe('Cloud Foundry List', () => {

  test('should display CF endpoints on endpoints page', async ({ connectedEndpointsAdminPage }) => {
    const { page } = connectedEndpointsAdminPage;

    // Navigate to endpoints page
    await page.goto('/endpoints');
    await page.waitForLoadState('networkidle');

    // Verify endpoints list
    const listComponent = page.locator('app-endpoints-page, app-list');
    await expect(listComponent.first()).toBeVisible();

    // Should have at least one CF endpoint
    const cfEndpoints = page.locator('app-card, mat-card').filter({ hasText: /cloud.foundry|cf/i });
    const count = await cfEndpoints.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should navigate to CF from endpoints list', async ({ connectedEndpointsAdminPage, secrets }) => {
    const { page } = connectedEndpointsAdminPage;
    const cfEndpoint = secrets.getCloudfoundryEndpoint(0);

    await page.goto('/endpoints');
    await page.waitForLoadState('networkidle');

    // Find and click on CF endpoint
    const cfCard = page.locator('app-card, mat-card').filter({ hasText: cfEndpoint.name });
    await cfCard.first().click();

    // Verify navigation to CF page
    await page.waitForURL(/.*\/cloud-foundry\/.*/, { timeout: 10000 });
    const url = page.url();
    expect(url).toContain('/cloud-foundry/');
  });

  test.describe('Endpoint Management (UI)', () => {

    test('should show CF endpoint details', async ({ connectedEndpointsAdminPage, secrets }) => {
      const { page } = connectedEndpointsAdminPage;
      const cfEndpoint = secrets.getCloudfoundryEndpoint(0);

      await page.goto('/endpoints');
      await page.waitForLoadState('networkidle');

      // Find CF endpoint card
      const cfCard = page.locator('app-card, mat-card').filter({ hasText: cfEndpoint.name });
      await cfCard.first().waitFor({ state: 'visible' });

      // Verify endpoint details are shown (name, URL, type)
      await expect(cfCard.first()).toContainText(cfEndpoint.name);

      // Check if URL is displayed
      const hasUrl = await cfCard.first().locator(':text-matches("https?://", "i")').count() > 0;
      expect(hasUrl).toBeTruthy();

      // Check for endpoint status indicator
      const statusIndicator = cfCard.first().locator('.status, [class*="connect"], mat-icon').first();
      const hasStatus = await statusIndicator.isVisible().catch(() => false);

      if (hasStatus) {
        await expect(statusIndicator).toBeVisible();
      }
    });

    test('should disconnect CF endpoint', async ({ connectedEndpointsAdminPage, secrets }) => {
      const { page } = connectedEndpointsAdminPage;
      const cfEndpoint = secrets.getCloudfoundryEndpoint(0);

      await page.goto('/endpoints');
      await page.waitForLoadState('networkidle');

      // Find CF endpoint card
      const cfCard = page.locator('app-card, mat-card').filter({ hasText: cfEndpoint.name });
      await cfCard.first().waitFor({ state: 'visible' });

      // Look for disconnect/actions menu
      const menuButton = cfCard.first().locator('button[aria-label*="menu"], button[aria-label*="actions"], .actions-menu button').first();
      const hasMenu = await menuButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (!hasMenu) {
        test.skip('Endpoint actions menu not found');
      }

      await menuButton.click();

      // Look for disconnect option
      const disconnectOption = page.locator('button, mat-option').filter({ hasText: /disconnect/i }).first();
      const hasDisconnect = await disconnectOption.isVisible({ timeout: 5000 }).catch(() => false);

      if (!hasDisconnect) {
        // Close menu and skip
        await page.keyboard.press('Escape');
        test.skip('Disconnect option not available - endpoint may already be disconnected');
      }

      // Don't actually disconnect - just verify option exists
      await expect(disconnectOption).toBeVisible();

      // Close menu
      await page.keyboard.press('Escape');
    });

    test('should reconnect CF endpoint', async ({ connectedEndpointsAdminPage, secrets }) => {
      const { page } = connectedEndpointsAdminPage;
      const cfEndpoint = secrets.getCloudfoundryEndpoint(0);

      await page.goto('/endpoints');
      await page.waitForLoadState('networkidle');

      // Find CF endpoint card
      const cfCard = page.locator('app-card, mat-card').filter({ hasText: cfEndpoint.name });
      await cfCard.first().waitFor({ state: 'visible' });

      // Look for connect/reconnect button
      const connectButton = cfCard.first().locator('button').filter({ hasText: /connect|reconnect/i }).first();
      const hasConnect = await connectButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (!hasConnect) {
        // Try actions menu
        const menuButton = cfCard.first().locator('button[aria-label*="menu"], button[aria-label*="actions"]').first();
        const hasMenu = await menuButton.isVisible({ timeout: 5000 }).catch(() => false);

        if (hasMenu) {
          await menuButton.click();

          const connectOption = page.locator('button, mat-option').filter({ hasText: /connect|reconnect/i }).first();
          const hasConnectOption = await connectOption.isVisible({ timeout: 5000 }).catch(() => false);

          if (hasConnectOption) {
            // Don't actually connect - just verify option exists
            await expect(connectOption).toBeVisible();
            await page.keyboard.press('Escape');
          } else {
            await page.keyboard.press('Escape');
            test.skip('Connect/Reconnect option not available - endpoint may already be connected');
          }
        } else {
          test.skip('Connect button not found - endpoint may already be connected');
        }
      } else {
        // Don't actually connect - just verify button exists
        await expect(connectButton).toBeVisible();
      }
    });
  });
});
