import { NgZone } from '@angular/core';
import { Store } from '@ngrx/store';
import { asyncScheduler, BehaviorSubject, Observable } from 'rxjs';
import { tag } from 'rxjs-spy/operators';
import { bufferTime, distinctUntilChanged, filter, first, map, observeOn, tap } from 'rxjs/operators';

import { ListFilter, ListPagination, ListSort } from '../../../../../../store/src/actions/list.actions';
import {
  AddParams,
  SetClientFilter,
  SetClientPage,
  SetClientPageSize,
  SetPage,
} from '../../../../../../store/src/actions/pagination.actions';
import { GeneralAppState } from '../../../../../../store/src/app-state';
import {
  defaultClientPaginationPageSize,
} from '../../../../../../store/src/reducers/pagination-reducer/pagination-reducer-reset-pagination';
import { PaginationClientFilter, PaginationEntityState } from '../../../../../../store/src/types/pagination.types';
import { enterZone, leaveZone } from '../../../../leaveEnterAngularZone';
import { IListMultiFilterConfig } from '../list.component.types';
import { IListDataSource, ListPaginationMultiFilterChange } from './list-data-source-types';

export interface IListPaginationController<T> {
  pagination$: Observable<ListPagination>;
  filterByString: (filterString: string) => void;
  multiFilter: (filterConfig: IListMultiFilterConfig, filterValue: string) => void;
  multiFilterChanges$: Observable<any>;
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
    private store: Store<GeneralAppState>,
    public dataSource: IListDataSource<T>,
    private ngZone: NgZone
  ) {

    this.pagination$ = this.createPaginationObservable(dataSource);

    this.sort$ = this.dataSource.sort$;

    this.filter$ = this.dataSource.filter$;

    // Listen to changes to the multi filters and batch them up together. This avoids situations when there are multiple changes when one
    // filter resets other filters.
    this.multiFilterChanges$ = this.multiFilterStream.asObservable().pipe(
      filter(change => !!change),
      bufferTime(50, leaveZone(this.ngZone, asyncScheduler)),
      filter(changes => !!changes.length),
      observeOn(enterZone(this.ngZone, asyncScheduler)),
      tap(this.handleMultiFilter),
    );

  }
  pagination$: Observable<ListPagination>;
  sort$: Observable<ListSort>;
  filter$: Observable<ListFilter>;
  private multiFilterStream = new BehaviorSubject<ListPaginationMultiFilterChange>(null);
  multiFilterChanges$: Observable<any>;

  page(pageIndex: number) {
    const page = pageIndex + 1;
    if (this.dataSource.isLocal) {
      this.store.dispatch(new SetClientPage(
        this.dataSource, this.dataSource.paginationKey, page
      ));
    } else {
      onPaginationEntityState(this.dataSource.pagination$, (paginationEntityState) => {
        if (paginationEntityState.currentPage !== page) {
          this.store.dispatch(new SetPage(
            this.dataSource, this.dataSource.paginationKey, page
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
            this.dataSource, this.dataSource.paginationKey, pageSize
          ));
        }
      } else if (paginationEntityState.params['results-per-page'] !== pageSize) {
        this.store.dispatch(new AddParams(this.dataSource, this.dataSource.paginationKey, {
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
        this.store.dispatch(new AddParams(this.dataSource, this.dataSource.paginationKey, {
          ['order-direction-field']: listSort.field,
          ['order-direction']: listSort.direction
        }, this.dataSource.isLocal));
      }
    });
  };
  filterByString = filterString => {
    onPaginationEntityState(this.dataSource.pagination$, (paginationEntityState) => {
      if (this.dataSource.isLocal) {
        if (paginationEntityState.clientPagination.filter.string !== filterString) {
          const newFilter = this.cloneMultiFilter(paginationEntityState.clientPagination.filter);
          newFilter.string = filterString;
          this.store.dispatch(new SetClientFilter(
            this.dataSource,
            this.dataSource.paginationKey,
            newFilter
          ));
        }
      } else if (this.dataSource.getFilterFromParams(paginationEntityState) !== filterString) {
        this.dataSource.setFilterParam(filterString, paginationEntityState);
      }
    });
  };

  handleMultiFilter = (changes: ListPaginationMultiFilterChange[]) => {
    // console.log('handleMultiFilter: Before', changes); // TODO: RC remove
    onPaginationEntityState(this.dataSource.pagination$, (paginationEntityState) => {
      if (!paginationEntityState) {
        return;
      }

      // Changes may include multiple updates for the same key, so only use the very latest
      const uniqueChanges = [];
      for (let i = changes.length - 1; i >= 0; i--) {
        const change = changes[i];
        if (!uniqueChanges.find(e => e.key === change.key)) {
          uniqueChanges.push(change);
        }
      }
      // console.log('handleMultiFilter: Clean 1', uniqueChanges); // TODO: RC remove
      // We don't want to dispatch actions if it's a no op (values are not different, falsies are treated as the same). This avoids other
      // chained actions from firing.
      const cleanChanges = uniqueChanges.reduce((newCleanChanges, change) => {
        const storeFilterParamValue = valueOrCommonFalsy(paginationEntityState.clientPagination.filter.items[change.key]);
        const newFilterParamValue = valueOrCommonFalsy(change.value);
        if (storeFilterParamValue !== newFilterParamValue) {
          newCleanChanges[change.key] = change.value;
        }
        return newCleanChanges;
      }, {});
      // console.log('handleMultiFilter: Clean 2', cleanChanges); // TODO: RC remove

      if (Object.keys(cleanChanges).length > 0) {
        const currentFilter = paginationEntityState.clientPagination.filter;
        const newFilter = {
          ...currentFilter,
          items: {
            ...currentFilter.items,
            ...cleanChanges
          }
        };
        this.store.dispatch(new SetClientFilter(
          this.dataSource,
          this.dataSource.paginationKey,
          newFilter
        ));
      }

      if (paginationEntityState.maxedState.isMaxedMode && !paginationEntityState.maxedState.ignoreMaxed) {
        this.dataSource.setMultiFilter(changes, paginationEntityState.params);
      }

    });
  };

  multiFilter = (filterConfig: IListMultiFilterConfig, filterValue: string) => {
    if (!this.dataSource.isLocal) {
      return;
    }
    this.multiFilterStream.next({ key: filterConfig.key, value: filterValue });
  };

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
        const pageSize = (dataSource.isLocal ? pag.clientPagination.pageSize : pag.params['results-per-page'] as number)
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

}

export function valueOrCommonFalsy(value, commonFalsy?) {
  // Flatten some specific falsies into the same common value
  if (value === null || value === undefined || value === '') {
    return commonFalsy;
  }
  return value;
}
