import { Component, OnInit } from '@angular/core';
import { ITableDataSource } from '../../../data-sources/table-data-source';

@Component({
  selector: 'app-table-header-select',
  templateUrl: './table-header-select.component.html',
  styleUrls: ['./table-header-select.component.scss']
})
export class TableHeaderSelectComponent implements OnInit {

  dataSource = null as ITableDataSource;
  row: any;

  constructor() { }

  ngOnInit() {
  }

}
