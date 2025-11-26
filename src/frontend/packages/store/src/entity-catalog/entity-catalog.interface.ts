/**
 * Interface for EntityCatalog to break circular dependencies.
 * This is a types-only file that can be imported without runtime dependencies.
 */
export interface IEntityCatalog {
  getEntity(endpointType: string, entityType: string): unknown;
  getEntity(action: unknown): unknown;
  register(entity: unknown): void;
  getAllEntityRequestDataReducers(): Record<string, unknown>;
}