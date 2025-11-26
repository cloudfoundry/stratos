import { Component , ChangeDetectionStrategy } from '@angular/core';

import { CustomIconComponent, CustomTooltipDirective } from '@stratosui/core';

import { TableCellCustom } from '@stratosui/core';
import type { APIResource } from '../../../../../../../../store/src/types/api.types';
import type { CfEvent } from '../../../../../../cf-api.types';
import { EventTabActorIconPipe } from './event-tab-actor-icon.pipe';

@Component({
  selector: 'app-table-cell-event-action',
  templateUrl: './table-cell-event-action.component.html',
  styleUrls: ['./table-cell-event-action.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CustomIconComponent,
    CustomTooltipDirective,
    EventTabActorIconPipe
  ]
})
export class TableCellEventActionComponent extends TableCellCustom<APIResource<CfEvent>> { }
