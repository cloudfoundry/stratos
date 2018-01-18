import { PaginationEntityState } from '../../store/types/pagination.types';
import { Observable } from 'rxjs/Observable';
import { SortDirection } from '@angular/material';

import { ListPagination, ListSort, ListFilter } from './../../store/actions/list.actions';
import { Store } from '@ngrx/store';
import { AppState } from '../../store/app-state';
import { IListDataSource } from '../data-sources/list-data-source-types';
import { map, filter } from 'rxjs/operators';
import {
  AddParams,
  SetClientFilter,
  SetClientPage,
  SetClientPageSize,
  SetPage,
} from '../../store/actions/pagination.actions';
import { defaultClientPaginationPageSize } from '../../store/reducers/pagination-reducer/pagination.reducer';

export interface IListPaginationController<T> {
  pagination$: Observable<ListPagination>;
  filterByString: (filterString: string) => void;
  filter$: Observable<ListFilter>;
  sort: (listSort: ListSort) => void;
  sort$: Observable<ListSort>;
  page: (pageIndex: number) => void;
  pageSize: (pageSize: number) => void;
  dataSource: IListDataSource<T>;
}

export class ListPaginationController<T> implements IListPaginationController<T> {
  private pag: PaginationEntityState;
  constructor(
    private store: Store<AppState>,
    public dataSource: IListDataSource<T>
  ) {

    this.pagination$ = this.createPaginationObservable(dataSource);

    this.sort$ = this.createSortObservable(dataSource);

    this.filter$ = this.createFilterObservable(dataSource);

  }
  pagination$: Observable<ListPagination>;
  sort$: Observable<ListSort>;
  filter$: Observable<ListFilter>;
  page(pageIndex: number) {
    const page = pageIndex + 1;
    if (this.dataSource.isLocal) {
      // if (this.pag.clientPagination.currentPage !== page) {
      this.store.dispatch(new SetClientPage(
        this.dataSource.entityKey, this.dataSource.paginationKey, page
      ));
      // }
    } else if (this.pag.currentPage !== page) {
      this.store.dispatch(new SetPage(
        this.dataSource.entityKey, this.dataSource.paginationKey, page
      ));
    }
  }
  pageSize(pageSize: number) {
    if (this.dataSource.isLocal) {
      if (this.pag.clientPagination.pageSize !== pageSize) {
        this.store.dispatch(new SetClientPageSize(
          this.dataSource.entityKey, this.dataSource.paginationKey, pageSize
        ));
      }
    } else if (this.pag.params['results-per-page'] !== pageSize) {
      this.store.dispatch(new AddParams(this.dataSource.entityKey, this.dataSource.paginationKey, {
        ['results-per-page']: pageSize,
      }, this.dataSource.isLocal));
    }
  }
  sort = (listSort: ListSort) => {
    if (this.pag.params['order-direction-field'] !== listSort.field || this.pag.params['order-direction'] !== listSort.direction) {
      this.store.dispatch(new AddParams(this.dataSource.entityKey, this.dataSource.paginationKey, {
        ['order-direction-field']: listSort.field,
        ['order-direction']: listSort.direction
      }, this.dataSource.isLocal));
    }
  }
  filterByString = filterString => {
    if (this.dataSource.isLocal) {
      if (this.pag.clientPagination.filter !== filterString) {
        this.store.dispatch(new SetClientFilter(
          this.dataSource.entityKey,
          this.dataSource.paginationKey,
          filterString
        ));
      }
    } else if (this.dataSource.getFilterFromParams(this.pag) !== filterString) {
      this.dataSource.setFilterParam({
        filter: filterString
      }, this.pag);
    }
  }
  private createPaginationObservable(dataSource: IListDataSource<T>): Observable<ListPagination> {
    return dataSource.pagination$
      .filter(pag => !!pag)
      .map(pag => {
        this.pag = pag;
        const pageSize = (dataSource.isLocal ? pag.clientPagination.pageSize : pag.params['results-per-page'])
          || defaultClientPaginationPageSize;
        const pageIndex = (dataSource.isLocal ? pag.clientPagination.currentPage : pag.currentPage) || 1;
        // const totalResults = (dataSource.isLocal ? pag.clientPagination.totalResults : pag.totalResults) || 0;
        return {
          totalResults: pag.totalResults,
          pageSize,
          pageIndex
        };
      });
  }

  private createSortObservable(dataSource: IListDataSource<T>): Observable<ListSort> {
    return dataSource.pagination$.map(pag => ({
      direction: pag.params['order-direction'] as SortDirection,
      field: pag.params['order-direction-field']
    })).filter(x => !!x).distinctUntilChanged((x, y) => {
      return x.direction === y.direction && x.field === y.field;
    });
  }

  private createFilterObservable(dataSource: IListDataSource<T>): Observable<ListFilter> {
    return dataSource.pagination$.pipe(
      map(pag => dataSource.isLocal ?
        pag.clientPagination.filter :
        dataSource.getFilterFromParams(pag)
      ),
      filter(x => !!x),
      map(filterString => ({
        filter: filterString
      }))
    );
  }
}
