import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, Signal, WritableSignal, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterModule } from '@angular/router';
import { combineLatest, map } from 'rxjs';

import {
  ConfirmationDialogService,
  CurrentUserPermissionsService,
  ListSubNavAction,
  ListSubNavComponent,
  SignalListColumn,
  SignalListComponent,
  SignalListConfig,
  TailwindSnackBarService,
} from '@stratosui/core';

import { CfUsersSignalConfigService } from '../../../../../../../shared/signal-list-configs/user/cf-users-signal-config.service';
import { CloudFoundryEndpointService } from '../../../../../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../../../../../services/cloud-foundry-organization.service';
import { CloudFoundrySpaceService } from '../../../../../services/cloud-foundry-space.service';
import { CfCurrentUserPermissions } from '../../../../../../../user-permissions/cf-user-permissions.types';
import type { StUser, StUserSpaceRole } from '../../../../../../../services/endpoint-data/stratos-types';
import {
  bulkRemoveUsers,
  selectedHasSpaceRole,
  RemoveScope,
  BulkRemoveDeps,
} from '../../../../../../../shared/signal-list-configs/user/cf-users-bulk-remove';
import { CfUsersRolesDataService } from '../../../../../../../services/domain-data/cf-users-roles-data.service';

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
// Action bar (always-visible, "Total Users" line):
// - Manage Roles (primary): opens space-scoped manage wizard for selected users.
// - Remove from Space (destructive): bulk-removes all space role grants for
//   selected users within this space; gated on canManageRoles +
//   selectedHasSpaceRole(selected, spaceGuid).
// Per-row kebab retired; both operations are now selection-driven.
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
  private readonly perms = inject(CurrentUserPermissionsService);
  private readonly rolesData = inject(CfUsersRolesDataService);
  private readonly confirmDialog = inject(ConfirmationDialogService);
  private readonly snackBar = inject(TailwindSnackBarService);

  public listConfig: WritableSignal<SignalListConfig<StUser> | undefined> = signal(undefined);

  // Bulk-selection state for the checkbox column. Holds the set of selected
  // row keys (`${cnsiGuid}:${guid}`, per getRowKey). The "Manage Roles"
  // subNavAction reads this, resolves keys → user GUIDs, and navigates to
  // the space-scoped manage-users wizard with ?users=g1,g2,… then clears.
  private readonly _selectedUserKeys: WritableSignal<ReadonlySet<string>> = signal(new Set<string>());
  readonly selectedUserKeys: Signal<ReadonlySet<string>> = this._selectedUserKeys.asReadonly();

  /** Reactive count for the L5 sub-nav. Wired in the constructor — the
   *  underlying `usersConfig.view` is built by initializeForSpace() and
   *  isn't available at field-initializer time. */
  readonly totalUsers!: Signal<number>;

  /** True when the current user holds space role-change rights on this
   *  endpoint. Bridged from Observable → signal via toSignal;
   *  initialValue: false keeps actions safely disabled until first emission. */
  private readonly canManageRoles: Signal<boolean> = toSignal(
    combineLatest([
      this.perms.can(CfCurrentUserPermissions.ORGANIZATION_CHANGE_ROLES, this.cfEndpointService.cfGuid),
      this.perms.can(CfCurrentUserPermissions.SPACE_CHANGE_ROLES, this.cfEndpointService.cfGuid),
    ]).pipe(map(([org, space]) => org || space)),
    { initialValue: false },
  );

  /** The concrete StUser objects for the current selection, resolved from
   *  filteredItems by row key. Used by Remove to pass actual role data to
   *  the bulk-remove orchestrator without re-fetching. */
  private readonly selectedUsers: Signal<StUser[]> = computed(() => {
    const keys = this._selectedUserKeys();
    if (keys.size === 0) return [];
    return this.usersConfig.view.filteredItems().filter(u => keys.has(`${u.cnsiGuid}:${u.guid}`));
  });

  private readonly cfGuid: string;
  private readonly orgGuid: string;
  private readonly spaceGuid: string;

  /** Action buttons surfaced in the always-visible ListSubNavComponent
   *  "Total Users" bar. Two entries:
   *  - Manage Roles (primary): selection-driven wizard navigation.
   *  - Remove from Space (destructive): bulk role removal scoped to this
   *    space (passes spaceGuid to selectedHasSpaceRole + buildRemoveChanges). */
  protected readonly subNavActions: readonly ListSubNavAction[] = [
    {
      label: 'Manage Roles',
      variant: 'primary',
      icon: 'group',
      dataTest: 'cf-space-users-bulk-manage-roles',
      disabled: computed(() => this._selectedUserKeys().size === 0 || !this.canManageRoles()),
      disabledReason: 'Select one or more users to manage roles',
      invoke: () => this.bulkManageRoles(
        this._selectedUserKeys(),
        ['/cloud-foundry', this.cfGuid, 'organizations', this.orgGuid, 'spaces', this.spaceGuid, 'users', 'manage'],
      ),
    },
    {
      label: 'Remove from Space',
      variant: 'destructive',
      icon: 'remove_circle',
      dataTest: 'cf-space-users-bulk-remove-space',
      disabled: computed(() => !this.canManageRoles() || !selectedHasSpaceRole(this.selectedUsers(), this.spaceGuid)),
      disabledReason: 'Select one or more users with roles in this space to remove',
      invoke: () => {
        const n = this.selectedUsers().length;
        this.bulkRemove(
          `Remove ${n} selected ${n === 1 ? 'user' : 'users'} from this space? This cannot be undone.`,
        );
      },
    },
  ];

  /** Reactive selection count for the sub-nav "N selected · Clear" indicator. */
  protected readonly selectedCount: Signal<number> = computed(() => this._selectedUserKeys().size);

  /** Clears the user selection — bound to the sub-nav Clear button. */
  protected readonly clearSelection = (): void => { this._selectedUserKeys.set(new Set<string>()); };

  constructor() {
    const cfGuid = this.cfEndpointService.cfGuid;
    const orgGuid = this.cfOrgService.orgGuid;
    const spaceGuid = this.cfSpaceService.spaceGuid;
    this.cfGuid = cfGuid;
    this.orgGuid = orgGuid;
    this.spaceGuid = spaceGuid;
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
        selectedKeys: this._selectedUserKeys,
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
    const current = this._selectedUserKeys();
    const allSelected = allKeys.length > 0 && allKeys.every(k => current.has(k));
    this._selectedUserKeys.set(allSelected ? new Set<string>() : new Set(allKeys));
  }

  // Bulk Manage Roles: resolve selected row keys (`${cnsiGuid}:${guid}`) to
  // user GUIDs and navigate to the space-scoped manage-users wizard with
  // ?users=g1,g2,… (the wizard parses the list itself — no ngrx dispatch).
  private bulkManageRoles(keys: ReadonlySet<string>, manageUrl: readonly string[]): void {
    const guids = Array.from(keys).map(k => k.split(':')[1]).filter(Boolean);
    if (guids.length === 0) return;
    void this.router.navigate([...manageUrl], { queryParams: { users: guids.join(',') } });
    this._selectedUserKeys.set(new Set<string>());
  }

  private removeDeps(): BulkRemoveDeps {
    return {
      rolesData: this.rolesData,
      userPerms: this.perms,
      confirmDialog: this.confirmDialog,
      snackBar: this.snackBar,
      cfGuid: this.cfGuid,
    };
  }

  private async bulkRemove(message: string): Promise<void> {
    await bulkRemoveUsers(this.removeDeps(), {
      users: this.selectedUsers(),
      opts: {
        scope: 'spaces' as RemoveScope,
        spaceGuid: this.spaceGuid,
        orgNameByGuid: this.usersConfig.orgNameByGuid(),
        spaceNameByGuid: this.usersConfig.spaceNameByGuid(),
      },
      title: 'Remove from Space',
      message,
      onComplete: () => this._selectedUserKeys.set(new Set<string>()),
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
