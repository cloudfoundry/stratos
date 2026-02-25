import { Page } from '@playwright/test';
import { BasePage } from '../base.page';
import { CreateServiceInstanceStepper } from './create-service-instance-stepper.page';

/**
 * Create Marketplace Service Instance Page
 * Marketplace service instance creation stepper
 */
export class CreateMarketplaceServiceInstance extends BasePage {
  public stepper: CreateServiceInstanceStepper;

  constructor(page: Page, url: string = '/services/new/service') {
    super(page);
    this.stepper = new CreateServiceInstanceStepper(page);
  }

  async navigateTo(): Promise<void> {
    await this.page.goto('/services/new/service');
  }

  async isActivePage(): Promise<boolean> {
    const url = this.page.url();
    return url.includes('/services/new/service');
  }

  async waitForPage(): Promise<void> {
    await this.page.waitForURL(/\/services\/new\/service/, { timeout: 20000 });
  }
}
