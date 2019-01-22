import { IFavoriteMetadata } from './../../types/user-favorites.types';
import { BaseUserFavoritesAction } from './base-user-favorites-action';
import { UserFavorite } from '../../types/user-favorites.types';

export class SaveUserFavoriteAction extends BaseUserFavoritesAction {
  static ACTION_TYPE = 'SAVE_USER_FAVORITE';
  constructor(
    public favorite: UserFavorite<IFavoriteMetadata>
  ) {
    super(
      SaveUserFavoriteAction.ACTION_TYPE
    );
  }
}
