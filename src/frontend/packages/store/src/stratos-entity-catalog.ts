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
import { UserProfileInfo } from './types/user-profile.types';

// TODO: RC Test all of these actions

export class StratosEntityCatalog {
  endpoint: StratosCatalogEntity<
    any,//TODO: RC
    EndpointModel,
    EndpointActionBuilder
  >

  systemInfo: StratosCatalogEntity<
    any,
    any, //TODO: RC
    SystemInfoActionBuilder
  >

  userFavorite: StratosCatalogEntity<
    any,
    any, //TODO: RC
    UserFavoriteActionBuilder
  >

  userProfile: StratosCatalogEntity<
    any,//TODO: RC
    UserProfileInfo,
    UserProfileActionBuilder
  >

  metricsEndpoint: StratosCatalogEndpointEntity;
}

export const stratosEntityCatalog = new StratosEntityCatalog();

