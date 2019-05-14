export abstract class EntityCatalogueHelpers {
  static readonly endpointType = 'endpoint';
  static buildId(entityType: string, endpointType: string): string {
    // Camelcased to make it work better with the store.
    return endpointType ? `${endpointType}${entityType.charAt(0).toUpperCase() + entityType.slice(1)}` : entityType;
  }
}
