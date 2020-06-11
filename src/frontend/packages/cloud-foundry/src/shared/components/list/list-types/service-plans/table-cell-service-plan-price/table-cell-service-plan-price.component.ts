import { Component, Input } from '@angular/core';

import { TableCellCustom } from '../../../../../../../../core/src/shared/components/list/list.types';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { IServicePlan } from '../../../../../../cf-api-svc.types';
import { canShowServicePlanCosts } from '../../../../../../features/service-catalog/services-helper';

@Component({
  selector: 'app-table-cell-service-plan-price',
  templateUrl: './table-cell-service-plan-price.component.html',
  styleUrls: ['./table-cell-service-plan-price.component.scss'],
})
export class TableCellAServicePlanPriceComponent extends TableCellCustom<APIResource<IServicePlan>> {
  isFree: boolean;
  canShowCosts: boolean;

  private pServicePlan;
  @Input()
  set row(servicePlan: APIResource<IServicePlan>) {
    this.pServicePlan = servicePlan;
    if (!servicePlan) {
      return;
    }
    this.isFree = servicePlan.entity.free;
    this.canShowCosts = canShowServicePlanCosts(servicePlan);
  }
  get row(): APIResource<IServicePlan> {
    return this.pServicePlan;
  }
}
