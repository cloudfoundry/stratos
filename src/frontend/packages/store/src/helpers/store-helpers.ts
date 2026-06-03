import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { UserFavoritesDataService } from '../services/user-favorites-data.service';
import { APIResource } from '../types/api.types';
import { IFavoritesInfo } from '../types/user-favorites.types';

/**
 * Wrapper used by multi-action lists to carry an entity alongside the entity
 * key for the page it came from. Relocated here verbatim from the deleted
 * ngrx `monitors/pagination-monitor.ts` — the only surviving consumers are the
 * row-metadata helper below and `core` list-entity helpers / `cf.helpers`.
 */
export class MultiActionListEntity {
  static getEntity(entity: MultiActionListEntity | any) {
    if (entity instanceof MultiActionListEntity) {
      return entity.entity;
    }
    return entity;
  }
  static getEntityKey(entity: MultiActionListEntity | any, defaultEntityKey: string = null) {
    if (entity instanceof MultiActionListEntity) {
      return entity.entityKey;
    }
    return defaultEntityKey;
  }
  constructor(public entity: any, public entityKey: string) { }
}


export function getFavoriteInfoObservable(userFavorites: UserFavoritesDataService): Observable<IFavoritesInfo> {
  return combineLatest(
    userFavorites.fetching$,
    userFavorites.error$
  ).pipe(
    map(([fetching, error]) => ({
      fetching,
      error
    }))
  );
}

export const getRowMetadata = (entity: APIResource | MultiActionListEntity) => {
  if (entity instanceof MultiActionListEntity) {
    return entity.entity.metadata ? entity.entity.metadata.guid : null;
  }
  return entity.metadata ? entity.metadata.guid : null;
};
