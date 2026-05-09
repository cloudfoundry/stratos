import { Component, ChangeDetectionStrategy } from '@angular/core';

import { TableCellCustom } from '../../../../../../../../core/src/shared/components/list/list.types';
import { StServicePlan } from '../../../../../../services/endpoint-data/stratos-types';
import { ServicePlanPublicComponent } from '../../../../service-plan-public/service-plan-public.component';

@Component({
  selector: 'app-table-cell-service-plan-public',
  templateUrl: './table-cell-service-plan-public.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ServicePlanPublicComponent,
  ],
})
export class TableCellAServicePlanPublicComponent extends TableCellCustom<StServicePlan> { }
