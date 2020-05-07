import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import {
  getCfService,
  getServiceBroker,
  getServicePlanAccessibilityCardStatus,
} from '../../../../../cloud-foundry/src/features/service-catalog/services-helper';
import { ServicesService } from '../../../../../cloud-foundry/src/features/service-catalog/services.service';
import { IServiceBroker, IServicePlan } from '../../../../../core/src/core/cf-api-svc.types';
import { StratosStatus } from '../../../../../core/src/shared/shared.types';
import { APIResource } from '../../../../../store/src/types/api.types';

@Component({
  selector: 'app-service-plan-public',
  templateUrl: './service-plan-public.component.html',
  styleUrls: ['./service-plan-public.component.scss']
})
export class ServicePlanPublicComponent {
  planAccessibility$: Observable<StratosStatus>;
  planAccessibilityMessage$: Observable<string>;
  private pServicePlan: APIResource<IServicePlan>;

  @Input()
  get servicePlan(): APIResource<IServicePlan> {
    return this.pServicePlan;
  }

  set servicePlan(servicePlan: APIResource<IServicePlan>) {
    this.pServicePlan = servicePlan;
    if (!servicePlan) {
      return;
    }
    this.planAccessibility$ = getServicePlanAccessibilityCardStatus(
      servicePlan,
      this.servicesService.getServicePlanVisibilities(),
      this.getServiceBroker(servicePlan.entity.service_guid, servicePlan.entity.cfGuid)
    );
    this.planAccessibilityMessage$ = this.planAccessibility$.pipe(
      map(o => {
        if (o === StratosStatus.WARNING) {
          return 'Service Plan has limited visibility';
        } else if (o === StratosStatus.ERROR) {
          return 'Service Plan has no visibility';
        }
      })
    );
  }

  constructor(
    private servicesService: ServicesService,
  ) {
  }

  private getServiceBroker(serviceGuid: string, cfGuid: string): Observable<APIResource<IServiceBroker>> {
    return getCfService(serviceGuid, cfGuid).waitForEntity$.pipe(
      map(service => getServiceBroker(service.entity.entity.service_broker_guid, cfGuid)),
      switchMap(serviceService => serviceService.waitForEntity$),
      map(entity => entity.entity)
    );
  }
}
