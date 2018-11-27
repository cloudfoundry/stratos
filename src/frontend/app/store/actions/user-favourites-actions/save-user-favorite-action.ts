import { BaseUserFavoritesAction } from './base-user-favorites-action';

export class SaveUserFavoriteAction extends BaseUserFavoritesAction {
  static ACTION_TYPE = 'SAVE_USER_FAVORITE';
  constructor(type: string) {
    super(
      SaveUserFavoriteAction.ACTION_TYPE,
      type
    );
  }
}
