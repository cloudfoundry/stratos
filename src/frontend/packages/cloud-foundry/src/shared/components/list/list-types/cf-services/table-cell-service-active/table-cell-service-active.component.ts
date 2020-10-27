import { Component } from '@angular/core';

import { TableCellCustomComponent } from '../../../../../../../../core/src/shared/components/list/list.types';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { IService } from '../../../../../../cf-api-svc.types';

@Component({
  selector: 'app-table-cell-service-active',
  templateUrl: './table-cell-service-active.component.html',
  styleUrls: ['./table-cell-service-active.component.scss']
})
export class TableCellServiceActiveComponent extends TableCellCustomComponent<APIResource<IService>>  { }
