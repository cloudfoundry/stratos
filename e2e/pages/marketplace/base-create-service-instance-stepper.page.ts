import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base.page';
import { SERVICE_INSTANCE_TYPES, ServiceInstanceType } from './create-service-instance.page';
import { CreateMarketplaceServiceInstance } from './create-marketplace-service-instance.page';
import { CreateUserProvidedServiceInstance } from './create-ups-service-instance.page';

/**
 * Base Create Service Instance Stepper
 * Initial service type selection step
 */
export class BaseCreateServiceInstanceStepper extends BasePage {
  public tiles: Locator;

  constructor(page: Page) {
    super(page);
    this.tiles = page.locator('app-tile-selector, .tile-selector');
  }

  async selectServiceType(type: ServiceInstanceType): Promise<CreateMarketplaceServiceInstance | CreateUserProvidedServiceInstance> {
    switch (type) {
      case SERVICE_INSTANCE_TYPES.SERVICE:
        await this.selectTile('Marketplace Service');
        return new CreateMarketplaceServiceInstance(this.page);
      case SERVICE_INSTANCE_TYPES.USER_SERVICE:
        await this.selectTile('User Provided Service');
        return new CreateUserProvidedServiceInstance(this.page);
      default:
        throw new Error(`Unknown service type: ${type}`);
    }
  }

  private async selectTile(tileName: string): Promise<void> {
    const tile = this.tiles.locator('app-tile, .tile, mat-card').filter({ hasText: tileName });
    await tile.waitFor({ state: 'visible' });
    await tile.click();
  }
}
