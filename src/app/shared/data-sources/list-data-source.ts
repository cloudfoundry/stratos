import { getDataFunctionList } from './local-filtering-sorting';
import { OperatorFunction } from 'rxjs/interfaces';
import { getPaginationObservables } from './../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { resultPerPageParam, } from './../../store/reducers/pagination-reducer/pagination-reducer.types';
import { ListPagination, ListSort, ListFilter, ListView } from '../../store/actions/list.actions';
import { EntityInfo } from '../../store/types/api.types';
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
import { IListDataSource, getRowUniqueId } from './list-data-source-types';
import { map, debounceTime } from 'rxjs/operators';
import { withLatestFrom } from 'rxjs/operators';
import { composeFn } from '../../store/helpers/reducer.helper';
import { distinctUntilChanged } from 'rxjs/operators';
import { getListStateObservable, getListStateObservables, ListState } from '../../store/reducers/list.reducer';
export interface DataFunctionDefinition {
  type: 'sort' | 'filter';
  orderKey?: string;
  field: string;
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
  private pageSubscription: Subscription;
  private entityLettabledSubscription: Subscription;
  private paginationToStringFn: (PaginationEntityState) => string;

  constructor(
    protected _store: Store<AppState>,
    protected action: PaginatedAction,
    protected sourceScheme: schema.Entity,
    public getRowUniqueId: getRowUniqueId,
    private getEmptyType: () => T,
    public paginationKey: string,
    private entityLettable: OperatorFunction<A[], T[]> = null,
    public isLocal = false,
    public entityFunctions?: (DataFunction<T> | DataFunctionDefinition)[] // Config
  ) {
    super();
    this.addItem = this.getEmptyType();
    const { view, } = getListStateObservables(this._store, paginationKey);
    this.view$ = view;

    this.entityKey = sourceScheme.key;
    const { pagination$, entities$ } = getPaginationObservables({
      store: this._store,
      action: this.action,
      schema: [this.sourceScheme]
    },
      isLocal
    );

    const dataFunctions = entityFunctions ? getDataFunctionList(entityFunctions) : null;
    const letted$ = this.attatchEntityLettable(entities$, this.entityLettable);
    this.entityLettabledSubscription = letted$.do(items => this.entityLettabledRows = items).subscribe();

    if (isLocal) {
      this.page$ = this.getLocalPagesObservable(letted$, pagination$, dataFunctions);
    } else {
      this.page$ = letted$;
    }
    this.pageSubscription = this.page$.do(items => this.filteredRows = items).subscribe();

    this.pagination$ = pagination$;
    this.isLoadingPage$ = this.pagination$.map((pag: PaginationEntityState) => pag.fetching);
  }

  disconnect() { }
  destroy() {
    this.pageSubscription.unsubscribe();
    this.entityLettabledSubscription.unsubscribe();
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
    return page$.pipe(
      withLatestFrom(pagination$),
      distinctUntilChanged((oldVals, newVals) => {
        const oldVal = this.getPaginationCompareString(oldVals[1]);
        const newVal = this.getPaginationCompareString(newVals[1]);
        return oldVal === newVal;
      }),
      debounceTime(10),
      map(([entities, paginationEntity]) => {
        if (dataFunctions && dataFunctions.length) {
          entities = dataFunctions.reduce((value, fn) => {
            return fn(value, paginationEntity);
          }, entities);
        }
        const pages = this.splitClientPages(entities, paginationEntity.clientPagination.pageSize);
        if (paginationEntity.totalResults !== entities.length || paginationEntity.clientPagination.totalResults !== entities.length) {
          this._store.dispatch(new SetResultCount(this.entityKey, this.paginationKey, entities.length));
        }
        // Are we on a page with no items (for instance on page 20, filter has been applied reducing item count to 4 items)?
        let pageIndex = paginationEntity.clientPagination.currentPage - 1;
        if (entities.length <= pageIndex * paginationEntity.clientPagination.pageSize) {
          // Filtered results contain too few items to show on current page, move current page to last page of filtered items
          pageIndex = Math.floor(entities.length / paginationEntity.clientPagination.pageSize) - 1;
          if (pageIndex < 0) {
            pageIndex = 0; // If there's zero results ensure we don't set an invalid page number
          }
          this._store.dispatch(new SetClientPage(this.entityKey, this.paginationKey, pageIndex + 1));
        }

        return pages[pageIndex];
      })
    );
  }

  getPaginationCompareString(paginationEntity: PaginationEntityState) {
    return Object.values(paginationEntity.clientPagination).join('.')
      + paginationEntity.params['order-direction-field']
      + paginationEntity.params['order-direction']
      + paginationEntity.fetching; // Some outlier cases actually fetch independently from this list (looking at you app variables)
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
  public setFilterParam(filter: ListFilter, pag: PaginationEntityState) {
    // If data source is not local then this method must be overridden
  }
}
