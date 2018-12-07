import { UserFavorite } from './../../../store/types/user-favorites.types';
import { IFavoriteTypeInfo } from '../../../store/types/user-favorites.types';
import { Observable } from 'rxjs';
import { CardStatus } from '../application-state/application-state.service';
import { IRequestAction } from '../../../store/types/request.types';

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

class FavoritesConfigMapper {
  private mapperKeySeparator = '-';
  private mappers: IFavoriteMappers = {};
  private getMapperKeyFromFavoriteInfo(favoriteInfo: IFavoriteTypeInfo) {
    const { endpointType, entityType } = favoriteInfo;
    return [endpointType, entityType].join(this.mapperKeySeparator);
  }

  public registerMapper(
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

  public getMapperFunction(favorite: IFavoriteTypeInfo) {
    const mapperKey = this.getMapperKeyFromFavoriteInfo(favorite);
    return this.mappers[mapperKey] ? this.mappers[mapperKey].mapper : null;
  }

  public getPrettyName(favorite: IFavoriteTypeInfo) {
    const mapperKey = this.getMapperKeyFromFavoriteInfo(favorite);
    return this.mappers[mapperKey] ? this.mappers[mapperKey].prettyName : null;
  }

  public getActionFromFavorite(favorite: UserFavorite) {
    const mapperKey = this.getMapperKeyFromFavoriteInfo(favorite);
    return this.mappers[mapperKey] ? this.mappers[mapperKey].actionGenerator(favorite) : null;
  }
}

export const favoritesConfigMapper = new FavoritesConfigMapper();
