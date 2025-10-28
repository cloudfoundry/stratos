import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { TableCellCustom } from '../../../../../../core/src/shared/components/list/list.types';
import { EntityInfo } from '../../../../../../store/src/types/api.types';
import { TableCellAutoscalerEventStatusIconPipe } from './table-cell-autoscaler-event-status-icon.pipe';

@Component({
  selector: 'app-table-cell-autoscaler-event-status',
  templateUrl: './table-cell-autoscaler-event-status.component.html',
  styleUrls: ['./table-cell-autoscaler-event-status.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TableCellAutoscalerEventStatusIconPipe
  ]
})
export class TableCellAutoscalerEventStatusComponent extends TableCellCustom<EntityInfo> { }
