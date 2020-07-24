import { Action } from '@ngrx/store';

import { EntityCatalogEntityConfig, extractEntityCatalogEntityConfig } from '../entity-catalog/entity-catalog.types';
import { PaginationClientFilter, PaginationParam } from '../types/pagination.types';

export const CLEAR_PAGINATION_OF_TYPE = '[Pagination] Clear all pages of type';
export const CLEAR_PAGINATION_OF_ENTITY = '[Pagination] Clear pagination of entity';
export const RESET_PAGINATION = '[Pagination] Reset pagination';
export const RESET_PAGINATION_OF_TYPE = '[Pagination] Reset pagination of type';
export const CREATE_PAGINATION = '[Pagination] Create pagination';
export const CLEAR_PAGES = '[Pagination] Clear pages only';
export const SET_PAGE = '[Pagination] Set page';
export const SET_RESULT_COUNT = '[Pagination] Set result count';
export const SET_CLIENT_PAGE_SIZE = '[Pagination] Set client page size';
export const SET_CLIENT_PAGE = '[Pagination] Set client page';
export const SET_CLIENT_FILTER = '[Pagination] Set client filter';
export const SET_CLIENT_FILTER_KEY = '[Pagination] Set client filter key';
export const SET_PARAMS = '[Pagination] Set Params';
export const SET_INITIAL_PARAMS = '[Pagination] Set initial params';
export const ADD_PARAMS = '[Pagination] Add Params';
export const REMOVE_PARAMS = '[Pagination] Remove Params';
export const SET_PAGE_BUSY = '[Pagination] Set Page Busy';
export const REMOVE_ID_FROM_PAGINATION = '[Pagination] Remove id from pagination';
export const UPDATE_MAXED_STATE = '[Pagination] Update maxed state';
export const IGNORE_MAXED_STATE = '[Pagination] Ignore maxed state';

export function getPaginationKey(type: string, id: string, endpointGuid?: string) {
  const key = `${type}-${id}`;
  return endpointGuid ? `${endpointGuid}:${key}` : key;
}

abstract class BasePaginationAction {
  public entityConfig: EntityCatalogEntityConfig;

  constructor(pEntityConfig: Partial<EntityCatalogEntityConfig>) {
    this.entityConfig = extractEntityCatalogEntityConfig(pEntityConfig);
  }
}

export class ClearPaginationOfType extends BasePaginationAction implements Action {
  constructor(pEntityConfig: Partial<EntityCatalogEntityConfig>) {
    super(pEntityConfig);
  }
  type = CLEAR_PAGINATION_OF_TYPE;
}

export class ClearPaginationOfEntity extends BasePaginationAction implements Action {
  constructor(pEntityConfig: Partial<EntityCatalogEntityConfig>, public entityGuid: string, public paginationKey?: string) {
    super(pEntityConfig);
  }
  type = CLEAR_PAGINATION_OF_ENTITY;
}

export class ResetPagination extends BasePaginationAction implements Action {
  constructor(pEntityConfig: Partial<EntityCatalogEntityConfig>, public paginationKey: string) {
    super(pEntityConfig);
  }
  type = RESET_PAGINATION;
}

export class ResetPaginationOfType extends BasePaginationAction implements Action {
  constructor(pEntityConfig: Partial<EntityCatalogEntityConfig>) {
    super(pEntityConfig);
  }
  type = RESET_PAGINATION_OF_TYPE;
}

export class CreatePagination extends BasePaginationAction implements Action {
  /**
   * @param seed The pagination key for the section we should use as a seed when creating the new pagination section.
   */
  constructor(pEntityConfig: Partial<EntityCatalogEntityConfig>, public paginationKey: string, public seed?: string) {
    super(pEntityConfig);
  }
  type = CREATE_PAGINATION;
}


export class ClearPages extends BasePaginationAction implements Action {
  constructor(pEntityConfig: Partial<EntityCatalogEntityConfig>, public paginationKey: string) {
    super(pEntityConfig);
  }
  type = CLEAR_PAGES;
}

