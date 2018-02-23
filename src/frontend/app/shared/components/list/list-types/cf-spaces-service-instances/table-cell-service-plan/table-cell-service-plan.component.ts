import { Component, OnInit, Input } from '@angular/core';
import { TableCellCustom } from '../../../list-table/table-cell/table-cell-custom';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../../store/app-state';
import { selectEntity } from '../../../../../../store/selectors/api.selectors';
import { APIResource } from '../../../../../../store/types/api.types';
import { CfServicePlan } from '../../../../../../store/types/service.types';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'app-table-cell-service-plan',
  templateUrl: './table-cell-service-plan.component.html',
  styleUrls: ['./table-cell-service-plan.component.scss']
})
export class TableCellServicePlanComponent<T> extends TableCellCustom<T> implements OnInit {

  servicePlanName$: Observable<string>;
  @Input('row') row;

  constructor(private store: Store<AppState>) {
    super();
  }
  ngOnInit() {
    this.servicePlanName$ = this.store.select(selectEntity<APIResource<CfServicePlan>>('servicePlan', this.row.entity.service_plan_guid))
      .pipe(
        map(s => s.entity.name)
      );
  }

}
