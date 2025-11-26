import { CommonModule, DatePipe } from '@angular/common';
import { Component , ChangeDetectionStrategy } from '@angular/core';

import { TableCellCustom } from '@stratosui/core';

@Component({
  selector: 'app-table-cell-event-timestamp',
  templateUrl: './table-cell-event-timestamp.component.html',
  styleUrls: ['./table-cell-event-timestamp.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DatePipe
  ]
})
export class TableCellEventTimestampComponent<T> extends TableCellCustom<T> { }
