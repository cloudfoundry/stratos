import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

import { TableCellCustom } from '@stratosui/core';
import type { APIResource } from '../../../../../../store/src/types/api.types';
import type { AppAutoscalerEvent } from '../../../../store/app-autoscaler.types';
import { TableCellAutoscalerEventStatusIconPipe } from './table-cell-autoscaler-event-status-icon.pipe';

@Component({
  selector: 'app-table-cell-autoscaler-event-status',
  templateUrl: './table-cell-autoscaler-event-status.component.html',
  styleUrls: ['./table-cell-autoscaler-event-status.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    TableCellAutoscalerEventStatusIconPipe
  ]
})
export class TableCellAutoscalerEventStatusComponent extends TableCellCustom<APIResource<AppAutoscalerEvent>> { }
