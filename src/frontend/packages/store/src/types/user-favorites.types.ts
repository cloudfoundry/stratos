import { favoritesConfigMapper } from '../../../core/src/shared/components/favorites-meta-card/favorite-config-mapper';
import { endpointSchemaKey } from '../helpers/entity-factory';
import { EndpointModel } from './endpoint.types';
import { LoggerService } from '../../../core/src/core/logger.service';

export const userFavoritesPaginationKey = 'userFavorites';

/**
 * A user favorite blueprint. Can be used to fetch the full entity from a particular endpoint.
 */
export interface IFavoriteTypeInfo {
  endpointType: string;
  entityType: string;
}

export interface IFavoriteMetadata {
  [key: string]: string;
}
export interface IEndpointFavMetadata extends IFavoriteMetadata {
  guid: string;
  address: string;
  user: string;
  admin: string;
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

const favoriteGuidSeparator = '-';

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
    if (entity) {
      this.metadata = favoritesConfigMapper.getEntityMetadata(this, entity);
    }
    this.guid = UserFavorite.buildFavoriteStoreEntityGuid(this);
  }

  static buildFavoriteStoreEntityGuid(favorite: UserFavorite<IFavoriteMetadata>) {
    const {
      entityId,
      endpointId,
      entityType,
      endpointType,
    } = favorite;
    return [
      entityId,
      endpointId,
      entityType,
      endpointType,
    ]
      .reduce((newArray, value) => {
        if (value) {
          return [
            ...newArray,
            value,
          ];
        }
        return newArray;
      }, [])
      .join(favoriteGuidSeparator);
  }

  static getEntityGuidFromFavoriteGuid(favoriteGuid: string, logger: LoggerService): string {
    const parts = favoriteGuid.split(favoriteGuidSeparator);
    if (parts.length < 3) {
      logger.error('Failed to determine entity guid from favorite guid: ', parts);
      return null;
    } else if (parts.length === 3)  {
      return favoriteGuid.split(favoriteGuidSeparator)[0];
    } else {
      // cf guid may contain a hypen meaning there are more than 3 parts, so use everything prior to the 2nd to last part
      return favoriteGuid.replace(
        `${favoriteGuidSeparator}${parts[parts.length - 2]}${favoriteGuidSeparator}${parts[parts.length - 1]}`,
        '');
    }
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
