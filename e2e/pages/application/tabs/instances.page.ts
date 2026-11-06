import { Page, Locator } from '@playwright/test';
import { ApplicationBasePage } from '../application.page';

/**
 * Application Instances Tab Page Object
 * Migrated from src/test-e2e/application/po/application-page-instances.po.ts
 *
 * Represents the application instances tab with instance list
 */
export class ApplicationPageInstancesTab extends ApplicationBasePage {
  private readonly cardStatus: Locator;
  private readonly cardInstances: Locator;
  private readonly cardUsage: Locator;
  private readonly listComponent: Locator;
  private readonly tableRows: Locator;

  constructor(page: Page, cfGuid: string, appGuid: string) {
    super(page, cfGuid, appGuid, 'instances');

    this.cardStatus = page.locator('app-card-app-status');
    this.cardInstances = page.locator('app-card-app-instances');
    this.cardUsage = page.locator('app-card-app-usage');
    this.listComponent = page.locator('app-list');
    this.tableRows = this.listComponent.locator('app-table tbody tr');
  }

  /**
   * Get list component
   */
  getList(): Locator {
    return this.listComponent;
  }

  /**
   * Parse uptime string to seconds
   * @param s Uptime string like "1m 30s"
   */
  parseUptime(s: string): number {
    let uptime = 0;
    const parts = s.split(' ');

    parts.forEach(p => {
      if (p.endsWith('s')) {
        uptime += this.getTime(p);
      } else if (p.endsWith('m')) {
        uptime += this.getTime(p) * 60;
      }
    });

    return uptime;
  }

  /**
   * Extract time value from string
   */
  private getTime(str: string): number {
    const v = str.substring(0, str.length - 1);
    return parseInt(v, 10);
  }

  /**
   * Get uptime for specific instance
   * @param index Instance index
   */
  async getUptime(index: number): Promise<number> {
    const rows = await this.tableRows.all();

    if (index <= rows.length - 1) {
      const row = rows[index];
      const cells = await row.locator('app-table-cell').all();

      if (cells.length >= 6) {
        const uptimeText = await cells[5].textContent();
        return this.parseUptime(uptimeText || '');
      }
    }

    return -1;
  }

  /**
   * Get status card
   */
  getCardStatus(): Locator {
    return this.cardStatus;
  }

  /**
   * Get instances card
   */
  getCardInstances(): Locator {
    return this.cardInstances;
  }

  /**
   * Get usage card
   */
  getCardUsage(): Locator {
    return this.cardUsage;
  }
}
