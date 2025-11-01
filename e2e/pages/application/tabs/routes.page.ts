import { Page, Locator } from '@playwright/test';
import { ApplicationBasePage } from '../application.page';

/**
 * Application Routes Tab Page Object
 * Migrated from src/test-e2e/application/po/application-page-routes.po.ts
 *
 * Represents the application routes tab with routes list
 */
export class ApplicationPageRoutesTab extends ApplicationBasePage {
  private readonly listComponent: Locator;
  private readonly addRouteButton: Locator;
  private readonly mapRouteButton: Locator;

  constructor(page: Page, cfGuid: string, appGuid: string) {
    super(page, cfGuid, appGuid, 'routes');

    this.listComponent = page.locator('app-list');
    this.addRouteButton = page.locator('button').filter({ hasText: /add.*route|create.*route/i });
    this.mapRouteButton = page.locator('button').filter({ hasText: /map.*route/i });
  }

  /**
   * Get list component
   */
  getList(): Locator {
    return this.listComponent;
  }

  /**
   * Get route rows in the table
   */
  getRouteRows(): Locator {
    return this.listComponent.locator('mat-row, tr').filter({ has: this.page.locator('td, mat-cell') });
  }

  /**
   * Find route row by host/domain
   */
  getRouteRow(routeUrl: string): Locator {
    return this.getRouteRows().filter({ hasText: routeUrl });
  }

  /**
   * Get route details from a specific row
   */
  async getRouteDetails(routeUrl: string): Promise<{
    domain?: string;
    host?: string;
    path?: string;
    type?: string;
    status?: string;
  }> {
    const row = this.getRouteRow(routeUrl);
    const cells = row.locator('td, mat-cell');

    const details: any = {};
    const count = await cells.count();

    for (let i = 0; i < count; i++) {
      const cell = cells.nth(i);
      const text = await cell.textContent();
      if (text) {
        details[`cell${i}`] = text.trim();
      }
    }

    return details;
  }

  /**
   * Get route type (http/tcp) from route row
   */
  async getRouteType(routeUrl: string): Promise<string | null> {
    const row = this.getRouteRow(routeUrl);

    // Look for TCP or HTTP indicators
    const tcpIndicator = row.locator('text=/tcp/i, [title*="tcp" i]');
    const httpIndicator = row.locator('text=/http/i, [title*="http" i]');

    const hasTcp = await tcpIndicator.count() > 0;
    const hasHttp = await httpIndicator.count() > 0;

    if (hasTcp) return 'tcp';
    if (hasHttp) return 'http';

    // Default to http if no explicit indicator
    return 'http';
  }

  /**
   * Get route status from route row
   */
  async getRouteStatus(routeUrl: string): Promise<string | null> {
    const row = this.getRouteRow(routeUrl);

    // Look for status indicators
    const statusElement = row.locator('.status, [class*="status"], mat-icon').first();

    if (await statusElement.count() > 0) {
      const text = await statusElement.textContent();
      return text ? text.trim() : null;
    }

    return null;
  }

  /**
   * Get apps sharing a route
   */
  async getSharedApps(routeUrl: string): Promise<string[]> {
    const row = this.getRouteRow(routeUrl);

    // Look for app names or app count indicators
    const appElements = row.locator('.app-name, [class*="app"], a[href*="/applications/"]');
    const count = await appElements.count();

    const apps: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await appElements.nth(i).textContent();
      if (text) {
        apps.push(text.trim());
      }
    }

    return apps;
  }

  /**
   * Check if route is shared with multiple apps
   */
  async isRouteShared(routeUrl: string): Promise<boolean> {
    const apps = await this.getSharedApps(routeUrl);
    return apps.length > 1;
  }

  /**
   * Click add route button
   */
  async clickAddRoute(): Promise<void> {
    await this.addRouteButton.first().click();
  }

  /**
   * Click map route button
   */
  async clickMapRoute(): Promise<void> {
    await this.mapRouteButton.first().click();
  }

  /**
   * Unmap route from app
   */
  async unmapRoute(routeUrl: string): Promise<void> {
    const row = this.getRouteRow(routeUrl);
    const unmapButton = row.locator('button, mat-icon').filter({ hasText: /unmap|remove|delete/i });
    await unmapButton.first().click();
  }

  /**
   * Wait for routes to load
   */
  async waitForRoutes(): Promise<void> {
    await this.listComponent.waitFor({ state: 'visible', timeout: 10000 });
    await this.page.waitForTimeout(1000); // Allow time for data to populate
  }
}
