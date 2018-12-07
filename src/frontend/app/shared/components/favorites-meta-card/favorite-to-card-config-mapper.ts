import { TFavoriteMapperFunction } from './favorite-to-card-config-mapper';
import { IFavoriteTypeInfo } from '../../../store/types/user-favorites.types';
import { Observable } from 'rxjs';
import { CardStatus } from '../application-state/application-state.service';

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

export type TFavoriteMapperFunction<> = (entity?) => IFavoritesMetaCardConfig;

interface IFavoriteMappers {
  [key: string]: {
    mapper: TFavoriteMapperFunction,
    prettyName: string
  };
}

class FavoritesToCardConfigMapper {
  private mapperKeySeparator = '-';
  private mappers: IFavoriteMappers = {};
  private getMapperKeyFromFavoriteInfo(favoriteInfo: IFavoriteTypeInfo) {
    const { endpointType, entityType } = favoriteInfo;
    return [endpointType, entityType].join(this.mapperKeySeparator);
  }

  public registerMapper(favoriteInfo: IFavoriteTypeInfo, prettyName: string, mapper: TFavoriteMapperFunction, ) {
    const mapperKey = this.getMapperKeyFromFavoriteInfo(favoriteInfo);
    this.mappers[mapperKey] = {
      mapper,
      prettyName
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
}

export const favoritesToCardConfigMapper = new FavoritesToCardConfigMapper();
