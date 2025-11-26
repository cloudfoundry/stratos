import { Component , ChangeDetectionStrategy } from '@angular/core';

import { TableCellCustom } from '@stratosui/core';
import type { APIResource } from '../../../../../../../../store/src/types/api.types';
import type { IServicePlan } from '../../../../../../cf-api-svc.types';
import { ServicePlanPublicComponent } from '../../../../service-plan-public/service-plan-public.component';

@Component({
  selector: 'app-table-cell-service-plan-public',
  templateUrl: './table-cell-service-plan-public.component.html',
  styleUrls: ['./table-cell-service-plan-public.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ServicePlanPublicComponent
  ]
})
export class TableCellAServicePlanPublicComponent extends TableCellCustom<APIResource<IServicePlan>> { }
