import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Application Creation Types
 */
export enum APPLICATION_CREATION_TYPES {
  SHELL = 'shell',
  DEPLOY = 'deploy',
  DEPLOY_URL = 'deploy-url',
  DOCKER = 'docker'
}

/**
 * Create Application Page Object
 * Migrated from src/test-e2e/application/po/create-application.po.ts
 *
 * Handles the application creation workflow
 */
export class CreateApplicationPage extends BasePage {
  private readonly creationTypeButtons: Locator;
  private readonly stepper: Locator;

  constructor(page: Page, url: string = '/applications/new') {
    super(page);
    this.creationTypeButtons = page.locator('[data-creation-type], button[value]');
    this.stepper = page.locator('app-steppers, mat-horizontal-stepper');
  }

  /**
   * Navigate to create application page
   */
  async navigateTo(): Promise<void> {
    await this.page.goto('/applications/new');
  }

  /**
   * Select shell application creation type
   */
  async selectShell(): Promise<void> {
    await this.selectCreationType(APPLICATION_CREATION_TYPES.SHELL);
  }

  /**
   * Select deploy application creation type
   */
  async selectDeploy(): Promise<void> {
    await this.selectCreationType(APPLICATION_CREATION_TYPES.DEPLOY);
  }

  /**
   * Select deploy from URL creation type
   */
  async selectDeployUrl(): Promise<void> {
    await this.selectCreationType(APPLICATION_CREATION_TYPES.DEPLOY_URL);
  }

  /**
   * Select deploy Docker image creation type
   */
  async selectDeployDocker(): Promise<void> {
    await this.selectCreationType(APPLICATION_CREATION_TYPES.DOCKER);
  }

  /**
   * Select creation type by type
   */
  private async selectCreationType(type: APPLICATION_CREATION_TYPES): Promise<void> {
    const button = this.creationTypeButtons.filter({
      has: this.page.locator(`[value="${type}"], [data-creation-type="${type}"]`)
    }).first();

    await button.click();
    await this.page.waitForTimeout(500); // Allow navigation to complete
  }

  /**
   * Get stepper component
   */
  getStepper(): Locator {
    return this.stepper;
  }

  /**
   * Wait for stepper to be visible
   */
  async waitForStepper(): Promise<void> {
    await this.stepper.waitFor({ state: 'visible', timeout: 5000 });
  }
}
