import { EntityCatalogHelper } from './entity-catalog-entity/entity-catalog.service';

export abstract class EntityCatalogHelpers {
  static readonly endpointType = 'endpoint';
  static buildEntityKey(entityType: string, endpointType: string): string {
    if (!entityType) {
      return endpointType;
    }
    if (!endpointType) {
      return entityType;
    }
    // Camelcased to make it work better with the store.
    return `${endpointType}${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`;
  }

  private static Instance: EntityCatalogHelper;
  static SetEntityCatalogHelper(ecf: EntityCatalogHelper) {
    this.Instance = ecf;
  }
  static GetEntityCatalogHelper(): EntityCatalogHelper {
    return this.Instance;
  }
}
