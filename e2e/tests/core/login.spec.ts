import { test, expect } from '../../fixtures/test-base';
import { LoginPage } from '../../pages/login.page';

/**
 * Login E2E Tests
 * Migrated from src/test-e2e/login/login-e2e.spec.ts
 *
 * Tests the authentication flow including:
 * - Reaching the login page
 * - Rejecting invalid credentials
 * - Accepting valid credentials
 */
test.describe('Login', () => {
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

  test('should reject bad user', async ({ page, secrets }) => {
    // Enter invalid credentials
    await loginPage.enterLogin('badusername', 'badpassword');

    // Verify button is enabled
    await expect(loginPage.loginButton()).toBeEnabled();

    // Click login
    await loginPage.clickLogin();

    // Should show error message
    expect(await loginPage.isLoginError()).toBeTruthy();

    // Should still be on login page
    expect(await loginPage.isLoginPage()).toBeTruthy();
  });

  test('should reject bad password', async ({ page, secrets }) => {
    // Enter valid username but invalid password
    await loginPage.enterLogin(secrets.console.admin.username, 'badpassword');

    // Verify button is enabled
    await expect(loginPage.loginButton()).toBeEnabled();

    // Click login
    await loginPage.clickLogin();

    // Should show error message
    expect(await loginPage.isLoginError()).toBeTruthy();

    // Should still be on login page
    expect(await loginPage.isLoginPage()).toBeTruthy();
  });

  test('should accept correct details', async ({ page, secrets }) => {
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
