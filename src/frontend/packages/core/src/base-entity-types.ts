import { StratosCatalogueEntity } from './core/entity-catalogue/entity-catalogue.types';
import { entityCatalogue } from './core/entity-catalogue/entity-catalogue.service';
import { endpointEntitySchema, userFavoritesEntitySchema, userProfileEntitySchema, STRATOS_ENDPOINT_TYPE } from './base-entity-schemas';
//
// These types are used to represent the base stratos types.
//

/**
 * This is used as a fake endpoint type to allow the store to be initiated correctly
 */
const stratosType = {
  logoUrl: '',
  authTypes: [],
  type: STRATOS_ENDPOINT_TYPE,
  schema: null
};

/**
 * DefaultEndpointEntityType is used to represent a general endpoint
 * This should not be used to actually attempt to render an endpoint and is instead used as a way to fill the 
 */
class DefaultEndpointEntityType extends StratosCatalogueEntity {
  constructor() {
    super({
      schema: endpointEntitySchema,
      type: endpointEntitySchema.entityType,
      endpoint: stratosType
    });
  }
}

class UserFavoriteCatalogueEntity extends StratosCatalogueEntity {
  constructor() {
    super({
      schema: userFavoritesEntitySchema,
      type: userFavoritesEntitySchema.entityType,
      endpoint: stratosType,
    });
  }
}

class UserProfileCatalogueEntity extends StratosCatalogueEntity {
  constructor() {
    super({
      schema: userProfileEntitySchema,
      type: userProfileEntitySchema.entityType,
      endpoint: stratosType,
    });
  }
}

export function registerBaseStratosTypes() {
  entityCatalogue.register(new DefaultEndpointEntityType());
  entityCatalogue.register(new UserFavoriteCatalogueEntity());
  entityCatalogue.register(new UserProfileCatalogueEntity());
}

