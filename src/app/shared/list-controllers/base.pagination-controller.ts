import { PaginationEntityState } from '../../store/types/pagination.types';
import { Observable } from 'rxjs/Observable';
import { PageEvent } from '@angular/material';

import { ListPagination, ListSort, ListFilter } from './../../store/actions/list.actions';
import { Store } from '@ngrx/store';
import { AppState } from '../../store/app-state';

export class PaginationControllerConfig {
  constructor(
    public listStateKey: string,
    public pagination$: Observable<PaginationEntityState>,
    public paginationKey: string,
    public entityKey: string,
    public getFilterFromParams: (pag: PaginationEntityState) => string,
    public setFilterParam: (store: Store<AppState>, entityKey: string, paginationKey: string, filter: ListFilter, isLocal: boolean) => void
  ) {
  }
}

export interface IPaginationController {
  pagination$: Observable<ListPagination>;
  filter: (filterString: string) => void;
  filter$: Observable<ListFilter>;
  sort: (listSort: ListSort) => void;
  sort$: Observable<ListSort>;
  page: (pageEvent: PageEvent) => void;
  config: PaginationControllerConfig;
}
