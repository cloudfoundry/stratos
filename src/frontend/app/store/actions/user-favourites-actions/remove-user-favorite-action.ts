import { BaseUserFavoritesAction } from './base-user-favorites-action';
import { UserFavorite, IFavoriteMetadata } from '../../types/user-favorites.types';

export class RemoveUserFavoriteAction extends BaseUserFavoritesAction {
  static ACTION_TYPE = 'REMOVE_USER_FAVORITE';
  constructor(public favorite: UserFavorite<IFavoriteMetadata>) {
    super(
      RemoveUserFavoriteAction.ACTION_TYPE
    );
  }
}

export class RemoveUserFavoriteSuccessAction extends BaseUserFavoritesAction {
  static ACTION_TYPE = 'REMOVE_USER_FAVORITE_SUCCESS';
  constructor(public favorite: UserFavorite<IFavoriteMetadata>) {
    super(
      RemoveUserFavoriteSuccessAction.ACTION_TYPE
    );
  }
}

