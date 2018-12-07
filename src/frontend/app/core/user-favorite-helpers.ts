import { Action } from 'rxjs/internal/scheduler/Action';
import { UserFavorite } from '../store/types/user-favorites.types';
import { CfAPIResource } from './../store/types/api.types';

export function getFavoriteFromCfEntity(entity, entityKey: string) {
  if (isCfEntity(entity as CfAPIResource)) {
    return new UserFavorite(
      entity.entity.cfGuid,
      'cf',
      entityKey,
      entity.metadata.guid,
    );
  }
  return null;
}

function isCfEntity(entity: CfAPIResource) {
  return entity && entity.entity.cfGuid && entity.metadata && entity.metadata.guid;
}
