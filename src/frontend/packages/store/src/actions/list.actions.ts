import { SortDirection } from '@angular/material/sort';
import { Action } from '@ngrx/store';

import { ListsState } from '../reducers/list.reducer';
import { defaultClientPaginationPageSize } from '../reducers/pagination-reducer/pagination-reducer-reset-pagination';


export class ListPagination {
  public totalResults = 0;
  public pageSize = defaultClientPaginationPageSize;
  public pageIndex = 0;
}

export class ListSort {
  field: string;
  direction: SortDirection;
}

export class ListFilter {
  string: string;
  items: {
    [key: string]: any;
  };
  filterKey?: string;
}

export const ListStateActionTypes = {
  SET: '[List] Set',
  SET_VIEW: '[List] Set View',
  HYDRATE: '[List] Hydrate'
};

export type ListView = 'table' | 'cards';

export class SetListStateAction implements Action {
  constructor(public key: string, public view: ListView) { }
  type = ListStateActionTypes.SET;
}

export class SetListViewAction implements Action {
  constructor(public key: string, public view: ListView) { }
  type = ListStateActionTypes.SET_VIEW;
}


export class HydrateListsStateAction implements Action {
  constructor(public listsState: ListsState) { }
  type = ListStateActionTypes.HYDRATE;
}