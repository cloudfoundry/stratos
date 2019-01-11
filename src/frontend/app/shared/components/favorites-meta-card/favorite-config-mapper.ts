import { Observable } from 'rxjs';

import { IRequestAction } from '../../../store/types/request.types';
import { IFavoriteTypeInfo, UserFavorite } from '../../../store/types/user-favorites.types';
import { CardStatus } from '../../shared.types';
import { MetaCardMenuItem } from '../list/list-cards/meta-card/meta-card-base/meta-card.component';

/**
 * [label, value]
 */
export type TFavoritesMetaCardLine = [string, string | Observable<string>];

export interface IFavoritesMetaCardConfig {
  type: string;
  lines: TFavoritesMetaCardLine[];
  routerLink?: string;
  name: string;
  getStatus?: (entity) => Observable<CardStatus>;
  menuItems?: MetaCardMenuItem[];
}

export type TFavoriteMapperFunction = (entity?) => IFavoritesMetaCardConfig;

interface IFavoriteMappers {
  [key: string]: {
    mapper: TFavoriteMapperFunction,
    prettyName: string,
    actionGenerator: TFavoriteActionGenerator
  };
}

export type TFavoriteActionGenerator = (favorite: UserFavorite) => IRequestAction;

export interface IFavoriteActionGenerators {
  [key: string]: TFavoriteActionGenerator;
}
/**
 * Stores the config used to hydrator and render favorites.
 */
class FavoritesConfigMapper {
  private mapperKeySeparator = '-';
  private mappers: IFavoriteMappers = {};
  private getMapperKeyFromFavoriteInfo(favoriteInfo: IFavoriteTypeInfo) {
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
  public registerFavoriteConfig(
    favoriteInfo: IFavoriteTypeInfo,
    prettyName: string,
    mapper: TFavoriteMapperFunction,
    actionGenerator: TFavoriteActionGenerator
  ) {
    const mapperKey = this.getMapperKeyFromFavoriteInfo(favoriteInfo);
    this.mappers[mapperKey] = {
      mapper,
      prettyName,
      actionGenerator
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
  public getPrettyName(favorite: IFavoriteTypeInfo) {
    const mapperKey = this.getMapperKeyFromFavoriteInfo(favorite);
    return this.mappers[mapperKey] ? this.mappers[mapperKey].prettyName : null;
  }

  /**
   * For a given favorite, return the corresponding hydration action
   * @param favorite
   */
  public getActionFromFavorite(favorite: UserFavorite) {
    const mapperKey = this.getMapperKeyFromFavoriteInfo(favorite);
    return this.mappers[mapperKey] ? this.mappers[mapperKey].actionGenerator(favorite) : null;
  }
}

export const favoritesConfigMapper = new FavoritesConfigMapper();
