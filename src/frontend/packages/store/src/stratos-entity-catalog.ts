import {
  StratosCatalogEndpointEntity,
  StratosCatalogEntity,
} from './entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { IEntityMetadata } from './entity-catalog/entity-catalog.types';
import {
  SystemInfoActionBuilder,
  UserProfileActionBuilder,
} from './stratos-action-builders';
import { SystemInfo } from './types/system.types';
import { UserProfileInfo } from './types/user-profile.types';

export class StratosEntityCatalog {
  systemInfo!: StratosCatalogEntity<
    IEntityMetadata,
    SystemInfo,
    SystemInfoActionBuilder
  >;

  userProfile!: StratosCatalogEntity<
    IEntityMetadata,
    UserProfileInfo,
    UserProfileActionBuilder
  >;

  metricsEndpoint!: StratosCatalogEndpointEntity;
}

export const stratosEntityCatalog = new StratosEntityCatalog();

