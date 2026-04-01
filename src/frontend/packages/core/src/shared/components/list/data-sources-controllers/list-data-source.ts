import { DataSource } from '@angular/cdk/table';
export type SortDirection = 'asc' | 'desc' | '';
import { ApplicationRef, signal, Signal } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  entityCatalog,
  EntitySchema,
  ListFilter,
  ListSort,
  MetricsAction,
  AppState,
  LocalPaginationHelpers,
  PaginationMonitor,
  getPaginationObservables,
  PaginatedAction,
  PaginationEntityState,
  PaginationParam,
  IgnorePaginationMaxedState,
  SetResultCount,
} from '@stratosui/store';
import {
  BehaviorSubject,
  combineLatest,
  Observable,
  of as observableOf,
  of,
  OperatorFunction,
  Subscription,
} from 'rxjs';
import { tag } from 'rxjs-spy/operators';
import {
  catchError,
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

export type DataFunctionDefinitionType = 'sort' | 'natural-sort' | 'filter';

export class DataFunctionDefinition {
  type!: DataFunctionDefinitionType;
  orderKey?: string;
  field!: string;
  static is(obj: any): obj is DataFunctionDefinition {
    if (obj) {
      const typed = obj as DataFunctionDefinition;
      return !!(typed.type && typed.orderKey && typed.field);
    }
    return false;
  }
}

export function distinctPageUntilChanged<T>(dataSource: IListDataSource<T>) {
  return (oldPage: T[], newPage: T[]) => {
    const oldPageKeys = (oldPage || []).map(dataSource.getRowUniqueId).join();
    const newPageKeys = (newPage || []).map(dataSource.getRowUniqueId).join();
    return oldPageKeys === newPageKeys;
  };
}
export type DataFunction<T> = ((entities: T[], paginationState: PaginationEntityState) => T[]);
export abstract class ListDataSource<T, A = T> extends DataSource<T> implements IListDataSource<T> {

  // -------------- Public
  // Core observables
  public pagination$!: Observable<PaginationEntityState>;
  public page$!: Observable<T[]>;

  // Store related
  public entityKey!: string;
  public endpointType!: string;

  // Add item
  public addItem!: T;
  private _isAdding = signal<boolean>(false);
  public isAdding = this._isAdding.asReadonly();
  private _isAddingSubject = new BehaviorSubject<boolean>(false);
  public isAdding$ = this._isAddingSubject.asObservable();

  // Select item/s
  private _selectedRows = signal<Map<string, T>>(new Map<string, T>());
  public selectedRows = this._selectedRows.asReadonly();
  private _selectedRowsSubject = new BehaviorSubject<Map<string, T>>(new Map<string, T>());
  public selectedRows$ = this._selectedRowsSubject.asObservable();
  private _isSelecting = signal<boolean>(false);
  public isSelecting = this._isSelecting.asReadonly();
  private _isSelectingSubject = new BehaviorSubject<boolean>(false);
  public isSelecting$ = this._isSelectingSubject.asObservable();
  public selectAllChecked = false;

  // Edit item
  public editRow!: T;

  // Cached collections
  public transformedEntities!: Array<T>;

  // Misc
  public isLoadingPage$: Observable<boolean> = observableOf(false);
  public rowsState!: Observable<RowsState>;

  // Maxed Collection
  public maxedResults$: Observable<boolean> = observableOf(false);
  public maxedStateStartAt$: Observable<number> = observableOf(null);

  public filter$!: Observable<ListFilter>;
  public sort$!: Observable<ListSort>;

  // ------------- Private
  private externalDestroy: () => void;

  protected store!: Store<AppState>;
  public action!: PaginatedAction | PaginatedAction[];
  public masterAction!: PaginatedAction;
  public sourceScheme!: EntitySchema;
  // Use A type for getRowUniqueId since it's provided in config with pre-transform type
  // but create a wrapper for post-transform usage
  private getRowUniqueIdInternal!: getRowUniqueId<A>;
  public getRowUniqueId!: getRowUniqueId<T>;
  private getEmptyType!: () => T;
  public paginationKey!: string;
  private transformEntity: OperatorFunction<A[], T[]> | undefined;
  public isLocal = false;
  public transformEntities?: (DataFunction<T> | DataFunctionDefinition)[] = [];

  private transformedEntitiesSubscription: Subscription;
  private seedSyncSub: Subscription;
  protected metricsAction: MetricsAction;
  public entitySelectConfig: EntitySelectConfig;

  public refresh: () => void;

  public isMultiAction$!: Observable<boolean>;
  entityType!: string;

  public getRowState: (row: T) => Observable<RowState> = () => observableOf({});

  // ZONELESS: ApplicationRef injected for manual change detection on async operations
  private appRef: ApplicationRef;

  constructor(
    private config: IListDataSourceConfig<A, T>,
  ) {
    super();
    // ZONELESS: Inject ApplicationRef from config store's injector
    this.appRef = config.store['injector']?.get(ApplicationRef);
    this.init(config);
    const paginationMonitor = new PaginationMonitor(
      this.store,
      this.paginationKey,
      this.masterAction,
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
    listColumns.forEach((column: any) => {
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
      const ids = paginationEntity.ids as Record<number, string[]>;
      if (
        ids[paginationEntity.currentPage] &&
        (paginationEntity.totalResults !== newLength || paginationEntity.clientPagination.totalResults !== newLength)) {
        this.store.dispatch(new SetResultCount(this, this.paginationKey, newLength));
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

    // For local lists, use the controller's page$ directly — it already has
    // shareReplay(1) and doesn't need isLoadingPage$ gating (data is loaded).
    // The extra publishReplay(1)/refCount() layer was causing filtered emissions
    // to be lost due to stale replays during subscriber churn.
    this.page$ = this.isLocal ? page$ : page$.pipe(
      withLatestFrom(this.isLoadingPage$.pipe(startWith(false))),
      filter(([page, isLoading]) => !isLoading),
      map(([page]) => page),
      publishReplay(1),
      refCount()
    );

    this.pagination$ = pagination$;

    this.sort$ = this.createSortObservable();

    this.filter$ = this.createFilterObservable();

    this.maxedResults$ = this.pagination$.pipe(
      filter(pagination => !!pagination),
      // TIMING FIX: Skip emissions where pageCount is undefined during store initialization
      // Angular 20's stricter immutability enforcement means pagination state may emit before
      // all default values are applied by reducers. Filter these out to prevent warnings.
      // For local/client pagination, pageCount may be undefined - use clientPagination instead
      filter(pagination => {
        if (this.isLocal) {
          // For local pagination, we have data if clientPagination exists or pageRequests exist
          return !!(pagination.clientPagination || pagination.pageRequests);
        }
        // For server pagination, require pageCount
        return pagination.pageCount !== undefined && pagination.pageCount !== null;
      }),
      map(pagination => LocalPaginationHelpers.isPaginationMaxed(pagination)),
      distinctUntilChanged(),
      catchError(error => {
        console.error('Error checking maxed results:', error);
        return of(false);
      })
    );

    // Defensive: Entity catalog lookups can fail during initialization when entities aren't registered yet
    try {
      const catalogEntity = entityCatalog.getEntity(
        this.masterAction.endpointType,
        this.masterAction.entityType
      );

      // Defensive: catalogEntity may be null if endpoint/entity type not registered yet
      if (!catalogEntity) {
        console.warn(
          `Entity catalog lookup returned null for pagination config. ` +
          `endpoint=${this.masterAction.endpointType}, entity=${this.masterAction.entityType}. ` +
          `Using default maxedStateStartAt. This is expected during early initialization.`
        );
        this.maxedStateStartAt$ = of(null);
      } else {
        // Defensive: getPaginationConfig may not exist on all catalog entities
        const paginationConfig = catalogEntity.getPaginationConfig?.();
        this.maxedStateStartAt$ = paginationConfig ?
          paginationConfig.maxedStateStartAt(this.store, this.masterAction) :
          of(null);
      }
    } catch (error) {
      console.warn(
        `Error getting catalog entity for pagination: endpoint=${this.masterAction.endpointType}, entity=${this.masterAction.entityType}. ` +
        `Error: ${error.message}. Using default maxedStateStartAt.`
      );
      this.maxedStateStartAt$ = of(null);
    }
  }

  init(config: IListDataSourceConfig<A, T>) {
    this.store = config.store;
    this.action = config.action;
    this.refresh = this.getRefreshFunction(config);
    this.sourceScheme = this.getSourceSchema(config.schema);
    this.getRowUniqueIdInternal = config.getRowUniqueId;

    // Create wrapper for T type usage
    // When there's a transform, A and T may be different types
    // The function works on the unique ID which should be consistent across both types
    // (typically a string/number ID that exists on both A and T)
    this.getRowUniqueId = this.getRowUniqueIdInternal as unknown as getRowUniqueId<T>;

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
    this.entityType = this.action.entityType;
    this.endpointType = this.action.endpointType;
    this.masterAction = this.action;
    this.setupAction(config);
    if (!this.isLocal && this.config.listConfig) {
      // This is a non-local data source so the results-per-page should match the initial page size. This will avoid making two calls
      // (one for the page size in the action and another when the initial page size is set)
      this.masterAction.initialParams = this.masterAction.initialParams || {};
      (this.masterAction.initialParams as Record<string, any>)['results-per-page'] = this.config.listConfig.pageSizeOptions[0];
    }
  }
  private setupAction(config: IListDataSourceConfig<A, T>) {
    if (config.schema instanceof MultiActionConfig) {
      if (!config.isLocal) {
        // We cannot do multi action lists for non-local lists
        this.action = (config.schema as any)[0].paginationAction;
        this.masterAction = this.action as PaginatedAction;
      } else {
        this.action = config.schema.schemaConfigs.map((multiActionConfig, i) => ({
          ...multiActionConfig.paginationAction,
          paginationKey: this.masterAction.paginationKey,
          entityType: this.masterAction.entityType,
          entity: this.masterAction.entity,
          flattenPaginationMax: this.masterAction.flattenPaginationMax,
          flattenPagination: this.masterAction.flattenPagination,
          __forcedPageNumber__: i + 1,
          __forcedPageEntityConfig__: multiActionConfig.paginationAction
        }) as PaginatedAction);
      }
      this.entitySelectConfig = this.getEntitySelectConfig(config.schema);
    }
    /* tslint:disable-next-line:no-string-literal  */
    if ((this.action as any)['length']) {
      this.action = (this.action as PaginatedAction[]).map(a => ({
        ...a,
        isList: true
      }));
    } else {
      (this.action as PaginatedAction).isList = true;
    }
    this.masterAction.isList = true;
  }

  private getEntitySelectConfig(multiActionConfig: MultiActionConfig) {
    if (!multiActionConfig.selectPlaceholder) {
      return null;
    }
    const pageToIdMap = multiActionConfig.schemaConfigs.reduce((actionMap, schemaConfig, i) => {
      // Defensive: Entity catalog lookup may return null if endpoint/entity type not registered yet
      const catalogEntity = entityCatalog.getEntity(
        schemaConfig.paginationAction.endpointType,
        schemaConfig.paginationAction.entityType
      );

      // Defensive: Skip this config if catalog entity not found
      if (!catalogEntity) {
        console.warn(
          `Entity catalog lookup failed in getEntitySelectConfig for ` +
          `endpoint=${schemaConfig.paginationAction.endpointType}, entity=${schemaConfig.paginationAction.entityType}. ` +
          `Skipping this entity from select config.`
        );
        return actionMap;
      }

      const entityKey = entityCatalog.getEntityKey(schemaConfig.paginationAction);
      const idPage = {
        page: i + 1,
        // Defensive: Use optional chaining for definition.label
        label: catalogEntity.definition?.label || 'Unknown',
        entityKey
      };
      actionMap.push(idPage);
      return actionMap;
    }, [] as IEntitySelectItem[]);
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

  private getSourceSchema(schema: EntitySchema | MultiActionConfig) {
    if (schema instanceof MultiActionConfig) {
      const { paginationAction } = schema.schemaConfigs[0];
      // Defensive: Entity catalog lookup may return null if endpoint/entity type not registered yet
      const catalogEntity = entityCatalog.getEntity(paginationAction.endpointType, paginationAction.entityType);
      if (!catalogEntity) {
        console.error(
          `Failed to get source schema - catalog entity not found for ` +
          `endpoint=${paginationAction.endpointType}, entity=${paginationAction.entityType}. ` +
          `This will likely cause further errors. Check entity catalog initialization.`
        );
        // Return schema as-is to avoid crashing, though this may cause downstream issues
        return schema as unknown as EntitySchema;
      }
      // Defensive: getSchema may not exist on all catalog entities
      if (!catalogEntity.getSchema) {
        console.error(
          `Catalog entity for ${paginationAction.entityType} does not have getSchema method. ` +
          `Using fallback schema.`
        );
        return schema as unknown as EntitySchema;
      }
      return catalogEntity.getSchema(paginationAction.schemaKey);
    }
    return schema;
  }

  disconnect() {
    this.transformedEntitiesSubscription.unsubscribe();
    if (this.seedSyncSub) { this.seedSyncSub.unsubscribe(); }
    this._isAddingSubject.complete();
    this._selectedRowsSubject.complete();
    this._isSelectingSubject.complete();
    this.externalDestroy();
  }

  destroy() {
    this.disconnect();
  }

  startAdd() {
    this.addItem = this.getEmptyType();
    this._isAdding.set(true);
    this._isAddingSubject.next(true);
  }
  saveAdd() {
    this._isAdding.set(false);
    this._isAddingSubject.next(false);
  }
  cancelAdd() {
    this._isAdding.set(false);
    this._isAddingSubject.next(false);
  }

  selectedRowToggle(row: T, multiMode: boolean = true) {
    this.getRowState(row).pipe(
      first(),
      withLatestFrom(this.page$)
    ).subscribe(([rowState, filteredRows]) => {
      if (rowState.disabled) {
        return;
      }
      const currentSelection = new Map(this._selectedRows());
      const exists = currentSelection.has(this.getRowUniqueId(row));
      if (exists) {
        currentSelection.delete(this.getRowUniqueId(row));
        this.selectAllChecked = false;
      } else {
        if (!multiMode) {
          currentSelection.clear();
        }
        currentSelection.set(this.getRowUniqueId(row), row);
        this.selectAllChecked = multiMode && currentSelection.size === filteredRows.length;
      }
      this._selectedRows.set(currentSelection);
      this._selectedRowsSubject.next(currentSelection);
      const isSelecting = multiMode && currentSelection.size > 0;
      this._isSelecting.set(isSelecting);
      this._isSelectingSubject.next(isSelecting);
      // ZONELESS: Trigger change detection after async selection state update
      this.appRef?.tick();
    });
  }

  selectAllFilteredRows() {
    this.selectAllChecked = !this.selectAllChecked;

    const updatedAllRows$ = this.page$.pipe(switchMap((filterEntities: T[]) => {
      const currentSelection = new Map(this._selectedRows());
      return combineLatest(filterEntities.reduce((obs: Observable<RowState>[], row: T) => {
        obs.push(this.getRowState(row).pipe(
          first(),
          tap((rowState: RowState) => {
            if (rowState.disabled) {
              return;
            }
            if (this.selectAllChecked) {
              currentSelection.set(this.getRowUniqueId(row), row);
            } else {
              currentSelection.delete(this.getRowUniqueId(row));
            }
          })
        ));
        return obs;
      }, [] as Observable<RowState>[])).pipe(
        tap(() => {
          this._selectedRows.set(currentSelection);
          this._selectedRowsSubject.next(currentSelection);
        })
      );
    }));

    updatedAllRows$.pipe(
      first()
    ).subscribe(() => {
      const currentSelection = this._selectedRows();
      const isSelecting = currentSelection.size > 0;
      this._isSelecting.set(isSelecting);
      this._isSelectingSubject.next(isSelecting);
      // ZONELESS: Trigger change detection after async bulk selection update
      this.appRef?.tick();
    });

  }

  selectClear() {
    const emptyMap = new Map<string, T>();
    this._selectedRows.set(emptyMap);
    this._selectedRowsSubject.next(emptyMap);
    this._isSelecting.set(false);
    this._isSelectingSubject.next(false);
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

  trackBy = (index: number, item: T): string | number => {
    const id = this.getRowUniqueId(item);
    return id || JSON.stringify(item);
  }

  private attachTransformEntity(entities$: Observable<A[]>, entityLettable: OperatorFunction<A[], T[]> | null): Observable<T[]> {
    if (entityLettable) {
      return entities$.pipe(
        entityLettable
      );
    } else {
      // No transform means A === T, safe cast
      return entities$ as unknown as Observable<T[]>;
    }
  }

  private _connectObs: Observable<T[]>;
  connect(): Observable<T[]> {
    if (!this._connectObs) {
      this._connectObs = this.page$.pipe(
        tag('actual-page-obs')
      );
    }
    return this._connectObs;
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

  public updateMetricsAction(newAction: MetricsAction) {
    this.metricsAction = newAction;

    if (this.config.handleTimeWindowChange) {
      this.config.handleTimeWindowChange(newAction);
    } else {
      this.store.dispatch(newAction);
    }
  }

  public showAllAfterMax() {
    this.store.dispatch(new IgnorePaginationMaxedState(
      this.masterAction.entityType,
      this.masterAction.endpointType,
      this.masterAction.paginationKey
    ));
  }

  private createSortObservable(): Observable<ListSort> {
    return this.pagination$.pipe(
      filter(pag => !!pag && !!pag.params),
      map(pag => {
        const params = pag.params as Record<string, any>;
        return {
          direction: params['order-direction'] as SortDirection,
          field: params['order-direction-field'] as string
        };
      }),
      filter(x => !!x),
      distinctUntilChanged((x: ListSort, y: ListSort) => x.direction === y.direction && x.field === y.field),
      tag('list-sort')
    );
  }

  private createFilterObservable(): Observable<ListFilter> {
    return this.pagination$.pipe(
      filter(pag => !!pag && !!pag.clientPagination && !!pag.clientPagination.filter),
      map(pag => ({
        string: this.isLocal ? pag.clientPagination.filter.string : this.getFilterFromParams(pag),
        items: { ...pag.clientPagination.filter.items },
        filterKey: pag.clientPagination.filter.filterKey,
      })),
      tag('list-filter')
    );
  }
}
