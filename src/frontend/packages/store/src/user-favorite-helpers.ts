import { entityCatalog } from './entity-catalog/entity-catalog';
import { IEntityMetadata } from './entity-catalog/entity-catalog.types';
import { endpointEntityType } from './helpers/stratos-entity-factory';
import { IFavoriteMetadata, UserFavorite } from './types/user-favorites.types';
import { UserFavoriteManager } from './user-favorite-manager';

// Uses the endpoint definition to get the helper that can look up an entity
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


export function getEndpointIDFromFavorite(favorite: UserFavorite<IFavoriteMetadata>): string {
  if (favorite.entityType !== endpointEntityType) {
    return new UserFavorite<IFavoriteMetadata>(favorite.endpointId, favorite.endpointType, endpointEntityType, null, {name: ''}).guid;
  }
  return favorite.guid;
}
