import { RequestMethod } from '@angular/http';
import { Action } from '@ngrx/store';

import { ActionState } from '../reducers/api-request-reducer/types';
import { IRequestAction } from './request.types';

export class QParam {
  constructor(
    public key: string,
    public value: string | string[],
    public joiner: '>=' | '<=' | '<' | '>' | ' IN ' | ':' | '=' = ':'
  ) { }
}

export interface PaginationParam {
  q?: QParam[];
  [entityKey: string]: any;
}

export interface PaginationClientFilter {
  string: string;
  items: {
    [key: string]: any;
  };
}

export interface PaginationClientPagination {
  pageSize: number;
  currentPage: number;
  filter: PaginationClientFilter;
  totalResults: number;
}

export interface PaginationEntityState {
  currentPage: number;
  totalResults: number;
  pageCount: number;
  ids: { [id: string]: string[] };
  params: PaginationParam;
  pageRequests: {
    [pageNumber: string]: ActionState
  };
  clientPagination?: PaginationClientPagination;
  /**
   * The pagination key from where we share our values.
   */
  seed?: string;
  /**
   * Is the pagination state in maxed mode. This means the initial collection contained too many entities too handle, see PaginatedAction
   * flattenPagination & flattenPaginationMax
   */
  maxedMode?: boolean;
  /**
   * Does the collection size exceed the max allowed? Used in conjunction maxedMode.
   */
  currentlyMaxed?: boolean;
}

export interface BasePaginatedAction extends Action {
  entityKey: string;
  paginationKey: string;
}

export interface PaginatedAction extends BasePaginatedAction, IRequestAction {
  actions: string[];
  /*
   * Fetch all pages and add them to a single page
   */
  flattenPagination?: boolean;
  /*
   * The maximum number of entities to fetch. Note - Should be equal or higher than the page size
   */
  flattenPaginationMax?: number;
  initialParams?: PaginationParam;
  pageNumber?: number;
  options?: {
    params?: {
      paramsMap: any;
    },
    method?: RequestMethod | string | null
  };
  skipValidation?: boolean;
}

export interface PaginationEntityTypeState {
  [paginationKey: string]: PaginationEntityState;
}

export interface PaginationState {
  [entityKey: string]: PaginationEntityTypeState;
}
