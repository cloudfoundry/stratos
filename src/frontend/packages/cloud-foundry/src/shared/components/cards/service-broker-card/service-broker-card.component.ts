import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterModule } from '@angular/router';

import { Observable, of } from 'rxjs';
import { distinctUntilChanged, filter, map, switchMap } from 'rxjs/operators';

import {
  MetaCardComponent,
  MetaCardItemComponent,
  MetaCardKeyComponent,
  MetaCardValueComponent,
  MetaCardTitleComponent,
  BooleanIndicatorComponent,
  ClickStopPropagationDirective,
} from '@stratosui/core';
import { ServicesService } from '../../../../features/service-catalog/services.service';
import { cfEntityCatalog } from '../../../../cf-entity-catalog';
import { ServiceCatalogDataService } from '../../../../services/endpoint-data/service-catalog-data.service';
import { StServiceBroker } from '../../../../services/endpoint-data/stratos-types';
import { TristateValueComponent } from '../../tristate-value/tristate-value.component';

interface BrokerSpaceLink {
  name: string;
  link: string[];
}

@Component({
  selector: 'app-service-broker-card',
  templateUrl: './service-broker-card.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    MetaCardComponent,
    MetaCardTitleComponent,
    MetaCardItemComponent,
    MetaCardKeyComponent,
    MetaCardValueComponent,
    BooleanIndicatorComponent,
    ClickStopPropagationDirective,
    TristateValueComponent,
  ],
})
export class ServiceBrokerCardComponent {
  private servicesService = inject(ServicesService);
  private serviceCatalog = inject(ServiceCatalogDataService);

  broker$: Observable<StServiceBroker | null>;
  spaceLink$: Observable<BrokerSpaceLink | null>;

  constructor() {
    const cfGuid = this.servicesService.cfGuid;

    this.broker$ = this.servicesService.service$.pipe(
      map(service => service.entity.service_broker_guid),
      filter((brokerGuid): brokerGuid is string => !!brokerGuid),
      distinctUntilChanged(),
      switchMap(brokerGuid => this.serviceCatalog.serviceBroker(cfGuid, brokerGuid)),
    );

    // Space lookup remains on the legacy ngrx surface — matches the
    // already-shipped table-cell-service-broker pattern; will move when the
    // space-detail migration lands.
    this.spaceLink$ = this.broker$.pipe(
      switchMap<StServiceBroker | null, Observable<BrokerSpaceLink | null>>(broker => {
        if (!broker || !broker.space?.guid) {
          return of(null);
        }
        return cfEntityCatalog.space.store.getEntityService(broker.space.guid, cfGuid).waitForEntity$.pipe(
          filter(e => !!e && !!e.entity && !!e.entity.entity && !!e.entity.metadata),
          map(e => ({
            name: e.entity.entity.name,
            link: [
              '/cloud-foundry',
              cfGuid,
              'organizations',
              e.entity.entity.organization_guid,
              'spaces',
              e.entity.metadata.guid,
              'summary',
            ],
          })),
        );
      }),
    );
  }
}
