import { PaginationEntityState } from '../../store/types/pagination.types';
import { Observable } from 'rxjs/Observable';
import { PageEvent, SortDirection } from '@angular/material';

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
  filter: (filterString: string) => void;
  filter$: Observable<ListFilter>;
  sort: (listSort: ListSort) => void;
  sort$: Observable<ListSort>;
  page: (pageEvent: PageEvent) => void;
  dataSource: IListDataSource<T>;
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
    if (this.dataSource.isLocal) {
      this.store.dispatch(new SetClientFilter(
        this.dataSource.entityKey,
        this.dataSource.paginationKey,
        filterString
      ));
    } else {
      this.dataSource.setFilterParam({
        filter: filterString
      });
    }
  }
  private createPaginationObservable(dataSource: IListDataSource<T>): Observable<ListPagination> {
    return dataSource.pagination$
      .filter(pag => !!pag)
      .map(pag => {
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
