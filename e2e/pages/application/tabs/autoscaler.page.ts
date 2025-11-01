import { Page, Locator } from '@playwright/test';
import { ApplicationBasePage } from '../application.page';

/**
 * Application Autoscaler Tab Page Object
 * Migrated from src/test-e2e/application/po/application-page-autoscaler.po.ts
 *
 * Represents the application autoscaler tab with policy and metrics
 */
export class ApplicationPageAutoscalerTab extends ApplicationBasePage {
  private readonly banner: Locator;
  private readonly messageNoPolicy: Locator;
  private readonly cardDefault: Locator;
  private readonly cardMetric: Locator;
  private readonly tableTriggers: Locator;
  private readonly tableSchedules: Locator;
  private readonly tableEvents: Locator;

  constructor(page: Page, cfGuid: string, appGuid: string) {
    super(page, cfGuid, appGuid, 'autoscale');

    this.banner = page.locator('app-banner-autoscaler-tab');
    this.messageNoPolicy = page.locator('app-no-content-message, .app-no-content-container');
    this.cardDefault = page.locator('app-card-autoscaler-default');
    this.cardMetric = page.locator('app-card-autoscaler-metric');
    this.tableTriggers = page.locator('app-table-autoscaler-triggers');
    this.tableSchedules = page.locator('app-table-autoscaler-schedules');
    this.tableEvents = page.locator('app-table-autoscaler-events');
  }

  /**
   * Detect autoscaler tab from current URL
   */
  static async detect(page: Page): Promise<ApplicationPageAutoscalerTab> {
    const url = page.url();
    const urlParts = url.split('/').filter(p => p);

    const appsIndex = urlParts.indexOf('applications');
    if (appsIndex === -1 || urlParts.length < appsIndex + 4) {
      throw new Error('Not on an application autoscaler page');
    }

    if (urlParts[appsIndex + 3] !== 'autoscale') {
      throw new Error('Not on autoscaler tab');
    }

    const cfGuid = urlParts[appsIndex + 1];
    const appGuid = urlParts[appsIndex + 2];

    return new ApplicationPageAutoscalerTab(page, cfGuid, appGuid);
  }

  /**
   * Get banner
   */
  getBanner(): Locator {
    return this.banner;
  }

  /**
   * Get no policy message
   */
  getMessageNoPolicy(): Locator {
    return this.messageNoPolicy;
  }

  /**
   * Get default card
   */
  getCardDefault(): Locator {
    return this.cardDefault;
  }

  /**
   * Get metric card
   */
  getCardMetric(): Locator {
    return this.cardMetric;
  }

  /**
   * Get triggers table
   */
  getTableTriggers(): Locator {
    return this.tableTriggers;
  }

  /**
   * Get schedules table
   */
  getTableSchedules(): Locator {
    return this.tableSchedules;
  }

  /**
   * Get events table
   */
  getTableEvents(): Locator {
    return this.tableEvents;
  }
}
