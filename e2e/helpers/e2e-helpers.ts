import { Page, Locator } from '@playwright/test';

/**
 * E2E Helpers
 * Migrated from Protractor E2EHelpers
 * Provides common utilities for E2E tests
 */
export class E2EHelpers {
  constructor(private page: Page) {}

  /**
   * Get form by name attribute
   * Migrated from: getForm(formName)
   */
  getForm(formName: string): Locator {
    return this.page.locator(`form[name="${formName}"]`);
  }

  /**
   * Get form fields (inputs) within a form
   * Migrated from: getFormFields(formName)
   */
  getFormFields(formName: string): Locator {
    return this.getForm(formName).locator('input, textarea, select');
  }

  /**
   * Get specific form field by index
   * Migrated from: getFormFields(formName).get(index)
   */
  getFormField(formName: string, index: number): Locator {
    return this.getFormFields(formName).nth(index);
  }

  /**
   * Scroll element into view
   * Migrated from: scrollIntoView(element)
   */
  async scrollIntoView(locator: Locator): Promise<void> {
    await locator.scrollIntoViewIfNeeded();
  }

  /**
   * Scroll to top of page
   * Migrated from: scrollToTop()
   */
  async scrollToTop(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, 0));
  }

  /**
   * Scroll to bottom of page
   * Migrated from: scrollToBottom()
   */
  async scrollToBottom(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  }

  /**
   * Get element by CSS selector
   * Migrated from: element(by.css(selector))
   */
  element(selector: string): Locator {
    return this.page.locator(selector);
  }

  /**
   * Get all elements by CSS selector
   * Migrated from: element.all(by.css(selector))
   */
  elements(selector: string): Locator {
    return this.page.locator(selector);
  }

  /**
   * Get element by ID
   * Migrated from: element(by.id(id))
   */
  elementById(id: string): Locator {
    return this.page.locator(`#${id}`);
  }

  /**
   * Get element by tag name
   * Migrated from: element(by.tagName(tag))
   */
  elementByTag(tag: string): Locator {
    return this.page.locator(tag);
  }

  /**
   * Wait for page to load
   * Migrated from: browser.wait patterns
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get current URL
   * Migrated from: browser.getCurrentUrl()
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Navigate to URL
   * Migrated from: browser.get(url)
   */
  async navigateTo(url: string): Promise<void> {
    await this.page.goto(url);
  }

  /**
   * Refresh page
   * Migrated from: browser.refresh()
   */
  async refresh(): Promise<void> {
    await this.page.reload();
  }

  /**
   * Execute JavaScript in browser
   * Migrated from: browser.executeScript()
   */
  async executeScript<T = any>(script: string | Function, ...args: any[]): Promise<T> {
    if (typeof script === 'function') {
      return await this.page.evaluate(script, ...args) as T;
    }
    return await this.page.evaluate(script) as T;
  }

  /**
   * Take screenshot
   * Migrated from: browser.takeScreenshot()
   */
  async takeScreenshot(options?: { path?: string; fullPage?: boolean }): Promise<Buffer> {
    return await this.page.screenshot(options);
  }

  /**
   * Wait for timeout
   * Migrated from: browser.sleep(ms)
   */
  async sleep(ms: number): Promise<void> {
    await this.page.waitForTimeout(ms);
  }
}
