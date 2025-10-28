import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { TableCellCustom } from '../../../../../../../../core/src/shared/components/list/list.types';

@Component({
  selector: 'app-table-cell-event-timestamp',
  templateUrl: './table-cell-event-timestamp.component.html',
  styleUrls: ['./table-cell-event-timestamp.component.scss'],
  standalone: true,
  imports: [
    CommonModule
  ]
})
export class TableCellEventTimestampComponent<T> extends TableCellCustom<T> { }
