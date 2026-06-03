import {
  StratosCatalogEndpointEntity,
  StratosCatalogEntity,
} from './entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { IEntityMetadata } from './entity-catalog/entity-catalog.types';
import {
  SystemInfoActionBuilder,
} from './stratos-action-builders';
import { SystemInfo } from './types/system.types';

export class StratosEntityCatalog {
  systemInfo!: StratosCatalogEntity<
    IEntityMetadata,
    SystemInfo,
    SystemInfoActionBuilder
  >;

  metricsEndpoint!: StratosCatalogEndpointEntity;
}

export const stratosEntityCatalog = new StratosEntityCatalog();

