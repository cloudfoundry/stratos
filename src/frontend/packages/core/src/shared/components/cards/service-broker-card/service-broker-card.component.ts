import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { filter, first, map, switchMap, take } from 'rxjs/operators';

import { GetSpace } from '../../../../../../store/src/actions/space.actions';
import { entityFactory, spaceSchemaKey, spaceWithOrgKey } from '../../../../../../store/src/helpers/entity-factory';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { IServiceBroker } from '../../../../core/cf-api-svc.types';
import { ISpace } from '../../../../core/cf-api.types';
import { EntityServiceFactory } from '../../../../core/entity-service-factory.service';
import { ServicesService } from '../../../../features/service-catalog/services.service';

@Component({
  selector: 'app-service-broker-card',
  templateUrl: './service-broker-card.component.html',
  styleUrls: ['./service-broker-card.component.scss']
})
export class ServiceBrokerCardComponent {

  spaceName: string;
  spaceLink: string[];
  serviceBroker$: Observable<APIResource<IServiceBroker>>;
  constructor(
    servicesService: ServicesService,
    entityServiceFactory: EntityServiceFactory
  ) {
    this.serviceBroker$ = servicesService.serviceBroker$;

    this.serviceBroker$.pipe(
      filter(o => !!o),
      map(o => o.entity.space_guid),
      take(1),
      filter(o => !!o),
      // Broker is space scoped
      switchMap(spaceGuid => {
        const spaceService = entityServiceFactory.create<APIResource<ISpace>>(spaceSchemaKey,
          entityFactory(spaceWithOrgKey),
          spaceGuid,
          new GetSpace(spaceGuid, servicesService.cfGuid),
          true
        );
        return spaceService.waitForEntity$;
      }),
      first()
    ).subscribe(space => {
      this.spaceLink = ['/cloud-foundry',
        servicesService.cfGuid,
        'organizations',
        space.entity.entity.organization_guid,
        'spaces',
        space.entity.metadata.guid,
        'summary'
      ];
      this.spaceName = space.entity.entity.name;
    });
  }
}
