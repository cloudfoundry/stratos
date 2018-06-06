import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { first, map, pairwise, skipWhile } from 'rxjs/operators';

import { AppState } from '../app-state';
import { ActionState } from '../reducers/api-request-reducer/types';
import { selectPaginationState } from '../selectors/pagination.selectors';
import { PaginationAction, PaginationEntityState } from '../types/pagination.types';
import { ICFAction } from '../types/request.types';
import { selectRequestInfo } from '../selectors/api.selectors';


export const fetchPaginationStateFromAction = (store: Store<AppState>, action: PaginationAction) =>
  store.select(selectPaginationState(action.entityKey, action.paginationKey));

// TODO: RC comment
export const createPaginationCompleteWatcher = (store: Store<AppState>, action: PaginationAction): Observable<boolean> =>
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

// export const fetchEntityStateFromAction = (store: Store<AppState>, action: ICFAction) =>
//   store.select(selectRequestInfo(action.entityKey, action.paginationKey));

// export const createEntityCompleteWatcher = (store: Store<AppState>, action: ICFAction): Observable<boolean> =>
//   fetchEntityStateFromAction(store, action).pipe(
//     map((paginationState: PaginationEntityState) => {
//       const pageRequest: ActionState =
//         paginationState && paginationState.pageRequests && paginationState.pageRequests[paginationState.currentPage];
//       return pageRequest ? pageRequest.busy : true;
//     }),
//     pairwise(),
//     map(([oldFetching, newFetching]) => {
//       return oldFetching === true && newFetching === false;
//     }),
//     skipWhile(completed => !completed),
//     first(),
//   );
