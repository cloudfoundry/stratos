import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

import { TableCellCustom } from '@stratosui/core';
import { canShowServicePlanCosts } from '../../../../../../features/service-catalog/services-helper';
import { StServicePlan } from '../../../../../../services/endpoint-data/stratos-types';
import { ServicePlanPriceComponent } from '../../../../service-plan-price/service-plan-price.component';

@Component({
  selector: 'app-table-cell-service-plan-price',
  templateUrl: './table-cell-service-plan-price.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ServicePlanPriceComponent,
  ],
})
export class TableCellAServicePlanPriceComponent extends TableCellCustom<StServicePlan> {
  isFree = false;
  canShowCosts = false;

  @Input()
  set row(servicePlan: StServicePlan) {
    super.row = servicePlan;
    if (!servicePlan) {
      return;
    }
    this.isFree = !!servicePlan.free;
    this.canShowCosts = canShowServicePlanCosts(servicePlan);
  }
  get row(): StServicePlan {
    return super.row;
  }
}
