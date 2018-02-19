import { SortDirection } from '@angular/material';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { filter, map } from 'rxjs/operators';

import { ListFilter, ListPagination, ListSort } from '../../../../store/actions/list.actions';
import {
  AddParams,
  SetClientFilter,
  SetClientPage,
  SetClientPageSize,
  SetPage,
} from '../../../../store/actions/pagination.actions';
import { AppState } from '../../../../store/app-state';
import { defaultClientPaginationPageSize } from '../../../../store/reducers/pagination-reducer/pagination.reducer';
import { PaginationClientFilter, PaginationEntityState } from '../../../../store/types/pagination.types';
import { IListMultiFilterConfig } from '../list.component.types';
import { IListDataSource } from './list-data-source-types';

export interface IListPaginationController<T> {
  pagination$: Observable<ListPagination>;
  filterByString: (filterString: string) => void;
  multiFilter: (filterConfig: IListMultiFilterConfig, filterValue: string) => void;
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
      this.store.dispatch(new SetClientPage(
        this.dataSource.entityKey, this.dataSource.paginationKey, page
      ));
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
      if (this.pag.clientPagination.filter.string !== filterString) {
        const newFilter = this.cloneMultiFilter(this.pag.clientPagination.filter);
        newFilter.string = filterString;
        this.store.dispatch(new SetClientFilter(
          this.dataSource.entityKey,
          this.dataSource.paginationKey,
          newFilter
        ));
      }
    } else if (this.dataSource.getFilterFromParams(this.pag) !== filterString) {
      this.dataSource.setFilterParam(filterString, this.pag);
    }
  }
  multiFilter = (filterConfig: IListMultiFilterConfig, filterValue: string) => {
    if (this.dataSource.isLocal && this.pag) {
      // We don't want to dispatch  actions if it's a no op (values are not different, falsies are treated as the same). This avoids other
      // chained actions from firing.
      const storeFilterParamValue = this.cleanFilterParam(this.pag.clientPagination.filter.items[filterConfig.key]);
      const newFilterParamValue = this.cleanFilterParam(filterValue);
      if (storeFilterParamValue !== newFilterParamValue) {
        const newFilter = this.cloneMultiFilter(this.pag.clientPagination.filter);
        newFilter.items[filterConfig.key] = filterValue;
        this.store.dispatch(new SetClientFilter(
          this.dataSource.entityKey,
          this.dataSource.paginationKey,
          newFilter
        ));
      }
    }
  }

  private cloneMultiFilter(filter: PaginationClientFilter) {
    return {
      ...filter,
      items: { ...filter.items }
    };
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
      })
      .distinctUntilChanged((x, y) => {
        return x.pageIndex === y.pageIndex && x.pageSize === y.pageSize && x.totalResults === y.totalResults;
      })
      .tag('list-pagination');
  }

  private createSortObservable(dataSource: IListDataSource<T>): Observable<ListSort> {
    return dataSource.pagination$.map(pag => ({
      direction: pag.params['order-direction'] as SortDirection,
      field: pag.params['order-direction-field']
    })).filter(x => !!x).distinctUntilChanged((x, y) => {
      return x.direction === y.direction && x.field === y.field;
    }).tag('list-sort');
  }

  private createFilterObservable(dataSource: IListDataSource<T>): Observable<ListFilter> {
    return dataSource.pagination$.pipe(
      map(pag => ({
        string: dataSource.isLocal ? pag.clientPagination.filter.string : dataSource.getFilterFromParams(pag),
        items: pag.clientPagination.filter.items
      }))
    ).tag('list-filter');
  }

  private cleanFilterParam(filter) {
    // Flatten some specific falsies into the same value.
    if (filter === null || filter === undefined || filter === '') {
      return undefined;
    }
    return filter;
  }
}
