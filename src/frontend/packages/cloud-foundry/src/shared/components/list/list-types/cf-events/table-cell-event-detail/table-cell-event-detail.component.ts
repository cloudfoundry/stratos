import { Component } from '@angular/core';

import { TableCellCustom } from '../../../../../../../../core/src/shared/components/list/list.types';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { CfEvent } from '../../../../../../cf-api.types';

/* tslint:disable:no-access-missing-member https://github.com/mgechev/codelyzer/issues/191*/
@Component({
  selector: 'app-table-cell-event-detail',
  templateUrl: './table-cell-event-detail.component.html',
  styleUrls: ['./table-cell-event-detail.component.scss']
})
export class TableCellEventDetailComponent extends TableCellCustom<APIResource<CfEvent>> {


}
