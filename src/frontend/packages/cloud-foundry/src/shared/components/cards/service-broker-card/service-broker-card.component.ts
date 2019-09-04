import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, map, switchMap, take, tap } from 'rxjs/operators';

import { GetSpace } from '../../../../../../cloud-foundry/src/actions/space.actions';
import { CFAppState } from '../../../../../../cloud-foundry/src/cf-app-state';
import { ServicesService } from '../../../../../../cloud-foundry/src/features/service-catalog/services.service';
import { IServiceBroker } from '../../../../../../core/src/core/cf-api-svc.types';
import { ISpace } from '../../../../../../core/src/core/cf-api.types';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { CFEntityServiceFactory } from '../../../../cf-entity-service-factory.service';
import { entityCatalogue } from '../../../../../../core/src/core/entity-catalogue/entity-catalogue.service';
import { CF_ENDPOINT_TYPE } from '../../../../../cf-types';
import { spaceEntityType } from '../../../../cf-entity-factory';

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
    private servicesService: ServicesService,
    private store: Store<CFAppState>,
    private entityServiceFactory: CFEntityServiceFactory
  ) {
    this.serviceBroker$ = this.servicesService.serviceBroker$;

    this.serviceBroker$.pipe(
      filter(o => !!o),
      map(o => o.entity.space_guid),
      take(1),
      filter(o => !!o),
      // Broker is space scoped
      switchMap(spaceGuid => {
        const spaceEntity = entityCatalogue.getEntity(CF_ENDPOINT_TYPE, spaceEntityType);
        const actionBuilder = spaceEntity.actionOrchestrator.getActionBuilder('get');
        const getSpaceAction = actionBuilder(spaceGuid, this.servicesService.cfGuid);  
        const spaceService = this.entityServiceFactory.create<APIResource<ISpace>>(
          spaceGuid,
          getSpaceAction,
          true,
        );
        return spaceService.waitForEntity$;
      }),
      tap(space => {
        this.spaceLink = ['/cloud-foundry',
          this.servicesService.cfGuid,
          'organizations',
          space.entity.entity.organization_guid,
          'spaces',
          space.entity.metadata.guid,
          'summary'
        ];
        this.spaceName = space.entity.entity.name;
      })
    ).subscribe();
  }
}
