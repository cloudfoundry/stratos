import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TableCellCustom } from '@stratosui/core';
import type { APIResource } from '../../../../../../store/src/types/api.types';
import type { AppAutoscalerEvent } from '../../../../store/app-autoscaler.types';
import { TableCellAutoscalerEventChangeIconPipe } from './table-cell-autoscaler-event-change-icon.pipe';

@Component({
  selector: 'app-table-cell-autoscaler-event-change',
  templateUrl: './table-cell-autoscaler-event-change.component.html',
  styleUrls: ['./table-cell-autoscaler-event-change.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    TableCellAutoscalerEventChangeIconPipe
  ]
})
export class TableCellAutoscalerEventChangeComponent extends TableCellCustom<APIResource<AppAutoscalerEvent>> { }
