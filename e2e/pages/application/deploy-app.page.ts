import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Deploy Application Page Object
 * Migrated from src/test-e2e/application/po/deploy-app.po.ts
 *
 * Handles the application deployment workflow
 */
export class DeployApplicationPage extends BasePage {
  private readonly stepper: Locator;
  private readonly table: Locator;
  private readonly deployStatus: Locator;
  private readonly commitList: Locator;
  private readonly overridesForm: Locator;
  private readonly redeployCommitLink: Locator;

  constructor(page: Page) {
    super(page);

    this.stepper = page.locator('app-steppers, mat-horizontal-stepper');
    this.table = page.locator('app-table, table');
    this.deployStatus = page.locator('.deploy-app__title').filter({ hasText: 'Deployed' });
    this.commitList = page.locator('app-list app-table');
    this.overridesForm = page.locator('app-deploy-application-options-step form');
    this.redeployCommitLink = page.locator('.deploy-step2-form__commit a');
  }

  /**
   * Navigate to deploy page
   */
  async navigateTo(): Promise<void> {
    await this.page.goto('/applications/deploy');
  }

  /**
   * Check if stepper has Routes step
   */
  async hasRouteStep(): Promise<boolean> {
    const routeStep = this.stepper.locator('.mat-step-label').filter({ hasText: 'Routes' });
    return await routeStep.isVisible().catch(() => false);
  }

  /**
   * Get commit list table
   */
  getCommitList(): Locator {
    return this.commitList;
  }

  /**
   * Get overrides form
   */
  getOverridesForm(): Locator {
    return this.overridesForm;
  }

  /**
   * Wait until deployment is complete
   * @param timeout Timeout in milliseconds (default: 120000ms = 2 minutes)
   */
  async waitUntilDeployed(timeout: number = 120000): Promise<void> {
    await this.deployStatus.waitFor({ state: 'visible', timeout });
  }

  /**
   * Get redeploy commit text from source step
   */
  async sourceStepGetRedeployCommit(): Promise<string> {
    return await this.redeployCommitLink.textContent() || '';
  }

  /**
   * Check if on deploy page
   */
  async isOnDeployPage(): Promise<boolean> {
    return this.page.url().includes('/applications/deploy');
  }

  /**
   * Get current step index
   */
  async getCurrentStep(): Promise<number> {
    const steps = this.stepper.locator('.mat-step-header');
    const count = await steps.count();

    for (let i = 0; i < count; i++) {
      const step = steps.nth(i);
      const isSelected = await step.getAttribute('aria-selected');
      if (isSelected === 'true') {
        return i;
      }
    }

    return 0;
  }

  /**
   * Go to next step in stepper
   */
  async clickNext(): Promise<void> {
    const nextButton = this.page.locator('button').filter({ hasText: /next/i });
    await nextButton.click();
  }

  /**
   * Go to previous step in stepper
   */
  async clickPrevious(): Promise<void> {
    const prevButton = this.page.locator('button').filter({ hasText: /previous|back/i });
    await prevButton.click();
  }

  /**
   * Cancel deployment
   */
  async cancel(): Promise<void> {
    const cancelButton = this.page.locator('button').filter({ hasText: /cancel/i });
    await cancelButton.click();
  }

  /**
   * Complete deployment
   */
  async deploy(): Promise<void> {
    const deployButton = this.page.locator('button').filter({ hasText: /deploy/i });
    await deployButton.click();
  }

  /**
   * Wait for stepper to be visible
   */
  async waitForStepper(): Promise<void> {
    await this.stepper.waitFor({ state: 'visible', timeout: 5000 });
  }
}
