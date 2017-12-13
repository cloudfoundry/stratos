import { error } from 'util';

import {
  ADD_PARAMS,
  CLEAR_PAGES,
  CLEAR_PAGINATION_OF_TYPE,
  REMOVE_PARAMS,
  SET_PAGE,
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

const defaultPaginationEntityState = {
  fetching: false,
  pageCount: 0,
  currentPage: 1,
  totalResults: 0,
  ids: {},
  params: {
    [resultPerPageParam]: resultPerPageParamDefault
  },
  error: false,
  message: ''
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
      case SET_PAGE:
        return paginationSetPage(state, action);
      case SET_PARAMS:
        return paginationSetParams(state, action);
      case ADD_PARAMS:
        return paginationAddParams(state, action);
      case REMOVE_PARAMS:
        return paginationRemoveParams(state, action);
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

    if (action.type === CLEAR_PAGES) {
      return paginationClearPages(state, action);
    }

    if (action.type === CLEAR_PAGINATION_OF_TYPE) {
      return paginationClearType(state, action);
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


