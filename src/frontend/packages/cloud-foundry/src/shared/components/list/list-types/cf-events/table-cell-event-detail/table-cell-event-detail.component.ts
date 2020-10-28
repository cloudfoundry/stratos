import { Component } from '@angular/core';

import { TableCellCustom } from '../../../../../../../../core/src/shared/components/list/list.types';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { CfEvent } from '../../../../../../cf-api.types';

@Component({
  selector: 'app-table-cell-event-detail',
  templateUrl: './table-cell-event-detail.component.html',
  styleUrls: ['./table-cell-event-detail.component.scss']
})
export class TableCellEventDetailComponent extends TableCellCustom<APIResource<CfEvent>> {
}
