import { ListPagination, ListSort, SetListPaginationAction } from '../../store/actions/list.actions';
import { EntityInfo } from '../../store/types/api.types';
import { fileExists } from 'ts-node/dist';
import { ObserveOnSubscriber } from 'rxjs/operator/observeOn';
import { DataSource } from '@angular/cdk/table';
import { Observable, Subscribable } from 'rxjs/Observable';
import { Sort, MdPaginator, MdSort } from '@angular/material';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs/Subscription';
import { schema } from 'normalizr';
import { TableDataSource, ITableDataSource, getRowUniqueId } from './table-data-source';
import { PaginationEntityState, PaginatedAction, QParam } from '../../store/types/pagination.types';
import { AppState } from '../../store/app-state';
import { getPaginationObservables, resultPerPageParam } from '../../store/reducers/pagination.reducer';
import { AddParams, SetPage } from '../../store/actions/pagination.actions';

export abstract class CfTableDataSource<T extends object> extends TableDataSource<T> implements ITableDataSource<T> {

  private cfUberSub: Subscription;

  protected cfPagination$: Observable<any>;

  private entities$: Observable<any>;

  public isLoadingPage$: Observable<boolean>;
  public filteredRows: Array<T>;

  constructor(
    protected _cfStore: Store<AppState>,
    protected action: PaginatedAction,
    protected sourceScheme: schema.Entity,
    protected _cfGetRowUniqueId: getRowUniqueId,
    protected _cfEmptyType: T,
    private _cfListStateKey: string,
  ) {
    super(_cfStore, _cfGetRowUniqueId, _cfEmptyType, _cfListStateKey);

    const { pagination$, entities$ } = getPaginationObservables({
      store: this._cfStore,
      action: this.action,
      schema: [this.sourceScheme],
    });

    this.entities$ = entities$;

    // Track changes from listPagination to cfPagination
    const listPaginationWithCfPagination$ = this.listPagination$.withLatestFrom(pagination$)
      .do(([listPagination, pag]: [ListPagination, PaginationEntityState]) => {
        if (pag.params[resultPerPageParam] !== listPagination.pageSize) {
          this._cfStore.dispatch(new AddParams(this.sourceScheme.key, this.action.paginationKey, {
            [resultPerPageParam]: listPagination.pageSize
          }));
        }
        if (pag.currentPage - 1 !== listPagination.pageIndex) {
          this._cfStore.dispatch(new SetPage(this.sourceScheme.key, this.action.paginationKey, listPagination.pageIndex + 1));
        }
      });

    // Track changes from cfPagination to listPagination. This should be the only one
    const cfPaginationWithListPagination$ = pagination$.withLatestFrom(this.listPagination$)
      .do(([pag, listPagination]: [PaginationEntityState, ListPagination]) => {
        if (pag.totalResults !== listPagination.totalResults) {
          this._cfStore.dispatch(new SetListPaginationAction(this._cfListStateKey, {
            totalResults: pag.totalResults,
          }));
        }
      });

    // Track changes from listSort to cfPagination
    const sortSub$ = this.listSort$.do((sortObj: ListSort) => {
      this._cfStore.dispatch(new AddParams(this.sourceScheme.key, this.action.paginationKey, {
        'order-direction': sortObj.direction
      }));
    });

    this.cfPagination$ = pagination$;
    this.cfUberSub = Observable.combineLatest(
      listPaginationWithCfPagination$,
      cfPaginationWithListPagination$,
      sortSub$
    ).subscribe();

  }

  connect(): Observable<T[]> {
    this.isLoadingPage$ = this.cfPagination$.map((pag: PaginationEntityState) => pag.fetching);

    if (!this.page$) {
      this.page$ = Observable.combineLatest(
        this.cfPagination$,
        this.entities$
      )
        .map(([listPagination, data]) => {
          return data;
        });
    }
    return this.page$;
  }

  disconnect() {
    this.cfUberSub.unsubscribe();
  }
}
