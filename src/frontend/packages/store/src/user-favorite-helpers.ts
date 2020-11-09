import { entityCatalog } from './entity-catalog/entity-catalog';
import { IEntityMetadata } from './entity-catalog/entity-catalog.types';
import { IFavoriteMetadata, UserFavorite } from './types/user-favorites.types';
import { UserFavoriteManager } from './user-favorite-manager';

export function isEndpointTypeFavorite(favorite: UserFavorite<IFavoriteMetadata>) {
  return !favorite.entityId;
}

// Uses the endpoint definition to get the helper that can look up an entitty
export function getFavoriteFromEntity<T extends IEntityMetadata = IEntityMetadata>(
  entity,
  entityType: string,
  userFavoriteManager: UserFavoriteManager,
  endpointType: string
): UserFavorite<T> {
  // Use entity catalog to get favorite for the given endpoint type
  const endpoint = entityCatalog.getEndpoint(endpointType);
  if (endpoint && endpoint.definition && endpoint.definition.favoriteFromEntity) {
    return endpoint.definition.favoriteFromEntity(entity, entityType, userFavoriteManager);
  }

  return null;
}

export function deriveEndpointFavoriteFromFavorite(favorite: UserFavorite<IFavoriteMetadata>) {
  if (favorite.entityType !== 'endpoint') {
    return new UserFavorite<IFavoriteMetadata>(
      favorite.endpointId, favorite.endpointType, 'endpoint', null, favorite.metadata
    );
  }
  return favorite;
}
