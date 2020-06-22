import {
  StratosCatalogEndpointEntity,
  StratosCatalogEntity,
} from './entity-catalog/entity-catalog-entity/entity-catalog-entity';
import {
  EndpointActionBuilder,
  SystemInfoActionBuilder,
  UserFavoriteActionBuilder,
  UserProfileActionBuilder,
} from './stratos-action-builders';
import { EndpointModel } from './types/endpoint.types';
import { SystemInfo } from './types/system.types';
import { UserFavorite } from './types/user-favorites.types';
import { UserProfileInfo } from './types/user-profile.types';

export class StratosEntityCatalog {
  endpoint: StratosCatalogEntity<
    undefined,
    EndpointModel,
    EndpointActionBuilder
  >

  systemInfo: StratosCatalogEntity<
    undefined,
    SystemInfo,
    SystemInfoActionBuilder
  >

  userFavorite: StratosCatalogEntity<
    undefined,
    UserFavorite,
    UserFavoriteActionBuilder
  >

  userProfile: StratosCatalogEntity<
    undefined,
    UserProfileInfo,
    UserProfileActionBuilder
  >

  metricsEndpoint: StratosCatalogEndpointEntity;
}

export const stratosEntityCatalog = new StratosEntityCatalog();

