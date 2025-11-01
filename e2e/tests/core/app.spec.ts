import { test, expect } from '../../fixtures/test-base';
import { LoginPage } from '../../pages/login.page';

/**
 * Application Entry Point Tests
 * Migrated from src/test-e2e/app.e2e-spec.ts
 *
 * Basic application availability test
 */
test.describe('App', () => {
  test('should reach log in page', async ({ page }) => {
    // Navigate to root
    await page.goto('/');

    // Should redirect to login page
    const loginPage = new LoginPage(page);
    expect(await loginPage.isLoginPage()).toBeTruthy();
  });
});
