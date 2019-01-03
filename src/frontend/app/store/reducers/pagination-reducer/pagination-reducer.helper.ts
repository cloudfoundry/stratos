import { Store } from '@ngrx/store';
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

import { sortStringify } from '../../../core/utils.service';
import { PaginationMonitor } from '../../../shared/monitors/pagination-monitor';
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
}

export function qParamsToString(params: QParam[]) {
  return params.map(joinQParam);
}

function joinQParam(q: QParam) {
  return `${q.key}${q.joiner}${(q.value as string[]).join ? (q.value as string[]).join(',') : q.value}`;
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

export function getActionKey(action) {
  const apiAction = getAction(action);
  return apiAction.entityKey || null;
}

export function getPaginationKeyFromAction(action: PaginatedAction) {
  const apiAction = getAction(action);
  return apiAction.paginationKey;
}

export const getPaginationObservables = <T = any>(
  { store, action, paginationMonitor }: { store: Store<AppState>, action: PaginatedAction, paginationMonitor: PaginationMonitor },
  isLocal = false
): PaginationObservables<T> => {
  const paginationKey = paginationMonitor.paginationKey;
  const entityKey = paginationMonitor.schema.key;

  // FIXME: This will reset pagination every time regardless of if we need to (or just want the pag settings/entities from pagination
  // section)
  if (action.initialParams) {
    store.dispatch(new SetInitialParams(entityKey, paginationKey, action.initialParams, isLocal));
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
  if (pagination.maxedResults) {
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

function getObservables<T = any>(
  store: Store<AppState>,
  entityKey: string,
  paginationKey: string,
  action: PaginatedAction,
  paginationMonitor: PaginationMonitor,
  isLocal = false
)
  : PaginationObservables<T> {
  let hasDispatchedOnce = false;

  // .pipe(distinctUntilChanged())
  const paginationSelect$ = store.select(selectPaginationState(entityKey, paginationKey));
  const pagination$: Observable<PaginationEntityState> = paginationSelect$.pipe(filter(pagination => !!pagination));

  // Keep this separate, we don't want tap executing every time someone subscribes
  const fetchPagination$ = paginationSelect$.pipe(
    startWith(null),
    pairwise(),
    tap(([prevPag, newPag]: [PaginationEntityState, PaginationEntityState]) => {
      if (shouldFetchLocalOrNonLocalList(isLocal, hasDispatchedOnce, newPag, prevPag)) {
        hasDispatchedOnce = true; // Ensure we set this first, otherwise we're called again instantly
        populatePaginationFromParent(store, action).pipe(
          first(),
        ).subscribe(newAction => store.dispatch(newAction || action));
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
          return !!pagination && isPageReady(pagination);
        }),
        publishReplay(1), refCount(),
        tap(([ent, pagination]) => {
          const newValidationFootprint = getPaginationCompareString(pagination);
          if (lastValidationFootprint !== newValidationFootprint) {
            lastValidationFootprint = newValidationFootprint;
            store.dispatch(new ValidateEntitiesStart(
              action,
              pagination.ids[pagination.currentPage],
              false
            ));
          }
        }),
        switchMap(() => paginationMonitor.currentPage$)
      );

  return {
    pagination$: pagination$.pipe(
      distinctUntilChanged()
    ),
    entities$: entities$.pipe(
      distinctUntilChanged()
    )
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

export function isPageReady(pagination: PaginationEntityState) {
  return !!pagination && !!pagination.ids[pagination.currentPage] && !isFetchingPage(pagination);
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
