import type { ApiKey } from './apiKey.types';
import type {
  StratosCatalogEndpointEntity,
  StratosCatalogEntity,
} from './entity-catalog/entity-catalog-entity/entity-catalog-entity';
import type { IEntityMetadata } from './entity-catalog/entity-catalog.types';
import type {
  ApiKeyActionBuilder,
  EndpointActionBuilder,
  SystemInfoActionBuilder,
  UserFavoriteActionBuilder,
  UserProfileActionBuilder,
} from './stratos-action-builders';
import type { EndpointModel } from './types/endpoint.types';
import type { SystemInfo } from './types/system.types';
import type { UserFavorite } from './types/user-favorites.types';
import type { UserProfileInfo } from './types/user-profile.types';

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

