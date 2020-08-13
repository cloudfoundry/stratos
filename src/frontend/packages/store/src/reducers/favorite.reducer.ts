import {
  RemoveUserFavoriteSuccessAction,
  SaveUserFavoriteSuccessAction,
  UpdateUserFavoriteMetadataSuccessAction,
} from '../actions/user-favourites.actions';
import { IRequestEntityTypeState } from '../app-state';
import { IFavoriteMetadata, UserFavorite } from '../types/user-favorites.types';

export function addOrUpdateUserFavoriteMetadataReducer(
  state: IRequestEntityTypeState<UserFavorite<IFavoriteMetadata>>,
  action: UpdateUserFavoriteMetadataSuccessAction
): IRequestEntityTypeState<UserFavorite<IFavoriteMetadata>> {
  if (
    action.type === UpdateUserFavoriteMetadataSuccessAction.ACTION_TYPE ||
    action.type === SaveUserFavoriteSuccessAction.ACTION_TYPE
  ) {
    return {
      ...state,
      [action.favorite.guid]: action.favorite
    };
  }
  return state;
}
export function deleteUserFavoriteMetadataReducer(
  state: IRequestEntityTypeState<UserFavorite<IFavoriteMetadata>>,
  action: RemoveUserFavoriteSuccessAction
): IRequestEntityTypeState<UserFavorite<IFavoriteMetadata>> {
  if (action.type === RemoveUserFavoriteSuccessAction.ACTION_TYPE) {
    const {
      [action.guid]: deletedFavorite,
      ...newState
    } = state;
    return newState;
  }
  return state;
}

