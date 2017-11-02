import {
  ListFilter,
  ListPagination,
  ListSort,
  SetListFilterAction,
  SetListPaginationAction,
  SetListSortAction,
  SetListStateAction,
} from '../../../store/actions/list.actions';
import { ITableDataSource, TableDataSource } from '../../data-sources/table-data-source';
import { Component, ContentChild, EventEmitter, Input, OnInit, Renderer2, ViewChild } from '@angular/core';
import { DataSource } from '@angular/cdk/table';
import { MdPaginator, MdSort, Sort, MdTable, PageEvent } from '@angular/material';
import { NgModel, NgForm } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import { CfTableDataSource } from '../../data-sources/table-data-source-cf';
import { StandardTableDataSource } from '../../data-sources/table-data-source-standard';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app-state';

export interface TableColumn<T> {
  columnId: string;
  cell?: (row: T) => string; // Either cell OR cellComponent should be defined
  cellComponent?: any;
  headerCell?: (row: T) => string; // Either headerCell OR headerCellComponent should be defined
  headerCellComponent?: any;
  class?: string;
  sort?: {
    disableClear: boolean;
  };
}

export interface TableText {
  title: string;
  filter?: string;
}

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})
export class TableComponent<T extends object> implements OnInit {

  @ViewChild(MdPaginator) paginator: MdPaginator;
  @ViewChild(MdSort) sort: MdSort;
  @ViewChild('filter') filter: NgModel;

  // See https://github.com/angular/angular-cli/issues/2034 for weird definition
  @Input('dataSource') dataSource = null as ITableDataSource<T>;
  @Input('columns') columns: TableColumn<T>[];
  private columnNames: string[];

  @Input('text') text: TableText;
  @Input('enableFilter') enableFilter = false;
  @Input('fixedRowHeight') fixedRowHeight = false;
  @Input('addForm') addForm: NgForm;
  public safeAddForm() {
    // Something strange is afoot. When using addform in [disabled] it thinks this is null, even when initialised
    // When applying the question mark (addForm?) it's value is ignored by [disabled]
    return this.addForm || {};
  }

  constructor(
    private _store: Store<AppState>,
  ) { }

  ngOnInit() {
    const filter: Observable<string> = this.filter.valueChanges
      .debounceTime(150)
      .distinctUntilChanged()
      .map(value => value as string);
    // this.dataSource.initialise(this.paginator, this.sort, filter);
    this.columnNames = this.columns.map(x => x.columnId);

    // TODO: RC unsub
    this.dataSource.listPagination$.subscribe((pagination: ListPagination) => {
      this.paginator.length = pagination.totalResults;
      this.paginator.pageIndex = pagination.pageIndex;
      this.paginator.pageSize = pagination.pageSize;
      this.paginator.pageSizeOptions = pagination.pageSizeOptions;
    });

    // TODO: RC unsub
    this.paginator.page.subscribe((page: PageEvent) => {
      this._store.dispatch(new SetListPaginationAction(
        this.dataSource.listStateKey,
        {
          pageSize: page.pageSize,
          pageIndex: page.pageIndex,
        }
      ));
    });

    // TODO: RC unsub
    this.dataSource.listSort$.subscribe((sort: ListSort) => {
      this.sort.active = sort.field;
      this.sort.direction = sort.direction;
      this.sort.disableClear = sort.disableClear;
    });

    // TODO: RC unsub
    this.sort.mdSortChange.subscribe((sort: Sort) => {
      this._store.dispatch(new SetListSortAction(
        this.dataSource.listStateKey,
        {
          field: sort.active,
          direction: sort.direction as 'asc' | 'desc',
        }
      ));
    });

    // TODO: RC unsub
    this.dataSource.listFilter$.subscribe((filter: ListFilter) => {
      this.filter.model = filter.filter;
    });

    this.filter.valueChanges
      .debounceTime(150)
      .distinctUntilChanged()
      .map(value => value as string)
      .subscribe((stFilter: string) => {
        this._store.dispatch(new SetListFilterAction(
          this.dataSource.listStateKey,
          {
            filter: stFilter
          }
        ));
      });

  }
}
