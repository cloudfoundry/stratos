import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base.page';
import { BreadcrumbsComponent } from '../../components/breadcrumbs.component';

/**
 * Application Base Page Object
 * Migrated from src/test-e2e/application/po/application-page.po.ts
 *
 * Base page for all application detail pages with tab navigation
 */
export class ApplicationBasePage extends BasePage {
  protected readonly tabs: Locator;
  protected readonly pageHeader: Locator;
  protected readonly subHeader: Locator;
  protected readonly deleteButton: Locator;
  public readonly breadcrumbs: BreadcrumbsComponent;

  constructor(
    page: Page,
    public cfGuid: string,
    public appGuid: string,
    public initialTab: string = 'summary'
  ) {
    super(page);

    this.tabs = page.locator('app-page-tabs, mat-tab-group');
    this.pageHeader = page.locator('app-page-header');
    this.subHeader = page.locator('app-page-sub-header');
    this.deleteButton = this.subHeader.locator('button[aria-label="delete"]');
    this.breadcrumbs = new BreadcrumbsComponent(page);
  }

  /**
   * Wait for page to be fully loaded
   */
  async waitForPage(): Promise<void> {
    await this.pageHeader.waitFor({ state: 'visible', timeout: 10000 });
    await this.page.waitForTimeout(500); // Allow time for initial render
  }

  /**
   * Navigate to application page
   */
  async navigateTo(): Promise<void> {
    await this.page.goto(`/applications/${this.cfGuid}/${this.appGuid}/${this.initialTab}`);
  }

  /**
   * Detect cfGuid and appGuid from current URL
   */
  static async detect(page: Page): Promise<ApplicationBasePage> {
    const url = page.url();
    const urlParts = url.split('/').filter(p => p);

    const appsIndex = urlParts.indexOf('applications');
    if (appsIndex === -1 || urlParts.length < appsIndex + 3) {
      throw new Error('Not on an application page');
    }

    const cfGuid = urlParts[appsIndex + 1];
    const appGuid = urlParts[appsIndex + 2];

    return new ApplicationBasePage(page, cfGuid, appGuid);
  }

  /**
   * Navigate to Summary tab
   */
  async goToSummaryTab(): Promise<void> {
    await this.goToTab('Summary', 'summary');
  }

  /**
   * Navigate to Instances tab
   */
  async goToInstancesTab(): Promise<void> {
    await this.goToTab('Instances', 'instances');
  }

  /**
   * Navigate to Routes tab
   */
  async goToRoutesTab(): Promise<void> {
    await this.goToTab('Routes', 'routes');
  }

  /**
   * Navigate to Log Stream tab
   */
  async goToLogStreamTab(): Promise<void> {
    await this.goToTab('Log Stream', 'log-stream');
  }

  /**
   * Navigate to Services tab
   */
  async goToServicesTab(): Promise<void> {
    await this.goToTab('Services', 'services');
  }

  /**
   * Navigate to Variables tab
   */
  async goToVariablesTab(): Promise<void> {
    await this.goToTab('Variables', 'variables');
  }

  /**
   * Navigate to Events tab
   */
  async goToEventsTab(): Promise<void> {
    await this.goToTab('Events', 'events');
  }

  /**
   * Navigate to GitHub tab
   */
  async goToGithubTab(): Promise<void> {
    await this.goToTab('GitHub', 'gitscm');
  }

  /**
   * Navigate to Revisions tab
   */
  async goToRevisionsTab(): Promise<void> {
    await this.goToTab('Revisions', 'revisions');
  }

  /**
   * Navigate to Autoscaler tab
   */
  async goToAutoscalerTab(): Promise<void> {
    await this.goToTab('Autoscale', 'autoscale');
  }

  /**
   * Wait for Autoscaler tab to appear
   */
  async waitForAutoscalerTab(): Promise<void> {
    await this.tabs.locator('button, a').filter({ hasText: 'Autoscale' }).waitFor({ timeout: 15000 });
  }

  /**
   * Navigate to a specific tab
   */
  private async goToTab(label: string, urlSuffix: string): Promise<void> {
    const tabButton = this.tabs.locator('button, a').filter({ hasText: label });
    await tabButton.click();

    const expectedUrl = `/applications/${this.cfGuid}/${this.appGuid}/${urlSuffix}`;
    await this.page.waitForURL(new RegExp(expectedUrl.replace(/\//g, '\\/')));
  }

  /**
   * Get application name from header
   */
  async getAppName(): Promise<string> {
    const titleElement = this.pageHeader.locator('h1, .page-header__title');
    return await titleElement.textContent() || '';
  }

  /**
   * Click delete button to start delete flow
   */
  async delete(): Promise<void> {
    await this.deleteButton.click();
  }
}

// Alias for backward compatibility
export { ApplicationBasePage as ApplicationPageSummary };
