import { UserFavoritesEffect } from '../effects/user-favorites-effect';
import { endpointSchemaKey } from '../helpers/entity-factory';


export interface IEndpointFavMetadata extends IFavoriteMetadata {
  guid: string;
  address: string;
  user: string;
  admin: string;
}

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


export class UserFavorite<T extends IFavoriteMetadata> implements IFavoriteTypeInfo {
  public guid: string;
  constructor(
    public endpointId: string,
    public endpointType: string,
    /*
    entityType should correspond to a type in the requestData part of the store.
    */
    public entityType: string,
    public entityId?: string,
    public metadata?: T
  ) {
    this.guid = UserFavoritesEffect.buildFavoriteStoreEntityGuid(this);
  }
}

export class UserFavoriteEndpoint extends UserFavorite<IEndpointFavMetadata> {
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
