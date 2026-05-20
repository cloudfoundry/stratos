import {
  StratosCatalogEndpointEntity,
  StratosCatalogEntity,
} from './entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { IEntityMetadata } from './entity-catalog/entity-catalog.types';
import {
  SystemInfoActionBuilder,
  UserFavoriteActionBuilder,
  UserProfileActionBuilder,
} from './stratos-action-builders';
import { SystemInfo } from './types/system.types';
import { UserFavorite } from './types/user-favorites.types';
import { UserProfileInfo } from './types/user-profile.types';

export class StratosEntityCatalog {
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
}

export const stratosEntityCatalog = new StratosEntityCatalog();

