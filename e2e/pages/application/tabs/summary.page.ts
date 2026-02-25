import { Page, Locator } from '@playwright/test';
import { ApplicationBasePage } from '../application.page';

/**
 * Application Summary Tab Page Object
 * Migrated from src/test-e2e/application/po/application-page-summary.po.ts
 *
 * Represents the application summary tab with status and info cards
 */
export class ApplicationPageSummaryTab extends ApplicationBasePage {
  private readonly cardStatus: Locator;
  private readonly cardInstances: Locator;
  private readonly cardUptime: Locator;
  private readonly cardInfo: Locator;
  private readonly cardCfInfo: Locator;
  private readonly cardBuildInfo: Locator;
  private readonly cardDeployInfo: Locator;

  constructor(page: Page, cfGuid: string, appGuid: string) {
    super(page, cfGuid, appGuid, 'summary');

    this.cardStatus = page.locator('app-card-app-status');
    this.cardInstances = page.locator('app-card-app-instances');
    this.cardUptime = page.locator('app-card-app-uptime');
    this.cardInfo = page.locator('app-card-app-info');
    this.cardCfInfo = page.locator('app-card-app-cf-info');
    this.cardBuildInfo = page.locator('app-card-app-build-info');
    this.cardDeployInfo = page.locator('app-card-app-deploy-info');
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
   * Get uptime card
   */
  getCardUptime(): Locator {
    return this.cardUptime;
  }

  /**
   * Get info card
   */
  getCardInfo(): Locator {
    return this.cardInfo;
  }

  /**
   * Get CF info card
   */
  getCardCfInfo(): Locator {
    return this.cardCfInfo;
  }

  /**
   * Get build info card
   */
  getCardBuildInfo(): Locator {
    return this.cardBuildInfo;
  }

  /**
   * Get deploy info card
   */
  getCardDeployInfo(): Locator {
    return this.cardDeployInfo;
  }
}
