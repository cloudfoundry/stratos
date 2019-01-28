import { IUserFavoritesGroupsState, getDefaultFavoriteGroup, IUserFavoriteGroup } from '../../types/favorite-groups.types';
import { Action } from '@ngrx/store';
import { GetUserFavoritesSuccessAction } from '../../actions/user-favourites-actions/get-user-favorites-action';
import { RemoveUserFavoriteSuccessAction } from '../../actions/user-favourites-actions/remove-user-favorite-action';
import { SaveUserFavoriteAction } from '../../actions/user-favourites-actions/save-user-favorite-action';
import { isEndpointTypeFavorite } from '../../../core/user-favorite-helpers';
import { UserFavorite, IFavoriteMetadata } from '../../types/user-favorites.types';

export function userFavoriteGroupsReducer(state: IUserFavoritesGroupsState = {}, action: Action): IUserFavoritesGroupsState {
  switch (action.type) {
    case GetUserFavoritesSuccessAction.ACTION_TYPE:
      return buildFavoritesGroups(action as GetUserFavoritesSuccessAction);
    case RemoveUserFavoriteSuccessAction.ACTION_TYPE:
      return removeFavoriteFromGroup(state, action as RemoveUserFavoriteSuccessAction);
    case SaveUserFavoriteAction.ACTION_TYPE:
      return addEntityFavorite(state, action as SaveUserFavoriteAction);
  }
  return state;
}

function buildFavoritesGroups(action: GetUserFavoritesSuccessAction) {
  const { favorites } = action;
  return favorites.reduce((favoriteGroups, favorite) => {
    const { endpointId } = favorite;
    favoriteGroups[endpointId] = addFavoriteToGroup(favoriteGroups[endpointId], favorite);
    return favoriteGroups;
  }, {} as IUserFavoritesGroupsState);
}



function removeFavoriteFromGroup(state: IUserFavoritesGroupsState, action: RemoveUserFavoriteSuccessAction) {
  const { favorite } = action;
  const { endpointId, entityId } = favorite;
  const userGroup = state[endpointId] || getDefaultFavoriteGroup();
  if (isEndpointTypeFavorite(favorite)) {
    if (!groupHasEntities(userGroup)) {
      return removeGroup(state, endpointId);
    }
    // The endpoint has been removed but dependant entities are still within the group
    // The group is now ethereal
    return {
      ...state,
      [endpointId]: {
        ...userGroup,
        ethereal: true
      }
    }
  } else {
    const entitiesIds = userGroup.entitiesIds.filter(id => id !== entityId);
    if (!entitiesIds.length && userGroup.ethereal) {
      return removeGroup(state, endpointId);
    }
    return {
      ...state,
      [endpointId]: {
        ...userGroup,
        entitiesIds
      }
    };
  }
}

function removeGroup(state: IUserFavoritesGroupsState, endpointId: string) {
  const {
    [endpointId]: removedEndpoint,
    ...newState
  } = state;
  return newState;
}

function groupHasEntities(group: IUserFavoriteGroup) {
  return group.entitiesIds.length > 0;
}

function addEntityFavorite(favoriteGroups: IUserFavoritesGroupsState, action: SaveUserFavoriteAction) {
  const { favorite } = action;
  const { endpointId } = favorite;
  const group = favoriteGroups[endpointId];
  const newGroup = addFavoriteToGroup(group, favorite);
  return {
    ...favoriteGroups,
    [endpointId]: newGroup
  };
}

function addFavoriteToGroup(_favoriteGroup: IUserFavoriteGroup = getDefaultFavoriteGroup(), favorite: UserFavorite<IFavoriteMetadata>) {
  const favoriteGroup = { ..._favoriteGroup };
  const { entityId } = favorite;
  const isEndpoint = isEndpointTypeFavorite(favorite);
  if (entityId && !favoriteGroup.entitiesIds.includes(entityId)) {
    favoriteGroup.entitiesIds.push(entityId);
  }
  if (isEndpoint) {
    favoriteGroup.ethereal = false;
  }
  return favoriteGroup;
}
