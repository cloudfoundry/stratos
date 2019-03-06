/* tslint:disable:no-access-missing-member https://github.com/mgechev/codelyzer/issues/191*/
import { Component, OnInit } from '@angular/core';
import { TableCellCustom } from '../../../list.types';

@Component({
  selector: 'app-table-cell-autoscaler-event-status',
  templateUrl: './table-cell-autoscaler-event-status.component.html',
  styleUrls: ['./table-cell-autoscaler-event-status.component.scss']
})
export class TableCellAutoscalerEventStatusComponent<T> extends TableCellCustom<T> { }
