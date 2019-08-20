import { HttpRequest } from '@angular/common/http';
import { RequestOptions } from '@angular/http';
import { Action } from '@ngrx/store';

import { EntityCatalogueEntityConfig } from '../../../core/src/core/entity-catalogue/entity-catalogue.types';
import { ListActionState } from '../reducers/api-request-reducer/types';
import { EntityRequestAction } from './request.types';



export interface PaginationParam {
  [entityKey: string]: string | string[] | number;
}
// metricConfig?: MetricQueryConfig

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

export class PaginationEntityState {
  /**
   * For multi action lists, this is used to force a particular entity type.
   */
  forcedLocalPage?: number;
  currentPage = 0;
  totalResults = 0;
  pageCount = 0;
  ids = {};
  params: PaginationParam;
  pageRequests: {
    [pageNumber: string]: ListActionState
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
}

export function isPaginatedAction(obj: any): PaginatedAction {
  return obj && Object.keys(obj).indexOf('paginationKey') >= 0 ? obj as PaginatedAction : null;
}

export interface BasePaginatedAction extends Action {
  entityType: string;
  endpointType: string;
  paginationKey: string;
}

export interface PaginatedAction extends BasePaginatedAction, EntityRequestAction {
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
  options?: RequestOptions | HttpRequest<any>;
  skipValidation?: boolean;
  // Internal, used for local multi action lists
  __forcedPageNumber__?: number;
  __forcedPageEntityConfig__?: EntityCatalogueEntityConfig;
}

export interface PaginationEntityTypeState {
  [paginationKey: string]: PaginationEntityState;
}

export interface PaginationState {
  [entityKey: string]: PaginationEntityTypeState;
}
