import { Observable } from 'rxjs';

import { IRequestAction } from '../../../../../store/src/types/request.types';
import { IFavoriteMetadata, IFavoriteTypeInfo, UserFavorite } from '../../../../../store/src/types/user-favorites.types';
import { MetaCardMenuItem } from '../list/list-cards/meta-card/meta-card-base/meta-card.component';
import { Injectable } from '@angular/core';
import { EntityCatalogueService } from '../../../core/entity-catalogue/entity-catalogue.service';
import { IEntityMetadata } from '../../../core/entity-catalogue/entity-catalogue.types';


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

interface IFavoriteMappers {
  [key: string]: {
    mapper: TFavoriteMapperFunction<IFavoriteMetadata>,
    prettyName: string,
    entityToMetadata: TEntityToMetadata<any, any>,
    favoriteInfo: IFavoriteTypeInfo
  };
}

export type TFavoriteActionGenerator<T extends IFavoriteMetadata> = (favorite: UserFavorite<T>) => IRequestAction;

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
  constructor(private entityCatalogueService: EntityCatalogueService) { }
  public getMapperKeyFromFavoriteInfo(favoriteInfo: IFavoriteTypeInfo) {
    const { endpointType, entityType } = favoriteInfo;
    return [endpointType, entityType].join(this.mapperKeySeparator);
  }

  /**
   * For a given favorite, return the corresponding favorite meta card mapper
   */
  public getMapperFunction<T extends IEntityMetadata = IEntityMetadata>(favorite: IFavoriteTypeInfo) {
    const catalogueEntity = this.entityCatalogueService.getEntity(favorite.entityType, favorite.endpointType);
    return (entity: T) => {
      return {
        lines: catalogueEntity.builder.getLines ? catalogueEntity.builder.getLines(entity) : null,
        type: catalogueEntity.entity.type,
        routerLink: catalogueEntity.builder.getLink(entity),
        name: entity.name,
        menuItems: catalogueEntity.builder.getActions ? catalogueEntity.builder.getActions(entity) : null
      };
    }
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
    const catalogueEntity = this.entityCatalogueService.getEntity(favorite.entityType, favorite.endpointType);
    return catalogueEntity ? catalogueEntity.entity.label : null;
  }

  /**
   * For a given favorite, return the corresponding hydration action
   */
  public getEntityMetadata<T = any>(favorite: IFavoriteTypeInfo, entity: T): IEntityMetadata {
    const catalogueEntity = this.entityCatalogueService.getEntity(favorite.entityType, favorite.endpointType);
    return catalogueEntity ? catalogueEntity.builder.getMetaData(entity) : null;
  }

  /**
   * For a given endpoint type, return the list of possible favorite types
   */
  public getAllTypesForEndpoint(endpointType: string): IFavoriteTypes[] {
    return this.entityCatalogueService.getAllEntitiesForEndpointType(endpointType).map(catalogueEntity => ({
      type: catalogueEntity.entity.type,
      prettyName: catalogueEntity.entity.label
    }));
  }

}
