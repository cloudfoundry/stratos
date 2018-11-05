import { SortDirection } from '@angular/material';
import { Action } from '@ngrx/store';

import { defaultClientPaginationPageSize } from '../reducers/pagination-reducer/pagination.reducer';

export class ListPagination {
  public totalResults ? = 0;
  public pageSize ? = defaultClientPaginationPageSize;
  public pageIndex ? = 0;
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
}

export const ListStateActionTypes = {
  SET: '[List] Set',
  SET_VIEW: '[List] Set View'
};

export type ListView = 'table' | 'cards';

export class SetListStateAction implements Action {
  constructor(public key: string, public view: ListView) {}
  type = ListStateActionTypes.SET;
}

export class SetListViewAction implements Action {
  constructor(public key: string, public view: ListView) {}
  type = ListStateActionTypes.SET_VIEW;
}
