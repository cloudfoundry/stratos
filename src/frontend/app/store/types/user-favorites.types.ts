import { UserFavoritesEffect } from '../effects/user-favorites-effect';
import { endpointSchemaKey } from '../helpers/entity-factory';
import { favoritesConfigMapper } from '../../shared/components/favorites-meta-card/favorite-config-mapper';
import { EndpointModel } from './endpoint.types';


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

// Metadata is a json string when stored in the backend so we use this interface to 
// represent what is store in the backend.
export interface BackendUserFavorite {
  entityId: string;
  endpointId: string;
  entityType: string;
  endpointType: string;
  metadata: string;
}

export class UserFavorite<T extends IFavoriteMetadata, Y = any> implements IFavoriteTypeInfo {
  public guid: string;
  public metadata: T = null;
  constructor(
    public endpointId: string,
    public endpointType: string,
    /*
    entityType should correspond to a type in the requestData part of the store.
    */
    public entityType: string,
    public entityId?: string,
    entity?: Y,
  ) {
    debugger;
    if (entity) {
      this.metadata = favoritesConfigMapper.getEntityMetadata(this, entity);
    }
    this.guid = UserFavoritesEffect.buildFavoriteStoreEntityGuid(this);
  }
}

export class UserFavoriteEndpoint extends UserFavorite<IEndpointFavMetadata> {
  constructor(
    public endpointId: string,
    public endpointType: string,
    endpoint: EndpointModel
  ) {
    super(
      endpointId,
      endpointType,
      endpointSchemaKey,
      null,
      endpoint
    );
  }
}
