import { DataSource } from '@angular/cdk/table';
import { SortDirection } from '@angular/material';
import { Store } from '@ngrx/store';
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
import {
  distinctUntilChanged,
  filter,
  first,
  map,
  publishReplay,
  refCount,
  startWith,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs/operators';

import { ListFilter, ListSort } from '../../../../../../store/src/actions/list.actions';
import { MetricsAction } from '../../../../../../store/src/actions/metrics.actions';
import { SetParams, SetResultCount } from '../../../../../../store/src/actions/pagination.actions';
import { AppState } from '../../../../../../store/src/app-state';
import { entityFactory, EntitySchema } from '../../../../../../store/src/helpers/entity-factory';
import { getPaginationObservables } from '../../../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import {
  PaginatedAction,
  PaginationEntityState,
  PaginationParam,
  QParam,
} from '../../../../../../store/src/types/pagination.types';
import { PaginationMonitor } from '../../../monitors/pagination-monitor';
import { IListDataSourceConfig, MultiActionConfig } from './list-data-source-config';
import {
  EntitySelectConfig,
  getRowUniqueId,
  IEntitySelectItem,
  IListDataSource,
  ListPaginationMultiFilterChange,
  RowsState,
  RowState,
} from './list-data-source-types';
import { getDataFunctionList } from './local-filtering-sorting';
import { LocalListController } from './local-list-controller';
import { LocalPaginationHelpers } from './local-list.helpers';

export class DataFunctionDefinition {
  type: 'sort' | 'filter';
  orderKey?: string;
  field: string;
  static is(obj) {
    if (obj) {
      const typed = obj as DataFunctionDefinition;
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
  public transformedEntities: Array<T>;

  // Misc
  public isLoadingPage$: Observable<boolean> = observableOf(false);
  public rowsState: Observable<RowsState>;
  public maxedResults$: Observable<boolean> = observableOf(false);

  public filter$: Observable<ListFilter>;
  public sort$: Observable<ListSort>;

  // ------------- Private
  private externalDestroy: () => void;

  protected store: Store<AppState>;
  public action: PaginatedAction | PaginatedAction[];
  public masterAction: PaginatedAction;
  protected sourceScheme: EntitySchema;
  public getRowUniqueId: getRowUniqueId<T>;
  private getEmptyType: () => T;
  public paginationKey: string;
  private transformEntity: OperatorFunction<A[], T[]> = null;
  public isLocal = false;
  public transformEntities?: (DataFunction<T> | DataFunctionDefinition)[] = [];

  private pageSubscription: Subscription;
  private transformedEntitiesSubscription: Subscription;
  private seedSyncSub: Subscription;
  protected metricsAction: MetricsAction;
  public entitySelectConfig: EntitySelectConfig;

  public refresh: () => void;

  public isMultiAction$: Observable<boolean>;
  public getRowState: (row: T) => Observable<RowState> = () => observableOf({});

  constructor(
    private config: IListDataSourceConfig<A, T>
  ) {
    super();
    this.init(config);
    const paginationMonitor = new PaginationMonitor(
      this.store,
      this.paginationKey,
      this.sourceScheme,
      this.isLocal
    );
    const { pagination$, entities$ } = getPaginationObservables({
      store: this.store,
      action: this.action,
      paginationMonitor
    },
      this.isLocal
    );
    this.isMultiAction$ = paginationMonitor.isMultiAction$;
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

    const dataFunctions: DataFunction<any>[] = getDataFunctionList(transformEntities);
    const transformedEntities$ = this.attachTransformEntity(entities$, this.transformEntity);
    const setResultCount = (paginationEntity: PaginationEntityState, entities: any[]) => {
      const newLength = entities.length;
      if (
        paginationEntity.ids[paginationEntity.currentPage] &&
        (paginationEntity.totalResults !== newLength || paginationEntity.clientPagination.totalResults !== newLength)) {
        this.store.dispatch(new SetResultCount(this.entityKey, this.paginationKey, newLength));
      }
    };

    // NJ - We should avoid these kind on side-effect subscriptions
    this.transformedEntitiesSubscription = transformedEntities$.pipe(
      tap(items => this.transformedEntities = items)
    ).subscribe();

    this.isLoadingPage$ = paginationMonitor.fetchingCurrentPage$;
    const page$ = this.isLocal ?
      new LocalListController<T>(transformedEntities$, pagination$, setResultCount, dataFunctions).page$
      : transformedEntities$;

    this.page$ = page$.pipe(
      withLatestFrom(this.isLoadingPage$.pipe(startWith(false))),
      filter(([page, isLoading]) => !isLoading),
      map(([page]) => page),
      publishReplay(1),
      refCount()
    );

    this.pagination$ = pagination$;


    this.sort$ = this.createSortObservable();

    this.filter$ = this.createFilterObservable();

    this.maxedResults$ = !!this.masterAction.flattenPaginationMax ?
      this.pagination$.pipe(
        map(LocalPaginationHelpers.isPaginationMaxed),
        distinctUntilChanged(),
      ) : observableOf(false);
  }

  init(config: IListDataSourceConfig<A, T>) {
    this.store = config.store;
    this.action = config.action;
    this.refresh = this.getRefreshFunction(config);
    this.sourceScheme = config.schema instanceof MultiActionConfig ?
      entityFactory(config.schema.schemaConfigs[0].schemaKey) : config.schema;
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
    this.masterAction = this.action as PaginatedAction;
    this.setupAction(config);
    if (!this.isLocal && this.config.listConfig) {
      // This is a non-local data source so the results-per-page should match the initial page size. This will avoid making two calls
      // (one for the page size in the action and another when the initial page size is set)
      this.masterAction.initialParams = this.masterAction.initialParams || {};
      this.masterAction.initialParams['results-per-page'] = this.config.listConfig.pageSizeOptions[0];
    }
  }
  private setupAction(config: IListDataSourceConfig<A, T>) {
    if (config.schema instanceof MultiActionConfig) {
      if (!config.isLocal) {
        // We cannot do multi action lists for none local lists
        this.action = config.schema[0].paginationAction;
        this.masterAction = this.action as PaginatedAction;
      } else {
        this.action = config.schema.schemaConfigs.map((multiActionConfig, i) => ({
          ...multiActionConfig.paginationAction,
          paginationKey: this.masterAction.paginationKey,
          entityKey: this.masterAction.entityKey,
          entity: this.masterAction.entity,
          flattenPaginationMax: this.masterAction.flattenPaginationMax,
          flattenPagination: this.masterAction.flattenPagination,
          __forcedPageNumber__: i + 1,
          __forcedPageSchemaKey__: multiActionConfig.schemaKey
        }) as PaginatedAction);
      }
      this.entitySelectConfig = this.getEntitySelectConfig(config.schema);
    }
  }

  private getEntitySelectConfig(multiActionConfig: MultiActionConfig) {
    if (!multiActionConfig.selectPlaceholder) {
      return null;
    }
    const pageToIdMap = multiActionConfig.schemaConfigs.reduce((actionMap, schemaConfig, i) => ([
      ...actionMap,
      {
        page: i + 1,
        label: schemaConfig.prettyName,
        schemaKey: schemaConfig.schemaKey
      }
    ]), [] as IEntitySelectItem[]);
    if (Object.keys(pageToIdMap).length < 2) {
      return null;
    }
    return new EntitySelectConfig(
      multiActionConfig.selectPlaceholder,
      multiActionConfig.deselectText,
      pageToIdMap
    );
  }

  private getRefreshFunction(config: IListDataSourceConfig<A, T>) {
    if (config.listConfig && config.listConfig.hideRefresh) {
      return null;
    }
    return config.refresh ? config.refresh : () => {
      if (Array.isArray(this.action)) {
        this.action.forEach(action => this.store.dispatch(action));
      } else {
        this.store.dispatch(this.metricsAction || this.masterAction);
      }
    };
  }

  disconnect() {
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
      first(),
      withLatestFrom(this.page$)
    ).subscribe(([rowState, filteredRows]) => {
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
        this.selectAllChecked = multiMode && this.selectedRows.size === filteredRows.length;
      }
      this.selectedRows$.next(this.selectedRows);
      this.isSelecting$.next(multiMode && this.selectedRows.size > 0);
    });
  }

