import { AsyncPipe, CommonModule } from '@angular/common';
import { Component , ChangeDetectionStrategy } from '@angular/core';
import { Store } from '@ngrx/store';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  TileGridComponent,
  TileGroupComponent,
  TileComponent,
  CardNumberMetricComponent
} from '@stratosui/core';
import { RouterNav } from '@stratosui/store';
import type { APIResource } from '@stratosui/store';
import type { CFAppState } from '../../../cf-app-state';
import type { IServiceInstance, IServicePlan } from '../../../cf-api-svc.types';
import { ServicesService } from '../services.service';
import { ServiceSummaryCardComponent } from '../../../shared/components/cards/service-summary-card/service-summary-card.component';
import { ServiceBrokerCardComponent } from '../../../shared/components/cards/service-broker-card/service-broker-card.component';
import { ServiceRecentInstancesCardComponent } from '../../../shared/components/cards/service-recent-instances-card/service-recent-instances-card.component';

@Component({
  selector: 'app-service-summary',
  templateUrl: './service-summary.component.html',
  styleUrls: ['./service-summary.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    CommonModule,
    TileGridComponent,
    TileGroupComponent,
    TileComponent,
    CardNumberMetricComponent,
    ServiceSummaryCardComponent,
    ServiceBrokerCardComponent,
    ServiceRecentInstancesCardComponent
  ]
})
export class ServiceSummaryComponent {

  isBrokerAvailable$: Observable<boolean>;
  servicePlans$: Observable<APIResource<IServicePlan>[]>;
  instances$: Observable<APIResource<IServiceInstance>[]>;
  constructor(
    private servicesService: ServicesService,
    private store: Store,
  ) {

    this.instances$ = servicesService.serviceInstances$;
    this.servicePlans$ = servicesService.servicePlans$;
    this.isBrokerAvailable$ = servicesService.serviceBroker$.pipe(
      map(p => !!p)
    );
  }

  serviceInstancesLink = () => {
    this.store.dispatch(new RouterNav({
      path: ['marketplace', this.servicesService.cfGuid, this.servicesService.serviceGuid, 'instances']
    }));
  }

  servicePlansLink = () => {
    this.store.dispatch(new RouterNav({
      path: ['marketplace', this.servicesService.cfGuid, this.servicesService.serviceGuid, 'plans']
    }));
  }

}
