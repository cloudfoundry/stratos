import { IUserFavorite } from '../types/user-favorites.types';
import { UserFavoritesEffect } from '../effects/user-favoutites-effect';
import { isIdInPagination } from './pagination.selectors';
export function isFavorite(favorite: Partial<IUserFavorite>, entityKey: string, paginationKey: string) {
  const entityId = UserFavoritesEffect.buildFavoriteStoreEntityGuid(favorite);
  return isIdInPagination(entityId, entityKey, paginationKey);
}

