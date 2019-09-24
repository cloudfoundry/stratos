import { Component, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { filter, map, switchMap, take, tap } from 'rxjs/operators';

import { GetSpace } from '../../../../../../store/src/actions/space.actions';
import { entityFactory, spaceSchemaKey, spaceWithOrgKey } from '../../../../../../store/src/helpers/entity-factory';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { IServiceBroker } from '../../../../core/cf-api-svc.types';
import { ISpace } from '../../../../core/cf-api.types';
import { EntityServiceFactory } from '../../../../core/entity-service-factory.service';
import { safeUnsubscribe } from '../../../../core/utils.service';
import { ServicesService } from '../../../../features/service-catalog/services.service';

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
    servicesService: ServicesService,
    entityServiceFactory: EntityServiceFactory
  ) {
    this.serviceBroker$ = servicesService.serviceBroker$;

    this.subs.push(this.serviceBroker$.pipe(
      filter(o => !!o),
      map(o => o.entity.space_guid),
      take(1),
      filter(o => !!o),
      // Broker is space scoped
      switchMap(spaceGuid =>
        entityServiceFactory.create<APIResource<ISpace>>(spaceSchemaKey,
          entityFactory(spaceWithOrgKey),
          spaceGuid,
          new GetSpace(spaceGuid, servicesService.cfGuid),
          true
        ).waitForEntity$
      ),
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
