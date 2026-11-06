import { Page, Locator } from '@playwright/test';

/**
 * Page Header Component
 * Top page header with title and actions.
 *
 * The app-page-header element is a portal *source* (zero-height); its content
 * renders inside app-show-page-header in the top toolbar.
 */
export class PageHeaderComponent {
  private header: Locator;

  constructor(private page: Page) {
    this.header = page.locator('app-show-page-header');
  }

  getTitleText(): Locator {
    return this.header.locator('h1');
  }

  async getTitle(): Promise<string> {
    return await this.getTitleText().textContent() || '';
  }

  getActionsSection(): Locator {
    // Page-level actions portal into the sub-nav bar below the toolbar
    return this.page.locator('.page-header-sub-nav');
  }

  getActionButton(text: string): Locator {
    return this.getActionsSection().locator('button').filter({ hasText: text });
  }

  async clickActionButton(text: string): Promise<void> {
    const button = this.getActionButton(text);
    await button.click();
  }
}

/**
 * Page Header Sub Component
 * Sub-nav bar with per-page action buttons (edit/delete/refresh/...).
 * Buttons carry the material icon ligature as their text content.
 */
export class PageHeaderSubComponent {
  private subHeader: Locator;

  constructor(private page: Page) {
    this.subHeader = page.locator('.page-header-sub-nav');
  }

  async clickIconButton(iconText: string): Promise<void> {
    await this.getIconButton(iconText).click();
  }

  getIconButton(iconText: string): Locator {
    return this.subHeader.locator('button').filter({ hasText: iconText });
  }
}
