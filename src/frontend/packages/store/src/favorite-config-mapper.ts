import { Injectable } from '@angular/core';

import { entityCatalog } from './entity-catalog/entity-catalog';
import { StratosBaseCatalogEntity } from './entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { EntityCatalogHelpers } from './entity-catalog/entity-catalog.helper';
import { IEntityMetadata, IStratosEntityDefinition } from './entity-catalog/entity-catalog.types';
import { EndpointModel } from './types/endpoint.types';
import { MenuItem } from './types/menu-item.types';
import { EntityRequestAction } from './types/request.types';
import { IFavoriteMetadata, IFavoriteTypeInfo, UserFavorite, UserFavoriteEndpoint } from './types/user-favorites.types';

export interface IFavoritesMetaCardConfig {
  type: string;
  routerLink?: string;
  name: string;
  menuItems?: MenuItem[];
}

export interface IFavoriteConfig<T, Q extends IFavoriteMetadata> {
  favoriteInfo: IFavoriteTypeInfo;
  prettyName: string;
  mapper: TFavoriteMapperFunction<Q>;
  entityToMetadata: TEntityToMetadata<T, Q>;
}

export class FavoriteConfig<T, Q extends IFavoriteMetadata> implements IFavoriteConfig<T, Q> {
  constructor(
    public favoriteInfo: IFavoriteTypeInfo,
    public prettyName: string,
    public mapper: TFavoriteMapperFunction<Q>,
    public entityToMetadata: TEntityToMetadata<T, Q>
  ) { }
}

export type TFavoriteMapperFunction<T extends IFavoriteMetadata> = (entity: T) => IFavoritesMetaCardConfig;

export type TFavoriteActionGenerator<T extends IFavoriteMetadata> = (favorite: UserFavorite<T>) => EntityRequestAction;

export type TEntityToMetadata<T, Q extends IFavoriteMetadata> = (entity: T) => Q;
export interface IFavoriteActionGenerators {
  [key: string]: TFavoriteActionGenerator<IFavoriteMetadata>;
}

/**
 * Stores the config used to hydrator and render favorites.
 */
@Injectable({
  providedIn: 'root'
})
export class FavoritesConfigMapper {
  private mapperKeySeparator = '-';
  constructor() { }
  public getMapperKeyFromFavoriteInfo(favoriteInfo: IFavoriteTypeInfo) {
    const { endpointType, entityType } = favoriteInfo;
    return [endpointType, entityType].join(this.mapperKeySeparator);
  }

  /**
   * For a given favorite, return the corresponding metadata
   */
  public getEntityMetadata(favorite: IFavoriteTypeInfo, entity: any) {
    const catalogEntity = entityCatalog.getEntity(favorite.endpointType, favorite.entityType);
    return catalogEntity ? catalogEntity.builders.entityBuilder.getMetadata(entity) : null;
  }

   private buildFavoriteFromCatalogEntity<T extends IEntityMetadata = IEntityMetadata, Y = any>(
    catalogEntity: StratosBaseCatalogEntity<T, Y>,
    entity: any,
    endpointId: string
  ) {
    const isEndpoint = catalogEntity.isEndpoint;
    const entityDefinition = catalogEntity.definition as IStratosEntityDefinition;
    const endpointType = isEndpoint ? catalogEntity.getTypeAndSubtype().type : entityDefinition.endpoint.type;
    const entityType = isEndpoint ? EntityCatalogHelpers.endpointType : entityDefinition.type;
    const metadata = catalogEntity.builders.entityBuilder.getMetadata(entity);
    const guid = isEndpoint ? null : catalogEntity.builders.entityBuilder.getGuid(entity);
    if (!endpointId) {
      console.error('User favourite - buildFavoriteFromCatalogEntity - endpointId is undefined');
    }
    return new UserFavorite<T>(
      endpointId,
      endpointType,
      entityType,
      guid,
      metadata
    );
  }

  public getFavoriteFromEntity<T extends IEntityMetadata = IEntityMetadata, Y = any>(
    entityType: string,
    endpointType: string,
    endpointId: string,
    entity: Y
  ) {
    const catalogEntity = entityCatalog.getEntity<T, Y>(endpointType, entityType) as StratosBaseCatalogEntity<T, Y>;
    return this.buildFavoriteFromCatalogEntity<T, Y>(catalogEntity, entity, endpointId);
  }

  public getFavoriteEndpointFromEntity(
    endpoint: EndpointModel
  ): UserFavoriteEndpoint {
    return this.getFavoriteFromEntity(
      EntityCatalogHelpers.endpointType,
      endpoint.cnsi_type,
      endpoint.guid,
      endpoint
    );
  }

}
