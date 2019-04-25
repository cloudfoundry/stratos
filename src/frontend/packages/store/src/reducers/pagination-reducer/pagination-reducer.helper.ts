import { Action, Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import {
  distinctUntilChanged,
  filter,
  first,
  map,
  pairwise,
  publishReplay,
  refCount,
  startWith,
  switchMap,
  tap,
} from 'rxjs/operators';

import { sortStringify } from '../../../../core/src/core/utils.service';
import { PaginationMonitor } from '../../../../core/src/shared/monitors/pagination-monitor';
import { AddParams, SetInitialParams, SetParams } from '../../actions/pagination.actions';
import { ValidateEntitiesStart } from '../../actions/request.actions';
import { AppState } from '../../app-state';
import { populatePaginationFromParent } from '../../helpers/entity-relations/entity-relations';
import { selectEntities } from '../../selectors/api.selectors';
import { selectPaginationState } from '../../selectors/pagination.selectors';
import {
  PaginatedAction,
  PaginationClientPagination,
  PaginationEntityState,
  PaginationParam,
  QParam,
} from '../../types/pagination.types';
import { ActionState } from '../api-request-reducer/types';

export interface PaginationObservables<T> {
  pagination$: Observable<PaginationEntityState>;
  entities$: Observable<T[]>;
  /**
   * Convenience observable on !!entities
   */
  hasEntities$: Observable<boolean>;
  /**
   * Convenience observable on pagination totalResults (note - not entities.length. In maxed world this can be different)
   */
  totalEntities$: Observable<number>;
  /**
   * Equate to current page fetching observable
   */
  fetchingEntities$: Observable<boolean>;
}

export function qParamsToString(params: QParam[]): string[] {
  return params.map(qParamToString);
}

export function qParamToString(q: QParam): string {
  return `${q.key}${q.joiner}${(q.value as string[]).join ? (q.value as string[]).join(',') : q.value}`;
}

export function qParamKeyFromString(qParamString: string): string {
  const match = qParamString.match(/(>=|<=|<|>| IN |,|:|=)/);
  return match.index >= 0 ? qParamString.substring(0, match.index) : null;
}

export function getUniqueQParams(action: AddParams | SetParams, state) {
  let qStatePrams: QParam[] = [].concat(state.params.q || []);
  const qActionPrams: QParam[] = [].concat(action.params.q || []);

  // Update existing q params
  for (const actionParam of qActionPrams) {
    const existingParamIndex = qStatePrams.findIndex((stateParam: QParam) => stateParam.key === actionParam.key);
    if (existingParamIndex >= 0) {
      qStatePrams[existingParamIndex] = { ...actionParam };
    } else {
      qStatePrams.push(actionParam);
    }
  }

  //  Ensure q params are unique
  if (action.params.q) {
    qStatePrams = qStatePrams.concat(qActionPrams)
      .filter((q, index, self) => self.findIndex(
        (qs) => {
          return qs.key === q.key;
        }
      ) === index)
      .filter((q: QParam) => {
        // Filter out empties
        return !!q.value;
      });
  }
  return qStatePrams;
}

export function removeEmptyParams(params: PaginationParam) {
  const newObject = {};
  Object.keys(params).forEach(key => {
    if (params[key]) {
      newObject[key] = params[key];
    }
  });
  return newObject;
}

export function getActionType(action) {
  return action.type;
}

export function getAction(action): PaginatedAction {
  if (!action) {
    return null;
  }
  return action.apiAction ? action.apiAction : action;
}

export function getActionPaginationEntityKey(action) {
  const apiAction = getAction(action);
  return apiAction.proxyPaginationEntityKey || apiAction.entityKey || null;
}

export function getPaginationKeyFromAction(action: PaginatedAction) {
  const apiAction = getAction(action);
  return apiAction.paginationKey;
}

export const getPaginationObservables = <T = any>(
  { store, action, paginationMonitor }: {
    store: Store<AppState>,
    action: PaginatedAction | PaginatedAction[],
    paginationMonitor: PaginationMonitor
  },
  isLocal = false
): PaginationObservables<T> => {
  const baseAction = Array.isArray(action) ? action[0] : action;
  const paginationKey = paginationMonitor.paginationKey;
  const entityKey = paginationMonitor.schema.key;

  // FIXME: This will reset pagination every time regardless of if we need to (or just want the pag settings/entities from pagination
  // section)
  if (baseAction.initialParams) {
    store.dispatch(new SetInitialParams(entityKey, paginationKey, baseAction.initialParams, isLocal));
  }

  const obs = getObservables<T>(
    store,
    entityKey,
    paginationKey,
    action,
    paginationMonitor,
    isLocal
  );

  return obs;
};

function shouldFetchLocalOrNonLocalList(
  isLocal: boolean,
  hasDispatchedOnce: boolean,
  pagination: PaginationEntityState,
  prevPagination: PaginationEntityState
) {
  // The following could be written more succinctly, but kept verbose for clarity
  return isLocal ? shouldFetchLocalList(hasDispatchedOnce, pagination, prevPagination) : shouldFetchNonLocalList(pagination);
}

function shouldFetchLocalList(
  hasDispatchedOnce: boolean,
  pagination: PaginationEntityState,
  prevPagination: PaginationEntityState
): boolean {
  if (hasError(pagination)) {
    return false;
  }

  const invalidOrMissingPage = !hasValidOrGettingPage(pagination);

  // Should a standard, non-maxed local list be refetched?
  if (!hasDispatchedOnce && invalidOrMissingPage) {
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

function safePopulatePaginationFromParent(store: Store<AppState>, action: PaginatedAction): Observable<Action> {
  return populatePaginationFromParent(store, action).pipe(
    map(newAction => newAction || action)
  );
}

function getObservables<T = any>(
  store: Store<AppState>,
  entityKey: string,
  paginationKey: string,
  paginationAction: PaginatedAction | PaginatedAction[],
  paginationMonitor: PaginationMonitor,
  isLocal = false
)
  : PaginationObservables<T> {
  let hasDispatchedOnce = false;
  const arrayAction = Array.isArray(paginationAction) ? paginationAction : [paginationAction];
  const paginationSelect$ = store.select(selectPaginationState(entityKey, paginationKey));
  const pagination$: Observable<PaginationEntityState> = paginationSelect$.pipe(filter(pagination => !!pagination));

  // Keep this separate, we don't want tap executing every time someone subscribes
  const fetchPagination$ = paginationSelect$.pipe(
    startWith(null),
    pairwise(),
    tap(([prevPag, newPag]: [PaginationEntityState, PaginationEntityState]) => {
      if (shouldFetchLocalOrNonLocalList(isLocal, hasDispatchedOnce, newPag, prevPag)) {
        hasDispatchedOnce = true; // Ensure we set this first, otherwise we're called again instantly
        combineLatest(arrayAction.map(action => safePopulatePaginationFromParent(store, action))).pipe(
          first(),
        ).subscribe(actions => actions.forEach(action => store.dispatch(action)));
      }
    }),
    map(([prevPag, newPag]) => newPag)
  );

  let lastValidationFootprint: string;
  const entities$: Observable<T[]> =
    combineLatest(
      store.select(selectEntities(entityKey)),
      fetchPagination$
    )
      .pipe(
        filter(([ent, pagination]) => {
          return !!pagination && isPageReady(pagination, isLocal);
        }),
        publishReplay(1),
        refCount(),
        tap(([ent, pagination]) => {
          const newValidationFootprint = getPaginationCompareString(pagination);
          if (lastValidationFootprint !== newValidationFootprint) {
            lastValidationFootprint = newValidationFootprint;
            arrayAction.forEach(action => store.dispatch(new ValidateEntitiesStart(
              action,
              pagination.ids[action.__forcedPageNumber__ || pagination.currentPage],
              false
            )));
          }
        }),
        switchMap(() => paginationMonitor.currentPage$),
      );

  return {
    pagination$: pagination$.pipe(
      distinctUntilChanged()
    ),
    entities$: entities$.pipe(
      distinctUntilChanged()
    ),
    hasEntities$: entities$.pipe(
      map(entities => !!entities),
      // Entities will never fire in the event of a maxed list, so ensure we start with something
      startWith(false)
    ),
    totalEntities$: combineLatest(pagination$, entities$).pipe(
      map(([pag]) => pag.totalResults),
      distinctUntilChanged()
    ),
    fetchingEntities$: paginationMonitor.fetchingCurrentPage$
  };
}

function getPaginationCompareString(paginationEntity: PaginationEntityState) {
  if (!paginationEntity) {
    return '';
  }
  let params = '';
  if (paginationEntity.params) {
    params = JSON.stringify(paginationEntity.params);
  }
  // paginationEntity.totalResults included to ensure we cover the 'ResetPagination' case, for instance after AddParam
  return paginationEntity.totalResults + paginationEntity.currentPage + params + paginationEntity.pageCount;
}

export function isPageReady(pagination: PaginationEntityState, isLocal = false) {
  if (!pagination) {
    return false;
  }
  if (isLocal) {
    return !Object.values(pagination.pageRequests).find((paginationPage) => paginationPage.busy);
  }
  if (!pagination.pageRequests[pagination.currentPage]) {
    return false;
  }
  return !pagination.pageRequests[pagination.currentPage].busy || false;
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

export function spreadClientPagination(pag: PaginationClientPagination): PaginationClientPagination {
  return {
    ...pag,
    filter: {
      ...pag.filter,
      items: {
        ...pag.filter.items
      }
    }
  };
}

export function spreadPaginationParams(params: PaginationParam): PaginationParam {
  return {
    ...params,
    q: params.q ? params.q.reduce((newQ, qP) => {
      newQ.push({ ...qP });
      return newQ;
    }, []) : null
  };
}
