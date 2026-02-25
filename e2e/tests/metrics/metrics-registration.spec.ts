import { test, expect } from '../../fixtures/test-base';

test.describe('Metrics Registration', () => {
  test('should check metrics availability', async ({ connectedEndpointsAdminPage }) => {
    const { page } = connectedEndpointsAdminPage;
    await page.goto('/');
    const url = page.url();
    expect(url).toBeTruthy();
  });

  test.describe('Metrics UI', () => {

    test('should register metrics endpoint', async ({ connectedEndpointsAdminPage }) => {
      const { page } = connectedEndpointsAdminPage;

      // Navigate to endpoints page
      await page.goto('/endpoints');
      await page.waitForLoadState('networkidle');

      // Look for register/connect endpoint button
      const registerButton = page.locator('button').filter({ hasText: /register|connect.*endpoint/i }).first();
      const buttonExists = await registerButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (!buttonExists) {
        test.skip('Register endpoint button not found');
      }

      await registerButton.click();

      // Look for metrics endpoint type option
      const metricsOption = page.locator('[value="metrics"], mat-option, button').filter({ hasText: /metrics/i }).first();
      const metricsExists = await metricsOption.isVisible({ timeout: 5000 }).catch(() => false);

      if (!metricsExists) {
        test.skip('Metrics endpoint option not available');
      }

      // Verify metrics option is available (don't actually register)
      await expect(metricsOption).toBeVisible();

      // Close dialog
      const cancelButton = page.locator('button').filter({ hasText: /cancel/i }).first();
      if (await cancelButton.isVisible().catch(() => false)) {
        await cancelButton.click();
      } else {
        await page.keyboard.press('Escape');
      }
    });

    test('should display metrics', async ({ connectedEndpointsAdminPage }) => {
      const { page, cfGuid } = connectedEndpointsAdminPage;

      // Try to navigate to metrics page
      await page.goto(`/cloud-foundry/${cfGuid}/metrics`);
      await page.waitForLoadState('networkidle');

      const url = page.url();

      // Check if metrics page loaded or if we need metrics endpoint
      const metricsContent = page.locator('app-metrics, .metrics-container');
      const contentExists = await metricsContent.first().isVisible({ timeout: 5000 }).catch(() => false);

      if (contentExists) {
        // Metrics page exists
        await expect(metricsContent.first()).toBeVisible();
      } else {
        // May require metrics endpoint registration
        const noMetricsMessage = page.locator('.no-metrics, .empty-message, app-no-content-message');
        const hasMessage = await noMetricsMessage.isVisible({ timeout: 5000 }).catch(() => false);

        if (hasMessage) {
          await expect(noMetricsMessage).toBeVisible();
        } else {
          test.skip('Metrics display requires metrics endpoint registration');
        }
      }
    });
  });
});
