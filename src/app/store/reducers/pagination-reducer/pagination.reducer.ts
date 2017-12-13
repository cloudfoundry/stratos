import { resultPerPageParam, resultPerPageParamDefault } from './pagination-reducer.types';
import {
  getActionKey,
  getActionType,
  getPaginationKey,
  getUniqueQParams,
  removeEmptyParams,
} from './pagination-reducer.helper';
import { PaginatedAction, PaginationEntityState, PaginationParam, QParam } from '../../types/pagination.types';
import { error } from 'util';
import { Action, Store } from '@ngrx/store';
import { denormalize, Schema } from 'normalizr';

import { ApiActionTypes } from '../../actions/request.actions';
import {
  ADD_PARAMS,
  AddParams,
  CLEAR_PAGES,
  CLEAR_PAGINATION_OF_TYPE,
  REMOVE_PARAMS,
  RemoveParams,
  SET_PAGE,
  SET_PARAMS,
  SetPage,
  SetParams,
} from '../../actions/pagination.actions';
import { AppState } from '../../app-state';
import { mergeState } from '../../helpers/reducer.helper';
import { Observable } from 'rxjs/Observable';
import { selectPaginationState } from '../../selectors/pagination.selectors';
import { defaultCfEntitiesState } from '../../types/entity.types';
import { paginationSuccess } from './pagination-reducer-success';
import { paginationFailure } from './pagination-reducer.failure';
import { paginationStart } from './pagination-reducer-start';
import { paginationSetParams } from './pagination-reducer-set-params';
import { paginationSetPage } from './pagination-reducer-set-page';
import { paginationAddParams } from './pagination-reducer-add-params';
import { paginationRemoveParams } from './pagination-reducer-remove-params';

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
      if (state[action.entityKey] && state[action.entityKey][action.paginationKey]) {
        const newState = { ...state };
        const entityState = {
          ...newState[action.entityKey],
          [action.paginationKey]: {
            ...newState[action.entityKey][action.paginationKey],
            ids: {},
            fetching: false,
            pageCount: 0,
            currentPage: 1,
            totalResults: 0,
            error: false,
            message: ''
          }
        };
        return {
          ...newState,
          [action.entityKey]: entityState
        };
      }
    }

    if (action.type === CLEAR_PAGINATION_OF_TYPE) {
      if (state[action.entityKey]) {
        const clearState = { ...state };
        clearState[action.entityKey] = {};
        return clearState;
      }
      return state;
    }

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
  };
}


