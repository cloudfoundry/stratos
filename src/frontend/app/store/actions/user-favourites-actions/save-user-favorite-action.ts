import { BaseUserFavoritesAction } from './base-user-favorites-action';

export class SaveUserFavoriteAction extends BaseUserFavoritesAction {
  static ACTION_TYPE = 'SAVE_USER_FAVORITE';
  constructor(
    public entityId: string,
    public endpointId: string,
    public entityType: string,
    public endpointType: string
  ) {
    super(
      SaveUserFavoriteAction.ACTION_TYPE
    );
  }
}
