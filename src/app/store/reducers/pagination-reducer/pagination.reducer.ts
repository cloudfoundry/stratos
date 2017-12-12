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
import { getRequestDataTypeState } from '../../selectors/api.selectors';
import { defaultCfEntitiesState } from '../../types/entity.types';

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

const types = [
  ApiActionTypes.API_REQUEST_START,
  ApiActionTypes.API_REQUEST_SUCCESS,
  ApiActionTypes.API_REQUEST_FAILED
];

const [requestType, successType, failureType] = types;
export function paginationReducer(state, action) {
  state = state || defaultPaginationState;
  if (action.type === ApiActionTypes.API_REQUEST) {
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
}

const updatePagination =
  function (state: PaginationEntityState = defaultPaginationEntityState, action, actionType): PaginationEntityState {
    switch (action.type) {
      case requestType:
        return {
          ...state,
          fetching: true,
          error: false,
          message: '',
        };
      case successType:
        const params = {};
        const { apiAction } = action;
        if (apiAction.options.params) {
          apiAction.options.params.paramsMap.forEach((value, key) => {
            const paramValue = value.length === 1 ? value[0] : value;
            params[key] = paramValue;
          });
        }
        return {
          ...state,
          fetching: false,
          error: false,
          message: '',
          ids: {
            ...state.ids,
            [state.currentPage]: action.response.result
          },
          pageCount: state.pageCount + 1,
          totalResults: action.totalResults || action.response.result.length
        };
      case failureType:
        return {
          ...state,
          fetching: false,
          error: true,
          message: action.message
        };
      case SET_PAGE:
        return {
          ...state,
          error: false,
          currentPage: (action as SetPage).pageNumber
        };
      case SET_PARAMS:
        const setParamAction = action as SetParams;
        return {
          ...state,
          params: removeEmptyParams({
            [resultPerPageParam]: resultPerPageParamDefault,
            ...setParamAction.params,
            q: getUniqueQParams(setParamAction, state)
          })
        };
      case ADD_PARAMS:
        const addParamAction = action as AddParams;
        return {
          ...state,
          params: removeEmptyParams({
            ...state.params,
            ...addParamAction.params,
            q: getUniqueQParams(addParamAction, state)
          })
        };
      case REMOVE_PARAMS:
        const removeParamAction = action as RemoveParams;
        const removeParamsState = {
          ...state,
          params: {
            ...state.params,
            q: state.params.q.filter((qs: QParam) => {
              return !removeParamAction.qs.find((removeParamKey: string) => qs.key === removeParamKey);
            })
          }
        };
        removeParamAction.params.forEach((key) => {
          if (removeParamsState.params.hasOwnProperty(key)) {
            delete removeParamsState.params[key];
          }
        });
        return removeParamsState;
      default:
        return state;
    }
  };

