import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { RouterModule } from '@angular/router';

import { Observable, of } from 'rxjs';
import { distinctUntilChanged, filter, map, switchMap } from 'rxjs/operators';

import {
  BooleanIndicatorComponent,
  ClickStopPropagationDirective,
  MetaCardComponent,
  MetaCardItemComponent,
  MetaCardKeyComponent,
  MetaCardTitleComponent,
  MetaCardValueComponent,
} from '@stratosui/core';
import { cfEntityCatalog } from '../../../../cf-entity-catalog';
import { ServiceCatalogDataService } from '../../../../services/endpoint-data/service-catalog-data.service';
import { StServiceBroker } from '../../../../services/endpoint-data/stratos-types';
import { TristateValueComponent } from '../../tristate-value/tristate-value.component';

interface BrokerSpaceLink {
  name: string;
  link: string[];
}

/**
 * ServiceBrokerCardComponent — service-offering Summary tab broker card.
 *
 * Signal-native rewrite (Stage 9b-2): inputs are the CNSI guid and the
 * offering's broker guid (read from the StServiceOffering on the parent
 * Summary component). The broker resource itself is fetched through
 * ServiceCatalogDataService.serviceBroker — same V3-native handler that
 * Stage 9b-1's instances tab uses, so the rendered shape (incl. the
 * tristate-aware authUsername) is consistent across the page.
 *
 * Space lookup remains on the legacy ngrx surface — same compromise as
 * the table-cell-service-broker variant; will move when the space-detail
 * migration lands.
 */
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
  private serviceCatalog = inject(ServiceCatalogDataService);

  private _cfGuid = '';
  private _brokerGuid = '';

  broker$: Observable<StServiceBroker | null> = of(null);
  spaceLink$: Observable<BrokerSpaceLink | null> = of(null);

  @Input()
  set cfGuid(value: string) {
    this._cfGuid = value ?? '';
    this.refreshStreams();
  }

  @Input()
  set brokerGuid(value: string | null | undefined) {
    this._brokerGuid = value ?? '';
    this.refreshStreams();
  }

  private refreshStreams(): void {
    if (!this._cfGuid || !this._brokerGuid) {
      this.broker$ = of(null);
      this.spaceLink$ = of(null);
      return;
    }
    const cfGuid = this._cfGuid;
    const brokerGuid = this._brokerGuid;

    this.broker$ = of(brokerGuid).pipe(
      filter((g): g is string => !!g),
      distinctUntilChanged(),
      switchMap(g => this.serviceCatalog.serviceBroker(cfGuid, g)),
    );

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
