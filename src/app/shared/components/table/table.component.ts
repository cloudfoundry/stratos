import { ITableDataSource, TableDataSource } from '../../data-sources/table-data-source';
import { Component, EventEmitter, Input, OnInit, ViewChild } from '@angular/core';
import { DataSource } from '@angular/cdk/table';
import { MdPaginator, MdSort, Sort } from '@angular/material';
import { NgModel } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import { CfTableDataSource } from '../../data-sources/table-data-source-cf';
import { StandardTableDataSource } from '../../data-sources/table-data-source-standard';

// type AcceptableTable<T extends object> = CfTableDataSource<T> | StandardTableDataSource<T>;

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})
export class TableComponent<T extends object> implements OnInit {

  @ViewChild(MdPaginator) paginator: MdPaginator;
  // @ViewChild(MdSort) sort: MdSort;
  @ViewChild('filter') filter: NgModel;

  // See https://github.com/angular/angular-cli/issues/2034 for weird definition
  @Input('dataSource') dataSource = null as ITableDataSource;
  // @Input('sort') sort: MdSort;
  // @Input('hmmm') hmmm: any;

  @Input('sort') sort = new EventEmitter<any>();

  constructor() { }

  ngOnInit() {
    const filter: Observable<string> = this.filter.valueChanges
      .debounceTime(150)
      .distinctUntilChanged()
      .map(value => value as string);
    this.dataSource.initialise(this.paginator, this.sort.asObservable(), filter);

  }

}
