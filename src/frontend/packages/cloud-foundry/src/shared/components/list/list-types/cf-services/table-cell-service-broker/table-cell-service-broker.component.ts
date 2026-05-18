import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Injector, OnDestroy, OnInit, Signal, computed, effect, inject, runInInjectionContext, signal } from '@angular/core';
import { RouterModule } from '@angular/router';

import { TableCellCustom } from '@stratosui/core';
import { APIResource } from '@stratosui/store';
import { IService } from '../../../../../../cf-api-svc.types';
import { ServiceCatalogDataService, SignalSource } from '../../../../../../services/endpoint-data/service-catalog-data.service';
import { SpaceDataRegistry } from '../../../../../../services/endpoint-data/space-data.registry';
import { SpaceDataService } from '../../../../../../services/endpoint-data/space-data.service';
import { StServiceBroker } from '../../../../../../services/endpoint-data/stratos-types';

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
  TableCellCustom<APIResource<IService>,
  TableCellServiceBrokerComponentConfig> implements OnInit, OnDestroy {

  private serviceCatalog = inject(ServiceCatalogDataService);
  private spaceRegistry = inject(SpaceDataRegistry);
  private injector = inject(Injector);

  private readonly _brokerSource = signal<SignalSource<StServiceBroker | null> | null>(null);
  private _spaceData: SpaceDataService | null = null;
  private _spaceKey: { cnsi: string, guid: string } | null = null;

  readonly broker: Signal<StServiceBroker | null> = computed(
    () => this._brokerSource()?.value() ?? null,
  );

  readonly spaceLink: Signal<SpaceLink | null> = computed(() => {
    const space = this._spaceData?.space();
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

  set row(row: APIResource<IService>) {
    super.row = row;
    if (!row) {
      this._brokerSource.set(null);
      return;
    }
    this._brokerSource.set(
      this.serviceCatalog.serviceBroker(row.entity.cfGuid, row.entity.service_broker_guid),
    );
  }
  get row(): APIResource<IService> {
    return super.row;
  }

  ngOnInit(): void {
    runInInjectionContext(this.injector, () => {
      effect(() => {
        const broker = this.broker();
        const targetGuid = broker?.space?.guid ?? null;
        const targetKey = targetGuid && broker
          ? { cnsi: broker.cnsiGuid, guid: targetGuid }
          : null;
        const curr = this._spaceKey;
        if (curr?.cnsi === targetKey?.cnsi && curr?.guid === targetKey?.guid) return;
        if (curr) {
          this.spaceRegistry.release(curr.cnsi, curr.guid);
          this._spaceData = null;
          this._spaceKey = null;
        }
        if (targetKey) {
          this._spaceData = this.spaceRegistry.acquire(targetKey.cnsi, targetKey.guid);
          this._spaceData.load().subscribe();
          this._spaceKey = targetKey;
        }
      });
    });
  }

  ngOnDestroy(): void {
    if (this._spaceKey) {
      this.spaceRegistry.release(this._spaceKey.cnsi, this._spaceKey.guid);
      this._spaceData = null;
      this._spaceKey = null;
    }
  }
}
