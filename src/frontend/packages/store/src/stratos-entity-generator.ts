import {
  StratosBaseCatalogEntity,
  StratosCatalogEndpointEntity,
  StratosCatalogEntity,
} from './entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { IStratosEntityDefinition } from './entity-catalog/entity-catalog.types';
import {
  STRATOS_ENDPOINT_TYPE,
  systemInfoEntityType,
  userFavouritesEntityType,
  userProfileEntityType,
} from './helpers/stratos-entity-factory';
import { stratosEntityFactory } from './public-api';
import { addOrUpdateUserFavoriteMetadataReducer, deleteUserFavoriteMetadataReducer } from './reducers/favorite.reducer';
import {
  SystemInfoActionBuilder,
  systemInfoActionBuilder,
  UserFavoriteActionBuilder,
  userFavoriteActionBuilder,
  UserProfileActionBuilder,
  userProfileActionBuilder,
} from './stratos-action-builders';
import { stratosEntityCatalog } from './stratos-entity-catalog';
import { SystemInfo } from './types/system.types';
import { UserFavorite } from './types/user-favorites.types';
import { UserProfileInfo } from './types/user-profile.types';

export function generateStratosEntities(): StratosBaseCatalogEntity[] {
  /**
   * This is used as a fake endpoint type to allow the store to be initiated correctly
   */
  const stratosType: any = {
    logoUrl: '',
    authTypes: [] as string[],
    type: STRATOS_ENDPOINT_TYPE,
    schema: null as any
  };
  return [
    generateSystemInfo(stratosType),
    generateUserFavorite(stratosType),
    generateUserProfile(stratosType),
    generateMetricsEndpoint(),
  ];
}

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

