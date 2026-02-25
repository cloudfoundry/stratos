import { Page, Locator } from '@playwright/test';

/**
 * Base Page Object class
 * Migrated from Protractor component.po.ts
 * Provides common page interaction patterns for all page objects
 */
export class BasePage {
  constructor(protected page: Page) {}

  /**
   * Wait for element to be visible
   * Migrated from: browser.wait(until.presenceOf/visibilityOf)
   */
  async waitUntilShown(
    locator: Locator,
    options?: { timeout?: number; description?: string }
  ): Promise<void> {
    const timeout = options?.timeout || 5000;
    const description = options?.description || 'Element';

    await locator.waitFor({
      state: 'visible',
      timeout,
    });

    // Slight delay for animations (Protractor pattern)
    await this.page.waitForTimeout(250);
  }

  /**
   * Wait for element to be hidden
   * Migrated from: browser.wait(until.invisibilityOf)
   */
  async waitUntilNotShown(
    locator: Locator,
    options?: { timeout?: number; description?: string }
  ): Promise<void> {
    const timeout = options?.timeout || 20000;

    await locator.waitFor({
      state: 'hidden',
      timeout,
    });
  }

  /**
   * Wait for text to appear in element
   * Migrated from: browser.wait(until.textToBePresentInElement)
   */
  async waitForText(
    locator: Locator,
    text: string,
    options?: { timeout?: number; description?: string }
  ): Promise<void> {
    const timeout = options?.timeout || 5000;
    const description = options?.description || 'Element';

    await locator.waitFor({ state: 'visible' });
    await locator.filter({ hasText: text }).first().waitFor({
      timeout,
    });
  }

  /**
   * Scroll element into view
   * Migrated from: scrollIntoView helper
   */
  async scrollIntoView(locator: Locator): Promise<void> {
    await locator.scrollIntoViewIfNeeded();
  }

  /**
   * Scroll to top of page
   * Migrated from: scrollToTop helper
   */
  async scrollToTop(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, 0));
  }

  /**
   * Scroll to bottom of page
   * Migrated from: scrollToBottom helper
   */
  async scrollToBottom(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  }

  /**
   * Check if element has class
   * Migrated from: hasClass helper
   */
  async hasClass(locator: Locator, className: string): Promise<boolean> {
    const classes = await locator.getAttribute('class');
    return classes?.split(' ').includes(className) || false;
  }

  /**
   * Wait for Angular to be stable
   * Migrated from: browser.waitForAngular()
   */
  async waitForAngular(): Promise<void> {
    // Wait for network to be idle (similar to Angular stability)
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Check if element is present
   * Migrated from: element.isPresent()
   */
  async isPresent(locator: Locator): Promise<boolean> {
    try {
      await locator.waitFor({ state: 'attached', timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if element is displayed/visible
   * Migrated from: element.isDisplayed()
   */
  async isDisplayed(locator: Locator): Promise<boolean> {
    try {
      return await locator.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Get all matching elements
   * Migrated from: element.all()
   */
  all(selector: string): Locator {
    return this.page.locator(selector);
  }

  /**
   * Wait for URL pattern
   * Migrated from: browser.wait(() => browser.getCurrentUrl()...)
   */
  async waitForURL(
    pattern: string | RegExp,
    options?: { timeout?: number }
  ): Promise<void> {
    const timeout = options?.timeout || 10000;
    await this.page.waitForURL(pattern, { timeout });
  }
}
