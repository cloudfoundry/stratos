import {
  StratosCatalogEndpointEntity,
  StratosCatalogEntity,
} from '../../store/src/entity-catalog/entity-catalog-entity/entity-catalog-entity';
import {
  endpointSchemaKey,
  STRATOS_ENDPOINT_TYPE,
  stratosEntityFactory,
  systemInfoSchemaKey,
  userFavouritesSchemaKey,
} from '../../store/src/helpers/stratos-entity-factory';
import {
  addOrUpdateUserFavoriteMetadataReducer,
  deleteUserFavoriteMetadataReducer,
} from '../../store/src/reducers/favorite.reducer';
import { systemEndpointsReducer } from '../../store/src/reducers/system-endpoints.reducer';
import {
  EndpointActionBuilder,
  endpointActionBuilder,
  stratosEntityCatalog,
  SystemInfoActionBuilder,
  systemInfoActionBuilder,
  UserProfileActionBuilder,
  userProfileActionBuilder,
} from '../../store/src/stratos-entity-catalog';
import { EndpointModel } from '../../store/src/types/endpoint.types';
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
class DefaultEndpointCatalogEntity extends StratosCatalogEntity<
  any,//TODO: RC
  EndpointModel,
  EndpointActionBuilder
  > {
  constructor() {
    super({
      schema: stratosEntityFactory(endpointSchemaKey),
      type: endpointSchemaKey,
      endpoint: stratosType,
    }, {
      dataReducers: [
        systemEndpointsReducer
      ],
      actionBuilders: endpointActionBuilder
    });
  }
}

class UserFavoriteCatalogEntity extends StratosCatalogEntity {
  constructor() {
    super({
      schema: stratosEntityFactory(userFavouritesSchemaKey),
      type: userFavouritesSchemaKey,
      endpoint: stratosType,
    }, {
      dataReducers: [
        addOrUpdateUserFavoriteMetadataReducer,
        deleteUserFavoriteMetadataReducer,
      ]
    });
  }
}

class UserProfileCatalogEntity extends StratosCatalogEntity<
  any,
  any, //TODO: RC
  UserProfileActionBuilder> {
  constructor() {
    super({
      schema: stratosEntityFactory(userFavouritesSchemaKey),
      type: userFavouritesSchemaKey,
      endpoint: stratosType,
    }, {
      actionBuilders: userProfileActionBuilder
    });
  }
}

class SystemInfoCatalogEntity extends StratosCatalogEntity<
  any,
  any, //TODO: RC
  SystemInfoActionBuilder
  > {
  constructor() {
    super({
      schema: stratosEntityFactory(systemInfoSchemaKey),
      type: systemInfoSchemaKey,
      endpoint: stratosType,
    }, {
      actionBuilders: systemInfoActionBuilder
    });
  }
}

export function generateStratosEntities() {
  stratosEntityCatalog.endpoint = new DefaultEndpointCatalogEntity();
  stratosEntityCatalog.systemInfo = new SystemInfoCatalogEntity()
  stratosEntityCatalog.userFavorite = new UserFavoriteCatalogEntity()
  stratosEntityCatalog.userProfile = new UserProfileCatalogEntity()
  // TODO: metrics location to be sorted - STRAT-152
  stratosEntityCatalog.metricsEndpoint = new StratosCatalogEndpointEntity({
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

  return Object.values(stratosEntityCatalog);
}

