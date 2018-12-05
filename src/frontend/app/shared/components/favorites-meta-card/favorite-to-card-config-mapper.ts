import { TFavoriteMapperFunction } from './favorite-to-card-config-mapper';
import { IFavoritesMetaCardConfig } from './favorites-meta-card.component';
import { IFavoriteTypeInfo } from '../../../store/types/user-favorites.types';

export type TFavoriteMapperFunction = () => IFavoritesMetaCardConfig;

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