export class SetPage extends BasePaginationAction implements Action {
  constructor(
    pEntityConfig: Partial<EntityCatalogEntityConfig>,
    public paginationKey: string,
    public pageNumber: number,
    public keepPages = false,
    public forceLocalPage = false
  ) {
    super(pEntityConfig);
    if (forceLocalPage) {
      keepPages = true;
    }
  }
  type = SET_PAGE;
}

export class SetResultCount extends BasePaginationAction implements Action {
  constructor(
    pEntityConfig: Partial<EntityCatalogEntityConfig>,
    public paginationKey: string,
    public count: number
  ) {
    super(pEntityConfig);
  }
  type = SET_RESULT_COUNT;
}

export class SetClientPageSize extends BasePaginationAction implements Action {
  constructor(
    pEntityConfig: Partial<EntityCatalogEntityConfig>,
    public paginationKey: string,
    public pageSize: number,
  ) {
    super(pEntityConfig);
  }
  type = SET_CLIENT_PAGE_SIZE;
}

export class SetClientPage extends BasePaginationAction implements Action {
  constructor(
    pEntityConfig: Partial<EntityCatalogEntityConfig>,
    public paginationKey: string,
    public pageNumber: number,
  ) {
    super(pEntityConfig);
  }
  type = SET_CLIENT_PAGE;
}

export class SetClientFilter extends BasePaginationAction implements Action {
  constructor(
    pEntityConfig: Partial<EntityCatalogEntityConfig>,
    public paginationKey: string,
    public filter: PaginationClientFilter,
  ) {
    super(pEntityConfig);
  }
  type = SET_CLIENT_FILTER;
}

export class SetClientFilterKey extends BasePaginationAction implements Action {
  constructor(
    pEntityConfig: Partial<EntityCatalogEntityConfig>,
    public paginationKey: string,
    public filterKey: string,
  ) {
    super(pEntityConfig);
  }
  type = SET_CLIENT_FILTER_KEY;
}

export class SetParams extends BasePaginationAction implements Action {
  constructor(
    pEntityConfig: Partial<EntityCatalogEntityConfig>,
    public paginationKey: string,
    public params: PaginationParam,
    public keepPages = false,
    public overwrite = false,
  ) {
    super(pEntityConfig);
  }
  type = SET_PARAMS;
}

export class SetInitialParams extends BasePaginationAction implements Action, SetParams {
  constructor(
    pEntityConfig: Partial<EntityCatalogEntityConfig>,
    public paginationKey: string,
    public params: PaginationParam,
    public keepPages = false,
    public overwrite = false,
  ) {
    super(pEntityConfig);
  }
  type = SET_INITIAL_PARAMS;
}

export class AddParams extends BasePaginationAction implements Action {
  constructor(
    pEntityConfig: Partial<EntityCatalogEntityConfig>,
    public paginationKey: string,
    public params: PaginationParam,
    public keepPages = false
  ) {
    super(pEntityConfig);
  }
  type = ADD_PARAMS;
}

export class RemoveParams extends BasePaginationAction implements Action {
  constructor(
    pEntityConfig: Partial<EntityCatalogEntityConfig>,
    public paginationKey: string,
    public params: string[],
    public qs: string[],
    public keepPages = false
  ) {
    super(pEntityConfig);
  }
  type = REMOVE_PARAMS;
}

export class UpdatePaginationMaxedState implements Action, EntityCatalogEntityConfig {
  type = UPDATE_MAXED_STATE;
  constructor(
    public max: number,
    public allEntities: number,
    public entityType: string,
    public endpointType: string,
    public paginationKey: string,
    public forcedEntityKey?: string
  ) { }
}

export class IgnorePaginationMaxedState implements Action, EntityCatalogEntityConfig {
  type = IGNORE_MAXED_STATE;
  constructor(
    public entityType: string,
    public endpointType: string,
    public paginationKey: string,
    public forcedEntityKey?: string
  ) { }
}
