import {
  endpointEntitySchema,
  STRATOS_ENDPOINT_TYPE,
  userFavoritesEntitySchema,
  userProfileEntitySchema,
  systemInfoEntitySchema,
} from './base-entity-schemas';
import { StratosCatalogueEndpointEntity, StratosCatalogueEntity } from './core/entity-catalogue/entity-catalogue-entity';
import { BaseEndpointAuth } from './features/endpoints/endpoint-auth';

//
// These types are used to represent the base stratos types.
//

/**
 * This is used as a fake endpoint type to allow the store to be initiated correctly
 */
const stratosType = {
  logoUrl: '',
  authTypes: [],
  type: STRATOS_ENDPOINT_TYPE,
  schema: null
};

/**
 * DefaultEndpointEntityType is used to represent a general endpoint
 * This should not be used to actually attempt to render an endpoint and is instead used as a way to fill the
 */
class DefaultEndpointCatalogueEntity extends StratosCatalogueEntity {
  constructor() {
    super({
      schema: endpointEntitySchema,
      type: endpointEntitySchema.entityType,
      endpoint: stratosType
    });
  }
}

class UserFavoriteCatalogueEntity extends StratosCatalogueEntity {
  constructor() {
    super({
      schema: userFavoritesEntitySchema,
      type: userFavoritesEntitySchema.entityType,
      endpoint: stratosType,
    });
  }
}

class UserProfileCatalogueEntity extends StratosCatalogueEntity {
  constructor() {
    super({
      schema: userProfileEntitySchema,
      type: userProfileEntitySchema.entityType,
      endpoint: stratosType,
    });
  }
}

class SystemInfoCatalogueEntity extends StratosCatalogueEntity {
  constructor() {
    super({
      schema: systemInfoEntitySchema,
      type: systemInfoEntitySchema.entityType,
      endpoint: stratosType,
    });
  }
}

export function baseStratosTypeFactory() {
  return [
    new DefaultEndpointCatalogueEntity(),
    new SystemInfoCatalogueEntity(),
    new UserFavoriteCatalogueEntity(),
    new UserProfileCatalogueEntity(),
    new StratosCatalogueEndpointEntity({
      type: 'metrics',
      label: 'Metrics',
      labelPlural: 'Metrics',
      tokenSharing: true,
      logoUrl: '/core/assets/endpoint-icons/metrics.svg',
      authTypes: [BaseEndpointAuth.UsernamePassword, BaseEndpointAuth.None]
    },
      metadata => `/endpoints/metrics/${metadata.guid}`
    )
  ];
}

