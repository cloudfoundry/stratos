import { Observable } from 'rxjs';
import { IRequestAction } from '../../../store/types/request.types';
import { IFavoriteMetadata, IFavoriteTypeInfo, UserFavorite } from '../../../store/types/user-favorites.types';
import { MetaCardMenuItem } from '../list/list-cards/meta-card/meta-card-base/meta-card.component';
import { endpointSchemaKey } from '../../../store/helpers/entity-factory';

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

export type TFavoriteMapperFunction<T extends IFavoriteMetadata> = (entity: T) => IFavoritesMetaCardConfig;

interface IFavoriteMappers {
  [key: string]: {
    mapper: TFavoriteMapperFunction<IFavoriteMetadata>,
    prettyName: string,
    actionGenerator: TFavoriteActionGenerator<IFavoriteMetadata>
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
  public registerFavoriteConfig<T, Q extends IFavoriteMetadata>(
    favoriteInfo: IFavoriteTypeInfo,
    prettyName: string,
    mapper: TFavoriteMapperFunction<Q>,
    actionGenerator: TFavoriteActionGenerator<Q>,
    entityToMetadata: TEntityToMetadata<T, Q>
  ) {
    const mapperKey = this.getMapperKeyFromFavoriteInfo(favoriteInfo);
    this.mappers[mapperKey] = {
      mapper,
      prettyName,
      actionGenerator,
      entityToMetadata,
      favoriteInfo
    };
  }
  /**
   * For a given favorite, return the corresponding favorite meta card mapper
   * @param favorite
   */
  public getMapperFunction(favorite: IFavoriteTypeInfo) {
    const mapperKey = this.getMapperKeyFromFavoriteInfo(favorite);
    return this.mappers[mapperKey] ? this.mappers[mapperKey].mapper : null;
  }

  /**
  * For a given favorite, return the corresponding human readable type name
  * @param favorite
  */
  public getPrettyTypeName(favorite: IFavoriteTypeInfo) {
    const mapperKey = this.getMapperKeyFromFavoriteInfo(favorite);
    return this.mappers[mapperKey] ? this.mappers[mapperKey].prettyName : null;
  }

  /**
   * For a given favorite, return the corresponding hydration action
   * @param favorite
   */
  public getActionFromFavorite<T extends IFavoriteMetadata>(favorite: UserFavorite<T>) {
    const mapperKey = this.getMapperKeyFromFavoriteInfo(favorite);
    return this.mappers[mapperKey] ? this.mappers[mapperKey].actionGenerator(favorite) : null;
  }

  /**
   * For a given favorite, return the corresponding hydration action
   * @param favorite
   */
  public getEntityMetadata<T extends IFavoriteMetadata, Y = any>(favorite: UserFavorite<T>, entity: Y) {
    const mapperKey = this.getMapperKeyFromFavoriteInfo(favorite);
    return this.mappers[mapperKey] && this.mappers[mapperKey].entityToMetadata ? this.mappers[mapperKey].entityToMetadata(entity) : null;
  }

  /**
   * For a given endpoint type, return the list of possible favorite types
   * @param favorite
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
