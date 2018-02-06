import { paginationAddParams } from '../../store/reducers/pagination-reducer/pagination-reducer-add-params';
import { getDataFunctionList } from './local-filtering-sorting';
import { OperatorFunction } from 'rxjs/interfaces';
import { getPaginationObservables } from './../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { resultPerPageParam, } from './../../store/reducers/pagination-reducer/pagination-reducer.types';
import { ListPagination, ListSort, ListFilter, ListView } from '../../store/actions/list.actions';
import { fileExists } from 'ts-node/dist';
import { DataSource } from '@angular/cdk/table';
import { Observable, Subscribable } from 'rxjs/Observable';
import { Sort, MatPaginator, MatSort } from '@angular/material';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs/Subscription';
import { schema } from 'normalizr';
import { PaginationEntityState, PaginatedAction, QParam } from '../../store/types/pagination.types';
import { AppState } from '../../store/app-state';
import { AddParams, RemoveParams, SetClientPage, SetPage, SetResultCount } from '../../store/actions/pagination.actions';
import { IListDataSource, getRowUniqueId, RowsState, getDefaultRowState } from './list-data-source-types';
import { map, shareReplay } from 'rxjs/operators';
import { withLatestFrom } from 'rxjs/operators';
import { composeFn } from '../../store/helpers/reducer.helper';
import { distinctUntilChanged } from 'rxjs/operators';
import { getListStateObservable, getListStateObservables, ListState } from '../../store/reducers/list.reducer';
import { IListDataSourceConfig } from './list-data-source-config';
import { tag } from 'rxjs-spy/operators/tag';
import { combineLatest } from 'rxjs/observable/combineLatest';
export interface DataFunctionDefinition {
  type: 'sort' | 'filter';
  orderKey?: string;
  field: string;
}

export function distinctPageUntilChanged(dataSource) {
  return (oldPage, newPage) => {
    const oldPageKeys = (oldPage || []).map(dataSource.getRowUniqueId).join();
    const newPageKeys = (newPage || []).map(dataSource.getRowUniqueId).join();
    return oldPageKeys === newPageKeys;
  };
}

export type DataFunction<T> = ((entities: T[], paginationState: PaginationEntityState) => T[]);
export abstract class ListDataSource<T, A = T> extends DataSource<T> implements IListDataSource<T> {

  // -------------- Public
  // Core observables
  public view$: Observable<ListView>;
  public pagination$: Observable<PaginationEntityState>;
  public page$: Observable<T[]>;

  // Store related
  public entityKey: string;

  // Add item
  public addItem: T;
  public isAdding$ = new BehaviorSubject<boolean>(false);

  // Select item/s
  public selectedRows = new Map<string, T>();
  public isSelecting$ = new BehaviorSubject(false);
  public selectAllChecked = false;

  // Edit item
  public editRow: T;

  // Cached collections
  public filteredRows: Array<T>;
  public entityLettabledRows: Array<T>;

  // Misc
  public isLoadingPage$: Observable<boolean> = Observable.of(false);

  // ------------- Private
  private entities$: Observable<T>;
  private paginationToStringFn: (PaginationEntityState) => string;

  protected store: Store<AppState>;
  protected action: PaginatedAction;
  protected sourceScheme: schema.Entity;
  public getRowUniqueId: getRowUniqueId<T>;
  private getEmptyType: () => T;
  public paginationKey: string;
  private entityLettable: OperatorFunction<A[], T[]> = null;
  public isLocal = false;
  public entityFunctions?: (DataFunction<T> | DataFunctionDefinition)[];
  public rowsState?: Observable<RowsState>;

  private pageSubscription: Subscription;
  private entityLettabledSubscription: Subscription;

  constructor(
    private config: IListDataSourceConfig<A, T>
  ) {
    super();
    this.init(config);
    this.addItem = this.getEmptyType();
    const { view, } = getListStateObservables(this.store, this.paginationKey);
    this.view$ = view;

    this.entityKey = this.sourceScheme.key;
    const { pagination$, entities$ } = getPaginationObservables({
      store: this.store,
      action: this.action,
      schema: [this.sourceScheme]
    },
      this.isLocal
    );

    const dataFunctions = this.entityFunctions ? getDataFunctionList(this.entityFunctions) : null;
    const letted$ = this.attatchEntityLettable(entities$, this.entityLettable);
    this.entityLettabledSubscription = letted$.do(items => this.entityLettabledRows = items).subscribe();

    if (this.isLocal) {
      this.page$ = this.getLocalPagesObservable(letted$, pagination$, dataFunctions);
    } else {
      this.page$ = letted$.pipe(shareReplay(1));
    }
    this.pageSubscription = this.page$.do(items => this.filteredRows = items).subscribe();
    this.pagination$ = pagination$;
    this.isLoadingPage$ = this.pagination$.map((pag: PaginationEntityState) => pag.fetching);
  }

