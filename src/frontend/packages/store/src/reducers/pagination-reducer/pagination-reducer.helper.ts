import type { Store } from '@ngrx/store';
import { combineLatest, type Observable } from 'rxjs';
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

import type { Action } from '@ngrx/store';

import {
  type AddParams,
  type BasePaginationAction,
  CLEAR_PAGES,
  type ClearPages,
  type ClearPaginationOfEntity,
  type ClearPaginationOfType,
  CREATE_PAGINATION,
  type CreatePagination,
  type RemoveParams,
  RESET_PAGINATION,
  RESET_PAGINATION_OF_TYPE,
  type ResetPagination,
  type ResetPaginationOfType,
  type ResetPaginationSortFilter,
  type SetClientFilter,
  type SetClientFilterKey,
  type SetClientPage,
  type SetClientPageSize,
  SetInitialParams,
  type SetPage,
  SetPaginationIsList,
  type SetParams,
  type SetResultCount,
} from '../../actions/pagination.actions';
import type { AppState, GeneralEntityAppState } from '../../app-state';
import { entityCatalog } from '../../entity-catalog/entity-catalog';
import type { PaginationMonitor } from '../../monitors/pagination-monitor';
import { selectEntities } from '../../selectors/api.selectors';
import { selectPaginationState } from '../../selectors/pagination.selectors';
import type {
  PaginatedAction,
  PaginationClientPagination,
  PaginationEntityState,
  PaginationParam,
} from '../../types/pagination.types';
import { getCurrentPageRequestInfo, type PaginationObservables } from './pagination-reducer.types';
import { defaultClientPaginationPageSize } from './pagination-reducer-reset-pagination';

// Type predicates for action narrowing

/**
 * Type guard to check if an action extends BasePaginationAction
 */
function isPaginationAction(action: unknown): action is BasePaginationAction & Action {
  return (
    action !== null &&
    typeof action === 'object' &&
    'entityConfig' in action &&
    'type' in action &&
    typeof (action as Action).type === 'string'
  );
}

/**
 * Type guard to check if an action is a PaginatedAction
 */
function isPaginatedAction(action: unknown): action is PaginatedAction {
  return (
    action !== null &&
    typeof action === 'object' &&
    'paginationKey' in action &&
    'type' in action &&
    'entityType' in action &&
    'endpointType' in action
  );
}

/**
 * Type guard to check if an object has an apiAction property
 */
function hasApiAction(action: unknown): action is { apiAction: PaginatedAction } {
  return (
    action !== null &&
    typeof action === 'object' &&
    'apiAction' in action &&
    isPaginatedAction((action as { apiAction: unknown }).apiAction)
  );
}

/**
 * Type guard to check if an object has an entityConfig property that is a PaginatedAction
 */
function hasEntityConfig(action: unknown): action is { entityConfig: PaginatedAction } {
  return (
    action !== null &&
    typeof action === 'object' &&
    'entityConfig' in action &&
    isPaginatedAction((action as { entityConfig: unknown }).entityConfig)
  );
}

/**
 * Type guard to check if an object has a type property
 */
function hasTypeProperty(action: unknown): action is Action {
  return (
    action !== null &&
    typeof action === 'object' &&
    'type' in action &&
    typeof (action as { type: unknown }).type === 'string'
  );
}

/**
 * Type guard to check if an action is a CreatePagination action
 */
export function isCreatePaginationAction(action: Action): action is CreatePagination {
  return action.type === CREATE_PAGINATION;
}

/**
 * Type guard to check if an action is a ClearPages action
 */
export function isClearPagesAction(action: Action): action is ClearPages {
  return action.type === CLEAR_PAGES;
}

/**
 * Type guard to check if an action is a ResetPagination action
 */
export function isResetPaginationAction(action: Action): action is ResetPagination {
  return action.type === RESET_PAGINATION;
}

/**
 * Type guard to check if an action is a ResetPaginationOfType action
 */
export function isResetPaginationOfTypeAction(action: Action): action is ResetPagination {
  return action.type === RESET_PAGINATION_OF_TYPE;
}

/**
 * Removes empty or falsy parameters from a pagination parameter object
 * @param params - The pagination parameters to filter
 * @returns A new object with only truthy values
 */
export function removeEmptyParams(params: PaginationParam): PaginationParam {
  const newObject: Record<string, string | string[] | number> = {};
  Object.keys(params).forEach(key => {
    const value = params[key];
    if (value) {
      newObject[key] = value;
    }
  });
  return newObject;
}

