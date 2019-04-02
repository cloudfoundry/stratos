import {
  SERVICE_INSTANCE_TYPES
} from '../../frontend/packages/core/src/shared/components/add-service-instance/add-service-instance-base-step/add-service-instance.types';
import { TileSelector } from '../po/tile-selector.po';
import { CreateMarketplaceServiceInstance } from './create-marketplace-service-instance.po';

export class BaseCreateServiceInstanceStepper {
  public tiles = new TileSelector();
  public selectServiceType(type: SERVICE_INSTANCE_TYPES) {
    switch (type) {
      case SERVICE_INSTANCE_TYPES.SERVICE:
        this.tiles.select('Marketplace Service');
        return new CreateMarketplaceServiceInstance();
    }
  }
}
