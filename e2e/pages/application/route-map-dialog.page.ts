import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Route Map Dialog Page Object
 *
 * Handles the dialog for mapping existing routes to applications
 */
export class RouteMapDialogPage extends BasePage {
  private readonly dialog: Locator;
  private readonly routeList: Locator;
  private readonly domainFilter: Locator;
  private readonly searchInput: Locator;
  private readonly mapButton: Locator;
  private readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);

    // Mapping an existing route is the "attach an existing route" section of
    // the Add Route page — there is no separate dialog in the modern UI.
    this.dialog = page.locator('app-add-route-stepper').first();
    this.routeList = this.dialog.locator('[data-test="available-routes"] app-signal-list');
    this.domainFilter = this.dialog.locator('select[name="domain"]').first(); // gone in modern UI; guarded no-op
    this.searchInput = this.dialog.locator('[data-test="available-routes"] input[placeholder*="Filter"]').first();
    this.mapButton = this.dialog.locator('button').filter({ hasText: /create|map|attach/i });
    this.cancelButton = this.dialog.locator('button').filter({ hasText: /cancel|close/i });
  }

  /**
   * Wait for dialog to be visible
   */
  async waitForDialog(): Promise<void> {
    await this.dialog.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Check if dialog is visible
   */
  async isVisible(): Promise<boolean> {
    return await this.dialog.isVisible().catch(() => false);
  }

  /**
   * Filter routes by domain
   */
  async filterByDomain(domainName: string): Promise<void> {
    const filterExists = await this.domainFilter.isVisible().catch(() => false);
    if (filterExists) {
      await this.domainFilter.click();
      await this.page.waitForTimeout(500);

      const option = this.page.locator('mat-option, option').filter({ hasText: domainName });
      await option.click();
      await this.page.waitForTimeout(1000);
    }
  }

  /**
   * Search for routes
   */
  async searchRoutes(searchTerm: string): Promise<void> {
    const searchExists = await this.searchInput.isVisible().catch(() => false);
    if (searchExists) {
      await this.searchInput.fill(searchTerm);
      await this.page.waitForTimeout(1000);
    }
  }

  /**
   * Get list of available routes
   */
  getRouteList(): Locator {
    return this.routeList;
  }

  /**
   * Select a route from the list
   */
  async selectRoute(routeUrl: string): Promise<void> {
    // Narrow the list first — the route may be beyond the first page
    await this.searchInput.fill(routeUrl).catch(() => {});
    const routeItem = this.routeList.locator('tbody tr').filter({ hasText: routeUrl });
    // Rows carry a selection radio in the first cell
    await routeItem.locator('input[type="radio"]').first().click({ timeout: 30000 });
  }

  /**
   * Click map button
   */
  async clickMap(): Promise<void> {
    await this.mapButton.first().click();
  }

  /**
   * Click cancel button
   */
  async clickCancel(): Promise<void> {
    const cancelExists = await this.cancelButton.isVisible().catch(() => false);
    if (cancelExists) {
      await this.cancelButton.first().click();
    } else {
      await this.page.keyboard.press('Escape');
    }
  }

  /**
   * Check if map button is enabled
   */
  async isMapEnabled(): Promise<boolean> {
    return await this.mapButton.first().isEnabled().catch(() => false);
  }
}
