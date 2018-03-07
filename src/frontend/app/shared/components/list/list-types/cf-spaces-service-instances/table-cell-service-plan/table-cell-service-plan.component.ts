import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { filter, map } from 'rxjs/operators';

import { AppState } from '../../../../../../store/app-state';
import { selectEntity } from '../../../../../../store/selectors/api.selectors';
import { APIResource } from '../../../../../../store/types/api.types';
import { CfServicePlan } from '../../../../../../store/types/service.types';
import { TableCellCustom } from '../../../list-table/table-cell/table-cell-custom';

@Component({
  selector: 'app-table-cell-service-plan',
  templateUrl: './table-cell-service-plan.component.html',
  styleUrls: ['./table-cell-service-plan.component.scss']
})
export class TableCellServicePlanComponent<T> extends TableCellCustom<T> implements OnInit {

  @Input('row') row;
  servicePlanName$: Observable<string>;

  constructor(private store: Store<AppState>) { super(); }
  ngOnInit() {
    this.servicePlanName$ = this.store.select(selectEntity<APIResource<CfServicePlan>>('servicePlan', this.row.entity.service_plan_guid))
      .pipe(
        filter(s => !!s),
        map(s => s.entity.name)
      );
  }
}
