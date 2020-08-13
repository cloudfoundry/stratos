import { IFavoriteMetadata, UserFavorite } from '../types/user-favorites.types';
import { isFavoriteSelector } from './favorite-groups.selectors';

export function isFavorite(favorite: UserFavorite<IFavoriteMetadata>) {
  if (!favorite) {
    return () => false;
  }
  return isFavoriteSelector(favorite);
}

