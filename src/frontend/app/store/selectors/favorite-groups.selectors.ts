import { AppState, IRequestEntityTypeState } from '../app-state';
import { IUserFavoritesGroups, IUserFavoritesGroupsState, IUserFavoriteGroup } from '../types/favorite-groups.types';
import { UserFavorite, IFavoriteMetadata } from '../types/user-favorites.types';
import { getEndpointFavorite } from '../../core/user-favorite-helpers';
import { compose } from '@ngrx/store';


export const favoriteEntitiesSelector = (state: AppState):
  IRequestEntityTypeState<UserFavorite<IFavoriteMetadata>> => state.requestData.userFavorites;

export const favoriteGroupsSelector = (state: AppState): IUserFavoritesGroups => state.userFavoritesGroups.groups;

export const favoriteGroupSelector = (favorite: UserFavorite<IFavoriteMetadata>) => {
  const endpointFavorite = getEndpointFavorite(favorite);
  return (groups: IUserFavoritesGroups): IUserFavoriteGroup => {
    return groups[endpointFavorite.guid];
  };
};

export const favoriteInGroupGroupSelector = (favorite: UserFavorite<IFavoriteMetadata>) => {
  return (group: IUserFavoriteGroup): boolean => {
    if (!group) {
      return false;
    }
    if (favorite.entityType === 'endpoint' && !group.ethereal) {
      return true;
    }
    return group.entitiesIds.includes(favorite.guid);
  };
};

export function isFavoriteSelector(favorite: UserFavorite<IFavoriteMetadata>) {
  return compose(
    favoriteInGroupGroupSelector(favorite),
    favoriteGroupSelector(favorite),
    favoriteGroupsSelector,
  )
}