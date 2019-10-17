/* tslint:disable:no-access-missing-member https://github.com/mgechev/codelyzer/issues/191*/
import { Component, OnInit } from '@angular/core';
import { TableCellCustom } from '../../../../../../../../core/src/shared/components/list/list.types';

@Component({
  selector: 'app-table-cell-event-timestamp',
  templateUrl: './table-cell-event-timestamp.component.html',
  styleUrls: ['./table-cell-event-timestamp.component.scss']
})
export class TableCellEventTimestampComponent<T> extends TableCellCustom<T> { }
