import { BaseUserFavoritesAction } from './base-user-favorites-action';

export class RemoveUserFavoriteAction extends BaseUserFavoritesAction {
  static ACTION_TYPE = 'REMOVE_USER_FAVORITE';
  constructor(public guid: string) {
    super(
      RemoveUserFavoriteAction.ACTION_TYPE
    );
  }
}

export class RemoveUserFavoriteSuccessAction extends BaseUserFavoritesAction {
  static ACTION_TYPE = 'REMOVE_USER_FAVORITE_SUCCESS';
  constructor(public guid: string) {
    super(
      RemoveUserFavoriteSuccessAction.ACTION_TYPE
    );
  }
}

