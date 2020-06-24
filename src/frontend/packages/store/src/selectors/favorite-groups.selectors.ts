import { compose } from '@ngrx/store';

import { InternalAppState, IRequestEntityTypeState } from '../app-state';
import { entityCatalog } from '../entity-catalog/entity-catalog';
import { STRATOS_ENDPOINT_TYPE, userFavouritesEntityType } from '../helpers/stratos-entity-factory';
import { IUserFavoriteGroup, IUserFavoritesGroups, IUserFavoritesGroupsState } from '../types/favorite-groups.types';
import { IFavoriteMetadata, UserFavorite } from '../types/user-favorites.types';
import { deriveEndpointFavoriteFromFavorite } from '../user-favorite-helpers';

const favoritesEntityKey = entityCatalog.getEntityKey(STRATOS_ENDPOINT_TYPE, userFavouritesEntityType);

export const favoriteEntitiesSelector = (state: InternalAppState):
  IRequestEntityTypeState<UserFavorite<IFavoriteMetadata>> => state.requestData[favoritesEntityKey];

const favoriteGroupsStateSelector = (state: InternalAppState): IUserFavoritesGroupsState => state.userFavoritesGroups;

const favoriteGroupsFetchingSelector = (state: IUserFavoritesGroupsState): boolean => state.busy;

const favoriteGroupsErrorSelector = (state: IUserFavoritesGroupsState): boolean => state.error;


export const favoriteGroupsSelector = compose(
  (state: IUserFavoritesGroupsState): IUserFavoritesGroups => state.groups,
  favoriteGroupsStateSelector
);

const favoriteGroupSelector = (favorite: UserFavorite<IFavoriteMetadata>) => {
  const endpointFavorite = deriveEndpointFavoriteFromFavorite(favorite);
  return (groups: IUserFavoritesGroups): IUserFavoriteGroup => {
    return groups[endpointFavorite.guid];
  };
};

const favoriteInGroupGroupSelector = (favorite: UserFavorite<IFavoriteMetadata>) => {
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
    favoriteGroupsSelector
  );
}

export const fetchingFavoritesSelector = compose(
  favoriteGroupsFetchingSelector,
  favoriteGroupsStateSelector
);

export const errorFetchingFavoritesSelector = compose(
  favoriteGroupsErrorSelector,
  favoriteGroupsStateSelector
);

