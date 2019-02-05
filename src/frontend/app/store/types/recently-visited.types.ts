import { IFavoriteTypeInfo } from './user-favorites.types';

export interface IEntityHit {
  guid: string;
  date: number;
}
export interface IRecentlyVisitedEntities {
  [guid: string]: IRecentlyVisitedEntity;
}
export interface IRecentlyVisitedState {
  entities: IRecentlyVisitedEntities;
  hits: IEntityHit[];
}

export interface IRecentlyVisitedEntityDated extends IRecentlyVisitedEntity {
  date: number;
}
export interface IRecentlyVisitedEntity extends IFavoriteTypeInfo {
  guid: string;
  name: string;
  entityId: string;
  prettyType: string;
  prettyEndpointType: string;
  endpointId: string;
  routerLink?: string;
}
