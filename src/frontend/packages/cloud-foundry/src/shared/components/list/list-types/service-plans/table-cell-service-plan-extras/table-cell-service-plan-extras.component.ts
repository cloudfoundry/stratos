import { Component } from '@angular/core';

import { IServicePlan } from '../../../../../../../../core/src/core/cf-api-svc.types';
import { TableCellCustom } from '../../../../../../../../core/src/shared/components/list/list.types';
import { APIResource } from '../../../../../../../../store/src/types/api.types';

@Component({
  selector: 'app-table-cell-service-plan-extras',
  templateUrl: './table-cell-service-plan-extras.component.html',
  styleUrls: ['./table-cell-service-plan-extras.component.scss'],
})
export class TableCellAServicePlanExtrasComponent extends TableCellCustom<APIResource<IServicePlan>> { }
