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

  test('should reach log in page', async ({ unauthenticatedPage, authType }) => {
    const loginPage = new LoginPage(unauthenticatedPage);
    await loginPage.navigateTo();

    if (authType === 'local') {
      // Local auth shows username/password form
      expect(await loginPage.isLoginPage()).toBeTruthy();
      await expect(loginPage.loginButton()).toBeVisible();
    } else {
      // SSO shows "Sign In" button that redirects to UAA
      const ssoButton = unauthenticatedPage.locator('button').filter({ hasText: /sign in/i }).first();
      await expect(ssoButton).toBeVisible();
    }
  });

  test.describe('Local Auth', () => {
    test.beforeEach(async ({ authType, unauthenticatedPage }) => {
      test.skip(authType !== 'local', 'Local auth tests — skipped in SSO mode');
      // Also verify the login form actually renders (some environments SSO-redirect even in local mode)
      await unauthenticatedPage.goto('/login');
      const formReady = await unauthenticatedPage.locator('input[name="username"]').isVisible({ timeout: 10000 }).catch(() => false);
      test.skip(!formReady, 'Local auth form not rendered — environment may redirect to SSO');
    });

    test('should reject bad user', async ({ unauthenticatedPage }) => {
      const loginPage = new LoginPage(unauthenticatedPage);
      await loginPage.navigateTo();
      await loginPage.enterLogin('badusername', 'badpassword');
      await expect(loginPage.loginButton()).toBeEnabled();
      await loginPage.clickLogin();
      expect(await loginPage.isLoginError()).toBeTruthy();
      expect(await loginPage.isLoginPage()).toBeTruthy();
    });

    test('should reject bad password', async ({ unauthenticatedPage, secrets }) => {
      const loginPage = new LoginPage(unauthenticatedPage);
      await loginPage.navigateTo();
      await loginPage.enterLogin(secrets.console.admin.username, 'badpassword');
      await expect(loginPage.loginButton()).toBeEnabled();
      await loginPage.clickLogin();
      expect(await loginPage.isLoginError()).toBeTruthy();
      expect(await loginPage.isLoginPage()).toBeTruthy();
    });

    test('should accept correct details', async ({ unauthenticatedPage, secrets }) => {
      const loginPage = new LoginPage(unauthenticatedPage);
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

    test('should redirect to UAA login page', async ({ unauthenticatedPage }) => {
      await unauthenticatedPage.goto('/login');

      // Click SSO sign in button
      const ssoButton = page.locator('button').filter({ hasText: /sign in/i }).first();
      await ssoButton.click();

      // Should redirect to UAA
      await page.waitForURL(/.*login\.sys.*|.*uaa.*/, { timeout: 15000 });
      const url = page.url();
      expect(url).toMatch(/login|uaa|oauth/);
    });

    test('should reject bad credentials on UAA', async ({ unauthenticatedPage }) => {
      await unauthenticatedPage.goto('/login');

      const ssoButton = unauthenticatedPage.locator('button').filter({ hasText: /sign in/i }).first();
      await ssoButton.click();
      await unauthenticatedPage.waitForURL(/.*login\.sys.*|.*uaa.*/, { timeout: 15000 });

      // UAA login page — standard HTML, fill() works
      const uaaUsername = unauthenticatedPage.locator('input[name="username"], input[id="username"]').first();
      const uaaPassword = unauthenticatedPage.locator('input[name="password"], input[id="password"]').first();
      const uaaSubmit = unauthenticatedPage.locator('input[type="submit"], button[type="submit"]').first();

      await uaaUsername.fill('badusername');
      await uaaPassword.fill('badpassword');
      await uaaSubmit.click();

      // Should show error on UAA page
      const errorMessage = unauthenticatedPage.locator('.alert-error, .error, [role="alert"]');
      await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });
    });

    test('should accept correct credentials via UAA', async ({ unauthenticatedPage, secrets }) => {
      await unauthenticatedPage.goto('/login');

      const ssoButton = unauthenticatedPage.locator('button').filter({ hasText: /sign in/i }).first();
      await ssoButton.click();
      await unauthenticatedPage.waitForURL(/.*login\.sys.*|.*uaa.*/, { timeout: 15000 });

      // Fill UAA login form
      const uaaUsername = unauthenticatedPage.locator('input[name="username"], input[id="username"]').first();
      const uaaPassword = unauthenticatedPage.locator('input[name="password"], input[id="password"]').first();
      const uaaSubmit = unauthenticatedPage.locator('input[type="submit"], button[type="submit"]').first();

      await uaaUsername.fill(secrets.console.admin.username);
      await uaaPassword.fill(secrets.console.admin.password);
      await uaaSubmit.click();

      // Should redirect back to Stratos
      await unauthenticatedPage.waitForURL(/^(?!.*(uaa|login\.sys|oauth))/, { timeout: 20000 });
      expect(unauthenticatedPage.url()).not.toContain('/login');
    });
  });
});
