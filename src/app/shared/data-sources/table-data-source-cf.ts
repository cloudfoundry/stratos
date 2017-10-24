import { ObserveOnSubscriber } from 'rxjs/operator/observeOn';
import { DataSource } from '@angular/cdk/table';
import { Observable, Subscribable } from 'rxjs/Observable';
import { Sort, MdPaginator, MdSort } from '@angular/material';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs/Subscription';
import { schema } from 'normalizr';
import { TableDataSource } from './table-data-source';
import { PaginationEntityState, PaginatedAction } from '../../store/types/pagination.types';
import { AppState } from '../../store/app-state';
import { getPaginationObservables, resultPerPageParam } from '../../store/reducers/pagination.reducer';
import { AddParams, SetPage } from '../../store/actions/pagination.actions';

export abstract class CfTableDataSource<T extends object> extends TableDataSource<T> {

  private sortSub: Subscription;
  private cfPaginationSub: Subscription;

  private cfPagination$: Observable<any>;
  private pagination$: Observable<PaginationEntityState>;
  private entities$: Observable<any>;

  public isLoadingPage$: Observable<boolean>;
  public filteredRows: Array<T>;

  constructor(
    private _CfMdPaginator: MdPaginator,
    private _CfMdSort: MdSort,
    private _CfFilter: Observable<string>,
    private _CfStore: Store<AppState>,
    private action: PaginatedAction,
    private sourceScheme: schema.Entity,
    private _cfTypeId: string,
    private _cfEmptyType: T,
  ) {
    super(_CfMdPaginator, _CfMdSort, _CfFilter, _CfStore, _cfTypeId, _cfEmptyType);
    const { pagination$, entities$ } = getPaginationObservables({
      store: this._CfStore,
      action: this.action,
      schema: [sourceScheme],
    });

    const cfPageSizeWithPagination$ = this.pageSize$.withLatestFrom(pagination$)
      .do(([pageSize, pag]) => {
        if (pag.params[resultPerPageParam] !== pageSize) {
          this._CfStore.dispatch(new AddParams(sourceScheme.key, action.paginationKey, {
            [resultPerPageParam]: pageSize
          }));
        }
      });

    this.sortSub = this.sort$.subscribe((sort: Sort) => {
      this._CfStore.dispatch(new AddParams(sourceScheme.key, action.paginationKey, {
        'sort-by': sort.active,
        'order-direction': sort.direction
      }));
    });

    const cfPageIndex$ = this.pageIndex$.do(
      pageIndex => this._CfStore.dispatch(new SetPage(sourceScheme.key, action.paginationKey, pageIndex + 1)));

    this.cfPagination$ = pagination$;
    this.cfPaginationSub = Observable.combineLatest(
      cfPageSizeWithPagination$,
      cfPageIndex$
    ).subscribe();

    this.pagination$ = pagination$;
    this.entities$ = entities$;
  }

  connect(): Observable<T[]> {
    this.isLoadingPage$ = this.cfPagination$.map(pag => pag.fetching);

    return Observable.combineLatest(
      this.cfPagination$.do((pag) => {
        this._CfMdPaginator.pageIndex = pag.currentPage - 1;
        this._CfMdPaginator.pageSize = parseInt(pag.params[resultPerPageParam] as string, 10);
        this._CfMdPaginator.length = pag.totalResults;
      }),
      this.entities$
    )
      .map(([paginationEntity, data]) => {
        return data;
      });
  }

  disconnect() {
    this.sortSub.unsubscribe();
    this.cfPaginationSub.unsubscribe();
    super.disconnect();
  }

}
