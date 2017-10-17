import { AppState } from '../app-state';
import { Action, compose } from '@ngrx/store';
import { PaginationState, PaginationEntityState, PaginationEntityTypeState } from '../reducers/pagination.reducer';



export const CLEAR_PAGINATION = '[Pagination] Clear entity';
export const SET_PAGE = '[Pagination] Set Page';
export const SET_PARAMS = '[Pagination] Set Params';

export class ClearPaginationOfType implements Action {
  constructor(public entityKey: string) {
  }
  type = CLEAR_PAGINATION;
}

export class SetPage implements Action {
  constructor(
    public entityKey: string,
    public paginationKey: string,
    public pageNumber: number
  ) {
  }
  type = SET_PAGE;
}

export class SetParams implements Action {
  constructor(
    public entityKey: string,
    public paginationKey: string,
    public params: {
      [key: string]: string | number
    }
  ) {
  }
  type = SET_PARAMS;
}

export function selectPaginationState(entityKey: string, paginationKey: string) {
  return compose(
    getPaginationKeyState(paginationKey),
    getPaginationEntityState(entityKey),
    getPaginationState
  );
}

export function getPaginationKeyState(paginationKey: string) {
  return (state: PaginationEntityTypeState) => {
    return state[paginationKey];
  };
}

export function getPaginationEntityState(entityKey: string) {
  return (state: PaginationState) => {
    return state[entityKey] || {};
  };
}

export function getPaginationState(state: AppState) {
  return state.pagination;
}

