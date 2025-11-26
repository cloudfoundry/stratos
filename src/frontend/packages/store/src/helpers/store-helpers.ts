import type { Store } from '@ngrx/store';
import { combineLatest, type Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import type { AppState } from '../app-state';
import { MultiActionListEntity } from '../monitors/pagination-monitor';
import { errorFetchingFavoritesSelector, fetchingFavoritesSelector } from '../selectors/favorite-groups.selectors';
import type { APIResource } from '../types/api.types';
import type { IFavoritesInfo } from '../types/user-favorites.types';


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
    return (entity.entity as { metadata?: { guid?: string } }).metadata ? (entity.entity as { metadata?: { guid?: string } }).metadata.guid : null;
  }
  return (entity as { metadata?: { guid?: string } }).metadata ? (entity as { metadata?: { guid?: string } }).metadata.guid : null;
};
