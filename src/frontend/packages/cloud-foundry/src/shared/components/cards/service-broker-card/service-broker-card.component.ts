import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Injector, OnInit, Signal, computed, effect, inject, input, runInInjectionContext, signal, untracked } from '@angular/core';
import { RouterModule } from '@angular/router';

import {
  BooleanIndicatorComponent,
  ClickStopPropagationDirective,
  MetaCardComponent,
  MetaCardItemComponent,
  MetaCardKeyComponent,
  MetaCardTitleComponent,
  MetaCardValueComponent,
  UrlPartsPipe,
} from '@stratosui/core';
import { ServiceCatalogDataService, SignalSource } from '../../../../services/endpoint-data/service-catalog-data.service';
import { SpaceDataRegistry } from '../../../../services/endpoint-data/space-data.registry';
import { SpaceDataService } from '../../../../services/endpoint-data/space-data.service';
import { StServiceBroker } from '../../../../services/endpoint-data/stratos-types';
import { TristateValueComponent } from '../../tristate-value/tristate-value.component';

interface BrokerSpaceLink {
  name: string;
  link: string[];
}

/**
 * ServiceBrokerCardComponent — service-offering Summary tab broker card.
 *
 * Signal-native: inputs are the CNSI guid and the offering's broker guid
 * (read from the StServiceOffering on the parent Summary component). The
 * broker resource is fetched through ServiceCatalogDataService.serviceBroker
 * (V3-native, returns SignalSource); the optional space lookup goes through
 * SpaceDataRegistry — same per-(cnsi, spaceGuid) caching every other space
 * detail consumer uses.
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
    UrlPartsPipe,
  ],
})
export class ServiceBrokerCardComponent implements OnInit {
  private serviceCatalog = inject(ServiceCatalogDataService);
  private spaceRegistry = inject(SpaceDataRegistry);
  private injector = inject(Injector);

  readonly cfGuid = input('', { transform: (value: string | null | undefined) => value ?? '' });
  readonly brokerGuid = input('', { transform: (value: string | null | undefined) => value ?? '' });

  private readonly _brokerSource = signal<SignalSource<StServiceBroker | null> | null>(null);

  // Acquired SpaceDataService (or null when no broker.space.guid yet),
  // shared per (cnsi, spaceGuid) through the registry. A signal so
  // `spaceLink` re-evaluates when the effect swaps it in.
  private readonly _spaceData = signal<SpaceDataService | null>(null);

  readonly broker: Signal<StServiceBroker | null> = computed(
    () => this._brokerSource()?.value() ?? null,
  );

  // Compared by value so a broker re-fetch with the same space does not
  // re-run the acquire effect.
  private readonly _spaceKey = computed(() => {
    const guid = this.broker()?.space?.guid;
    const cnsi = this.cfGuid();
    return guid && cnsi ? { cnsi, guid } : null;
  }, { equal: (a, b) => a?.cnsi === b?.cnsi && a?.guid === b?.guid });

  readonly spaceLink: Signal<BrokerSpaceLink | null> = computed(() => {
    const cfGuid = this.cfGuid();
    const space = this._spaceData()?.space();
    if (!space || !cfGuid) return null;
    return {
      name: space.name,
      link: ['/cloud-foundry', cfGuid, 'organizations', space.orgGuid, 'spaces', space.guid, 'summary'],
    };
  });

  constructor() {
    // Fetch the broker whenever either guid changes. An effect, not a
    // computed: the fetch creates and writes signals.
    effect(() => {
      const cfGuid = this.cfGuid();
      const brokerGuid = this.brokerGuid();
      untracked(() => this._brokerSource.set(
        cfGuid && brokerGuid ? this.serviceCatalog.serviceBroker(cfGuid, brokerGuid) : null,
      ));
    });
  }

  ngOnInit(): void {
    // Acquire SpaceDataService when broker.space.guid changes. The
    // cleanup ends the load when the space swaps and when the card is
    // destroyed.
    runInInjectionContext(this.injector, () => {
      effect(onCleanup => {
        const key = this._spaceKey();
        if (!key) {
          this._spaceData.set(null);
          return;
        }
        // load() reads the service's own signals; untracked so the space
        // landing does not re-run this effect and end the load.
        untracked(() => {
          const spaceData = this.spaceRegistry.acquire(key.cnsi, key.guid);
          const load = spaceData.load().subscribe();
          onCleanup(() => load.unsubscribe());
          this._spaceData.set(spaceData);
        });
      });
    });
  }
}