/**
 * Safely extracts the type property from an action
 * @param action - The action object to extract type from
 * @returns The action type string, or empty string if not found
 */
export function getActionType(action: unknown): string {
  if (!hasTypeProperty(action)) {
    return '';
  }
  return action.type;
}

/**
 * Extracts a PaginatedAction from various action wrapper types
 * Handles actions that may have an apiAction property or are PaginatedActions themselves
 * @param action - The action to unwrap
 * @returns The PaginatedAction or null if not found
 */
export function getAction(action: unknown): PaginatedAction | null {
  if (!action) {
    return null;
  }

  // Check if action has apiAction property
  if (hasApiAction(action)) {
    return action.apiAction;
  }

  // Check if action itself is a PaginatedAction
  if (isPaginatedAction(action)) {
    return action;
  }

  return null;
}

/**
 * Extracts entity configuration from an action
 * @param action - The action to extract entity config from
 * @returns The PaginatedAction representing entity config or null
 */
function getEntityConfigFromAction(action: unknown): PaginatedAction | null {
  if (!action) {
    return null;
  }

  // Check if action has entityConfig property that is a PaginatedAction
  if (hasEntityConfig(action)) {
    return action.entityConfig;
  }

  return getAction(action);
}

/**
 * Gets the entity key for pagination from an action
 * @param action - The action to extract entity key from
 * @returns The entity key string, or empty string if not found
 */
export function getActionPaginationEntityKey(action: unknown): string {
  const apiAction = getAction(action);
  const entityConfig = apiAction?.proxyPaginationEntityConfig || getEntityConfigFromAction(action);

  if (!entityConfig) {
    return '';
  }

  return entityCatalog.getEntityKey(entityConfig);
}

/**
 * Extracts the pagination key from an action
 * @param action - The action to extract pagination key from
 * @returns The pagination key string, or empty string if not found
 */
export function getPaginationKeyFromAction(action: unknown): string {
  const apiAction = getAction(action);

  if (!apiAction) {
    return '';
  }

  return apiAction.paginationKey || '';
}

/**
 * Creates pagination observables for monitoring pagination state and entities
 * @template T - The type of entities being paginated
 * @template Y - The app state type, defaults to AppState
 * @param config - Configuration object containing store, action, and pagination monitor
 * @param isLocal - Whether this is local (client-side) pagination
 * @returns Observable streams for pagination state and entities
 */
