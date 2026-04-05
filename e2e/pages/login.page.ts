import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';
import { fillAngularLogin } from '../helpers/angular-input.helper';
import { AuthType } from '../helpers/auth.helper';

/**
 * Login Page Object
 * Migrated from src/test-e2e/login/login.po.ts
 */
export class LoginPage extends BasePage {
  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly submitButton: Locator;
  private readonly errorMessage: Locator;
  private readonly loginLoadingIndicator: Locator;

  constructor(page: Page) {
    super(page);

    // Form field locators
    this.usernameInput = page.locator('input[name="username"]').first();
    this.passwordInput = page.locator('input[name="password"]').first();
    this.submitButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('#login-error-message');
    this.loginLoadingIndicator = page.locator('#login__loading');
  }

  /**
   * Navigate to login page
   * Migrated from: navigateTo()
   */
  async navigateTo(): Promise<void> {
    await this.page.goto('/login');
  }

  /**
   * Check if currently on login page
   * Migrated from: isLoginPage()
   */
  async isLoginPage(): Promise<boolean> {
    await this.page.waitForURL(/\/login/, { timeout: 5000 }).catch(() => {});
    return this.page.url().includes('/login');
  }

  /**
   * Get page title
   * Migrated from: getTitle()
   */
  async getTitle(): Promise<string> {
    const title = this.page.locator('app-root h1');
    return await title.textContent() || '';
  }

  /**
   * Enter login credentials
   * Migrated from: enterLogin(username, password)
   */
  async enterLogin(username: string, password: string): Promise<void> {
    // Wait for inputs to be rendered (inside @if block that depends on ssoLogin$)
    await this.usernameInput.waitFor({ state: 'visible', timeout: 20000 });
    await this.passwordInput.waitFor({ state: 'visible', timeout: 20000 });

    // Use native setter + events to trigger Angular OnPush + ngModel
    await fillAngularLogin(this.page, username, password);
  }

  /**
   * Get login button
   * Migrated from: loginButton()
   */
  loginButton(): Locator {
    return this.submitButton;
  }

  /**
   * Click login button
   * Migrated from: loginButton().click()
   */
  async clickLogin(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Get login error message text
   * Migrated from: getLoginError()
   */
  async getLoginError(): Promise<string> {
    await this.errorMessage.waitFor({ state: 'visible', timeout: 10000 });
    return await this.errorMessage.textContent() || '';
  }

  /**
   * Check if login error is displayed
   * Migrated from: isLoginError()
   */
  async isLoginError(): Promise<boolean> {
    const text = (await this.getLoginError()).trim();
    return text.length > 0;
  }

  /**
   * Complete login flow (non-SSO)
   * Migrated from: nonSSOLogin(username, password)
   */
  async login(username: string, password: string): Promise<void> {
    await this.navigateTo();
    await this.enterLogin(username, password);
    await this.clickLogin();

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
   * Migrated from: waitForLoggedIn()
   */
  async waitForLoggedIn(): Promise<void> {
    await this.page.locator('app-dashboard-base').waitFor({ timeout: 5000 });
  }

  /**
   * Wait for dashboard page
   * Migrated from: waitForDashboardPage()
   */
  async waitForDashboardPage(): Promise<void> {
    await this.page.locator('app-dashboard-base').waitFor({ timeout: 5000 });
  }

  /**
   * Wait for application page (uses dashboard base)
   * Migrated from: waitForApplicationPage()
   */
  async waitForApplicationPage(): Promise<void> {
    await this.page.locator('app-dashboard-base').waitFor({ timeout: 5000 });
  }

  /**
   * Wait for login page to appear
   * Migrated from: waitForLogin()
   */
  async waitForLogin(): Promise<void> {
    await this.page.locator('#app-login-page').waitFor({ timeout: 10000 });
  }

  /**
   * Wait for no endpoints page
   * Migrated from: waitForNoEndpoints()
   */
  async waitForNoEndpoints(): Promise<void> {
    await this.page.locator('app-no-endpoints-non-admin').waitFor({ timeout: 10000 });
  }

  /**
   * Wait for loading indicator to disappear
   * Migrated from: waitForLoading()
   */
  async waitForLoading(): Promise<void> {
    await this.waitUntilNotShown(this.loginLoadingIndicator);
  }
}
