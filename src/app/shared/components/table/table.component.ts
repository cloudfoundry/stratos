import { ITableDataSource, TableDataSource } from '../../data-sources/table-data-source';
import { Component, ContentChild, EventEmitter, Input, OnInit, Renderer2, ViewChild } from '@angular/core';
import { DataSource } from '@angular/cdk/table';
import { MdPaginator, MdSort, Sort, MdTable } from '@angular/material';
import { NgModel, NgForm } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import { CfTableDataSource } from '../../data-sources/table-data-source-cf';
import { StandardTableDataSource } from '../../data-sources/table-data-source-standard';

export interface TableColumn<T> {
  columnId: string;
  cell?: (row: T) => string;// Either cell OR cellComponent should be defined
  cellComponent?: any;
  headerCell?: (row: T) => string;// Either headerCell OR headerCellComponent should be defined
  headerCellComponent?: any;
  class?: string;
  sort?: {
    disableClear: boolean;
  };
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

  @Input('title') title: string;
  @Input('enableFilter') enableFilter = false;
  @Input('fixedRowHeight') fixedRowHeight = false;
  @Input('addForm') addForm: NgForm;
  private safeAddForm() {
    // Something strange is afoot. When using addform in [disabled] it thinks this is null, even when initialised
    // When applying the question mark (addForm?) it's value is ignored by [disabled]
    return this.addForm || {};
  }

  constructor() { }

  ngOnInit() {
    const filter: Observable<string> = this.filter.valueChanges
      .debounceTime(150)
      .distinctUntilChanged()
      .map(value => value as string);
    this.dataSource.initialise(this.paginator, this.sort, filter);
    this.columnNames = this.columns.map(x => x.columnId);
  }
}