  selectAllFilteredRows() {
    this.selectAllChecked = !this.selectAllChecked;

    const updatedAllRows$ = this.page$.pipe(switchMap((filterEntities) => {
      return combineLatest(filterEntities.reduce((obs, row) => {
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
      }, []));
    }));

    updatedAllRows$.pipe(
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

  attachTransformEntity<Y = T>(entities$, entityLettable): Observable<Y[]> {
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

  public setMultiFilter(changes: ListPaginationMultiFilterChange[], params: PaginationParam) {

  }

  protected setQParam(setQ: QParam, qs: QParam[]): boolean {
    const existing = qs.find((q: QParam) => q.key === setQ.key);
    let changed = true;
    if (setQ.value && setQ.value.length) {
      if (existing) {
        // Set existing value
        changed = existing.value !== setQ.value;
        existing.value = setQ.value;
      } else {
        // Add new value
        qs.push(setQ);
      }
    } else {
      if (existing) {
        // Remove existing
        qs.splice(qs.indexOf(existing), 1);
      } else {
        changed = false;
      }
    }
    return changed;
  }

  public updateMetricsAction(newAction: MetricsAction) {
    this.metricsAction = newAction;

    if (this.isLocal) {
      this.store.dispatch(newAction);
    } else {
      this.pagination$.pipe(
        first()
      ).subscribe(pag => {
        this.store.dispatch(new SetParams(newAction.entityKey, this.paginationKey, {
          ...pag.params,
          metricConfig: newAction.query
        }, false, true));
      });
    }
  }

  private createSortObservable(): Observable<ListSort> {
    return this.pagination$.pipe(
      map(pag => ({
        direction: pag.params['order-direction'] as SortDirection,
        field: pag.params['order-direction-field']
      })),
      filter(x => !!x),
      distinctUntilChanged((x, y) => x.direction === y.direction && x.field === y.field),
      tag('list-sort')
    );
  }

  private createFilterObservable(): Observable<ListFilter> {
    return this.pagination$.pipe(
      map(pag => ({
        string: this.isLocal ? pag.clientPagination.filter.string : this.getFilterFromParams(pag),
        items: { ...pag.clientPagination.filter.items }
      })),
      tag('list-filter')
    );
  }
}
