import { UserFavoritesEffect } from '../effects/user-favorites-effect';
/**
 * A user favorite blueprint. Can be used to fetch the full entity from a particular endpoint.
 */

export class UserFavorite {
  public guid: string;
  constructor(
    public endpointId: string,
    public endpointType: string,
    public entityId?: string,
    /*
    entityType should correspond to a type in the requestData part of the store.
  */
    public entityType?: string,
  ) {
    this.guid = UserFavoritesEffect.buildFavoriteStoreEntityGuid({
      endpointId,
      endpointType,
      entityId,
      entityType
    });
  }
}
