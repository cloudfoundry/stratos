import { Page, Locator } from '@playwright/test';

/**
 * Locate a page tab link by its exact label.
 *
 * Tabs render as side-nav links (app-page-side-nav) carrying a hook of
 * 'page-tab-' plus the label; exact attribute match avoids the "Services"
 * vs "User Services" substring collision. The visible-label filter stays on
 * top of the hook so a tab that loses its rendered text goes red instead of
 * matching invisibly through the attribute.
 *
 * When the side nav has a header, the label span starts with a screen-reader
 * prefix (`<span class="sr-only">Application </span>Variables`), so its text
 * is "Application Variables". The filter therefore requires the label at the
 * end of the span's text, after the start or a space.
 */
export function pageTab(page: Page, label: string): Locator {
  const visibleLabel = new RegExp(`(?:^|\\s)${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
  return page
    .locator(`app-page-side-nav [data-test="page-tab-${label}"]`)
    .filter({ has: page.locator('span', { hasText: visibleLabel }) });
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
    // Direct child span holds the label; the icon lives in app-custom-icon.
    // Leave out the screen-reader prefix the span starts with under a header.
    const activeLabel = this.tabs.locator('.page-side-nav__item--active > span');
    return activeLabel.evaluate(el =>
      Array.from(el.childNodes)
        .filter(n => !(n instanceof Element && n.classList.contains('sr-only')))
        .map(n => n.textContent ?? '')
        .join('')
        .trim());
  }

  async isTabActive(label: string): Promise<boolean> {
    const cls = await this.getItem(label).getAttribute('class');
    return (cls || '').includes('page-side-nav__item--active');
  }
}
