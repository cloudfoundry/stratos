import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { EntityService } from '../../../../../../core/entity-service';
import { EntityServiceFactory } from '../../../../../../core/entity-service-factory.service';
import {
  entityFactory,
  appAutoscalerPolicySchemaKey,
  appAutoscalerScalingHistorySchemaKey,
  appAutoscalerAppMetricSchemaKey,
  appAutoscalerInsMetricSchemaKey,
  appAutoscalerHealthSchemaKey
} from '../../../../../../store/helpers/entity-factory';
import { ApplicationService } from '../../../../application.service';
import { GetAppAutoscalerPolicyAction, GetAppAutoscalerScalingHistoryAction, GetAppAutoscalerHealthAction, GetAppAutoscalerAppMetricAction } from '../../../../../../store/actions/app-autoscaler.actions';
import { AppAutoscalerPolicy, AppAutoscalerScalingHistory, AppAutoscalerHealth, AppAutoscalerAppMetric } from '../../../../../../store/types/app-autoscaler.types';
import { map } from 'rxjs/operators';
import { APIResource } from '../../../../../../store/types/api.types';
import { getPaginationObservables } from '../../../../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../../store/app-state';
import { PaginationMonitorFactory } from '../../../../../../shared/monitors/pagination-monitor.factory';
import { EntityInfo } from '../../../../../../store/types/api.types';

@Component({
  selector: 'app-auto-scaler-tab',
  templateUrl: './auto-scaler-tab.component.html',
  styleUrls: ['./auto-scaler-tab.component.scss'],
})

export class AutoScalerTabComponent implements OnInit {

  scalingRuleColumns: string[] = ['metric', 'condition', 'action']
  specificDateColumns: string[] = ['from', 'to', 'init', 'min', 'max']
  recurringScheduleColumns: string[] = ['effect', 'repeat', 'from', 'to', 'init', 'min', 'max']

  appAutoscalerHealthService: EntityService;
  appAutoscalerPolicyService: EntityService;
  appAutoscalerScalingHistoryService: EntityService;

  appAutoscalerHealth$: Observable<AppAutoscalerHealth>;
  appAutoscalerPolicy$: Observable<EntityInfo<AppAutoscalerPolicy>>;
  appAutoscalerScalingHistory$: Observable<AppAutoscalerScalingHistory>;

  appAutoscalerAppMetricMemoryused$: Observable<APIResource<AppAutoscalerAppMetric>[]>;
  appAutoscalerAppMetricMemoryutil$: Observable<APIResource<AppAutoscalerAppMetric>[]>;
  appAutoscalerAppMetricThroughput$: Observable<APIResource<AppAutoscalerAppMetric>[]>;
  appAutoscalerAppMetricResponsetime$: Observable<APIResource<AppAutoscalerAppMetric>[]>;

  constructor(
    private store: Store<AppState>,
    private applicationService: ApplicationService,
    private entityServiceFactory: EntityServiceFactory,
    private paginationMonitorFactory: PaginationMonitorFactory
  ) {
  }

  ngOnInit() {
    this.appAutoscalerHealthService = this.entityServiceFactory.create(
      appAutoscalerHealthSchemaKey,
      entityFactory(appAutoscalerHealthSchemaKey),
      "public",
      new GetAppAutoscalerHealthAction(),
      false
    );
    this.appAutoscalerPolicyService = this.entityServiceFactory.create(
      appAutoscalerPolicySchemaKey,
      entityFactory(appAutoscalerPolicySchemaKey),
      this.applicationService.appGuid,
      new GetAppAutoscalerPolicyAction(this.applicationService.appGuid),
      false
    );
    this.appAutoscalerScalingHistoryService = this.entityServiceFactory.create(
      appAutoscalerScalingHistorySchemaKey,
      entityFactory(appAutoscalerScalingHistorySchemaKey),
      this.applicationService.appGuid,
      new GetAppAutoscalerScalingHistoryAction(this.applicationService.appGuid),
      false
    );

    let params = {
      'start-time': 0,
      'end-time': (new Date()).getTime().toString() + "000000",
      'page': '1',
      'results-per-page': '1',
      'order': 'desc'
    }
    this.appAutoscalerAppMetricMemoryused$ = this.getAppMetric('memoryused', params)
    this.appAutoscalerAppMetricMemoryutil$ = this.getAppMetric('memoryutil', params)
    this.appAutoscalerAppMetricThroughput$ = this.getAppMetric('throughput', params)
    this.appAutoscalerAppMetricResponsetime$ = this.getAppMetric('responsetime', params)

    this.appAutoscalerHealth$ = this.appAutoscalerHealthService.entityObs$.pipe(
      map(({ entity }) => {
        console.log(entity)
        return entity
      }),
      map((healthEntity, ddd) => {
        console.log("appAutoscalerHealth", healthEntity, ddd)
        return healthEntity && healthEntity.entity
      })
    );
    this.appAutoscalerPolicy$ = this.appAutoscalerPolicyService.entityObs$.pipe(
      map(({ entity }) => {
        console.log(entity)
        return entity
      }),
      map((policyEntity, ddd) => {
        console.log("appAutoscalerPolicy", policyEntity, ddd)

        return policyEntity && policyEntity.entity
      })
    );
    this.appAutoscalerScalingHistory$ = this.appAutoscalerScalingHistoryService.entityObs$.pipe(
      map(({ entity }) => {
        console.log(entity)
        return entity
      }),
      map((historyEntity, ddd) => {
        console.log("appAutoscalerScalingHistory", historyEntity, ddd)
        return historyEntity && historyEntity.entity
      })
    );
  }

  getAppMetric(metricName: string, params: any) {
    let action = new GetAppAutoscalerAppMetricAction("key", this.applicationService.appGuid, this.applicationService.cfGuid, metricName, params)
    return getPaginationObservables<APIResource<AppAutoscalerAppMetric>>({
      store: this.store,
      action,
      paginationMonitor: this.paginationMonitorFactory.create(
        action.paginationKey,
        entityFactory(appAutoscalerAppMetricSchemaKey)
      )
    }, false).entities$;
  }

}
