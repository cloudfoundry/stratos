/**
 * Interface for EntityCatalog to break circular dependencies.
 * This is a types-only file that can be imported without runtime dependencies.
 */
export interface IEntityCatalog {
  getEntity(endpointType: string, entityType: string): any;
  getEntity(action: any): any;
  register(entity: any): void;
}