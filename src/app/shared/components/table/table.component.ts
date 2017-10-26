import { ITableDataSource, TableDataSource } from '../../data-sources/table-data-source';
import { Component, ContentChild, EventEmitter, Input, OnInit, Renderer2, ViewChild } from '@angular/core';
import { DataSource } from '@angular/cdk/table';
import { MdPaginator, MdSort, Sort, MdTable } from '@angular/material';
import { NgModel } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import { CfTableDataSource } from '../../data-sources/table-data-source-cf';
import { StandardTableDataSource } from '../../data-sources/table-data-source-standard';

// type AcceptableTable<T extends object> = CfTableDataSource<T> | StandardTableDataSource<T>;

export interface TableColumn<T> {
  columnDef: string;
  cell?: (row: T) => string;
  cellComponent?: any;
  header?: (row: T) => string;
  headerComponent?: any;
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
  // @Input('sort') sort = new EventEmitter<any>(); // TODO: REPLACE WITH MdSort (now that sort and table are together)
  @ViewChild(MdSort) sort: MdSort;
  @ViewChild('filter') filter: NgModel;


  @Input('dataSource') dataSource = null as ITableDataSource; // See https://github.com/angular/angular-cli/issues/2034 for weird definition
  @Input('columns') columns: TableColumn<T>[];
  private columnNames: string[];

  @Input('title') title: string;
  @Input('enableAdd') enableAdd = false;
  @Input('enableFilter') enableFilter = false;
  @Input('fixedRowHeight') fixedRowHeight = false;

  // @ContentChild(MdTable) table: MdTable<T>;

  constructor() { }

  ngOnInit() {
    const filter: Observable<string> = this.filter.valueChanges
      .debounceTime(150)
      .distinctUntilChanged()
      .map(value => value as string);
    this.dataSource.initialise(this.paginator, this.sort, filter);
    this.columnNames = this.columns.map(x => x.columnDef);
  }
}
