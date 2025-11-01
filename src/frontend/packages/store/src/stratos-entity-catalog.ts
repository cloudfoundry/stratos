import { ApiKey } from './apiKey.types';
import {
  StratosCatalogEndpointEntity,
  StratosCatalogEntity,
} from './entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { IEntityMetadata } from './entity-catalog/entity-catalog.types';
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
  endpoint!: StratosCatalogEntity<
    IEntityMetadata,
    EndpointModel,
    EndpointActionBuilder
  >;

  systemInfo!: StratosCatalogEntity<
    IEntityMetadata,
    SystemInfo,
    SystemInfoActionBuilder
  >;

  userFavorite!: StratosCatalogEntity<
    IEntityMetadata,
    UserFavorite,
    UserFavoriteActionBuilder
  >;

  userProfile!: StratosCatalogEntity<
    IEntityMetadata,
    UserProfileInfo,
    UserProfileActionBuilder
  >;

  metricsEndpoint!: StratosCatalogEndpointEntity;

  apiKey!: StratosCatalogEntity<
    IEntityMetadata,
    ApiKey,
    ApiKeyActionBuilder
  >;
}

export const stratosEntityCatalog = new StratosEntityCatalog();