export const getPaginationObservables = <T = unknown, Y extends AppState = AppState>(
  { store, action, paginationMonitor }: {
    store: Store<Y>;
    action: PaginatedAction | PaginatedAction[];
    paginationMonitor: PaginationMonitor;
  },
  isLocal = false
): PaginationObservables<T> => {
  const baseAction = Array.isArray(action) ? action[0] : action;
  const paginationKey = paginationMonitor.paginationKey;
  const entityKey = paginationMonitor.schema.key;

  store.dispatch(new SetPaginationIsList(baseAction));

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

/**
 * Determines if a local or non-local list should be fetched
 * @param isLocal - Whether this is a local pagination list
 * @param hasDispatchedOnce - Whether the initial fetch has been dispatched
 * @param pagination - Current pagination state
 * @param prevPagination - Previous pagination state
 * @returns True if the list should be fetched
 */
function shouldFetchLocalOrNonLocalList(
  isLocal: boolean,
  hasDispatchedOnce: boolean,
  pagination: PaginationEntityState,
  prevPagination: PaginationEntityState
): boolean {
  // The following could be written more succinctly, but kept verbose for clarity
  return isLocal ? shouldFetchLocalList(hasDispatchedOnce, pagination, prevPagination) : shouldFetchNonLocalList(pagination);
}

/**
 * Determines if a local pagination list should be fetched
 * Handles various scenarios including first fetch, maxed state, and param changes
 * @param hasDispatchedOnce - Whether the initial fetch has been dispatched
 * @param pagination - Current pagination state
 * @param prevPagination - Previous pagination state
 * @returns True if the list should be fetched
 */
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

/**
 * Converts pagination parameters to a sorted string for comparison
 * @param params - The pagination parameters
 * @returns A string representation of the parameters
 */
function paginationParamsString(params: PaginationParam): string {
  const clone = {
    ...params,
  };
  return sortStringify(clone);
}

/**
 * Stringifies an object with sorted keys for consistent comparison
 * @param obj - The object to stringify
 * @returns A sorted string representation
 */
function sortStringify(obj: { [key: string]: string | string[] | number }): string {
  const keys = Object.keys(obj).sort();
  return keys.reduce((res, key) => {
    res += `${key}-${obj[key]},`;
    return res;
  }, '');
}

/**
 * Determines if a non-local pagination list should be fetched
 * @param pagination - Current pagination state
 * @returns True if the list should be fetched
 */
function shouldFetchNonLocalList(pagination: PaginationEntityState): boolean {
  return !hasError(pagination) && !hasValidOrGettingPage(pagination);
}

/**
 * Default handler for fetching entities - dispatches all provided actions
 * @param store - The NgRx store
 * @param actions - Array of paginated actions to dispatch
 * @returns A function that dispatches all actions
 */
const defaultEntitiesFetchHandler = (store: Store<GeneralEntityAppState>, actions: PaginatedAction[]) => (): void => {
  actions.forEach(action => {
    store.dispatch(action);
  });
};

/**
 * Creates observable streams for pagination data
 * Sets up reactive streams for pagination state, entities, and loading states
 * @template T - The type of entities being paginated
 * @param store - The NgRx store
 * @param entityKey - The entity type key
 * @param paginationKey - The pagination section key
 * @param paginationAction - The action(s) to dispatch for fetching data
 * @param paginationMonitor - Monitor for tracking pagination state
 * @param isLocal - Whether this is local (client-side) pagination
 * @returns Observable streams for pagination state and entities
 */
function getObservables<T = unknown>(
  store: Store<GeneralEntityAppState>,
  entityKey: string,
  paginationKey: string,
  paginationAction: PaginatedAction | PaginatedAction[],
  paginationMonitor: PaginationMonitor,
  isLocal = false
): PaginationObservables<T> {
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
        switchMap(() => paginationMonitor.currentPage$ as Observable<T[]>),
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
      map(pag => isLocal ? pag.clientPagination.totalResults : pag.totalResults),
      distinctUntilChanged()
    ),
    fetchingEntities$: paginationMonitor.fetchingCurrentPage$
  };
}

/**
 * Checks if the current pagination page is ready (not busy fetching)
 * @param pagination - The pagination state to check
 * @param isLocal - Whether this is local pagination (checks all pages)
 * @returns True if the page is ready
 */
export function isPageReady(pagination: PaginationEntityState, isLocal = false): boolean {
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

/**
 * Checks if the current page is being fetched
 * @param pagination - The pagination state to check
 * @returns True if the current page is busy fetching
 */
export function isFetchingPage(pagination: PaginationEntityState): boolean {
  if (pagination) {
    const currentPageRequest = getCurrentPageRequestInfo(pagination);
    return currentPageRequest.busy;
  } else {
    return false;
  }
}

/**
 * Checks if the pagination has a valid page or is currently fetching one
 * @param pagination - The pagination state to check
 * @returns True if page exists or is being fetched
 */
export function hasValidOrGettingPage(pagination: PaginationEntityState): boolean {
  if (pagination && Object.keys(pagination).length) {
    const hasPage = !!pagination.ids[pagination.currentPage];
    const currentPageRequest = getCurrentPageRequestInfo(pagination);
    return hasPage || currentPageRequest.busy;
  } else {
    return false;
  }
}

/**
 * Checks if the current page request has an error
 * @param pagination - The pagination state to check
 * @returns True if there is an error
 */
export function hasError(pagination: PaginationEntityState): boolean {
  return pagination && getCurrentPageRequestInfo(pagination).error;
}

/**
 * Safely spreads client pagination state with defaults
 * Ensures all required properties exist with fallback values
 * @param pag - The client pagination state to spread
 * @returns A complete client pagination object with all required properties
 */
export function spreadClientPagination(pag: PaginationClientPagination | undefined): PaginationClientPagination {
  if (!pag) {
    return {
      pageSize: defaultClientPaginationPageSize,
      currentPage: 1,
      filter: {
        string: '',
        items: {}
      },
      totalResults: 0
    };
  }

  return {
    ...pag,
    filter: {
      ...(pag.filter || { string: '', items: {} }),
      items: {
        ...(pag.filter?.items || {})
      }
    }
  };
}
