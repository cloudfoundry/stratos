import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnInit, Signal, computed, inject, signal } from '@angular/core';

import { AppChipsComponent, AppChip } from '../../../../../../../../core/src/shared/components/chips/chips.component';
import { TableCellCustom } from '../../../../../../../../core/src/shared/components/list/list.types';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { IServiceInstance } from '../../../../../../cf-api-svc.types';
import {
  ServiceCatalogDataService,
  SignalSource,
} from '../../../../../../services/endpoint-data/service-catalog-data.service';
import { StServiceCredentialBinding } from '../../../../../../services/endpoint-data/stratos-types';

@Component({
  selector: 'app-table-cell-service-instance-apps-attached',
  templateUrl: './table-cell-service-instance-apps-attached.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    AppChipsComponent
  ]
})
export class TableCellServiceInstanceAppsAttachedComponent
  extends TableCellCustom<APIResource<IServiceInstance>>
  implements OnInit {

  private serviceCatalog = inject(ServiceCatalogDataService);

  private readonly _bindingsSource = signal<SignalSource<StServiceCredentialBinding[]> | null>(null);
  // Breadcrumb config arrives via @Input config; cached so the computed
  // chips signal can read it without re-subscribing.
  private readonly _config = signal<{ breadcrumbs?: string } | null>(null);

  readonly boundApps: Signal<AppChip[]> = computed(() => {
    const bindings = this._bindingsSource()?.value() ?? [];
    const breadcrumbs = this._config()?.breadcrumbs;
    const cfGuid = this.row?.entity?.cfGuid;
    if (!cfGuid) return [];
    return bindings
      .filter(b => !!b.app)
      .map(b => ({
        value: b.app!.name ?? '',
        url: {
          link: `/applications/${cfGuid}/${b.app!.guid}`,
          params: { breadcrumbs },
        },
      }));
  });

  @Input()
  set config(config: { breadcrumbs?: string } | null) {
    super.config = config;
    this._config.set(config);
  }

  @Input()
  set row(row: APIResource<IServiceInstance>) {
    super.row = row;
    if (!row) {
      this._bindingsSource.set(null);
      return;
    }
    this._bindingsSource.set(
      this.serviceCatalog.serviceBindingsForInstance(row.entity.cfGuid, row.metadata.guid),
    );
  }
  get row(): APIResource<IServiceInstance> {
    return super.row;
  }

  ngOnInit() {
    // Setters fire before ngOnInit, so no work needed here today; reserved
    // for any cross-input wiring future requirements add.
  }
}
