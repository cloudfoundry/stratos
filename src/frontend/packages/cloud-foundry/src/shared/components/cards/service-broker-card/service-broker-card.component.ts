import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Injector, Input, OnInit, Signal, computed, effect, inject, runInInjectionContext, signal } from '@angular/core';
import { RouterModule } from '@angular/router';

import {
  BooleanIndicatorComponent,
  ClickStopPropagationDirective,
  MetaCardComponent,
  MetaCardItemComponent,
  MetaCardKeyComponent,
  MetaCardTitleComponent,
  MetaCardValueComponent,
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
  ],
})
export class ServiceBrokerCardComponent implements OnInit {
  private serviceCatalog = inject(ServiceCatalogDataService);
  private spaceRegistry = inject(SpaceDataRegistry);
  private injector = inject(Injector);

  private readonly _cfGuid = signal('');
  private readonly _brokerGuid = signal('');
  private readonly _brokerSource = signal<SignalSource<StServiceBroker | null> | null>(null);

  // Acquired SpaceDataService (or null when no broker.space.guid yet),
  // shared per (cnsi, spaceGuid) through the registry. A signal so
  // `spaceLink` re-evaluates when the effect swaps it in.
  private readonly _spaceData = signal<SpaceDataService | null>(null);
  private _spaceKey: { cnsi: string, guid: string } | null = null;

  readonly broker: Signal<StServiceBroker | null> = computed(
    () => this._brokerSource()?.value() ?? null,
  );

  readonly spaceLink: Signal<BrokerSpaceLink | null> = computed(() => {
    const cfGuid = this._cfGuid();
    const space = this._spaceData()?.space();
    if (!space || !cfGuid) return null;
    return {
      name: space.name,
      link: ['/cloud-foundry', cfGuid, 'organizations', space.orgGuid, 'spaces', space.guid, 'summary'],
    };
  });

  @Input()
  set cfGuid(value: string) {
    this._cfGuid.set(value ?? '');
    this.refreshBroker();
  }

  @Input()
  set brokerGuid(value: string | null | undefined) {
    this._brokerGuid.set(value ?? '');
    this.refreshBroker();
  }

  private refreshBroker(): void {
    const cfGuid = this._cfGuid();
    const brokerGuid = this._brokerGuid();
    if (!cfGuid || !brokerGuid) {
      this._brokerSource.set(null);
      return;
    }
    this._brokerSource.set(this.serviceCatalog.serviceBroker(cfGuid, brokerGuid));
  }

  ngOnInit(): void {
    // Acquire SpaceDataService when broker.space.guid changes.
    // Effect re-runs on broker swap (new SignalSource) and on broker
    // value flip (HTTP landed) — same shape regardless of which triggered
    // the change.
    runInInjectionContext(this.injector, () => {
      effect(() => {
        const broker = this.broker();
        const cfGuid = this._cfGuid();
        const targetGuid = broker?.space?.guid ?? null;
        const targetKey = targetGuid && cfGuid ? { cnsi: cfGuid, guid: targetGuid } : null;
        const curr = this._spaceKey;
        if (curr?.cnsi === targetKey?.cnsi && curr?.guid === targetKey?.guid) return;
        if (curr) {
          this._spaceData.set(null);
          this._spaceKey = null;
        }
        if (targetKey) {
          const spaceData = this.spaceRegistry.acquire(targetKey.cnsi, targetKey.guid);
          spaceData.load().subscribe();
          this._spaceData.set(spaceData);
          this._spaceKey = targetKey;
        }
      });
    });
  }
}
