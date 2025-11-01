import { Page } from '@playwright/test';
import { BasePage } from '../base.page';
import { CreateServiceInstanceStepper } from './create-service-instance-stepper.page';

/**
 * Create User-Provided Service Instance Page
 * User-provided service instance creation stepper
 */
export class CreateUserProvidedServiceInstance extends BasePage {
  public stepper: CreateServiceInstanceStepper;

  constructor(page: Page, url: string = '/services/new/user-service?base-previous-redirect=%2Fservices%2Fnew') {
    super(page);
    this.stepper = new CreateServiceInstanceStepper(page);
  }

  async navigateTo(): Promise<void> {
    await this.page.goto('/services/new/user-service?base-previous-redirect=%2Fservices%2Fnew');
  }

  async isActivePage(): Promise<boolean> {
    const url = this.page.url();
    return url.includes('/services/new/user-service');
  }

  async waitForPage(): Promise<void> {
    await this.page.waitForURL(/\/services\/new\/user-service/, { timeout: 20000 });
  }
}
