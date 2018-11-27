import { BaseUserFavoritesAction } from './base-user-favorites-action';

export class GetUserFavoritesAction extends BaseUserFavoritesAction {
  static ACTION_TYPE = 'GET_USER_FAVORITES';
  constructor() {
    super(
      GetUserFavoritesAction.ACTION_TYPE
    );
  }
}
