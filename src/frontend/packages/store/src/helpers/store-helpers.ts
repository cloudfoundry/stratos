import { Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { AppState } from '../app-state';
import { MultiActionListEntity } from '../monitors/pagination-monitor';
import { errorFetchingFavoritesSelector, fetchingFavoritesSelector } from '../selectors/favorite-groups.selectors';
import { APIResource } from '../types/api.types';
import { IFavoritesInfo } from '../types/user-favorites.types';


export function getFavoriteInfoObservable(store: Store<AppState>): Observable<IFavoritesInfo> {
  return combineLatest(
    store.select(fetchingFavoritesSelector),
    store.select(errorFetchingFavoritesSelector)
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
