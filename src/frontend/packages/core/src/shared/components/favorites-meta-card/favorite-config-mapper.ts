import { Observable } from 'rxjs';

import { endpointSchemaKey } from '../../../../../store/src/helpers/entity-factory';
import { IRequestAction } from '../../../../../store/src/types/request.types';
import { IFavoriteMetadata, IFavoriteTypeInfo, UserFavorite } from '../../../../../store/src/types/user-favorites.types';
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
class FavoritesConfigMapper {
  private mapperKeySeparator = '-';
  private mappers: IFavoriteMappers = {};
  public getMapperKeyFromFavoriteInfo(favoriteInfo: IFavoriteTypeInfo) {
    const { endpointType, entityType } = favoriteInfo;
    return [endpointType, entityType].join(this.mapperKeySeparator);
  }

  /**
   * Register config used to manage a given favorite type
   * @param favoriteInfo Base id information about the favorite this mapper will match
   * @param prettyName The human readable name for the entity type
   * @param mapper Takes an entity and maps it to favorite meta card config
   * @param actionGenerator Takes a favorite and returns an action that can be used to hydrate the favorite
   */
  public registerFavoriteConfig<T, Q extends IFavoriteMetadata>(config: IFavoriteConfig<T, Q>) {
    const { mapper, prettyName, entityToMetadata, favoriteInfo } = config;
    const mapperKey = this.getMapperKeyFromFavoriteInfo(favoriteInfo);
    this.mappers[mapperKey] = {
      mapper,
      prettyName,
      entityToMetadata,
      favoriteInfo
    };
  }
  /**
   * For a given favorite, return the corresponding favorite meta card mapper
   */
  public getMapperFunction(favorite: IFavoriteTypeInfo) {
    const mapperKey = this.getMapperKeyFromFavoriteInfo(favorite);
    return this.mappers[mapperKey] ? this.mappers[mapperKey].mapper : null;
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
    const mapperKey = this.getMapperKeyFromFavoriteInfo(favorite);
    return this.mappers[mapperKey] ? this.mappers[mapperKey].prettyName : null;
  }

  /**
   * For a given favorite, return the corresponding hydration action
   */
  public getEntityMetadata<T = any>(favorite: IFavoriteTypeInfo, entity: T) {
    const mapperKey = this.getMapperKeyFromFavoriteInfo(favorite);
    return this.mappers[mapperKey] && this.mappers[mapperKey].entityToMetadata ? this.mappers[mapperKey].entityToMetadata(entity) : null;
  }

  /**
   * For a given endpoint type, return the list of possible favorite types
   */
  public getAllTypesForEndpoint(endpointType: string): IFavoriteTypes[] {
    return Object.values(this.mappers).reduce((types: IFavoriteTypes[], mapper) => {
      if (mapper.favoriteInfo.endpointType === endpointType && mapper.favoriteInfo.entityType !== endpointSchemaKey) {
        types.push({
          type: mapper.favoriteInfo.entityType,
          prettyName: mapper.prettyName
        });
      }
      return types;
    }, []);
  }

}

export const favoritesConfigMapper = new FavoritesConfigMapper();
