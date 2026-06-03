import { IFavoriteMetadata, UserFavorite } from './user-favorites.types';

export interface IUserFavoritesGroups {
  [endpointGuid: string]: IUserFavoriteGroup;
}

export interface IUserFavoriteGroup {
  endpoint: UserFavorite<IFavoriteMetadata>;
  // Did we automatically add the endpoint to the group?
  ethereal: boolean;
  entitiesIds: string[];
}

export const getDefaultFavoriteGroup = (): IUserFavoriteGroup => ({
  endpoint: {} as UserFavorite<IFavoriteMetadata>,
  ethereal: true,
  entitiesIds: []
});
