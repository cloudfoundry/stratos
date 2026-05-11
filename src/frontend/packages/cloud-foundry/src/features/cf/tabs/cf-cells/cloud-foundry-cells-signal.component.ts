import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, WritableSignal, inject, signal } from '@angular/core';

import { SignalListComponent, SignalListConfig, SignalListPillColor } from '@stratosui/core';

import { CfCellsSignalConfigService, CfCellRow } from '../../../../shared/components/list/list-types/cf-cells/cf-cells-signal-config.service';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';

// Signal-native CF Cells tab. Replaces the legacy ListConfig +
// CfCellsListConfigService + CfCellsDataSource + ngrx PaginationMonitor
// pipeline with a CfCellsSignalConfigService that owns its own metrics
// fetch via /pp/v1/metrics/cf/cells/query and exposes a flat row signal.
//
// Cell data is NOT a CAPI v3 resource — it comes from the metrics
// plugin (Prometheus-style scrape of Diego rep). The signal-native
// migration is therefore frontend-only; no new jetstream handler was
// introduced.
//
// Availability gating: CfCellsSignalConfigService.availability() is
// undefined while the first probe is in flight, true if either the
// new or deprecated rep-health metric returned data, false if neither
// did. We render the empty-state message only after the probe settles,
// matching the legacy hasCellMetrics$ Observable gate without the
// "blank tab during initial load" flicker.
@Component({
  selector: 'app-cloud-foundry-cells-signal',
  templateUrl: './cloud-foundry-cells-signal.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    SignalListComponent,
  ],
})
export class CloudFoundryCellsSignalComponent {
  cfEndpointService = inject(CloudFoundryEndpointService);
  cellsConfig = inject(CfCellsSignalConfigService);

  public listConfig: WritableSignal<SignalListConfig<CfCellRow> | undefined> = signal(undefined);

  constructor() {
    const cfGuid = this.cfEndpointService.cfGuid;
    this.cellsConfig.initialize(cfGuid);
    void this.cellsConfig.loadAll();

    // Diego rep emits 0 = healthy, 1 = unhealthy. Color the dot green
    // for healthy and red for everything else; an unparseable value
    // sticks with neutral grey so a misbehaving exporter doesn't read
    // as a hard failure.
    const healthLabel = (c: CfCellRow): string => (c.healthy ? 'Healthy' : (c.healthyRaw ? 'Unhealthy' : ''));
    const healthColor = (c: CfCellRow): SignalListPillColor => {
      if (c.healthy) return 'success';
      if (c.healthyRaw === '1') return 'danger';
      return 'neutral';
    };

    this.listConfig.set({
      pagedItems: this.cellsConfig.view.pagedItems,
      totalFilteredResults: this.cellsConfig.view.totalFilteredResults,
      totalPages: this.cellsConfig.view.totalPages,
      pageIndex: this.cellsConfig.pageIndex,
      pageSize: this.cellsConfig.pageSize,
      isAnyLoading: signal(false),
      errorsByCnsi: signal(new Map()),
      columns: [
        {
          header: 'ID', key: 'id', sortField: 'id',
          // Each cell row links into the cell-detail page (summary tab).
          kind: 'link',
          link: (c: CfCellRow) => ['/cloud-foundry', c.cnsiGuid, 'cells', c.id, 'summary'],
          render: (c: CfCellRow) => c.id,
          widthHint: '12rem',
        },
        {
          header: 'Name', key: 'name', sortField: 'name',
          kind: 'text',
          render: (c: CfCellRow) => c.name,
          widthHint: '20rem',
        },
        {
          header: 'Deployment', key: 'deployment', sortField: 'deployment',
          kind: 'text',
          render: (c: CfCellRow) => c.deployment,
          widthHint: '16rem',
        },
        {
          header: 'Healthy', key: 'healthy', sortField: (c: CfCellRow) => (c.healthy ? 0 : 1),
          kind: 'dot',
          pillColor: healthColor,
          render: healthLabel,
          widthHint: '8rem',
        },
      ],
      getRowKey: (c: CfCellRow) => `${c.cnsiGuid}:${c.id}`,
      emptyMessage: 'There are no cells',
      emptyFilterMessage: 'No cells match the current filter',
      loadingMessage: 'Loading cells…',
      pageSizeOptions: {
        table: [10, 25, 50, 100],
        card: [6, 12, 24, 48, 96],
      },
      nameFilter: this.cellsConfig.nameFilter,
      onRefresh: () => this.cellsConfig.refresh(),
      onClear: () => this.cellsConfig.clearFilters(),
      viewMode: this.cellsConfig.viewMode,
      sort: this.cellsConfig.sort,
    });
  }
}
