import { Component, OnInit } from '@angular/core';
import { ITableDataSource } from '../../../../../shared/data-sources/table-data-source';
import { TableCellCustom } from '../../table-cell/table-cell-custom';

@Component({
  selector: 'app-table-cell-edit-variable',
  templateUrl: './table-cell-edit-variable.component.html',
  styleUrls: ['./table-cell-edit-variable.component.scss']
})
export class TableCellEditVariableComponent<T> extends TableCellCustom<T> { }
