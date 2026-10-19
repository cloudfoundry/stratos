import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Injector, OnInit, Signal, computed, effect, inject, runInInjectionContext, signal, untracked } from '@angular/core';
import { RouterModule } from '@angular/router';

import { TableCellCustom } from '@stratosui/core';
import { ServiceCatalogDataService, SignalSource } from '../../../../../services/endpoint-data/service-catalog-data.service';
import { SpaceDataRegistry } from '../../../../../services/endpoint-data/space-data.registry';
import { SpaceDataService } from '../../../../../services/endpoint-data/space-data.service';
import { StServiceBroker, StServiceOffering } from '../../../../../services/endpoint-data/stratos-types';

export enum TableCellServiceBrokerComponentMode {
  NAME = 'NAME',
  SCOPE = 'SCOPE'
}

export interface TableCellServiceBrokerComponentConfig {
  mode: TableCellServiceBrokerComponentMode;
  altScope?: boolean;
}

interface SpaceLink {
  name: string;
  link: string[];
}

@Component({
  selector: 'app-table-cell-service-broker',
  templateUrl: './table-cell-service-broker.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule
  ]
})
export class TableCellServiceBrokerComponent extends
  TableCellCustom<StServiceOffering,
  TableCellServiceBrokerComponentConfig> implements OnInit {

  private serviceCatalog = inject(ServiceCatalogDataService);
  private spaceRegistry = inject(SpaceDataRegistry);
  private injector = inject(Injector);

  private readonly _brokerSource = signal<SignalSource<StServiceBroker | null> | null>(null);
  // A signal so `spaceLink` re-evaluates when the effect swaps it in.
  private readonly _spaceData = signal<SpaceDataService | null>(null);

  readonly broker: Signal<StServiceBroker | null> = computed(
    () => this._brokerSource()?.value() ?? null,
  );

  // Compared by value so a broker re-fetch with the same space does not
  // re-run the acquire effect.
  private readonly _spaceKey = computed(() => {
    const broker = this.broker();
    const guid = broker?.space?.guid;
    return guid && broker ? { cnsi: broker.cnsiGuid, guid } : null;
  }, { equal: (a, b) => a?.cnsi === b?.cnsi && a?.guid === b?.guid });

  readonly spaceLink: Signal<SpaceLink | null> = computed(() => {
    const space = this._spaceData()?.space();
    const broker = this.broker();
    if (!space || !broker) return null;
    return {
      name: space.name,
      link: [
        '/cloud-foundry',
        broker.cnsiGuid,
        'organizations',
        space.orgGuid,
        'spaces',
        space.guid,
        'summary',
      ],
    };
  });

  set row(row: StServiceOffering) {
    super.row = row;
    if (!row || !row.broker?.guid) {
      this._brokerSource.set(null);
      return;
    }
    this._brokerSource.set(
      this.serviceCatalog.serviceBroker(row.cnsiGuid, row.broker.guid),
    );
  }
  get row(): StServiceOffering {
    return super.row;
  }

  ngOnInit(): void {
    // The cleanup ends the space load when the space swaps and when the
    // cell is destroyed.
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
