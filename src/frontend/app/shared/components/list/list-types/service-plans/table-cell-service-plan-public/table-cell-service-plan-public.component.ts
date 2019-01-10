import { Component } from '@angular/core';

import { IServicePlan } from '../../../../../../core/cf-api-svc.types';
import { APIResource } from '../../../../../../store/types/api.types';
import { TableCellCustom } from '../../../list.types';

@Component({
  selector: 'app-table-cell-service-plan-public',
  templateUrl: './table-cell-service-plan-public.component.html',
  styleUrls: ['./table-cell-service-plan-public.component.scss'],
})
export class TableCellAServicePlanPublicComponent extends TableCellCustom<APIResource<IServicePlan>> { }
