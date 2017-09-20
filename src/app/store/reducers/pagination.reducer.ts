import { mergeState } from './../helpers/reducer.helper';
import { PaginationState } from './pagination.reducer';
import { Observable } from 'rxjs/Rx';
import { denormalize, Schema } from 'normalizr';
import { EntitiesState } from './entity.reducer';
import { Store, Action } from '@ngrx/store';
import { AppState } from '../app-state';
import { APIAction } from './../actions/api.actions';
import { ApiActionTypes } from '../actions/api.actions';

export class PaginationEntityState {
    currentPage = 0;
    pageCount = 0;
    ids = {};
    fetching: boolean;
    error: boolean;
    message: '';
}

export interface PaginationState {
  [entity: string]: {
    [paginationKey: string]: PaginationEntityState
  };
}

const types = [
  ApiActionTypes.API_REQUEST_START,
  ApiActionTypes.API_REQUEST_SUCCESS,
  ApiActionTypes.API_REQUEST_FAILED
];

const [ requestType, successType, failureType ] = types;

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
  return apiAction.paginationKey || 'all';
}

export function getCurrentPage (
  { entityType, paginationKey, store, action, schema }:
  { entityType: string, paginationKey: string, store: Store<AppState>, action: Action, schema: Schema}
) {
  return store.select('pagination')
  .skipWhile((pagination: PaginationState) =>  {
    const paginationEntity = pagination[entityType];
    if (paginationEntity && paginationEntity[paginationKey]) {
      const paginationState = paginationEntity[paginationKey];
      return !paginationState;
    } else {
      store.dispatch(action);
      return true;
    }
  })
  .flatMap((pagination: PaginationState) => [pagination[entityType][paginationKey]])
  .withLatestFrom(store.select('entities'))
  .flatMap(
    ([paginationEntity, entities]) => {
      const page = paginationEntity.ids[paginationEntity.currentPage];
      return Observable.of({
        paginationEntity,
        data: page ? denormalize(paginationEntity.ids[paginationEntity.currentPage], schema, entities) : null
      });
    }
  );
}

export function paginationReducer (state = {}, action) {
  const actionType = getActionType(action);
  const key = getActionKey(action);
  if (actionType && key) {

      const paginationKey = getPaginationKey(action);
      const newState = { ...state };

      if (!newState[key]) {
        newState[key] = {};
      }

      const updatedPaginationState = updatePagination(newState[key][paginationKey], action, actionType);

      newState[key] = mergeState(newState[key] || {}, {
          [paginationKey]: updatedPaginationState
      });

      return newState;
  } else {
    return state;
  }
}
