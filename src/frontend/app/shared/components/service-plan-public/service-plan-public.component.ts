import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { IServiceBroker, IServicePlan } from '../../../core/cf-api-svc.types';
import { EntityServiceFactory } from '../../../core/entity-service-factory.service';
import {
  getCfService,
  getServiceBroker,
  getServicePlanAccessibilityCardStatus,
} from '../../../features/service-catalog/services-helper';
import { ServicesService } from '../../../features/service-catalog/services.service';
import { APIResource } from '../../../store/types/api.types';
import { CardStatus } from '../../shared.types';

@Component({
  selector: 'app-service-plan-public',
  templateUrl: './service-plan-public.component.html',
  styleUrls: ['./service-plan-public.component.scss']
})
export class ServicePlanPublicComponent {

  planAccessibility$: Observable<CardStatus>;
  planAccessibilityMessage$: Observable<string>;
  private _servicePlan: APIResource<IServicePlan>;
  @Input()
  get servicePlan(): APIResource<IServicePlan> {
    return this._servicePlan;
  }
  set servicePlan(servicePlan: APIResource<IServicePlan>) {
    this._servicePlan = servicePlan;
    if (!servicePlan) {
      return;
    }
    this.planAccessibility$ = getServicePlanAccessibilityCardStatus(
      servicePlan,
      this.servicesService.getServicePlanVisibilities(),
      this.getServiceBroker(servicePlan.entity.service_guid, servicePlan.entity.cfGuid)
    );
    this.planAccessibilityMessage$ = this.planAccessibility$.pipe().pipe(
      map(o => {
        if (o === CardStatus.WARNING) {
          return 'Service Plan has limited visibility';
        } else if (o === CardStatus.ERROR) {
          return 'Service Plan has no visibility';
        }
      })
    );
  }

  constructor(
    private servicesService: ServicesService,
    private entityServiceFactory: EntityServiceFactory
  ) {
  }

  private getServiceBroker(serviceGuid: string, cfGuid: string): Observable<APIResource<IServiceBroker>> {
    return getCfService(serviceGuid, cfGuid, this.entityServiceFactory).waitForEntity$.pipe(
      map(service => getServiceBroker(service.entity.entity.service_broker_guid, cfGuid, this.entityServiceFactory)),
      switchMap(serviceService => serviceService.waitForEntity$),
      map(entity => entity.entity)
    );
  }
}
