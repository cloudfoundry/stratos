import { SortDirection } from '@angular/material';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, first, map, distinctUntilChanged } from 'rxjs/operators';

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
import { tag } from 'rxjs-spy/operators';

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

function onPaginationEntityState(
  paginationEntityState$: Observable<PaginationEntityState>,
  func: (paginationEntityState: PaginationEntityState) => void) {
  paginationEntityState$.pipe(
    first()
  ).subscribe(func);
}

export class ListPaginationController<T> implements IListPaginationController<T> {
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
    } else {
      onPaginationEntityState(this.dataSource.pagination$, (paginationEntityState) => {
        if (paginationEntityState.currentPage !== page) {
          this.store.dispatch(new SetPage(
            this.dataSource.entityKey, this.dataSource.paginationKey, page
          ));
        }
      });
    }
  }
  pageSize(pageSize: number) {
    onPaginationEntityState(this.dataSource.pagination$, (paginationEntityState) => {
      if (this.dataSource.isLocal) {
        if (paginationEntityState.clientPagination.pageSize !== pageSize) {
          this.store.dispatch(new SetClientPageSize(
            this.dataSource.entityKey, this.dataSource.paginationKey, pageSize
          ));
        }
      } else if (paginationEntityState.params['results-per-page'] !== pageSize) {
        this.store.dispatch(new AddParams(this.dataSource.entityKey, this.dataSource.paginationKey, {
          ['results-per-page']: pageSize,
        }, this.dataSource.isLocal));
      }
    });
  }
  sort = (listSort: ListSort) => {
    onPaginationEntityState(this.dataSource.pagination$, (paginationEntityState) => {
      if (
        paginationEntityState.params['order-direction-field'] !== listSort.field ||
        paginationEntityState.params['order-direction'] !== listSort.direction
      ) {
        this.store.dispatch(new AddParams(this.dataSource.entityKey, this.dataSource.paginationKey, {
          ['order-direction-field']: listSort.field,
          ['order-direction']: listSort.direction
        }, this.dataSource.isLocal));
      }
    });
  }
  filterByString = filterString => {
    onPaginationEntityState(this.dataSource.pagination$, (paginationEntityState) => {
      if (this.dataSource.isLocal) {
        if (paginationEntityState.clientPagination.filter.string !== filterString) {
          const newFilter = this.cloneMultiFilter(paginationEntityState.clientPagination.filter);
          newFilter.string = filterString;
          this.store.dispatch(new SetClientFilter(
            this.dataSource.entityKey,
            this.dataSource.paginationKey,
            newFilter
          ));
        }
      } else if (this.dataSource.getFilterFromParams(paginationEntityState) !== filterString) {
        this.dataSource.setFilterParam(filterString, paginationEntityState);
      }
    });
  }
  multiFilter = (filterConfig: IListMultiFilterConfig, filterValue: string) => {
    onPaginationEntityState(this.dataSource.pagination$, (paginationEntityState) => {
      if (this.dataSource.isLocal && paginationEntityState) {
        // We don't want to dispatch  actions if it's a no op (values are not different, falsies are treated as the same). This avoids other
        // chained actions from firing.
        const storeFilterParamValue = this.cleanFilterParam(paginationEntityState.clientPagination.filter.items[filterConfig.key]);
        const newFilterParamValue = this.cleanFilterParam(filterValue);
        if (storeFilterParamValue !== newFilterParamValue) {
          const newFilter = this.cloneMultiFilter(paginationEntityState.clientPagination.filter);
          newFilter.items[filterConfig.key] = filterValue;
          this.store.dispatch(new SetClientFilter(
            this.dataSource.entityKey,
            this.dataSource.paginationKey,
            newFilter
          ));
        }
      }
    });
  }

  private cloneMultiFilter(paginationClientFilter: PaginationClientFilter) {
    return {
      ...paginationClientFilter,
      items: { ...paginationClientFilter.items }
    };
  }
  private createPaginationObservable(dataSource: IListDataSource<T>): Observable<ListPagination> {
    return dataSource.pagination$.pipe(
      filter(pag => !!pag),
      map(pag => {
        const pageSize = (dataSource.isLocal ? pag.clientPagination.pageSize : pag.params['results-per-page'])
          || defaultClientPaginationPageSize;
        const pageIndex = (dataSource.isLocal ? pag.clientPagination.currentPage : pag.currentPage) || 1;
        // const totalResults = (dataSource.isLocal ? pag.clientPagination.totalResults : pag.totalResults) || 0;
        return {
          totalResults: pag.totalResults,
          pageSize,
          pageIndex
        };
      }),
      distinctUntilChanged((x, y) => {
        return x.pageIndex === y.pageIndex && x.pageSize === y.pageSize && x.totalResults === y.totalResults;
      }),
      tag('list-pagination')
    );
  }

  private createSortObservable(dataSource: IListDataSource<T>): Observable<ListSort> {
    return dataSource.pagination$.pipe(
      map(pag => ({
        direction: pag.params['order-direction'] as SortDirection,
        field: pag.params['order-direction-field']
      })),
      filter(x => !!x),
      distinctUntilChanged((x, y) => {
        return x.direction === y.direction && x.field === y.field;
      }),
      tag('list-sort')
    );
  }

  private createFilterObservable(dataSource: IListDataSource<T>): Observable<ListFilter> {
    return dataSource.pagination$.pipe(
      map(pag => ({
        string: dataSource.isLocal ? pag.clientPagination.filter.string : dataSource.getFilterFromParams(pag),
        items: { ...pag.clientPagination.filter.items }
      })),
      tag('list-filter')
    );
  }

  private cleanFilterParam(filterVal) {
    // Flatten some specific falsies into the same value.
    if (filterVal === null || filterVal === undefined || filterVal === '') {
      return undefined;
    }
    return filterVal;
  }
}
