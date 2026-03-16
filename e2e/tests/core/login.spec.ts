import { test, expect } from '../../fixtures/test-base';
import { LoginPage } from '../../pages/login.page';

/**
 * Login E2E Tests
 * Migrated from src/test-e2e/login/login-e2e.spec.ts
 *
 * Tests the authentication flow for both local and SSO auth:
 * - Local: Angular form with username/password fields
 * - SSO:   "Sign In" button redirects to UAA login page
 */
test.describe('Login', () => {

  test('should reach log in page', async ({ page, authType }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigateTo();

    if (authType === 'local') {
      // Local auth shows username/password form
      expect(await loginPage.isLoginPage()).toBeTruthy();
      await expect(loginPage.loginButton()).toBeVisible();
    } else {
      // SSO shows "Sign In" button that redirects to UAA
      const ssoButton = page.locator('button').filter({ hasText: /sign in/i }).first();
      await expect(ssoButton).toBeVisible();
    }
  });

  test.describe('Local Auth', () => {
    test.beforeEach(async ({ authType }) => {
      test.skip(authType !== 'local', 'Local auth tests — skipped in SSO mode');
    });

    test('should reject bad user', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigateTo();
      await loginPage.enterLogin('badusername', 'badpassword');
      await expect(loginPage.loginButton()).toBeEnabled();
      await loginPage.clickLogin();
      expect(await loginPage.isLoginError()).toBeTruthy();
      expect(await loginPage.isLoginPage()).toBeTruthy();
    });

    test('should reject bad password', async ({ page, secrets }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigateTo();
      await loginPage.enterLogin(secrets.console.admin.username, 'badpassword');
      await expect(loginPage.loginButton()).toBeEnabled();
      await loginPage.clickLogin();
      expect(await loginPage.isLoginError()).toBeTruthy();
      expect(await loginPage.isLoginPage()).toBeTruthy();
    });

    test('should accept correct details', async ({ page, secrets }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigateTo();
      await loginPage.enterLogin(secrets.console.admin.username, secrets.console.admin.password);
      await expect(loginPage.loginButton()).toBeEnabled();
      await loginPage.clickLogin();
      await loginPage.waitForApplicationPage();
      expect(await loginPage.isLoginPage()).toBeFalsy();
    });
  });

  test.describe('SSO Auth', () => {
    test.beforeEach(async ({ authType }) => {
      test.skip(authType !== 'sso', 'SSO auth tests — skipped in local mode');
    });

    test('should redirect to UAA login page', async ({ page }) => {
      await page.goto('/login');

      // Click SSO sign in button
      const ssoButton = page.locator('button').filter({ hasText: /sign in/i }).first();
      await ssoButton.click();

      // Should redirect to UAA
      await page.waitForURL(/.*login\.sys.*|.*uaa.*/, { timeout: 15000 });
      const url = page.url();
      expect(url).toMatch(/login|uaa|oauth/);
    });

    test('should reject bad credentials on UAA', async ({ page }) => {
      await page.goto('/login');

      const ssoButton = page.locator('button').filter({ hasText: /sign in/i }).first();
      await ssoButton.click();
      await page.waitForURL(/.*login\.sys.*|.*uaa.*/, { timeout: 15000 });

      // UAA login page — standard HTML, fill() works
      const uaaUsername = page.locator('input[name="username"], input[id="username"]').first();
      const uaaPassword = page.locator('input[name="password"], input[id="password"]').first();
      const uaaSubmit = page.locator('input[type="submit"], button[type="submit"]').first();

      await uaaUsername.fill('badusername');
      await uaaPassword.fill('badpassword');
      await uaaSubmit.click();

      // Should show error on UAA page
      const errorMessage = page.locator('.alert-error, .error, [role="alert"]');
      await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });
    });

    test('should accept correct credentials via UAA', async ({ page, secrets }) => {
      await page.goto('/login');

      const ssoButton = page.locator('button').filter({ hasText: /sign in/i }).first();
      await ssoButton.click();
      await page.waitForURL(/.*login\.sys.*|.*uaa.*/, { timeout: 15000 });

      // Fill UAA login form
      const uaaUsername = page.locator('input[name="username"], input[id="username"]').first();
      const uaaPassword = page.locator('input[name="password"], input[id="password"]').first();
      const uaaSubmit = page.locator('input[type="submit"], button[type="submit"]').first();

      await uaaUsername.fill(secrets.console.admin.username);
      await uaaPassword.fill(secrets.console.admin.password);
      await uaaSubmit.click();

      // Should redirect back to Stratos
      await page.waitForURL(/^(?!.*(uaa|login\.sys|oauth))/, { timeout: 20000 });
      expect(page.url()).not.toContain('/login');
    });
  });
});
