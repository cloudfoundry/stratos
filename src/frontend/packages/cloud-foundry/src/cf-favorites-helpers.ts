import { FavoritesConfigMapper } from '../../core/src/shared/components/favorites-meta-card/favorite-config-mapper';
import { IEntityMetadata } from '../../store/src/entity-catalog/entity-catalog.types';
import { UserFavorite } from '../../store/src/types/user-favorites.types';
import { CfAPIResource } from './store/types/cf-api.types';

export function getFavoriteFromCfEntity<T extends IEntityMetadata = IEntityMetadata>(
  entity,
  entityKey: string,
  favoritesConfigMapper: FavoritesConfigMapper
): UserFavorite<T> {
  if (isCfEntity(entity as CfAPIResource)) {
    return favoritesConfigMapper.getFavoriteFromEntity<T>(
      entityKey,
      'cf',
      entity.entity.cfGuid,
      entity
    );
  }
  return null;
}

function isCfEntity(entity: CfAPIResource) {
  return entity && entity.entity.cfGuid && entity.metadata && entity.metadata.guid;
}

