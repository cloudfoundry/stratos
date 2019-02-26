/* tslint:disable:no-access-missing-member https://github.com/mgechev/codelyzer/issues/191*/
import { Component, OnInit } from '@angular/core';
import { TableCellCustom } from '../../../list.types';

@Component({
  selector: 'app-table-cell-autoscaler-event-type',
  templateUrl: './table-cell-autoscaler-event-type.component.html',
  styleUrls: ['./table-cell-autoscaler-event-type.component.scss']
})
export class TableCellAutoscalerEventTypeComponent<T> extends TableCellCustom<T> { }
