import { entityCatalog } from './entity-catalog/entity-catalog';
import { IEntityMetadata } from './entity-catalog/entity-catalog.types';
import { FavoritesConfigMapper } from './favorite-config-mapper';
import { IFavoriteMetadata, UserFavorite } from './types/user-favorites.types';

export function isEndpointTypeFavorite(favorite: UserFavorite<IFavoriteMetadata>) {
  return !favorite.entityId;
}

// Uses the endpoint definition to get the helper that can look up an entitty
export function getFavoriteFromEntity<T extends IEntityMetadata = IEntityMetadata>(
  entity,
  entityType: string,
  favoritesConfigMapper: FavoritesConfigMapper,
  endpointType: string
): UserFavorite<T> {
  // Use entity catalog to get favorite for the given endpoint type
  const endpoint = entityCatalog.getEndpoint(endpointType);
  if (endpoint && endpoint.definition && endpoint.definition.favoriteFromEntity) {
    return endpoint.definition.favoriteFromEntity(entity, entityType, favoritesConfigMapper);
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
