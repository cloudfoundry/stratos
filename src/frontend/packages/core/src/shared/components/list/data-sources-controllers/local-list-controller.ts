import { combineLatest, Observable, of as observableOf } from 'rxjs';
import { tag } from 'rxjs-spy/operators/tag';
import { distinctUntilChanged, map, publishReplay, refCount, switchMap, tap } from 'rxjs/operators';

import { LocalPaginationHelpers } from '../../../../../../store/src/helpers/local-list.helpers';
import { PaginationEntityState } from '../../../../../../store/src/types/pagination.types';
import { DataFunction } from './list-data-source';
import { splitCurrentPage } from './local-list-controller.helpers';

export class LocalListController<T = any> {
  public page$: Observable<T[]>;
  constructor(
    page$: Observable<T[]>,
    pagination$: Observable<PaginationEntityState>,
    private setResultCount: (pagination: PaginationEntityState, entities: (T | T[])[]) => void,
    dataFunctions?: DataFunction<any>[]
  ) {
    const pagesObservable$ = this.buildPagesObservable(page$, pagination$, dataFunctions);
    const currentPageIndexObservable$ = this.buildCurrentPageNumberObservable(pagination$);
    const currentPageSizeObservable$ = this.buildCurrentPageSizeObservable(pagination$);
    this.page$ = this.buildCurrentPageObservable(pagesObservable$, currentPageIndexObservable$, currentPageSizeObservable$);
  }

  private pageSplitCache: (T | T[])[] = null;

  /*
   * Emit the core set of entities that are sorted and filtered but not paginated
   */
  private buildPagesObservable(
    page$: Observable<T[]>,
    pagination$: Observable<PaginationEntityState>,
    dataFunctions?: DataFunction<any>[]) {
    // Updates whenever a page setting changes (current page, page size, sorting, etc) and not when
    const cleanPagination$ = pagination$.pipe(
      distinctUntilChanged((oldVal, newVal) => !this.paginationHasChanged(oldVal, newVal))
    );

    return this.buildFullCleanPageObservable(page$, cleanPagination$, dataFunctions);
  }

  /*
   * Emit the core set of entities that are sorted and filtered but not paginated
   */
  private buildFullCleanPageObservable(
    cleanPage$: Observable<T[]>,
    cleanPagination$: Observable<PaginationEntityState>,
    dataFunctions?: DataFunction<any>[]) {
    const fullPageObs$ = combineLatest(
      cleanPagination$,
      cleanPage$
    ).pipe(
      map(([paginationEntity, entities]) => {
        this.pageSplitCache = null;
        // `entities` can become out of sync with `paginationEntity.ids`. If either are empty just return empty,
        // otherwise this leads to churn and result count flip flopping
        if (!entities || !entities.length || Object.keys(paginationEntity.ids).length === 0) {
          return { paginationEntity, entities: [] };
        }
        if (dataFunctions && dataFunctions.length) {
          entities = dataFunctions.reduce((value, fn) => fn(value, paginationEntity), entities);
        }
        return { paginationEntity, entities };
      }),
      tap(({ paginationEntity, entities }) => {
        this.setResultCount(paginationEntity, entities);
      }),
      map(({ entities }) => entities)
    );
    return cleanPagination$.pipe(
      map(pagination => LocalPaginationHelpers.isPaginationMaxed(pagination)),
      distinctUntilChanged(),
      switchMap(maxed => {
        return maxed ? observableOf([]) : fullPageObs$;
      })
    );

  }

  /*
   * Emit client side page changes
   */
  private buildCurrentPageNumberObservable(pagination$: Observable<PaginationEntityState>) {
    return pagination$.pipe(
      map(pagination => pagination.clientPagination.currentPage),
      distinctUntilChanged((oldPage, newPage) => oldPage === newPage)
    );
  }

  /*
   * Emit client side page size changes
   */
  private buildCurrentPageSizeObservable(pagination$: Observable<PaginationEntityState>) {
    return pagination$.pipe(
      map(pagination => pagination.clientPagination.pageSize),
      distinctUntilChanged()
    );
  }

  /*
   * Emit a page, which has been created by splitting up a local list, when either
   * 1) the core pages 'entities' (covers entire list of all entities and their order) changes
   * 2) the client side page number changes
   * 3) the client size page size changes
   */
  private buildCurrentPageObservable(
    entities$: Observable<T[]>,
    currentPageNumber$: Observable<number>,
    currentPageSizeObservable$: Observable<number>
  ) {
    return combineLatest(
      entities$,
      currentPageSizeObservable$.pipe(tap(() => {
        this.pageSplitCache = null;
      })),
      currentPageNumber$,
    ).pipe(
      map(([entities, pageSize, currentPage]) => {
        const pages = this.pageSplitCache ? this.pageSplitCache : entities;
        const data = splitCurrentPage(
          pages,
          pageSize,
          currentPage
        );
        this.pageSplitCache = data.entities;
        return (data.entities[data.index] || []) as T[];
      }),
      publishReplay(1),
      refCount(),
      tag('local-list')
    );
  }

  private getPaginationCompareString(paginationEntity: PaginationEntityState) {
    // Unique string excluding local pagination (watched elsewhere)
    return paginationEntity.totalResults
      + (paginationEntity.params['order-direction-field'] as string || '') + ','
      + (paginationEntity.params['order-direction'] as string || '') + ','
      + paginationEntity.clientPagination.filter.string + ','
      + paginationEntity.clientPagination.filter.filterKey + ','
      + paginationEntity.forcedLocalPage
      + Object.values(paginationEntity.clientPagination.filter.items);
    // Some outlier cases actually fetch independently from this list (looking at you app variables)
  }

  private paginationHasChanged(oldPag: PaginationEntityState, newPag: PaginationEntityState) {
    const oldPagCompareString = this.getPaginationCompareString(oldPag);
    const newPagCompareString = this.getPaginationCompareString(newPag);
    return oldPagCompareString !== newPagCompareString;
  }
}
