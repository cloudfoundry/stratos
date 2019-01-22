import { userFavoritesPaginationKey } from '../effects/user-favorites-effect';
import { userFavoritesSchemaKey } from '../helpers/entity-factory';
import { UserFavorite, IFavoriteMetadata } from '../types/user-favorites.types';
import { isIdInPagination } from './pagination.selectors';
export function isFavorite(favorite: UserFavorite<IFavoriteMetadata>) {
  if (!favorite) {
    return () => false;
  }
  return isIdInPagination(favorite.guid, userFavoritesSchemaKey, userFavoritesPaginationKey);
}

