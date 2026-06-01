import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, Signal, WritableSignal, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterModule } from '@angular/router';

import {
  ConfirmationDialogConfig,
  ConfirmationDialogService,
  ListSubNavAddAction,
  ListSubNavComponent,
  SignalListComponent,
  SignalListConfig,
  SignalListRowAction,
  TailwindSnackBarService,
} from '@stratosui/core';
import { CurrentUserPermissionsService } from '../../../../../../core/src/core/permissions/current-user-permissions.service';

import { CfSpaceQuotasSignalConfigService } from '../../../../shared/signal-list-configs/cf-space-quotas/cf-space-quotas-signal-config.service';
import { CfCurrentUserPermissions } from '../../../../user-permissions/cf-user-permissions-checkers';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';
import type { StSpaceQuota } from '../../../../services/endpoint-data/stratos-types';
import { extractHttpErrorMessage } from '../../../../services/extract-error-message';

// Signal-native CF Space Quotas tab (rendered inside the org page —
// /cloud-foundry/:cnsi/organizations/:org/space-quota-definitions).
// Read-only list of space-level quota definitions. Replaces the legacy
// ListConfig + CfSpaceQuotasListConfigService path with a
// CfSpaceQuotasSignalConfigService. The Create button still routes to
// the legacy add-space-quota wizard; that flow is a future write-side
// concern.
//
// The backend handler returns space quotas across the foundation; we
// rely on the UI-level filter (the user is on a single org page) to
// constrain — future enhancement could add a server-side
// `?organization_guids=<guid>` query param if needed.
@Component({
  selector: 'app-cloud-foundry-organization-space-quotas',
  templateUrl: './cloud-foundry-organization-space-quotas.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    ListSubNavComponent,
    SignalListComponent,
  ],
})
export class CloudFoundryOrganizationSpaceQuotasComponent {
  cfEndpointService = inject(CloudFoundryEndpointService);
  activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);
  private quotasConfig = inject(CfSpaceQuotasSignalConfigService);
  private confirmDialog = inject(ConfirmationDialogService);
  private snackBar = inject(TailwindSnackBarService);

  public listConfig: WritableSignal<SignalListConfig<StSpaceQuota> | undefined> = signal(undefined);

  /** Total space-quota count for the L5 sub-nav. Assigned in the
   *  constructor once quotasConfig.initialize() has populated `view`. */
  public totalSpaceQuotas!: Signal<number>;

  /** Reactive permission flag for the L5 button. Mirrors the legacy
   *  `(canAddQuota$ | async)` template gate. */
  public canAddSpaceQuota!: Signal<boolean>;

  /** Reactive permission flags for per-row Edit / Delete kebab entries.
   *  Both check ORG_MANAGER scope on the org the quota belongs to. */
  private canEditSpaceQuota!: Signal<boolean>;
  private canDeleteSpaceQuota!: Signal<boolean>;

  /** L5 primary action — navigates to the legacy add-space-quota wizard. */
  public createSpaceQuotaAction!: ListSubNavAddAction;

  constructor() {
    const currentUserPermissionsService = inject(CurrentUserPermissionsService);
    const router = inject(Router);

    const { cfGuid, orgGuid } = this.activeRouteCfOrgSpace;
    this.canAddSpaceQuota = toSignal(
      currentUserPermissionsService.can(
        CfCurrentUserPermissions.SPACE_QUOTA_CREATE,
        cfGuid,
        orgGuid,
      ),
      { initialValue: false },
    );
    this.canEditSpaceQuota = toSignal(
      currentUserPermissionsService.can(
        CfCurrentUserPermissions.SPACE_QUOTA_EDIT,
        cfGuid,
        orgGuid,
      ),
      { initialValue: false },
    );
    this.canDeleteSpaceQuota = toSignal(
      currentUserPermissionsService.can(
        CfCurrentUserPermissions.SPACE_QUOTA_DELETE,
        cfGuid,
        orgGuid,
      ),
      { initialValue: false },
    );

    // Set basePredicate before initialize so the auto-filter effect picks
    // it up on first run.
    this.quotasConfig.basePredicate.set((q: StSpaceQuota) => q.organizationGuid === orgGuid);
    this.quotasConfig.initialize(cfGuid);
    void this.quotasConfig.loadAll();
    (this as { totalSpaceQuotas: Signal<number> }).totalSpaceQuotas =
      this.quotasConfig.view.totalItems;
    this.createSpaceQuotaAction = {
      label: 'Create Space Quota',
      icon: 'add',
      visible: this.canAddSpaceQuota,
      invoke: () => router.navigate([
        '/cloud-foundry', cfGuid, 'organizations', orgGuid, 'add-space-quota',
      ]),
    };

    this.listConfig.set({
      pagedItems: this.quotasConfig.view.pagedItems,
      totalFilteredResults: this.quotasConfig.view.totalFilteredResults,
      totalPages: this.quotasConfig.view.totalPages,
      pageIndex: this.quotasConfig.pageIndex,
      pageSize: this.quotasConfig.pageSize,
      isAnyLoading: this.quotasConfig.loading,
      errorsByCnsi: signal(new Map()),
      columns: [
        {
          header: 'Name', key: 'name', sortField: 'name',
          kind: 'text',
          render: (q: StSpaceQuota) => q.name,
          widthHint: '14rem',
        },
        {
          header: 'Memory', key: 'totalMemoryInMB', sortField: 'totalMemoryInMB',
          kind: 'text',
          render: (q: StSpaceQuota) => CloudFoundryOrganizationSpaceQuotasComponent.formatLimit(q.totalMemoryInMB, 'MB'),
          widthHint: '8rem',
        },
        {
          header: 'Instances', key: 'totalInstances', sortField: 'totalInstances',
          kind: 'text',
          render: (q: StSpaceQuota) => CloudFoundryOrganizationSpaceQuotasComponent.formatLimit(q.totalInstances),
          widthHint: '8rem',
        },
        {
          header: 'Service Instances', key: 'totalServiceInstances', sortField: 'totalServiceInstances',
          kind: 'text',
          render: (q: StSpaceQuota) => CloudFoundryOrganizationSpaceQuotasComponent.formatLimit(q.totalServiceInstances),
          widthHint: '10rem',
        },
        {
          header: 'Routes', key: 'totalRoutes', sortField: 'totalRoutes',
          kind: 'text',
          render: (q: StSpaceQuota) => CloudFoundryOrganizationSpaceQuotasComponent.formatLimit(q.totalRoutes),
          widthHint: '8rem',
        },
        {
          header: 'Paid Services', key: 'paidServicesAllowed', sortField: 'paidServicesAllowed',
          kind: 'text',
          render: (q: StSpaceQuota) => (q.paidServicesAllowed ? 'Yes' : 'No'),
          widthHint: '6rem',
        },
        {
          header: 'Spaces', key: 'spaceCount', sortField: 'spaceCount',
          kind: 'text',
          render: (q: StSpaceQuota) => String(q.spaceCount),
          widthHint: '6rem',
        },
        {
          header: 'Created', key: 'createdAt', sortField: 'createdAt',
          render: (q: StSpaceQuota) => CloudFoundryOrganizationSpaceQuotasComponent.formatDate(q.createdAt),
          widthHint: '12rem',
        },
        {
          header: '', key: 'actions',
          kind: 'actions',
          actions: (q: StSpaceQuota) => this.buildRowActions(q, cfGuid, orgGuid, router),
          render: () => '',
          widthHint: '3rem',
        },
      ],
      getRowKey: (q: StSpaceQuota) => `${q.cnsiGuid}:${q.guid}`,
      emptyMessage: 'There are no space quotas in this organization',
      emptyFilterMessage: 'No space quotas match the current filters',
      loadingMessage: 'Loading space quotas…',
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

  // Per-row Edit + Delete kebab entries. Restored from V2-era
  // CfSpaceQuotasListConfigService.getSingleActions which the
  // signal-native migration dropped (catalog 2026-05-26 Org-scope row).
  // Edit routes to the existing edit-space-quota wizard; Delete confirms
  // then calls the signal-config wrapper which invokes the new V3 native
  // DELETE handler and refreshes the list on success. CF refuses with
  // 422 if any spaces are still assigned the quota — extractHttpErrorMessage
  // pulls the V3 errors envelope detail for the snackbar.
  private buildRowActions(
    q: StSpaceQuota,
    cfGuid: string,
    orgGuid: string,
    router: Router,
  ): readonly SignalListRowAction<StSpaceQuota>[] {
    return [
      {
        label: 'Edit', icon: 'edit',
        disabled: !this.canEditSpaceQuota(),
        invoke: () => {
          void router.navigate([
            '/cloud-foundry', cfGuid,
            'organizations', orgGuid,
            'space-quota-definitions', q.guid,
            'edit-space-quota',
          ]);
        },
      },
      {
        label: 'Delete', icon: 'delete', danger: true,
        disabled: !this.canDeleteSpaceQuota(),
        invoke: () => {
          const confirm = new ConfirmationDialogConfig(
            'Delete Space Quota',
            `Are you sure you want to delete the space quota "${q.name}"? This cannot be undone. Cloud Foundry will refuse if any spaces are still assigned to this quota.`,
            'Delete',
            true,
          );
          this.confirmDialog.open(confirm, async () => {
            try {
              await this.quotasConfig.deleteQuota(q.cnsiGuid, q.guid);
            } catch (err: unknown) {
              this.snackBar.error(`Delete failed: ${extractHttpErrorMessage(err)}`);
            }
          });
        },
      },
    ];
  }

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
