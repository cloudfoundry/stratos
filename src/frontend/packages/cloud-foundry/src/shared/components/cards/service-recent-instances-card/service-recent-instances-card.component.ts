import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';

import {
  StatefulIconComponent,
  CardWrapperComponent,
  CardHeaderComponent,
  CardTitleComponent,
  CardContentComponent
} from '@stratosui/core';
import { ServicesService } from '../../../../../../cloud-foundry/src/features/service-catalog/services.service';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { IServiceInstance } from '../../../../cf-api-svc.types';
import { CompactServiceInstanceCardComponent } from '../compact-service-instance-card/compact-service-instance-card.component';

const RECENT_ITEMS_COUNT = 10;

@Component({
  selector: 'app-service-recent-instances-card',
  templateUrl: './service-recent-instances-card.component.html',
  styleUrls: ['./service-recent-instances-card.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    StatefulIconComponent,
    CardWrapperComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardContentComponent,
    CompactServiceInstanceCardComponent
  ]
})
export class ServiceRecentInstancesCardComponent implements OnInit {

  serviceInstances$: Observable<APIResource<IServiceInstance>[]>;
  constructor(
    private servicesService: ServicesService
  ) { }

  ngOnInit() {
    this.serviceInstances$ = this.servicesService.serviceInstances$.pipe(
      first(),
      map(serviceInstances => serviceInstances.sort((a, b) => a.metadata.updated_at <= b.metadata.updated_at ? 1 : -1)),
      map(serviceInstances => serviceInstances.slice(0, RECENT_ITEMS_COUNT))
    );
  }

}
