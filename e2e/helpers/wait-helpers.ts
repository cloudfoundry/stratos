import { Page, Locator, expect } from '@playwright/test';

/**
 * Wait Helpers
 * Migrated from Protractor E2EHelpers and wait patterns
 * Provides common wait operations for E2E tests
 */
export class WaitHelpers {
  /**
   * Wait for text to appear in element
   * Migrated from: browser.wait(until.textToBePresentInElement)
   */
  static async waitForText(
    locator: Locator,
    text: string,
    options?: { timeout?: number }
  ): Promise<void> {
    await locator.waitFor({ state: 'visible' });
    await locator.filter({ hasText: text }).first().waitFor({
      timeout: options?.timeout || 5000,
    });
  }

  /**
   * Wait for URL pattern
   * Migrated from: browser.wait(() => browser.getCurrentUrl())
   */
  static async waitForURL(
    page: Page,
    pattern: string | RegExp,
    options?: { timeout?: number }
  ): Promise<void> {
    await page.waitForURL(pattern, { timeout: options?.timeout || 10000 });
  }

  /**
   * Wait for element count
   * Migrated from: browser.wait(() => element.all().count())
   */
  static async waitForCount(
    locator: Locator,
    count: number,
    options?: { timeout?: number }
  ): Promise<void> {
    await locator.first().waitFor({ timeout: options?.timeout || 5000 });
    await expect(locator).toHaveCount(count, { timeout: options?.timeout || 5000 });
  }

  /**
   * Wait for element to be clickable (visible and enabled)
   * Migrated from: browser.wait(until.elementToBeClickable)
   */
  static async waitForClickable(
    locator: Locator,
    options?: { timeout?: number }
  ): Promise<void> {
    await locator.waitFor({
      state: 'visible',
      timeout: options?.timeout || 5000,
    });
    await expect(locator).toBeEnabled({ timeout: options?.timeout || 5000 });
  }

  /**
   * Wait for page to be ready (Angular-specific)
   * Migrated from: browser.waitForAngular()
   */
  static async waitForAngular(page: Page): Promise<void> {
    await page.waitForLoadState('networkidle');
  }

  /**
   * Wait for condition to be true
   * Migrated from: browser.wait(() => condition)
   */
  static async waitForCondition(
    condition: () => Promise<boolean> | boolean,
    options?: { timeout?: number; interval?: number }
  ): Promise<void> {
    const timeout = options?.timeout || 5000;
    const interval = options?.interval || 100;
    const start = Date.now();

    while (Date.now() - start < timeout) {
      if (await condition()) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }

    throw new Error(`Condition not met within ${timeout}ms`);
  }

  /**
   * Wait for element to be stable (no longer animating)
   * Useful for elements with CSS transitions
   */
  static async waitForStable(
    locator: Locator,
    options?: { timeout?: number }
  ): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout: options?.timeout || 5000 });
    // Wait for animations to complete (Protractor pattern)
    await new Promise(resolve => setTimeout(resolve, 250));
  }
}
