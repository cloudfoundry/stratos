import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { entityCatalog } from '../../../../../store/src/entity-catalog/entity-catalog';
import {
  StratosBaseCatalogEntity,
} from '../../../../../store/src/entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { EntityCatalogHelpers } from '../../../../../store/src/entity-catalog/entity-catalog.helper';
import { IEntityMetadata, IStratosEntityDefinition } from '../../../../../store/src/entity-catalog/entity-catalog.types';
import { EndpointModel } from '../../../../../store/src/types/endpoint.types';
import { EntityRequestAction } from '../../../../../store/src/types/request.types';
import {
  IFavoriteMetadata,
  IFavoriteTypeInfo,
  UserFavorite,
  UserFavoriteEndpoint,
} from '../../../../../store/src/types/user-favorites.types';
import { MetaCardMenuItem } from '../list/list-cards/meta-card/meta-card-base/meta-card.component';


export interface IFavoriteTypes {
  type: string;
  prettyName: string;
}

/**
 * [label, value]
 */
export type TFavoritesMetaCardLine = [string, string | Observable<string>];

export interface IFavoritesMetaCardConfig {
  type: string;
  lines?: TFavoritesMetaCardLine[];
  routerLink?: string;
  name: string;
  menuItems?: MetaCardMenuItem[];
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
  // private mappers: IFavoriteMappers = {};
  constructor() { }
  public getMapperKeyFromFavoriteInfo(favoriteInfo: IFavoriteTypeInfo) {
    const { endpointType, entityType } = favoriteInfo;
    return [endpointType, entityType].join(this.mapperKeySeparator);
  }

  /**
   * For a given favorite, return the corresponding favorite meta card mapper
   */
  public getMapperFunction<T extends IEntityMetadata = IEntityMetadata>(favorite: IFavoriteTypeInfo) {
    const catalogEntity = entityCatalog.getEntity(favorite.endpointType, favorite.entityType);
    return (entity: T) => {
      if (!entity) {
        return {
          lines: null,
          type: null,
          routerLink: null,
          name: null,
          menuItems: null
        };
      }
      const linesBuilders = catalogEntity.builders.entityBuilder.getLines ? catalogEntity.builders.entityBuilder.getLines() : [];
      return {
        lines: linesBuilders.map(builder => ([builder[0], builder[1](entity)])) as [string, string | Observable<string>][],
        type: catalogEntity.definition.type,
        routerLink: catalogEntity.builders.entityBuilder.getLink(entity),
        name: entity.name,
        menuItems: catalogEntity.builders.entityBuilder.getActions ? catalogEntity.builders.entityBuilder.getActions(entity) : null
      };
    };
  }

  /**
   * Is there config for the given favorite type?
   */
  public hasFavoriteConfigForType(favorite: IFavoriteTypeInfo) {
    return !!this.getMapperFunction(favorite);
  }

  /**
   * For a given favorite, return the corresponding human readable type name
   */
  public getPrettyTypeName(favorite: IFavoriteTypeInfo) {
    const catalogEntity = entityCatalog.getEntity(favorite.endpointType, favorite.entityType);
    return catalogEntity ? catalogEntity.definition.label : null;
  }

  /**
   * For a given favorite, return the corresponding hydration action
   */
  public getEntityMetadata(favorite: IFavoriteTypeInfo, entity: any) {
    const catalogEntity = entityCatalog.getEntity(favorite.endpointType, favorite.entityType);
    return catalogEntity ? catalogEntity.builders.entityBuilder.getMetadata(entity) : null;
  }

  /**
   * For a given endpoint type, return the list of possible favorite types
   */
  public getAllTypesForEndpoint(endpointType: string): IFavoriteTypes[] {
    return entityCatalog.getAllEntitiesForEndpointType(endpointType).map(catalogEntity => ({
      type: catalogEntity.definition.type,
      prettyName: catalogEntity.definition.label
    }));
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
    const guid = isEndpoint ? null : catalogEntity.builders.entityBuilder.getGuid(metadata);
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
  ) {
    return this.getFavoriteFromEntity(
      EntityCatalogHelpers.endpointType,
      endpoint.cnsi_type,
      endpoint.guid,
      endpoint
    ) as UserFavoriteEndpoint;
  }

}
