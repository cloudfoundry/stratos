import { combineLatest, Observable } from 'rxjs';
import { tag } from 'rxjs-spy/operators/tag';
import { distinctUntilChanged, filter, map, publishReplay, refCount, tap, withLatestFrom } from 'rxjs/operators';
import { getCurrentPageRequestInfo } from '../../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { PaginationEntityState } from '../../../../store/types/pagination.types';
import { splitCurrentPage } from './local-list-controller.helpers';


export class LocalListController<T = any> {
  public page$: Observable<T[]>;
  constructor(
    page$: Observable<T[]>,
    pagination$: Observable<PaginationEntityState>,
    private setResultCount: (pagination: PaginationEntityState, entities: (T | T[])[]) => void,
    dataFunctions?
  ) {
    const pagesObservable$ = this.buildPagesObservable(page$, pagination$, dataFunctions);
    const currentPageIndexObservable$ = this.buildCurrentPageNumberObservable(pagination$);
    const currentPageSizeObservable$ = this.buildCurrentPageSizeObservable(pagination$);
    this.page$ = this.buildCurrentPageObservable(pagesObservable$, currentPageIndexObservable$, currentPageSizeObservable$);
  }

  private pageSplitCache: (T | T[])[] = null;

  private buildPagesObservable(page$: Observable<T[]>, pagination$: Observable<PaginationEntityState>, dataFunctions?) {
    const cleanPagination$ = pagination$.pipe(
      distinctUntilChanged((oldVal, newVal) => !this.paginationHasChanged(oldVal, newVal))
    );

    return this.buildFullCleanPageObservable(page$, cleanPagination$, dataFunctions);
  }

  private buildFullCleanPageObservable(cleanPage$: Observable<T[]>, cleanPagination$: Observable<PaginationEntityState>, dataFunctions?) {
    return combineLatest(
      cleanPagination$,
      cleanPage$
    ).pipe(
      map(([paginationEntity, entities]) => {
        this.pageSplitCache = null;
        if (!entities || !entities.length) {
          return { paginationEntity, entities: [] };
        }
        if (dataFunctions && dataFunctions.length) {
          entities = dataFunctions.reduce((value, fn) => {
            return fn(value, paginationEntity);
          }, entities);
        }
        return { paginationEntity, entities };
      }),
      tap(({ paginationEntity, entities }) => this.setResultCount(paginationEntity, entities)),
      map(({ entities }) => entities)
    );
  }

  private buildCurrentPageNumberObservable(pagination$: Observable<PaginationEntityState>) {
    return pagination$.pipe(
      map(pagination => pagination.clientPagination.currentPage),
      distinctUntilChanged((oldPage, newPage) => oldPage === newPage)
    );
  }

  private buildCurrentPageSizeObservable(pagination$: Observable<PaginationEntityState>) {
    return pagination$.pipe(
      map(pagination => pagination.clientPagination.pageSize),
      distinctUntilChanged()
    );
  }

  private buildCurrentPageObservable(
    entities$: Observable<T[]>,
    currentPageNumber$: Observable<number>,
    currentPageSizeObservable$: Observable<number>
  ) {
    return combineLatest(
      entities$,
      currentPageNumber$
    ).pipe(
      withLatestFrom(currentPageSizeObservable$),
      map(([[entities, currentPage], pageSize]) => {
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
    return paginationEntity.clientPagination.pageSize
      + paginationEntity.clientPagination.totalResults
      + paginationEntity.params['order-direction-field']
      + paginationEntity.params['order-direction']
      + paginationEntity.clientPagination.filter.string
      + Object.values(paginationEntity.clientPagination.filter.items);
    // Some outlier cases actually fetch independently from this list (looking at you app variables)
  }

  private paginationHasChanged(oldPag: PaginationEntityState, newPag: PaginationEntityState) {
    const oldPagCompareString = this.getPaginationCompareString(oldPag);
    const newPagCompareString = this.getPaginationCompareString(newPag);
    return oldPagCompareString !== newPagCompareString;
  }
}
