import { Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import {
  distinctUntilChanged,
  filter,
  map,
  pairwise,
  publishReplay,
  refCount,
  startWith,
  switchMap,
  tap,
} from 'rxjs/operators';

import { SetInitialParams } from '../../actions/pagination.actions';
import { AppState, GeneralEntityAppState } from '../../app-state';
import { entityCatalog } from '../../entity-catalog/entity-catalog';
import { PaginationMonitor } from '../../monitors/pagination-monitor';
import { selectEntities } from '../../selectors/api.selectors';
import { selectPaginationState } from '../../selectors/pagination.selectors';
import {
  PaginatedAction,
  PaginationClientPagination,
  PaginationEntityState,
  PaginationParam,
} from '../../types/pagination.types';
import { getCurrentPageRequestInfo, PaginationObservables } from './pagination-reducer.types';

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
// FIXME: Add typings, should be done with #1477
export function getAction(action): PaginatedAction {
  if (!action) {
    return null;
  }
  return action.apiAction ? action.apiAction : action;
}

// FIXME: Add typings, should be done with #1477
function getEntityConfigFromAction(action): PaginatedAction {
  if (action && action.entityConfig) {
    return action.entityConfig;
  }
  return getAction(action);
}

// FIXME: Add typings, should be done with #1477
export function getActionPaginationEntityKey(action): string {
  const apiAction = getAction(action);
  const entityConfig = apiAction.proxyPaginationEntityConfig || getEntityConfigFromAction(action);
  return entityCatalog.getEntityKey(entityConfig);
}

export function getPaginationKeyFromAction(action: PaginatedAction) {
  const apiAction = getAction(action);
  return apiAction.paginationKey;
}

// TODO: This needs to be a service not just a function! - #3802
export const getPaginationObservables = <T = any, Y extends AppState = AppState>(
  { store, action, paginationMonitor }: {
    store: Store<Y>,
    action: PaginatedAction | PaginatedAction[],
    paginationMonitor: PaginationMonitor,
  },
  isLocal = false
): PaginationObservables<T> => {
  const baseAction = Array.isArray(action) ? action[0] : action;
  const paginationKey = paginationMonitor.paginationKey;
  const entityKey = paginationMonitor.schema.key;
  // FIXME: This will reset pagination every time regardless of if we need to (or just want the pag settings/entities from pagination
  // section)
  if (baseAction.initialParams) {
    store.dispatch(new SetInitialParams(
      paginationMonitor.entityConfig,
      paginationKey,
      baseAction.initialParams,
      isLocal
    ));
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

  // Have we just reset pagination after choosing to ignore maxed?
  if (prevPagination && !prevPagination.maxedState.ignoreMaxed &&
    pagination.maxedState.ignoreMaxed &&
    invalidOrMissingPage) {
    return true;
  }

  // Should a maxed local list be re-fetched?
  if (pagination.maxedState.isMaxedMode && !pagination.maxedState.ignoreMaxed) {
    const paramsChanged = prevPagination && paginationParamsString(prevPagination.params) !== paginationParamsString(pagination.params);
    return invalidOrMissingPage || paramsChanged;
  }

  return false;
}

function paginationParamsString(params: PaginationParam): string {
  const clone = {
    ...params,
  };
  return sortStringify(clone);
}


function sortStringify(obj: { [key: string]: string | string[] | number }): string {
  const keys = Object.keys(obj).sort();
  return keys.reduce((res, key) => {
    return res += `${key}-${obj[key]},`;
  }, '');
}

function shouldFetchNonLocalList(pagination: PaginationEntityState): boolean {
  return !hasError(pagination) && !hasValidOrGettingPage(pagination);
}

const defaultEntitiesFetchHandler = (store: Store<GeneralEntityAppState>, actions: PaginatedAction[]) => () =>
  actions.forEach(action => store.dispatch(action));

function getObservables<T = any>(
  store: Store<GeneralEntityAppState>,
  entityKey: string,
  paginationKey: string,
  paginationAction: PaginatedAction | PaginatedAction[],
  paginationMonitor: PaginationMonitor,
  isLocal = false,
)
  : PaginationObservables<T> {
  let hasDispatchedOnce = false;
  const arrayAction = Array.isArray(paginationAction) ? paginationAction : [paginationAction];
  const paginationSelect$ = store.select(selectPaginationState(entityKey, paginationKey));
  const pagination$: Observable<PaginationEntityState> = paginationSelect$.pipe(filter(pagination => !!pagination));

  const entity = entityCatalog.getEntity(arrayAction[0]);
  const entitiesFetchHandler = entity.getEntitiesFetchHandler();
  const fetchHandler = entitiesFetchHandler ?
    entitiesFetchHandler(store, arrayAction) :
    defaultEntitiesFetchHandler(store, arrayAction);

  // Keep this separate, we don't want tap executing every time someone subscribes
  const fetchPagination$ = paginationSelect$.pipe(
    startWith(null),
    pairwise(),
    tap(([prevPag, newPag]: [PaginationEntityState, PaginationEntityState]) => {
      if (shouldFetchLocalOrNonLocalList(isLocal, hasDispatchedOnce, newPag, prevPag)) {
        hasDispatchedOnce = true; // Ensure we set this first, otherwise we're called again instantly
        fetchHandler();
      }
    }),
    map(([, newPag]) => newPag)
  );

  const entitiesEmitHandlerBuilder = entity.getEntitiesEmitHandler();
  const actionEmitHandler = entitiesEmitHandlerBuilder ? entitiesEmitHandlerBuilder(
    paginationAction, (action) => store.dispatch(action)
  ) : () => { };

  const entities$: Observable<T[]> =
    combineLatest(
      store.select(selectEntities(entityKey)),
      fetchPagination$,
    )
      .pipe(
        filter(([, pagination]) => !!pagination && isPageReady(pagination, isLocal)),
        publishReplay(1),
        refCount(),
        tap(([, pagination]) => actionEmitHandler(pagination)),
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
    totalEntities$: pagination$.pipe(
      map(pag => pag.totalResults),
      distinctUntilChanged()
    ),
    fetchingEntities$: paginationMonitor.fetchingCurrentPage$
  };
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
