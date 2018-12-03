import { createGetApplicationAction } from '../features/applications/application.service';
import { GetOrganization } from '../store/actions/organization.actions';
import { applicationSchemaKey, endpointSchemaKey, organizationSchemaKey, spaceSchemaKey } from '../store/helpers/entity-factory';
import { UserFavorite } from '../store/types/user-favorites.types';
import { GetAllEndpoints } from './../store/actions/endpoint.actions';
import { GetSpace } from './../store/actions/space.actions';
import { CfAPIResource } from './../store/types/api.types';

const generators = {
  [applicationSchemaKey]: favorite => createGetApplicationAction(favorite.entityId, favorite.endpointId),
  [organizationSchemaKey]: favorite => new GetOrganization(favorite.entityId, favorite.endpointId),
  [spaceSchemaKey]: favorite => new GetSpace(favorite.entityId, favorite.endpointId),
  [endpointSchemaKey]: () => new GetAllEndpoints(false)
};

export function getActionGeneratorFromFavoriteType(favorite: UserFavorite) {
  const type = favorite.entityType || favorite.endpointType;
  const generator = generators[type];
  if (generator) {
    return generator(favorite);
  }
  return null;
}

export function getFavoriteFromEntity(entity, entityKey: string) {
  if (isCfEntity(entity as CfAPIResource) && Object.keys(generators).find(key => key === entityKey)) {
    return getFavoriteFromCfEntity(entity, entityKey);
  }
  return null;
}

function isCfEntity(entity: CfAPIResource) {
  return entity && entity.entity.cfGuid && entity.metadata && entity.metadata.guid;
}

function getFavoriteFromCfEntity(entity: CfAPIResource, entityKey: string) {
  return new UserFavorite(
    entity.entity.cfGuid,
    'cf',
    entity.metadata.guid,
    entityKey
  );
}

