import {
  StratosCatalogEndpointEntity,
  StratosCatalogEntity,
} from '../../store/src/entity-catalog/entity-catalog-entity/entity-catalog-entity';
import {
  addOrUpdateUserFavoriteMetadataReducer,
  deleteUserFavoriteMetadataReducer,
} from '../../store/src/reducers/favorite.reducer';
import { systemEndpointsReducer } from '../../store/src/reducers/system-endpoints.reducer';
import {
  endpointEntitySchema,
  STRATOS_ENDPOINT_TYPE,
  systemInfoEntitySchema,
  userFavoritesEntitySchema,
  userProfileEntitySchema,
} from './base-entity-schemas';
import { BaseEndpointAuth } from './features/endpoints/endpoint-auth';
import {
  MetricsEndpointDetailsComponent,
} from './features/metrics/metrics-endpoint-details/metrics-endpoint-details.component';

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
class DefaultEndpointCatalogEntity extends StratosCatalogEntity {
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

class UserFavoriteCatalogEntity extends StratosCatalogEntity {
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

class UserProfileCatalogEntity extends StratosCatalogEntity {
  constructor() {
    super({
      schema: userProfileEntitySchema,
      type: userProfileEntitySchema.entityType,
      endpoint: stratosType,
    });
  }
}

class SystemInfoCatalogEntity extends StratosCatalogEntity {
  constructor() {
    super({
      schema: systemInfoEntitySchema,
      type: systemInfoEntitySchema.entityType,
      endpoint: stratosType,
    });
  }
}

export function generateStratosEntities() {
  return [
    new DefaultEndpointCatalogEntity(),
    new SystemInfoCatalogEntity(),
    new UserFavoriteCatalogEntity(),
    new UserProfileCatalogEntity(),
    // TODO: metrics location to be sorted - STRAT-152
    new StratosCatalogEndpointEntity({
      type: 'metrics',
      label: 'Metrics',
      labelPlural: 'Metrics',
      tokenSharing: true,
      logoUrl: '/core/assets/endpoint-icons/metrics.svg',
      authTypes: [BaseEndpointAuth.UsernamePassword, BaseEndpointAuth.None],
      renderPriority: 1,
      listDetailsComponent: MetricsEndpointDetailsComponent,
    },
      metadata => `/endpoints/metrics/${metadata.guid}`
    )
  ];
}

