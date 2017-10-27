import { Component, OnInit } from '@angular/core';
import { ITableDataSource } from '../../../data-sources/table-data-source';
import { TableCellCustom } from '../table-cell/table-cell-custom';

@Component({
  selector: 'app-table-cell-edit',
  templateUrl: './table-cell-edit.component.html',
  styleUrls: ['./table-cell-edit.component.scss']
})
export class TableCellEditComponent<T> extends TableCellCustom<T> { }
