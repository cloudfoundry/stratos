import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { EntityService } from '../../../../../../core/entity-service';
import { EntityServiceFactory } from '../../../../../../core/entity-service-factory.service';
import {
  entityFactory,
  appAutoscalerPolicySchemaKey,
} from '../../../../../../store/helpers/entity-factory';
import { ApplicationService } from '../../../../application.service';
import { GetAppAutoscalerPolicyAction } from '../../../../../../store/actions/app-autoscaler.actions';
import { AppAutoscalerPolicy } from '../../../../../../store/types/app-autoscaler.types';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-auto-scaler-tab',
  templateUrl: './auto-scaler-tab.component.html',
  styleUrls: ['./auto-scaler-tab.component.scss'],
})
export class AutoScalerTabComponent implements OnInit {

  appAutoscalerPolicyService: EntityService;
  appAutoscalerPolicy$: Observable<AppAutoscalerPolicy>;

  constructor(
    private applicationService: ApplicationService,
    private entityServiceFactory: EntityServiceFactory,
  ) { }

  ngOnInit() {
    this.appAutoscalerPolicyService = this.entityServiceFactory.create(
      appAutoscalerPolicySchemaKey,
      entityFactory(appAutoscalerPolicySchemaKey),
      this.applicationService.appGuid,
      new GetAppAutoscalerPolicyAction(this.applicationService.appGuid),
      false
    );
    this.appAutoscalerPolicy$ = this.appAutoscalerPolicyService.entityObs$.pipe(
      map(({ entity }) => entity),
      map(policyEntity => {
        console.log("appAutoscalerPolicy", policyEntity)
        return policyEntity && policyEntity.entity
      })
    );
  }

}
