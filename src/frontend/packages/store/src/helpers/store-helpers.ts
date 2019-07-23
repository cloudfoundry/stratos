import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { first, map, pairwise, skipWhile } from 'rxjs/operators';

import { CFAppState } from '../../../cloud-foundry/src/cf-app-state';
import { ActionState } from '../reducers/api-request-reducer/types';
import { selectPaginationState } from '../selectors/pagination.selectors';
import { BasePaginatedAction, PaginationEntityState } from '../types/pagination.types';


export const fetchPaginationStateFromAction = (store: Store<CFAppState>, action: BasePaginatedAction) =>
  store.select(selectPaginationState(action.entityType, action.paginationKey));

/**
 * Using the given action wait until the associated pagination section changes from busy to not busy
 */
export const createPaginationCompleteWatcher = (store: Store<CFAppState>, action: BasePaginatedAction): Observable<boolean> =>
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


export function getDashboardStateSessionId(username?: string) {
  const prefix = 'stratos-';
  if (username) {
    return prefix + username;
  }
  const idElement = document.getElementById('__stratos-userid__');
  if (idElement) {
    return prefix + idElement.innerText;
  }
  return null;
}
