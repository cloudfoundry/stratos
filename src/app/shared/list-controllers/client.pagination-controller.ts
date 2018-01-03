import { PageEvent } from '@angular/material';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Rx';

import { ListPagination, ListSort } from '../../store/actions/list.actions';
import { AppState } from '../../store/app-state';
import { SetListFilterAction } from './../../store/actions/list.actions';
import { IPaginationController, PaginationControllerConfig } from './base.pagination-controller';

export class ClientPagination implements IPaginationController {
  constructor(
    private store: Store<AppState>,
    public config: PaginationControllerConfig
  ) {
    this.pagination$ = config.pagination$;
  }
  page: (pageEvent: PageEvent) => void;
  pagination$: Observable<ListPagination>;
  sort = (listSort: ListSort) => {
    console.log('sorting');
  }
  filter = filterString => {
    this.store.dispatch(new SetListFilterAction(
      this.config.listStateKey,
      {
        filter: filterString
      }
    ));
  }
}
