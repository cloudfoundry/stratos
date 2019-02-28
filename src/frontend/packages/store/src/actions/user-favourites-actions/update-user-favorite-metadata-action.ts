import { UserFavorite, IFavoriteMetadata } from '../../types/user-favorites.types';
import { BaseUserFavoritesAction } from './base-user-favorites-action';

export class UpdateUserFavoriteMetadataAction extends BaseUserFavoritesAction {
  static ACTION_TYPE = 'UPDATE_FAVORITE_METADATA';
  constructor(public favorite: UserFavorite<IFavoriteMetadata>) {
    super(
      UpdateUserFavoriteMetadataAction.ACTION_TYPE
    );
  }
}

export class UpdateUserFavoriteMetadataSuccessAction extends BaseUserFavoritesAction {
  static ACTION_TYPE = 'UPDATE_FAVORITE_METADATA_SUCCESS';
  constructor(public favorite: UserFavorite<IFavoriteMetadata>) {
    super(
      UpdateUserFavoriteMetadataSuccessAction.ACTION_TYPE
    );
  }
}

