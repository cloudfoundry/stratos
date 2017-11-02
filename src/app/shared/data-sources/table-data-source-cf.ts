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

  private sortSub: Subscription;
  private cfPaginationSub: Subscription;

  private cfPagination$: Observable<any>;
  // protected listPagination$: Observable<PaginationEntityState>;
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

    // this.listPagination$ = pagination$;
    this.entities$ = entities$;

    const listPaginationWithCfPagination$ = this.listPagination$.withLatestFrom(pagination$)
      .do(([listPagination, pag]: [ListPagination, PaginationEntityState]) => {
        if (pag.params[resultPerPageParam] !== listPagination.pageSize) {
          this._cfStore.dispatch(new AddParams(this.sourceScheme.key, this.action.paginationKey, {
            [resultPerPageParam]: listPagination.pageSize
          }));
        }
        // +1;
        if (pag.currentPage - 1 !== listPagination.pageIndex) {
          this._cfStore.dispatch(new SetPage(this.sourceScheme.key, this.action.paginationKey, listPagination.pageIndex));
        }
      });

    const cfPaginationWithListPagination$ = pagination$.withLatestFrom(this.listPagination$)
      .do(([pag, listPagination]: [PaginationEntityState, ListPagination]) => {
        if (pag.totalResults !== listPagination.totalResults) {
          this._cfStore.dispatch(new SetListPaginationAction(this._cfListStateKey, {
            totalResults: pag.totalResults,
          }));
        }
      });

    // Ensure the widget is up to date
    // TODO: RC Set as defaults
    // sort.active = this.action.initialParams['order-direction-field'];
    // sort.direction = this.action.initialParams['order-direction'];

    // Track changes from the widget in the store
    this.sortSub = this.listSort$.subscribe((sortObj: ListSort) => {
      this._cfStore.dispatch(new AddParams(this.sourceScheme.key, this.action.paginationKey, {
        'order-direction': sortObj.direction
      }));
    });

    // const cfPageIndex$ = this.pageIndex$.do(
    //   pageIndex => this._cfStore.dispatch(new SetPage(this.sourceScheme.key, this.action.paginationKey, pageIndex + 1)));

    this.cfPagination$ = pagination$;
    this.cfPaginationSub = Observable.combineLatest(
      listPaginationWithCfPagination$,
      cfPaginationWithListPagination$, // TODO: RC unsub
    ).subscribe();

  }

  connect(): Observable<T[]> {
    this.isLoadingPage$ = this.cfPagination$.map((pag: PaginationEntityState) => pag.fetching);

    return Observable.combineLatest(
      // this.cfPagination$.do((pag) => {
      //   this._cfStore.dispatch(new SetListPaginationAction(
      //     this._cfListStateKey,
      //     {
      //       pageIndex: pag.currentPage - 1,
      //       pageSize: parseInt(pag.params[resultPerPageParam] as string, 10),
      //       totalResults: pag.totalResults,
      //     }))
      // }),
      this.listPagination$,
      this.entities$
    )
      .map(([listPagination, data]) => {
        return data;
      });
  }

  disconnect() {
    this.sortSub.unsubscribe();
    this.cfPaginationSub.unsubscribe();
    super.disconnect();
  }

  // initialise(paginator: MdPaginator, sort: MdSort, filter$: Observable<string>) {
  //   super.initialise(paginator, sort, filter$);

  // const { pagination$, entities$ } = getPaginationObservables({
  //   store: this._cfStore,
  //   action: this.action,
  //   schema: [this.sourceScheme],
  // });

  // this.listPagination$ = pagination$;
  // this.entities$ = entities$;

  // const cfPageSizeWithPagination$ = this.pageSize$.withLatestFrom(pagination$)
  //   .do(([pageSize, pag]: [number, PaginationEntityState]) => {
  //     if (pag.params[resultPerPageParam] !== pageSize) {
  //       this._cfStore.dispatch(new AddParams(this.sourceScheme.key, this.action.paginationKey, {
  //         [resultPerPageParam]: pageSize
  //       }));
  //     }
  //   });

  // // Ensure the widget is up to date
  // sort.active = this.action.initialParams['order-direction-field'];
  // sort.direction = this.action.initialParams['order-direction'];
  // // Track changes from the widget in the store
  // this.sortSub = this.sort$.subscribe((sortObj: Sort) => {
  //   this._cfStore.dispatch(new AddParams(this.sourceScheme.key, this.action.paginationKey, {
  //     'order-direction': sortObj.direction
  //   }));
  // });

  // const cfPageIndex$ = this.pageIndex$.do(
  //   pageIndex => this._cfStore.dispatch(new SetPage(this.sourceScheme.key, this.action.paginationKey, pageIndex + 1)));

  // this.cfPagination$ = pagination$;
  // this.cfPaginationSub = Observable.combineLatest(
  //   cfPageSizeWithPagination$,
  //   cfPageIndex$,
  // ).subscribe();
  // }

}
