import { EntitySchema } from './entity-schema';

export const userFavouritesSchemaKey = 'userFavorites';
export const endpointSchemaKey = 'endpoint';
export const userProfileSchemaKey = 'userProfile';
export const systemInfoSchemaKey = 'system';

export const metricEntityType = 'metrics';

export const STRATOS_ENDPOINT_TYPE = 'stratos';

const entityCache: {
  [key: string]: EntitySchema
} = {};

class StratosEntitySchema extends EntitySchema {
  constructor(entityType: string, idAttribute: string) {
    super(entityType, STRATOS_ENDPOINT_TYPE, {}, { idAttribute });
  }
}

// Note - The cache entry is added as a secondary step. This helps keep the child entity definition's clear and easier to spot circular
// dependencies which would otherwise be hidden (if we assigned directly to entityCache and references via entityCache in other entities)
const UserFavouritesSchema = new StratosEntitySchema(userFavouritesSchemaKey, 'id');
entityCache[userFavouritesSchemaKey] = UserFavouritesSchema;

const SystemInfoSchema = new StratosEntitySchema(systemInfoSchemaKey, 'id');
entityCache[systemInfoSchemaKey] = SystemInfoSchema;

const EndpointSchema = new StratosEntitySchema(endpointSchemaKey, 'guid');
entityCache[endpointSchemaKey] = EndpointSchema;

const UserProfileInfoSchema = new StratosEntitySchema(userProfileSchemaKey, 'id');
entityCache[userProfileSchemaKey] = UserProfileInfoSchema;

export function stratosEntityFactory(key: string): EntitySchema {
  const entity = entityCache[key];
  if (!entity) {
    throw new Error(`Unknown entity schema type: ${key}`);
  }
  return entity;
}

// export const userFavoritesEntitySchema = new StratosEntitySchema(entityFactory(userFavouritesSchemaKey).entityType);
// export const endpointEntitySchema = new StratosEntitySchema(entityFactory(endpointSchemaKey).entityType);
// export const userProfileEntitySchema = new StratosEntitySchema(entityFactory(userProfileSchemaKey).entityType);
// export const systemInfoEntitySchema = new StratosEntitySchema(entityFactory(systemInfoSchemaKey).entityType);