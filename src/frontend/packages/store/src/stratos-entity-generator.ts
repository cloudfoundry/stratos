import { ApiKey } from './apiKey.types';
import {
  StratosBaseCatalogEntity,
  StratosCatalogEndpointEntity,
  StratosCatalogEntity,
} from './entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { IStratosEntityDefinition } from './entity-catalog/entity-catalog.types';
import {
  apiKeyEntityType,
  endpointEntityType,
  STRATOS_ENDPOINT_TYPE,
  stratosEntityFactory,
  systemInfoEntityType,
  userFavouritesEntityType,
  userProfileEntityType,
} from './helpers/stratos-entity-factory';
import { addOrUpdateUserFavoriteMetadataReducer, deleteUserFavoriteMetadataReducer } from './reducers/favorite.reducer';
import { systemEndpointsReducer } from './reducers/system-endpoints.reducer';
import {
  ApiKeyActionBuilder,
  apiKeyActionBuilder,
  EndpointActionBuilder,
  endpointActionBuilder,
  SystemInfoActionBuilder,
  systemInfoActionBuilder,
  UserFavoriteActionBuilder,
  userFavoriteActionBuilder,
  UserProfileActionBuilder,
  userProfileActionBuilder,
} from './stratos-action-builders';
import { stratosEntityCatalog } from './stratos-entity-catalog';
import { EndpointModel } from './types/endpoint.types';
import { SystemInfo } from './types/system.types';
import { UserFavorite } from './types/user-favorites.types';
import { UserProfileInfo } from './types/user-profile.types';

export function generateStratosEntities(): StratosBaseCatalogEntity[] {
  /**
   * This is used as a fake endpoint type to allow the store to be initiated correctly
   */
  const stratosType = {
    logoUrl: '',
    authTypes: [],
    type: STRATOS_ENDPOINT_TYPE,
    schema: null
  }
  return [
    generateEndpoint(stratosType),
    generateSystemInfo(stratosType),
    generateUserFavorite(stratosType),
    generateUserProfile(stratosType),
    generateMetricsEndpoint(),
    generateAPIKeys(stratosType)
  ]
}

/**
 * DefaultEndpointEntityType is used to represent a general endpoint
 * This should not be used to actually attempt to render an endpoint and is instead used as a way to fill the
 */
function generateEndpoint(stratosType) {
  const definition: IStratosEntityDefinition = {
    schema: stratosEntityFactory(endpointEntityType),
    type: endpointEntityType,
    endpoint: stratosType,
  }
  stratosEntityCatalog.endpoint = new StratosCatalogEntity<
    undefined,
    EndpointModel,
    EndpointActionBuilder
  >(
    definition,
    {
      dataReducers: [
        systemEndpointsReducer
      ],
      actionBuilders: endpointActionBuilder
    }
  )
  return stratosEntityCatalog.endpoint;
}

function generateSystemInfo(stratosType) {
  const definition: IStratosEntityDefinition = {
    schema: stratosEntityFactory(systemInfoEntityType),
    type: systemInfoEntityType,
    endpoint: stratosType,
  }
  stratosEntityCatalog.systemInfo = new StratosCatalogEntity<
    undefined,
    SystemInfo,
    SystemInfoActionBuilder
  >(
    definition,
    {
      actionBuilders: systemInfoActionBuilder
    }
  )
  return stratosEntityCatalog.systemInfo;
}

function generateUserFavorite(stratosType) {
  const definition: IStratosEntityDefinition = {
    schema: stratosEntityFactory(userFavouritesEntityType),
    type: userFavouritesEntityType,
    endpoint: stratosType,
  }
  stratosEntityCatalog.userFavorite = new StratosCatalogEntity<
    undefined,
    UserFavorite,
    UserFavoriteActionBuilder
  >(
    definition,
    {
      dataReducers: [
        addOrUpdateUserFavoriteMetadataReducer,
        deleteUserFavoriteMetadataReducer,
      ],
      actionBuilders: userFavoriteActionBuilder
    }
  )
  return stratosEntityCatalog.userFavorite;
}

function generateUserProfile(stratosType) {
  const definition: IStratosEntityDefinition = {
    schema: stratosEntityFactory(userProfileEntityType),
    type: userProfileEntityType,
    endpoint: stratosType,
  }
  stratosEntityCatalog.userProfile = new StratosCatalogEntity<
    undefined,
    UserProfileInfo,
    UserProfileActionBuilder
  >(
    definition,
    {
      actionBuilders: userProfileActionBuilder
    }
  )
  return stratosEntityCatalog.userProfile;
}

function generateMetricsEndpoint() {
  // TODO: metrics location to be sorted - STRAT-152
  stratosEntityCatalog.metricsEndpoint = new StratosCatalogEndpointEntity({
    type: 'metrics',
    label: 'Metrics',
    labelPlural: 'Metrics',
    tokenSharing: true,
    logoUrl: '/core/assets/endpoint-icons/metrics.svg',
    authTypes: [],
    renderPriority: 1
  },
    metadata => `/endpoints/metrics/${metadata.guid}`
  )
  return stratosEntityCatalog.metricsEndpoint;
}

function generateAPIKeys(stratosType) {
  const definition: IStratosEntityDefinition = {
    schema: stratosEntityFactory(apiKeyEntityType),
    type: apiKeyEntityType,
    endpoint: stratosType,
  }
  stratosEntityCatalog.apiKey = new StratosCatalogEntity<
    undefined,
    ApiKey,
    ApiKeyActionBuilder
  >(
    definition,
    {
      actionBuilders: apiKeyActionBuilder
    }
  )
  return stratosEntityCatalog.apiKey;
}
