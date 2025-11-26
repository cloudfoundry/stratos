import type { ApiKey } from './apiKey.types';
import {
  type StratosBaseCatalogEntity,
  StratosCatalogEndpointEntity,
  StratosCatalogEntity,
} from './entity-catalog/entity-catalog-entity/entity-catalog-entity';
import type { IStratosEntityDefinition } from './entity-catalog/entity-catalog.types';
import {
  apiKeyEntityType,
  STRATOS_ENDPOINT_TYPE,
  systemInfoEntityType,
  userFavouritesEntityType,
  userProfileEntityType,
} from './helpers/stratos-entity-factory';
import { endpointEntityType, type EndpointModel, stratosEntityFactory } from './public-api';
import { addOrUpdateUserFavoriteMetadataReducer, deleteUserFavoriteMetadataReducer } from './reducers/favorite.reducer';
import { systemEndpointsReducer } from './reducers/system-endpoints.reducer';
import {
  type ApiKeyActionBuilder,
  apiKeyActionBuilder,
  type EndpointActionBuilder,
  endpointActionBuilder,
  type SystemInfoActionBuilder,
  systemInfoActionBuilder,
  type UserFavoriteActionBuilder,
  userFavoriteActionBuilder,
  type UserProfileActionBuilder,
  userProfileActionBuilder,
} from './stratos-action-builders';
import { stratosEntityCatalog } from './stratos-entity-catalog';
import type { SystemInfo } from './types/system.types';
import type { UserFavorite } from './types/user-favorites.types';
import type { UserProfileInfo } from './types/user-profile.types';

// StratosType is intentionally typed as 'any' because it's a fake endpoint type
// used only to initialize the store correctly. It doesn't conform to the full
// StratosEndpointExtensionDefinition interface by design.

export function generateStratosEntities(): StratosBaseCatalogEntity[] {
  /**
   * This is used as a fake endpoint type to allow the store to be initiated correctly.
   * It's intentionally cast to any because it doesn't need to conform to the full
   * StratosEndpointExtensionDefinition interface - it's only used for store initialization.
   */
  // biome-ignore lint/suspicious/noExplicitAny: Fake endpoint type for store initialization
  const stratosType: any = {
    logoUrl: '',
    authTypes: [],
    type: STRATOS_ENDPOINT_TYPE,
    schema: null
  };
  return [
    generateEndpoint(stratosType),
    generateSystemInfo(stratosType),
    generateUserFavorite(stratosType),
    generateUserProfile(stratosType),
    generateMetricsEndpoint(),
    generateAPIKeys(stratosType)
  ];
}

/**
 * DefaultEndpointEntityType is used to represent a general endpoint
 * This should not be used to actually attempt to render an endpoint and is instead used as a way to fill the
 */
// biome-ignore lint/suspicious/noExplicitAny: Fake endpoint type for store initialization
function generateEndpoint(stratosType: any) {
  // NOTE: For endpoint entities, we should NOT set the 'endpoint' property.
  // The absence of 'endpoint' property triggers isEndpoint=true logic in StratosBaseCatalogEntity,
  // which correctly registers this as an endpoint entity in the endpoints Map.
  // However, since this is used as a base entity type and not a true endpoint,
  // we register it as a regular entity (with endpoint property set).
  const definition: IStratosEntityDefinition = {
    schema: stratosEntityFactory(endpointEntityType),
    type: endpointEntityType,
    endpoint: stratosType,
  };
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
  );
  return stratosEntityCatalog.endpoint;
}

// biome-ignore lint/suspicious/noExplicitAny: Fake endpoint type for store initialization
function generateSystemInfo(stratosType: any) {
  const definition: IStratosEntityDefinition = {
    schema: stratosEntityFactory(systemInfoEntityType),
    type: systemInfoEntityType,
    endpoint: stratosType,
  };
  stratosEntityCatalog.systemInfo = new StratosCatalogEntity<
    undefined,
    SystemInfo,
    SystemInfoActionBuilder
  >(
    definition,
    {
      actionBuilders: systemInfoActionBuilder
    }
  );
  return stratosEntityCatalog.systemInfo;
}

// biome-ignore lint/suspicious/noExplicitAny: Fake endpoint type for store initialization
function generateUserFavorite(stratosType: any) {
  const definition: IStratosEntityDefinition = {
    schema: stratosEntityFactory(userFavouritesEntityType),
    type: userFavouritesEntityType,
    endpoint: stratosType,
  };
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
  );
  return stratosEntityCatalog.userFavorite;
}

// biome-ignore lint/suspicious/noExplicitAny: Fake endpoint type for store initialization
function generateUserProfile(stratosType: any) {
  const definition: IStratosEntityDefinition = {
    schema: stratosEntityFactory(userProfileEntityType),
    type: userProfileEntityType,
    endpoint: stratosType,
  };
  stratosEntityCatalog.userProfile = new StratosCatalogEntity<
    undefined,
    UserProfileInfo,
    UserProfileActionBuilder
  >(
    definition,
    {
      actionBuilders: userProfileActionBuilder
    }
  );
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
    entity => `/endpoints/metrics/${entity.endpointId}`
  );
  return stratosEntityCatalog.metricsEndpoint;
}

// biome-ignore lint/suspicious/noExplicitAny: Fake endpoint type for store initialization
function generateAPIKeys(stratosType: any) {
  const definition: IStratosEntityDefinition = {
    schema: stratosEntityFactory(apiKeyEntityType),
    type: apiKeyEntityType,
    endpoint: stratosType,
  };
  stratosEntityCatalog.apiKey = new StratosCatalogEntity<
    undefined,
    ApiKey,
    ApiKeyActionBuilder
  >(
    definition,
    {
      actionBuilders: apiKeyActionBuilder
    }
  );
  return stratosEntityCatalog.apiKey;
}
