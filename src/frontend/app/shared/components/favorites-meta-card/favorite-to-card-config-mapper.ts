import { TFavoriteMapperFunction } from './favorite-to-card-config-mapper';
import { IFavoriteTypeInfo } from '../../../store/types/user-favorites.types';
import { Observable } from 'rxjs';
import { CardStatus } from '../application-state/application-state.service';

/**
 * [label, value]
 */
export type TFavoritesMetaCardLine = [string, string | Observable<string>];

export interface IFavoritesMetaCardConfig {
  prettyType: string;
  type: string;
  lines: TFavoritesMetaCardLine[];
  routerLink?: string;
  name: string;
  getStatus?: (entity) => Observable<CardStatus>;
}

export type TFavoriteMapperFunction<> = (entity?) => IFavoritesMetaCardConfig;

interface IFavoriteMappers {
  [key: string]: TFavoriteMapperFunction;
}

class FavoritesToCardConfigMapper {
  private mapperKeySeparator = '-';
  private mappers: IFavoriteMappers = {};
  private getMapperKeyFromFavoriteInfo(favoriteInfo: IFavoriteTypeInfo) {
    const { endpointType, entityType } = favoriteInfo;
    return [endpointType, entityType].join(this.mapperKeySeparator);
  }

  public registerMapper(favoriteInfo: IFavoriteTypeInfo, mapperFunction: TFavoriteMapperFunction) {
    const mapperKey = this.getMapperKeyFromFavoriteInfo(favoriteInfo);
    this.mappers[mapperKey] = mapperFunction;
  }

  public getMapperFunction(favorite: IFavoriteTypeInfo) {
    const mapperKey = this.getMapperKeyFromFavoriteInfo(favorite);
    return this.mappers[mapperKey] || null;
  }
}

export const favoritesToCardConfigMapper = new FavoritesToCardConfigMapper();
