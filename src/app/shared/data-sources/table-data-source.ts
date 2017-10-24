import { ObserveOnSubscriber } from 'rxjs/operator/observeOn';
import { DataSource } from '@angular/cdk/table';
import { Observable, Subscribable } from 'rxjs/Observable';
import { Sort, MdPaginator, MdSort } from '@angular/material';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs/Subscription';
import { schema } from 'normalizr';
import { AppState } from '../../store/app-state';

export interface ITableDataSource {
  // selectedRows: Map<string, any>;
  // mdPaginator
  initialise(paginator: MdPaginator, sort: Observable<Sort>, filter$: Observable<string>);
  connect(): Observable<any>;
  disconnect();
}

export abstract class TableDataSource<T extends object> extends DataSource<T> {

  private paginationSub: Subscription;

  protected pageSize$: Observable<number>;
  protected sort$: Observable<Sort>;
  protected pageIndex$: Observable<number>;
  protected filter$: Observable<string>;

  public abstract isLoadingPage$: Observable<boolean>;
  public abstract filteredRows: Array<T>;

  public addRow: T;
  protected selectRow: T;
  public isAdding$ = new BehaviorSubject(false);

  public selectedRows = new Map<string, T>();
  public isSelecting$ = new BehaviorSubject(false);
  public selectAllChecked = false;

  public editRow: T;

  constructor(
    private store: Store<AppState>,
    private _typeId: string,
    private _emptyType: T,
  ) {
    super();
    // this._mdPaginator.pageIndex = 0;
    // this._mdPaginator.pageSizeOptions = [5, 10, 20];
    this.addRow = { ... (_emptyType as object) } as T;
  }

  abstract connect(): Observable<T[]>;
  disconnect() {
    this.paginationSub.unsubscribe();
  }


  protected startAdd() {
    this.addRow = { ... (this._emptyType as object) } as T;
    this.isAdding$.next(true);
  }
  protected saveAdd() {
    this.selectRow = this.addRow;
    this.isAdding$.next(false);
  }
  protected cancelAdd() {
    this.isAdding$.next(false);
  }

  protected selectedRowToggle(row: T) {
    const exists = this.selectedRows.has(row[this._typeId]);
    if (exists) {
      this.selectedRows.delete(row[this._typeId]);
    } else {
      this.selectedRows.set(row[this._typeId], row);
    }
    this.isSelecting$.next(this.selectedRows.size > 0);
  }
  protected selectAllFilteredRows(selectAll) {
    this.selectAllChecked = !this.selectAllChecked;
    for (const row of this.filteredRows) {
      if (this.selectAllChecked) {
        this.selectedRows.set(row[this._typeId], row);
      } else {
        this.selectedRows.delete(row[this._typeId]);
      }
    }
    this.isSelecting$.next(this.selectedRows.size > 0);
  }
  protected selectedDelete() {
    this.selectedRows.clear();
    this.isSelecting$.next(false);
  }

  protected startEdit(rowClone: T) {
    this.editRow = rowClone;
  }
  protected saveEdit() {
    delete this.editRow;
  }
  protected cancelEdit() {
    delete this.editRow;
  }

  public mdPaginator: MdPaginator;
  // protected _sort$: Observable<Sort>;
  protected initialise(paginator: MdPaginator, sort: Observable<Sort>, filter$: Observable<string>) {
    this.mdPaginator = paginator;
    this.sort$ = sort;

    this.pageSize$ = this.mdPaginator.page.map(pageEvent => pageEvent.pageSize).distinctUntilChanged();
    // this._mdPaginator.page.map(pageEvent => pageEvent.pageSize).distinctUntilChanged();
    this.mdPaginator.pageSizeOptions = [5, 10, 20];

    // this.sort$ = this._sort$.mdSortChange;

    this.pageIndex$ = this.mdPaginator.page.map(pageEvent => pageEvent.pageIndex).distinctUntilChanged();

    this.paginationSub = Observable.combineLatest(
      this.pageSize$,
      this.pageIndex$
    ).subscribe();

    this.filter$ = filter$;
  }
}
