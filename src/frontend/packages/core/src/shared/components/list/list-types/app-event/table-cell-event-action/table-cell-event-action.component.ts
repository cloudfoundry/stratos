/* tslint:disable:no-access-missing-member https://github.com/mgechev/codelyzer/issues/191*/
import { Component, OnInit } from '@angular/core';
import { TableCellCustom } from '../../../list.types';

@Component({
  selector: 'app-table-cell-event-action',
  templateUrl: './table-cell-event-action.component.html',
  styleUrls: ['./table-cell-event-action.component.scss']
})
export class TableCellEventActionComponent<T> extends TableCellCustom<T> { }
