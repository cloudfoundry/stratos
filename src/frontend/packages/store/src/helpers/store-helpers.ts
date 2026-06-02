import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { MultiActionListEntity } from '../monitors/pagination-monitor';
import { UserFavoritesDataService } from '../services/user-favorites-data.service';
import { APIResource } from '../types/api.types';
import { IFavoritesInfo } from '../types/user-favorites.types';


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
