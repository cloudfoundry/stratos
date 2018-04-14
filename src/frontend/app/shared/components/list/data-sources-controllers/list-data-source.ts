import { DataSource } from '@angular/cdk/table';
import { Store } from '@ngrx/store';
import { schema } from 'normalizr';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { OperatorFunction } from 'rxjs/interfaces';
import { Observable } from 'rxjs/Observable';
import { distinctUntilChanged, filter, first, map, publishReplay, refCount } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { SetResultCount } from '../../../../store/actions/pagination.actions';
import { AppState } from '../../../../store/app-state';
import { getPaginationObservables } from '../../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { PaginatedAction, PaginationEntityState } from '../../../../store/types/pagination.types';
import { PaginationMonitor } from '../../../monitors/pagination-monitor';
import { IListDataSourceConfig } from './list-data-source-config';
import { getDefaultRowState, getRowUniqueId, IListDataSource, RowsState } from './list-data-source-types';
import { getDataFunctionList } from './local-filtering-sorting';
import { LocalListController } from './local-list-controller';

export class DataFunctionDefinition {
  type: 'sort' | 'filter';
  orderKey?: string;
  field: string;
  static is(obj) {
    if (obj) {
      const typed = <DataFunctionDefinition>obj;
      return typed.type && typed.orderKey && typed.field;
    }
    return false;
  }
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
  public transformedEntities: Array<T>;

  // Misc
  public isLoadingPage$: Observable<boolean> = Observable.of(false);

  // ------------- Private
  private entities$: Observable<T>;
  private paginationToStringFn: (PaginationEntityState) => string;
  private externalDestroy: () => void;

  protected store: Store<AppState>;
  protected action: PaginatedAction;
  protected sourceScheme: schema.Entity;
  public getRowUniqueId: getRowUniqueId<T>;
  private getEmptyType: () => T;
  public paginationKey: string;
  private transformEntity: OperatorFunction<A[], T[]> = null;
  public isLocal = false;
  public transformEntities?: (DataFunction<T> | DataFunctionDefinition)[];
  public rowsState?: Observable<RowsState>;

  private pageSubscription: Subscription;
  private transformedEntitiesSubscription: Subscription;
  private seedSyncSub: Subscription;

  public refresh: () => void;

  constructor(
    private config: IListDataSourceConfig<A, T>
  ) {
    super();
    this.init(config);
    const paginationMonitor = new PaginationMonitor(
      this.store,
      this.paginationKey,
      this.sourceScheme
    );
    const { pagination$, entities$ } = getPaginationObservables({
      store: this.store,
      action: this.action,
      paginationMonitor
    },
      this.isLocal
    );

    const transformEntities = this.transformEntities || [];
    // Add any additional functions via an optional listConfig, such as sorting from the column definition
    const listColumns = this.config.listConfig ? this.config.listConfig.getColumns() : [];
    listColumns.forEach(column => {
      if (!column.sort) {
        return;
      }
      if (DataFunctionDefinition.is(column.sort)) {
        transformEntities.push(column.sort as DataFunctionDefinition);
      } else if (typeof column.sort !== 'boolean') {
        transformEntities.push(column.sort as DataFunction<T>);
      }
    });

    const dataFunctions = getDataFunctionList(transformEntities);
    const transformedEntities$ = this.attachTransformEntity(entities$, this.transformEntity);
    this.transformedEntitiesSubscription = transformedEntities$.do(items => this.transformedEntities = items).subscribe();

    const setResultCount = entities => {
      this.store.dispatch(new SetResultCount(this.entityKey, this.paginationKey, entities.length));
      pagination$.pipe(
        first()
      ).subscribe((paginationEntity) => {
        const validPagesCountChange = this.transformEntity;
        if (
          validPagesCountChange &&
          (paginationEntity.totalResults !== entities.length ||
            paginationEntity.clientPagination.totalResults !== entities.length)
        ) {
          this.store.dispatch(new SetResultCount(this.entityKey, this.paginationKey, entities.length));
        }
      });
    };
    this.page$ = this.isLocal ?
      new LocalListController(transformedEntities$, pagination$, setResultCount, dataFunctions).page$
      : transformedEntities$.pipe(publishReplay(1), refCount());

    this.pageSubscription = this.page$.do(items => this.filteredRows = items).subscribe();
    this.pagination$ = pagination$;
    this.isLoadingPage$ = paginationMonitor.fetchingCurrentPage$;
  }

  init(config: IListDataSourceConfig<A, T>) {
    this.store = config.store;
    this.action = config.action;
    this.refresh = this.getRefreshFunction(config);
    this.sourceScheme = config.schema;
    this.getRowUniqueId = config.getRowUniqueId;
    this.getEmptyType = config.getEmptyType ? config.getEmptyType : () => ({} as T);
    this.paginationKey = config.paginationKey;
    this.transformEntity = config.transformEntity;
    this.isLocal = config.isLocal || false;
    this.transformEntities = config.transformEntities;
    this.rowsState = config.rowsState ? config.rowsState.pipe(
      publishReplay(1), refCount()
    ) : Observable.of({}).first();
    this.externalDestroy = config.destroy || (() => { });
    this.addItem = this.getEmptyType();
    this.entityKey = this.sourceScheme.key;
  }

  private getRefreshFunction(config: IListDataSourceConfig<A, T>) {
    if (config.hideRefresh) {
      return null;
    }
    return config.refresh ? config.refresh : () => {
      this.store.dispatch(this.action);
    };
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
      publishReplay(1), refCount()
    );
  }

  disconnect() {
    this.pageSubscription.unsubscribe();
    this.transformedEntitiesSubscription.unsubscribe();
    if (this.seedSyncSub) { this.seedSyncSub.unsubscribe(); }
    this.externalDestroy();
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

  selectedRowToggle(row: T, multiMode: boolean = true) {
    const exists = this.selectedRows.has(this.getRowUniqueId(row));
    if (exists) {
      this.selectedRows.delete(this.getRowUniqueId(row));
      this.selectAllChecked = false;
    } else {
      if (!multiMode) {
        this.selectedRows.clear();
      }
      this.selectedRows.set(this.getRowUniqueId(row), row);
      this.selectAllChecked = multiMode && this.selectedRows.size === this.filteredRows.length;
    }
    this.isSelecting$.next(multiMode && this.selectedRows.size > 0);
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

  attachTransformEntity(entities$, entityLettable) {
    if (entityLettable) {
      return entities$.pipe(
        this.transformEntity
      );
    } else {
      return entities$.pipe(
        map(res => res as T[])
      );
    }
  }

  connect(): Observable<T[]> {
    return this.page$
      .tag('actual-page-obs');
  }

  public getFilterFromParams(pag: PaginationEntityState) {
    // If data source is not local then this method must be overridden
    return '';
  }
  public setFilterParam(filter: string, pag: PaginationEntityState) {
    // If data source is not local then this method must be overridden
  }
}
