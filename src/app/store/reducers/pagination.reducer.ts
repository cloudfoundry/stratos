import { Action, Store } from '@ngrx/store';
import { denormalize, Schema } from 'normalizr';

import { ApiActionTypes } from '../actions/api.actions';
import { CLEAR_PAGINATION } from '../actions/pagination.actions';
import { AppState } from '../app-state';
import { APIAction } from './../actions/api.actions';
import { mergeState } from './../helpers/reducer.helper';

export class PaginationEntityState {
  currentPage = 0;
  pageCount = 0;
  ids = {};
  fetching: boolean;
  error: boolean;
  message: string;
}

export interface PaginationState {
  [entityType: string]: {
    [paginationKey: string]: PaginationEntityState
  };
}

const types = [
  ApiActionTypes.API_REQUEST_START,
  ApiActionTypes.API_REQUEST_SUCCESS,
  ApiActionTypes.API_REQUEST_FAILED
];

const [requestType, successType, failureType] = types;

const defaultPaginationEntityState = {
  fetching: false,
  pageCount: 0,
  currentPage: 1,
  ids: {},
  error: false,
  message: ''
};

const updatePagination = function (state: PaginationEntityState, action, actionType): PaginationEntityState {
  state = { ...defaultPaginationEntityState, ...state };
  switch (actionType) {
    case requestType:
      return {
        ...state,
        fetching: true,
        error: false,
        message: '',
      };
    case successType:
      return {
        ...state,
        fetching: false,
        error: false,
        message: '',
        ids: {
          [state.currentPage]: action.response.result
        },
        pageCount: state.pageCount + 1
      };
    case failureType:
      return {
        ...state,
        fetching: false,
        error: true,
        message: action.message
      };
    default:
      return state;
  }
};

function getActionType(action) {
  if (action.type === requestType) {
    return action.type;
  }
  if (action.apiType === successType || action.apiType === failureType) {
    return action.apiType;
  }
  return null;
}

function getAction(action): APIAction {
  if (!action) {
    return null;
  }
  return action.apiAction ? action.apiAction : action;
}

function getActionKey(action) {
  const apiAction = getAction(action);
  return apiAction.entityKey || null;
}

function getPaginationKey(action) {
  const apiAction = getAction(action);
  return apiAction.paginationKey;
}

export function getCurrentPage(
  { entityType, paginationKey, store, action, schema }:
    { entityType: string, paginationKey: string, store: Store<AppState>, action: Action, schema: Schema }
) {
  return store.select('pagination')
    .filter((pagination: PaginationState) => {
      const paginationEntity = pagination[entityType];
      if (paginationEntity && paginationEntity[paginationKey]) {
        const paginationState = paginationEntity[paginationKey];
        return !!paginationState;
      } else {
        store.dispatch(action);
        return false;
      }
    })
    .map((pagination: PaginationState) => pagination[entityType][paginationKey])
    .withLatestFrom(store.select('entities'))
    .map(([paginationEntity, entities]) => {
      const page = paginationEntity.ids[paginationEntity.currentPage];
      return {
        paginationEntity,
        data: page ? denormalize(paginationEntity.ids[paginationEntity.currentPage], schema, entities) : null
      };
    });
}

export function paginationReducer(state = {}, action) {

  if (action.type === CLEAR_PAGINATION) {
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

    if (!newState[key] || actionType === CLEAR_PAGINATION) {
      newState[key] = {};
    }
    if (actionType !== CLEAR_PAGINATION) {
      const updatedPaginationState = updatePagination(newState[key][paginationKey], action, actionType);
      newState[key] = mergeState(newState[key], {
        [paginationKey]: updatedPaginationState
      });
    }
    return newState;
  } else {
    return state;
  }
}
