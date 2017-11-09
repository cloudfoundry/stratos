import { Type } from '@angular/core';
import { ObserveOnSubscriber } from 'rxjs/operator/observeOn';
import { DataSource } from '@angular/cdk/table';
import { Observable, Subscribable } from 'rxjs/Observable';
import { Sort, MdPaginator, MdSort } from '@angular/material';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Store, Action } from '@ngrx/store';
import { Subscription } from 'rxjs/Subscription';
import { schema } from 'normalizr';
import { AppState } from '../../store/app-state';
import { getListStateObservable, ListState, getListStateObservables } from '../../store/reducers/list.reducer';
import { ListFilter, ListPagination, ListSort, SetListStateAction, ListView } from '../../store/actions/list.actions';

// TODO: RC MOVE
export class ListActionConfig<T> {
  createAction: (dataSource: IListDataSource<T>, items: T[]) => Action;
  icon: string;
  label: string;
  description: string;
  visible: (row: T) => boolean;
  enabled: (row: T) => boolean;
}
export class ListActions<T> {
  globalActions = new Array<ListActionConfig<T>>();
  multiActions = new Array<ListActionConfig<T>>();
  singleActions = new Array<ListActionConfig<T>>();
}
export interface IListDataSource<T> {
  listStateKey: string;
  view$: Observable<ListView>;
  state$: Observable<ListState>;
  pagination$: Observable<ListPagination>;
  sort$: Observable<ListSort>;
  filter$: Observable<ListFilter>;

  actions: ListActions<T>;

  page$: Observable<T[]>;

  addItem: T;
  isAdding$: BehaviorSubject<boolean>;
  isSelecting$: BehaviorSubject<boolean>;

  editRow: T; // Edit items - remove once ng-content can exist in md-table

  selectAllChecked: boolean; // Select items - remove once ng-content can exist in md-table
  selectedRows: Map<string, T>; // Select items - remove once ng-content can exist in md-table
  selectAllFilteredRows(); // Select items - remove once ng-content can exist in md-table
  selectedRowToggle(row: T); // Select items - remove once ng-content can exist in md-table

  startEdit(row: T); // Edit items - remove once ng-content can exist in md-table
  saveEdit(); // Edit items - remove once ng-content can exist in md-table
  cancelEdit(); // Edit items - remove once ng-content can exist in md-table

  connect(): Observable<T[]>;
  destroy();
}




export type getRowUniqueId = (T) => string;

export abstract class ListDataSource<T extends object> extends DataSource<T> implements IListDataSource<T> {

  public view$: Observable<ListView>;
  public state$: Observable<ListState>;
  public pagination$: Observable<ListPagination>;
  public sort$: Observable<ListSort>;
  public filter$: Observable<ListFilter>;
  public page$: Observable<T[]>;

  public abstract actions: ListActions<T>;

  public abstract isLoadingPage$: Observable<boolean>;
  public abstract filteredRows: Array<T>;

  public addItem: T;
  protected selectRow: T;
  public isAdding$ = new BehaviorSubject<boolean>(false);

  public selectedRows = new Map<string, T>();
  public isSelecting$ = new BehaviorSubject(false);
  public selectAllChecked = false;

  public editRow: T;

  constructor(
    private _store: Store<AppState>,
    private _getRowUniqueId: getRowUniqueId,
    private _emptyType: T,
    public listStateKey: string,
  ) {
    super();
    this.addItem = { ... (_emptyType as object) } as T;

    this.state$ = getListStateObservable(this._store, listStateKey);
    const { view, pagination, sort, filter } = getListStateObservables(this._store, listStateKey);
    this.view$ = view;
    this.pagination$ = pagination.filter(x => !!x);
    this.sort$ = sort.filter(x => !!x).distinctUntilChanged((x, y) => {
      return x.direction === y.direction && x.field === y.field;
    });
    this.filter$ = filter.filter(x => !!x);
  }

  abstract connect(): Observable<T[]>;
  disconnect() { }
  destroy() { }

  startAdd() {
    this.addItem = { ... (this._emptyType as object) } as T;
    this.isAdding$.next(true);
  }
  saveAdd() {
    this.selectRow = this.addItem;
    this.isAdding$.next(false);
  }
  cancelAdd() {
    this.isAdding$.next(false);
  }

  selectedRowToggle(row: T) {
    const exists = this.selectedRows.has(this._getRowUniqueId(row));
    if (exists) {
      this.selectedRows.delete(this._getRowUniqueId(row));
    } else {
      this.selectedRows.set(this._getRowUniqueId(row), row);
    }
    this.isSelecting$.next(this.selectedRows.size > 0);
  }
  selectAllFilteredRows() {
    this.selectAllChecked = !this.selectAllChecked;
    for (const row of this.filteredRows) {
      if (this.selectAllChecked) {
        this.selectedRows.set(this._getRowUniqueId(row), row);
      } else {
        this.selectedRows.delete(this._getRowUniqueId(row));
      }
    }
    this.isSelecting$.next(this.selectedRows.size > 0);
  }
  protected selectClear() {
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

}
