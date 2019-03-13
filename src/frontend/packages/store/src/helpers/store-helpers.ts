import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { first, map, pairwise, skipWhile } from 'rxjs/operators';

import { AppState } from '../app-state';
import { ActionState } from '../reducers/api-request-reducer/types';
import { selectPaginationState } from '../selectors/pagination.selectors';
import { BasePaginatedAction, PaginationEntityState } from '../types/pagination.types';
import { setDefaultPaginationState } from '../reducers/pagination-reducer/pagination.reducer';
import { defaultCfEntitiesState } from '../types/entity.types';


export const fetchPaginationStateFromAction = (store: Store<AppState>, action: BasePaginatedAction) =>
  store.select(selectPaginationState(action.entityKey, action.paginationKey));

/**
 * Using the given action wait until the associated pagination section changes from busy to not busy
 */
export const createPaginationCompleteWatcher = (store: Store<AppState>, action: BasePaginatedAction): Observable<boolean> =>
  fetchPaginationStateFromAction(store, action).pipe(
    map((paginationState: PaginationEntityState) => {
      const pageRequest: ActionState =
        paginationState && paginationState.pageRequests && paginationState.pageRequests[paginationState.currentPage];
      return pageRequest ? pageRequest.busy : true;
    }),
    pairwise(),
    map(([oldFetching, newFetching]) => {
      return oldFetching === true && newFetching === false;
    }),
    skipWhile(completed => !completed),
    first(),
  );

export function initStore() {
    setDefaultPaginationState({ ...defaultCfEntitiesState });
 }
