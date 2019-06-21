import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { IServicePlan } from '../../../../../../core/cf-api-svc.types';
import { TableCellCustom } from '../../../list.types';
import { AppState } from '../../../../../../../../store/src/app-state';
import { selectEntity } from '../../../../../../../../store/src/selectors/api.selectors';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { userProvidedServiceInstanceSchemaKey } from '../../../../../../../../store/src/helpers/entity-factory';

@Component({
  selector: 'app-table-cell-service-plan',
  templateUrl: './table-cell-service-plan.component.html',
  styleUrls: ['./table-cell-service-plan.component.scss']
})
export class TableCellServicePlanComponent<T> extends TableCellCustom<T> implements OnInit {

  @Input() row;
  @Input() entityKey: string;
  servicePlanName$: Observable<string>;

  constructor(private store: Store<AppState>) { super(); }
  ngOnInit() {
    if (this.entityKey === userProvidedServiceInstanceSchemaKey) {
      this.servicePlanName$ = of('-');
    } else {
      this.servicePlanName$ = this.store.select(selectEntity<APIResource<IServicePlan>>('servicePlan', this.row.entity.service_plan_guid))
        .pipe(
          filter(s => !!s),
          map(s => s.entity.name)
        );
    }
  }
}
