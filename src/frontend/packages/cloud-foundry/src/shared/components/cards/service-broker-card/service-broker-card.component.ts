import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Observable, Subscription } from 'rxjs';
import { filter, map, switchMap, take, tap } from 'rxjs/operators';

import { ServicesService } from '../../../../../../cloud-foundry/src/features/service-catalog/services.service';
import { safeUnsubscribe } from '../../../../../../core/src/core/utils.service';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { IServiceBroker } from '../../../../cf-api-svc.types';
import { cfEntityCatalog } from '../../../../cf-entity-catalog';
import { MetaCardComponent } from '../../../../../../core/src/shared/components/list/list-cards/meta-card/meta-card-base/meta-card.component';
import { MetaCardItemComponent } from '../../../../../../core/src/shared/components/list/list-cards/meta-card/meta-card-item/meta-card-item.component';
import { MetaCardKeyComponent } from '../../../../../../core/src/shared/components/list/list-cards/meta-card/meta-card-key/meta-card-key.component';
import { MetaCardValueComponent } from '../../../../../../core/src/shared/components/list/list-cards/meta-card/meta-card-value/meta-card-value.component';
import { MetaCardTitleComponent } from '../../../../../../core/src/shared/components/list/list-cards/meta-card/meta-card-title/meta-card-title.component';
import { BooleanIndicatorComponent } from '../../../../../../core/src/shared/components/boolean-indicator/boolean-indicator.component';
import { ClickStopPropagationDirective } from '../../../../../../core/src/shared/directives/click-stop-propagation.directive';

@Component({
  selector: 'app-service-broker-card',
  templateUrl: './service-broker-card.component.html',
  styleUrls: ['./service-broker-card.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
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

  spaceName: string;
  spaceLink: string[];
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
