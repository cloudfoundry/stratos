import { IFavoriteMetadata } from '../../store/src/types/user-favorites.types';

export interface ISpaceFavMetadata extends IFavoriteMetadata {
  guid: string;
  orgGuid: string;
  name: string;
  cfGuid: string;
}

export interface IOrgFavMetadata extends IFavoriteMetadata {
  guid: string;
  status: string;
  name: string;
  cfGuid: string;
}

export interface IAppFavMetadata extends IFavoriteMetadata {
  guid: string;
  cfGuid: string;
  name: string;
}

export interface IBasicCFMetaData extends IFavoriteMetadata {
  guid: string;
  name: string;
}
