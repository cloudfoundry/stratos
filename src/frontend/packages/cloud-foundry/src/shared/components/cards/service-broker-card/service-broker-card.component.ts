import { CommonModule } from '@angular/common';
import { Component, OnDestroy , ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';

import { Observable, Subscription } from 'rxjs';
import { filter, map, switchMap, take, tap } from 'rxjs/operators';

import {
  safeUnsubscribe,
  MetaCardComponent,
  MetaCardItemComponent,
  MetaCardKeyComponent,
  MetaCardValueComponent,
  MetaCardTitleComponent,
  BooleanIndicatorComponent,
  ClickStopPropagationDirective
} from '@stratosui/core';
import { APIResource } from '@stratosui/store';
import { ServicesService } from '../../../../features/service-catalog/services.service';
import { IServiceBroker } from '../../../../cf-api-svc.types';
import { cfEntityCatalog } from '../../../../cf-entity-catalog';

@Component({
  selector: 'app-service-broker-card',
  templateUrl: './service-broker-card.component.html',
  styleUrls: ['./service-broker-card.component.scss'],
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
    ClickStopPropagationDirective
  ]
})
export class ServiceBrokerCardComponent implements OnDestroy {

  spaceName!: string;
  spaceLink!: string[];
  serviceBroker$: Observable<APIResource<IServiceBroker>>;
  subs: Subscription[] = [];

  constructor(
    private servicesService: ServicesService
  ) {
    this.serviceBroker$ = this.servicesService.serviceBroker$;
    this.subs.push(this.serviceBroker$.pipe(
      filter(o => !!o && !!o.entity),
      map(o => o.entity.space_guid),
      take(1),
      filter(o => !!o),
      // Broker is space scoped
      switchMap(spaceGuid => {
        return cfEntityCatalog.space.store.getEntityService(spaceGuid, this.servicesService.cfGuid).waitForEntity$;
      }),
      filter(space => !!space && !!space.entity && !!space.entity.entity && !!space.entity.metadata),
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
