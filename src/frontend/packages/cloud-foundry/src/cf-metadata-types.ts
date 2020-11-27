import { IFavoriteMetadata } from '../../store/src/types/user-favorites.types';

export interface ISpaceFavMetadata extends IFavoriteMetadata {
  orgGuid: string;
}
