import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import {
  getServicePlanAccessibilityCardStatus,
} from '../../../../../cloud-foundry/src/features/service-catalog/services-helper';
import { ServicesService } from '../../../../../cloud-foundry/src/features/service-catalog/services.service';
import { APIResource } from '../../../../../store/src/types/api.types';
import { StratosStatus } from '../../../../../store/src/types/shared.types';
import { IServiceBroker, IServicePlan } from '../../../cf-api-svc.types';
import { cfEntityCatalog } from '../../../cf-entity-catalog';

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
      this.servicesService.servicePlanVisibilities$,
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
    return cfEntityCatalog.service.store.getEntityService(serviceGuid, cfGuid, {}).waitForEntity$.pipe(
      map(service => cfEntityCatalog.serviceBroker.store.getEntityService(service.entity.entity.service_broker_guid, cfGuid, {})),
      switchMap(serviceService => serviceService.waitForEntity$),
      map(entity => entity.entity)
    );
  }
}
