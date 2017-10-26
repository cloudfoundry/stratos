import { ITableCellComponent } from '../table-cell/table-cell.component';
import { Component, OnInit } from '@angular/core';
import { ITableDataSource } from '../../../data-sources/table-data-source';

@Component({
  selector: 'app-table-cell-select',
  templateUrl: './table-cell-select.component.html',
  styleUrls: ['./table-cell-select.component.scss']
})
export class TableCellSelectComponent implements OnInit, ITableCellComponent<any> {

  dataSource = null as ITableDataSource;
  row: any;

  constructor() { }

  ngOnInit() {
  }

}
