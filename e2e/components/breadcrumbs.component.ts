import { Page, Locator } from '@playwright/test';

/**
 * Breadcrumbs Component
 * Navigation breadcrumb trail
 */
export class BreadcrumbsComponent {
  private breadcrumbs: Locator;

  constructor(private page: Page) {
    this.breadcrumbs = page.locator('app-breadcrumbs, .breadcrumbs');
  }

  getBreadcrumbs(): Locator {
    return this.breadcrumbs.locator('a, .breadcrumb-item');
  }

  async getBreadcrumbCount(): Promise<number> {
    return await this.getBreadcrumbs().count();
  }

  async getBreadcrumbTexts(): Promise<string[]> {
    return await this.getBreadcrumbs().allTextContents();
  }

  getBreadcrumb(index: number): Locator {
    return this.getBreadcrumbs().nth(index);
  }

  async clickBreadcrumb(index: number): Promise<void> {
    const breadcrumb = this.getBreadcrumb(index);
    await breadcrumb.click();
  }

  async clickBreadcrumbByText(text: string): Promise<void> {
    const breadcrumb = this.getBreadcrumbs().filter({ hasText: text });
    await breadcrumb.click();
  }

  /**
   * Get breadcrumbs as array of objects with label and href
   * Compatible with test expectations
   */
  async getBreadcrumbsData(): Promise<Array<{ label: string; href?: string }>> {
    const locators = this.getBreadcrumbs();
    const count = await locators.count();
    const breadcrumbs: Array<{ label: string; href?: string }> = [];

    for (let i = 0; i < count; i++) {
      const locator = locators.nth(i);
      const label = (await locator.textContent())?.trim() || '';
      const href = await locator.getAttribute('href').catch((): string | null | undefined => undefined) ?? undefined;
      breadcrumbs.push({ label, href });
    }

    return breadcrumbs;
  }
}
