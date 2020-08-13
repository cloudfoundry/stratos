import { Component } from '@angular/core';

import { TableCellCustom } from '../../../../../../../../core/src/shared/components/list/list.types';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { IServicePlan } from '../../../../../../cf-api-svc.types';

@Component({
  selector: 'app-table-cell-service-plan-public',
  templateUrl: './table-cell-service-plan-public.component.html',
  styleUrls: ['./table-cell-service-plan-public.component.scss'],
})
export class TableCellAServicePlanPublicComponent extends TableCellCustom<APIResource<IServicePlan>> { }
