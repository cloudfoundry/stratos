import { BaseUserFavoritesAction } from './base-user-favorites-action';
import { UserFavorite } from '../../types/user-favorites.types';

export class SaveUserFavoriteAction extends BaseUserFavoritesAction {
  static ACTION_TYPE = 'SAVE_USER_FAVORITE';
  constructor(
    public favorite: UserFavorite
  ) {
    super(
      SaveUserFavoriteAction.ACTION_TYPE
    );
  }
}
