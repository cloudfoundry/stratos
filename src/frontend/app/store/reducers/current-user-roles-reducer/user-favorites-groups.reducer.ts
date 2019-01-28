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
    const { guid } = getEndpointFavorite(favorite);
    favoriteGroups[guid] = addFavoriteToGroup(favoriteGroups[guid], favorite);
    return favoriteGroups;
  }, {} as IUserFavoritesGroupsState);
}

function getEndpointFavorite(favorite: UserFavorite<IFavoriteMetadata>) {
  if (favorite.entityType !== 'endpoint') {
    const endpointFav = {
      ...favorite
    };
    endpointFav.entityId = null;
    endpointFav.entityType = 'endpoint';
    endpointFav.guid = UserFavorite.buildFavoriteStoreEntityGuid(endpointFav);
    return endpointFav;
  }
  return favorite;
}



function removeFavoriteFromGroup(state: IUserFavoritesGroupsState, action: RemoveUserFavoriteSuccessAction) {
  const { favorite } = action;
  const endpointFavorite = getEndpointFavorite(favorite);
  const userGroup = state[endpointFavorite.guid] || getDefaultFavoriteGroup();
  if (isEndpointTypeFavorite(favorite)) {
    if (!groupHasEntities(userGroup)) {
      return removeGroup(state, endpointFavorite.guid);
    }
    // The endpoint has been removed but dependant entities are still within the group
    // The group is now ethereal
    return {
      ...state,
      [endpointFavorite.guid]: {
        ...userGroup,
        ethereal: true
      }
    };
  } else {
    const entitiesIds = userGroup.entitiesIds.filter(id => id !== favorite.guid);
    if (!entitiesIds.length && userGroup.ethereal) {
      return removeGroup(state, endpointFavorite.guid);
    }
    return {
      ...state,
      [endpointFavorite.guid]: {
        ...userGroup,
        entitiesIds
      }
    };
  }
}

function removeGroup(state: IUserFavoritesGroupsState, endpointGuid: string) {
  const {
    [endpointGuid]: removedEndpoint,
    ...newState
  } = state;
  return newState;
}

function groupHasEntities(group: IUserFavoriteGroup) {
  return group.entitiesIds.length > 0;
}

function addEntityFavorite(favoriteGroups: IUserFavoritesGroupsState, action: SaveUserFavoriteAction) {
  const { favorite } = action;
  const { guid } = getEndpointFavorite(favorite);
  const group = favoriteGroups[guid];
  const newGroup = addFavoriteToGroup(group, favorite);
  return {
    ...favoriteGroups,
    [guid]: newGroup
  };
}

function addFavoriteToGroup(_favoriteGroup: IUserFavoriteGroup = getDefaultFavoriteGroup(), favorite: UserFavorite<IFavoriteMetadata>) {
  const favoriteGroup = { ..._favoriteGroup };
  const { guid } = favorite;
  const isEndpoint = isEndpointTypeFavorite(favorite);
  if (!isEndpoint && guid && !favoriteGroup.entitiesIds.includes(guid)) {
    favoriteGroup.entitiesIds.push(guid);
  }
  if (isEndpoint) {
    favoriteGroup.ethereal = false;
  }
  return favoriteGroup;
}
