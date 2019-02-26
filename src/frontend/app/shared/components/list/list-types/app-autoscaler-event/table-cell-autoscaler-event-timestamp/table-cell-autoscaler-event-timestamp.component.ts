/* tslint:disable:no-access-missing-member https://github.com/mgechev/codelyzer/issues/191*/
import { Component, OnInit } from '@angular/core';
import { TableCellCustom } from '../../../list.types';

@Component({
  selector: 'app-table-cell-autoscaler-event-timestamp',
  templateUrl: './table-cell-autoscaler-event-timestamp.component.html',
  styleUrls: ['./table-cell-autoscaler-event-timestamp.component.scss']
})
export class TableCellAutoscalerEventTimestampComponent<T> extends TableCellCustom<T> { }
