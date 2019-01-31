export type TRecentlyVisitedState = IRecentlyVisitedEntity[];

export interface IRecentlyVisitedEntity {
  guid: string;
  name: string;
  prettyType: string;
  prettyEndpointType: string;
  routerLink?: string;
}
