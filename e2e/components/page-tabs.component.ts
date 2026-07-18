import { Page, Locator } from '@playwright/test';

/**
 * Locate a page tab link by its exact label.
 *
 * Tabs render as side-nav links (app-page-side-nav) carrying a
 * data-test="page-tab-<label>" hook; exact attribute match avoids the
 * "Services" vs "User Services" substring collision.
 */
export function pageTab(page: Page, label: string): Locator {
  return page.locator(`app-page-side-nav [data-test="page-tab-${label}"]`);
}

/**
 * Page Tabs Component
 * Side-nav tab navigation (app-page-side-nav)
 */
export class PageTabsComponent {
  private tabs: Locator;

  constructor(private page: Page) {
    this.tabs = page.locator('app-page-side-nav');
  }

  getItem(label: string): Locator {
    return pageTab(this.page, label);
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
    // Direct child span holds the label; the icon lives in app-custom-icon
    const activeLabel = this.tabs.locator('.page-side-nav__item--active > span');
    return (await activeLabel.textContent())?.trim() || '';
  }

  async isTabActive(label: string): Promise<boolean> {
    const cls = await this.getItem(label).getAttribute('class');
    return (cls || '').includes('page-side-nav__item--active');
  }
}
