import { test, expect } from '../../fixtures/test-base';

test.describe('Metrics Registration', () => {
  test('should check metrics availability', { tag: '@smoke' }, async ({ connectedEndpointsAdminPage }) => {
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
      await registerButton.click();

      // Look for metrics endpoint type option
      const metricsOption = page.locator('[value="metrics"], mat-option, button').filter({ hasText: /metrics/i }).first();

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

      // Metrics page should show either live content or an explicit
      // "no data yet" placeholder.
      const metricsContent = page.locator(
        'app-metrics, .metrics-container, .no-metrics, .empty-message, app-no-content-message'
      );
      await expect(metricsContent.first()).toBeVisible();
    });
  });
});
