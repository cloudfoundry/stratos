import { Page } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Home Page Object
 * Migrated from src/test-e2e/home/home.po.ts
 *
 * Represents the Stratos home/dashboard page
 */
export class HomePage extends BasePage {
  private readonly navLink: string = '/home';

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to home page
   */
  async navigateTo(): Promise<void> {
    await this.page.goto(this.navLink);
  }

  /**
   * Check if currently on dashboard/home page
   * @param strictCheck If true, also accepts root path '/'
   */
  async isDashboardPage(strictCheck: boolean = true): Promise<boolean> {
    const url = this.page.url();
    const baseUrl = new URL(this.page.url()).origin;

    if (url === baseUrl + this.navLink) {
      return true;
    }

    if (strictCheck && url === baseUrl + '/') {
      return true;
    }

    return false;
  }

  /**
   * Wait for home page to load
   */
  async waitForPage(timeout: number = 20000): Promise<void> {
    await this.page.waitForURL(new RegExp(this.navLink), { timeout });
  }
}
