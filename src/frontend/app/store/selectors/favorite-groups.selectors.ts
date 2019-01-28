import { AppState, IRequestEntityTypeState } from '../app-state';
import { IUserFavoritesGroupsState } from '../types/favorite-groups.types';
import { UserFavorite, IFavoriteMetadata } from '../types/user-favorites.types';

export const favoriteGroupsSelector = (state: AppState): IUserFavoritesGroupsState => state.userFavoritesGroups;

export const favoriteEntitiesSelector = (state: AppState):
  IRequestEntityTypeState<UserFavorite<IFavoriteMetadata>> => state.requestData.userFavorites;
