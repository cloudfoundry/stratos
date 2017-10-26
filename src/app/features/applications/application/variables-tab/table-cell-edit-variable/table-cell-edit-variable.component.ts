import { Component, OnInit } from '@angular/core';
import { ITableCellComponent } from '../../../../../shared/components/table/table-cell/table-cell.component';
import { ITableDataSource } from '../../../../../shared/data-sources/table-data-source';

@Component({
  selector: 'app-table-cell-edit-variable',
  templateUrl: './table-cell-edit-variable.component.html',
  styleUrls: ['./table-cell-edit-variable.component.scss']
})
export class TableCellEditVariableComponent implements OnInit, ITableCellComponent<any> {

  dataSource = null as ITableDataSource;
  row: any;

  constructor() { }

  ngOnInit() {
  }

}
