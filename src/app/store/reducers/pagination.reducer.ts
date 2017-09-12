import { PaginationState } from './pagination.reducer';
import { Observable } from 'rxjs/Rx';
import { denormalize, Schema } from 'normalizr';
import { EntitiesState } from './api.reducer';
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
  state = {...defaultPaginationEntityState, ...state};
  switch (actionType) {
    case requestType:
      return {
        ...state,
        fetching: true
      };
    case successType:
      return {
        ...state,
        fetching: false,
        ids: {
          [state.currentPage]: action.response.result
        },
        pageCount: state.pageCount + 1
      };
    case failureType:
      return {
        ...state,
        fetching: false
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

export function getCurrentPage (
  { entityType, paginationKey, store, action, schema }:
  { entityType: string, paginationKey: string, store: Store<AppState>, action: Action, schema: Schema}
) {
  return store.select('pagination')
  .skipWhile((pagination: PaginationState) =>  {
    const paginationEntity = pagination[entityType];
    if (paginationEntity) {
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
  if (actionType) {
      const key = action.entityKey;
      if (typeof key !== 'string') {
        throw new Error('Expected key to be a string.');
      }
      const paginationKey = action.paginationKey || 'all';

      if (!state[key]) {
        state[key] = {};
      }

      return {
        ...state,
        [key]: {
          [paginationKey]: updatePagination(state[key][paginationKey], action, actionType)
        }
      };
  } else {
    return state;
  }
}
