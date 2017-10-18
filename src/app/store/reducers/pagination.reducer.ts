import { Action, Store } from '@ngrx/store';
import { denormalize, Schema } from 'normalizr';

import { ApiActionTypes } from '../actions/api.actions';
import { CLEAR_PAGINATION, SET_PAGE, SetPage, selectPaginationState, SET_PARAMS, SetParams } from '../actions/pagination.actions';
import { AppState } from '../app-state';
import { APIAction, getEntityState } from './../actions/api.actions';
import { mergeState } from './../helpers/reducer.helper';
import { Observable } from 'rxjs/Observable';
import { defaultEntitiesState } from './entity.reducer';

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
  params: {
    'results-per-page': 5
  },
  error: false,
  message: ''
};

const updatePagination =
  function (state: PaginationEntityState = defaultPaginationEntityState, action, actionType): PaginationEntityState {
    switch (actionType) {
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
            [state.currentPage]: action.response.result
          },
          pageCount: state.pageCount + 1,
          params: params,
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
        return {
          ...state,
          error: false,
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

  const select$ = store.select(selectPaginationState(entityKey, paginationKey));

  select$.subscribe(() => {
    console.log('Really?');
  });

  const pagination$ = select$
    .debounceTime(250)
    .do(pagination => {
      console.log('Shanged!')
      if (!hasError(pagination) && !hasValidOrGettingPage(pagination)) {
        store.dispatch(action);
      }
    })
    .delay(1)
    .filter(pagination => !!pagination);

  const entities$ = pagination$
    .filter(pagination => {
      console.log('ready?')
      return pageReady(pagination);
    })
    // .distinctUntilChanged((oldPag, newPag) => {
    //   const oldPage = oldPag.ids[oldPag.currentPage];
    //   const newPage = newPag.ids[newPag.currentPage];
    //   return oldPage.join('') !== newPage.join('');
    // })
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

function pageReady(pagination: PaginationEntityState) {
  return pagination && pagination.ids[pagination.currentPage];
}

function hasValidOrGettingPage(pagination: PaginationEntityState) {
  if (pagination && Object.keys(pagination).length) {
    const hasPage = !!pagination.ids[pagination.currentPage];

    return pagination.fetching || hasPage;
  } else {
    return false;
  }
}

function hasError(pagination: PaginationEntityState) {
  return pagination && pagination.error;
}

export function paginationReducer(state = defaultEntitiesState, action) {
  if (action.type === ApiActionTypes.API_REQUEST) {
    return state;
  }

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
