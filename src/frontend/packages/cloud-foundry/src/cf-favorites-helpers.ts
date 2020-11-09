import { IEntityMetadata } from '../../store/src/entity-catalog/entity-catalog.types';
import { UserFavorite } from '../../store/src/types/user-favorites.types';
import { UserFavoriteManager } from './../../store/src/user-favorite-manager';
import { CfAPIResource } from './store/types/cf-api.types';

export function getFavoriteFromCfEntity<T extends IEntityMetadata = IEntityMetadata>(
  entity,
  entityType: string,
  userFavoriteManager: UserFavoriteManager
): UserFavorite<T> {
  if (isCfEntity(entity as CfAPIResource)) {
    return userFavoriteManager.getFavoriteFromEntity<T>(
      entityType,
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

