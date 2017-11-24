import { Component, OnInit } from '@angular/core';
import { TableCellCustom } from '../../table-cell/table-cell-custom';

@Component({
  selector: 'app-table-cell-endpoint-status',
  templateUrl: './table-cell-endpoint-status.component.html',
  styleUrls: ['./table-cell-endpoint-status.component.scss']
})
export class TableCellEndpointStatusComponent<T> extends TableCellCustom<T> { }
