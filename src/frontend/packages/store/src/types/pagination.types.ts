import { HttpRequest } from '@angular/common/http';
import type { Action } from '@ngrx/store';

import { BasePipelineRequestAction } from '../entity-catalog/action-orchestrator/action-orchestrator';
import type { EntityCatalogEntityConfig } from '../entity-catalog/entity-catalog.types';
import type { ListActionState } from './entity-pipeline.types';
import type { EntityRequestAction } from './request.types';


export interface PaginationParam {
  [entityKey: string]: string | string[] | number;
}

export interface PaginationClientFilter {
  string: string;
  items: {
    [key: string]: any;
  };
  filterKey?: string;
}

export interface PaginationClientPagination {
  pageSize: number;
  currentPage: number;
  filter: PaginationClientFilter;
  totalResults: number;
}

export interface PaginationMaxedState {
  /**
   * Is the pagination in maxed mode?
   * - flattenPagination and flattenPaginationMax is true
   * - Initial fetch of entities brought back a total above the allowed IStratosBaseEntityDefinition paginationConfig maxedStateStartAt
   *   value
   * - Pagination notionally now changes from local (has all entities & filtering locally) to non-local (has a single page &
   *   filtering remotely)
   */
  isMaxedMode?: boolean;
  /**
   * Disregard flattenPaginationMax and ignore isMaxedMode true
   */
  ignoreMaxed?: boolean;
}


export class PaginationEntityState {
  /**
   * For multi action lists, this is used to force a particular entity type. For instance in the service instance wall selecting the option
   * to only show user provided service instances
   */
  forcedLocalPage?: number;
  currentPage = 0;
  totalResults = 0;
  pageCount = 0;
  ids: Record<number, string[]> = {};
  params!: PaginationParam;
  pageRequests: {
    [pageNumber: string]: ListActionState,
  } = {};
  clientPagination?: PaginationClientPagination;
  /**
   * The pagination key from where we share our values.
   */
  seed?: string;
  maxedState: PaginationMaxedState = { isMaxedMode: false };
  isListPagination = false;
}

export function isPaginatedAction(obj: any): PaginatedAction {
  return obj && Object.keys(obj).indexOf('paginationKey') >= 0 && Object.keys(obj).indexOf('type') >= 0 ? obj as PaginatedAction : null;
}

export interface BasePaginatedAction extends BasePipelineRequestAction, Action {
  paginationKey: string;
}

export interface PaginatedAction extends BasePaginatedAction, EntityRequestAction {
  actions?: string[];
  /*
   * Fetch all pages and add them to a single page
   */
  flattenPagination?: boolean;
  /*
   * When fetching all pages, abort if they exceed the maximum allowed. See IStratosBaseEntityDefinition paginationConfig maxedStateStartAt
   */
  flattenPaginationMax?: boolean;
  initialParams?: PaginationParam;
  pageNumber?: number;
  options?: HttpRequest<any>;
  skipValidation?: boolean;
  // Internal, used for local multi action lists
  __forcedPageNumber__?: number;
  __forcedPageEntityConfig__?: EntityCatalogEntityConfig;
  isList?: boolean;
}

export interface PaginationEntityTypeState {
  [paginationKey: string]: PaginationEntityState;
}

export interface PaginationState {
  [entityKey: string]: PaginationEntityTypeState;
}

// --- Relocated from the deleted pagination-reducer/pagination-reducer-reset-pagination.ts ---
// Still consumed by the test helper (default pagination entity state seed).

export const defaultClientPaginationPageSize = 6;

const defaultPaginationEntityState: PaginationEntityState = {
  pageCount: 0,
  currentPage: 1,
  totalResults: 0,
  ids: {},
  pageRequests: {
  },
  params: {
  },
  clientPagination: {
    pageSize: defaultClientPaginationPageSize,
    currentPage: 1,
    filter: {
      string: '',
      items: {}
    },
    totalResults: 0
  },
  maxedState: {
    isMaxedMode: false
  },
  isListPagination: false
};

export function getDefaultPaginationEntityState(ignoreMaxed?: boolean): PaginationEntityState {
  return {
    ...defaultPaginationEntityState,
    maxedState: {
      ...defaultPaginationEntityState.maxedState,
      ignoreMaxed
    }
  };
}
