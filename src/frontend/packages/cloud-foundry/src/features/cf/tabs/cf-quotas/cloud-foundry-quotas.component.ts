import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, Signal, WritableSignal, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterModule } from '@angular/router';

import {
  ListSubNavAddAction,
  ListSubNavComponent,
  SignalListComponent,
  SignalListConfig,
} from '@stratosui/core';
import { CurrentUserPermissionsService } from '../../../../../../core/src/core/permissions/current-user-permissions.service';

import { CfOrgQuotasSignalConfigService } from '../../../../shared/components/list/list-types/cf-quotas/cf-org-quotas-signal-config.service';
import { CfCurrentUserPermissions } from '../../../../user-permissions/cf-user-permissions-checkers';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';
import type { StOrgQuota } from '../../../../services/endpoint-data/stratos-types';

// Signal-native CF Org Quotas tab. Read-only list of org-level quota
// definitions on the foundation. Replaces the legacy ListConfig +
// CfQuotasListConfigService path with a CfOrgQuotasSignalConfigService
// that owns its own per-CNSI fetch via /pp/v1/cf/organization_quotas.
// The Create button still routes to the legacy add-quota wizard; that
// flow is a future write-side concern.
@Component({
  selector: 'app-cloud-foundry-quotas',
  templateUrl: './cloud-foundry-quotas.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    ListSubNavComponent,
    SignalListComponent,
  ],
})
export class CloudFoundryQuotasComponent {
  cfEndpointService = inject(CloudFoundryEndpointService);
  private quotasConfig = inject(CfOrgQuotasSignalConfigService);

  public listConfig: WritableSignal<SignalListConfig<StOrgQuota> | undefined> = signal(undefined);

  /** Total quota count for the L5 sub-nav. Assigned in the constructor
   *  once quotasConfig.initialize() has populated `view`. */
  public totalQuotas!: Signal<number>;

  /** Reactive permission flag for the L5 button. Mirrors the legacy
   *  `(canAddQuota$ | async)` template gate. */
  public canAddQuota!: Signal<boolean>;

  /** L5 primary action — navigates to the legacy add-quota wizard. */
  public createQuotaAction!: ListSubNavAddAction;

  constructor() {
    const currentUserPermissionsService = inject(CurrentUserPermissionsService);
    const router = inject(Router);
    const cfGuid = this.cfEndpointService.cfGuid;

    this.canAddQuota = toSignal(
      currentUserPermissionsService.can(CfCurrentUserPermissions.QUOTA_CREATE, cfGuid),
      { initialValue: false },
    );

    this.quotasConfig.initialize(cfGuid);
    void this.quotasConfig.loadAll();
    (this as { totalQuotas: Signal<number> }).totalQuotas =
      this.quotasConfig.view.totalFilteredResults;
    this.createQuotaAction = {
      label: 'Create Organization Quota',
      icon: 'add',
      visible: this.canAddQuota,
      invoke: () => router.navigate(['/cloud-foundry', cfGuid, 'add-quota']),
    };

    this.listConfig.set({
      pagedItems: this.quotasConfig.view.pagedItems,
      totalFilteredResults: this.quotasConfig.view.totalFilteredResults,
      totalPages: this.quotasConfig.view.totalPages,
      pageIndex: this.quotasConfig.pageIndex,
      pageSize: this.quotasConfig.pageSize,
      isAnyLoading: computed(() => !this.quotasConfig.hasLoadedOnce()),
      errorsByCnsi: signal(new Map()),
      columns: [
        {
          header: 'Name', key: 'name', sortField: 'name',
          kind: 'text',
          render: (q: StOrgQuota) => q.name,
          widthHint: '14rem',
        },
        {
          header: 'Memory', key: 'totalMemoryInMB', sortField: 'totalMemoryInMB',
          kind: 'text',
          render: (q: StOrgQuota) => CloudFoundryQuotasComponent.formatLimit(q.totalMemoryInMB, 'MB'),
          widthHint: '8rem',
        },
        {
          header: 'Instances', key: 'totalInstances', sortField: 'totalInstances',
          kind: 'text',
          render: (q: StOrgQuota) => CloudFoundryQuotasComponent.formatLimit(q.totalInstances),
          widthHint: '8rem',
        },
        {
          header: 'Service Instances', key: 'totalServiceInstances', sortField: 'totalServiceInstances',
          kind: 'text',
          render: (q: StOrgQuota) => CloudFoundryQuotasComponent.formatLimit(q.totalServiceInstances),
          widthHint: '10rem',
        },
        {
          header: 'Routes', key: 'totalRoutes', sortField: 'totalRoutes',
          kind: 'text',
          render: (q: StOrgQuota) => CloudFoundryQuotasComponent.formatLimit(q.totalRoutes),
          widthHint: '8rem',
        },
        {
          header: 'Domains', key: 'totalDomains', sortField: 'totalDomains',
          kind: 'text',
          render: (q: StOrgQuota) => CloudFoundryQuotasComponent.formatLimit(q.totalDomains),
          widthHint: '8rem',
        },
        {
          header: 'Paid Services', key: 'paidServicesAllowed', sortField: 'paidServicesAllowed',
          kind: 'text',
          render: (q: StOrgQuota) => (q.paidServicesAllowed ? 'Yes' : 'No'),
          widthHint: '6rem',
        },
        {
          header: 'Orgs', key: 'organizationCount', sortField: 'organizationCount',
          kind: 'text',
          render: (q: StOrgQuota) => String(q.organizationCount),
          widthHint: '6rem',
        },
        {
          header: 'Created', key: 'createdAt', sortField: 'createdAt',
          render: (q: StOrgQuota) => CloudFoundryQuotasComponent.formatDate(q.createdAt),
          widthHint: '12rem',
        },
      ],
      getRowKey: (q: StOrgQuota) => `${q.cnsiGuid}:${q.guid}`,
      emptyMessage: 'There are no organization quotas in this Cloud Foundry',
      emptyFilterMessage: 'No organization quotas match the current filters',
      loadingMessage: 'Loading organization quotas…',
      pageSizeOptions: {
        table: [10, 25, 50, 100],
        card: [6, 12, 24, 48, 96],
      },
      nameFilter: this.quotasConfig.nameFilter,
      onRefresh: () => this.quotasConfig.refresh(),
      onClear: () => this.quotasConfig.clearFilters(),
      viewMode: this.quotasConfig.viewMode,
      sort: this.quotasConfig.sort,
    });
  }

  // -1 on the wire signals "Unlimited" (the backend coerces null v3
  // limits to -1 for a flat int wire shape).
  static formatLimit(value: number, unit?: string): string {
    if (value === -1) return 'Unlimited';
    return unit ? `${value.toLocaleString()} ${unit}` : value.toLocaleString();
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
