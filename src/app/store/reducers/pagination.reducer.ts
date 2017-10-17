import { Action, Store } from '@ngrx/store';
import { denormalize, Schema } from 'normalizr';

import { ApiActionTypes } from '../actions/api.actions';
import { CLEAR_PAGINATION, SET_PAGE, SetPage, selectPaginationState, SET_PARAMS, SetParams } from '../actions/pagination.actions';
import { AppState } from '../app-state';
import { APIAction, getEntityState } from './../actions/api.actions';
import { mergeState } from './../helpers/reducer.helper';
import { Observable } from 'rxjs';

export class PaginationEntityState {
  currentPage = 0;
  totalResults = 0; // TODO: Populate
  pageCount = 0;
  ids = {};
  params: {
    [entityKey: string]: string | number
  };
  fetching: boolean;
  error: boolean;
  message: string;
}

export interface PaginationAction extends Action {
  entityKey: string;
  paginationKey: string;
}

export interface PaginationEntityTypeState {
  [paginationKey: string]: PaginationEntityState;
}

export interface PaginationState {
  [entityKey: string]: PaginationEntityTypeState;
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
  totalResults: 0,
  ids: {},
  params: {},
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
        pageCount: state.pageCount + 1,
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
        currentPage: (action as SetPage).pageNumber
      };
    case SET_PARAMS:
      return {
        ...state,
        params: (action as SetParams).params
      };
    default:
      return state;
  }
};

function getActionType(action) {
  return action.apiType || action.type;
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

export function getPaginationObservables(
  { store, action, schema }:
    { store: Store<AppState>, action: PaginationAction, schema: Schema }
) {
  const { entityKey, paginationKey } = action;

  const pagination$ = store.select(selectPaginationState(entityKey, paginationKey))
    .do(pagination => {
      if (!pagination) {
        store.dispatch(action);
      }
    })
    .filter(pagination => !!pagination);

  const entities$ = pagination$
    .filter(pagination => {
      return !!pagination && !pagination.fetching && !!pagination.ids[pagination.currentPage];
    })
    .distinctUntilChanged((oldPag, newPag) => {
      const oldPage = oldPag.ids[oldPag.currentPage];
      const newPage = newPag.ids[newPag.currentPage];
      return oldPage.join('') !== newPage.join('');
    })
    .withLatestFrom(store.select(getEntityState))
    .map(([paginationEntity, entities]) => {
      const page = paginationEntity.ids[paginationEntity.currentPage];
      return page ? denormalize(page, schema, entities) : null;
    });

  return {
    pagination$,
    entities$
  };
}

function shouldFetchCurrentPage(pagination: PaginationEntityState) {
  return !pagination || (!pagination.fetching && !pagination.error && (!pagination.ids || !pagination.ids[pagination.currentPage]));
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
