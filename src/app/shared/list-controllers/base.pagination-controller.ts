import { PaginationEntityState } from '../../store/types/pagination.types';
import { Observable } from 'rxjs/Observable';
import { PageEvent, SortDirection } from '@angular/material';

import { ListPagination, ListSort, ListFilter } from './../../store/actions/list.actions';
import { Store } from '@ngrx/store';
import { AppState } from '../../store/app-state';
import { IListDataSource } from '../data-sources/list-data-source-types';
import { map, filter } from 'rxjs/operators';
import { AddParams, SetClientPage, SetClientPageSize, SetPage } from '../../store/actions/pagination.actions';

export class PaginationController<T> implements IPaginationController<T> {
  constructor(
    private store: Store<AppState>,
    public dataSource: IListDataSource<T>
  ) {

    this.pagination$ = this.dataSource.pagination$
      .map(pag => {
        const pageSize = (dataSource.isLocal ? pag.clientPagination.pageSize : pag.params['results-per-page']) || 2;
        const pageIndex = (dataSource.isLocal ? pag.clientPagination.currentPage : pag.currentPage) || 2;
        return {
          totalResults: pag.totalResults,
          pageSize,
          pageIndex
        };
      });

    this.sort$ = this.dataSource.pagination$.map(pag => ({
      direction: pag.params['order-direction'] as SortDirection,
      field: pag.params['order-direction-field']
    })).filter(x => !!x).distinctUntilChanged((x, y) => {
      return x.direction === y.direction && x.field === y.field;
    });

    this.filter$ = this.dataSource.pagination$.pipe(
      map(pag => this.dataSource.getFilterFromParams(pag)),
      filter(x => !!x),
      map(filterString => ({
        filter: filterString
      }))
    );

  }
  pagination$: Observable<ListPagination>;
  sort$: Observable<ListSort>;
  filter$: Observable<ListFilter>;
  page(pageEvent: PageEvent) {
    if (this.dataSource.isLocal) {
      this.store.dispatch(new SetClientPage(
        this.dataSource.entityKey, this.dataSource.paginationKey, pageEvent.pageIndex + 1
      ));
    } else {
      this.store.dispatch(new SetPage(
        this.dataSource.entityKey, this.dataSource.paginationKey, pageEvent.pageIndex + 1
      ));
    }
  }
  sort = (listSort: ListSort) => {
    this.store.dispatch(new AddParams(this.dataSource.entityKey, this.dataSource.paginationKey, {
      ['order-direction-field']: listSort.field,
      ['order-direction']: listSort.direction
    }, this.dataSource.isLocal));
  }
  filter = filterString => {
    this.dataSource.setFilterParam({
      filter: filterString
    });
    // TODO: RC REMOVE THESE EVERYWHERE
    // this.store.dispatch(new SetListFilterAction(
    //   this.config.listStateKey,
    //   {
    //     filter: filterString
    //   }
    // ));
  }
}

export interface IPaginationController<T> {
  pagination$: Observable<ListPagination>;
  filter: (filterString: string) => void;
  filter$: Observable<ListFilter>;
  sort: (listSort: ListSort) => void;
  sort$: Observable<ListSort>;
  page: (pageEvent: PageEvent) => void;
  dataSource: IListDataSource<T>;
}
