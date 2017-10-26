import { Component, OnInit } from '@angular/core';
import { ITableCellComponent } from '../table-cell/table-cell.component';
import { ITableDataSource } from '../../data-sources/table-data-source';

@Component({
  selector: 'app-table-cell-edit',
  templateUrl: './table-cell-edit.component.html',
  styleUrls: ['./table-cell-edit.component.scss']
})
export class TableCellEditComponent implements OnInit, ITableCellComponent<any> {

  dataSource = null as ITableDataSource;
  row: any;

  constructor() { }

  ngOnInit() {
  }

}
