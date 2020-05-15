import { Component, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { filter, map, switchMap, take, tap } from 'rxjs/operators';

import { ServicesService } from '../../../../../../cloud-foundry/src/features/service-catalog/services.service';
import { safeUnsubscribe } from '../../../../../../core/src/core/utils.service';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { IServiceBroker } from '../../../../cf-api-svc.types';
import { cfEntityCatalog } from '../../../../cf-entity-catalog';

@Component({
  selector: 'app-service-broker-card',
  templateUrl: './service-broker-card.component.html',
  styleUrls: ['./service-broker-card.component.scss']
})
export class ServiceBrokerCardComponent implements OnDestroy {

  spaceName: string;
  spaceLink: string[];
  serviceBroker$: Observable<APIResource<IServiceBroker>>;
  subs: Subscription[] = [];

  constructor(
    private servicesService: ServicesService
  ) {
    this.serviceBroker$ = this.servicesService.serviceBroker$;
    this.subs.push(this.serviceBroker$.pipe(
      filter(o => !!o),
      map(o => o.entity.space_guid),
      take(1),
      filter(o => !!o),
      // Broker is space scoped
      switchMap(spaceGuid => {
        return cfEntityCatalog.space.store.getEntityService(spaceGuid, this.servicesService.cfGuid).waitForEntity$
      }),
      tap(space => {
        this.spaceLink = ['/cloud-foundry',
          servicesService.cfGuid,
          'organizations',
          space.entity.entity.organization_guid,
          'spaces',
          space.entity.metadata.guid,
          'summary'
        ];
        this.spaceName = space.entity.entity.name;
      })
    ).subscribe());
  }

  ngOnDestroy() {
    safeUnsubscribe(...this.subs);
  }
}
