import { ObserveOnSubscriber } from 'rxjs/operator/observeOn';
import { DataSource } from '@angular/cdk/table';
import { Observable, Subscribable } from 'rxjs/Observable';
import { Sort, MdPaginator, MdSort } from '@angular/material';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Store } from '@ngrx/store';
import { AppState } from '../store/app-state';
import { Subscription } from 'rxjs/Subscription';
import { PaginationEntityState, PaginatedAction } from '../store/types/pagination.types';
import { schema } from 'normalizr';
import { getPaginationObservables, resultPerPageParam } from '../store/reducers/pagination.reducer';
import { AddParams, SetPage } from '../store/actions/pagination.actions';

export abstract class TableDataSource<T> extends DataSource<T> {

  private paginationSub: Subscription;

  protected pageSize$: Observable<number>;
  protected sort$: Observable<Sort>;
  protected pageIndex$: Observable<number>;
  protected filter$: Observable<string>;

  public abstract isLoadingPage$: Observable<boolean>;
  public abstract filteredRows: Array<T>;


  constructor(
    private _mdPaginator: MdPaginator,
    private _mdSort: MdSort,
    private _filter: Observable<string>,
    private store: Store<AppState>,
    private _typeId: string,
  ) {
    super();
    // this._mdPaginator.pageIndex = 0;
    // this._mdPaginator.pageSizeOptions = [5, 10, 20];

    this.pageSize$ = this._mdPaginator.page.map(pageEvent => pageEvent.pageSize).distinctUntilChanged();
    this._mdPaginator.page.map(pageEvent => pageEvent.pageSize).distinctUntilChanged().subscribe(() => console.log('1_mdPaginator'));
    this._mdPaginator.pageSizeOptions = [5, 10, 20];
    this.pageSize$.subscribe(() => console.log('1pageSize'));

    this.sort$ = this._mdSort.mdSortChange;

    this.pageIndex$ = this._mdPaginator.page.map(pageEvent => pageEvent.pageIndex).distinctUntilChanged();

    this.paginationSub = Observable.combineLatest(
      this.pageSize$,
      this.pageIndex$
    ).subscribe(() => console.log('paginationSub'));

    this.filter$ = _filter;

  }

  abstract connect(): Observable<T[]>;

  disconnect() {
    this.paginationSub.unsubscribe();
  }

  public addRow: T;
  public selectRow: T;
  public isAdding$ = new BehaviorSubject(false);
  protected startAdd(defaultObject: T) {
    this.addRow = defaultObject; // TODO: Ensure clone
    this.isAdding$.next(true);
  }
  protected saveAdd() {
    this.selectRow = this.addRow;
    this.isAdding$.next(false);
  }
  protected cancelAdd() {
    this.isAdding$.next(false);
  }

  public selectedRows = new Map<string, T>();
  public isSelecting$ = new BehaviorSubject(false);
  public selectAllChecked = false;
  protected selectedRowToggle(row: T) {
    const exists = this.selectedRows.has(row[this._typeId]);
    if (exists) {
      this.selectedRows.delete(row[this._typeId]);
    } else {
      this.selectedRows.set(row[this._typeId], row);
    }
    this.isSelecting$.next(this.selectedRows.size > 0);
  }
  protected selectAllFilteredRows(selectAll) {
    this.selectAllChecked = !this.selectAllChecked;
    for (const row of this.filteredRows) {
      if (this.selectAllChecked) {
        this.selectedRows.set(row[this._typeId], row);
      } else {
        this.selectedRows.delete(row[this._typeId]);
      }
    }
    this.isSelecting$.next(this.selectedRows.size > 0);
  }
  protected selectedDelete() {
    this.selectedRows.clear();
    this.isSelecting$.next(false);
  }

  public editRow: T;
  protected startEdit(rowClone: T) {
    this.editRow = rowClone;
  }

  protected saveEdit() {
    delete this.editRow;
  }

  protected cancelEdit() {
    delete this.editRow;
  }

}

export class CfTableDataSource<T> extends TableDataSource<T> {

  private sortSub: Subscription;
  private cfPaginationSub: Subscription;

  private cfPagination$: Observable<any>;
  private pagination$: Observable<PaginationEntityState>;
  private entities$: Observable<any>;

  public isLoadingPage$: Observable<boolean>;
  public filteredRows: Array<T>;

  /**
   *
   */
  constructor(
    private _CfMdPaginator: MdPaginator,
    private _CfMdSort: MdSort,
    private _CfFilter: Observable<string>,
    private _CfStore: Store<AppState>,
    private action: PaginatedAction,
    private sourceScheme: schema.Entity,
    private _cfTypeId: string,
  ) {
    super(_CfMdPaginator, _CfMdSort, _CfFilter, _CfStore, _cfTypeId);
    const { pagination$, entities$ } = getPaginationObservables({
      store: this._CfStore,
      action: this.action,
      schema: [sourceScheme],
    });

    //  = this.pageSize$.do(() => console.log('2pageSize'));
    const cfPageSizeWithPagination$ = this.pageSize$.withLatestFrom(pagination$)
      .do(([pageSize, pag]) => {
        console.log('2dsfdsf');
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
    ).subscribe(() => console.log('2cfPaginationSub'));

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

export abstract class DefaultTableDataSource<T> extends TableDataSource<T> {

  abstract filteredRows: Array<T>;
  abstract isLoadingPage$: Observable<boolean>;
  abstract data$: any;
  private bsCount: BehaviorSubject<number> = new BehaviorSubject(0);

  constructor(
    private _dMdPaginator: MdPaginator,
    private _dMdSort: MdSort,
    private _dFilter: Observable<string>,
    private _dStore: Store<AppState>,
    private _dTypeId: string,
  ) {
    super(_dMdPaginator, _dMdSort, _dFilter, _dStore, _dTypeId);
  }

  connect(): Observable<T[]> {
    this.data$.subscribe(() => console.log('connect data$.subscribe'));
    return this.data$
      .combineLatest(
      this.pageSize$.startWith(5),
      this.pageIndex$.startWith(0),
      this.sort$.startWith({ active: 'name', direction: 'asc' }), // TODO: RC make generic
      this.filter$.startWith('')
      )
      .map(([collection, pageSize, pageIndex, sort, filter]: [Array<T>, number, number, Sort, string]) => {
        // TODO: RC caching?? catch no-ops?
        this._dMdPaginator.length = collection.length;

        const filtered = this.filter(collection, filter);

        const sorted = this.sort(filtered, sort);

        const page = this.paginate(sorted, pageSize, pageIndex);

        // TODO: RC !!!!!! This is being called multiple times at start
        return page;
      });
  }

  disconnect() {
    super.disconnect();
  }

  abstract filter(collection: any, filter: string): Array<T>;
  abstract sort(collection: Array<T>, sort: Sort): Array<T>;
  abstract paginate(collection: Array<T>, pageSize: number, pageIndex: number): Array<T>;
}
