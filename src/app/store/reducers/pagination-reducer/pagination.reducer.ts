import { paginationSetClientFilter } from './pagination-reducer-set-client-filter';
import { paginationSetClientPage } from './pagination-reducer-set-client-page';
import { paginationSetClientPageSize } from './pagination-reducer-set-client-page-size';
import {
  ADD_PARAMS,
  CLEAR_PAGES,
  CLEAR_PAGINATION_OF_TYPE,
  REMOVE_PARAMS,
  SET_CLIENT_FILTER,
  SET_CLIENT_PAGE,
  SET_CLIENT_PAGE_SIZE,
  SET_PAGE,
  SET_RESULT_COUNT,
  SET_PARAMS,
} from '../../actions/pagination.actions';
import { ApiActionTypes } from '../../actions/request.actions';
import { mergeState } from '../../helpers/reducer.helper';
import { defaultCfEntitiesState } from '../../types/entity.types';
import { PaginationEntityState, PaginationState } from '../../types/pagination.types';
import { paginationAddParams } from './pagination-reducer-add-params';
import { paginationClearPages } from './pagination-reducer-clear-pages';
import { paginationClearType } from './pagination-reducer-clear-pagination-type';
import { paginationRemoveParams } from './pagination-reducer-remove-params';
import { paginationSetPage } from './pagination-reducer-set-page';
import { paginationSetParams } from './pagination-reducer-set-params';
import { paginationStart } from './pagination-reducer-start';
import { paginationSuccess } from './pagination-reducer-success';
import { paginationFailure } from './pagination-reducer.failure';
import { getActionKey, getActionType, getPaginationKey } from './pagination-reducer.helper';
import { resultPerPageParam, resultPerPageParamDefault } from './pagination-reducer.types';
import { paginationSetResultCount } from './pagination-reducer-set-result-count';

export const defaultPaginationEntityState = {
  fetching: false,
  pageCount: 0,
  currentPage: 1,
  totalResults: 0,
  ids: {},
  params: {
    [resultPerPageParam]: resultPerPageParamDefault
  },
  error: false,
  message: '',
  clientPagination: {
    pageSize: 10,
    currentPage: 1,
    filter: '',
    totalResults: 0
  }
};

export const defaultPaginationState = { ...defaultCfEntitiesState };

const getPaginationUpdater = function (types: [string, string, string]) {
  const [requestType, successType, failureType] = types;
  return function (state: PaginationEntityState = defaultPaginationEntityState, action, actionType): PaginationEntityState {
    switch (action.type) {
      case requestType:
        return paginationStart(state);
      case successType:
        return paginationSuccess(state, action);
      case failureType:
        return paginationFailure(state, action);
      case SET_RESULT_COUNT:
        return paginationSetResultCount(state, action);
      case SET_PAGE:
        return paginationSetPage(state, action);
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
  const updatePagination = getPaginationUpdater(types);
  const [requestType, successType, failureType] = types;
  return function (state, action) {
    state = state || defaultPaginationState;
    if (action.type === ApiActionTypes.API_REQUEST_START) {
      return state;
    }

    if (action.type === CLEAR_PAGES && !action.keepPages) {
      return paginationClearPages(state, action);
    }

    if (action.type === CLEAR_PAGINATION_OF_TYPE) {
      return paginationClearType(state, action, defaultPaginationEntityState);
    }

    return enterPaginationReducer(state, action, updatePagination);
  };
}

function enterPaginationReducer(state: PaginationState, action, updatePagination) {
  const actionType = getActionType(action);
  const key = getActionKey(action);
  const paginationKey = getPaginationKey(action);

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


