import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { combineLatest, of as observableOf, Observable } from 'rxjs';
import { first, mergeMap, startWith, tap, filter, map, pairwise, switchMap } from 'rxjs/operators';
import { AppState } from '../app-state';
import { RequestInfoState, ActionState } from '../reducers/api-request-reducer/types';
import { selectEntity, selectRequestInfo } from '../selectors/api.selectors';
import { ValidateEntitiesStart } from '../actions/request.actions';
import { ICFAction } from '../types/request.types';
import { selectPaginationState } from '../selectors/pagination.selectors';
import { PaginatedAction, PaginationEntityState, PaginationParam } from '../types/pagination.types';
import { populatePaginationFromParent } from '../helpers/entity-relations/entity-relations';
import { sortStringify } from '../../../core/src/core/utils.service';
import { isEntityBlocked, isPageReady } from './entity-fetcher.effect.helpers';

function safePopulatePaginationFromParent(store: Store<AppState>, action: PaginatedAction): Observable<Action> {
  return populatePaginationFromParent(store, action).pipe(
    map(newAction => newAction || action)
  );
}

function shouldFetchLocalOrNonLocalList(
  isLocal: boolean,
  pagination: PaginationEntityState,
  prevPagination: PaginationEntityState
) {
  // The following could be written more succinctly, but kept verbose for clarity
  return isLocal ? shouldFetchLocalList(pagination, prevPagination) : shouldFetchNonLocalList(pagination);
}

function shouldFetchLocalList(
  pagination: PaginationEntityState,
  prevPagination: PaginationEntityState
): boolean {
  if (hasError(pagination)) {
    return false;
  }

  const invalidOrMissingPage = !hasValidOrGettingPage(pagination);

  // Should a standard, non-maxed local list be refetched?
  if (invalidOrMissingPage) {
    return true;
  }

  // Should a maxed local list be refetched?
  if (pagination.maxedMode) {
    const paramsChanged = prevPagination && paginationParamsString(prevPagination.params) !== paginationParamsString(pagination.params);
    return invalidOrMissingPage || paramsChanged;
  }

  return false;
}

function paginationParamsString(params: PaginationParam): string {
  const clone = {
    ...params,
  };
  delete clone.q;
  const res1 = sortStringify(clone) + params.q ? sortStringify(params.q.reduce((res, q) => {
    res[q.key] = q.value + q.joiner;
    return res;
  }, {})) : '';
  return res1;
}

function shouldFetchNonLocalList(pagination: PaginationEntityState): boolean {
  return !hasError(pagination) && !hasValidOrGettingPage(pagination);
}

export function isFetchingPage(pagination: PaginationEntityState): boolean {
  if (pagination) {
    const currentPageRequest = getCurrentPageRequestInfo(pagination);
    return currentPageRequest.busy;
  } else {
    return false;
  }
}

export function hasValidOrGettingPage(pagination: PaginationEntityState): boolean {
  if (pagination && Object.keys(pagination).length) {
    const hasPage = !!pagination.ids[pagination.currentPage];
    const currentPageRequest = getCurrentPageRequestInfo(pagination);
    return hasPage || currentPageRequest.busy;
  } else {
    return false;
  }
}

export function hasError(pagination: PaginationEntityState): boolean {
  return pagination && getCurrentPageRequestInfo(pagination).error;
}

export function getCurrentPageRequestInfo(pagination: PaginationEntityState): ActionState {
  return pagination.pageRequests[pagination.currentPage] || {
    busy: false,
    error: false,
    message: ''
  };
}

export const TRY_ENTITY_FETCH = '[Entity Service] Try Entity Fetch';
export class TryEntityFetchAction implements Action {
  constructor(
    public fetchFn: (key?: string) => void,
    public entityKey: string,
    public entityId: string,
  ) { }
  public type = TRY_ENTITY_FETCH;
}

export const TRY_ENTITY_VALIDATION = '[Entity Service] Try Entity Validation';
export class TryEntityValidationAction implements Action {
  constructor(
    public entityKey: string,
    public entityId: string,
    public cFAction: ICFAction
  ) { }
  public type = TRY_ENTITY_VALIDATION;
}

