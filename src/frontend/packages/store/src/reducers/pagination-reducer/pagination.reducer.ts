import type { Action } from '@ngrx/store';

import {
  CONNECT_ENDPOINTS_SUCCESS,
  DISCONNECT_ENDPOINTS_SUCCESS,
  UNREGISTER_ENDPOINTS,
} from '../../actions/endpoint.actions';
import {
  ADD_PARAMS,
  CLEAR_PAGES,
  CLEAR_PAGINATION_OF_ENTITY,
  CLEAR_PAGINATION_OF_TYPE,
  type ClearPaginationOfEntity,
  type ClearPaginationOfType,
  CREATE_PAGINATION,
  HYDRATE_PAGINATION_STATE,
  type HydratePaginationStateAction,
  IGNORE_MAXED_STATE,
  type IgnorePaginationMaxedState,
  REMOVE_PARAMS,
  RESET_PAGINATION,
  RESET_PAGINATION_OF_TYPE,
  RESET_PAGINATION_SORT_FILTER,
  type ResetPaginationSortFilter,
  SET_CLIENT_FILTER,
  SET_CLIENT_FILTER_KEY,
  SET_CLIENT_PAGE,
  SET_CLIENT_PAGE_SIZE,
  SET_INITIAL_PARAMS,
  SET_PAGE,
  SET_PAGE_BUSY,
  SET_PAGINATION_IS_LIST,
  SET_PARAMS,
  SET_RESULT_COUNT,
  type SetPaginationIsList,
  UPDATE_MAXED_STATE,
} from '../../actions/pagination.actions';
import { ApiActionTypes } from '../../actions/request.actions';
import { InitCatalogEntitiesAction } from '../../entity-catalog.actions';
import { entityCatalog } from '../../entity-catalog/entity-catalog';
import { getDefaultStateFromEntityCatalog } from '../../entity-catalog/entity-catalog.store-setup';
import { mergeState } from '../../helpers/reducer.helper';
import type { PaginatedAction, PaginationEntityState, PaginationEntityTypeState, PaginationState } from '../../types/pagination.types';
import type { UpdatePaginationMaxedState } from './../../actions/pagination.actions';
import { paginationAddParams } from './pagination-reducer-add-params';
import { paginationClearPages } from './pagination-reducer-clear-pages';
import { paginationClearOfEntity } from './pagination-reducer-clear-pagination-of-entity';
import { paginationClearAllTypes } from './pagination-reducer-clear-pagination-type';
import { createNewPaginationSection } from './pagination-reducer-create-pagination';
import { paginationIgnoreMaxed, paginationMaxReached } from './pagination-reducer-max-reached';
import { paginationRemoveParams } from './pagination-reducer-remove-params';
import {
  getDefaultPaginationEntityState,
  paginationResetPagination,
  resetEndpointEntities,
} from './pagination-reducer-reset-pagination';
import { paginationResetSortAndFilter } from './pagination-reducer-reset-sort-filter';
import { paginationSetClientFilter } from './pagination-reducer-set-client-filter';
import { paginationSetClientFilterKey } from './pagination-reducer-set-client-filter-key';
import { paginationSetClientPage } from './pagination-reducer-set-client-page';
import { paginationSetClientPageSize } from './pagination-reducer-set-client-page-size';
import { paginationSetPage } from './pagination-reducer-set-page';
import { paginationSetParams } from './pagination-reducer-set-params';
import { paginationSetResultCount } from './pagination-reducer-set-result-count';
import { paginationStart } from './pagination-reducer-start';
import { paginationSuccess } from './pagination-reducer-success';
import { paginationPageBusy } from './pagination-reducer-update';
import { paginationFailure } from './pagination-reducer.failure';
import {
  getActionPaginationEntityKey,
  getActionType,
  getPaginationKeyFromAction,
  isClearPagesAction,
  isCreatePaginationAction,
  isResetPaginationAction,
  isResetPaginationOfTypeAction,
} from './pagination-reducer.helper';

const getPaginationUpdater = (types: [string, string, string]) => {
  const [requestType, successType, failureType] = types;
  return (state: PaginationEntityState = getDefaultPaginationEntityState(), action: Action): PaginationEntityState => {
    switch (action.type) {
      case requestType:
        return paginationStart(state, action as any);
      case successType:
        return paginationSuccess(state, action as any);
      case failureType:
        return paginationFailure(state, action as any);
      case SET_RESULT_COUNT:
        return paginationSetResultCount(state, action as any);
      case SET_PAGE:
        return paginationSetPage(state, action as any);
      case SET_INITIAL_PARAMS:
      case SET_PARAMS:
        return paginationSetParams(state, action as any);
      case ADD_PARAMS:
        return paginationAddParams(state, action as any);
      case REMOVE_PARAMS:
        return paginationRemoveParams(state, action as any);
      case SET_CLIENT_PAGE_SIZE:
        return paginationSetClientPageSize(state, action as any);
      case SET_CLIENT_PAGE:
        return paginationSetClientPage(state, action as any);
      case SET_CLIENT_FILTER:
        return paginationSetClientFilter(state, action as any);
      case SET_CLIENT_FILTER_KEY:
        return paginationSetClientFilterKey(state, action as any);
      case SET_PAGE_BUSY:
        return paginationPageBusy(state, action as any);
      default:
        return state;
    }
  };
};

export function createPaginationReducer(types: [string, string, string]) {
  return paginationReducer(getPaginationUpdater(types));
}

type PaginationUpdater = (state: PaginationEntityState, action: Action) => PaginationEntityState;

