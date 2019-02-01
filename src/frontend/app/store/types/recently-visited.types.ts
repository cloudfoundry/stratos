import { UserFavorite, IFavoriteMetadata } from './user-favorites.types';
export type TRecentlyVisitedState = IRecentlyVisitedEntityDated[];

export interface IRecentlyVisitedEntityDated extends IRecentlyVisitedEntity {
  date: number;
}
export interface IRecentlyVisitedEntity {
  guid: string;
  name: string;
  prettyType: string;
  prettyEndpointType: string;
  routerLink?: string;
  favorite?: UserFavorite<IFavoriteMetadata>;
}
