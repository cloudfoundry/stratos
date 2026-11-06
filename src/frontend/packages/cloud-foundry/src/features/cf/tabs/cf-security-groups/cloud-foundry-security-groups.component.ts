import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, WritableSignal, computed, inject, signal } from '@angular/core';

import { SignalListComponent, SignalListConfig, SignalListRowAction, TailwindDialogService } from '@stratosui/core';

import { CfSecurityGroupsSignalConfigService } from '../../../../shared/signal-list-configs/cf-security-groups/cf-security-groups-signal-config.service';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';
import type { StSecurityGroup } from '../../../../services/endpoint-data/stratos-types';
import {
  BindSecurityGroupSpacesDialogComponent,
  BindSecurityGroupSpacesDialogData,
} from './bind-security-group-spaces-dialog.component';

// Signal-native CF Security Groups tab. Read-only list of egress rule
// bundles registered on the foundation. Replaces the legacy ListConfig +
// CfSecurityGroupsDataSource path with a CfSecurityGroupsSignalConfigService
// that owns its own per-CNSI fetch via /pp/v1/cf/security_groups/{cnsi}.
@Component({
  selector: 'app-cloud-foundry-security-groups',
  templateUrl: './cloud-foundry-security-groups.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    SignalListComponent,
  ],
})
export class CloudFoundrySecurityGroupsComponent {
  cfEndpointService = inject(CloudFoundryEndpointService);
  private securityGroupsConfig = inject(CfSecurityGroupsSignalConfigService);
  private dialog = inject(TailwindDialogService);

  public listConfig: WritableSignal<SignalListConfig<StSecurityGroup> | undefined> = signal(undefined);

  constructor() {
    const cfGuid = this.cfEndpointService.cfGuid;
    this.securityGroupsConfig.initialize(cfGuid);
    void this.securityGroupsConfig.loadAll();

    this.listConfig.set({
      pagedItems: this.securityGroupsConfig.view.pagedItems,
      totalFilteredResults: this.securityGroupsConfig.view.totalFilteredResults,
      totalPages: this.securityGroupsConfig.view.totalPages,
      pageIndex: this.securityGroupsConfig.pageIndex,
      pageSize: this.securityGroupsConfig.pageSize,
      isAnyLoading: computed(() => !this.securityGroupsConfig.hasLoadedOnce()),
      errorsByCnsi: signal(new Map()),
      columns: [
        {
          header: 'Name', key: 'name', sortField: 'name',
          kind: 'text',
          render: (g: StSecurityGroup) => g.name,
          widthHint: '18rem',
        },
        {
          header: 'Rules', key: 'ruleCount', sortField: 'ruleCount',
          kind: 'text',
          render: (g: StSecurityGroup) => String(g.ruleCount),
          widthHint: '6rem',
        },
        {
          header: 'Global Running', key: 'globallyEnabledRunning', sortField: 'globallyEnabledRunning',
          kind: 'text',
          render: (g: StSecurityGroup) => (g.globallyEnabledRunning ? 'Yes' : ''),
          widthHint: '8rem',
        },
        {
          header: 'Global Staging', key: 'globallyEnabledStaging', sortField: 'globallyEnabledStaging',
          kind: 'text',
          render: (g: StSecurityGroup) => (g.globallyEnabledStaging ? 'Yes' : ''),
          widthHint: '8rem',
        },
        {
          header: 'Running Spaces', key: 'runningSpaceCount', sortField: 'runningSpaceCount',
          kind: 'text',
          render: (g: StSecurityGroup) => String(g.runningSpaceCount),
          widthHint: '8rem',
        },
        {
          header: 'Staging Spaces', key: 'stagingSpaceCount', sortField: 'stagingSpaceCount',
          kind: 'text',
          render: (g: StSecurityGroup) => String(g.stagingSpaceCount),
          widthHint: '8rem',
        },
        {
          header: 'Created', key: 'createdAt', sortField: 'createdAt',
          render: (g: StSecurityGroup) => CloudFoundrySecurityGroupsComponent.formatDate(g.createdAt),
          widthHint: '12rem',
        },
        {
          header: 'Updated', key: 'updatedAt', sortField: 'updatedAt',
          render: (g: StSecurityGroup) => CloudFoundrySecurityGroupsComponent.formatDate(g.updatedAt),
          widthHint: '12rem',
        },
        {
          header: '', key: 'actions',
          kind: 'actions',
          actions: this.buildSecurityGroupActions,
          render: () => '',
          widthHint: '3rem',
        },
      ],
      getRowKey: (g: StSecurityGroup) => `${g.cnsiGuid}:${g.guid}`,
      emptyMessage: 'There are no security groups in this Cloud Foundry',
      emptyFilterMessage: 'No security groups match the current filters',
      loadingMessage: 'Loading security groups…',
      pageSizeOptions: {
        table: [10, 25, 50, 100],
        card: [6, 12, 24, 48, 96],
      },
      nameFilter: this.securityGroupsConfig.nameFilter,
      onRefresh: () => this.securityGroupsConfig.refresh(),
      onClear: () => this.securityGroupsConfig.clearFilters(),
      viewMode: this.securityGroupsConfig.viewMode,
      sort: this.securityGroupsConfig.sort,
    });
  }

  // Per-row "Bind to spaces" action — the security-group bulk-bind entry
  // point. There is no per-group detail surface yet, so this list row action
  // is the minimal home for the affordance; it opens the multi-select spaces
  // dialog (running/staging chosen inside) which POSTs the bind.
  private buildSecurityGroupActions = (sg: StSecurityGroup): readonly SignalListRowAction<StSecurityGroup>[] => [
    {
      label: 'Bind to spaces', icon: 'link',
      dataTest: 'bind-security-group-spaces',
      invoke: () => this.openBindToSpaces(sg),
    },
  ];

  private openBindToSpaces(sg: StSecurityGroup): void {
    this.dialog.open<BindSecurityGroupSpacesDialogComponent, BindSecurityGroupSpacesDialogData, boolean>(
      BindSecurityGroupSpacesDialogComponent,
      {
        ariaLabelledBy: 'bind-security-group-spaces-dialog-title',
        data: {
          cfGuid: this.cfEndpointService.cfGuid,
          sgGuid: sg.guid,
          sgName: sg.name,
        },
        width: '520px',
      },
    );
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
