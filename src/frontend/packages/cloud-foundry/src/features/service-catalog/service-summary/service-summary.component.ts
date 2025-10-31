import { CommonModule } from '@angular/common';
import { Component , ChangeDetectionStrategy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { TileGridComponent } from '../../../../../core/src/shared/components/tile/tile-grid/tile-grid.component';
import { TileGroupComponent } from '../../../../../core/src/shared/components/tile/tile-group/tile-group.component';
import { TileComponent } from '../../../../../core/src/shared/components/tile/tile/tile.component';
import { CardNumberMetricComponent } from '../../../../../core/src/shared/components/cards/card-number-metric/card-number-metric.component';
import { CFAppState } from '../../../../../cloud-foundry/src/cf-app-state';
import { RouterNav } from '../../../../../store/src/actions/router.actions';
import { APIResource } from '../../../../../store/src/types/api.types';
import { IServiceInstance, IServicePlan } from '../../../cf-api-svc.types';
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
    private store: Store<CFAppState>,
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
