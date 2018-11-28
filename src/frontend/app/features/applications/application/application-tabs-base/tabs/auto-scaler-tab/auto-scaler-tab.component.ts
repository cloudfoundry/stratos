import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { EntityService } from '../../../../../../core/entity-service';
import { EntityServiceFactory } from '../../../../../../core/entity-service-factory.service';
import {
  entityFactory,
  appAutoscalerPolicySchemaKey,
  appAutoscalerScalingHistorySchemaKey,
  appAutoscalerAppMetricHistorySchemaKey,
  appAutoscalerInsMetricHistorySchemaKey,
  appAutoscalerHealthSchemaKey
} from '../../../../../../store/helpers/entity-factory';
import { ApplicationService } from '../../../../application.service';
import { GetAppAutoscalerPolicyAction, GetAppAutoscalerScalingHistoryAction, GetAppAutoscalerHealthAction } from '../../../../../../store/actions/app-autoscaler.actions';
import { AppAutoscalerPolicy, AppAutoscalerScalingHistory, AppAutoscalerHealth } from '../../../../../../store/types/app-autoscaler.types';
import { map } from 'rxjs/operators';
import {
  CfAppInstancesConfigService,
} from '../../../../../../shared/components/list/list-types/app-instance/cf-app-instances-config.service';
import { ListConfig } from '../../../../../../shared/components/list/list.component.types';

@Component({
  selector: 'app-auto-scaler-tab',
  templateUrl: './auto-scaler-tab.component.html',
  styleUrls: ['./auto-scaler-tab.component.scss'],
})
export class AutoScalerTabComponent implements OnInit {

  appAutoscalerHealthService: EntityService;
  appAutoscalerPolicyService: EntityService;
  appAutoscalerScalingHistoryService: EntityService;

  appAutoscalerHealth$: Observable<AppAutoscalerHealth>;
  appAutoscalerPolicy$: Observable<AppAutoscalerPolicy>;
  appAutoscalerScalingHistory$: Observable<AppAutoscalerScalingHistory>;

  scalingRuleColumns: string[] = ['metric', 'condition', 'action']
  specificDateColumns: string[] = ['from', 'to', 'init', 'min', 'max']
  recurringScheduleColumns: string[] = ['effect', 'repeat', 'from', 'to', 'init', 'min', 'max']

  constructor(
    private applicationService: ApplicationService,
    private entityServiceFactory: EntityServiceFactory,
  ) { }

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
      map((historyEntity,ddd) => {
        console.log("appAutoscalerScalingHistory", historyEntity, ddd)
        return historyEntity && historyEntity.entity
      })
    );
  }

}
