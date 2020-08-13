import { IFavoriteTypeInfo } from './user-favorites.types';

// Types used for maintaining the list of recent entities visited by the user

export interface IRecentlyVisitedEntity extends IFavoriteTypeInfo {
  guid: string;
  name: string;
  date: number;
  entityId: string;
  prettyType: string;
  prettyEndpointType: string;
  endpointId: string;
  routerLink?: string;
}

export interface IRecentlyVisitedEntityWithIcon extends IRecentlyVisitedEntity {
  icon: string;
  iconFont: string;
}

export interface IRecentlyVisitedState {
  [guid: string]: IRecentlyVisitedEntity;
}
