/**
 * A user favorite blueprint. Can be used to fetch the full entity from a particular endpoint.
 */
export interface IUserFavorite {
  guid: string;
  entityId?: string;
  endpointId: string;
  /*
    entityType should correspond to a type in the requestData part of the store.
  */
  entityType?: string;
  endpointType: string;
}
