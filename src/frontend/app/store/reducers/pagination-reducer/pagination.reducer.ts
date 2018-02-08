import { DISCONNECT_CNSIS_SUCCESS, CONNECT_CNSIS_SUCCESS, UNREGISTER_CNSIS } from './../../actions/cnsis.actions';
import { paginationSetClientFilter } from './pagination-reducer-set-client-filter';
import { paginationSetClientPage } from './pagination-reducer-set-client-page';
import { paginationSetClientPageSize } from './pagination-reducer-set-client-page-size';
import {
  ADD_PARAMS,
  RESET_PAGINATION,
  CLEAR_PAGINATION_OF_TYPE,
  REMOVE_PARAMS,
  SET_CLIENT_FILTER,
  SET_CLIENT_PAGE,
  SET_CLIENT_PAGE_SIZE,
  SET_PAGE,
  SET_RESULT_COUNT,
  SET_PARAMS,
  CLEAR_PAGES,
  SET_INITIAL_PARAMS,
  CLEAR_PAGINATION_OF_ENTITY,
} from '../../actions/pagination.actions';
import { ApiActionTypes } from '../../actions/request.actions';
import { mergeState } from '../../helpers/reducer.helper';
import { defaultCfEntitiesState } from '../../types/entity.types';
import { PaginationEntityState, PaginationState } from '../../types/pagination.types';
import { paginationAddParams } from './pagination-reducer-add-params';
import { clearEndpointEntities, paginationClearType } from './pagination-reducer-clear-pagination-type';
import { paginationRemoveParams } from './pagination-reducer-remove-params';
import { paginationSetPage } from './pagination-reducer-set-page';
import { paginationSetParams } from './pagination-reducer-set-params';
import { paginationStart } from './pagination-reducer-start';
import { paginationSuccess } from './pagination-reducer-success';
import { paginationFailure } from './pagination-reducer.failure';
import { getActionKey, getActionType, getPaginationKeyFromAction } from './pagination-reducer.helper';
import { resultPerPageParam, resultPerPageParamDefault } from './pagination-reducer.types';
import { paginationSetResultCount } from './pagination-reducer-set-result-count';
import { paginationResetPagination } from './pagination-reducer-reset-pagination';
import { paginationClearPages } from './pagination-reducer-clear-pages';
import { paginationClearOfEntity } from './pagination-reducer-clear-pagination-of-entity';

export const defaultClientPaginationPageSize = 9;

const defaultPaginationEntityState: PaginationEntityState = {
  pageCount: 0,
  currentPage: 1,
  totalResults: 0,
  ids: {},
  pageRequests: {
  },
  params: {
  },
  clientPagination: {
    pageSize: defaultClientPaginationPageSize,
    currentPage: 1,
    filter: {
      string: '',
      items: {}
    },
    totalResults: 0
  }
};

function getDefaultPaginationEntityState() {
  return {
    ...defaultPaginationEntityState
  };
}

export const defaultPaginationState = { ...defaultCfEntitiesState };

const getPaginationUpdater = function (types: [string, string, string]) {
  const [requestType, successType, failureType] = types;
  return function (state: PaginationEntityState = getDefaultPaginationEntityState(), action, actsionType): PaginationEntityState {
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
      default:
        return state;
    }
  };
};

export function createPaginationReducer(types: [string, string, string]) {
  return paginationReducer(getPaginationUpdater(types), types);
}

function paginationReducer(updatePagination, types) {
  const [requestType, successType, failureType] = types;
  return function (state, action) {
    state = state || defaultPaginationState;
    return paginate(action, state, updatePagination);
  };
}

function paginate(action, state, updatePagination) {
  if (action.type === ApiActionTypes.API_REQUEST_START) {
    return state;
  }

  if (action.type === CLEAR_PAGES) {
    return paginationClearPages(state, action);
  }

  if (action.type === RESET_PAGINATION && !action.keepPages) {
    return paginationResetPagination(state, action);
  }

  if (action.type === CLEAR_PAGINATION_OF_TYPE) {
    const clearEntityType = action.entityKey || 'application';
    return paginationClearType(state, clearEntityType, getDefaultPaginationEntityState());
  }

  if (action.type === CLEAR_PAGINATION_OF_ENTITY) {
    return paginationClearOfEntity(state, action);
  }

  if (isEnDpointAction(action)) {
    return clearEndpointEntities(state, getDefaultPaginationEntityState());
  }

  return enterPaginationReducer(state, action, updatePagination);
}

function isEnDpointAction(action) {
  // ... that we care about.
  return action.type === DISCONNECT_CNSIS_SUCCESS ||
    action.type === CONNECT_CNSIS_SUCCESS ||
    action.type === UNREGISTER_CNSIS;
}

function enterPaginationReducer(state: PaginationState, action, updatePagination) {
  const actionType = getActionType(action);
  const key = getActionKey(action);
  const paginationKey = getPaginationKeyFromAction(action);

  if (actionType && key && paginationKey) {
    const newState = { ...state };
    const updatedPaginationState = updatePagination(newState[key][paginationKey], action, actionType);
    newState[key] = mergeState(newState[key], {
      [paginationKey]: updatedPaginationState
    });
    return newState;
  } else {
    return state;
  }
}
