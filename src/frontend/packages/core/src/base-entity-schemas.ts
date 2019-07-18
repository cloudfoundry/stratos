import { endpointSchemaKey, entityFactory, userProfileSchemaKey } from '../../store/src/helpers/entity-factory';
import { EntitySchema } from '../../store/src/helpers/entity-schema';

export const STRATOS_ENDPOINT_TYPE = 'stratos';

class StratosEntitySchema extends EntitySchema {
  constructor(entityType: string) {
    super(entityType, STRATOS_ENDPOINT_TYPE);
  }
}

const userFavoritesEntityType = 'userFavorites';

// TODO: !!!! RC favourites is broken (fav an endpoint, get an exception). Should also be 'stratosFav..'
export const userFavoritesEntitySchema = new StratosEntitySchema(userFavoritesEntityType);
// TODO: !!!! RC Check that anywhere that accesses this uses '<stratos>Endpoint'
export const endpointEntitySchema = new StratosEntitySchema(entityFactory(endpointSchemaKey).entityType);
export const userProfileEntitySchema = new StratosEntitySchema(entityFactory(userProfileSchemaKey).entityType);
