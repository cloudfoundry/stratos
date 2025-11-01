import { Page, Locator } from '@playwright/test';

/**
 * Page Tabs Component
 * Material tab navigation
 */
export class PageTabsComponent {
  private tabs: Locator;

  constructor(private page: Page) {
    this.tabs = page.locator('app-page-tabs, mat-tab-group');
  }

  getItem(label: string): Locator {
    return this.tabs.locator('.mat-tab-label, .mat-mdc-tab').filter({ hasText: label });
  }

  async clickItem(label: string): Promise<void> {
    const tab = this.getItem(label);
    await tab.waitFor({ state: 'visible', timeout: 10000 });
    await tab.click();
  }

  async goToItemAndWait(label: string, navLink: string, urlSuffix: string): Promise<void> {
    await this.clickItem(label);
    await this.page.waitForURL(new RegExp(`${navLink}.*/${urlSuffix}`), { timeout: 10000 });
  }

  async getActiveTab(): Promise<string> {
    const activeTab = this.tabs.locator('.mat-tab-label-active, .mat-mdc-tab[aria-selected="true"]');
    return await activeTab.textContent() || '';
  }

  async isTabActive(label: string): Promise<boolean> {
    const tab = this.getItem(label);
    const ariaSelected = await tab.getAttribute('aria-selected');
    return ariaSelected === 'true';
  }
}
