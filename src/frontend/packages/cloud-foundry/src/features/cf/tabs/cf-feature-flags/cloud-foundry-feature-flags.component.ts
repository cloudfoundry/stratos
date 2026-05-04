import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, WritableSignal, inject, signal } from '@angular/core';

import { SignalListComponent, SignalListConfig } from '@stratosui/core';

import { CfFeatureFlagsSignalConfigService } from '../../../../shared/components/list/list-types/cf-feature-flags/cf-feature-flags-signal-config.service';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';
import type { StFeatureFlag } from '../../../../services/endpoint-data/stratos-types';

// Signal-native CF Feature Flags tab. Read-only list of platform flags
// that govern user-visible affordances. Replaces the legacy ListConfig +
// CfFeatureFlagsListConfigService path with a
// CfFeatureFlagsSignalConfigService that owns its own per-CNSI fetch
// via /pp/v1/cf/feature_flags/{cnsi}.
@Component({
  selector: 'app-cloud-foundry-feature-flags',
  templateUrl: './cloud-foundry-feature-flags.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    SignalListComponent,
  ],
})
export class CloudFoundryFeatureFlagsComponent {
  cfEndpointService = inject(CloudFoundryEndpointService);
  private flagsConfig = inject(CfFeatureFlagsSignalConfigService);

  public listConfig: WritableSignal<SignalListConfig<StFeatureFlag> | undefined> = signal(undefined);

  constructor() {
    const cfGuid = this.cfEndpointService.cfGuid;
    this.flagsConfig.initialize(cfGuid);
    void this.flagsConfig.loadAll();

    this.listConfig.set({
      pagedItems: this.flagsConfig.view.pagedItems,
      totalFilteredResults: this.flagsConfig.view.totalFilteredResults,
      totalPages: this.flagsConfig.view.totalPages,
      pageIndex: this.flagsConfig.pageIndex,
      pageSize: this.flagsConfig.pageSize,
      isAnyLoading: signal(false),
      errorsByCnsi: signal(new Map()),
      columns: [
        {
          header: 'Name', key: 'name', sortField: 'name',
          kind: 'text',
          render: (f: StFeatureFlag) => f.name,
          widthHint: '20rem',
        },
        {
          header: 'Enabled', key: 'enabled', sortField: 'enabled',
          kind: 'text',
          render: (f: StFeatureFlag) => (f.enabled ? 'Yes' : 'No'),
          widthHint: '6rem',
        },
        {
          header: 'Custom Error Message', key: 'customErrorMessage', sortField: 'customErrorMessage',
          kind: 'text',
          render: (f: StFeatureFlag) => f.customErrorMessage || '—',
          widthHint: '32rem',
        },
        {
          header: 'Updated', key: 'updatedAt', sortField: 'updatedAt',
          render: (f: StFeatureFlag) => CloudFoundryFeatureFlagsComponent.formatDate(f.updatedAt),
          widthHint: '12rem',
        },
      ],
      // Feature flags have no GUID — name is the identity. Stratos still
      // keys by (cnsi, identity) for cross-endpoint disambiguation.
      getRowKey: (f: StFeatureFlag) => `${f.cnsiGuid}:${f.name}`,
      emptyMessage: 'There are no feature flags in this Cloud Foundry',
      emptyFilterMessage: 'No feature flags match the current filters',
      loadingMessage: 'Loading feature flags…',
      pageSizeOptions: {
        table: [10, 25, 50, 100],
        card: [6, 12, 24, 48, 96],
      },
      nameFilter: this.flagsConfig.nameFilter,
      onRefresh: () => this.flagsConfig.refresh(),
      onClear: () => this.flagsConfig.clearFilters(),
      viewMode: this.flagsConfig.viewMode,
      sort: this.flagsConfig.sort,
    });
  }

  static formatDate(iso: string | null | undefined): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
  }
}
