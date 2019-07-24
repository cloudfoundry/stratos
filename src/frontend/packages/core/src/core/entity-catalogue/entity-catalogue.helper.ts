export abstract class EntityCatalogueHelpers {
  static readonly endpointType = 'endpoint';
  // FIXME: Remove this (and class) and replace with entityCatalogue.getEntityKey
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
}
