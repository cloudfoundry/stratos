import {
  EntitySchema,
  entityFactory,
  endpointSchemaKey,
  userProfileSchemaKey
} from '../../store/src/helpers/entity-factory';

export const STRATOS_ENDPOINT_TYPE = 'stratos';

class StratosEntitySchema extends EntitySchema {
  constructor(entityType: string) {
    super(entityType, STRATOS_ENDPOINT_TYPE);
  }
}

const userFavoritesEntityType = 'userFavorites';

export const userFavoritesEntitySchema = new StratosEntitySchema(userFavoritesEntityType);
export const endpointEntitySchema = new StratosEntitySchema(entityFactory(endpointSchemaKey).entityType);
export const userProfileEntitySchema = new StratosEntitySchema(entityFactory(userProfileSchemaKey).entityType);
