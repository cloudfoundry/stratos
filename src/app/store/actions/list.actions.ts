import { Action } from '@ngrx/store';
import { SortDirection } from '@angular/material';

export class ListPagination {
  public totalResults?= 0;
  public pageSize?= 5;
  public pageIndex?= 0;
}

export class ListSort {
  field: string;
  direction: SortDirection;
}

export class ListFilter {
  filter: string;
}

export const ListStateActionTypes = {
  SET: '[List] Set',
  SET_VIEW: '[List] Set View',
  SET_PAGINATION: '[List] Set Pagination',
  SET_SORT: '[List] Set Sort',
  SET_FILTER: '[List] Set Filter',
};

export type ListView = 'table' | 'cards';

export class SetListStateAction implements Action {
  constructor(
    public key: string,
    public view: ListView,
    public pagination: ListPagination,
    public sort: ListSort,
    public filter: ListFilter
  ) {
  }
  type = ListStateActionTypes.SET;
}

export class SetListViewAction implements Action {
  constructor(
    public key: string,
    public view: ListView,
  ) {
  }
  type = ListStateActionTypes.SET_VIEW;
}

export class SetListPaginationAction implements Action {
  constructor(
    public key: string,
    public pagination: ListPagination,
  ) {
  }
  type = ListStateActionTypes.SET_PAGINATION;
}

export class SetListSortAction implements Action {
  constructor(
    public key: string,
    public sort: ListSort,
  ) {
  }
  type = ListStateActionTypes.SET_SORT;
}

export class SetListFilterAction implements Action {
  constructor(
    public key: string,
    public filter: ListFilter
  ) {
  }
  type = ListStateActionTypes.SET_FILTER;
}
