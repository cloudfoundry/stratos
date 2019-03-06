/* tslint:disable:no-access-missing-member https://github.com/mgechev/codelyzer/issues/191*/
import { Component, OnInit } from '@angular/core';
import { TableCellCustom } from '../../../list.types';

@Component({
  selector: 'app-table-cell-autoscaler-event-action',
  templateUrl: './table-cell-autoscaler-event-action.component.html',
  styleUrls: ['./table-cell-autoscaler-event-action.component.scss']
})
export class TableCellAutoscalerEventActionComponent<T> extends TableCellCustom<T> { }
