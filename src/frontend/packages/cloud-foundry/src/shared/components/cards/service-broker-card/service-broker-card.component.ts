import { Component, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { filter, map, switchMap, take, tap } from 'rxjs/operators';

import { CFAppState } from '../../../../../../cloud-foundry/src/cf-app-state';
import { ServicesService } from '../../../../../../cloud-foundry/src/features/service-catalog/services.service';
import { IServiceBroker } from '../../../../../../core/src/core/cf-api-svc.types';
import { ISpace } from '../../../../../../core/src/core/cf-api.types';
import { entityCatalog } from '../../../../../../store/src/entity-catalog/entity-catalog.service';
import { EntityServiceFactory } from '../../../../../../store/src/entity-service-factory.service';
import { safeUnsubscribe } from '../../../../../../core/src/core/utils.service';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { CF_ENDPOINT_TYPE } from '../../../../cf-types';
import { spaceEntityType } from '../../../../cf-entity-types';

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
    private servicesService: ServicesService,
    private store: Store<CFAppState>,
    private entityServiceFactory: EntityServiceFactory
  ) {
    this.serviceBroker$ = this.servicesService.serviceBroker$;
    this.subs.push(this.serviceBroker$.pipe(
      filter(o => !!o),
      map(o => o.entity.space_guid),
      take(1),
      filter(o => !!o),
      // Broker is space scoped
      switchMap(spaceGuid => {
        const spaceEntity = entityCatalog.getEntity(CF_ENDPOINT_TYPE, spaceEntityType);
        const actionBuilder = spaceEntity.actionOrchestrator.getActionBuilder('get');
        const getSpaceAction = actionBuilder(spaceGuid, this.servicesService.cfGuid);
        const spaceService = this.entityServiceFactory.create<APIResource<ISpace>>(
          spaceGuid,
          getSpaceAction
        );
        return spaceService.waitForEntity$;
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
