import { APIResource, CfAPIResource } from './../store/types/api.types';
import { UserFavorite } from '../store/types/user-favorites.types';
import { applicationSchemaKey, organizationSchemaKey } from '../store/helpers/entity-factory';
import { createGetApplicationAction } from '../features/applications/application.service';
import { GetOrganization } from '../store/actions/organization.actions';

export function getActionGeneratorFromFavoriteType(favorite: UserFavorite) {
  const type = favorite.entityType || favorite.endpointType;
  switch (type) {
    case applicationSchemaKey:
      return createGetApplicationAction(favorite.entityId, favorite.endpointId);
    case organizationSchemaKey:
      return new GetOrganization(favorite.entityId, favorite.endpointId);
  }
}

export function getFavoriteFromEntity(entity, entityKey: string) {
  if (isCfEntity(entity as CfAPIResource)) {
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

