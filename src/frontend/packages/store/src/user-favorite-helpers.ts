import { endpointEntityType } from './helpers/stratos-entity-factory';
import { IFavoriteMetadata, UserFavorite } from './types/user-favorites.types';

export function getEndpointIDFromFavorite(favorite: UserFavorite<IFavoriteMetadata>): string {
  if (favorite.entityType !== endpointEntityType) {
    return new UserFavorite<IFavoriteMetadata>(favorite.endpointId, favorite.endpointType, endpointEntityType, null, {name: ''}).guid;
  }
  return favorite.guid;
}
