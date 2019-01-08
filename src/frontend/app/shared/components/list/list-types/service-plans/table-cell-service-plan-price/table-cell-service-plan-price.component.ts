import { Component, Input } from '@angular/core';

import { IServicePlan } from '../../../../../../core/cf-api-svc.types';
import { canShowServicePlanCosts } from '../../../../../../features/service-catalog/services-helper';
import { APIResource } from '../../../../../../store/types/api.types';
import { TableCellCustom } from '../../../list.types';

@Component({
  selector: 'app-table-cell-service-plan-price',
  templateUrl: './table-cell-service-plan-price.component.html',
  styleUrls: ['./table-cell-service-plan-price.component.scss'],
})
export class TableCellAServicePlanPriceComponent extends TableCellCustom<APIResource<IServicePlan>> {
  isFree: boolean;
  canShowCosts: boolean;

  private _servicePlan;
  @Input()
  set row(servicePlan: APIResource<IServicePlan>) {
    this._servicePlan = servicePlan;
    if (!servicePlan) {
      return;
    }
    this.isFree = servicePlan.entity.free;
    this.canShowCosts = canShowServicePlanCosts(servicePlan);
  }
  get row(): APIResource<IServicePlan> {
    return this._servicePlan;
  }
}
