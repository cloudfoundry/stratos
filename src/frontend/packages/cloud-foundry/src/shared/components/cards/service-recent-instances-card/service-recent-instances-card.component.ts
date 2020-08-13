import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { ServicesService } from '../../../../../../cloud-foundry/src/features/service-catalog/services.service';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { IServiceInstance } from '../../../../cf-api-svc.types';

const RECENT_ITEMS_COUNT = 10;

@Component({
  selector: 'app-service-recent-instances-card',
  templateUrl: './service-recent-instances-card.component.html',
  styleUrls: ['./service-recent-instances-card.component.scss']
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
