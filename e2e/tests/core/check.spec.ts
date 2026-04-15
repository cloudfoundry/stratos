import { test, expect } from '../../fixtures/test-base';
import { LoginPage } from '../../pages/login.page';
import { SSOLoginPage } from '../../pages/sso-login.page';

/**
 * System Availability Check Tests
 * Migrated from src/test-e2e/check/check-login-e2e.spec.ts
 *
 * Basic smoke tests to verify system availability.
 * Supports both local (username/password) and SSO (UAA) login flows.
 */
test.describe('Check Availability of System', () => {

  test('should reach log in page', async ({ unauthenticatedPage }) => {
    const loginPage = new LoginPage(unauthenticatedPage);
    await loginPage.navigateTo();

    // Verify we're on the login page
    expect(await loginPage.isLoginPage()).toBeTruthy();

    // Verify login button is present
    await expect(loginPage.loginButton()).toBeVisible();
  });

  test('should be able to login', async ({ unauthenticatedPage, secrets }) => {
    const loginPage = new LoginPage(unauthenticatedPage);
    await loginPage.navigateTo();

    // Detect login type: SSO has a submit button but no username input
    const hasUsernameInput = await unauthenticatedPage.locator('input[name="username"]').isVisible({ timeout: 2000 }).catch(() => false);

    if (hasUsernameInput) {
      // Local login flow
      await loginPage.enterLogin(
        secrets.console.admin.username,
        secrets.console.admin.password
      );
      await expect(loginPage.loginButton()).toBeEnabled();
      await loginPage.clickLogin();
    } else {
      // SSO login flow
      const ssoPage = new SSOLoginPage(unauthenticatedPage);
      await ssoPage.login(
        secrets.console.admin.username,
        secrets.console.admin.password
      );
    }

    // Wait for application page
    await loginPage.waitForApplicationPage();

    // Should not be on login page anymore
    expect(await loginPage.isLoginPage()).toBeFalsy();
  });
});
