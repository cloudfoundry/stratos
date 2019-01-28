import { BaseUserFavoritesAction } from './base-user-favorites-action';
import { UserFavorite, IFavoriteMetadata } from '../../types/user-favorites.types';

export class GetUserFavoritesAction extends BaseUserFavoritesAction {
  static ACTION_TYPE = 'GET_USER_FAVORITES';
  constructor() {
    super(
      GetUserFavoritesAction.ACTION_TYPE
    );
  }
}

export class GetUserFavoritesSuccessAction extends BaseUserFavoritesAction {
  static ACTION_TYPE = 'GET_USER_FAVORITES_SUCCESS';
  constructor(public favorites: UserFavorite<IFavoriteMetadata>[]) {
    super(
      GetUserFavoritesSuccessAction.ACTION_TYPE
    );
  }
}

