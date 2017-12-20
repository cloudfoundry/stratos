import { PaginationState, PaginationEntityState } from './../../store/types/pagination.types';
import { IListDataSource } from './list-data-source-types';
import { Type } from '@angular/core';
import { DataSource } from '@angular/cdk/table';
import { Observable, Subscribable } from 'rxjs/Observable';
import { Sort, MatPaginator, MatSort } from '@angular/material';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Store, Action } from '@ngrx/store';
import { Subscription } from 'rxjs/Subscription';
import { schema } from 'normalizr';
import { AppState } from '../../store/app-state';
import { getListStateObservable, ListState, getListStateObservables } from '../../store/reducers/list.reducer';
import { ListFilter, ListPagination, ListSort, SetListStateAction, ListView } from '../../store/actions/list.actions';
export type getRowUniqueId = (T) => string;

export abstract class ListDataSource<T> extends DataSource<T> implements IListDataSource<T> {

  public view$: Observable<ListView>;
  public state$: Observable<ListState>;
  public pagination$: Observable<PaginationEntityState>;
  public sort$: Observable<ListSort>;
  public filter$: Observable<ListFilter>;
  public page$: Observable<T[]>;

  public entityKey: string;
  public paginationKey: string;


  public abstract isLoadingPage$: Observable<boolean>;
  public abstract filteredRows: Array<T>;

  public addItem: T;
  public isAdding$ = new BehaviorSubject<boolean>(false);

  public selectedRows = new Map<string, T>();
  public isSelecting$ = new BehaviorSubject(false);
  public selectAllChecked = false;

  public editRow: T;

  constructor(
    private _store: Store<AppState>,
    private _getRowUniqueId: getRowUniqueId,
    private getEmptyType: () => T,
    public listStateKey: string,
  ) {
    super();
    this.addItem = this.getEmptyType();

    this.state$ = getListStateObservable(this._store, listStateKey);
    const { view, pagination, sort, filter } = getListStateObservables(this._store, listStateKey);
    this.view$ = view;
    // this.clientPagination$ = pagination.filter(x => !!x);
    this.sort$ = sort.filter(x => !!x).distinctUntilChanged((x, y) => {
      return x.direction === y.direction && x.field === y.field;
    });
    this.filter$ = filter.filter(x => !!x);
  }

  abstract connect(): Observable<T[]>;
  disconnect() { }
  destroy() { }

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

}
