import { TFavoriteMapperFunction } from '../favorite-config-mapper';
import { IEndpointFavMetadata, IFavoriteMetadata, UserFavorite } from './user-favorites.types';

export interface IFavoriteEntity {
  type: string;
  prettyName: string;
  cardMapper: TFavoriteMapperFunction<IFavoriteMetadata>;
  favorite: UserFavorite<IFavoriteMetadata>;
}

export interface IGroupedFavorites {
  endpoint: IHydrationResults<IEndpointFavMetadata>;
  entities: IHydrationResults[];
}

export interface IAllFavorites {
  fetching: boolean;
  error: boolean;
  entityGroups: IGroupedFavorites[];
}

export interface IHydrationResults<T extends IFavoriteMetadata = IFavoriteMetadata> {
  type: string;
  cardMapper: TFavoriteMapperFunction<any>;
  prettyName: string;
  favorite: UserFavorite<T>;
}