export const TRY_PAGINATION_FETCH = '[Pagination Service] Try Pagination Fetch';
export class TryEntityPaginationFetchAction implements Action {
  constructor(
    public paginationKey: string,
    public entityKey: string,
    public isLocal: boolean,
    public actions: PaginatedAction[]
  ) { }
  public type = TRY_PAGINATION_FETCH;
}

export const TRY_PAGINATION_VALIDATION = '[Pagination Service] Try Pagination Validation';
export class TryEntityPaginationValidationAction implements Action {
  constructor(
    public paginationKey: string,
    public entityKey: string,
    public isLocal: boolean,
    public actions: PaginatedAction[]
  ) { }
  public type = TRY_PAGINATION_VALIDATION;
}

@Injectable()
export class TryFetchEffect {

  constructor(
    private actions$: Actions,
    private store: Store<AppState>
  ) { }

  @Effect({ dispatch: false })
  tryFetch$ = this.actions$.pipe(
    ofType<TryEntityFetchAction>(TRY_ENTITY_FETCH),
    mergeMap((action: TryEntityFetchAction) => {
      return combineLatest(
        this.store.select(selectRequestInfo(action.entityKey, action.entityId)).pipe(first()),
        this.store.select(selectEntity(action.entityKey, action.entityId)).pipe(first(), startWith(null)),
        observableOf(action)
      );
    }),
    tap(([requestInfo, entity, action]) => {
      if (this.shouldCallAction(requestInfo, entity)) {
        action.fetchFn();
      }
    })
  );

  @Effect({ dispatch: false })
  tryValidation$ = this.actions$.pipe(
    ofType<TryEntityValidationAction>(TRY_ENTITY_VALIDATION),
    mergeMap((action) => {
      return this.store.select(selectRequestInfo(action.entityKey, action.entityId)).pipe(
        filter(entityRequestInfo => !isEntityBlocked(entityRequestInfo)),
        first(),
        tap(() => {
          this.store.dispatch(new ValidateEntitiesStart(
            action.cFAction,
            [action.entityId],
            false
          ));
        })
      );
    })
  );

  @Effect({ dispatch: false })
  tryPaginationFetch$ = this.actions$.pipe(
    ofType<TryEntityPaginationValidationAction>(TRY_PAGINATION_VALIDATION),
    mergeMap((action: TryEntityPaginationValidationAction) => {
      return this.store.select(selectPaginationState(action.entityKey, action.paginationKey)).pipe(
        startWith(null),
        pairwise(),
        filter(([prevPag, newPag]) => shouldFetchLocalOrNonLocalList(action.isLocal, newPag, prevPag)),
        switchMap(() => {
          const actionsObservables = action.actions.map(fetchAction => safePopulatePaginationFromParent(this.store, fetchAction));
          return combineLatest(actionsObservables).pipe(
            first(),
            tap(actions => actions.forEach((newAction) => this.store.dispatch(newAction)))
          );
        })
      );
    })
  );

  @Effect({ dispatch: false })
  tryPaginationValidation$ = this.actions$.pipe(
    ofType<TryEntityPaginationValidationAction>(TRY_PAGINATION_VALIDATION),
    mergeMap((action) => {
      return this.store.select(selectPaginationState(action.entityKey, action.paginationKey)).pipe(
        filter(pagination => {
          return !!pagination && isPageReady(pagination, action.isLocal);
        }),
        first(),
        tap(pagination => {
          action.actions.forEach(pagAction => this.store.dispatch(new ValidateEntitiesStart(
            pagAction,
            pagination.ids[pagAction.__forcedPageNumber__ || pagination.currentPage],
            false
          )));
        })
      );
    })
  );


  private shouldCallAction(entityRequestInfo: RequestInfoState, entity: any) {
    return !entityRequestInfo || (!entity && !isEntityBlocked(entityRequestInfo));
  }
}
