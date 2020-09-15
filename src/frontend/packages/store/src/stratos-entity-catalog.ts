import { ApiKey } from './apiKey.types';
import {
  StratosCatalogEndpointEntity,
  StratosCatalogEntity,
} from './entity-catalog/entity-catalog-entity/entity-catalog-entity';
import {
  ApiKeyActionBuilder,
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

  apiKey: StratosCatalogEntity<
    undefined,
    ApiKey,
    ApiKeyActionBuilder
  >
}

export const stratosEntityCatalog = new StratosEntityCatalog();

