import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { CFAppState } from '../../../../../../../../cloud-foundry/src/cf-app-state';
import {
  servicePlanEntityType,
  userProvidedServiceInstanceEntityType,
} from '../../../../../../../../cloud-foundry/src/cf-entity-factory';
import { selectCfEntity } from '../../../../../../../../cloud-foundry/src/store/selectors/api.selectors';
import { IServicePlan } from '../../../../../../../../core/src/core/cf-api-svc.types';
import { TableCellCustom } from '../../../../../../../../core/src/shared/components/list/list.types';
import { APIResource } from '../../../../../../../../store/src/types/api.types';

@Component({
  selector: 'app-table-cell-service-plan',
  templateUrl: './table-cell-service-plan.component.html',
  styleUrls: ['./table-cell-service-plan.component.scss']
})
export class TableCellServicePlanComponent<T> extends TableCellCustom<T> implements OnInit {

  @Input() row;
  @Input() entityKey: string;
  servicePlanName$: Observable<string>;

  constructor(private store: Store<CFAppState>) { super(); }
  ngOnInit() {
    if (this.entityKey === userProvidedServiceInstanceEntityType) {
      this.servicePlanName$ = of('-');
    } else {
      this.servicePlanName$ = this.store.select(
        selectCfEntity<APIResource<IServicePlan>>(servicePlanEntityType, this.row.entity.service_plan_guid)
      ).pipe(
        filter(s => !!s),
        map(s => s.entity.name)
      );
    }
  }
}
