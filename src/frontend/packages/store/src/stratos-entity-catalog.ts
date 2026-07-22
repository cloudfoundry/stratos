import {
  StratosCatalogEndpointEntity,
} from './entity-catalog/entity-catalog-entity/entity-catalog-entity';

export class StratosEntityCatalog {
  metricsEndpoint!: StratosCatalogEndpointEntity;
}

export const stratosEntityCatalog = new StratosEntityCatalog();

