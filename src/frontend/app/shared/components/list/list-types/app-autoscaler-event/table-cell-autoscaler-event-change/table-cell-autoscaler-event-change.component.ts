/* tslint:disable:no-access-missing-member https://github.com/mgechev/codelyzer/issues/191*/
import { Component, OnInit } from '@angular/core';
import { TableCellCustom } from '../../../list.types';

@Component({
  selector: 'app-table-cell-autoscaler-event-change',
  templateUrl: './table-cell-autoscaler-event-change.component.html',
  styleUrls: ['./table-cell-autoscaler-event-change.component.scss']
})
export class TableCellAutoscalerEventChangeComponent<T> extends TableCellCustom<T> { }
