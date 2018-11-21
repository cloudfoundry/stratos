import { DataSource } from '@angular/cdk/table';
import { Store } from '@ngrx/store';
import { schema } from 'normalizr';
import {
  BehaviorSubject,
  combineLatest,
  Observable,
  of as observableOf,
  OperatorFunction,
  ReplaySubject,
  Subscription,
} from 'rxjs';
import { tag } from 'rxjs-spy/operators';
import { first, publishReplay, refCount, tap } from 'rxjs/operators';

import { SetResultCount } from '../../../../store/actions/pagination.actions';
import { AppState } from '../../../../store/app-state';
import { getPaginationObservables } from '../../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { PaginatedAction, PaginationEntityState } from '../../../../store/types/pagination.types';
import { PaginationMonitor } from '../../../monitors/pagination-monitor';
import { IListDataSourceConfig } from './list-data-source-config';
import { getRowUniqueId, IListDataSource, RowsState, RowState } from './list-data-source-types';
import { getDataFunctionList } from './local-filtering-sorting';
import { LocalListController } from './local-list-controller';
import { MetricsAction } from '../../../../store/actions/metrics.actions';


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
  public selectedRows$ = new ReplaySubject<Map<string, T>>();
  public selectedRows = new Map<string, T>();
  public isSelecting$ = new BehaviorSubject(false);
  public selectAllChecked = false;

  // Edit item
  public editRow: T;

  // Cached collections
  public filteredRows: Array<T>;
  public transformedEntities: Array<T>;

  // Misc
  public isLoadingPage$: Observable<boolean> = observableOf(false);
  public rowsState: Observable<RowsState>;

  // ------------- Private
  private externalDestroy: () => void;

  protected store: Store<AppState>;
  public action: PaginatedAction;
  protected sourceScheme: schema.Entity;
  public getRowUniqueId: getRowUniqueId<T>;
  private getEmptyType: () => T;
  public paginationKey: string;
  private transformEntity: OperatorFunction<A[], T[]> = null;
  public isLocal = false;
  public transformEntities?: (DataFunction<T> | DataFunctionDefinition)[] = [];

  private pageSubscription: Subscription;
  private transformedEntitiesSubscription: Subscription;
  private seedSyncSub: Subscription;
  private metricsAction: MetricsAction;

  public refresh: () => void;

  public getRowState: (row: T) => Observable<RowState> = () => observableOf({});

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
    this.transformedEntitiesSubscription = transformedEntities$.pipe(
      tap(items => this.transformedEntities = items)
    ).subscribe();

    const setResultCount = (paginationEntity: PaginationEntityState, entities: T[]) => {
      if (
        paginationEntity.totalResults !== entities.length ||
        paginationEntity.clientPagination.totalResults !== entities.length
      ) {
        this.store.dispatch(new SetResultCount(this.entityKey, this.paginationKey, entities.length));
      }
    };
    this.page$ = this.isLocal ?
      new LocalListController(transformedEntities$, pagination$, setResultCount, dataFunctions).page$
      : transformedEntities$.pipe(publishReplay(1), refCount());

    this.pageSubscription = this.page$.pipe(tap(items => this.filteredRows = items)).subscribe();
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
    this.rowsState = config.rowsState;
    this.getRowState = config.getRowState;
    this.externalDestroy = config.destroy || (() => { });
    this.addItem = this.getEmptyType();
    this.entityKey = this.sourceScheme.key;
    if (!this.isLocal && this.config.listConfig) {
      // This is a non-local data source so the results-per-page should match the initial page size. This will avoid making two calls
      // (one for the page size in the action and another when the initial page size is set)
      this.action.initialParams = this.action.initialParams || {};
      this.action.initialParams['results-per-page'] = this.config.listConfig.pageSizeOptions[0];
    }
  }

  private getRefreshFunction(config: IListDataSourceConfig<A, T>) {
    if (config.listConfig && config.listConfig.hideRefresh) {
      return null;
    }
    return config.refresh ? config.refresh : () => {
      this.store.dispatch(this.metricsAction || this.action);
    };
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
    this.getRowState(row).pipe(
      first()
    ).subscribe(rowState => {
      if (rowState.disabled) {
        return;
      }
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
      this.selectedRows$.next(this.selectedRows);
      this.isSelecting$.next(multiMode && this.selectedRows.size > 0);
    });
  }

  selectAllFilteredRows() {
    this.selectAllChecked = !this.selectAllChecked;

    const updatedAllRows = this.filteredRows.reduce((obs, row) => {
      obs.push(this.getRowState(row).pipe(
        first(),
        tap(rowState => {
          if (rowState.disabled) {
            return;
          }
          if (this.selectAllChecked) {
            this.selectedRows.set(this.getRowUniqueId(row), row);
          } else {
            this.selectedRows.delete(this.getRowUniqueId(row));
          }
        })
      ));
      return obs;
    }, []);

    combineLatest(...updatedAllRows).pipe(
      first()
    ).subscribe(() => {
      this.selectedRows$.next(this.selectedRows);
      this.isSelecting$.next(this.selectedRows.size > 0);
    });

  }

  selectClear() {
    this.selectedRows.clear();
    this.selectedRows$.next(this.selectedRows);
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

  attachTransformEntity(entities$, entityLettable): Observable<T[]> {
    if (entityLettable) {
      return entities$.pipe(
        this.transformEntity
      );
    } else {
      return entities$;
    }
  }

  connect(): Observable<T[]> {
    return this.page$.pipe(
      tag('actual-page-obs')
    );
  }

  public getFilterFromParams(pag: PaginationEntityState) {
    // If data source is not local then this method must be overridden
    return '';
  }
  public setFilterParam(filterParam: string, pag: PaginationEntityState) {
    // If data source is not local then this method must be overridden
  }

  public updateMetricsAction(newAction: MetricsAction) {
    this.metricsAction = newAction;
    this.store.dispatch(newAction);
  }
}
