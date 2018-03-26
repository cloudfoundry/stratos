import { DataSource } from '@angular/cdk/table';
import { Store } from '@ngrx/store';
import { schema } from 'normalizr';
import { tag } from 'rxjs-spy/operators/tag';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { OperatorFunction } from 'rxjs/interfaces';
import { Observable } from 'rxjs/Observable';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { distinctUntilChanged, filter, map, pairwise, publishReplay, refCount, shareReplay, tap } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { CreatePagination, SetResultCount } from '../../../../store/actions/pagination.actions';
import { AppState } from '../../../../store/app-state';
import {
  getCurrentPageRequestInfo,
  getPaginationObservables,
} from '../../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { selectPaginationState } from '../../../../store/selectors/pagination.selectors';
import { PaginatedAction, PaginationEntityState } from '../../../../store/types/pagination.types';
import { PaginationMonitor } from '../../../monitors/pagination-monitor';
import { IListDataSourceConfig } from './list-data-source-config';
import { getDefaultRowState, getRowUniqueId, IListDataSource, RowsState } from './list-data-source-types';
import { getDataFunctionList } from './local-filtering-sorting';

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
    this.page$ = this.isLocal ?
      this.getLocalPagesObservable(transformedEntities$, pagination$, dataFunctions)
      : transformedEntities$.pipe(shareReplay(1));

    this.pageSubscription = this.page$.do(items => this.filteredRows = items).subscribe();
    this.pagination$ = pagination$;
    this.isLoadingPage$ = paginationMonitor.fetchingCurrentPage$;
  }

  init(config: IListDataSourceConfig<A, T>) {
    this.store = config.store;
    this.action = config.action;
    this.sourceScheme = config.schema;
    this.getRowUniqueId = config.getRowUniqueId;
    this.getEmptyType = config.getEmptyType ? config.getEmptyType : () => ({} as T);
    this.paginationKey = config.paginationKey;
    this.transformEntity = config.transformEntity;
    this.isLocal = config.isLocal || false;
    this.transformEntities = config.transformEntities;
    this.rowsState = config.rowsState ? config.rowsState.pipe(
      shareReplay(1)
    ) : Observable.of({}).first();
    this.externalDestroy = config.destroy || (() => { });
    this.addItem = this.getEmptyType();
    this.entityKey = this.sourceScheme.key;
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

  getLocalPagesObservable(page$, pagination$: Observable<PaginationEntityState>, dataFunctions) {
    return combineLatest(
      pagination$,
      page$
    ).pipe(
      tap(([paginationEntity]) => {
        // If the list pagination is seeded, keep it synced with it's seed.
        if (paginationEntity.seed && !this.seedSyncSub) {
          this.seedSyncSub = this.store.select(selectPaginationState(this.entityKey, paginationEntity.seed))
            .pipe(
              pairwise(),
              filter(([oldPag, newPag]) => {
                return oldPag.ids !== newPag.ids ||
                  oldPag.pageRequests !== newPag.pageRequests;
              })
            )
            .map(pag => pag[1])
            .subscribe(pag => {
              this.store.dispatch(new CreatePagination(
                this.entityKey,
                this.paginationKey,
                paginationEntity.seed
              ));
            });
        }
      }),
      filter(([paginationEntity, entities]) => !getCurrentPageRequestInfo(paginationEntity).busy),
      map(([paginationEntity, entities]) => {
        if (entities && !entities.length) {
          return [];
        }

        if (dataFunctions && dataFunctions.length) {
          entities = dataFunctions.reduce((value, fn) => {
            return fn(value, paginationEntity);
          }, entities);
        }

        const pages = this.splitClientPages(entities, paginationEntity.clientPagination.pageSize);
        // Note - ensure we don't also include the entities count pre/post reduce (fails for local pagination - specifically when a filter
        // resets to include all entities)
        if (paginationEntity.totalResults !== entities.length || paginationEntity.clientPagination.totalResults !== entities.length) {
          this.store.dispatch(new SetResultCount(this.entityKey, this.paginationKey, entities.length));
        }

        const pageIndex = paginationEntity.clientPagination.currentPage - 1;
        return pages[pageIndex];
      }),
      publishReplay(1),
      refCount(),
      tag('local-list')
    );
  }

  getPaginationCompareString(paginationEntity: PaginationEntityState) {
    return Object.values(paginationEntity.clientPagination).join('.')
      + paginationEntity.params['order-direction-field']
      + paginationEntity.params['order-direction']
      + paginationEntity.clientPagination.filter.string
      + Object.values(paginationEntity.clientPagination.filter.items)
      + getCurrentPageRequestInfo(paginationEntity).busy;
    // Some outlier cases actually fetch independently from this list (looking at you app variables)
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
