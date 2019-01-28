import { IUserFavoritesGroupsState, getDefaultFavoriteGroup } from '../../types/favorite-groups.types';
import { Action } from '@ngrx/store';
import { GetUserFavoritesSuccessAction } from '../../actions/user-favourites-actions/get-user-favorites-action';

export function userFavoriteGroupsReducer(state: IUserFavoritesGroupsState = {}, action: Action): IUserFavoritesGroupsState {
  switch (action.type) {
    case GetUserFavoritesSuccessAction.ACTION_TYPE:
      return buildFavoritesGroups(action as GetUserFavoritesSuccessAction)
  }
  return state;
}

function buildFavoritesGroups(action: GetUserFavoritesSuccessAction) {
  const { favorites } = action;

  return favorites.reduce((favoriteGroups, favorite) => {
    const { endpointId, entityId } = favorite;
    if (!favoriteGroups[endpointId]) {
      favoriteGroups[endpointId] = getDefaultFavoriteGroup();
    }
    const favoriteGroup = favoriteGroups[endpointId];
    if (entityId && !favoriteGroup.entitiesIds.includes(entityId)) {
      favoriteGroup.entitiesIds.push(entityId);
    }
    return favoriteGroups;
  }, {} as IUserFavoritesGroupsState);
}
