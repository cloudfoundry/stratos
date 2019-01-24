import { IRequestEntityTypeState } from '../app-state';

import { UserFavorite, IFavoriteMetadata } from '../types/user-favorites.types';

import { UpdateUserFavoriteMetadataSuccessAction } from '../actions/user-favourites-actions/update-user-favorite-metadata-action';

export function updateUserFavoriteMetadataReducer(
  state: IRequestEntityTypeState<UserFavorite<IFavoriteMetadata>>,
  action: UpdateUserFavoriteMetadataSuccessAction
): IRequestEntityTypeState<UserFavorite<IFavoriteMetadata>> {
  if (action.type === UpdateUserFavoriteMetadataSuccessAction.ACTION_TYPE) {
    return {
      ...state,
      [action.favorite.guid]: action.favorite
    };
  }
  return state;
}
