import { Page, Locator } from '@playwright/test';

/**
 * Page Header Component
 * Top page header with title and actions
 */
export class PageHeaderComponent {
  private header: Locator;

  constructor(private page: Page) {
    this.header = page.locator('app-page-header, .page-header');
  }

  getTitleText(): Locator {
    return this.header.locator('.page-header__title, h1');
  }

  async getTitle(): Promise<string> {
    return await this.getTitleText().textContent() || '';
  }

  getActionsSection(): Locator {
    return this.header.locator('.page-header__actions');
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
 * Sub-header with additional actions
 */
export class PageHeaderSubComponent {
  private subHeader: Locator;

  constructor(private page: Page) {
    this.subHeader = page.locator('app-page-header-sub, .page-header__sub');
  }

  async clickIconButton(iconText: string): Promise<void> {
    const button = this.subHeader.locator('button mat-icon').filter({ hasText: iconText });
    await button.click();
  }

  getIconButton(iconText: string): Locator {
    return this.subHeader.locator('button mat-icon').filter({ hasText: iconText });
  }
}
