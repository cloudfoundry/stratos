import { Component } from '@angular/core';

import { TableCellCustomComponent } from '../../../../../../../../core/src/shared/components/list/list.types';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { CfEvent } from '../../../../../../cf-api.types';

@Component({
  selector: 'app-table-cell-event-detail',
  templateUrl: './table-cell-event-detail.component.html',
  styleUrls: ['./table-cell-event-detail.component.scss']
})
export class TableCellEventDetailComponent extends TableCellCustomComponent<APIResource<CfEvent>> {
}
