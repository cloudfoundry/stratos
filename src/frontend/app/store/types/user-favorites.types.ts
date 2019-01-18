import { UserFavoritesEffect } from '../effects/user-favorites-effect';
import { endpointSchemaKey } from '../helpers/entity-factory';

/**
 * A user favorite blueprint. Can be used to fetch the full entity from a particular endpoint.
 */
export interface IFavoriteTypeInfo {
  endpointType: string;
  entityType?: string;
}

export interface IFavoriteMetadata {
  [key: string]: string;
}


export class UserFavorite implements IFavoriteTypeInfo {
  public guid: string;
  constructor(
    public endpointId: string,
    public endpointType: string,
    /*
    entityType should correspond to a type in the requestData part of the store.
    */
    public entityType: string,
    public entityId?: string,
    public metadata?: IFavoriteMetadata
  ) {
    this.guid = UserFavoritesEffect.buildFavoriteStoreEntityGuid(this);
  }
}

export class UserFavoriteEndpoint extends UserFavorite {
  constructor(
    public endpointId: string,
    public endpointType: string
  ) {
    super(
      endpointId,
      endpointType,
      endpointSchemaKey
    );
  }
}
