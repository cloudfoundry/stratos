import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, WritableSignal, inject, signal } from '@angular/core';

import { SignalListComponent, SignalListConfig } from '@stratosui/core';

import { CfStacksSignalConfigService } from '../../../../shared/components/list/list-types/cf-stacks/cf-stacks-signal-config.service';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';
import type { StStack } from '../../../../services/endpoint-data/stratos-types';

// Signal-native CF Stacks tab. Read-only list of rootfs flavors the
// foundation has registered (e.g. cflinuxfs4). Replaces the legacy
// ListConfig + CfStacksDataSource path with a CfStacksSignalConfigService
// that owns its own per-CNSI fetch via /pp/v1/cf/stacks/{cnsi}.
@Component({
  selector: 'app-cloud-foundry-stacks',
  templateUrl: './cloud-foundry-stacks.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    SignalListComponent,
  ],
})
export class CloudFoundryStacksComponent {
  cfEndpointService = inject(CloudFoundryEndpointService);
  private stacksConfig = inject(CfStacksSignalConfigService);

  public listConfig: WritableSignal<SignalListConfig<StStack> | undefined> = signal(undefined);

  constructor() {
    const cfGuid = this.cfEndpointService.cfGuid;
    this.stacksConfig.initialize(cfGuid);
    void this.stacksConfig.loadAll();

    this.listConfig.set({
      pagedItems: this.stacksConfig.view.pagedItems,
      totalFilteredResults: this.stacksConfig.view.totalFilteredResults,
      totalPages: this.stacksConfig.view.totalPages,
      pageIndex: this.stacksConfig.pageIndex,
      pageSize: this.stacksConfig.pageSize,
      isAnyLoading: signal(false),
      errorsByCnsi: signal(new Map()),
      columns: [
        {
          header: 'Name', key: 'name', sortField: 'name',
          kind: 'text',
          render: (s: StStack) => s.name,
          widthHint: '14rem',
        },
        {
          header: 'Description', key: 'description', sortField: 'description',
          kind: 'text',
          render: (s: StStack) => s.description ?? '',
          widthHint: '24rem',
        },
        {
          header: 'Default', key: 'default', sortField: 'default',
          kind: 'text',
          render: (s: StStack) => (s.default ? 'Yes' : ''),
          widthHint: '6rem',
        },
        {
          header: 'Created', key: 'createdAt', sortField: 'createdAt',
          render: (s: StStack) => CloudFoundryStacksComponent.formatDate(s.createdAt),
          widthHint: '12rem',
        },
        {
          header: 'Updated', key: 'updatedAt', sortField: 'updatedAt',
          render: (s: StStack) => CloudFoundryStacksComponent.formatDate(s.updatedAt),
          widthHint: '12rem',
        },
      ],
      getRowKey: (s: StStack) => `${s.cnsiGuid}:${s.guid}`,
      emptyMessage: 'There are no stacks in this Cloud Foundry',
      emptyFilterMessage: 'No stacks match the current filters',
      loadingMessage: 'Loading stacks…',
      pageSizeOptions: {
        table: [10, 25, 50, 100],
        card: [6, 12, 24, 48, 96],
      },
      nameFilter: this.stacksConfig.nameFilter,
      onRefresh: () => this.stacksConfig.refresh(),
      onClear: () => this.stacksConfig.clearFilters(),
      viewMode: this.stacksConfig.viewMode,
      sort: this.stacksConfig.sort,
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
