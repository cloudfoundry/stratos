import { compose } from '@ngrx/store';

import { STRATOS_ENDPOINT_TYPE, userFavoritesEntitySchema } from '../../../core/src/base-entity-schemas';
import { deriveEndpointFavoriteFromFavorite } from '../../../core/src/core/user-favorite-helpers';
import { InternalAppState, IRequestEntityTypeState } from '../app-state';
import { entityCatalog } from '../entity-catalog/entity-catalog';
import { IUserFavoriteGroup, IUserFavoritesGroups, IUserFavoritesGroupsState } from '../types/favorite-groups.types';
import { IFavoriteMetadata, UserFavorite } from '../types/user-favorites.types';

const favoritesEntityKey = entityCatalog.getEntityKey(STRATOS_ENDPOINT_TYPE, userFavoritesEntitySchema.entityType);

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

