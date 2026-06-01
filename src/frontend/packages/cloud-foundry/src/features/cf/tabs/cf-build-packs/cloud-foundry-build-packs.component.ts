import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, WritableSignal, computed, inject, signal } from '@angular/core';

import { SignalListComponent, SignalListConfig } from '@stratosui/core';

import { CfBuildpacksSignalConfigService } from '../../../../shared/signal-list-configs/cf-buildpacks/cf-buildpacks-signal-config.service';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';
import type { StBuildpack } from '../../../../services/endpoint-data/stratos-types';

// Signal-native CF Buildpacks tab. Read-only list of buildpacks the
// foundation has registered (e.g. java_buildpack, go_buildpack). Replaces
// the legacy ListConfig + CfBuildpacksDataSource path with a
// CfBuildpacksSignalConfigService that owns its own per-CNSI fetch via
// /pp/v1/cf/buildpacks/{cnsi}.
@Component({
  selector: 'app-cloud-foundry-build-packs',
  templateUrl: './cloud-foundry-build-packs.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    SignalListComponent,
  ],
})
export class CloudFoundryBuildPacksComponent {
  cfEndpointService = inject(CloudFoundryEndpointService);
  private buildpacksConfig = inject(CfBuildpacksSignalConfigService);

  public listConfig: WritableSignal<SignalListConfig<StBuildpack> | undefined> = signal(undefined);

  constructor() {
    const cfGuid = this.cfEndpointService.cfGuid;
    this.buildpacksConfig.initialize(cfGuid);
    void this.buildpacksConfig.loadAll();

    this.listConfig.set({
      pagedItems: this.buildpacksConfig.view.pagedItems,
      totalFilteredResults: this.buildpacksConfig.view.totalFilteredResults,
      totalPages: this.buildpacksConfig.view.totalPages,
      pageIndex: this.buildpacksConfig.pageIndex,
      pageSize: this.buildpacksConfig.pageSize,
      isAnyLoading: computed(() => !this.buildpacksConfig.hasLoadedOnce()),
      errorsByCnsi: signal(new Map()),
      columns: [
        {
          header: 'Position', key: 'position', sortField: 'position',
          kind: 'text',
          render: (b: StBuildpack) => String(b.position),
          widthHint: '6rem',
        },
        {
          header: 'Name', key: 'name', sortField: 'name',
          kind: 'text',
          render: (b: StBuildpack) => b.name,
          widthHint: '14rem',
        },
        {
          header: 'Stack', key: 'stack', sortField: 'stack',
          kind: 'text',
          render: (b: StBuildpack) => b.stack || '—',
          widthHint: '10rem',
        },
        {
          header: 'Filename', key: 'filename', sortField: 'filename',
          kind: 'text',
          render: (b: StBuildpack) => b.filename || '—',
          widthHint: '24rem',
        },
        {
          header: 'Enabled', key: 'enabled', sortField: 'enabled',
          kind: 'text',
          render: (b: StBuildpack) => (b.enabled ? 'Yes' : 'No'),
          widthHint: '6rem',
        },
        {
          header: 'Locked', key: 'locked', sortField: 'locked',
          kind: 'text',
          render: (b: StBuildpack) => (b.locked ? 'Yes' : 'No'),
          widthHint: '6rem',
        },
        {
          header: 'Created', key: 'createdAt', sortField: 'createdAt',
          render: (b: StBuildpack) => CloudFoundryBuildPacksComponent.formatDate(b.createdAt),
          widthHint: '12rem',
        },
        {
          header: 'Updated', key: 'updatedAt', sortField: 'updatedAt',
          render: (b: StBuildpack) => CloudFoundryBuildPacksComponent.formatDate(b.updatedAt),
          widthHint: '12rem',
        },
      ],
      getRowKey: (b: StBuildpack) => `${b.cnsiGuid}:${b.guid}`,
      emptyMessage: 'There are no buildpacks in this Cloud Foundry',
      emptyFilterMessage: 'No buildpacks match the current filters',
      loadingMessage: 'Loading buildpacks…',
      pageSizeOptions: {
        table: [10, 25, 50, 100],
        card: [6, 12, 24, 48, 96],
      },
      nameFilter: this.buildpacksConfig.nameFilter,
      onRefresh: () => this.buildpacksConfig.refresh(),
      onClear: () => this.buildpacksConfig.clearFilters(),
      viewMode: this.buildpacksConfig.viewMode,
      sort: this.buildpacksConfig.sort,
    });
  }

  static formatDate(iso: string | null | undefined): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
  }
}
