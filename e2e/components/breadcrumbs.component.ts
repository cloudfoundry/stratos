import { Page, Locator } from '@playwright/test';

/**
 * Breadcrumbs Component
 * Navigation breadcrumb trail
 */
export class BreadcrumbsComponent {
  private breadcrumbs: Locator;

  constructor(private page: Page) {
    // Page-header trail renders inside <app-breadcrumbs> (crumbs are .breadcrumb,
    // links are <a>); the dashboard sub-nav uses .page-header-sub-nav-breadcrumbs.
    // Not '.breadcrumbs' — that inner div lives inside app-breadcrumbs and would
    // double-match every crumb.
    this.breadcrumbs = page.locator(
      'app-breadcrumbs, .page-header-breadcrumbs, .page-header-sub-nav-breadcrumbs'
    );
  }

  getBreadcrumbs(): Locator {
    return this.breadcrumbs.locator(
      'a, .breadcrumb, .breadcrumb-item, .page-header-breadcrumb, .page-header-sub-nav-breadcrumb'
    );
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
    // The trail emits only after the app entity + org + space + endpoint have
    // all loaded (combineLatest in application-tabs-base), which lags the page
    // shell — especially against a slow CF data path. Wait for the first crumb
    // before snapshotting so we don't read an empty (not-yet-rendered) trail.
    await locators.first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => { /* leave empty; caller asserts */ });
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
