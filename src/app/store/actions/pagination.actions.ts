import { AppState } from '../app-state';
import { Action, compose } from '@ngrx/store';
import {
  PaginationAction,
  // PaginationEntityState,
  PaginationEntityTypeState,
  PaginationParam,
  PaginationState,
  PaginationClientFilter,
} from '../types/pagination.types';
import { ListFilter } from './list.actions';

export const CLEAR_PAGINATION_OF_TYPE = '[Pagination] Clear all pages of type';
export const CLEAR_PAGINATION_OF_ENTITY = '[Pagination] Clear pagination of entity';
export const RESET_PAGINATION = '[Pagination] Reset pagination';
export const CLEAR_PAGES = '[Pagination] Clear pages only';
export const SET_PAGE = '[Pagination] Set page';
export const SET_RESULT_COUNT = '[Pagination] Set result count';
export const SET_CLIENT_PAGE_SIZE = '[Pagination] Set client page size';
export const SET_CLIENT_PAGE = '[Pagination] Set client page';
export const SET_CLIENT_FILTER = '[Pagination] Set client filter';
export const SET_PARAMS = '[Pagination] Set Params';
export const SET_INITIAL_PARAMS = '[Pagination] Set initial params';
export const ADD_PARAMS = '[Pagination] Add Params';
export const REMOVE_PARAMS = '[Pagination] Remove Params';

export function getPaginationKey(entityKey, cnis, guid) {
  return `${entityKey}:${cnis}:${guid}`;
}

export class ClearPaginationOfType implements Action {
  constructor(public entityKey: string) {
  }
  type = CLEAR_PAGINATION_OF_TYPE;
}

export class ClearPaginationOfEntity implements Action {
  constructor(public entityKey: string, public entityGuid) {
  }
  type = CLEAR_PAGINATION_OF_ENTITY;
}

export class ResetPagination implements PaginationAction {
  constructor(public entityKey: string, public paginationKey: string) {
  }
  type = RESET_PAGINATION;
}

export class ClearPages implements PaginationAction {
  constructor(public entityKey: string, public paginationKey: string) {
  }
  type = CLEAR_PAGES;
}

export class SetPage implements PaginationAction {
  constructor(
    public entityKey: string,
    public paginationKey: string,
    public pageNumber: number,
    public keepPages = false
  ) {
  }
  type = SET_PAGE;
}

export class SetResultCount implements PaginationAction {
  constructor(
    public entityKey: string,
    public paginationKey: string,
    public count: number
  ) {
  }
  type = SET_RESULT_COUNT;
}

export class SetClientPageSize implements PaginationAction {
  constructor(
    public entityKey: string,
    public paginationKey: string,
    public pageSize: number,
  ) {
  }
  type = SET_CLIENT_PAGE_SIZE;
}

export class SetClientPage implements PaginationAction {
  constructor(
    public entityKey: string,
    public paginationKey: string,
    public pageNumber: number,
  ) {
  }
  type = SET_CLIENT_PAGE;
}

export class SetClientFilter implements PaginationAction {
  constructor(
    public entityKey: string,
    public paginationKey: string,
    public filter: PaginationClientFilter,
  ) {
  }
  type = SET_CLIENT_FILTER;
}

export class SetParams implements PaginationAction {
  constructor(
    public entityKey: string,
    public paginationKey: string,
    public params: PaginationParam,
    public keepPages = false,
    public overwrite = false,
  ) {
  }
  type = SET_PARAMS;
}

export class SetInitialParams implements SetParams {
  constructor(
    public entityKey: string,
    public paginationKey: string,
    public params: PaginationParam,
    public keepPages = false,
    public overwrite = false,
  ) {
  }
  type = SET_INITIAL_PARAMS;
}

export class AddParams implements PaginationAction {
  constructor(
    public entityKey: string,
    public paginationKey: string,
    public params: PaginationParam,
    public keepPages = false
  ) {
  }
  type = ADD_PARAMS;
}

export class RemoveParams implements PaginationAction {
  constructor(
    public entityKey: string,
    public paginationKey: string,
    public params: string[],
    public qs: string[],
    public keepPages = false
  ) {
  }
  type = REMOVE_PARAMS;
}
