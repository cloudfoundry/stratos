export interface IUserFavoritesGroupsState {
  [endpointGuid: string]: IUserFavoriteGroup;
}

export interface IUserFavoriteGroup {
  // Did we automatically add the endpoint to the group?
  ethereal: boolean;
  search: string;
  typeFilter: string;
  entitiesIds: string[];
}

export const getDefaultFavoriteGroup = () => ({
  ethereal: true,
  search: null,
  typeFilter: null,
  entitiesIds: []
});
