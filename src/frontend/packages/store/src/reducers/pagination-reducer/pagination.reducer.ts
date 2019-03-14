import { Action } from '@ngrx/store';

import {
  CONNECT_ENDPOINTS_SUCCESS,
  DISCONNECT_ENDPOINTS_SUCCESS,
  EndpointAction,
  UNREGISTER_ENDPOINTS,
} from '../../actions/endpoint.actions';
import {
  ADD_PARAMS,
  CLEAR_PAGES,
  CLEAR_PAGINATION_OF_ENTITY,
  CLEAR_PAGINATION_OF_TYPE,
  CREATE_PAGINATION,
  REMOVE_PARAMS,
  RESET_PAGINATION,
  SET_CLIENT_FILTER,
  SET_CLIENT_PAGE,
  SET_CLIENT_PAGE_SIZE,
  SET_INITIAL_PARAMS,
  SET_PAGE,
  SET_PAGE_BUSY,
  SET_PARAMS,
  SET_RESULT_COUNT,
  UPDATE_MAXED_STATE,
} from '../../actions/pagination.actions';
import { ApiActionTypes } from '../../actions/request.actions';
import { mergeState } from '../../helpers/reducer.helper';
import { PaginationEntityState, PaginationState } from '../../types/pagination.types';
import {
  ClearPaginationOfEntity,
  ClearPaginationOfType,
  CreatePagination,
  ResetPagination,
} from './../../actions/pagination.actions';
import { paginationAddParams } from './pagination-reducer-add-params';
import { paginationClearPages } from './pagination-reducer-clear-pages';
import { paginationClearOfEntity } from './pagination-reducer-clear-pagination-of-entity';
import { clearEndpointEntities, paginationClearAllTypes } from './pagination-reducer-clear-pagination-type';
import { createNewPaginationSection } from './pagination-reducer-create-pagination';
import { paginationMaxReached } from './pagination-reducer-max-reached';
import { paginationRemoveParams } from './pagination-reducer-remove-params';
import { paginationResetPagination } from './pagination-reducer-reset-pagination';
import { paginationSetClientFilter } from './pagination-reducer-set-client-filter';
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
  getActionKey,
  getActionType,
  getDefaultPaginationEntityState,
  getPaginationKeyFromAction,
} from './pagination-reducer.helper';





// Initialized when all entity types have been registered
export let defaultPaginationState = {};

export function setDefaultPaginationState(state: any) {
  defaultPaginationState = state;
}

const getPaginationUpdater = (types: [string, string, string]) => {
  const [requestType, successType, failureType] = types;
  return (state: PaginationEntityState = getDefaultPaginationEntityState(), action, actionType): PaginationEntityState => {
    switch (action.type) {
      case requestType:
        return paginationStart(state, action);
      case successType:
        return paginationSuccess(state, action);
      case failureType:
        return paginationFailure(state, action);
      case SET_RESULT_COUNT:
        return paginationSetResultCount(state, action);
      case SET_PAGE:
        return paginationSetPage(state, action);
      case SET_INITIAL_PARAMS:
      case SET_PARAMS:
        return paginationSetParams(state, action);
      case ADD_PARAMS:
        return paginationAddParams(state, action);
      case REMOVE_PARAMS:
        return paginationRemoveParams(state, action);
      case SET_CLIENT_PAGE_SIZE:
        return paginationSetClientPageSize(state, action);
      case SET_CLIENT_PAGE:
        return paginationSetClientPage(state, action);
      case SET_CLIENT_FILTER:
        return paginationSetClientFilter(state, action);
      case SET_PAGE_BUSY:
        return paginationPageBusy(state, action);
      default:
        return state;
    }
  };
};

export function createPaginationReducer(types: [string, string, string]) {
  return paginationReducer(getPaginationUpdater(types), types);
}

function paginationReducer(updatePagination, types) {
  return (state, action) => {
    state = state || defaultPaginationState;
    return paginate(action, state, updatePagination);
  };
}

function paginate(action: Action, state: PaginationState, updatePagination) {
  if (action.type === ApiActionTypes.API_REQUEST_START) {
    return state;
  }

  if (action.type === CREATE_PAGINATION) {
    return createNewPaginationSection(state, action as CreatePagination, getDefaultPaginationEntityState());
  }

  if (action.type === CLEAR_PAGES) {
    return paginationClearPages(state, action);
  }
  const resetAction = action as ResetPagination;
  if (action.type === RESET_PAGINATION) {
    return paginationResetPagination(state, resetAction);
  }

  if (action.type === CLEAR_PAGINATION_OF_TYPE) {
    const clearEntityType = (action as ClearPaginationOfType).entityKey || 'application';
    return paginationClearAllTypes(state, [clearEntityType], getDefaultPaginationEntityState());
  }

  if (action.type === CLEAR_PAGINATION_OF_ENTITY) {
    return paginationClearOfEntity(state, action as ClearPaginationOfEntity);
  }

  if (isEndpointAction(action)) {
    return clearEndpointEntities(state, action as EndpointAction, getDefaultPaginationEntityState());
  }

  if (action.type === UPDATE_MAXED_STATE) {
    return paginationMaxReached(state, action);
  }

  return enterPaginationReducer(state, action, updatePagination);
}

function isEndpointAction(action) {
  // ... that we care about.
  return action.type === DISCONNECT_ENDPOINTS_SUCCESS ||
    action.type === CONNECT_ENDPOINTS_SUCCESS ||
    action.type === UNREGISTER_ENDPOINTS;
}

function enterPaginationReducer(state: PaginationState, action, updatePagination) {
  const actionType = getActionType(action);
  const key = getActionKey(action);
  const paginationKey = getPaginationKeyFromAction(action);

  if (actionType && key && paginationKey) {
    const newState = { ...state };
    const updatedPaginationState = updatePagination(newState[key][paginationKey], action, actionType);
    if (state[key][paginationKey] === updatedPaginationState) {
      return state;
    }
    newState[key] = mergeState(newState[key], {
      [paginationKey]: updatedPaginationState
    });
    return newState;
  } else {
    return state;
  }
}
