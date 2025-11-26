import { type NgZone, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  type ListFilter,
  type ListPagination,
  type ListSort,
  type GeneralAppState,
  defaultClientPaginationPageSize,
  AddParams,
  SetClientFilter,
  SetClientPage,
  SetClientPageSize,
  SetPage,
  type PaginationClientFilter,
  type PaginationEntityState,
} from '@stratosui/store';
import { asyncScheduler, BehaviorSubject, type Observable } from 'rxjs';
import { tag } from 'rxjs-spy/operators';
import { bufferTime, distinctUntilChanged, filter, first, map, observeOn, tap } from 'rxjs/operators';

import { enterZone, leaveZone } from '../../../../leaveEnterAngularZone';
import type { IListMultiFilterConfig } from '../list.component.types';
import type {IListDataSource} from './list-data-source-types';
import type {ListPaginationMultiFilterChange} from './list-data-source-types';

export interface IListPaginationController<T> {
  pagination$: Observable<ListPagination>;
  filterByString: (filterString: string) => void;
  multiFilter: (filterConfig: IListMultiFilterConfig, filterValue: string) => void;
  multiFilterChanges$: Observable<ListPaginationMultiFilterChange[]>;
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
  pagination$: Observable<ListPagination>;
  sort$: Observable<ListSort>;
  filter$: Observable<ListFilter>;
  private multiFilterStream = signal<ListPaginationMultiFilterChange>(null);
  private multiFilterSubject = new BehaviorSubject<ListPaginationMultiFilterChange>(null);

  // Define handleMultiFilter before multiFilterChanges$ to ensure proper initialization order
  handleMultiFilter = (changes: ListPaginationMultiFilterChange[]) => {
    onPaginationEntityState(this.dataSource.pagination$, (paginationEntityState) => {
      if (!paginationEntityState) {
        return;
      }

      // Changes may include multiple updates for the same key, so only use the very latest
      const uniqueChanges: ListPaginationMultiFilterChange[] = [];
      for (let i = changes.length - 1; i >= 0; i--) {
        const change = changes[i];
        if (!uniqueChanges.find(e => e.key === change.key)) {
          uniqueChanges.push(change);
        }
      }
      // We don't want to dispatch actions if it's a no op (values are not different, falsies are treated as the same). This avoids other
      // chained actions from firing.
      const cleanChanges = uniqueChanges.reduce((newCleanChanges: Record<string, string>, change: ListPaginationMultiFilterChange) => {
        const storeFilterParamValue = valueOrCommonFalsy(paginationEntityState.clientPagination.filter.items[change.key]);
        const newFilterParamValue = valueOrCommonFalsy(change.value);
        if (storeFilterParamValue !== newFilterParamValue) {
          newCleanChanges[change.key] = change.value;
        }
        return newCleanChanges;
      }, {});

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

  // Listen to changes to the multi filters and batch them up together. This avoids situations when there are multiple changes when one
  // filter resets other filters.
  multiFilterChanges$: Observable<ListPaginationMultiFilterChange[]>;

  constructor(
    private store: Store<GeneralAppState>,
    public dataSource: IListDataSource<T>,
    private ngZone: NgZone
  ) {
    // Initialize multiFilterChanges$ using BehaviorSubject to avoid injection context requirement
    this.multiFilterChanges$ = this.multiFilterSubject.asObservable().pipe(
      filter(change => !!change),
      bufferTime(50, leaveZone(this.ngZone, asyncScheduler)),
      filter(changes => !!changes.length),
      observeOn(enterZone(this.ngZone, asyncScheduler)),
      tap(this.handleMultiFilter),
    );

    this.pagination$ = this.createPaginationObservable(dataSource);

    this.sort$ = this.dataSource.sort$;

    this.filter$ = this.dataSource.filter$;

  }

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
      } else {
        const params = paginationEntityState.params as Record<string, unknown>;
        if (params['results-per-page'] !== pageSize) {
          this.store.dispatch(new AddParams(this.dataSource, this.dataSource.paginationKey, {
            "results-per-page": pageSize,
          }, this.dataSource.isLocal));
        }
      }
    });
  }
  sort = (listSort: ListSort) => {
    onPaginationEntityState(this.dataSource.pagination$, (paginationEntityState) => {
      const params = paginationEntityState.params as Record<string, unknown>;
      if (
        params['order-direction-field'] !== listSort.field ||
        params['order-direction'] !== listSort.direction
      ) {
        this.store.dispatch(new AddParams(this.dataSource, this.dataSource.paginationKey, {
          "order-direction-field": listSort.field,
          "order-direction": listSort.direction
        }, this.dataSource.isLocal));
      }
    });
  };
  filterByString = (filterString: string) => {
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

  multiFilter = (filterConfig: IListMultiFilterConfig, filterValue: string) => {
    if (!this.dataSource.isLocal) {
      return;
    }
    const change = { key: filterConfig.key, value: filterValue };
    this.multiFilterStream.set(change);
    this.multiFilterSubject.next(change);
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
        const params = pag.params as Record<string, unknown>;
        const pageSize = (dataSource.isLocal ? pag.clientPagination.pageSize : params['results-per-page'] as number)
          || defaultClientPaginationPageSize;
        const pageIndex = (dataSource.isLocal ? pag.clientPagination.currentPage : pag.currentPage) || 1;
        const totalResults = (dataSource.isLocal ? pag.clientPagination.totalResults : pag.totalResults) || 0;
        return {
          totalResults,
          pageSize,
          pageIndex
        };
      }),
      distinctUntilChanged((x: ListPagination, y: ListPagination) => {
        return x.pageIndex === y.pageIndex && x.pageSize === y.pageSize && x.totalResults === y.totalResults;
      }),
      tag('list-pagination')
    );
  }

}

export function valueOrCommonFalsy(value: unknown, commonFalsy: unknown = ''): unknown {
  // Flatten some specific falsies into the same common value
  if (value === null || value === undefined || value === '') {
    return commonFalsy;
  }
  return value;
}
