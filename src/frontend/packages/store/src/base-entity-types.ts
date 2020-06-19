import {
  endpointEntitySchema,
  STRATOS_ENDPOINT_TYPE,
  systemInfoEntitySchema,
  userFavoritesEntitySchema,
  userProfileEntitySchema,
} from './base-entity-schemas';
import { StratosCatalogEntity } from './entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { addOrUpdateUserFavoriteMetadataReducer, deleteUserFavoriteMetadataReducer } from './reducers/favorite.reducer';
import { systemEndpointsReducer } from './reducers/system-endpoints.reducer';

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
export class DefaultEndpointCatalogEntity extends StratosCatalogEntity {
  constructor() {
    super({
      schema: endpointEntitySchema,
      type: endpointEntitySchema.entityType,
      endpoint: stratosType,
    }, {
        dataReducers: [
          systemEndpointsReducer
        ]
      });
  }
}

export class UserFavoriteCatalogEntity extends StratosCatalogEntity {
  constructor() {
    super({
      schema: userFavoritesEntitySchema,
      type: userFavoritesEntitySchema.entityType,
      endpoint: stratosType,
    }, {
        dataReducers: [
          addOrUpdateUserFavoriteMetadataReducer,
          deleteUserFavoriteMetadataReducer,
        ]
      });
  }
}

export class UserProfileCatalogEntity extends StratosCatalogEntity {
  constructor() {
    super({
      schema: userProfileEntitySchema,
      type: userProfileEntitySchema.entityType,
      endpoint: stratosType,
    });
  }
}

export class SystemInfoCatalogEntity extends StratosCatalogEntity {
  constructor() {
    super({
      schema: systemInfoEntitySchema,
      type: systemInfoEntitySchema.entityType,
      endpoint: stratosType,
    });
  }
}


