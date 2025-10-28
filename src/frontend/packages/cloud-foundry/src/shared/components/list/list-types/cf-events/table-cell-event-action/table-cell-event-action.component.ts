import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { TableCellCustom } from '../../../../../../../../core/src/shared/components/list/list.types';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { EventTabActorIconPipe } from './event-tab-actor-icon.pipe';

@Component({
  selector: 'app-table-cell-event-action',
  templateUrl: './table-cell-event-action.component.html',
  styleUrls: ['./table-cell-event-action.component.scss'],
  standalone: true,
  imports: [
    MatIconModule,
    MatTooltipModule,
    EventTabActorIconPipe
  ]
})
export class TableCellEventActionComponent extends TableCellCustom<APIResource> { }
