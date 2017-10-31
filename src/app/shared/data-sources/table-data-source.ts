import { ObserveOnSubscriber } from 'rxjs/operator/observeOn';
import { DataSource } from '@angular/cdk/table';
import { Observable, Subscribable } from 'rxjs/Observable';
import { Sort, MdPaginator, MdSort } from '@angular/material';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs/Subscription';
import { schema } from 'normalizr';
import { AppState } from '../../store/app-state';

export interface ITableDataSource<T> {
  mdPaginator: MdPaginator;
  addRow;
  isAdding$: BehaviorSubject<boolean>;
  isSelecting$: BehaviorSubject<boolean>;

  editRow: any; // Edit items - remove once ng-content can exist in md-table

  selectAllChecked: boolean; // Select items - remove once ng-content can exist in md-table
  selectedRows: Map<string, any>; // Select items - remove once ng-content can exist in md-table
  selectAllFilteredRows(); // Select items - remove once ng-content can exist in md-table
  selectedRowToggle(row: any); // Select items - remove once ng-content can exist in md-table

  startEdit(row); // Edit items - remove once ng-content can exist in md-table
  saveEdit(); // Edit items - remove once ng-content can exist in md-table
  cancelEdit(); // Edit items - remove once ng-content can exist in md-table

  initialise(paginator: MdPaginator, sort: MdSort, filter$: Observable<string>);
  connect(): Observable<any>;
  disconnect();
}

export type getRowUniqueId = (T) => string;

export abstract class TableDataSource<T extends object> extends DataSource<T> implements ITableDataSource<T> {

  private paginationSub: Subscription;

  protected pageSize$: Observable<number>;
  protected sort$: Observable<Sort>;
  protected pageIndex$: Observable<number>;
  protected filter$: Observable<string>;

  public abstract isLoadingPage$: Observable<boolean>;
  public abstract filteredRows: Array<T>;

  public addRow: T;
  protected selectRow: T;
  public isAdding$ = new BehaviorSubject<boolean>(false);

  public selectedRows = new Map<string, T>();
  public isSelecting$ = new BehaviorSubject(false);
  public selectAllChecked = false;

  public editRow: T;

  public mdPaginator: MdPaginator;

  constructor(
    private store: Store<AppState>,
    private _getRowUniqueId: getRowUniqueId,
    private _emptyType: T,
  ) {
    super();
    this.addRow = { ... (_emptyType as object) } as T;
  }

  abstract connect(): Observable<T[]>;
  disconnect() {
    this.paginationSub.unsubscribe();
  }


  startAdd() {
    this.addRow = { ... (this._emptyType as object) } as T;
    this.isAdding$.next(true);
  }
  saveAdd() {
    this.selectRow = this.addRow;
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
  protected selectedDelete() {
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

  initialise(paginator: MdPaginator, sort: MdSort, filter$: Observable<string>) {
    this.mdPaginator = paginator;
    this.sort$ = sort.mdSortChange;

    this.pageSize$ = this.mdPaginator.page.map(pageEvent => pageEvent.pageSize).distinctUntilChanged();
    // this._mdPaginator.page.map(pageEvent => pageEvent.pageSize).distinctUntilChanged();
    this.mdPaginator.pageSizeOptions = [5, 10, 20];

    // this.sort$ = this._sort$.mdSortChange;

    this.pageIndex$ = this.mdPaginator.page.map(pageEvent => pageEvent.pageIndex).distinctUntilChanged();

    this.paginationSub = Observable.combineLatest(
      this.pageSize$,
      this.pageIndex$
    ).subscribe();

    this.filter$ = filter$.debounceTime(250);
  }
}
