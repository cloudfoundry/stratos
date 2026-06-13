import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, Signal, WritableSignal, computed, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import {
  ListSubNavComponent,
  SignalListBulkAction,
  SignalListColumn,
  SignalListComponent,
  SignalListConfig,
  SignalListRowAction,
} from '@stratosui/core';

import { CfUsersSignalConfigService } from '../../../../../../../shared/signal-list-configs/user/cf-users-signal-config.service';
import { CloudFoundryEndpointService } from '../../../../../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../../../../../services/cloud-foundry-organization.service';
import { CloudFoundrySpaceService } from '../../../../../services/cloud-foundry-space.service';
import type { StUser, StUserSpaceRole } from '../../../../../../../services/endpoint-data/stratos-types';

// Signal-native replacement for the legacy CloudFoundrySpaceUsersComponent.
// Scoped to one space under one org under one CF endpoint. Reuses the
// CF-level page's CfUsersSignalConfigService via initializeForSpace, which
// pins the lockedSpaceGuid so the user list narrows to users with at least
// one role in the target space.
//
// Columns trim the CF-level shape:
// - No Org Roles column (the page is space-scoped — every visible user
//   already holds a role in this org by definition).
// - Space Roles column shows only THIS space's roles (filtered from the
//   full spaceRoles[] bucket).
// - Username, Origin, Created retained.
//
// Manage Roles + Remove User flows stay on the legacy stepper paths
// (/users/manage, /users/remove) — same scope contract as the CF-level
// page commit. The legacy page-sub-nav "Manage Roles" button is dropped
// here for parity with the CF-level signal-native page; future work can
// reintroduce it as a SignalListConfig.headerActions binding.
@Component({
  selector: 'app-cloud-foundry-space-users',
  templateUrl: './cloud-foundry-space-users.component.html',
  host: { class: 'app-host-fill' },
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    ListSubNavComponent,
    SignalListComponent,
  ],
})
export class CloudFoundrySpaceUsersComponent {
  cfEndpointService = inject(CloudFoundryEndpointService);
  cfOrgService = inject(CloudFoundryOrganizationService);
  cfSpaceService = inject(CloudFoundrySpaceService);
  private usersConfig = inject(CfUsersSignalConfigService);
  private router = inject(Router);

  public listConfig: WritableSignal<SignalListConfig<StUser> | undefined> = signal(undefined);

  // Bulk-selection state for the checkbox column. Holds the set of selected
  // row keys (`${cnsiGuid}:${guid}`, per getRowKey). The "Manage Roles" bulk
  // action resolves keys → user GUIDs and navigates to the space-scoped
  // manage-users wizard with ?users=g1,g2,… then clears the set.
  private readonly selectedUserKeys: WritableSignal<ReadonlySet<string>> = signal(new Set<string>());

  /** Reactive count for the L5 sub-nav. Wired in the constructor — the
   *  underlying `usersConfig.view` is built by initializeForSpace() and
   *  isn't available at field-initializer time. */
  readonly totalUsers!: Signal<number>;

