import { IUserFavorite } from '../types/user-favorites.types';
import { UserFavoritesEffect, userFavoritesPaginationKey } from '../effects/user-favorites-effect';
import { isIdInPagination } from './pagination.selectors';
import { userFavoritesSchemaKey } from '../helpers/entity-factory';
export function isFavorite(favorite: Partial<IUserFavorite>) {
  const entityId = UserFavoritesEffect.buildFavoriteStoreEntityGuid(favorite);
  return isIdInPagination(entityId, userFavoritesSchemaKey, userFavoritesPaginationKey);
}

