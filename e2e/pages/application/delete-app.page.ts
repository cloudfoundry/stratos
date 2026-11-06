import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Delete Application Page Object
 * Migrated from src/test-e2e/application/po/delete-app.po.ts
 *
 * Handles the application deletion workflow
 */
export class DeleteApplicationPage extends BasePage {
  private readonly stepper: Locator;
  private readonly table: Locator;
  private readonly deleteButton: Locator;
  private readonly cancelButton: Locator;

  constructor(
    page: Page,
    public cfGuid: string,
    public appGuid?: string,
    private appName?: string
  ) {
    super(page);

    this.stepper = page.locator('app-steppers, mat-horizontal-stepper');
    this.table = page.locator('app-table, table');
    this.deleteButton = page.locator('button').filter({ hasText: /delete/i });
    this.cancelButton = page.locator('button').filter({ hasText: /cancel/i });
  }

  /**
   * Navigate to delete application page
   */
  async navigateTo(): Promise<void> {
    await this.page.goto(`/applications/${this.cfGuid}/${this.appGuid}/delete`);
  }

  /**
   * Check if stepper has Routes step
   */
  async hasRouteStep(): Promise<boolean> {
    const routeStep = this.stepper.locator('.mat-step-label').filter({ hasText: 'Routes' });
    return await routeStep.isVisible().catch(() => false);
  }

  /**
   * Get stepper component
   */
  getStepper(): Locator {
    return this.stepper;
  }

  /**
   * Get table component
   */
  getTable(): Locator {
    return this.table;
  }

  /**
   * Wait for stepper to be visible
   */
  async waitForStepper(): Promise<void> {
    await this.stepper.waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Wait for page to load
   */
  async waitForPage(): Promise<void> {
    await this.page.waitForURL(new RegExp(`/applications/${this.cfGuid}/${this.appGuid}/delete`));
    await this.stepper.waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Click delete button to confirm deletion
   */
  async confirmDelete(): Promise<void> {
    await this.deleteButton.click();
  }

  /**
   * Click cancel button to abort deletion
   */
  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  /**
   * Get application name if provided
   */
  getAppName(): string | undefined {
    return this.appName;
  }
}
