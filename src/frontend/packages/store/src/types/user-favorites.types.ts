import { entityCatalog } from '../entity-catalog/entity-catalog';
import { IEntityMetadata, IStratosEntityBuilder, IStratosEntityDefinition } from '../entity-catalog/entity-catalog.types';
import { StratosBaseCatalogEntity } from './../entity-catalog/entity-catalog-entity/entity-catalog-entity';

export const userFavoritesPaginationKey = 'userFavorites';


export interface IFavoritesInfo {
  fetching: boolean;
  error: boolean;
}

/**
 * A user favorite blueprint. Can be used to fetch the full entity from a particular endpoint.
 */
export interface IFavoriteTypeInfo {
  endpointType: string;
  entityType: string;
}

export interface IFavoriteMetadata {
  name: string;
  [key: string]: string;
}
export interface IEndpointFavMetadata extends IFavoriteMetadata {
  subType: string;
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

export interface FavoriteIconData {
  icon?: string;
  iconFont?: string;
}

const favoriteGuidSeparator = '-';

export class UserFavorite<T extends IEntityMetadata = IEntityMetadata> implements IFavoriteTypeInfo {
  public guid: string;

  private catalogEntity: StratosBaseCatalogEntity;
  private entityBuilder: IStratosEntityBuilder<IEntityMetadata>;

  constructor(
    public endpointId: string,
    public endpointType: string,
    /*
    entityType should correspond to a type in the requestData part of the store.
    */
    public entityType: string,
    public entityId?: string,
    public metadata: T = null
  ) {
    // Set the guid for this favorite
    this.buildFavoriteStoreEntityGuid();
    this.catalogEntity = entityCatalog.getEntity(this.endpointType, this.entityType);
    if (this.catalogEntity && this.catalogEntity.builders && this.catalogEntity.builders.entityBuilder) {
      this.entityBuilder = this.catalogEntity.builders.entityBuilder;
    } else {
      this.entityBuilder = {} as IStratosEntityBuilder<IEntityMetadata>;
    }
  }

  static getEntityGuidFromFavoriteGuid(favoriteGuid: string): string {
    const parts = favoriteGuid.split(favoriteGuidSeparator);
    if (parts.length < 3) {
      console.error('Failed to determine entity guid from favorite guid: ', parts);
      return null;
    } else if (parts.length === 3) {
      return favoriteGuid.split(favoriteGuidSeparator)[0];
    } else {
      // cf guid may contain a hypen meaning there are more than 3 parts, so use everything prior to the 2nd to last part
      return favoriteGuid.replace(
        `${favoriteGuidSeparator}${parts[parts.length - 2]}${favoriteGuidSeparator}${parts[parts.length - 1]}`,
        '');
    }
  }

  public canFavorite(): boolean {
    // What do we need to be able to favorite an entity?
    return !!this.entityBuilder.getGuid && !!this.entityBuilder.getMetadata && !!this.entityBuilder.getLink;
  }

  // Get the link to navigate to the view for the given entity backing this user favorite
  public getLink(): string {
    return this.entityBuilder.getLink ? this.entityBuilder.getLink(this) : null;
  }

  // Get the type name, e.g. 'Application'
  public getPrettyTypeName(): string {
    return this.catalogEntity && this.catalogEntity.definition ? this.catalogEntity.definition.label : 'Unknown';
  }

  // Get icon data for the favorite
  public getIcon(): FavoriteIconData {
    const defn = this.catalogEntity && this.catalogEntity.definition ? this.catalogEntity.definition : {} as IStratosEntityDefinition;
    return {
      icon: defn.icon || 'help',
      iconFont: defn.iconFont
    };
  }

  private buildFavoriteStoreEntityGuid() {
    this.guid = [this.entityId, this.endpointId, this.entityType, this.endpointType].reduce((newArray, value) => {
      if (value) {
        return [ ...newArray, value ];
      }
      return newArray;
    }, []).join(favoriteGuidSeparator);
  }
}

export type UserFavoriteEndpoint = UserFavorite<IEndpointFavMetadata>;

