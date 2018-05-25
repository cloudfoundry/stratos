import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../store/app-state';
import { Observable } from 'rxjs/Observable';
import { APIResource } from '../../../../store/types/api.types';
import { IServiceBroker } from '../../../../core/cf-api-svc.types';
import { filter, map, switchMap } from 'rxjs/operators';
import { ServicesService } from '../../../../features/service-catalog/services.service';
import { EntityServiceFactory } from '../../../../core/entity-service-factory.service';
import { ISpace } from '../../../../core/cf-api.types';
import { spaceSchemaKey, entityFactory, spaceWithOrgKey, domainSchemaKey } from '../../../../store/helpers/entity-factory';
import { createEntityRelationKey } from '../../../../store/helpers/entity-relations.types';
import { GetSpace } from '../../../../store/actions/space.actions';

@Component({
  selector: 'app-service-broker-card',
  templateUrl: './service-broker-card.component.html',
  styleUrls: ['./service-broker-card.component.scss']
})
export class ServiceBrokerCardComponent {

  spaceLink$: Observable<string[]>;
  serviceBroker$: Observable<APIResource<IServiceBroker>>;
  constructor(
    private servicesService: ServicesService,
    private store: Store<AppState>,
    private entityServiceFactory: EntityServiceFactory
  ) {
    this.serviceBroker$ = this.servicesService.serviceBroker$;
    this.spaceLink$ = this.serviceBroker$.pipe(
      switchMap(broker => {
        const spaceGuid = broker.entity.space_guid;
        const spaceService = this.entityServiceFactory.create<APIResource<ISpace>>(spaceSchemaKey,
          entityFactory(spaceWithOrgKey),
          spaceGuid,
          new GetSpace(spaceGuid, this.servicesService.cfGuid),
          true
        );
        return spaceService.waitForEntity$;
      }),
      map(space => {
        return ['/cloud-foundry',
          this.servicesService.cfGuid,
          'organizations',
          space.entity.entity.organization_guid,
          'spaces',
          space.entity.metadata.guid,
          'summary'
        ];
      })
    );
  }
}
