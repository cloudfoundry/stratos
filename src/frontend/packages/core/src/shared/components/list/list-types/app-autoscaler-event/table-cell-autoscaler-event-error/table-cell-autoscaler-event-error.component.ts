/* tslint:disable:no-access-missing-member https://github.com/mgechev/codelyzer/issues/191*/
import { Component, OnInit } from '@angular/core';
import { TableCellCustom } from '../../../list.types';

@Component({
  selector: 'app-table-cell-autoscaler-event-error',
  templateUrl: './table-cell-autoscaler-event-error.component.html',
  styleUrls: ['./table-cell-autoscaler-event-error.component.scss']
})
export class TableCellAutoscalerEventErrorComponent<T> extends TableCellCustom<T> { }