function paginationReducer(updatePagination: PaginationUpdater) {
  return (state: PaginationState, action: Action): PaginationState => {
    return paginate(action, state, updatePagination);
  };
}

function paginate(action: Action, state: PaginationState = {}, updatePagination: PaginationUpdater): PaginationState {
  if (action.type === ApiActionTypes.API_REQUEST_START) {
    return state;
  }

  if (action.type === InitCatalogEntitiesAction.ACTION_TYPE) {
    return getDefaultStateFromEntityCatalog((action as InitCatalogEntitiesAction).entityKeys, {}, state);
  }

  if (isCreatePaginationAction(action)) {
    return createNewPaginationSection(state, action, getDefaultPaginationEntityState());
  }

  if (isClearPagesAction(action)) {
    const entityKey = entityCatalog.getEntityKey(action.entityConfig);
    return paginationClearPages(state, { ...action, entityKey, paginationKey: action.paginationKey });
  }

  if (isResetPaginationAction(action)) {
    const resetAction = action as typeof action & { keepPages?: boolean };
    if (!resetAction.keepPages) {
      return paginationResetPagination(state, action);
    }
  }

  if (isResetPaginationOfTypeAction(action)) {
    const resetTypeAction = action as typeof action & { keepPages?: boolean };
    if (!resetTypeAction.keepPages) {
      return paginationResetPagination(state, action, true);
    }
  }

  if (action.type === CLEAR_PAGINATION_OF_TYPE) {
    const clearAction = action as ClearPaginationOfType;
    const clearEntityType = entityCatalog.getEntityKey(clearAction.entityConfig.endpointType, clearAction.entityConfig.entityType);
    return paginationClearAllTypes(state, [clearEntityType]);
  }

  if (action.type === CLEAR_PAGINATION_OF_ENTITY) {
    return paginationClearOfEntity(state, action as ClearPaginationOfEntity);
  }

  if (isEndpointAction(action)) {
    return resetEndpointEntities(state, action as any);
  }

  if (action.type === UPDATE_MAXED_STATE) {
    return paginationMaxReached(state, action as UpdatePaginationMaxedState);
  }

  if (action.type === IGNORE_MAXED_STATE) {
    return paginationIgnoreMaxed(state, action as IgnorePaginationMaxedState);
  }

  if (action.type === HYDRATE_PAGINATION_STATE) {
    return hydratePagination(state, action as HydratePaginationStateAction);
  }

  if (action.type === RESET_PAGINATION_SORT_FILTER) {
    return paginationResetSortAndFilter(state, action as ResetPaginationSortFilter);
  }

  if (action.type === SET_PAGINATION_IS_LIST) {
    return setPaginationIsList(state, action as SetPaginationIsList);
  }

  return enterPaginationReducer(state, action, updatePagination);
}

function setPaginationIsList(state: PaginationState, action: SetPaginationIsList): PaginationState {
  const entityKey = entityCatalog.getEntityKey(action.pagAction);
  const existingPag = state[entityKey] ? state[entityKey][action.pagAction.paginationKey] : null;
  const pag = existingPag || getDefaultPaginationEntityState();

  if (pag.isListPagination === action.pagAction.isList) {
    return state;
  }

  const entityState: PaginationEntityTypeState = {
    ...state[entityKey],
    [action.pagAction.paginationKey]: {
      ...pag,
      isListPagination: action.pagAction.isList
    }
  };
  return {
    ...state,
    [entityKey]: entityState
  };
}

/**
 * Push data from local storage back into the pagination state
 */
function hydratePagination(state: PaginationState, action: HydratePaginationStateAction): PaginationState {
  const hydrate = action.paginationState || {};
  const entityKeys = Object.keys(hydrate);
  if (entityKeys.length === 0) {
    return state;
  }

  // Loop through all entity types.... and pagination sections in those types.... merging in state from storage
  const newState = entityKeys.reduce((res, entityKey) => {
    const existingEntityState = state[entityKey] || {};
    const hydrateEntityState = action.paginationState[entityKey];

    res[entityKey] = Object.keys(hydrateEntityState).reduce((res2, paginationKey) => {
      const existingPageState = existingEntityState[paginationKey] || getDefaultPaginationEntityState();
      const hydratePagSection = hydrateEntityState[paginationKey];
      res2[paginationKey] = {
        ...existingPageState,
        ...hydratePagSection
      };
      return res2;
    }, {
      ...existingEntityState
    });

    return res;
  }, {
    ...state
  });
  return newState;
}

function isEndpointAction(action: Action): boolean {
  // ... that we care about.
  return action.type === DISCONNECT_ENDPOINTS_SUCCESS ||
    action.type === CONNECT_ENDPOINTS_SUCCESS ||
    action.type === UNREGISTER_ENDPOINTS;
}

function logMissing(missing: string, allKeys: string[]): void {
  console.warn(
    `Missing ${missing} in store`,
    allKeys
  );
}

function enterPaginationReducer(state: PaginationState, action: Action, updatePagination: PaginationUpdater): PaginationState {
  const actionType = getActionType(action);
  const entityKey = getActionPaginationEntityKey(action);
  const paginationKey = getPaginationKeyFromAction(action as PaginatedAction);
  if (actionType && entityKey && paginationKey) {
    const newState = { ...state };
    if (!newState[entityKey]) {
      logMissing(`entity type ''`, Object.keys(newState));
    }
    const updatedPaginationState = updatePagination(newState[entityKey][paginationKey], action);
    if (state[entityKey][paginationKey] === updatedPaginationState) {
      return state;
    }
    newState[entityKey] = mergeState(newState[entityKey], {
      [paginationKey]: updatedPaginationState
    });
    return newState;
  } else {
    return state;
  }
}
