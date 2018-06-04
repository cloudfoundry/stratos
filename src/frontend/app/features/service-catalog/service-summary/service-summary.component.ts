import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app-state';
import { ServicesService } from '../services.service';
import { Observable } from 'rxjs/Observable';
import { APIResource } from '../../../store/types/api.types';
import { IServiceInstance, IServicePlan } from '../../../core/cf-api-svc.types';
import { ActivatedRoute } from '@angular/router';
import { RouterNav } from '../../../store/actions/router.actions';
import { getIdFromRoute } from '../../cloud-foundry/cf.helpers';

@Component({
  selector: 'app-service-summary',
  templateUrl: './service-summary.component.html',
  styleUrls: ['./service-summary.component.scss']
})
export class ServiceSummaryComponent {

  servicePlans$: Observable<APIResource<IServicePlan>[]>;
  instances$: Observable<APIResource<IServiceInstance>[]>;
  constructor(
    private servicesService: ServicesService,
    private store: Store<AppState>,
  ) {

    this.instances$ = servicesService.serviceInstances$;
    this.servicePlans$ = servicesService.servicePlans$;
  }

  serviceInstancesLink = () => {
    this.store.dispatch(new RouterNav({
      path: ['marketplace', this.servicesService.cfGuid, this.servicesService.serviceGuid, 'instances']
    }));
  }

}
