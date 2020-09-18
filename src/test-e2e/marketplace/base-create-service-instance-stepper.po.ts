import { TileSelector } from '../po/tile-selector.po';
import { CreateMarketplaceServiceInstance } from './create-marketplace-service-instance.po';
import { CreateUserProvidedServiceInstance } from './create-ups-service-instance.po';
import { SERVICE_INSTANCE_TYPES } from '../../frontend/packages/cloud-foundry/src/shared/components/add-service-instance/add-service-instance-base-step/add-service-instance.types';

export class BaseCreateServiceInstanceStepper {
  public tiles = new TileSelector();
  public selectServiceType(type: SERVICE_INSTANCE_TYPES) {
    switch (type) {
      case SERVICE_INSTANCE_TYPES.SERVICE:
        this.tiles.select('Marketplace Service');
        return new CreateMarketplaceServiceInstance();
      case SERVICE_INSTANCE_TYPES.USER_SERVICE:
        this.tiles.select('User Provided Service');
        return new CreateUserProvidedServiceInstance();
    }
  }
}
