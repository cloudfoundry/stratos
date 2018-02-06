import { DataSource } from '@angular/cdk/table';
import { Store } from '@ngrx/store';
import { schema } from 'normalizr';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { OperatorFunction } from 'rxjs/interfaces';
import { Observable } from 'rxjs/Observable';
import { distinctUntilChanged } from 'rxjs/operators';
import { withLatestFrom } from 'rxjs/operators';
import { map, shareReplay } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { ListView } from '../../store/actions/list.actions';
import { SetResultCount } from '../../store/actions/pagination.actions';
import { AppState } from '../../store/app-state';
import { getListStateObservables } from '../../store/reducers/list.reducer';
import { PaginatedAction, PaginationEntityState } from '../../store/types/pagination.types';
import { getPaginationObservables } from './../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { IListDataSourceConfig } from './list-data-source-config';
import { getDefaultRowState, getRowUniqueId, IListDataSource, RowsState } from './list-data-source-types';
import { getDataFunctionList } from './local-filtering-sorting';

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

export type DataFunction<T> = ((
  entities: T[],
  paginationState: PaginationEntityState
) => T[]);
export abstract class ListDataSource<T, A = T> extends DataSource<T>
  implements IListDataSource<T> {
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

  // Disable item
  public disable$ = new BehaviorSubject<boolean>(false);

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
  private pageSubscription: Subscription;
  private entityLettabledSubscription: Subscription;
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

  constructor(private config: IListDataSourceConfig<A, T>) {
    super();
    this.init(config);
    this.addItem = this.getEmptyType();
    const { view } = getListStateObservables(this.store, this.paginationKey);
    this.view$ = view;

    this.entityKey = this.sourceScheme.key;
    const { pagination$, entities$ } = getPaginationObservables(
      {
        store: this.store,
        action: this.action,
        schema: [this.sourceScheme]
      },
      this.isLocal
    );

    const dataFunctions = this.entityFunctions
      ? getDataFunctionList(this.entityFunctions)
      : null;
    const letted$ = this.attatchEntityLettable(entities$, this.entityLettable);
    this.entityLettabledSubscription = letted$
      .do(items => (this.entityLettabledRows = items))
      .subscribe();

    if (this.isLocal) {
      this.page$ = this.getLocalPagesObservable(
        letted$,
        pagination$,
        dataFunctions
      );
    } else {
      this.page$ = letted$;
    }
    this.page$ = this.page$.pipe(shareReplay(1));
    this.pageSubscription = this.page$
      .do(items => (this.filteredRows = items))
      .subscribe();

    this.pagination$ = pagination$;
    this.isLoadingPage$ = this.pagination$.map(
      (pag: PaginationEntityState) => pag.fetching
    );
  }

  init(config: IListDataSourceConfig<A, T>) {
    this.store = config.store;
    this.action = config.action;
    this.sourceScheme = config.schema;
    this.getRowUniqueId = config.getRowUniqueId;
    this.getEmptyType = config.getEmptyType
      ? config.getEmptyType
      : () => ({} as T);
    this.paginationKey = config.paginationKey;
    this.entityLettable = config.entityLettable;
    this.isLocal = config.isLocal || false;
    this.entityFunctions = config.entityFunctions;
    this.rowsState = config.rowsState
      ? config.rowsState.pipe(shareReplay(1))
      : Observable.of({}).first();
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
      distinctUntilChanged()
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
      return entities$.pipe(this.entityLettable);
    } else {
      return entities$.pipe(map(res => res as T[]));
    }
  }

  getLocalPagesObservable(
    page$,
    pagination$: Observable<PaginationEntityState>,
    dataFunctions
  ) {
    return page$.pipe(
      withLatestFrom(pagination$),
      map(([entities, paginationEntity]) => {
        if (dataFunctions && dataFunctions.length) {
          entities = dataFunctions.reduce((value, fn) => {
            return fn(value, paginationEntity);
          }, entities);
        }
        const pages = this.splitClientPages(
          entities,
          paginationEntity.clientPagination.pageSize
        );
        if (
          paginationEntity.totalResults !== entities.length ||
          paginationEntity.clientPagination.totalResults !== entities.length
        ) {
          this.store.dispatch(
            new SetResultCount(
              this.entityKey,
              this.paginationKey,
              entities.length
            )
          );
        }
        const pageIndex = paginationEntity.clientPagination.currentPage - 1;
        return pages[pageIndex];
      })
    );
  }

  getPaginationCompareString(paginationEntity: PaginationEntityState) {
    return (
      Object.values(paginationEntity.clientPagination).join('.') +
      paginationEntity.params['order-direction-field'] +
      paginationEntity.params['order-direction'] +
      paginationEntity.clientPagination.filter.string +
      Object.values(paginationEntity.clientPagination.filter.items) +
      paginationEntity.fetching
    ); // Some outlier cases actually fetch independently from this list (looking at you app variables)
  }

  splitClientPages(entites: T[], pageSize: number): T[][] {
    if (!entites || !entites.length) {
      return [];
    }
    const array = [...entites];
    const pages = [];

    for (let i = 0; i < array.length; i += pageSize) {
      pages.push(array.slice(i, i + pageSize));
    }
    return pages;
  }

  connect(): Observable<T[]> {
    return this.page$;
  }

  public getFilterFromParams(pag: PaginationEntityState) {
    // If data source is not local then this method must be overridden
    return '';
  }
  public setFilterParam(filter: string, pag: PaginationEntityState) {
    // If data source is not local then this method must be overridden
  }
}
