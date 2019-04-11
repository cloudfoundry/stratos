import { Component, OnInit } from '@angular/core';
import { TableCellCustom } from '../../../../../../shared/components/list/list.types';

@Component({
  selector: 'app-table-cell-autoscaler-event-status',
  templateUrl: './table-cell-autoscaler-event-status.component.html',
  styleUrls: ['./table-cell-autoscaler-event-status.component.scss']
})
export class TableCellAutoscalerEventStatusComponent<T> extends TableCellCustom<T> { }
