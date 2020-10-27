import { Component } from '@angular/core';

import { TableCellCustomComponent } from '../../../../../../core/src/shared/components/list/list.types';
import { EntityInfo } from '../../../../../../store/src/types/api.types';

@Component({
  selector: 'app-table-cell-autoscaler-event-status',
  templateUrl: './table-cell-autoscaler-event-status.component.html',
  styleUrls: ['./table-cell-autoscaler-event-status.component.scss']
})
export class TableCellAutoscalerEventStatusComponent extends TableCellCustomComponent<EntityInfo> { }