  constructor() {
    const cfGuid = this.cfEndpointService.cfGuid;
    const orgGuid = this.cfOrgService.orgGuid;
    const spaceGuid = this.cfSpaceService.spaceGuid;
    this.usersConfig.initializeForSpace(cfGuid, spaceGuid);
    (this as { totalUsers: Signal<number> }).totalUsers = this.usersConfig.view.totalItems;

    const renderUsername = (u: StUser): string =>
      u.username && u.username.length > 0 ? u.username : (u.presentationName ?? u.guid);

    const renderOrigin = (u: StUser): string =>
      u.origin && u.origin.length > 0 ? u.origin : '—';

    // Filter the user's spaceRoles[] down to grants in THIS space, then
    // join the (already prefix-stripped) role names. Page is scoped, so
    // there's only ever one matching bucket per row in practice — but the
    // .filter handles the edge case of duplicate role grants gracefully.
    const renderSpaceRoles = (u: StUser): string => {
      const roles = (u.spaceRoles ?? [])
        .filter((sr: StUserSpaceRole) => sr.spaceGuid === spaceGuid)
        .flatMap(sr => sr.roles ?? []);
      return roles.length === 0 ? '—' : roles.join(', ');
    };

    const renderCreated = (u: StUser): string =>
      CloudFoundrySpaceUsersComponent.formatDate(u.createdAt);

    // The L5 sub-nav row above this list shows "Total Users: N" with no
    // add affordance — Manage Roles and Invite User stay on the legacy
    // stepper paths (/users/manage, /users/invite). When those flows
    // migrate signal-native, wire an `addAction` onto the L5 row in the
    // template instead of reintroducing in-toolbar buttons.

    this.listConfig.set({
      pagedItems: this.usersConfig.view.pagedItems,
      totalFilteredResults: this.usersConfig.view.totalFilteredResults,
      totalPages: this.usersConfig.view.totalPages,
      pageIndex: this.usersConfig.pageIndex,
      pageSize: this.usersConfig.pageSize,
      isAnyLoading: computed(() => !this.usersConfig.hasLoadedOnce()),
      errorsByCnsi: signal(new Map()),
      columns: [
        this.buildSelectColumn(),
        {
          header: 'Username', key: 'username', sortField: 'username',
          kind: 'text',
          render: renderUsername,
          widthHint: '16rem',
        },
        {
          header: 'Origin', key: 'origin', sortField: renderOrigin,
          kind: 'text',
          render: renderOrigin,
          widthHint: '8rem',
        },
        {
          header: 'Space Roles', key: 'spaceRoles', sortField: renderSpaceRoles,
          kind: 'text',
          render: renderSpaceRoles,
          widthHint: '18rem',
        },
        {
          header: 'Created', key: 'createdAt', sortField: 'createdAt',
          render: renderCreated,
          widthHint: '12rem',
        },
        {
          header: '', key: 'actions',
          kind: 'actions',
          actions: (u: StUser) => this.buildRowActions(u, cfGuid, orgGuid, spaceGuid),
          render: () => '',
          widthHint: '3rem',
        },
      ],
      getRowKey: (u: StUser) => `${u.cnsiGuid}:${u.guid}`,
      emptyMessage: 'There are no users in this space',
      emptyFilterMessage: 'No users match the current filters',
      loadingMessage: 'Loading users…',
      pageSizeOptions: {
        table: [10, 25, 50, 100],
        card: [6, 12, 24, 48, 96],
      },
      nameFilter: this.usersConfig.nameFilter,
      onRefresh: () => this.usersConfig.refresh(),
      onClear: () => this.usersConfig.clearFilters(),
      viewMode: this.usersConfig.viewMode,
      sort: this.usersConfig.sort,
      bulkActions: [
        {
          label: 'Manage Roles', icon: 'group',
          dataTest: 'cf-space-users-bulk-manage-roles',
          run: (keys) => this.bulkManageRoles(
            keys,
            ['/cloud-foundry', cfGuid, 'organizations', orgGuid, 'spaces', spaceGuid, 'users', 'manage'],
          ),
        },
      ] as SignalListBulkAction<StUser>[],
    });

    this.usersConfig.registerSortExtractor('origin', renderOrigin);
    this.usersConfig.registerSortExtractor('spaceRoles', renderSpaceRoles);
  }

  // Leading checkbox column for bulk selection. selectAll selects every
  // FILTERED row (across pages, not just the current page) when not all are
  // already selected, else clears.
  private buildSelectColumn(): SignalListColumn<StUser> {
    return {
      header: '', key: 'select', kind: 'checkbox',
      render: () => '',
      widthHint: '3rem',
      checkbox: {
        selectedKeys: this.selectedUserKeys,
        selectAll: {
          selectableCount: () => this.usersConfig.view.totalFilteredResults(),
          onToggle: () => this.toggleSelectAllFiltered(),
        },
      },
    };
  }

  private toggleSelectAllFiltered(): void {
    const filtered = this.usersConfig.view.filteredItems();
    const allKeys = filtered.map(u => `${u.cnsiGuid}:${u.guid}`);
    const current = this.selectedUserKeys();
    const allSelected = allKeys.length > 0 && allKeys.every(k => current.has(k));
    this.selectedUserKeys.set(allSelected ? new Set<string>() : new Set(allKeys));
  }

  // Bulk Manage Roles: resolve selected row keys (`${cnsiGuid}:${guid}`) to
  // user GUIDs and navigate to the space-scoped manage-users wizard with
  // ?users=g1,g2,… (the wizard parses the list itself — no ngrx dispatch).
  private bulkManageRoles(keys: ReadonlySet<string>, manageUrl: readonly string[]): void {
    const guids = Array.from(keys).map(k => k.split(':')[1]).filter(Boolean);
    if (guids.length === 0) return;
    void this.router.navigate([...manageUrl], { queryParams: { users: guids.join(',') } });
    this.selectedUserKeys.set(new Set<string>());
  }

  // Per-row Manage Roles + Remove (2 variants). Mirrors the CF / Org
  // Users tab pattern but with a space-scoped wizard URL. ?user= still
  // forwards the user GUID and ?spaces=true scopes the remove-flow to
  // space-only role grants.
  private buildRowActions(
    u: StUser,
    cfGuid: string,
    orgGuid: string,
    spaceGuid: string,
  ): readonly SignalListRowAction<StUser>[] {
    const base = ['/cloud-foundry', cfGuid, 'organizations', orgGuid, 'spaces', spaceGuid, 'users'];
    return [
      {
        label: 'Manage Roles', icon: 'group',
        invoke: () => {
          void this.router.navigate([...base, 'manage'], { queryParams: { user: u.guid } });
        },
      },
      {
        label: 'Remove from Spaces', icon: 'remove_circle_outline',
        invoke: () => {
          void this.router.navigate([...base, 'remove'], { queryParams: { user: u.guid, spaces: 'true' } });
        },
      },
      {
        label: 'Remove from Org and Spaces', icon: 'remove_circle', danger: true,
        invoke: () => {
          void this.router.navigate([...base, 'remove'], { queryParams: { user: u.guid } });
        },
      },
    ];
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
