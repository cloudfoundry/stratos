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

    this.dialog = page.locator('mat-dialog-container, app-map-route-dialog').first();
    this.routeList = this.dialog.locator('app-list, mat-list, mat-table');
    this.domainFilter = this.dialog.locator('mat-select[placeholder*="domain"], select[name="domain"]').first();
    this.searchInput = this.dialog.locator('input[type="text"], input[placeholder*="search"]').first();
    this.mapButton = this.dialog.locator('button').filter({ hasText: /map|add/i });
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
    const routeItem = this.routeList.locator('mat-list-item, mat-row, tr').filter({ hasText: routeUrl });
    await routeItem.click();
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
