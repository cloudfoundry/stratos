import { entityCatalog } from '../../../store/src/entity-catalog/entity-catalog';
import { IEntityMetadata } from '../../../store/src/entity-catalog/entity-catalog.types';
import { IFavoriteMetadata, UserFavorite } from '../../../store/src/types/user-favorites.types';
import { FavoritesConfigMapper } from '../shared/components/favorites-meta-card/favorite-config-mapper';

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
