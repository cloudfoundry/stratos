import { ActionState } from '../reducers/api-request-reducer/types';

export interface IUserFavoritesGroupsState extends ActionState {
  groups: IUserFavoritesGroups;
}
export interface IUserFavoritesGroups {
  [endpointGuid: string]: IUserFavoriteGroup;
}


export interface IUserFavoriteGroup {
  // Did we automatically add the endpoint to the group?
  ethereal: boolean;
  search: string;
  typeFilter: string;
  entitiesIds: string[];
}

export const getDefaultFavoriteGroup = (): IUserFavoriteGroup => ({
  ethereal: true,
  search: null,
  typeFilter: null,
  entitiesIds: []
});

export const getDefaultFavoriteGroupsState = (): IUserFavoritesGroupsState => ({
  busy: false,
  error: false,
  message: '',
  groups: {}
});
