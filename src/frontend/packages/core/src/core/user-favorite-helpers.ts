import { CfAPIResource } from '../../../store/src/types/api.types';
import { EndpointModel } from '../../../store/src/types/endpoint.types';
import { IFavoriteMetadata, UserFavorite, UserFavoriteEndpoint } from '../../../store/src/types/user-favorites.types';

export function isEndpointTypeFavorite(favorite: UserFavorite<IFavoriteMetadata>) {
  return !favorite.entityId;
}


export function getFavoriteFromCfEntity<T extends IFavoriteMetadata>(entity, entityKey: string) {
  if (isCfEntity(entity as CfAPIResource)) {
    return new UserFavorite<T>(
      entity.entity.cfGuid,
      'cf',
      entityKey,
      entity.metadata.guid,
      entity
    );
  }
  return null;
}

export function getFavoriteFromEndpointEntity(endpoint: EndpointModel) {
  if (isEndpointEntity(endpoint)) {
    return new UserFavoriteEndpoint(
      endpoint
    );
  }
  return null;
}

export function deriveEndpointFavoriteFromFavorite(favorite: UserFavorite<IFavoriteMetadata>) {
  if (favorite.entityType !== 'endpoint') {
    const endpointFav = {
      ...favorite
    };
    endpointFav.entityId = null;
    endpointFav.entityType = 'endpoint';
    endpointFav.guid = UserFavorite.buildFavoriteStoreEntityGuid(endpointFav);
    return endpointFav;
  }
  return favorite;
}

function isEndpointEntity(endpoint: EndpointModel) {
  return endpoint && endpoint.guid && endpoint.cnsi_type;
}

function isCfEntity(entity: CfAPIResource) {
  return entity && entity.entity.cfGuid && entity.metadata && entity.metadata.guid;
}

