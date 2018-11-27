import { BaseUserFavoritesAction } from './base-user-favorites-action';

export class RemoveUserFavoriteAction extends BaseUserFavoritesAction {
  static ACTION_TYPE = 'REMOVE_USER_FAVORITE';
  constructor(public guid: string) {
    super(
      RemoveUserFavoriteAction.ACTION_TYPE
    );
  }
}