  init(config: IListDataSourceConfig<A, T>) {
    this.store = config.store;
    this.action = config.action;
    this.sourceScheme = config.schema;
    this.getRowUniqueId = config.getRowUniqueId;
    this.getEmptyType = config.getEmptyType ? config.getEmptyType : () => ({} as T);
    this.paginationKey = config.paginationKey;
    this.entityLettable = config.entityLettable;
    this.isLocal = config.isLocal || false;
    this.entityFunctions = config.entityFunctions;
    this.rowsState = config.rowsState ? config.rowsState.pipe(
      shareReplay(1)
    ) : Observable.of({}).first();
  }
  /**
   * Will return the row state with default values filled in.
   * @param row The data for the current row
   */
  getRowState(row: T) {
    return this.rowsState.pipe(
      map(state => ({
        ...getDefaultRowState(),
        ...(state[this.getRowUniqueId(row)] || {})
      })),
      distinctUntilChanged(),
      shareReplay(1)
    );
  }

  disconnect() {
    this.pageSubscription.unsubscribe();
    this.entityLettabledSubscription.unsubscribe();
  }

  destroy() {
    this.disconnect();
  }

  startAdd() {
    this.addItem = this.getEmptyType();
    this.isAdding$.next(true);
  }
  saveAdd() {
    this.isAdding$.next(false);
  }
  cancelAdd() {
    this.isAdding$.next(false);
  }

  selectedRowToggle(row: T) {
    const exists = this.selectedRows.has(this.getRowUniqueId(row));
    if (exists) {
      this.selectedRows.delete(this.getRowUniqueId(row));
    } else {
      this.selectedRows.set(this.getRowUniqueId(row), row);
    }
    this.isSelecting$.next(this.selectedRows.size > 0);
  }

  selectAllFilteredRows() {
    this.selectAllChecked = !this.selectAllChecked;
    for (const row of this.filteredRows) {
      if (this.selectAllChecked) {
        this.selectedRows.set(this.getRowUniqueId(row), row);
      } else {
        this.selectedRows.delete(this.getRowUniqueId(row));
      }
    }
    this.isSelecting$.next(this.selectedRows.size > 0);
  }

  selectClear() {
    this.selectedRows.clear();
    this.isSelecting$.next(false);
  }

  startEdit(rowClone: T) {
    this.editRow = rowClone;
  }

  saveEdit() {
    delete this.editRow;
  }

  cancelEdit() {
    delete this.editRow;
  }

  trackBy = (index: number, item: T) => this.getRowUniqueId(item) || item;

  attatchEntityLettable(entities$, entityLettable) {
    if (entityLettable) {
      return entities$.pipe(
        this.entityLettable
      );
    } else {
      return entities$.pipe(
        map(res => res as T[])
      );
    }
  }

  getLocalPagesObservable(page$, pagination$: Observable<PaginationEntityState>, dataFunctions) {
    return combineLatest(
      pagination$,
      page$
    ).pipe(
      map(([paginationEntity, entities]) => {
        if (dataFunctions && dataFunctions.length) {
          entities = dataFunctions.reduce((value, fn) => {
            return fn(value, paginationEntity);
          }, entities);
        }
        const pages = this.splitClientPages(entities, paginationEntity.clientPagination.pageSize);
        if (
          paginationEntity.totalResults !== entities.length ||
          paginationEntity.clientPagination.totalResults !== entities.length
        ) {
          this.store.dispatch(new SetResultCount(this.entityKey, this.paginationKey, entities.length));
        }
        const pageIndex = paginationEntity.clientPagination.currentPage - 1;
        return pages[pageIndex];
      }),
      shareReplay(1),
      tag('local-list')
      );
  }

  getPaginationCompareString(paginationEntity: PaginationEntityState) {
    return Object.values(paginationEntity.clientPagination).join('.')
      + paginationEntity.params['order-direction-field']
      + paginationEntity.params['order-direction']
      + paginationEntity.clientPagination.filter.string
      + Object.values(paginationEntity.clientPagination.filter.items)
      + paginationEntity.fetching; // Some outlier cases actually fetch independently from this list (looking at you app variables)
  }

  splitClientPages(entites: T[], pageSize: number): T[][] {
    if (!entites || !entites.length) {
      return [];
    }
    if (entites.length <= pageSize) {
      return [entites];
    }
    const array = [...entites];
    const pages = [];

    for (let i = 0; i < array.length; i += pageSize) {
      pages.push(array.slice(i, i + pageSize));
    }
    return pages;
  }

  connect(): Observable<T[]> {
    return this.page$.tag('actual-page-obs');
  }

  public getFilterFromParams(pag: PaginationEntityState) {
    // If data source is not local then this method must be overridden
    return '';
  }
  public setFilterParam(filter: string, pag: PaginationEntityState) {
    // If data source is not local then this method must be overridden
  }
}
