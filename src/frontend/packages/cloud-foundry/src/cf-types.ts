import { EntityCatalogEntityConfig } from '../../store/src/entity-catalog/entity-catalog.types';

export const CF_ENDPOINT_TYPE = 'cf';

export class CFEntityConfig implements EntityCatalogEntityConfig {
  public endpointType = CF_ENDPOINT_TYPE;

  constructor(public entityType: string) { }
}
