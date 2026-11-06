import { Page, Locator } from '@playwright/test';
import { ListTableComponent } from './list.component';

/**
 * Action Monitor Component
 * Displays action execution status in a table format
 */
export class ActionMonitorComponent {
  public readonly table: ListTableComponent;
  private readonly monitor: Locator;

  constructor(private page: Page, locator?: Locator) {
    this.monitor = locator || page.locator('app-action-monitor');
    this.table = new ListTableComponent(page, this.monitor);
  }

  async waitUntilShown(): Promise<void> {
    await this.monitor.waitFor({ state: 'visible', timeout: 5000 });
  }

  async isPresent(): Promise<boolean> {
    return await this.monitor.isVisible().catch(() => false);
  }
}
