import { EntityCatalogHelper } from './entity-catalog-entity/entity-catalog.service';

export abstract class EntityCatalogHelpers {
  static readonly endpointType = 'endpoint';
  private static Instance: EntityCatalogHelper;

  static buildEntityKey(entityType: string, endpointType: string): string {
    if (!entityType) {
      return endpointType;
    }
    if (!endpointType) {
      return entityType;
    }
    // Camel cased to make it work better with the store.
    return `${endpointType}${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`;
  }

  static SetEntityCatalogHelper(ecf: EntityCatalogHelper) {
    this.Instance = ecf;
  }
  static GetEntityCatalogHelper(): EntityCatalogHelper {
    return this.Instance;
  }
}
