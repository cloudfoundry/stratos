import { test, expect } from '../../fixtures/test-base';
import { LoginPage } from '../../pages/login.page';

/**
 * System Availability Check Tests
 * Migrated from src/test-e2e/check/check-login-e2e.spec.ts
 *
 * Basic smoke tests to verify system availability
 */
test.describe('Check Availability of System', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigateTo();
  });

  test('should reach log in page', async ({ page }) => {
    // Verify we're on the login page
    expect(await loginPage.isLoginPage()).toBeTruthy();

    // Verify login button is present
    await expect(loginPage.loginButton()).toBeVisible();
  });

  test('should be able to login', async ({ page, secrets }) => {
    // Enter valid credentials
    await loginPage.enterLogin(
      secrets.console.admin.username,
      secrets.console.admin.password
    );

    // Verify button is enabled
    await expect(loginPage.loginButton()).toBeEnabled();

    // Click login
    await loginPage.clickLogin();

    // Wait for application page
    await loginPage.waitForApplicationPage();

    // Should not be on login page anymore
    expect(await loginPage.isLoginPage()).toBeFalsy();
  });
});
