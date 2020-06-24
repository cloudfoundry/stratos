import { EntitySchema } from './entity-schema';

export const userFavouritesEntityType = 'userFavorites';
export const endpointEntityType = 'endpoint';
export const userProfileEntityType = 'userProfile';
export const systemInfoEntityType = 'systemInfo';

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

const UserFavouritesSchema = new StratosEntitySchema(userFavouritesEntityType, 'guid');
entityCache[userFavouritesEntityType] = UserFavouritesSchema;

const SystemInfoSchema = new StratosEntitySchema(systemInfoEntityType, 'guid');
entityCache[systemInfoEntityType] = SystemInfoSchema;

const EndpointSchema = new StratosEntitySchema(endpointEntityType, 'guid');
entityCache[endpointEntityType] = EndpointSchema;

const UserProfileInfoSchema = new StratosEntitySchema(userProfileEntityType, 'id');
entityCache[userProfileEntityType] = UserProfileInfoSchema;

export function stratosEntityFactory(key: string): EntitySchema {
  const entity = entityCache[key];
  if (!entity) {
    throw new Error(`Unknown entity schema type: ${key}`);
  }
  return entity;
}