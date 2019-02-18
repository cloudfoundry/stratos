import { BaseUserFavoritesAction } from './base-user-favorites-action';
import { UserFavorite, IFavoriteMetadata } from '../../types/user-favorites.types';

export class ToggleUserFavoriteAction extends BaseUserFavoritesAction {
  static ACTION_TYPE = 'TOGGLE_USER_FAVORITE';
  constructor(
    public favorite: UserFavorite<IFavoriteMetadata>
  ) {
    super(
      ToggleUserFavoriteAction.ACTION_TYPE
    );
  }
}
