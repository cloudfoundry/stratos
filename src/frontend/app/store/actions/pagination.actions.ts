import { Action } from '@ngrx/store';

import { PaginationClientFilter, PaginationParam, BasePaginatedAction } from '../types/pagination.types';

export const CLEAR_PAGINATION_OF_TYPE = '[Pagination] Clear all pages of type';
export const CLEAR_PAGINATION_OF_ENTITY = '[Pagination] Clear pagination of entity';
export const RESET_PAGINATION = '[Pagination] Reset pagination';
export const CREATE_PAGINATION = '[Pagination] Create pagination';
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
export const SET_PAGE_BUSY = '[Pagination] Set Page Busy';
export const SET_PAGINATION_MAX_REACHED = '[Pagination] Set max response reached';

export function getPaginationKey(type: string, id: string, endpointGuid?: string) {
  const key = `${type}-${id}`;
  return endpointGuid ? `${endpointGuid}:${key}` : key;
}

export class ClearPaginationOfType implements Action {
  constructor(public entityKey: string) {
  }
  type = CLEAR_PAGINATION_OF_TYPE;
}

export class ClearPaginationOfEntity implements Action {
  constructor(public entityKey: string, public entityGuid, public paginationKey?: string) {
  }
  type = CLEAR_PAGINATION_OF_ENTITY;
}

export class ResetPagination implements BasePaginatedAction {
  constructor(public entityKey: string, public paginationKey: string) {
  }
  type = RESET_PAGINATION;
}

export class CreatePagination implements BasePaginatedAction {
  /**
   * @param entityKey
   * @param paginationKey
   * @param seed The pagination key for the section we should use as a seed when creating the new pagination section.
   */
  constructor(public entityKey: string, public paginationKey: string, public seed?: string) {
  }
  type = CREATE_PAGINATION;
}


export class ClearPages implements BasePaginatedAction {
  constructor(public entityKey: string, public paginationKey: string) {
  }
  type = CLEAR_PAGES;
}

export class SetPage implements BasePaginatedAction {
  constructor(
    public entityKey: string,
    public paginationKey: string,
    public pageNumber: number,
    public keepPages = false
  ) {
  }
  type = SET_PAGE;
}

export class SetResultCount implements BasePaginatedAction {
  constructor(
    public entityKey: string,
    public paginationKey: string,
    public count: number
  ) {
  }
  type = SET_RESULT_COUNT;
}

export class SetClientPageSize implements BasePaginatedAction {
  constructor(
    public entityKey: string,
    public paginationKey: string,
    public pageSize: number,
  ) {
  }
  type = SET_CLIENT_PAGE_SIZE;
}

export class SetClientPage implements BasePaginatedAction {
  constructor(
    public entityKey: string,
    public paginationKey: string,
    public pageNumber: number,
  ) {
  }
  type = SET_CLIENT_PAGE;
}

export class SetClientFilter implements BasePaginatedAction {
  constructor(
    public entityKey: string,
    public paginationKey: string,
    public filter: PaginationClientFilter,
  ) {
  }
  type = SET_CLIENT_FILTER;
}

export class SetParams implements BasePaginatedAction {
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

export class AddParams implements BasePaginatedAction {
  constructor(
    public entityKey: string,
    public paginationKey: string,
    public params: PaginationParam,
    public keepPages = false
  ) {
  }
  type = ADD_PARAMS;
}

export class RemoveParams implements BasePaginatedAction {
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

export class PaginationMaxedResults implements Action {
  type = SET_PAGINATION_MAX_REACHED;
  constructor(
    public maxReached: number,
    public entityKey: string,
    public paginationKey: string
  ) { }
}
