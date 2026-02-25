import { Page } from '@playwright/test';
import { BasePage } from '../base.page';
import { BaseCreateServiceInstanceStepper } from './base-create-service-instance-stepper.page';
import { CreateMarketplaceServiceInstance } from './create-marketplace-service-instance.page';
import { ServicesWallPage } from './services-wall.page';

// Service instance types enum
export const SERVICE_INSTANCE_TYPES = {
  SERVICE: 'service',
  USER_SERVICE: 'user-service'
} as const;

export type ServiceInstanceType = typeof SERVICE_INSTANCE_TYPES[keyof typeof SERVICE_INSTANCE_TYPES];

/**
 * Create Service Instance Page
 * Entry point for creating any type of service instance
 */
export class CreateServiceInstance extends BasePage {
  private baseStepper: BaseCreateServiceInstanceStepper;
  public stepper?: CreateMarketplaceServiceInstance;
  private servicesWall: ServicesWallPage;

  constructor(page: Page, url: string = '/services/new') {
    super(page);
    this.baseStepper = new BaseCreateServiceInstanceStepper(page);
    this.servicesWall = new ServicesWallPage(page);
  }

  async selectMarketplace(): Promise<void> {
    await this.baseStepper.selectServiceType(SERVICE_INSTANCE_TYPES.SERVICE);
  }

  async selectUserProvidedService(): Promise<void> {
    await this.baseStepper.selectServiceType(SERVICE_INSTANCE_TYPES.USER_SERVICE);
  }

  async navigateTo(): Promise<void> {
    await this.page.goto('/services/new');
  }

  async isActivePage(): Promise<boolean> {
    const url = this.page.url();
    return url.includes('/services/new');
  }

  async waitForPage(): Promise<void> {
    await this.page.waitForURL(/\/services\/new/, { timeout: 20000 });
  }

  /**
   * Navigate to stepper without reloading window
   */
  async softNavigateTo(): Promise<void> {
    // Navigate via side nav to services
    const sideNav = this.page.locator('app-side-nav, mat-sidenav');
    const servicesLink = sideNav.locator('a, button').filter({ hasText: /services/i });
    await servicesLink.click();

    await this.servicesWall.waitForPage();
    await this.servicesWall.clickCreateServiceInstance();
    await this.waitForPage();
  }
}
