import { Component , ChangeDetectionStrategy } from '@angular/core';

import { TableCellCustom } from '@stratosui/core';
import type { APIResource } from '../../../../../../../../store/src/types/api.types';
import type { CfEvent } from '../../../../../../cf-api.types';
import { EventMetadataComponent } from '../event-metadata/event-metadata.component';

@Component({
  selector: 'app-table-cell-event-detail',
  templateUrl: './table-cell-event-detail.component.html',
  styleUrls: ['./table-cell-event-detail.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    EventMetadataComponent
  ]
})
export class TableCellEventDetailComponent extends TableCellCustom<APIResource<CfEvent>> {
}
