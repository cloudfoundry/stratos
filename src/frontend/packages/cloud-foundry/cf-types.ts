import { EntityCatalogueEntityConfig } from '../core/src/core/entity-catalogue/entity-catalogue.types';

export const CF_ENDPOINT_TYPE = 'cf';

export class CFEntityConfig implements EntityCatalogueEntityConfig {
  public endpointType = CF_ENDPOINT_TYPE;

  constructor(public entityType: string) { }
}
