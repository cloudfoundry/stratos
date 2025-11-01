import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * SSO Login Page Object
 * Migrated from src/test-e2e/login/sso-login.po.ts
 *
 * Handles SSO authentication flow with UAA
 */
export class SSOLoginPage extends BasePage {
  static ssoLoginURL: string | null = null;
  static ssoLastUsername: string | null = null;

  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly submitButton: Locator;
  private readonly loginFormButton: Locator;
  private readonly errorMessage: Locator;
  private readonly welcome: Locator;
  private readonly authorizeButton: Locator;

  constructor(page: Page) {
    super(page);

    // Form field locators
    this.usernameInput = page.locator('input[name="username"]').first();
    this.passwordInput = page.locator('input[name="password"]').first();
    this.submitButton = page.locator('input[type="submit"]');
    this.loginFormButton = page.locator('form[name="loginForm"] button[type="submit"]');
    this.errorMessage = page.locator('.alert-error');
    this.welcome = page.locator('.island > h1');
    this.authorizeButton = page.locator('#authorize');
  }

  /**
   * Navigate to login page
   */
  async navigateTo(): Promise<void> {
    await this.page.goto('/login');
  }

  /**
   * Check if currently on Stratos login page
   */
  async isLoginPage(): Promise<boolean> {
    const url = this.page.url();
    const baseUrl = this.page.context().browser()?.contexts()[0]?.pages()[0]?.url() || '';
    return url === baseUrl + '/login' || url.endsWith('/login');
  }

  /**
   * Check if currently on UAA login page
   */
  async isUAALoginPage(): Promise<boolean> {
    try {
      const text = await this.welcome.textContent({ timeout: 2000 });
      return text?.startsWith('Welcome') || false;
    } catch {
      return false;
    }
  }

  /**
   * Get page title
   */
  async getTitle(): Promise<string> {
    const title = this.page.locator('app-root h1');
    return await title.textContent() || '';
  }

  /**
   * Enter login credentials in UAA form
   */
  async enterLogin(username: string, password: string): Promise<void> {
    await this.usernameInput.clear();
    await this.passwordInput.clear();
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
  }

  /**
   * Submit UAA login form
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Get login button from Stratos login form
   */
  loginButton(): Locator {
    return this.loginFormButton;
  }

  /**
   * Get login error message text
   */
  async getLoginError(): Promise<string> {
    return await this.errorMessage.textContent() || '';
  }

  /**
   * Check if login error is displayed
   */
  async isLoginError(): Promise<boolean> {
    const text = await this.getLoginError();
    return text === 'Unable to verify email or password. Please try again.';
  }

  /**
   * Complete SSO login flow
   * Handles both initial SSO setup and subsequent automatic logins
   */
  async login(username: string, password: string): Promise<void> {
    // If this is a different user, logout first
    if (SSOLoginPage.ssoLastUsername && SSOLoginPage.ssoLastUsername !== username) {
      await this.logoutUAA();
    }

    await this.navigateTo();
    await this.loginFormButton.click();

    // Check if we need to perform UAA login or if SSO is already active
    await this.page.waitForLoadState('networkidle');
    const title = await this.page.title();

    if (title.indexOf('Stratos') === -1) {
      // Redirected to UAA login - need to authenticate
      if (!SSOLoginPage.ssoLoginURL) {
        SSOLoginPage.ssoLoginURL = this.page.url();
      }

      // Enter credentials and submit
      await this.enterLogin(username, password);
      await this.submit();

      SSOLoginPage.ssoLastUsername = username;

      // UAA might ask us to authorize scopes
      await this.page.waitForTimeout(3000);

      const authorizeVisible = await this.authorizeButton.isVisible().catch(() => false);
      if (authorizeVisible) {
        await this.authorizeButton.click();
      }
    }

    // Wait for navigation away from login
    await this.page.waitForURL(/^(?!.*\/login)/, { timeout: 10000 });

    // Wait for the page to be ready
    const url = this.page.url();
    if (url.includes('/noendpoints')) {
      await this.waitForNoEndpoints();
    } else {
      await this.waitForApplicationPage();
    }
  }

  /**
   * Wait for user to be logged in
   */
  async waitForLoggedIn(): Promise<void> {
    await this.page.locator('app-dashboard-base').waitFor({ timeout: 5000 });
  }

  /**
   * Wait for dashboard page
   */
  async waitForDashboardPage(): Promise<void> {
    await this.page.locator('app-dashboard-base').waitFor({ timeout: 5000 });
  }

  /**
   * Wait for application page (uses dashboard base)
   */
  async waitForApplicationPage(): Promise<void> {
    await this.page.locator('app-dashboard-base').waitFor({ timeout: 5000 });
  }

  /**
   * Wait for login page to appear
   */
  async waitForLogin(): Promise<void> {
    await this.page.locator('app-login-page').waitFor({ timeout: 10000 });
  }

  /**
   * Wait for no endpoints page
   */
  async waitForNoEndpoints(): Promise<void> {
    await this.page.locator('app-no-endpoints-non-admin').waitFor({ timeout: 10000 });
  }

  /**
   * Logout from UAA
   */
  async logoutUAA(): Promise<void> {
    if (SSOLoginPage.ssoLoginURL) {
      const logoutUrl = this.getLogoutUrl();
      await this.page.goto(logoutUrl);
    }
  }

  /**
   * Get UAA logout URL
   */
  private getLogoutUrl(): string {
    if (!SSOLoginPage.ssoLoginURL) {
      return '/logout';
    }

    const parts = SSOLoginPage.ssoLoginURL.split('/');
    parts[parts.length - 1] = 'logout.do';
    return parts.join('/');
  }
}
