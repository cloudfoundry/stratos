export type TRecentlyVisited = IRecentlyVisitedEntity[]

export interface IRecentlyVisitedEntity {
  name: string;
  prettyType: string;
  prettyEndpointType: string;
  link?: string;
}
