import { Component } from '@angular/core';

import { TableCellCustom } from '../../../../../../../../core/src/shared/components/list/list.types';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { IServicePlan } from '../../../../../../cf-api-svc.types';

@Component({
  selector: 'app-table-cell-service-plan-extras',
  templateUrl: './table-cell-service-plan-extras.component.html',
  styleUrls: ['./table-cell-service-plan-extras.component.scss'],
})
export class TableCellAServicePlanExtrasComponent extends TableCellCustom<APIResource<IServicePlan>> { }
