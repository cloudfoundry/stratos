import { Component } from '@angular/core';

import { TableCellCustom } from '../../../../../../../../core/src/shared/components/list/list.types';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { IServicePlan } from '../../../../../../cf-api-svc.types';
import { ServicePlanPublicComponent } from '../../../../service-plan-public/service-plan-public.component';

@Component({
  selector: 'app-table-cell-service-plan-public',
  templateUrl: './table-cell-service-plan-public.component.html',
  styleUrls: ['./table-cell-service-plan-public.component.scss'],
  standalone: true,
  imports: [
    ServicePlanPublicComponent
  ]
})
export class TableCellAServicePlanPublicComponent extends TableCellCustom<APIResource<IServicePlan>> { }
