export interface IUserFavoritesGroupsState {
  [endpointGuid: string]: IUserFavoriteGroup;
}

export interface IUserFavoriteGroup {
  search: string;
  typeFilter: string;
  entitiesIds: string[];
}

export const getDefaultFavoriteGroup = () => ({
  search: null,
  typeFilter: null,
  entitiesIds: []
});
